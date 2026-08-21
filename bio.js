const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let sheetRows = [];
let activeMenu = null;
let activeSpan = null;
let currentStage = 'read'; // 'read' | 'hover' | 'collist'

const arrowSVG = `<svg viewBox="0 0 110 60" width="15vw" height="7.5vw" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible;">
    <line x1="0" y1="30" x2="95" y2="30" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
    <polyline points="75,10 95,30 75,50" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function parseCSV(text) {
    const rows = [];
    let row = [], cell = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') { inQ = !inQ; }
        else if (c === ',' && !inQ) { row.push(cell.trim()); cell = ''; }
        else if ((c === '\n' || c === '\r') && !inQ) {
            if (cell !== '' || row.length) { row.push(cell.trim()); rows.push(row); }
            row = []; cell = '';
        } else { cell += c; }
    }
    if (row.length) { row.push(cell.trim()); rows.push(row); }
    return rows;
}

function getColValues(colIdx) {
    const vals = [];
    sheetRows.slice(1).forEach(row => {
        const cell = (row[colIdx] || '').trim();
        cell.split(/\r?\n/).forEach(v => {
            const val = v.trim();
            if (val) vals.push(val);
        });
    });
    return vals;
}

function splitIntoClauses(sentence) {
    const clauses = [];
    const protected_ = [];
    const tokenized = sentence.replace(/[^\s()]+\([^)]*\)/g, match => {
        protected_.push(match);
        return `__PROTECTED_${protected_.length - 1}__`;
    });
    const commaParts = tokenized.split(/,\s*/);
    commaParts.forEach(part => {
        part = part.trim();
        if (!part) return;
        const splitPattern = /(.*?(?:하며|하고|이며|면서|지만|하여|하여서|으로서|로서|하였으며|였으며|이었으며|았으며|었으며))\s*/g;
        let lastIndex = 0;
        let match;
        while ((match = splitPattern.exec(part)) !== null) {
            const clause = match[1].trim();
            if (clause) clauses.push(clause);
            lastIndex = splitPattern.lastIndex;
        }
        const remainder = part.slice(lastIndex).trim();
        if (remainder) clauses.push(remainder);
    });
    return clauses
        .map(c => c.replace(/__PROTECTED_(\d+)__/g, (_, i) => protected_[parseInt(i)]))
        .filter(c => c.length > 0);
}

function closeMenu() {
    if (activeMenu) { activeMenu.remove(); activeMenu = null; }
    if (activeSpan) { activeSpan.style.opacity = '1'; activeSpan = null; }
}

function openMenu(span) {
    const colIdx = parseInt(span.dataset.colIdx);
    const colVals = getColValues(colIdx).filter(v => v !== span.textContent);
    if (colVals.length === 0) return;

    const bioText = document.getElementById('bio-text');
    const fontSize = parseFloat(window.getComputedStyle(bioText).fontSize);
    const redSize = fontSize * 0.42;

    const menu = document.createElement('div');
    menu.id = 'bio-menu';
    menu.style.cssText = `
        display: block;
        pointer-events: auto;
        font-size: ${redSize}px;
        font-weight: 900;
        font-family: inherit;
        width: 100%;
        white-space: normal;
        word-break: keep-all;
        overflow: hidden;
    `;

    colVals.forEach(val => {
        const item = document.createElement('span');
        item.textContent = val;
        item.style.cssText = `
            color: #C5A028;
            cursor: pointer;
            transition: opacity 0.2s ease;
            display: inline-block;
            white-space: nowrap;
            margin-right: 1.5em;
        `;
        item.addEventListener('mouseenter', () => { item.style.opacity = '0.4'; });
        item.addEventListener('mouseleave', () => { item.style.opacity = '1'; });
        item.addEventListener('click', e => {
            e.stopPropagation();
            span.textContent = val;
            closeMenu();
        });
        menu.appendChild(item);
    });

    span.insertAdjacentElement('afterend', menu);
    activeMenu = menu;
    activeSpan = span;
}

function drawGroupOutlines() {
    document.getElementById('connect-svg-lines')?.remove();
    document.getElementById('connect-svg-boxes')?.remove();
    document.getElementById('top-btn')?.remove();
    document.getElementById('a-text-panel')?.remove();

    const page = document.getElementById('bio-page');
    const bioText = document.getElementById('bio-text');
    
    // 1. 박스 외 텍스트 숨기기
    if (bioText) {
        bioText.style.position = 'relative';
        bioText.style.zIndex = '2';
        bioText.style.color = "transparent"; // 전체 투명하게
    }

    const svgStyle = `position:absolute;top:0;left:0;width:${page.scrollWidth}px;height:${page.scrollHeight}px;pointer-events:none;`;

    const svgLines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLines.id = 'connect-svg-lines';
    svgLines.style.cssText = svgStyle + 'z-index:0;';
    page.insertBefore(svgLines, page.firstChild);

    const svgBoxes = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgBoxes.id = 'connect-svg-boxes';
    svgBoxes.style.cssText = svgStyle + 'z-index:1;';
    page.insertBefore(svgBoxes, page.firstChild);

    const groups = {};
    document.querySelectorAll('.bio-keyword').forEach(span => {
        // 2. 키워드만 검정색으로 표시
        span.style.color = "#000";
        
        const rowIdxAll = span.dataset.rowIdxAll || span.dataset.rowIdx || '';
        const rows = rowIdxAll.split(',').filter(r => r.trim() !== '');
        rows.forEach(rowIdx => {
            if (!groups[rowIdx]) groups[rowIdx] = [];
            groups[rowIdx].push(span);
        });
    });

    const pad = 6;
    const r = 12;
    const pageBCR = page.getBoundingClientRect();
    const scrollTop = page.scrollTop; // window 대신 컨테이너 스크롤 사용
    const scrollLeft = page.scrollLeft;

    const drawnRectKeys = new Set();
    const spanToRow = new Map();

    Object.entries(groups).forEach(([rowIdx, spans]) => {
        if (spans.length === 0) return;
        const rects = [];
        spans.forEach(s => {
            Array.from(s.getClientRects()).forEach(rect => {
                const x = rect.left - pageBCR.left + scrollLeft - pad;
                const y = rect.top - pageBCR.top + scrollTop - pad;
                const w = rect.width + pad * 2;
                const h = rect.height + pad * 2;
                const key = `${Math.round(x)},${Math.round(y)}`;
                if (drawnRectKeys.has(key)) return;
                drawnRectKeys.add(key);
                rects.push({ x, y, w, h, span: s });
            });
            if (!spanToRow.has(s)) spanToRow.set(s, rowIdx);
        });

        if (rects.length === 0) return;
        rects.sort((a, b) => a.y - b.y || a.x - b.x);

        let boxPathD = '';
        let linePathD = '';

        rects.forEach((rect, i) => {
            const { x, y, w, h } = rect;
            // 박스 경로
            boxPathD += `M ${x+r} ${y} L ${x+w-r} ${y} Q ${x+w} ${y} ${x+w} ${y+r} `;
            boxPathD += `L ${x+w} ${y+h-r} Q ${x+w} ${y+h} ${x+w-r} ${y+h} `;
            boxPathD += `L ${x+r} ${y+h} Q ${x} ${y+h} ${x} ${y+h-r} `;
            boxPathD += `L ${x} ${y+r} Q ${x} ${y} ${x+r} ${y} Z `;
            
            // 연결선 경로
            if (i < rects.length - 1) {
                const next = rects[i + 1];
                const x1 = x + w / 2, y1 = y + h;
                const x2 = next.x + next.w / 2, y2 = next.y;
                linePathD += `M ${x1} ${y1} C ${x1} ${(y1+y2)/2} ${x2} ${(y1+y2)/2} ${x2} ${y2} `;
            }
        });

        if (linePathD) {
            const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            linePath.setAttribute('d', linePathD);
            linePath.setAttribute('fill', 'none');
            linePath.setAttribute('stroke', '#000');
            linePath.setAttribute('stroke-width', '1.5');
            linePath.dataset.row = rowIdx;
            svgLines.appendChild(linePath);
        }

        const boxPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        boxPath.setAttribute('d', boxPathD);
        boxPath.setAttribute('fill', '#ebebeb');
        boxPath.setAttribute('stroke', '#000');
        boxPath.setAttribute('stroke-width', '1.5');
        boxPath.dataset.row = rowIdx;
        svgBoxes.appendChild(boxPath);
    });

    const allLinePaths = svgLines.querySelectorAll('path');
    const allBoxPaths = svgBoxes.querySelectorAll('path');
    const allKeywords = [];

    document.querySelectorAll('.bio-keyword').forEach(kw => {
        const clone = kw.cloneNode(true);
        clone.dataset.colIdx = kw.dataset.colIdx;
        clone.dataset.rowIdx = kw.dataset.rowIdx;
        clone.dataset.rowIdxAll = kw.dataset.rowIdxAll;
        const mappedRow = spanToRow.get(kw);
        if (mappedRow) clone.dataset.mappedRow = mappedRow;
        clone.style.visibility = '';
        clone.style.pointerEvents = '';
        kw.replaceWith(clone);
        allKeywords.push(clone);
    });

    // A열 텍스트 표시 패널 (화살표 버튼 아래)
    const aTextPanel = document.createElement('div');
    aTextPanel.id = 'a-text-panel';
    aTextPanel.style.cssText = `
        position: fixed;
        top: 160px;
        right: 55px;
        width: 22vw;
        max-height: calc(100vh - 200px);
        overflow-y: auto;
        font-family: 'LatinThin', "Helvetica Neue", "Helvetica", sans-serif;
        font-size: 15px;
        font-weight: 900;
        color: #FF00FF;
        line-height: 1.6;
        word-break: keep-all;
        white-space: normal;
        pointer-events: auto;
        z-index: 10;
        opacity: 0;
        transition: opacity 0.2s ease;
    `;
    document.body.appendChild(aTextPanel);

    function showAText(rowIdx) {
        if (rowIdx === null) { aTextPanel.style.opacity = '0'; return; }
        const row = sheetRows[parseInt(rowIdx) + 1];
        if (!row) return;
        const aText = (row[0] || '').trim().replace(/-/g, '');
        if (!aText) return;
        aTextPanel.textContent = aText;
        aTextPanel.style.opacity = '1';
    }

    function hideAText() {
        aTextPanel.style.opacity = '0';
    }

    function getMappedRow(kw) {
        return kw.dataset.mappedRow || kw.dataset.rowIdx || null;
    }

    function fadeOthers(activeRow) {
        allBoxPaths.forEach(p => { p.style.opacity = p.dataset.row === activeRow ? '1' : '0.15'; });
        allLinePaths.forEach(p => { p.style.opacity = p.dataset.row === activeRow ? '1' : '0.15'; });
        allKeywords.forEach(kw => {
            const row = getMappedRow(kw);
            kw.style.opacity = row === activeRow ? '1' : '0.15';
        });
    }

    function resetAll() {
        allKeywords.forEach(kw => { kw.style.opacity = '1'; });
        allLinePaths.forEach(p => { p.style.opacity = '1'; });
        allBoxPaths.forEach(p => { p.style.opacity = '1'; });
    }

    let activeRow = null;

    allKeywords.forEach(kw => {
        kw.style.pointerEvents = 'auto';
        kw.style.cursor = 'pointer';

        kw.addEventListener('mouseenter', () => {
            if (activeRow) return;
            const activeR = getMappedRow(kw);
            if (!activeR) return;
            allBoxPaths.forEach(p => { p.style.opacity = p.dataset.row === activeR ? '1' : '0.15'; });
            allLinePaths.forEach(p => { p.style.opacity = p.dataset.row === activeR ? '1' : '0.15'; });
            allKeywords.forEach(k => {
                k.style.opacity = getMappedRow(k) === activeR ? '1' : '0.15';
            });
            showAText(activeR);
        });

        kw.addEventListener('mouseleave', () => {
            if (activeRow) return;
            resetAll();
            hideAText();
        });

        kw.addEventListener('click', e => {
            e.stopPropagation();
            const clickedRow = getMappedRow(kw);
            if (activeRow === clickedRow) {
                activeRow = null; resetAll(); hideAText();
            } else {
                activeRow = clickedRow; fadeOthers(activeRow); showAText(activeRow);
            }
        });
    });

    const topBtn = document.createElement('div');
    topBtn.id = 'top-btn';
    topBtn.innerHTML = arrowSVG;
    document.body.appendChild(topBtn);

    // 배너 pointer-events 활성화 및 드롭다운 재초기화
    const siteBannerOutline = document.getElementById('site-banner');
    if (siteBannerOutline) siteBannerOutline.style.pointerEvents = 'auto';
    currentStage = 'collist';
    initBannerDropdown();

    topBtn.addEventListener('click', () => {
        topBtn.style.display = 'none';
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        window.scrollTo(0, 0);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                enterMergeMode();
                setTimeout(() => { document.getElementById('bottom-btn')?.click(); }, 100);
            });
        });
    });

    function enterMergeMode() {
        const mergeKeywords = [];
        allKeywords.forEach(kw => {
            const clone = kw.cloneNode(true);
            clone.dataset.mappedRow = kw.dataset.mappedRow;
            clone.dataset.rowIdx = kw.dataset.rowIdx;
            clone.dataset.rowIdxAll = kw.dataset.rowIdxAll;
            kw.replaceWith(clone);
            mergeKeywords.push(clone);
        });

        mergeKeywords.forEach(kw => {
            kw.style.pointerEvents = 'auto';
            kw.style.cursor = 'pointer';
            kw.style.opacity = '1';

            kw.addEventListener('mouseenter', () => {
                const activeR = kw.dataset.mappedRow || kw.dataset.rowIdx;
                mergeKeywords.forEach(k => {
                    if ((k.dataset.mappedRow || k.dataset.rowIdx) === activeR) k.style.opacity = '0.3';
                });
                allBoxPaths.forEach(p => { if (p.dataset.row === activeR) p.style.opacity = '0.3'; });
                allLinePaths.forEach(p => { if (p.dataset.row === activeR) p.style.opacity = '0.3'; });
            });

            kw.addEventListener('mouseleave', () => {
                mergeKeywords.forEach(k => { k.style.opacity = '1'; });
                allBoxPaths.forEach(p => { p.style.opacity = '1'; });
                allLinePaths.forEach(p => { p.style.opacity = '1'; });
            });

            kw.addEventListener('click', e => {
                e.stopPropagation();
                const clickedRow = kw.dataset.mappedRow || kw.dataset.rowIdx;
                if (!clickedRow) return;
                const sameRowKws = mergeKeywords.filter(k =>
                    (k.dataset.mappedRow || k.dataset.rowIdx) === clickedRow
                );
                sameRowKws.forEach(k => { k.style.transition = 'opacity 0.4s ease'; k.style.opacity = '0'; });
                document.querySelectorAll(`#connect-svg-boxes path[data-row="${clickedRow}"]`).forEach(p => {
                    p.style.transition = 'opacity 0.4s ease'; p.style.opacity = '0';
                });
                document.querySelectorAll(`#connect-svg-lines path[data-row="${clickedRow}"]`).forEach(p => {
                    p.style.transition = 'opacity 0.4s ease'; p.style.opacity = '0';
                });
                setTimeout(() => {
                    sameRowKws.forEach(k => { k.style.visibility = 'hidden'; k.style.pointerEvents = 'none'; });
                    document.querySelectorAll(`#connect-svg-boxes path[data-row="${clickedRow}"]`).forEach(p => { p.style.display = 'none'; });
                    document.querySelectorAll(`#connect-svg-lines path[data-row="${clickedRow}"]`).forEach(p => { p.style.display = 'none'; });
                }, 400);
            });
        });

        const bottomBtn = document.createElement('div');
        bottomBtn.id = 'bottom-btn';
        bottomBtn.innerHTML = arrowSVG;
        document.body.appendChild(bottomBtn);

        bottomBtn.addEventListener('click', () => {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            window.scrollTo(0, 0);
            setTimeout(() => {
                const svgLinesEl = document.getElementById('connect-svg-lines');
                const svgBoxesEl = document.getElementById('connect-svg-boxes');
                if (svgLinesEl) { svgLinesEl.style.transition = 'opacity 0.4s ease'; svgLinesEl.style.opacity = '0'; }
                if (svgBoxesEl) { svgBoxesEl.style.transition = 'opacity 0.4s ease'; svgBoxesEl.style.opacity = '0'; }

                document.querySelectorAll('.bio-keyword').forEach(kw => {
                    kw.style.transition = 'opacity 0.4s ease';
                    kw.style.opacity = '0';
                });

                setTimeout(() => {
                    if (!document.getElementById('bio-text') && !document.getElementById('col-list')) return;
                    if (svgLinesEl) svgLinesEl.style.display = 'none';

                    document.querySelectorAll('.bio-keyword').forEach(kw => { kw.style.visibility = 'hidden'; });

                    const bioTextEl = document.getElementById('bio-text');
                    if (bioTextEl) bioTextEl.style.display = 'none';

                    const listContainer = document.createElement('div');
                    listContainer.id = 'col-list';
                    listContainer.style.cssText = `
                    position: relative;
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    align-items: flex-start;
                    flex-wrap: nowrap;
                    padding: 60px 2vw 40px 2vw;
                        box-sizing: border-box;
                        gap: 1vw;
                        opacity: 0;
                        transition: opacity 0.4s ease;
                        z-index: 3;
                        overflow-x: hidden;
                    `;

                    for (let colIdx = 1; colIdx <= 11; colIdx++) {
                        const col = document.createElement('div');
                        col.style.cssText = `
                        flex: 1 1 0;
                        min-width: 0;
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.3em;
                        ${colIdx > 1 ? 'border-left: 1px solid #C5A028;' : ''}
                        padding-left: ${colIdx > 1 ? '0.5vw' : '0'};
                    `;

                        const vals = [];
                        sheetRows.slice(1).forEach(row => {
                            const cell = (row[colIdx] || '').trim();
                            cell.split(/\r?\n/).forEach(v => {
                                const val = v.trim();
                                if (val && !vals.includes(val)) vals.push(val);
                            });
                        });

                        vals.forEach(val => {
                            const item = document.createElement('div');
                            item.textContent = val;
                            sheetRows.slice(1).forEach((row, rowIdx) => {
                                const cell = (row[colIdx] || '').trim();
                                cell.split(/\r?\n/).forEach(v => {
                                    if (v.trim() === val) { item.dataset.rowIdx = rowIdx; item.dataset.colIdx = colIdx; }
                                });
                            });
                            item.style.cssText = `
                                font-family: 'LatinThin', "Helvetica Neue", "Helvetica", sans-serif;
                                font-size: clamp(6px, 1vw, 14px);
                                font-weight: 900;
                                line-height: 1.5;
                                word-break: keep-all;
                                overflow-wrap: normal;
                                hyphens: none;
                                text-align: left;
                                display: block;
                                width: 100%;
                                overflow: hidden;
                                cursor: pointer;
                            `;
                            item.addEventListener('mouseenter', () => {
                                const hoverRow = item.dataset.rowIdx;
                                if (!hoverRow) return;
                                document.querySelectorAll('#col-list div[data-row-idx]').forEach(k => {
                                    if (k.dataset.rowIdx === hoverRow) {
                                        k.style.boxShadow = `0 0 0 1.5px #000`;
                                        k.style.borderRadius = `${Math.min(k.getBoundingClientRect().height / 2, 8)}px`;
                                    }
                                });
                            });
                            item.addEventListener('mouseleave', () => {
                                document.querySelectorAll('#col-list div[data-row-idx]').forEach(k => {
                                    k.style.boxShadow = 'none'; k.style.borderRadius = '0';
                                });
                            });
                            col.appendChild(item);
                        });

                        listContainer.appendChild(col);
                    }

                    const page = document.getElementById('bio-page');
                    page.style.paddingTop = '0';
                    page.style.paddingBottom = '0';
                    page.style.height = 'auto';
                    page.style.minHeight = '0';
                    page.style.overflow = 'visible';
                    document.body.style.overflow = '';
                    document.documentElement.style.overflow = '';

                    // 높이에 영향 주는 요소들 완전 제거
                    const bioTextEl2 = document.getElementById('bio-text');
                    if (bioTextEl2) bioTextEl2.remove();
                    document.getElementById('connect-svg-lines')?.remove();
                    document.getElementById('connect-svg-boxes')?.remove();
                    document.getElementById('circle-col')?.remove();
                    document.getElementById('text-outline-svg')?.remove();

                    page.appendChild(listContainer);

                    requestAnimationFrame(() => {
                        listContainer.style.opacity = '1';
                        bottomBtn.remove();
                        document.getElementById('bottom-btn-2')?.remove();
                        document.getElementById('bottom-btn-3')?.remove();
                        document.getElementById('top-btn')?.remove();

                        // 배너 pointer-events 활성화 및 드롭다운 재초기화
                        const siteBannerDraw = document.getElementById('site-banner');
                        if (siteBannerDraw) siteBannerDraw.style.pointerEvents = 'auto';
                        currentStage = 'collist';
                        initBannerDropdown();

                    });
                }, 400);
            }, 300);
        });
    }

    document.addEventListener('click', () => {
        if (activeRow) { activeRow = null; resetAll(); hideAText(); }
    });
}

window.addEventListener('load', async () => {
    const page = document.getElementById('bio-page');
    if (!page) return;

    const response = await fetch(SHEET_CSV_URL);
    const data = await response.text();
    sheetRows = parseCSV(data);

    const clauses = [];
    const clauseRows = [];
    sheetRows.slice(1).forEach((row, rowIdx) => {
        const aCell = (row[0] || '').trim();
        if (!aCell) return;
        aCell.split(/\r?\n/).forEach(s => {
            const cleaned = s.trim().replace(/-/g, '');
            if (!cleaned) return;
            splitIntoClauses(cleaned).forEach(c => {
                if (c) { clauses.push(c); clauseRows.push(rowIdx); }
            });
        });
    });

    for (let i = clauses.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [clauses[i], clauses[j]] = [clauses[j], clauses[i]];
        [clauseRows[i], clauseRows[j]] = [clauseRows[j], clauseRows[i]];
    }

    const valMap = {};
    sheetRows.slice(1).forEach((row, rowIdx) => {
        for (let colIdx = 1; colIdx <= 11; colIdx++) {
            const cell = (row[colIdx] || '').trim();
            if (!cell) continue;
            const vals = cell.split(/\r?\n/).map(v => v.trim()).filter(v => v);
            if (cell && !vals.includes(cell)) vals.push(cell);
            vals.forEach(val => {
                if (!val) return;
                if (!valMap[val]) valMap[val] = [];
                if (!valMap[val].find(e => e.rowIdx === rowIdx)) {
                    valMap[val].push({ colIdx, rowIdx });
                }
            });
        }
    });

    const sortedVals = Object.keys(valMap).sort((a, b) => b.length - a.length);
    const fullText = clauses.join(' ');

    function parseText(text) {
        let remaining = text;
        const parts = [];
        while (remaining.length > 0) {
            let matched = false;
            for (const val of sortedVals) {
                if (remaining.startsWith(val)) {
                    const entries = valMap[val];
                    parts.push({
                        text: val,
                        colIdx: entries[0].colIdx,
                        rowIdx: entries[0].rowIdx,
                        rowIdxAll: entries.map(e => e.rowIdx).join(','),
                    });
                    remaining = remaining.slice(val.length);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                if (parts.length > 0 && parts[parts.length - 1].colIdx === null) {
                    parts[parts.length - 1].text += remaining[0];
                } else {
                    parts.push({ text: remaining[0], colIdx: null, rowIdx: null, rowIdxAll: '' });
                }
                remaining = remaining.slice(1);
            }
        }
        return parts;
    }

    const parts = parseText(fullText);
    const p = document.createElement('p');
    p.id = 'bio-text';

    parts.forEach(part => {
        if (part.colIdx === null) {
            p.appendChild(document.createTextNode(part.text));
            return;
        }
        const span = document.createElement('span');
        span.textContent = part.text;
        span.dataset.colIdx = part.colIdx;
        span.dataset.rowIdx = part.rowIdx;
        span.dataset.rowIdxAll = part.rowIdxAll;
        span.className = 'bio-keyword';
        span.addEventListener('mouseenter', () => { if (activeSpan === span) return; span.style.opacity = '0.4'; });
        span.addEventListener('mouseleave', () => { if (activeSpan === span) return; span.style.opacity = '1'; });
        span.addEventListener('click', e => {
            e.stopPropagation();
            if (activeSpan === span) { closeMenu(); return; }
            closeMenu();
            span.style.opacity = '0.4';
            openMenu(span);
        });
        p.appendChild(span);
    });
    p.style.position = 'relative';
    p.style.zIndex = '1';
    page.appendChild(p);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            page.style.transform = 'translateY(0)';
        });
    });
    setTimeout(() => {
        page.style.transform = 'none';
        page.style.transition = '';
    }, 1300);
    function buildTextOutline() {
        document.getElementById('text-outline-svg')?.remove();
        const bioTextEl = document.getElementById('bio-text');
        if (!bioTextEl) return;

        const pageBCR = page.getBoundingClientRect();
        const pad = 10; 

        const allRects = [];
        const range = document.createRange();
        bioTextEl.childNodes.forEach(node => {
            if (node.nodeType !== Node.TEXT_NODE && node.nodeType !== Node.ELEMENT_NODE) return;
            range.selectNode(node);
            Array.from(range.getClientRects()).forEach(r => {
                if (r.width > 2 && r.height > 2) allRects.push(r);
            });
        });

        const lines = [];
        allRects.forEach(r => {
            const cy = r.top + r.height / 2;
            const existing = lines.find(l => Math.abs(l.cy - cy) < r.height * 0.5);
            if (existing) {
                existing.right = Math.max(existing.right, r.right);
                existing.top = Math.min(existing.top, r.top);
                existing.bottom = Math.max(existing.bottom, r.bottom);
                existing.cy = (existing.top + existing.bottom) / 2;
            } else {
                lines.push({ right: r.right, top: r.top, bottom: r.bottom, cy });
            }
        });
        lines.sort((a, b) => a.top - b.top);
        if (lines.length === 0) return;

        const abs = lines.map(l => ({
            x: (l.right - pageBCR.left) + pad,
            top: (l.top - pageBCR.top) + window.scrollY,
            bottom: (l.bottom - pageBCR.top) + window.scrollY,
        }));

        let pathD = `M ${abs[0].x} ${abs[0].top}`;
        abs.forEach((line, i) => {
            pathD += ` L ${line.x} ${line.bottom}`;
            if (i < abs.length - 1) {
                const next = abs[i + 1];
                pathD += ` L ${next.x} ${line.bottom}`;
                if (next.top > line.bottom + 1) {
                    pathD += ` L ${next.x} ${next.top}`;
                }
            }
        });

        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.id = 'text-outline-svg';
        svg.style.cssText = `position:absolute;top:0;left:0;width:${page.scrollWidth}px;height:${page.scrollHeight}px;pointer-events:none;z-index:2;overflow:visible;`;

        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#C5A028');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(path);
        page.appendChild(svg);
    }

    function buildCircleCol() {
        document.getElementById('circle-col')?.remove();
        const circleCol = document.createElement('div');
        circleCol.id = 'circle-col';
        circleCol.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    `;
        const circleSize = Math.min(window.innerWidth / 5, window.innerHeight / 5);
        const bioTextEl = document.getElementById('bio-text');
        const bioHeight = bioTextEl ? bioTextEl.offsetHeight : window.innerHeight * 3;

        let totalHeight = 0;
        let idx = 0;
        while (totalHeight < bioHeight) {
            const size = Math.min(circleSize * (1 + idx * 0.3), window.innerWidth);
            const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            s.setAttribute('viewBox', '0 0 100 100');
            s.setAttribute('width', size);
            s.setAttribute('height', size);
            s.style.display = 'block';
            s.style.flexShrink = '0';
            const strokeWidth = (1.5 * circleSize / size).toFixed(2);
            s.innerHTML = `<circle cx="50" cy="50" r="45" fill="none" stroke="#FF00FF" stroke-width="${strokeWidth}"/>`;
            circleCol.appendChild(s);
            totalHeight += size;
            idx++;
        }
        page.appendChild(circleCol);
    }

    buildCircleCol();

    const switchBtn = document.createElement('div');
    switchBtn.id = 'switch-btn';
    switchBtn.innerHTML = arrowSVG;
    document.body.appendChild(switchBtn);

    let triggered = false;

    switchBtn.addEventListener('click', () => {
        if (triggered) return;
        triggered = true;

        closeMenu();
        document.getElementById('circle-col')?.remove();
        document.getElementById('text-outline-svg')?.remove();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        page.style.paddingRight = '25vw';
        document.querySelectorAll('.bio-keyword').forEach(kw => {
            kw.style.color = '';
            kw.style.position = '';
            kw.style.visibility = 'visible';
            kw.style.pointerEvents = 'none';
        });
        p.style.height = '';
        p.style.overflow = '';

        switchBtn.style.display = 'none';

        setTimeout(() => {
            // 배너 pointer-events 활성화 및 드롭다운 재초기화
            const siteBannerHover = document.getElementById('site-banner');
            if (siteBannerHover) siteBannerHover.style.pointerEvents = 'auto';
            currentStage = 'hover';
            initBannerDropdown();
        }, 600);

        document.querySelectorAll('.bio-keyword').forEach(kw => { kw.style.pointerEvents = 'none'; });
        let scrollTimer = null;
        const onScroll = () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                window.removeEventListener('scroll', onScroll);
                if (!document.getElementById('bio-text')) return;
                page.style.transform = 'none';
                page.style.transition = '';
                page.style.paddingRight = '25vw';
                requestAnimationFrame(() => {
                    drawGroupOutlines();
                });
            }, 100);
        };
        window.addEventListener('scroll', onScroll);
        if (window.scrollY === 0) {
            if (!document.getElementById('bio-text')) return;
            page.style.transform = 'none';
            page.style.transition = '';
            page.style.paddingRight = '25vw';
            requestAnimationFrame(() => {
                drawGroupOutlines();
            });
        }
    });

    function getBioFontSize() {
        return Math.max(16, Math.min(30, window.innerWidth / 45));
    }

    function applyBioFontSize() {
        const bioTextEl = document.getElementById('bio-text');
        if (bioTextEl) bioTextEl.style.fontSize = getBioFontSize() + 'px';
    }

    applyBioFontSize();

    let resizeOutlineTimer = null;
    window.addEventListener('resize', () => {
        applyBioFontSize();
        if (document.getElementById('circle-col')) buildCircleCol();

        if (document.getElementById('col-list')) return;
        const svgLines = document.getElementById('connect-svg-lines');
        const svgBoxes = document.getElementById('connect-svg-boxes');
        if (!svgLines && !svgBoxes) return;
        window.scrollTo(0, 0);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                drawGroupOutlines();
            });
        });
    });



    document.addEventListener('click', e => {
        if (activeMenu && !activeMenu.contains(e.target) && e.target !== activeSpan) closeMenu();
    });

    const siteBanner = document.getElementById('site-banner');
    if (siteBanner) siteBanner.style.pointerEvents = 'auto';
    currentStage = 'read';
    initBannerDropdown();

    // 해시 진입 처리
    const _hash = window.location.hash;
    if (_hash === '#hoverandclick') {
        setTimeout(() => {
            history.replaceState(null, '', window.location.pathname);
            const sw = document.getElementById('switch-btn');
            if (sw) sw.click();
        }, 1400);
    } else if (_hash === '#collist') {
        setTimeout(() => {
            history.replaceState(null, '', window.location.pathname);
            goToColListDirect();
        }, 1400);
    }

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        if (window.history.length > 1) {
            backBtn.style.display = 'flex';
            backBtn.addEventListener('click', () => { window.history.back(); });
        } else {
            backBtn.style.display = 'none';
        }
    }
});

function scrollThenDo(fn) {
    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY < 80) {
        fn();
        return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const check = setInterval(() => {
        if ((window.scrollY || window.pageYOffset) < 10) {
            clearInterval(check);
            fn();
        }
    }, 50);
    // 최대 1초 후 강제 실행
    setTimeout(() => { clearInterval(check); fn(); }, 1000);
}

function initBannerDropdown() {
    const bannerOf = document.querySelector('#site-banner span:nth-child(2)');
    if (!bannerOf) return;

    document.getElementById('banner-dropdown')?.remove();
    // 기존 이벤트 리스너 제거를 위해 클론으로 교체
    const freshBannerOf = bannerOf.cloneNode(true);
    bannerOf.parentNode.replaceChild(freshBannerOf, bannerOf);
    const bannerOfEl = freshBannerOf;

    const pages = [
        { label: 'READ SCROLL CHANGE' },
        { label: 'HOVER AND CLICK' },
        { label: 'DESIGNER NAME JOB...' },
    ];

    const dropdown = document.createElement('div');
    dropdown.id = 'banner-dropdown';
    dropdown.style.cssText = `
        position: fixed;
        top: 36px;
        left: calc(50% + 12.5%);
        display: none;
        flex-direction: column;
        z-index: 200;
        pointer-events: auto;
    `;

    pages.forEach(pg => {
        const item = document.createElement('span');
        item.textContent = pg.label;
        item.style.cssText = `
            display: block;
            font-family: 'LatinThin', "Helvetica Neue", "Helvetica", sans-serif;
            font-size: 14px;
            font-weight: 900;
            color: #C5A028;
            cursor: pointer;
            line-height: 2;
            white-space: nowrap;
            text-decoration: none;
            letter-spacing: 0.05em;
        `;
        item.addEventListener('mouseenter', () => { item.style.textDecoration = 'underline'; });
        item.addEventListener('mouseleave', () => { item.style.textDecoration = 'none'; });
        item.addEventListener('click', () => {
            dropdown.style.display = 'none';
            bannerOfEl.style.color = '';

            scrollThenDo(() => {
                if (pg.label === 'READ SCROLL CHANGE') {
                    if (currentStage === 'read') return;
                    window.location.href = 'bio.html';

                } else if (pg.label === 'HOVER AND CLICK') {
                    if (currentStage === 'hover' || currentStage === 'collist') return;
                    if (currentStage === 'read') {
                        const sw = document.getElementById('switch-btn');
                        if (sw) sw.click();
                    } else {
                        window.location.href = 'bio.html#hoverandclick';
                    }

                } else if (pg.label === 'DESIGNER NAME JOB...') {
                    if (currentStage === 'collist') return;
                    if (currentStage === 'hover') {
                        // enterMergeMode의 bottom-btn이 있으면 클릭, 없으면 direct
                        const bb = document.getElementById('bottom-btn');
                        if (bb) bb.click();
                        else goToColListDirect();
                    } else if (currentStage === 'read') {
                        goToColListDirect();
                    } else {
                        window.location.href = 'bio.html#collist';
                    }
                }
            });
        });
        dropdown.appendChild(item);
    });

    document.body.appendChild(dropdown);

    bannerOfEl.style.cursor = 'pointer';
    bannerOfEl.style.transition = 'color 0.2s ease';
    bannerOfEl.style.pointerEvents = 'auto';

    let hideTimer = null;

    bannerOfEl.addEventListener('mouseenter', () => {
        clearTimeout(hideTimer);
        bannerOfEl.style.color = '#FF00FF';
        dropdown.style.display = 'flex';
    });
    bannerOfEl.addEventListener('mouseleave', () => {
        hideTimer = setTimeout(() => {
            bannerOfEl.style.color = '';
            dropdown.style.display = 'none';
        }, 150);
    });
    dropdown.addEventListener('mouseenter', () => {
        clearTimeout(hideTimer);
    });
    dropdown.addEventListener('mouseleave', () => {
        hideTimer = setTimeout(() => {
            bannerOfEl.style.color = '';
            dropdown.style.display = 'none';
        }, 150);
    });
}

function goToColListDirect() {
    const page = document.getElementById('bio-page');
    if (!page) return;

    document.getElementById('connect-svg-lines')?.remove();
    document.getElementById('connect-svg-boxes')?.remove();
    document.getElementById('top-btn')?.remove();
    document.getElementById('bottom-btn')?.remove();
    document.getElementById('bottom-btn-2')?.remove();
    document.getElementById('bottom-btn-3')?.remove();
    document.getElementById('typing-output')?.remove();
    document.getElementById('switch-btn')?.remove();
    document.getElementById('a-text-panel')?.remove();
    document.getElementById('bio-text')?.remove();
    document.getElementById('circle-col')?.remove();
    document.getElementById('text-outline-svg')?.remove();
    document.getElementById('col-list')?.remove();
    document.getElementById('whose-msg')?.remove();
    document.getElementById('whose-graphic')?.remove();
    document.getElementById('whose-action-panel')?.remove();

    const listContainer = document.createElement('div');
    listContainer.id = 'col-list';
    listContainer.style.cssText = `
        position: relative;
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        flex-wrap: nowrap;
        padding: 60px 25vw 40px 2vw;
        box-sizing: border-box;
        gap: 1vw;
        z-index: 3;
        overflow-x: hidden;
    `;

    for (let colIdx = 1; colIdx <= 11; colIdx++) {
        const col = document.createElement('div');
        col.style.cssText = `
            flex: 1 1 0;
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.3em;
            ${colIdx > 1 ? 'border-left: 1px solid #C5A028;' : ''}
            padding-left: ${colIdx > 1 ? '0.5vw' : '0'};
        `;

        const vals = [];
        sheetRows.slice(1).forEach(row => {
            const cell = (row[colIdx] || '').trim();
            cell.split(/\r?\n/).forEach(v => {
                const val = v.trim();
                if (val && !vals.includes(val)) vals.push(val);
            });
        });

        vals.forEach(val => {
            const item = document.createElement('div');
            item.textContent = val;
            sheetRows.slice(1).forEach((row, rowIdx) => {
                const cell = (row[colIdx] || '').trim();
                cell.split(/\r?\n/).forEach(v => {
                    if (v.trim() === val) { item.dataset.rowIdx = rowIdx; item.dataset.colIdx = colIdx; }
                });
            });
            item.style.cssText = `
                font-family: 'LatinThin', "Helvetica Neue", "Helvetica", sans-serif;
                font-size: clamp(6px, 1vw, 14px);
                font-weight: 900;
                line-height: 1.5;
                word-break: keep-all;
                overflow-wrap: normal;
                hyphens: none;
                text-align: left;
                display: block;
                width: 100%;
                overflow: hidden;
                cursor: pointer;
            `;
            item.addEventListener('mouseenter', () => {
                const hoverRow = item.dataset.rowIdx;
                if (!hoverRow) return;
                document.querySelectorAll('#col-list div[data-row-idx]').forEach(k => {
                    if (k.dataset.rowIdx === hoverRow) {
                        k.style.boxShadow = `0 0 0 1.5px #000`;
                        k.style.borderRadius = `${Math.min(k.getBoundingClientRect().height / 2, 8)}px`;
                    }
                });
            });
            item.addEventListener('mouseleave', () => {
                document.querySelectorAll('#col-list div[data-row-idx]').forEach(k => {
                    k.style.boxShadow = 'none'; k.style.borderRadius = '0';
                });
            });
            col.appendChild(item);
        });
        listContainer.appendChild(col);
    }

    page.innerHTML = '';
    page.style.paddingTop = '0';
    page.style.paddingBottom = '0';
    page.style.paddingLeft = '0';
    page.style.paddingRight = '0';
    page.style.height = 'auto';
    page.style.minHeight = '0';
    page.style.overflow = 'visible';
    page.style.transform = 'none';
    page.style.transition = '';
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, 0);

    page.appendChild(listContainer);

    // 배너 pointer-events 활성화 및 드롭다운 재초기화
    const siteBannerCol = document.getElementById('site-banner');
    if (siteBannerCol) siteBannerCol.style.pointerEvents = 'auto';
    currentStage = 'collist';
    initBannerDropdown();

}
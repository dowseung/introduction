const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let sheetRows = [];
let activeMenu = null;
let activeSpan = null;

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

function drawGroupOutlines(clickMsg) {
    document.getElementById('connect-svg-lines')?.remove();
    document.getElementById('connect-svg-boxes')?.remove();
    document.getElementById('top-btn')?.remove();

    const page = document.getElementById('bio-page');
    page.style.paddingRight = '25vw';
    const svgStyle = `position:absolute;top:0;left:0;width:${page.scrollWidth}px;height:${page.scrollHeight}px;pointer-events:none;`;

    const svgLines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLines.id = 'connect-svg-lines';
    svgLines.style.cssText = svgStyle + 'z-index:0;';
    page.insertBefore(svgLines, page.firstChild);

    const svgBoxes = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgBoxes.id = 'connect-svg-boxes';
    svgBoxes.style.cssText = svgStyle + 'z-index:1;';
    page.insertBefore(svgBoxes, page.firstChild);

    const bioText = document.getElementById('bio-text');
    if (bioText) { bioText.style.position = 'relative'; bioText.style.zIndex = '2'; }

    const groups = {};
    document.querySelectorAll('.bio-keyword').forEach(span => {
        const rowIdxAll = span.dataset.rowIdxAll || span.dataset.rowIdx || '';
        const rows = rowIdxAll.split(',').filter(r => r.trim() !== '');
        const effectiveRows = rows.length > 0 ? rows : [span.dataset.rowIdx].filter(Boolean);
        effectiveRows.forEach(rowIdx => {
            if (!groups[rowIdx]) groups[rowIdx] = [];
            groups[rowIdx].push(span);
        });
    });

    const pad = 6;
    const r = 12;
    const pageBCR = page.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    svgLines.style.width = page.scrollWidth + 'px';
    svgLines.style.height = page.scrollHeight + 'px';
    svgBoxes.style.width = page.scrollWidth + 'px';
    svgBoxes.style.height = page.scrollHeight + 'px';
    const drawnRectKeys = new Set();
    const spanToRow = new Map();

    Object.entries(groups).forEach(([rowIdx, spans]) => {
        if (spans.length === 0) return;
        const rects = [];
        spans.forEach(s => {
            Array.from(s.getClientRects()).forEach(rect => {
                const x = Math.round(rect.left - pageBCR.left + scrollX - pad);
                const y = Math.round(rect.top - pageBCR.top + scrollY - pad);
                const w = Math.round(rect.width + pad * 2);
                const h = Math.round(rect.height + pad * 2);
                const key = `${x},${y},${w},${h}`;
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
            boxPathD += `M ${x+r} ${y} L ${x+w-r} ${y} Q ${x+w} ${y} ${x+w} ${y+r} `;
            boxPathD += `L ${x+w} ${y+h-r} Q ${x+w} ${y+h} ${x+w-r} ${y+h} `;
            boxPathD += `L ${x+r} ${y+h} Q ${x} ${y+h} ${x} ${y+h-r} `;
            boxPathD += `L ${x} ${y+r} Q ${x} ${y} ${x+r} ${y} Z `;
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
            linePath.setAttribute('stroke-width', '2');
            linePath.setAttribute('stroke-linecap', 'round');
            linePath.dataset.row = rowIdx;
            svgLines.appendChild(linePath);
        }

        const boxPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        boxPath.setAttribute('d', boxPathD);
        boxPath.setAttribute('fill', '#ebebeb');
        boxPath.setAttribute('stroke', '#000');
        boxPath.setAttribute('stroke-width', '2');
        boxPath.setAttribute('stroke-linecap', 'round');
        boxPath.setAttribute('stroke-linejoin', 'round');
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
        });

        kw.addEventListener('mouseleave', () => {
            if (activeRow) return;
            resetAll();
        });

        kw.addEventListener('click', e => {
            e.stopPropagation();
            const clickedRow = getMappedRow(kw);
            if (activeRow === clickedRow) { activeRow = null; resetAll(); }
            else { activeRow = clickedRow; fadeOthers(activeRow); }
        });
    });

    const topBtn = document.createElement('div');
    topBtn.id = 'top-btn';
    topBtn.innerHTML = arrowSVG;
    document.body.appendChild(topBtn);

    topBtn.addEventListener('click', () => {
        topBtn.style.display = 'none';
        clickMsg.style.opacity = '0';
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
            let nextViewTriggered = false;
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

                if (clickMsg) {
                    const lines = ['DESIGNER','NAME','JOB','SCHOOL','MAJOR','ORGANIZATION','BOOK','EXHIBITION','TIME','PLACE','SPACE'];
                    clickMsg.innerHTML = lines.map(l =>
                        `<span class="label-line" style="display:block;font-weight:100;text-align:right;">${l}</span>`
                    ).join('');
                    clickMsg.style.fontSize = 'clamp(4px, 6.5vh, 6.5vw)';
                    clickMsg.style.lineHeight = '1.05';
                    clickMsg.style.justifyContent = 'flex-start';
                    clickMsg.style.alignItems = 'flex-end';
                    clickMsg.style.paddingTop = '60px';
                    clickMsg.style.paddingRight = '55px';
                    clickMsg.style.letterSpacing = '0';
                    clickMsg.style.overflow = 'hidden';
                    clickMsg.style.opacity = '1';
                }

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

                        const labels = ['DESIGNER','NAME','JOB','SCHOOL','MAJOR','ORGANIZATION','BOOK','EXHIBITION','TIME','PLACE','SPACE'];
                        const labelIndex = colIdx - 1;

                        col.addEventListener('mouseenter', () => {
                            clickMsg.querySelectorAll('.label-line').forEach((s, i) => {
                                s.style.color = i === labelIndex ? '#C5A028' : '#00FF00';
                            });
                        });
                        col.addEventListener('mouseleave', () => {
                            clickMsg.querySelectorAll('.label-line').forEach(s => {
                                s.style.color = '#00FF00';
                            });
                        });

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
                    page.style.height = 'auto';
                    page.style.minHeight = '0';
                    page.style.overflow = 'visible';
                    document.body.style.overflow = '';
                    document.documentElement.style.overflow = '';
                    page.appendChild(listContainer);

                    requestAnimationFrame(() => {
                        listContainer.style.opacity = '1';
                        bottomBtn.remove();
                        document.getElementById('bottom-btn-2')?.remove();
                        document.getElementById('bottom-btn-3')?.remove();
                        document.getElementById('top-btn')?.remove();

                        const bottomBtn2 = document.createElement('div');
                        bottomBtn2.id = 'bottom-btn-2';
                        bottomBtn2.innerHTML = arrowSVG;
                        document.body.appendChild(bottomBtn2);

                        bottomBtn2.addEventListener('click', () => {
                            bottomBtn2.remove();
                            document.body.style.overflow = 'hidden';
                            document.documentElement.style.overflow = 'hidden';
                            page.style.height = '100vh';
                            page.style.overflow = 'hidden';
                            window.scrollTo(0, 0);
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    document.body.style.transition = 'transform 0.8s cubic-bezier(0.76, 0, 0.24, 1)';
                                    document.body.style.transform = 'translateY(-100%)';
                                    setTimeout(() => {
                                        document.body.style.transform = 'none';
                                        document.body.style.transition = '';
                                        window.scrollTo(0, 0);
                                        showNextView();
                                    }, 800);
                                });
                            });
                        });
                    });
                }, 400);
            }, 300);
        });
    }

    document.addEventListener('click', () => {
        if (activeRow) { activeRow = null; resetAll(); }
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
    const clickMsg = document.createElement('div');
    clickMsg.id = 'click-msg';
    clickMsg.innerHTML = 'CLICK<br>THE<br>TEXT';
    document.body.appendChild(clickMsg);

    const scrollMsg = document.createElement('div');
    scrollMsg.id = 'scroll-msg';
    scrollMsg.innerHTML = `
    <div style="position:fixed;top:40px;right:3vw;display:flex;flex-direction:column;text-align:right;white-space:nowrap;">
        <span style="display:block;text-align:right;">READ</span>
        <span style="display:block;text-align:right;">SCROLL</span>
        <span style="display:block;text-align:right;">CHANGE</span>
    </div>
    `;
    const circleCol = document.createElement('div');
    circleCol.id = 'circle-col';
    circleCol.style.cssText = `
    position: absolute;
    top: 0;
    left: 55px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    pointer-events: none;
    z-index: 0;
`;

    const circleSize = Math.min(window.innerWidth / 5, window.innerHeight / 5);
    const bioTextEl = document.getElementById('bio-text');
    const bioHeight = bioTextEl ? bioTextEl.offsetHeight : window.innerHeight * 3;
    const count = Math.ceil(bioHeight / circleSize) + 2;

    let totalHeight = 0;
    let i = 0;
    while (totalHeight < bioHeight) {
        const size = circleSize * (1 + i * 0.3);
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
        i++;
    }

    page.appendChild(circleCol);

    document.body.appendChild(scrollMsg);
    setTimeout(() => { scrollMsg.style.opacity = '1'; }, 100);

    const switchBtn = document.createElement('div');
    switchBtn.id = 'switch-btn';
    switchBtn.innerHTML = arrowSVG;
    document.body.appendChild(switchBtn);

    let hidden = false;

    switchBtn.addEventListener('click', () => {
        if (!hidden) {
            hidden = true;
            closeMenu();
            clickMsg.style.opacity = '0';
            scrollMsg.style.opacity = '0';
            document.getElementById('circle-col')?.remove();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
                clickMsg.innerHTML = 'FILL<br>IN THE<br>BLANK';
                clickMsg.style.fontSize = 'clamp(8vw, 30vw, 33vh)';
                clickMsg.style.lineHeight = '0.95';
                clickMsg.style.justifyContent = 'flex-start';
                clickMsg.style.alignItems = 'flex-start';
                clickMsg.style.paddingTop = '60px';
                clickMsg.style.paddingLeft = '55px';
                clickMsg.style.opacity = '1';
                clickMsg.style.textAlign = 'left';
            }, 600);

            document.querySelectorAll('.bio-keyword').forEach(kw => {
                kw.style.pointerEvents = 'none';
                kw.style.visibility = 'visible';
            });

            p.style.height = p.offsetHeight + 'px';
            p.style.overflow = 'hidden';
            p.style.textAlign = 'left';

            document.getElementById('typing-output')?.remove();
            const typingOutput = document.createElement('div');
            typingOutput.id = 'typing-output';
            typingOutput.style.cssText = `
            position: fixed;
            top: 30px;
            right: 55px;
            width: calc(25vw - 55px);
            padding: 60px 0 60px 0;
            box-sizing: border-box;
            font-family: 'LatinThin', "Helvetica Neue", "Helvetica", sans-serif;
            font-size: 16px;
            font-weight: 900;
            color: #C5A028;
            line-height: 1.6;
            word-break: keep-all;
            white-space: normal;
            word-wrap: break-word;
            pointer-events: none;
            z-index: 2;
        `;
            document.body.appendChild(typingOutput);

            requestAnimationFrame(() => {
                p.contentEditable = 'false';
                p.style.outline = 'none';
                p.style.caretColor = '#000';

                Array.from(p.childNodes).forEach(node => {
                    if (node.nodeType !== Node.TEXT_NODE) return;
                    const wrapper = document.createElement('span');
                    wrapper.style.cssText = `position: relative; display: inline; white-space: pre-wrap;`;

                    const hiddenSpan = document.createElement('span');
                    hiddenSpan.textContent = node.textContent;
                    hiddenSpan.className = 'plain-text';
                    hiddenSpan.style.cssText = `visibility: hidden; white-space: pre-wrap;`;

                    const input = document.createElement('span');
                    input.contentEditable = 'true';
                    input.addEventListener('input', () => {
                        const allInputs = document.querySelectorAll('.fill-blank');
                        let combined = '';
                        allInputs.forEach(el => { combined += el.textContent; });
                        typingOutput.textContent = combined;
                    });
                    input.className = 'fill-blank';
                    input.style.cssText = `
                        position: absolute; top: 0; left: 0;
                        width: 100%; height: 100%;
                        display: inline; color: #C5A028; caret-ccolor: #C5A028;
                        outline: none; border-bottom: 1.5px solid #C5A028;
                        font-family: inherit; font-size: inherit; font-weight: inherit;
                        white-space: pre-wrap; overflow: hidden; cursor: text;
                    `;

                    wrapper.appendChild(hiddenSpan);
                    wrapper.appendChild(input);
                    node.replaceWith(wrapper);
                });

                document.querySelectorAll('.bio-keyword').forEach(kw => { kw.contentEditable = 'false'; });
            });

        } else {
            document.getElementById('typing-output')?.remove();
            page.style.paddingRight = '25vw';
            document.querySelectorAll('.fill-blank').forEach(el => el.remove());
            p.style.height = '';
            p.style.overflow = '';
            document.querySelectorAll('.plain-text').forEach(el => { el.style.visibility = 'hidden'; });
            document.querySelectorAll('.bio-keyword').forEach(kw => {
                kw.style.visibility = 'visible';
                kw.style.pointerEvents = 'none';
            });

            scrollMsg.style.opacity = '0';
            clickMsg.style.opacity = '0';
            switchBtn.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });

            setTimeout(() => {
                clickMsg.innerHTML = `
                    <div style="width:100%;display:flex;flex-direction:column;padding:0;box-sizing:border-box;">
                        <span style="display:block;text-align:left;padding-left:0.5vw;">HOVER</span>
                        <span style="display:block;text-align:center;">AND</span>
                        <span style="display:block;text-align:right;padding-right:3vw;">CLICK</span>
                    </div>
                `;
                clickMsg.style.fontSize = 'clamp(10px, 28vw, 28vh)';
                clickMsg.style.lineHeight = '0.9';
                clickMsg.style.justifyContent = 'flex-start';
                clickMsg.style.alignItems = 'flex-start';
                clickMsg.style.paddingTop = '60px';
                clickMsg.style.letterSpacing = '-0.02em';
                clickMsg.style.overflow = 'visible';
                clickMsg.style.opacity = '1';
            }, 600);

            document.querySelectorAll('.bio-keyword').forEach(kw => { kw.style.pointerEvents = 'none'; });
            let scrollTimer = null;
            const onScroll = () => {
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(() => {
                    window.removeEventListener('scroll', onScroll);
                    page.style.transform = 'none';
                    page.style.transition = '';
                    page.style.paddingRight = '25vw';
                    requestAnimationFrame(() => {
                        drawGroupOutlines(clickMsg);
                    });
                }, 100);
            };
            window.addEventListener('scroll', onScroll);
            if (window.scrollY === 0) {
                page.style.transform = 'none';
                page.style.transition = '';
                page.style.paddingRight = '25vw';
                requestAnimationFrame(() => {
                    drawGroupOutlines(clickMsg);
                });
            }
        }
    });

    window.addEventListener('resize', () => {
        if (document.getElementById('col-list')) return;
        const svgLines = document.getElementById('connect-svg-lines');
        const svgBoxes = document.getElementById('connect-svg-boxes');
        if (!svgLines && !svgBoxes) return;
        window.scrollTo(0, 0);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                drawGroupOutlines(clickMsg);
            });
        });
        const circleColEl = document.getElementById('circle-col');
        if (circleColEl) {
            const newSize = Math.min(window.innerWidth / 5, window.innerHeight / 5);
            circleColEl.querySelectorAll('svg').forEach(s => {
                s.setAttribute('width', newSize);
                s.setAttribute('height', newSize);
            });
        }
    });


    document.addEventListener('click', e => {
        if (activeMenu && !activeMenu.contains(e.target) && e.target !== activeSpan) closeMenu();
    });

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
function showNextView() {
    const page = document.getElementById('bio-page');

    document.getElementById('click-msg')?.remove();
    document.getElementById('scroll-msg')?.remove();
    document.getElementById('col-list')?.remove();
    document.getElementById('connect-svg-lines')?.remove();
    document.getElementById('connect-svg-boxes')?.remove();
    document.getElementById('top-btn')?.remove();
    document.getElementById('bottom-btn')?.remove();
    document.getElementById('bottom-btn-2')?.remove();
    document.getElementById('bottom-btn-3')?.remove();
    document.getElementById('typing-output')?.remove();

    page.innerHTML = '';
    page.style.paddingRight = '0';
    page.style.paddingTop = '0';
    page.style.paddingLeft = '0';
    page.style.paddingBottom = '0';
    page.style.height = '100vh';
    page.style.minHeight = '100vh';
    page.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    const whoseMsg = document.createElement('div');
    whoseMsg.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        font-family: "AvantGarde", sans-serif;
        font-weight: 100;
        color: #00FF00;
        pointer-events: none;
        z-index: 0;
        opacity: 1;
        transition: opacity 0.5s ease;
    `;
    whoseMsg.innerHTML = `
    <div style="text-align:left; padding: 60px 0 0 55px;">
        <span style="display:block;font-size:min(18vw, 45vh);line-height:1;letter-spacing:0.05em;white-space:nowrap;color:#00FF00;">WHOSE?</span>
    </div>`;
    document.body.appendChild(whoseMsg);

    const textPairs = sheetRows.slice(1)
        .map(row => ({ a: (row[0] || '').trim(), b: (row[1] || '').trim() }))
        .filter(p => p.a);

    for (let i = textPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [textPairs[i], textPairs[j]] = [textPairs[j], textPairs[i]];
    }

    function getNumCols() {
        const w = window.innerWidth;
        if (w >= 1200) return 8;
        if (w >= 900) return 6;
        if (w >= 600) return 4;
        return 2;
    }

    let resizeTimer = null;

    function renderGrid() {
        document.getElementById('col-container')?.remove();

        const NUM_COLS = getNumCols();
        const padLeft = 55, padRight = 40, gap = 20;
        const totalGap = (NUM_COLS - 1) * gap;
        const colWidth = (window.innerWidth - padLeft - padRight - totalGap) / NUM_COLS;
        const fontSize = Math.max(6, Math.min(13, colWidth / 10));

        const container = document.createElement('div');
        container.id = 'col-container';
        container.style.cssText = `
        display: grid;
        grid-template-columns: repeat(${NUM_COLS}, minmax(0, 1fr));
        align-items: start;
        width: 100%;
        padding: 60px 25vw 120px ${padLeft}px;
            box-sizing: border-box;
            column-gap: ${gap}px;
            overflow-x: hidden;
        `;

        const numRows = Math.ceil(textPairs.length / NUM_COLS);
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < NUM_COLS; c++) {
                const idx = r * NUM_COLS + c;
                const wrapper = document.createElement('div');
                wrapper.style.cssText = `position: relative; padding-top: 20px; padding-bottom: 20px; border-top: 1.5px solid #C5A028;`;

                if (idx < textPairs.length) {
                    const blockText = textPairs[idx].a;
                    const blockName = textPairs[idx].b || blockText.slice(0, 20);

                    const block = document.createElement('div');
                    block.style.cssText = `
                        position: relative;
                        font-family: 'LatinThin', "Helvetica Neue", "Helvetica", "Asta Sans", sans-serif;
                        font-size: ${fontSize}px;
                        font-weight: 900;
                        line-height: 1.6;
                        overflow-wrap: break-word;
                        word-break: keep-all;
                    `;

                    const textNode = document.createElement('span');
                    textNode.textContent = blockText;
                    textNode.style.cssText = `display: block; position: relative; z-index: 1;`;
                    block.appendChild(textNode);

                    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svgEl.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; opacity: 0; transition: opacity 0.2s ease;`;
                    const rectBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rectBg.setAttribute('width', '100%'); rectBg.setAttribute('height', '100%');
                    rectBg.setAttribute('fill', 'rgba(0,255,0,0.1)'); rectBg.setAttribute('stroke', 'none');
                    svgEl.appendChild(rectBg);
                    const rectBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rectBorder.setAttribute('width', '100%'); rectBorder.setAttribute('height', '100%');
                    rectBorder.setAttribute('fill', 'none'); rectBorder.setAttribute('stroke', '#00FF00');
                    rectBorder.setAttribute('stroke-width', '1.5');
                    svgEl.appendChild(rectBorder);
                    block.appendChild(svgEl);

                    const copyBtn = document.createElement('div');
                    copyBtn.style.cssText = `position: absolute; top: 18px; left: 50%; transform: translateX(-50%); cursor: pointer; pointer-events: none; opacity: 0; transition: opacity 0.2s ease; z-index: 10; line-height: 0;`;
                    copyBtn.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="0.8" stroke-linecap="square" stroke-linejoin="miter" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="12" height="12"/><polyline points="5,15 3,15 3,3 15,3 15,5"/></svg>`;
                    block.appendChild(copyBtn);

                    const dlBtn = document.createElement('div');
                    dlBtn.style.cssText = `position: absolute; top: 70px; left: 50%; transform: translateX(-50%); cursor: pointer; pointer-events: none; opacity: 0; transition: opacity 0.2s ease; z-index: 10; line-height: 0;`;
                    dlBtn.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="0.8" stroke-linecap="square" stroke-linejoin="miter" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="3" x2="12" y2="15"/><polyline points="7,10 12,15 17,10"/><line x1="5" y1="20" x2="19" y2="20"/></svg>`;
                    block.appendChild(dlBtn);
                    wrapper.appendChild(block);

                    wrapper.addEventListener('mouseenter', () => {
                        const bRect = block.getBoundingClientRect();
                        const perimeter = 2 * (bRect.width + bRect.height);
                        rectBorder.style.transition = 'none';
                        rectBorder.style.strokeDasharray = perimeter;
                        rectBorder.style.strokeDashoffset = perimeter;
                        svgEl.style.opacity = '1';
                        requestAnimationFrame(() => { requestAnimationFrame(() => {
                            rectBorder.style.transition = 'stroke-dashoffset 0.6s ease';
                            rectBorder.style.strokeDashoffset = '0';
                        }); });
                        copyBtn.style.opacity = '1'; copyBtn.style.pointerEvents = 'auto';
                        dlBtn.style.opacity = '1'; dlBtn.style.pointerEvents = 'auto';
                    });
                    wrapper.addEventListener('mouseleave', () => {
                        svgEl.style.opacity = '0';
                        copyBtn.style.opacity = '0'; copyBtn.style.pointerEvents = 'none';
                        dlBtn.style.opacity = '0'; dlBtn.style.pointerEvents = 'none';
                    });
                    copyBtn.addEventListener('mouseenter', () => { copyBtn.style.opacity = '0.3'; });
                    copyBtn.addEventListener('mouseleave', () => { copyBtn.style.opacity = '1'; });
                    copyBtn.addEventListener('click', (e) => { e.stopPropagation(); navigator.clipboard.writeText(blockText); });
                    dlBtn.addEventListener('mouseenter', () => { dlBtn.style.opacity = '0.3'; });
                    dlBtn.addEventListener('mouseleave', () => { dlBtn.style.opacity = '1'; });
                    dlBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const blob = new Blob([blockText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = blockName.replace(/\s+/g, '_') + '.txt';
                        a.click();
                        URL.revokeObjectURL(url);
                    });
                }
                container.appendChild(wrapper);
            }
        }

        page.appendChild(container);
        page.style.height = 'auto';
        page.style.minHeight = '100vh';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.scrollTo(0, 0);
    }

    renderGrid();

    const bottomBtn3 = document.createElement('div');
    bottomBtn3.id = 'bottom-btn-3';
    bottomBtn3.style.cssText = `position: fixed; top: 30px; right: 55px; cursor: pointer; z-index: 10; line-height: 0; display: none;`;
    bottomBtn3.innerHTML = arrowSVG;
    document.body.appendChild(bottomBtn3);

    bottomBtn3.addEventListener('click', () => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        window.scrollTo(0, 0);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.body.style.transition = 'transform 0.8s cubic-bezier(0.76, 0, 0.24, 1)';
                document.body.style.transform = 'translateY(-100%)';
                setTimeout(() => { window.location.href = 'end.html'; }, 800);
            });
        });
    });

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { renderGrid(); }, 200);
    });

    const whoseBtn = document.createElement('div');
    whoseBtn.id = 'bottom-btn-2';
    whoseBtn.style.cssText = `position: fixed; top: 30px; right: 55px; cursor: pointer; z-index: 11; line-height: 0;`;
    whoseBtn.innerHTML = arrowSVG;
    document.body.appendChild(whoseBtn);

    whoseBtn.addEventListener('click', () => {
        whoseBtn.remove();
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        page.style.height = '100vh';
        page.style.overflow = 'hidden';
        window.scrollTo(0, 0);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.body.style.transition = 'transform 0.8s cubic-bezier(0.76, 0, 0.24, 1)';
                document.body.style.transform = 'translateY(-100%)';
                setTimeout(() => {
                    document.body.style.transform = 'none';
                    document.body.style.transition = '';
                    document.getElementById('col-container')?.remove();
                    whoseMsg.remove();
                    window.scrollTo(0, 0);
                    page.style.overflow = 'visible';
                    document.body.style.overflow = '';
                    document.documentElement.style.overflow = '';
                    document.getElementById('bottom-btn-3').style.display = '';
                }, 800);
            });
        });
    });
}
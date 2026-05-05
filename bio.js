const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let sheetRows = [];
let activeMenu = null;
let activeSpan = null;

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

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
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
            color: #FF0000;
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
                const x1 = x + w / 2;
                const y1 = y + h;
                const x2 = next.x + next.w / 2;
                const y2 = next.y;
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
        kw.replaceWith(clone);
        allKeywords.push(clone);
    });

    function getMappedRow(kw) {
        return kw.dataset.mappedRow || kw.dataset.rowIdx || null;
    }

    function fadeOthers(activeRow) {
        allBoxPaths.forEach(p => {
            p.style.opacity = p.dataset.row === activeRow ? '1' : '0.15';
        });
        allLinePaths.forEach(p => {
            p.style.opacity = p.dataset.row === activeRow ? '1' : '0.15';
        });
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
            allBoxPaths.forEach(p => {
                p.style.opacity = p.dataset.row === activeR ? '1' : '0.15';
            });
            allLinePaths.forEach(p => {
                p.style.opacity = p.dataset.row === activeR ? '1' : '0.15';
            });
            allKeywords.forEach(k => {
                const row = getMappedRow(k);
                k.style.opacity = row === activeR ? '1' : '0.15';
            });
        });

        kw.addEventListener('mouseleave', () => {
            if (activeRow) return;
            resetAll();
        });

        kw.addEventListener('click', e => {
            e.stopPropagation();
            const clickedRow = getMappedRow(kw);
            if (activeRow === clickedRow) {
                activeRow = null;
                resetAll();
            } else {
                activeRow = clickedRow;
                fadeOthers(activeRow);
            }
        });
    });

    /* TOP 버튼 */
    const topBtn = document.createElement('div');
    topBtn.id = 'top-btn';
    topBtn.innerHTML = 'top';
    page.appendChild(topBtn);

    topBtn.addEventListener('click', () => {
        topBtn.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            if (clickMsg) clickMsg.style.opacity = '1';
        }, 700);
    });

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

        span.addEventListener('mouseenter', () => {
            if (activeSpan === span) return;
            span.style.opacity = '0.4';
        });
        span.addEventListener('mouseleave', () => {
            if (activeSpan === span) return;
            span.style.opacity = '1';
        });
        span.addEventListener('click', e => {
            e.stopPropagation();
            if (activeSpan === span) { closeMenu(); return; }
            closeMenu();
            span.style.opacity = '0.4';
            openMenu(span);
        });
        p.appendChild(span);
    });

    page.appendChild(p);

    /* click the text 문구 */
    const clickMsg = document.createElement('div');
    clickMsg.id = 'click-msg';
    clickMsg.innerHTML = 'CLICK THE TEXT';
    document.body.appendChild(clickMsg);

    const switchBtn = document.createElement('div');
    switchBtn.id = 'switch-btn';
    switchBtn.innerHTML = 'hide';
    p.insertAdjacentElement('afterend', switchBtn);

    let hidden = false;

    switchBtn.addEventListener('click', () => {
        if (!hidden) {
            hidden = true;
            switchBtn.innerHTML = 'connect';
            closeMenu();

            window.scrollTo({ top: 0, behavior: 'smooth' });

            document.querySelectorAll('.bio-keyword').forEach(kw => {
                kw.style.pointerEvents = 'none';
            });

            p.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const span = document.createElement('span');
                    span.textContent = node.textContent;
                    span.style.visibility = 'hidden';
                    node.replaceWith(span);
                } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('bio-keyword')) {
                    node.style.visibility = 'hidden';
                }
            });

        } else {
            clickMsg.style.opacity = '0';
            switchBtn.style.display = 'none';

            document.querySelectorAll('.bio-keyword').forEach(kw => {
                kw.style.pointerEvents = 'none';
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        drawGroupOutlines(clickMsg);
                    });
                });
            }, 700);
        }
    });

    window.addEventListener('resize', () => {
        const svgLines = document.getElementById('connect-svg-lines');
        const svgBoxes = document.getElementById('connect-svg-boxes');
        if (!svgLines && !svgBoxes) return;
        window.scrollTo(0, 0);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                drawGroupOutlines(clickMsg);
            });
        });
    });

    document.addEventListener('click', e => {
        if (activeMenu && !activeMenu.contains(e.target) && e.target !== activeSpan) {
            closeMenu();
        }
    });

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        if (window.history.length > 1) {
            backBtn.style.display = 'flex';
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        } else {
            backBtn.style.display = 'none';
        }
    }
});
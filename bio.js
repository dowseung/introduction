const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let sheetRows = [];
let activeMenu = null;
let activeSpan = null;
let currentStage = 'read'; // 'read' | 'hover' | 'collist'

const arrowSVG = `<svg viewBox="0 0 110 60" width="15vw" height="7.5vw" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible;">
    <line x1="0" y1="30" x2="95" y2="30" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
    <polyline points="75,10 95,30 75,50" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const LEFT_GRAPHIC_VB = { w: 230.27, h: 245.44 };
const LEFT_GRAPHIC_PATHS = `<path d="M191.87,48.48l22.8-3.95c.84-.15.89-1.33.07-1.55l-71.65-19.19-.1-.03h-75.53c-.07,0-.13,0-.2.02l-47.05,12c-.79.2-.8,1.32-.01,1.54l19.2,5.23c.79.21.78,1.34-.01,1.54l-19.18,4.89c-.79.2-.8,1.32-.01,1.54l50.35,13.72h-3.1c-.07,0-.13,0-.2.02l-47.05,12c-.79.2-.8,1.32-.01,1.54l50.35,13.72h-3.1c-.07,0-.13,0-.2.02l-47.05,12c-.79.2-.8,1.32-.01,1.54l50.35,13.72h-3.1c-.07,0-.13,0-.2.02l-47.05,12c-.79.2-.8,1.32-.01,1.54l50.35,13.72h-3.1c-.07,0-.13,0-.2.02l-47.05,12c-.79.2-.8,1.32-.01,1.54l91.61,24.96.18.05,102.68-17.8c.84-.15.89-1.33.07-1.55l-54.85-14.69c-.82-.22-.77-1.41.07-1.55l54.71-9.48c.84-.15.89-1.33.07-1.55l-54.85-14.69c-.82-.22-.77-1.41.07-1.55l54.71-9.48c.84-.15.89-1.33.07-1.55l-54.85-14.69c-.82-.22-.77-1.41.07-1.55l54.71-9.49c.84-.15.89-1.33.07-1.55l-54.85-14.69c-.82-.22-.77-1.41.07-1.55l54.71-9.49c.84-.15.89-1.33.07-1.55l-22.93-6.14c-.82-.22-.77-1.41.07-1.55ZM26.64,35.83l40.72-10.41c.06-.02.13-.02.2-.02h75.1c.07,0,.14,0,.21.03l64.24,17.21c.82.22.77,1.41-.07,1.55l-22.33,3.87c-.11.02-.23.01-.34-.02l-41.28-11.06-.1-.03h-75.53c-.07,0-.13,0-.2.02l-21.52,5.49c-.13.03-.27.03-.41,0l-18.7-5.1c-.79-.21-.78-1.34.01-1.54ZM177.12,49.37l-64.88,11.25c-.11.02-.23.01-.34-.02l-60.27-16.42c-.79-.21-.78-1.34.01-1.54l15.72-4.02c.06-.02.13-.02.2-.02h75.1c.07,0,.14,0,.21.03l34.33,9.2c.82.22.77,1.41-.07,1.55ZM207.03,166.51l-94.79,16.43c-.11.02-.23.01-.34-.02l-85.26-23.23c-.79-.21-.78-1.34.01-1.54l40.72-10.41c.06-.02.13-.02.2-.02h8.91c.07,0,.14,0,.21.03l35.13,9.57.18.05,40.38-7c.11-.02.23-.01.34.02l54.39,14.57c.82.22.77,1.41-.07,1.55ZM88.77,147.73h53.82c.12,0,.23.02.34.05l2.34.63c.82.22.77,1.41-.07,1.55l-32.96,5.71c-.11.02-.23.01-.34-.02l-23.33-6.36c-.9-.24-.72-1.56.21-1.56ZM207.03,139.23l-54.24,9.4c-.11.02-.23.01-.34-.02l-9.36-2.51-.1-.03h-66.07c-.07,0-.14,0-.21-.03l-50.07-13.64c-.79-.21-.78-1.34.01-1.54l40.72-10.41c.06-.02.13-.02.2-.02h8.91c.07,0,.14,0,.21.03l35.13,9.57.18.05,40.38-7c.11-.02.23-.01.34.02l54.39,14.57c.82.22.77,1.41-.07,1.55ZM88.77,120.44h53.82c.12,0,.23.02.34.05l2.34.63c.82.22.77,1.41-.07,1.55l-32.96,5.71c-.11.02-.23.01-.34-.02l-23.33-6.36c-.9-.24-.72-1.56.21-1.56ZM207.03,111.95l-54.24,9.4c-.11.02-.23.01-.34-.02l-9.36-2.51-.1-.03h-66.07c-.07,0-.14,0-.21-.03l-50.07-13.64c-.79-.21-.78-1.34.01-1.54l40.72-10.41c.06-.02.13-.02.2-.02h8.92c.07,0,.14,0,.21.03l35.13,9.57.18.05,40.38-7c.11-.02.23-.01.34.02l54.39,14.57c.82.22.77,1.41-.07,1.55ZM88.77,93.16h53.82c.12,0,.23.02.34.05l2.34.63c.82.22.77,1.41-.07,1.55l-32.96,5.71c-.11.02-.23.01-.34-.02l-23.33-6.36c-.9-.24-.72-1.56.21-1.56ZM207.03,84.67l-54.25,9.4c-.11.02-.23.01-.34-.02l-9.36-2.51-.1-.03h-66.07c-.07,0-.14,0-.21-.03l-50.07-13.64c-.79-.21-.78-1.34.01-1.54l40.72-10.41c.06-.02.13-.02.2-.02h8.92c.07,0,.14,0,.21.03l35.13,9.57.18.05,40.38-7c.11-.02.23-.01.34.02l54.39,14.57c.82.22.77,1.41-.07,1.55ZM88.77,65.88h53.82c.12,0,.23.02.34.05l2.34.63c.82.22.77,1.41-.07,1.55l-32.96,5.71c-.11.02-.23.01-.34-.02l-23.33-6.36c-.9-.24-.72-1.56.21-1.56ZM143.08,64.27l-.1-.03h-66.07c-.07,0-.14,0-.21-.03l-50.07-13.64c-.79-.21-.78-1.34.01-1.54l18.65-4.77c.13-.03.27-.03.41,0l66.11,18.02.18.05,72.3-12.53c.11-.02.23-.01.34.02l22.48,6.02c.82.22.77,1.41-.07,1.55l-54.25,9.4c-.11.02-.23.01-.34-.02l-9.36-2.51Z" fill="#FF00FF"/>
<path d="M142.98,192.14h-75.53c-.07,0-.13,0-.2.02l-47.05,12c-.79.2-.8,1.32-.01,1.54l91.61,24.96.18.05,102.68-17.8c.84-.15.89-1.33.07-1.55l-71.65-19.19-.1-.03ZM111.89,228.99l-85.26-23.23c-.79-.21-.78-1.34.01-1.54l40.72-10.41c.06-.02.13-.02.2-.02h75.1c.07,0,.14,0,.21.03l64.24,17.21c.82.22.77,1.41-.07,1.55l-94.79,16.43c-.11.02-.23.01-.34-.02Z" fill="#FF00FF"/>
<path d="M-256.53-138.75c11.5,83.01,11.82,173.99-30.7,248.96-32.76,57.77-95.69,111.16-166.08,105-32.25-2.83-67.32-19.81-75.3-53.77l-2.76,6.78c20.46-15.49,49.48-7.1,65.86,10.49,20.62,22.16,22.04,56.38,19.21,84.81-5.58,56.21-29.63,110.59-65.94,153.68-20.72,24.58-45.35,45.59-73.1,61.85-6.05,3.54-1.9,12.32,4.62,10.97,59.37-12.29,120.25-16.66,180.78-13.03,28.78,1.73,57.57,5.1,85.86,10.74,23.41,4.67,46.77,11.09,68.49,21.13s40.35,22.64,55.5,40.16c15.54,17.96,29.2,44.41,20.09,68.43-6.24,16.45-23.33,25.67-40.11,27.52-18.86,2.07-37.46-3.99-50.53-17.89-31.59-33.62-24.98-87.96-4.98-125.56,20.92-39.33,57.41-68.03,97.53-86.09,41.95-18.89,89.24-26.32,134.96-21.37,23.2,2.52,46.41,8.61,67.28,19.15,21.68,10.94,38.81,26.37,53.81,45.29,7.72,9.74,15.36,19.68,25.13,27.49s22.22,13.22,34.92,16.18c23.61,5.52,49.09,4.25,71.37,14.81,9.09,4.31,18,10.26,23.49,18.89,6.83,10.72,6.29,22.98,1.79,34.53-4.92,12.61-13.24,24.08-20.89,35.15-8.27,11.96-17.07,23.55-26.39,34.72-8.87,10.64-18.2,20.88-27.91,30.77-3.74,3.8-.91,10.04,4.24,10.24,53.86,2.08,107.72,4.17,161.58,6.25,5.98.23,12.23-.04,18.16.81,5.59.8,7.33,3.79,7.71,9.21.94,13.26,1.07,26.63,1.47,39.92.79,26.5,1.25,53.01,1.37,79.53.14,30.49-.17,60.98-.91,91.47l10.24-4.24c-23.45-26.06-51.89-47.63-83.33-63.14-15.46-7.63-31.64-13.9-48.25-18.52-14.04-3.91-35.54-10.03-43.91,6.71-7.26,14.53,4.06,30.66,12.83,41.55,10.44,12.95,22.15,24.86,34.73,35.74,25.76,22.26,54.88,40.27,85.17,55.66,34.57,17.56,70.67,31.9,106.75,46-.48-3.66-.96-7.31-1.43-10.97-14.5,9.03-29,18.06-43.49,27.08-6.54,4.07-.52,14.46,6.06,10.36,14.5-9.03,29-18.06,43.49-27.08,4.69-2.92,3.28-9.13-1.43-10.97-58.12-22.72-117.17-46.25-167.76-83.52-12.32-9.07-24-19.05-34.8-29.89-5.51-5.53-10.79-11.29-15.81-17.28-4.69-5.6-9.58-11.38-12.42-18.2-2.08-4.99-3.94-12.55,1.5-16.1,6.07-3.97,15.51-.63,21.85,1,15.44,3.95,30.55,9.27,45.01,15.98,32.94,15.28,62.46,37.07,86.74,64.06,3.61,4.01,10.12.71,10.24-4.24,1.38-56.99,1.24-114.01-.46-170.99-.4-13.5-.36-27.18-1.52-40.65-1.03-12.02-7.51-19.26-19.66-20.49-13.24-1.34-26.8-1.15-40.11-1.66-14.3-.55-28.59-1.11-42.89-1.66-32.25-1.25-64.5-2.49-96.75-3.74l4.24,10.24c21.25-21.63,40.59-45.12,57.71-70.15,14.91-21.81,33-48.72,19.78-75.63-10.25-20.85-35.01-31.71-56.67-35.74-26.56-4.94-57.23-3.63-79.06-22.04-10.39-8.76-18.34-19.94-26.84-30.43-8.21-10.13-17.32-19.2-27.7-27.1-19.7-15.01-42.95-25.09-66.93-30.97-48.49-11.89-101-8.2-148.08,7.94-45.02,15.44-87.07,42.59-114.86,81.78-27.45,38.7-40.38,92.35-19.17,136.82,9.57,20.07,26.77,36.11,48.68,41.27,18.96,4.47,40.7,1.86,56.93-9.39,19.85-13.77,26.46-37.41,21.1-60.47-5.86-25.21-23.57-47.17-43.45-63.04-40.76-32.55-93.66-44.83-144.27-51.86-63.93-8.88-128.76-8.89-192.71-.08-15.54,2.14-30.99,4.83-46.35,8.01l4.62,10.97c53.28-31.2,95.94-79.68,120.97-136.06,12.46-28.05,20.63-57.74,23.85-88.28,3.33-31.55.75-66.92-20.35-92.32-19.13-23.04-57.17-34.15-82.62-14.9-2.23,1.69-3.42,3.94-2.76,6.78,7.67,32.6,37.38,52.72,68.57,59.77,35.13,7.93,71.02.18,102.58-16.26,72.13-37.56,113.85-114.54,126.05-192.63,8.16-52.25,5.26-105.28-1.97-157.45-1.06-7.62-12.62-4.37-11.57,3.19h0Z" fill="#FF00FF"/>`;

function normalizeQuotes(text) {
    return text
        .replace(/«/g, '《')
        .replace(/»/g, '》')
        .replace(/</g, '《')
        .replace(/>/g, '》');
}

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
        top: calc(30px + 7.5vw + 40px);
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
                    document.getElementById('left-graphic')?.remove();
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
    const data = normalizeQuotes(await response.text());
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

    function buildLeftGraphic() {
        document.getElementById('left-graphic')?.remove();
        // 뷰포트 가로/세로 모두에 맞춰 스케일을 계산해서, 창 비율이 바뀌어도
        // 그래픽이 화면 밖으로 잘려나가지 않고 항상 전체가 보이도록 함
        const scale = Math.min(
            window.innerWidth / LEFT_GRAPHIC_VB.w,
            window.innerHeight / LEFT_GRAPHIC_VB.h
        );
        const w = LEFT_GRAPHIC_VB.w * scale;
        const h = LEFT_GRAPHIC_VB.h * scale;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'left-graphic';
        svg.setAttribute('viewBox', `0 0 ${LEFT_GRAPHIC_VB.w} ${LEFT_GRAPHIC_VB.h}`);
        svg.setAttribute('width', w);
        svg.setAttribute('height', h);
        svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        svg.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        display: block;
        pointer-events: none;
        z-index: 0;
    `;
        svg.innerHTML = LEFT_GRAPHIC_PATHS;
        document.body.appendChild(svg);
    }

    buildLeftGraphic();

    const switchBtn = document.createElement('div');
    switchBtn.id = 'switch-btn';
    switchBtn.innerHTML = arrowSVG;
    document.body.appendChild(switchBtn);

    let triggered = false;

    switchBtn.addEventListener('click', () => {
        if (triggered) return;
        triggered = true;

        closeMenu();
        document.getElementById('left-graphic')?.remove();
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
        if (document.getElementById('left-graphic')) buildLeftGraphic();

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
    document.getElementById('left-graphic')?.remove();
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
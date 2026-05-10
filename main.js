const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let sheetRows = [];
let searchHistory = [];
let usedTextHistory = [];
let originalTextContent = '';

async function typeWriter(element, text, speed = 30) {
    element.innerText = '';
    element.style.opacity = '1';
    for (let i = 0; i < text.length; i++) {
        element.innerText += text.charAt(i);
        await new Promise(res => setTimeout(res, speed));
    }
}

function adjustFontSize() {
    const container = document.getElementById('landing-page');
    const text = document.querySelector('.intro-text');
    if (!text || !container) return;
    const style = window.getComputedStyle(container);
    const maxWidth = container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const maxHeight = container.clientHeight - 420;
    const baseFontSize = 100;
    const v = document.createElement('div');
    v.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:${maxWidth}px;font-size:${baseFontSize}px;line-height:${style.lineHeight};font-family:${style.fontFamily};font-weight:${style.fontWeight};white-space:pre-wrap;word-break:keep-all;`;
    v.innerText = originalTextContent || text.innerText;
    document.body.appendChild(v);
    const ratio = Math.min(maxWidth / v.offsetWidth, maxHeight / v.offsetHeight);
    const finalSize = Math.min(Math.max(Math.floor(baseFontSize * ratio), 25), 55);
    document.body.removeChild(v);
    text.style.fontSize = finalSize + "px";
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

async function loadSheet() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const data = await response.text();
        sheetRows = parseCSV(data);
    } catch(e) { console.error(e); }
}

window.addEventListener('load', async () => {
    const textElement = document.querySelector('.intro-text');
    if (!textElement) return;

    const originalText = textElement.innerText.trim();
    originalTextContent = originalText;

    if (document.fonts) await document.fonts.ready;
    await loadSheet();
    adjustFontSize();
    await typeWriter(textElement, originalText, 30);

    /* 잠깐 대기 후 페이지 전체 위로 올라가며 전환 */
    await new Promise(res => setTimeout(res, 300));
    document.body.classList.add('slide-up');

    await new Promise(res => setTimeout(res, 600));
    window.location.href = 'bio.html';
});

window.addEventListener('resize', () => {
    requestAnimationFrame(adjustFontSize);
});
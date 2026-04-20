const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

async function typeWriter(element, speed = 30) {
    const fullText = element.getAttribute('data-text');
    element.innerText = '';
    element.style.opacity = '1';
    for (let i = 0; i < fullText.length; i++) {
        element.innerText += fullText.charAt(i);
        await new Promise(res => setTimeout(res, speed));
    }
}

let lastWidth = 0;
let lastHeight = 0;

function adjustFontSize() {
    const container = document.getElementById('landing-page');
    const text = document.querySelector('.intro-text');
    if (!text || !container) return;
    const dw = Math.abs(container.clientWidth - lastWidth);
    const dh = Math.abs(container.clientHeight - lastHeight);
    if (dw < 5 && dh < 5) return;
    lastWidth = container.clientWidth;
    lastHeight = container.clientHeight;
    const style = window.getComputedStyle(container);
    const maxWidth = container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const maxHeight = container.clientHeight - 120;
    const baseFontSize = 100;
    const v = document.createElement('div');
    v.style.cssText = `position: absolute; visibility: hidden; pointer-events: none; width: ${maxWidth}px; font-size: ${baseFontSize}px; line-height: ${style.lineHeight}; font-family: ${style.fontFamily}; font-weight: ${style.fontWeight}; white-space: pre-wrap; word-break: keep-all;`;
    v.innerText = text.innerText;
    document.body.appendChild(v);
    const ratio = Math.min(maxWidth / v.offsetWidth, maxHeight / v.offsetHeight);
    const finalSize = Math.floor(baseFontSize * ratio);
    document.body.removeChild(v);
    text.style.fontSize = finalSize + "px";
}

async function initSpreadsheetKeywords() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const data = await response.text();
        const firstRow = data.split('\n')[0].split(',');
        const keywords = firstRow.map(k => k.replace(/\r?\n|\r/g, "").trim()).filter((k, i) => i !== 13 && k !== "");
        const targetLinkWord = firstRow[1] ? firstRow[1].replace(/\r?\n|\r/g, "").trim() : null;
        applyKeywordsToText(keywords, targetLinkWord);
    } catch (error) { console.error(error); }
}

function applyKeywordsToText(keywords, targetLinkWord) {
    const textElement = document.querySelector('.intro-text');
    if (!textElement) return;
    let content = textElement.innerText;
    keywords.forEach((keyword, index) => {
        const cleanWord = keyword.trim();
        if (!cleanWord) return;
        const isLink = (cleanWord === targetLinkWord);
        const regex = new RegExp(`(${cleanWord})`, 'g');
        const className = isLink ? 'keyword link-keyword' : (index === 0 ? 'keyword first-keyword' : 'keyword');
        content = content.replace(regex, `<span class="${className}">$1</span>`);
    });
    textElement.innerHTML = content;

    document.querySelectorAll('.keyword').forEach(el => {
        el.addEventListener('mouseenter', () => el.classList.add('highlight'));
        el.addEventListener('mouseleave', () => el.classList.remove('highlight'));

        /* moving.html 링크 키워드 */
        if (el.classList.contains('link-keyword')) {
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => { window.location.href = 'moving.html'; });
        }

        /* 학교 → school.html */
        if (el.textContent.trim() === '학교') {
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => { window.location.href = 'school.html'; });
        }
    });
}

window.addEventListener('load', async () => {
    const textElement = document.querySelector('.intro-text');
    if (!textElement) return;
    textElement.setAttribute('data-text', textElement.innerText.trim());
    if (document.fonts) await document.fonts.ready;
    adjustFontSize();
    await typeWriter(textElement, 30);
    initSpreadsheetKeywords();
});

window.addEventListener('resize', () => { requestAnimationFrame(adjustFontSize); });
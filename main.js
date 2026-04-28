const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let sheetRows = [];
let layers = [];
let originalTextContent = '';
let searchHistory = [];
let usedTextHistory = [];

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
    layers.forEach(layer => { if (layer && layer.style) layer.style.fontSize = finalSize + "px"; });
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

function applyKeywordsToLockedSpan(keywords) {
    const locked = document.getElementById('locked-text');
    if (!locked) return;
    let content = locked.innerText;
    keywords.forEach(keyword => {
        const cleanWord = keyword.trim();
        if (!cleanWord) return;
        const regex = new RegExp(`(${cleanWord})`, 'g');
        const className = cleanWord === '소개글' ? 'keyword bio-link' : 'keyword';
        content = content.replace(regex, `<span class="${className}">$1</span>`);
    });
    locked.innerHTML = content;
    locked.contentEditable = 'false';
    locked.querySelectorAll('.keyword').forEach(el => {
        if (el.classList.contains('bio-link')) {
            el.addEventListener('mouseenter', () => el.classList.add('highlight'));
            el.addEventListener('mouseleave', () => el.classList.remove('highlight'));
            el.addEventListener('click', () => { window.location.href = 'bio.html'; });
        }
    });
    locked.addEventListener('mousedown', e => {
        if (e.target.closest('.bio-link')) return;
        e.preventDefault();
    });
}

window.addEventListener('load', async () => {
    const textElement = document.querySelector('.intro-text');
    if (!textElement) return;

    const originalText = textElement.innerText.trim();
    originalTextContent = originalText;
    textElement.setAttribute('data-text', originalText);

    if (document.fonts) await document.fonts.ready;
    await loadSheet();
    adjustFontSize();
    await typeWriter(textElement, originalText, 30);

    let isTransitioning = false;

    function moveCursorToEnd(span) {
        if (!span) return;
        span.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(span);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function makeArrow() {
        const a = document.createElement('span');
        a.className = 'right-arrow';
        a.innerHTML = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="4" y1="16" x2="26" y2="16" stroke="#000" stroke-width="2.5" stroke-linecap="round"/>
            <polyline points="18,8 26,16 18,24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
        const svg = a.querySelector('svg');
        svg.style.width = '1em';
        svg.style.height = '1em';
        svg.style.display = 'block';
        Object.assign(a.style, {
            display: 'none', cursor: 'pointer',
            marginLeft: '0.15em', verticalAlign: 'middle',
            lineHeight: '1', fontSize: 'inherit',
        });
        return a;
    }

    function flashRed() {
        textElement.style.transition = 'color 0.15s ease';
        textElement.style.color = '#FF0000';
        setTimeout(() => {
            textElement.style.color = '#000';
            setTimeout(() => { textElement.style.transition = ''; }, 200);
        }, 350);
    }

    function initStructure(lockedText) {
        textElement.innerHTML =
            `<span id="locked-text" contenteditable="false">${lockedText}</span>` +
            `<span id="user-text" contenteditable="true"></span>`;
        textElement.style.outline = 'none';
        textElement.style.caretColor = '#000';
        textElement.style.opacity = '1';
        textElement.style.color = '#000';

        const uSpan = document.getElementById('user-text');
        uSpan.style.outline = 'none';
        uSpan.spellcheck = false;

        const uPlaceholder = document.createElement('span');
        uPlaceholder.id = 'placeholder-text';
        uPlaceholder.textContent = '디자이너의 이름을 타이핑해보세요.';
        Object.assign(uPlaceholder.style, {
            color: 'rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            userSelect: 'none',
        });
        uSpan.insertAdjacentElement('afterend', uPlaceholder);

        const uArrow = makeArrow();
        uPlaceholder.insertAdjacentElement('afterend', uArrow);
        uArrow.addEventListener('click', handleArrowClick);

        function updateUI() {
            const hasText = uSpan.innerText.trim().length > 0;
            uPlaceholder.style.display = hasText ? 'none' : 'inline';
            uArrow.style.display = hasText ? 'inline-block' : 'none';
        }

        uSpan.addEventListener('input', updateUI);
        uSpan.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); handleArrowClick(); return; }
            if ((e.key === 'Backspace' || e.key === 'Delete') && uSpan.innerText.length === 0) {
                e.preventDefault();
            }
        });
        uSpan.addEventListener('paste', e => {
            e.preventDefault();
            document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text'));
        });

        document.getElementById('locked-text').addEventListener('mousedown', e => {
            if (e.target.closest('.bio-link')) return;
            e.preventDefault();
            moveCursorToEnd(uSpan);
        });

        const kw = (sheetRows[0] || []).map(k => k.replace(/\r?\n|\r/g, "").trim()).filter((k, i) => i !== 13 && k !== "");
        applyKeywordsToLockedSpan(kw);
        updateUI();
        moveCursorToEnd(uSpan);
        return uSpan;
    }

    function setupNewUserSpan(newUserSpan) {
        const newPlaceholder = document.createElement('span');
        newPlaceholder.id = 'placeholder-text';
        newPlaceholder.textContent = '디자이너의 이름을 타이핑해보세요.';
        Object.assign(newPlaceholder.style, {
            color: 'rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            userSelect: 'none',
        });
        newUserSpan.insertAdjacentElement('afterend', newPlaceholder);

        const newArrow = makeArrow();
        newPlaceholder.insertAdjacentElement('afterend', newArrow);
        newArrow.addEventListener('click', handleArrowClick);

        function updateUI() {
            const hasText = newUserSpan.innerText.trim().length > 0;
            newPlaceholder.style.display = hasText ? 'none' : 'inline';
            newArrow.style.display = hasText ? 'inline-block' : 'none';
        }

        newUserSpan.addEventListener('input', updateUI);
        newUserSpan.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); handleArrowClick(); return; }
            if ((e.key === 'Backspace' || e.key === 'Delete') && newUserSpan.innerText.length === 0) {
                e.preventDefault();
            }
        });
        newUserSpan.addEventListener('paste', e => {
            e.preventDefault();
            document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text'));
        });

        const locked = document.getElementById('locked-text');
        if (locked) {
            locked.addEventListener('mousedown', e => {
                if (e.target.closest('.bio-link')) return;
                e.preventDefault();
                newUserSpan.focus();
            });
        }

        updateUI();
        moveCursorToEnd(newUserSpan);
    }

    async function handleArrowClick() {
        if (isTransitioning) return;

        const currentUserSpan = document.getElementById('user-text');
        if (!currentUserSpan) return;
        const typed = currentUserSpan.innerText.trim();
        if (!typed) return;

        const matchedRow = sheetRows.slice(1).find(row =>
            (row[1] || '').split(/\r?\n/).map(w => w.trim()).includes(typed)
        );

        if (!matchedRow) {
            flashRed();
            currentUserSpan.innerText = '';
            const ph = document.getElementById('placeholder-text');
            if (ph) ph.style.display = 'inline';
            textElement.querySelectorAll('.right-arrow').forEach(a => a.style.display = 'none');
            currentUserSpan.focus();
            const r = document.createRange();
            const s = window.getSelection();
            r.selectNodeContents(currentUserSpan);
            r.collapse(false);
            s.removeAllRanges();
            s.addRange(r);
            return;
        }

        /* C~L열(index 2~11) 값 수집 */
        const allVals = [];
        for (let colIdx = 2; colIdx <= 11; colIdx++) {
            const cell = (matchedRow[colIdx] || '').trim();
            cell.split(/\r?\n/).forEach(v => {
                const val = v.trim();
                if (val) allVals.push(val);
            });
        }

        if (allVals.length === 0) {
            isTransitioning = false;
            return;
        }

        /* 같은 검색어(B열)로 이전에 사용된 텍스트 제외 */
        const currB = (matchedRow[1] || '').split(/\r?\n/)[0].trim();
        const usedTexts = new Set(
            searchHistory.map((r, i) => {
                const rB = (r[1] || '').split(/\r?\n/)[0].trim();
                return rB === currB ? usedTextHistory[i] : null;
            }).filter(v => v !== null)
        );
        const available = allVals.filter(v => !usedTexts.has(v));
        const pool = available.length > 0 ? available : allVals;
        const aText = pool[Math.floor(Math.random() * pool.length)];

        isTransitioning = true;

        const ph = document.getElementById('placeholder-text');
        if (ph) ph.remove();
        textElement.querySelectorAll('.right-arrow').forEach(a => a.remove());
        currentUserSpan.remove();

        const locked = document.getElementById('locked-text');
        const searchCount = searchHistory.length;

        /* 이전 검색어와 같은지 판단 */
        const prevB = searchCount > 0
            ? (searchHistory[searchHistory.length - 1][1] || '').split(/\r?\n/)[0].trim()
            : null;
        const isSameName = prevB !== null && prevB === currB;

        
        /* 희미해지는 기능 없음 — 아무것도 안 함 */

        /* 같은 검색어면 공백, 다른 검색어면 줄바꿈 */
        locked.appendChild(document.createTextNode(isSameName ? ' ' : '\n'));
        const newBlock = document.createElement('span');
        newBlock.className = 'new-block';
        newBlock.style.cssText = 'display:inline;opacity:1;';
        locked.appendChild(newBlock);

        for (let i = 0; i < aText.length; i++) {
            newBlock.appendChild(document.createTextNode(aText.charAt(i)));
            await new Promise(res => setTimeout(res, 30));
        }

        searchHistory.push(matchedRow);
        usedTextHistory.push(aText);

        const newUserSpan = document.createElement('span');
        newUserSpan.id = 'user-text';
        newUserSpan.contentEditable = 'true';
        newUserSpan.style.outline = 'none';
        newUserSpan.spellcheck = false;
        locked.after(newUserSpan);

        setupNewUserSpan(newUserSpan);

        refreshBtn.style.display = 'flex';
        isTransitioning = false;
    }

    initStructure(originalText);

    const refreshBtn = document.createElement('div');
    refreshBtn.id = 'refresh-btn';
    const FIXED_SIZE = 30, FIXED_SW = 2.5;

    refreshBtn.innerHTML = `<svg viewBox="0 0 32 32" width="${FIXED_SIZE}" height="${FIXED_SIZE}"
        fill="none" xmlns="http://www.w3.org/2000/svg"
        style="transition:transform 0.5s cubic-bezier(0.15,1,0.3,1);display:block;">
        <path d="M 28 12 A 12 12 0 1 0 28 20"
              stroke="#000" stroke-width="${FIXED_SW}" stroke-linecap="round" fill="none"/>
        <polyline points="28,5 28,12 21,12"
              fill="none" stroke="#000" stroke-width="${FIXED_SW}" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    Object.assign(refreshBtn.style, {
        position: 'fixed', bottom: '36px', left: '50%',
        transform: 'translateX(-50%)', cursor: 'pointer',
        zIndex: '200', display: 'none',
        alignItems: 'center', justifyContent: 'center',
    });

    const refreshSvg = refreshBtn.querySelector('svg');

    refreshBtn.addEventListener('click', () => {
        refreshSvg.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            refreshSvg.style.transition = 'none';
            refreshSvg.style.transform = 'rotate(0deg)';
            setTimeout(() => {
                refreshSvg.style.transition = 'transform 0.5s cubic-bezier(0.15,1,0.3,1)';
            }, 50);
        }, 500);

        layers.length = 0;
        searchHistory.length = 0;
        usedTextHistory.length = 0;

        setTimeout(() => {
            initStructure(originalText);
            refreshBtn.style.display = 'none';
        }, 300);
    });

    document.body.appendChild(refreshBtn);
});

window.addEventListener('resize', () => {
    requestAnimationFrame(adjustFontSize);
});
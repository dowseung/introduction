const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let allRows = [], wordToSourceMap = {}, wordToBColumnMap = {}, wordToRowIndicesMap = {}, uniqueWordsList = [], wordCounts = {}, currentSelectedWrapper = null;

function preventDefaultScroll(e) {
    if (!e.target.closest('.node-container') && !e.target.closest('#side-panel')) e.preventDefault();
}

async function init() {
    try {
        const res = await fetch(`${SHEET_URL}&cachebuster=${new Date().getTime()}`);
        const csvText = await res.text();
        Papa.parse(csvText, {
            header: false,
            complete: (results) => {
                allRows = results.data.slice(1);
                processData(allRows); 
                document.fonts.ready.then(() => { renderBatch(); renderBatch(); });
            }
        });
    } catch (err) { console.error("데이터 로드 실패", err); }
}

function processData(rows) {
    wordCounts = {}; wordToSourceMap = {}; wordToBColumnMap = {}; wordToRowIndicesMap = {};
    rows.forEach((row, rowIndex) => {
        const aText = row[0], bText = row[1], keywordCells = row.slice(2, 13);
        keywordCells.forEach(cell => {
            if (!cell) return;
            cell.toString().split('\n').forEach(line => {
                const word = line.trim();
                if (word.length > 0) {
                    wordCounts[word] = (wordCounts[word] || 0) + 1;
                    if (!wordToSourceMap[word]) wordToSourceMap[word] = new Set();
                    wordToSourceMap[word].add(aText);
                    if (!wordToBColumnMap[word]) wordToBColumnMap[word] = new Set();
                    if (bText) wordToBColumnMap[word].add(bText);
                    if (!wordToRowIndicesMap[word]) wordToRowIndicesMap[word] = new Set();
                    wordToRowIndicesMap[word].add(rowIndex);
                }
            });
        });
    });
    uniqueWordsList = Object.keys(wordCounts).sort((a, b) => b.length - a.length);
}

function highlightKeywords(text) {
    let highlightedText = text;
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    uniqueWordsList.forEach(word => {
        if (word.length < 1) return;
        const regex = new RegExp(`(?<!<[^>]*)${escapeRegExp(word)}(?![^<]*>)`, 'g');
        highlightedText = highlightedText.replace(regex, 
            `<span class="keyword-link" onmouseenter="addBorder(this)" onmouseleave="removeBorder(this)" onclick="event.stopPropagation(); showSidePanel('${word.replace(/'/g, "\\'")}')">
                <span class="inner-text">${word}</span>
            </span>`
        );
    });
    return highlightedText;
}

function showSidePanel(word) {
    const existing = document.getElementById('side-panel');
    if (existing) existing.remove();
    
    const sidePanel = document.createElement('div');
    sidePanel.id = 'side-panel';
    sidePanel.onclick = (e) => e.stopPropagation();

    const mainColumn = document.createElement('div'); 
    mainColumn.className = 'side-column-main';
    const subColumn = document.createElement('div'); 
    subColumn.className = 'side-column-sub';
    subColumn.style.display = 'none';

    const activePanel = document.getElementById('active-panel');
    const winWidth = window.innerWidth;
    let isSideOnRight = true;

    if (activePanel) {
        const rect = activePanel.getBoundingClientRect();
        if ((rect.left + rect.width / 2) < winWidth / 2) {
            sidePanel.style.right = '40px'; sidePanel.style.left = 'auto';
            isSideOnRight = true;
        } else {
            sidePanel.style.left = '40px'; sidePanel.style.right = 'auto';
            isSideOnRight = false;
        }
    }

    // 붉은 박스 위치 결정 (핑크 기둥 250px + 여유 간격 40px = 약 290px 이동)
    if (isSideOnRight) {
        subColumn.style.right = '290px'; subColumn.style.left = 'auto';
    } else {
        subColumn.style.left = '290px'; subColumn.style.right = 'auto';
    }

    const fillRelatedWords = (targetWord) => {
        subColumn.innerHTML = '';
        const rowIndices = wordToRowIndicesMap[targetWord];
        if (!rowIndices) return;
        const relatedWords = new Set();
        rowIndices.forEach(idx => {
            allRows[idx].slice(2, 13).forEach(cell => {
                if (!cell) return;
                cell.toString().split('\n').forEach(w => {
                    const trimmed = w.trim();
                    if (trimmed && trimmed !== targetWord) relatedWords.add(trimmed);
                });
            });
        });
        if (relatedWords.size > 0) {
            subColumn.style.display = 'flex';
            relatedWords.forEach(w => {
                const item = document.createElement('div');
                item.className = 'side-item-red'; item.innerText = w;
                subColumn.appendChild(item);
            });
        }
    };

    const bTexts = wordToBColumnMap[word];
    if (bTexts) {
        Array.from(bTexts).forEach(text => {
            const item = document.createElement('div');
            item.className = 'side-item-pink'; item.innerText = text;
            item.onclick = (e) => { e.stopPropagation(); fillRelatedWords(word); }; 
            mainColumn.appendChild(item);
        });
    }

    mainColumn.appendChild(subColumn);
    sidePanel.appendChild(mainColumn);
    document.body.appendChild(sidePanel);
}

function addBorder(el) {
    if (el.querySelector('svg')) return;
    const rect = el.getBoundingClientRect();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "keyword-border-svg");
    svg.setAttribute("viewBox", `0 0 ${rect.width + 10} ${rect.height + 10}`);
    const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    r.setAttribute("x", "5"); r.setAttribute("y", "5");
    r.setAttribute("width", rect.width); r.setAttribute("height", rect.height);
    r.setAttribute("class", "rect-border");
    svg.appendChild(r); el.appendChild(svg);
}

function removeBorder(el) { const svg = el.querySelector('svg'); if (svg) svg.remove(); }

function renderBatch() {
    const container = document.getElementById('stream-container');
    const winWidth = window.innerWidth;
    [...uniqueWordsList].sort(() => Math.random() - 0.5).forEach(word => {
        const wrapper = document.createElement('div');
        wrapper.className = 'word-wrapper';
        const item = document.createElement('div');
        item.className = 'floating-text'; item.innerText = word;
        const fontSize = Math.min(Math.max((winWidth * 0.02) + (wordCounts[word] - 1) * 10, 28), 110);
        item.style.fontSize = `${fontSize}px`;
        const correction = /^[A-Za-z0-9]/.test(word) ? 0.315 : 0.295;
        item.style.marginTop = `${25 - (fontSize * correction)}px`; 
        item.style.paddingBottom = `${fontSize * 0.12}px`;
        wrapper.onclick = (e) => { e.stopPropagation(); toggleInteraction(wrapper, word); };
        wrapper.append(item); container.append(wrapper);
    });
}

function toggleInteraction(target, word) {
    if (target.classList.contains('selected')) { closeDetail(); return; }
    closeDetail();
    target.classList.add('selected');
    currentSelectedWrapper = target;
    document.getElementById('stream-container').classList.add('dimmed');
    document.body.classList.add('stop-scroll');
    window.addEventListener('wheel', preventDefaultScroll, { passive: false });
    window.addEventListener('touchmove', preventDefaultScroll, { passive: false });
    const nodeGroup = document.createElement('div');
    nodeGroup.className = 'node-container'; nodeGroup.id = 'active-panel';
    Array.from(wordToSourceMap[word]).forEach((text) => {
        const node = document.createElement('div');
        node.className = 'node-text'; node.innerHTML = highlightKeywords(text);
        nodeGroup.appendChild(node);
    });
    document.body.appendChild(nodeGroup);
    updatePanelPosition();
}

function updatePanelPosition() {
    const panel = document.getElementById('active-panel');
    if (!panel || !currentSelectedWrapper) return;
    const rect = currentSelectedWrapper.getBoundingClientRect();
    const winWidth = window.innerWidth;
    const boxWidth = Math.min(500, winWidth * 0.7);
    let posX = (rect.left + rect.width / 2 < winWidth / 2) ? rect.left + rect.width + 40 : rect.left - boxWidth - 40;
    panel.style.left = `${Math.max(20, Math.min(posX, winWidth - boxWidth - 40))}px`;
}

function closeDetail() {
    document.body.classList.remove('stop-scroll');
    window.removeEventListener('wheel', preventDefaultScroll);
    window.removeEventListener('touchmove', preventDefaultScroll);
    document.getElementById('stream-container').classList.remove('dimmed');
    document.querySelectorAll('.word-wrapper').forEach(w => w.classList.remove('selected'));
    document.querySelectorAll('.node-container, #side-panel').forEach(n => n.remove());
    currentSelectedWrapper = null;
}

document.addEventListener('click', closeDetail);
window.addEventListener('resize', () => { if (currentSelectedWrapper) updatePanelPosition(); });
window.addEventListener('scroll', () => { if (!document.body.classList.contains('stop-scroll') && (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800)) renderBatch(); });
init();
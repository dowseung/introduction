const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let allRows = [], wordToSourceMap = {}, wordToBColumnMap = {}, wordToRowIndicesMap = {}, wordToColumnMap = {}, uniqueWordsList = [], wordCounts = {}, currentSelectedWrapper = null, currentFilterCol = null;

function preventDefaultScroll(e) {
    if (!e.target.closest('.node-container') && !e.target.closest('.side-column-sub') && !e.target.closest('.side-column-main')) { e.preventDefault(); }
}

async function init() {
    try {
        const res = await fetch(`${SHEET_URL}&cachebuster=${new Date().getTime()}`);
        const csvText = await res.text();
        Papa.parse(csvText, {
            header: false,
            complete: (results) => {
                const headerRow = results.data[0]; 
                allRows = results.data.slice(1);
                processData(allRows); 
                renderTopBar(headerRow); 
                renderBatch();
            }
        });
    } catch (err) { console.error("데이터 로드 실패", err); }
}

function renderTopBar(header) {
    const topBar = document.getElementById('top-bar');
    topBar.innerHTML = '';
    for (let i = 1; i <= 12; i++) {
        if (header[i]) {
            const item = document.createElement('div');
            item.className = 'top-bar-item';
            item.innerText = header[i];
            item.onclick = (e) => { 
                e.stopPropagation(); 
                // 필터 클릭 시 상세보기가 열려있다면 상세만 먼저 닫음
                if (currentSelectedWrapper) closeDetailOnly();
                toggleColumnFilter(i, item); 
            };
            topBar.appendChild(item);
        }
    }
}

function toggleColumnFilter(colIndex, element) {
    // 이미 같은 필터가 클릭되어 있다면 필터 초기화
    if (currentFilterCol === colIndex) {
        clearFilterState();
        return;
    }
    currentFilterCol = colIndex;
    document.querySelectorAll('.top-bar-item').forEach(it => it.classList.remove('active-b', 'active-other'));
    colIndex === 1 ? element.classList.add('active-b') : element.classList.add('active-other');
    document.getElementById('stream-container').classList.add('filtered');
    document.querySelectorAll('.word-wrapper').forEach(wrapper => {
        const word = wrapper.querySelector('.floating-text').innerText;
        wrapper.classList.remove('highlight', 'highlight-blue');
        if (wordToColumnMap[word] && wordToColumnMap[word].has(colIndex)) {
            wrapper.classList.add('highlight');
            if (colIndex === 1) wrapper.classList.add('highlight-blue');
        }
    });
}

// 순수하게 상단 필터만 초기화하는 함수
function clearFilterState() {
    currentFilterCol = null;
    document.getElementById('stream-container').classList.remove('filtered');
    document.querySelectorAll('.top-bar-item').forEach(it => it.classList.remove('active-b', 'active-other'));
    document.querySelectorAll('.word-wrapper').forEach(w => w.classList.remove('highlight', 'highlight-blue'));
}

function processData(rows) {
    wordCounts = {}; wordToSourceMap = {}; wordToBColumnMap = {}; wordToRowIndicesMap = {}; wordToColumnMap = {};
    rows.forEach((row, rowIndex) => {
        const aText = row[0], bText = row[1];
        for (let i = 1; i <= 12; i++) {
            const cell = row[i];
            if (!cell) continue;
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
                    if (!wordToColumnMap[word]) wordToColumnMap[word] = new Set();
                    wordToColumnMap[word].add(i);
                }
            });
        }
    });
    uniqueWordsList = Object.keys(wordCounts).sort((a, b) => b.length - a.length);
}

function renderBatch() {
    const container = document.getElementById('stream-container');
    container.innerHTML = '';
    const winWidth = window.innerWidth;
    [...uniqueWordsList].sort(() => Math.random() - 0.5).forEach(word => {
        const wrapper = document.createElement('div');
        wrapper.className = 'word-wrapper';
        const item = document.createElement('div');
        item.className = 'floating-text'; item.innerText = word;
        const baseSize = winWidth * 0.015;
        const fontSize = Math.min(Math.max(baseSize + (wordCounts[word] - 1) * 8, 24), 110);
        item.style.fontSize = `${fontSize}px`;
        wrapper.onclick = (e) => { e.stopPropagation(); toggleInteraction(wrapper, word); };
        wrapper.append(item); container.append(wrapper);
    });
}

function toggleInteraction(target, word) {
    // 상세 보기가 열려 있는 상태에서 해당 텍스트를 다시 클릭하면 상세만 닫힘 (필터는 유지)
    if (target.classList.contains('selected')) { 
        closeDetailOnly(); 
        return; 
    }
    closeDetailOnly();
    target.classList.add('selected');
    currentSelectedWrapper = target;
    document.getElementById('stream-container').classList.add('dimmed');
    document.body.classList.add('stop-scroll');
    window.addEventListener('wheel', preventDefaultScroll, { passive: false });
    window.addEventListener('touchmove', preventDefaultScroll, { passive: false });

    const nodeGroup = document.createElement('div');
    nodeGroup.className = 'node-container'; nodeGroup.id = 'active-panel';
    nodeGroup.onclick = (e) => e.stopPropagation(); 
    Array.from(wordToSourceMap[word]).forEach((text) => {
        const node = document.createElement('div');
        node.className = 'node-text';
        node.innerHTML = highlightKeywords(text);
        nodeGroup.appendChild(node);
    });
    document.body.appendChild(nodeGroup);
    updatePanelPosition();
}

function highlightKeywords(text) {
    let highlightedText = text;
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    uniqueWordsList.forEach(word => {
        if (word.length < 1) return;
        const regex = new RegExp(`(?<!<[^>]*)${escapeRegExp(word)}(?![^<]*>)`, 'g');
        highlightedText = highlightedText.replace(regex, 
            `<span class="keyword-link" onclick="handleKeywordClick(event, this, '${word.replace(/'/g, "\\'")}')"><span class="inner-text">${word}</span></span>`
        );
    });
    return highlightedText;
}

function handleKeywordClick(event, el, word) {
    event.stopPropagation();
    const isActive = el.classList.contains('active-keyword');
    document.querySelectorAll('.keyword-link.active-keyword').forEach(link => link.classList.remove('active-keyword'));
    if (isActive) {
        const side = document.getElementById('side-panel'); if (side) side.remove();
    } else {
        el.classList.add('active-keyword');
        showSidePanel(word);
    }
}

function showSidePanel(word) {
    const existing = document.getElementById('side-panel'); if (existing) existing.remove();
    const sidePanel = document.createElement('div');
    sidePanel.id = 'side-panel';
    sidePanel.onclick = (e) => e.stopPropagation();
    const mainColumn = document.createElement('div'); mainColumn.className = 'side-column-main';
    const subColumn = document.createElement('div'); subColumn.className = 'side-column-sub';
    subColumn.style.display = 'none';

    const winWidth = window.innerWidth;
    const activePanel = document.getElementById('active-panel');
    if (activePanel && winWidth > 768) {
        const rect = activePanel.getBoundingClientRect();
        if ((rect.left + rect.width / 2) < winWidth / 2) {
            sidePanel.style.right = '60px'; sidePanel.style.left = 'auto'; sidePanel.style.flexDirection = 'row-reverse';
        } else {
            sidePanel.style.left = '60px'; sidePanel.style.right = 'auto'; sidePanel.style.flexDirection = 'row';
        }
    }

    const handlePinkClick = (el, targetWord, clickedPinkItem) => {
        const isAlreadyActive = el.classList.contains('active-pink');
        document.querySelectorAll('.side-item-pink').forEach(item => item.classList.remove('active-pink'));
        subColumn.innerHTML = ''; subColumn.style.display = 'none';
        
        if (!isAlreadyActive) {
            el.classList.add('active-pink');
            const rowIndices = wordToRowIndicesMap[targetWord];
            const relatedWords = new Set();
            rowIndices.forEach(idx => {
                const row = allRows[idx];
                if (row[1] === clickedPinkItem) {
                    for (let i = 1; i <= 12; i++) { 
                        if (row[i]) row[i].toString().split('\n').forEach(w => { 
                            if(w.trim()) relatedWords.add(w.trim()); 
                        }); 
                    }
                }
            });

            if (relatedWords.size > 0) {
                subColumn.style.display = 'flex';
                const randomRelatedWords = Array.from(relatedWords).sort(() => Math.random() - 0.5);
                randomRelatedWords.forEach(w => {
                    const item = document.createElement('div'); 
                    item.className = 'side-item-red'; 
                    item.innerText = w;
                    item.onclick = (e) => {
                        e.stopPropagation();
                        window.open(`https://www.google.com/search?q=${encodeURIComponent(w)}`, '_blank');
                    };
                    subColumn.appendChild(item);
                });
            }
        }
    };

    const bTexts = wordToBColumnMap[word];
    if (bTexts) bTexts.forEach(text => {
        const item = document.createElement('div');
        item.className = 'side-item-pink'; item.innerText = text;
        item.onclick = (e) => { e.stopPropagation(); handlePinkClick(item, word, text); }; 
        mainColumn.appendChild(item);
    });
    sidePanel.appendChild(mainColumn); sidePanel.appendChild(subColumn);
    document.body.appendChild(sidePanel);
}

function updatePanelPosition() {
    const panel = document.getElementById('active-panel');
    if (!panel || !currentSelectedWrapper) return;
    const rect = currentSelectedWrapper.getBoundingClientRect();
    const winWidth = window.innerWidth;
    const padding = winWidth > 768 ? 60 : winWidth * 0.05;
    const boxWidth = Math.min(500, winWidth - (padding * 2));
    if (winWidth > 768) {
        let posX = (rect.left + rect.width / 2 < winWidth / 2) ? rect.left + rect.width + 40 : rect.left - boxWidth - 40;
        panel.style.left = `${Math.max(padding, Math.min(posX, winWidth - boxWidth - padding))}px`;
    } else {
        panel.style.left = `${padding}px`;
    }
}

// 상세창만 닫는 함수 (필터 상태는 건드리지 않음)
function closeDetailOnly() {
    document.body.classList.remove('stop-scroll');
    document.getElementById('stream-container').classList.remove('dimmed');
    document.querySelectorAll('.word-wrapper').forEach(w => w.classList.remove('selected'));
    document.querySelectorAll('.keyword-link').forEach(l => l.classList.remove('active-keyword'));
    document.querySelectorAll('.node-container, #side-panel').forEach(n => n.remove());
    currentSelectedWrapper = null;
    window.removeEventListener('wheel', preventDefaultScroll);
    window.removeEventListener('touchmove', preventDefaultScroll);
}

// 배경 클릭 시 실행되는 통합 초기화 함수
function resetAll() {
    // 1. 상세 보기가 열려 있다면 상세 보기만 닫고 종료 (필터 유지)
    if (currentSelectedWrapper) {
        closeDetailOnly();
        return;
    }
    // 2. 상세 보기가 없는 상태에서 클릭하면 상단 필터까지 모두 초기화
    clearFilterState();
}

document.addEventListener('click', resetAll);
window.addEventListener('resize', () => { if (currentSelectedWrapper) updatePanelPosition(); });
window.addEventListener('scroll', () => { if (!document.body.classList.contains('stop-scroll') && (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800)) renderBatch(); });
init();
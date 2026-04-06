const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let allRows = [], wordToSourceMap = {}, wordToBColumnMap = {}, wordToRowIndicesMap = {}, wordToColumnMap = {}, uniqueWordsList = [], wordCounts = {}, currentSelectedWrapper = null, currentFilterCol = null;

const bigOverlay = document.createElement('div');
bigOverlay.id = 'full-screen-overlay';
bigOverlay.innerHTML = '<div id="big-text-display"></div>';
document.body.appendChild(bigOverlay);

async function init() {
    try {
        const res = await fetch(`${SHEET_URL}&cachebuster=${new Date().getTime()}`);
        const csvText = await res.text();
        Papa.parse(csvText, { header: false, complete: (results) => {
            allRows = results.data.slice(1);
            processData(allRows); 
            renderTopBar(results.data[0]); 
            renderBatch();
        }});
    } catch (err) { console.error(err); }
}

function processData(rows) {
    wordCounts = {}; wordToSourceMap = {}; wordToBColumnMap = {}; wordToRowIndicesMap = {}; wordToColumnMap = {};
    rows.forEach((row, rowIndex) => {
        for (let i = 1; i <= 12; i++) {
            if (!row[i]) continue;
            row[i].toString().split('\n').forEach(line => {
                const word = line.trim();
                if (!word) return;
                wordCounts[word] = (wordCounts[word] || 0) + 1;
                if (!wordToSourceMap[word]) wordToSourceMap[word] = new Set();
                wordToSourceMap[word].add(row[0]);
                if (!wordToBColumnMap[word]) wordToBColumnMap[word] = new Set();
                if (row[1]) wordToBColumnMap[word].add(row[1]);
                if (!wordToRowIndicesMap[word]) wordToRowIndicesMap[word] = new Set();
                wordToRowIndicesMap[word].add(rowIndex);
                if (!wordToColumnMap[word]) wordToColumnMap[word] = new Set();
                wordToColumnMap[word].add(i);
            });
        }
    });
    uniqueWordsList = Object.keys(wordCounts).sort((a, b) => b.length - a.length);
}

// [기존] 상단 바 및 필터 로직
function renderTopBar(header) {
    const topBar = document.getElementById('top-bar');
    for (let i = 1; i <= 12; i++) {
        if (header[i]) {
            const item = document.createElement('div');
            item.className = 'top-bar-item';
            item.innerText = header[i];
            item.onclick = (e) => { e.stopPropagation(); if(currentSelectedWrapper) closeDetailOnly(); toggleColumnFilter(i, item); };
            topBar.appendChild(item);
        }
    }
}

function toggleColumnFilter(colIndex, element) {
    if (currentFilterCol === colIndex) { clearFilterState(); return; }
    currentFilterCol = colIndex;
    document.querySelectorAll('.top-bar-item').forEach(it => it.classList.remove('active-b', 'active-other'));
    element.classList.add(colIndex === 1 ? 'active-b' : 'active-other');
    document.getElementById('stream-container').classList.add('filtered');
    document.querySelectorAll('.word-wrapper').forEach(wrapper => {
        const word = wrapper.querySelector('.floating-text').innerText;
        wrapper.classList.remove('highlight', 'highlight-blue');
        if (wordToColumnMap[word]?.has(colIndex)) {
            wrapper.classList.add('highlight');
            if (colIndex === 1) wrapper.classList.add('highlight-blue');
        }
    });
}

// [기존] 스트림 렌더링 - 글자 크기 가변 로직 유지
function renderBatch() {
    const container = document.getElementById('stream-container');
    const winWidth = window.innerWidth;
    [...uniqueWordsList].sort(() => Math.random() - 0.5).forEach(word => {
        const wrapper = document.createElement('div');
        wrapper.className = 'word-wrapper';
        const item = document.createElement('div');
        item.className = 'floating-text'; item.innerText = word;
        const fontSize = Math.min(Math.max((winWidth * 0.015) + (wordCounts[word] - 1) * 8, 24), 110);
        item.style.fontSize = `${fontSize}px`;
        wrapper.onclick = (e) => { e.stopPropagation(); toggleInteraction(wrapper, word); };
        wrapper.append(item); container.append(wrapper);
    });
}

// [기존] 상세 노드 클릭 트리거 (핑크 패널은 여기서 나오지 않음!)
function toggleInteraction(target, word) {
    if (target.classList.contains('selected')) { closeDetailOnly(); return; }
    closeDetailOnly();
    target.classList.add('selected');
    currentSelectedWrapper = target;
    document.getElementById('stream-container').classList.add('dimmed');
    
    const panel = document.createElement('div');
    panel.className = 'node-container'; panel.id = 'active-panel';
    panel.onclick = (e) => e.stopPropagation();
    wordToSourceMap[word].forEach(text => {
        const node = document.createElement('div');
        node.className = 'node-text';
        node.innerHTML = highlightKeywords(text);
        panel.appendChild(node);
    });
    document.body.appendChild(panel);
    updatePanelPosition();
}

function highlightKeywords(text) {
    let html = text;
    uniqueWordsList.forEach(w => {
        const regex = new RegExp(`(?<!<[^>]*)${w}(?![^<]*>)`, 'g');
        html = html.replace(regex, `<span class="keyword-link" onclick="handleKeywordClick(event, this, '${w}')"><span class="inner-text">${w}</span></span>`);
    });
    return html;
}

// [기존/수정] 형광 초록 클릭 시에만 사이드 패널 호출
function handleKeywordClick(e, el, word) {
    e.stopPropagation();
    const isActive = el.classList.contains('active-keyword');
    document.querySelectorAll('.keyword-link').forEach(l => l.classList.remove('active-keyword'));
    
    if (isActive) {
        const side = document.getElementById('side-panel'); if (side) side.remove();
    } else {
        el.classList.add('active-keyword');
        showSidePanel(word);
    }
}

// [신규] 사이드 패널 및 회전 아이콘 로직
function showSidePanel(word) {
    const existing = document.getElementById('side-panel'); if (existing) existing.remove();
    const side = document.createElement('div'); side.id = 'side-panel';
    side.onclick = (e) => e.stopPropagation();
    const mainCol = document.createElement('div'); mainCol.className = 'side-column-main';
    const subCol = document.createElement('div'); subCol.className = 'side-column-sub'; subCol.style.display = 'none';

    wordToBColumnMap[word]?.forEach(text => {
        const container = document.createElement('div');
        container.className = 'side-item-pink';

        const label = document.createElement('span');
        label.innerText = text;
        label.onclick = (e) => { e.stopPropagation(); handlePinkClick(container, word, text, subCol); };

        const icon = document.createElement('div');
        icon.className = 'side-icon-graphic';
        icon.innerHTML = '<span></span><span></span><span></span>';
        
        icon.onclick = (e) => {
            e.stopPropagation();
            const isOpened = icon.classList.contains('active-rotate');
            
            // 다른 모든 회전 아이콘 초기화 (선택 사항: 현재 클릭한 것만 작동하도록 함)
            document.querySelectorAll('.side-icon-graphic').forEach(i => i.classList.remove('active-rotate'));
            
            if (isOpened) {
                // 재클릭 시: 회전 해제 및 오버레이 닫기
                bigOverlay.style.display = 'none';
            } else {
                // 클릭 시: 회전 고정 및 오버레이 열기
                icon.classList.add('active-rotate');
                const idx = Array.from(wordToRowIndicesMap[word]).find(i => allRows[i][1] === text);
                if (idx !== undefined) {
                    const display = document.getElementById('big-text-display');
                    display.innerText = allRows[idx][0];
                    bigOverlay.style.display = 'flex';
                    bigOverlay.scrollTo(0, 0);
                }
            }
        };

        container.append(label, icon); // 텍스트 좌측, 그래픽 우측 끝
        mainCol.appendChild(container);
    });
    side.append(mainCol, subCol);
    document.body.appendChild(side);
    updateSidePanelLayout(side);
}

function handlePinkClick(el, word, bText, sub) {
    const isActive = el.classList.contains('active-pink');
    document.querySelectorAll('.side-item-pink').forEach(i => i.classList.remove('active-pink'));
    sub.innerHTML = ''; sub.style.display = 'none';
    if (!isActive) {
        el.classList.add('active-pink');
        sub.style.display = 'flex';
        const rowIndices = wordToRowIndicesMap[word];
        const related = new Set();
        rowIndices.forEach(idx => {
            if(allRows[idx][1] === bText) {
                for(let i=1; i<=12; i++) if(allRows[idx][i]) allRows[idx][i].split('\n').forEach(v => related.add(v.trim()));
            }
        });
        related.forEach(v => {
            const r = document.createElement('div'); r.className = 'side-item-red'; r.innerText = v;
            r.onclick = (e) => { e.stopPropagation(); window.open(`https://www.google.com/search?q=${v}`); };
            sub.appendChild(r);
        });
    }
}

// [기존] 리셋 및 위치 보정 로직
function resetAll() {
    if (bigOverlay.style.display === 'flex') { 
        bigOverlay.style.display = 'none'; 
        document.querySelectorAll('.side-icon-graphic').forEach(i => i.classList.remove('active-rotate'));
        return; 
    }
    if (currentSelectedWrapper) { closeDetailOnly(); return; }
    clearFilterState();
}

function closeDetailOnly() {
    document.getElementById('stream-container').classList.remove('dimmed');
    document.querySelectorAll('.word-wrapper').forEach(w => w.classList.remove('selected'));
    document.querySelectorAll('.node-container, #side-panel').forEach(n => n.remove());
    bigOverlay.style.display = 'none';
    currentSelectedWrapper = null;
}

function clearFilterState() {
    currentFilterCol = null;
    document.getElementById('stream-container').classList.remove('filtered');
    document.querySelectorAll('.top-bar-item').forEach(it => it.classList.remove('active-b', 'active-other'));
    document.querySelectorAll('.word-wrapper').forEach(w => w.classList.remove('highlight', 'highlight-blue'));
}

function updatePanelPosition() {
    const panel = document.getElementById('active-panel');
    if (!panel || !currentSelectedWrapper) return;
    const rect = currentSelectedWrapper.getBoundingClientRect();
    const winWidth = window.innerWidth;
    if (winWidth > 768) {
        let posX = (rect.left + rect.width / 2 < winWidth / 2) ? rect.left + rect.width + 40 : rect.left - 490;
        panel.style.left = `${Math.max(60, Math.min(posX, winWidth - 510))}px`;
    } else { panel.style.left = `5%`; }
}

function updateSidePanelLayout(side) {
    const winWidth = window.innerWidth;
    const activePanel = document.getElementById('active-panel');
    if (activePanel && winWidth > 768) {
        const rect = activePanel.getBoundingClientRect();
        if ((rect.left + rect.width / 2) < winWidth / 2) {
            side.style.right = '60px'; side.style.left = 'auto'; side.style.flexDirection = 'row-reverse';
        } else { side.style.left = '60px'; side.style.right = 'auto'; side.style.flexDirection = 'row'; }
    }
}

document.addEventListener('click', resetAll);
init();
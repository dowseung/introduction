const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let wordToSourceMap = {}; 
let uniqueWordsList = [];
let wordCounts = {};
let currentSelectedWrapper = null;
let scrollPos = 0; // 스크롤 위치 저장용

async function init() {
    try {
        const res = await fetch(`${SHEET_URL}&cachebuster=${new Date().getTime()}`);
        const csvText = await res.text();
        Papa.parse(csvText, {
            header: false,
            complete: (results) => {
                processData(results.data.slice(1));
                document.fonts.ready.then(() => {
                    renderBatch();
                    renderBatch();
                });
            }
        });
    } catch (err) { console.error("데이터 로드 실패", err); }
}

function processData(rows) {
    wordCounts = {}; wordToSourceMap = {};
    rows.forEach(row => {
        const sourceText = row[0];
        row.slice(1, -1).forEach(cell => {
            if (!cell) return;
            cell.toString().split('\n').forEach(line => {
                const word = line.trim();
                if (word.length > 0) {
                    wordCounts[word] = (wordCounts[word] || 0) + 1;
                    if (!wordToSourceMap[word]) wordToSourceMap[word] = new Set();
                    wordToSourceMap[word].add(sourceText);
                }
            });
        });
    });
    uniqueWordsList = Object.keys(wordCounts);
}

function renderBatch() {
    const container = document.getElementById('stream-container');
    const winWidth = window.innerWidth;
    let words = [...uniqueWordsList].sort(() => Math.random() - 0.5);

    words.forEach(word => {
        const wrapper = document.createElement('div');
        wrapper.className = 'word-wrapper';
        const item = document.createElement('div');
        item.className = 'floating-text';
        item.innerText = word;

        const fontSize = Math.min(Math.max((winWidth * 0.02) + (wordCounts[word] - 1) * 10, 28), 110);
        item.style.fontSize = `${fontSize}px`;
        const marginTop = 25 + (fontSize * -0.28);
        item.style.marginTop = `${marginTop}px`; 
        item.style.paddingBottom = `${fontSize * 0.15}px`;

        wrapper.onclick = (e) => {
            e.stopPropagation();
            toggleInteraction(wrapper, word);
        };

        wrapper.appendChild(item);
        container.appendChild(wrapper);
    });
}

function toggleInteraction(target, word) {
    if (target.classList.contains('selected')) {
        closeDetail();
        return;
    }

    // 초기화
    document.querySelectorAll('.node-container').forEach(n => n.remove());
    document.querySelectorAll('.word-wrapper').forEach(w => w.classList.remove('selected'));

    // [핵심] 스크롤 위치 고정
    scrollPos = window.pageYOffset;
    document.body.style.top = `-${scrollPos}px`;
    document.body.classList.add('stop-scroll');

    target.classList.add('selected');
    currentSelectedWrapper = target;
    document.getElementById('stream-container').classList.add('dimmed');

    const nodeGroup = document.createElement('div');
    nodeGroup.className = 'node-container';
    nodeGroup.id = 'active-panel';
    nodeGroup.onclick = (e) => e.stopPropagation();
    document.body.appendChild(nodeGroup);

    const sources = Array.from(wordToSourceMap[word]);
    sources.forEach((text, i) => {
        const node = document.createElement('div');
        node.className = 'node-text';
        node.innerText = text;
        nodeGroup.appendChild(node);
    });

    updatePanelPosition();
}

function updatePanelPosition() {
    const panel = document.getElementById('active-panel');
    if (!panel || !currentSelectedWrapper) return;

    const winWidth = window.innerWidth;
    const rect = currentSelectedWrapper.getBoundingClientRect();
    const boxWidth = Math.min(500, winWidth * 0.7);
    
    let posX;
    if (rect.left + rect.width / 2 < winWidth / 2) {
        posX = rect.left + rect.width + 40;
        if (posX + boxWidth > winWidth - 40) posX = winWidth - boxWidth - 40;
    } else {
        posX = rect.left - boxWidth - 40;
        if (posX < 60) posX = 60;
    }

    panel.style.left = `${Math.max(20, posX)}px`;
    panel.style.maxWidth = `${winWidth * 0.8}px`;
}

function closeDetail() {
    const body = document.body;
    if (body.classList.contains('stop-scroll')) {
        body.classList.remove('stop-scroll');
        body.style.top = '';
        window.scrollTo(0, scrollPos); // 원래 위치로 복구
    }
    
    document.getElementById('stream-container').classList.remove('dimmed');
    document.querySelectorAll('.word-wrapper').forEach(w => w.classList.remove('selected'));
    document.querySelectorAll('.node-container').forEach(n => n.remove());
    currentSelectedWrapper = null;
}

document.addEventListener('click', closeDetail);

window.addEventListener('resize', () => {
    if (currentSelectedWrapper) {
        updatePanelPosition();
    }
});

window.addEventListener('scroll', () => {
    if (!document.body.classList.contains('stop-scroll')) {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) renderBatch();
    }
});

init();
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let wordToSourceMap = {}; 
let uniqueWordsList = [];
let wordCounts = {};

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

        // [수정] 기본 화면 텍스트 크기 전반적으로 키움
        // 최소 20px, 가중치 증가
        const fontSize = Math.min(Math.max((winWidth * 0.018) + (wordCounts[word] - 1) * 10, 20), 100);
        item.style.fontSize = `${fontSize}px`;
        item.style.marginTop = `-${fontSize * 0.18}px`; // 상단 시각 보정

        wrapper.onclick = (e) => {
            e.stopPropagation();
            toggleInteraction(wrapper, word);
        };

        wrapper.appendChild(item);
        container.appendChild(wrapper);
    });
}

function toggleInteraction(target, word) {
    const container = document.getElementById('stream-container');
    const body = document.body;
    const winWidth = window.innerWidth;

    document.querySelectorAll('.node-container').forEach(n => n.remove());
    body.classList.remove('stop-scroll');

    if (target.classList.contains('selected')) {
        target.classList.remove('selected');
        container.classList.remove('dimmed');
        return;
    }

    document.querySelectorAll('.word-wrapper').forEach(w => w.classList.remove('selected'));
    target.classList.add('selected');
    container.classList.add('dimmed');
    body.classList.add('stop-scroll'); 

    const rect = target.getBoundingClientRect();
    const sources = Array.from(wordToSourceMap[word]);
    const nodeGroup = document.createElement('div');
    nodeGroup.className = 'node-container';
    
    nodeGroup.onclick = (e) => e.stopPropagation();
    document.body.appendChild(nodeGroup);

    const boxWidth = Math.min(500, winWidth * 0.85);
    let posX;

    if (rect.left + rect.width / 2 < winWidth / 2) {
        posX = Math.min(winWidth - boxWidth - 60, rect.left + rect.width + 40);
    } else {
        posX = Math.max(60, rect.left - boxWidth - 40);
    }

    if (winWidth < 768) posX = 30;
    nodeGroup.style.left = `${posX}px`;

    sources.forEach((text, i) => {
        const node = document.createElement('div');
        node.className = 'node-text';
        node.innerText = text;
        node.style.animationDelay = `${i * 0.08}s`;
        nodeGroup.appendChild(node);
    });
}

document.addEventListener('click', () => {
    document.body.classList.remove('stop-scroll');
    document.getElementById('stream-container').classList.remove('dimmed');
    document.querySelectorAll('.word-wrapper').forEach(w => w.classList.remove('selected'));
    document.querySelectorAll('.node-container').forEach(n => n.remove());
});

window.addEventListener('scroll', () => {
    if (!document.body.classList.contains('stop-scroll')) {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) renderBatch();
    }
});

init();
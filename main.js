const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let wordToSourceMap = {}; 
let uniqueWordsList = [];
let wordCounts = {};
let currentSelectedWrapper = null;

// 배경 스크롤 물리 차단 함수
function preventDefaultScroll(e) {
    if (!e.target.closest('.node-container')) {
        e.preventDefault();
    }
}

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
    // 긴 단어부터 치환하기 위해 길이순 정렬
    uniqueWordsList = Object.keys(wordCounts).sort((a, b) => b.length - a.length);
}

// 텍스트 내 키워드를 찾아 span 태그로 감싸는 함수
function highlightKeywords(text) {
    let highlightedText = text;
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    uniqueWordsList.forEach(word => {
        if (word.length < 1) return;
        const escapedWord = escapeRegExp(word);
        // 이미 태그가 씌워진 단어는 건너뛰는 정규식
        const regex = new RegExp(`(?<!<[^>]*)${escapedWord}(?![^<]*>)`, 'g');
        highlightedText = highlightedText.replace(regex, `<span class="keyword-link">${word}</span>`);
    });
    return highlightedText;
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
        
        // 언어별 상단 정렬 보정
        const isEnglishOrNumber = /^[A-Za-z0-9]/.test(word);
        const correctionFactor = isEnglishOrNumber ? 0.315 : 0.295;
        
        const marginTop = 25 - (fontSize * correctionFactor); 
        item.style.marginTop = `${marginTop}px`; 
        item.style.paddingBottom = `${fontSize * 0.12}px`;

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

    document.querySelectorAll('.node-container').forEach(n => n.remove());
    document.querySelectorAll('.word-wrapper').forEach(w => w.classList.remove('selected'));

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollBarWidth}px`);
    document.body.classList.add('stop-scroll');

    window.addEventListener('wheel', preventDefaultScroll, { passive: false });
    window.addEventListener('touchmove', preventDefaultScroll, { passive: false });

    target.classList.add('selected');
    currentSelectedWrapper = target;
    document.getElementById('stream-container').classList.add('dimmed');

    const nodeGroup = document.createElement('div');
    nodeGroup.className = 'node-container';
    nodeGroup.id = 'active-panel';
    nodeGroup.onclick = (e) => e.stopPropagation();
    document.body.appendChild(nodeGroup);

    const sources = Array.from(wordToSourceMap[word]);
    sources.forEach((text) => {
        const node = document.createElement('div');
        node.className = 'node-text';
        // 하이라이트 로직 적용 후 삽입
        node.innerHTML = highlightKeywords(text);
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
    document.body.classList.remove('stop-scroll');
    window.removeEventListener('wheel', preventDefaultScroll);
    window.removeEventListener('touchmove', preventDefaultScroll);
    
    document.getElementById('stream-container').classList.remove('dimmed');
    document.querySelectorAll('.word-wrapper').forEach(w => w.classList.remove('selected'));
    document.querySelectorAll('.node-container').forEach(n => n.remove());
    currentSelectedWrapper = null;
}

document.addEventListener('click', closeDetail);

window.addEventListener('resize', () => {
    if (currentSelectedWrapper) updatePanelPosition();
});

window.addEventListener('scroll', () => {
    if (!document.body.classList.contains('stop-scroll')) {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) renderBatch();
    }
});

init();
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let uniqueWordsList = []; 
let wordCounts = {}; 

async function init() {
    try {
        const res = await fetch(`${SHEET_URL}&cachebuster=${new Date().getTime()}`);
        const csvText = await res.text();
        
        Papa.parse(csvText, {
            header: false,
            complete: (results) => {
                const rows = results.data.slice(1);
                processData(rows);
                document.fonts.ready.then(() => {
                    // 무한 스크롤 초기 분량 확보를 위해 2회 실행
                    renderBatch();
                    renderBatch();
                });
            }
        });
    } catch (err) {
        console.error("데이터 로드 실패", err);
    }
}

function processData(rows) {
    wordCounts = {};
    rows.forEach(row => {
        const middleCells = row.slice(1, -1); 
        middleCells.forEach(cell => {
            if (!cell) return;
            const lines = cell.toString().split('\n');
            lines.forEach(line => {
                const word = line.trim();
                if (word.length > 0) wordCounts[word] = (wordCounts[word] || 0) + 1;
            });
        });
    });
    uniqueWordsList = Object.keys(wordCounts);
}

function renderBatch() {
    const container = document.getElementById('stream-container');
    const winWidth = window.innerWidth;

    // 무작위 셔플
    let words = [...uniqueWordsList];
    for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
    }

    words.forEach(word => {
        const count = wordCounts[word];
        const wrapper = document.createElement('div');
        wrapper.className = 'word-wrapper';
        
        const item = document.createElement('div');
        item.className = 'floating-text';
        item.innerText = word;

        // 전체적으로 축소된 텍스트 크기 로직
        const isMobile = winWidth < 768;
        const baseSizeFactor = isMobile ? 0.03 : 0.012; 
        const responsiveBase = (winWidth * baseSizeFactor) + 10;
        const step = isMobile ? 4 : 8; 
        
        // 정갈한 크기 (최소 14px, 최대 70px)
        const fontSize = Math.min(Math.max(responsiveBase + (count - 1) * step, 14), 70);
        item.style.fontSize = `${fontSize}px`;

        /**
         * [시각적 상단선 정밀 보정]
         * 폰트 크기가 커질수록 자동으로 늘어나는 상단 여백을 상쇄합니다.
         * fontSize * 0.18 만큼 위로 강제 인양하여 
         * 모든 글자의 실질적 머리 부분이 라인으로부터 동일한 거리에 위치하게 합니다.
         */
        const visualAdjustment = fontSize * 0.18; 
        item.style.marginTop = `-${visualAdjustment}px`;

        // 8단어 너비 제한 (모바일 5단어)
        const limitCount = isMobile ? 5 : 8;
        wrapper.style.maxWidth = `min(${fontSize * 4.5 * limitCount}px, calc(100vw - 120px))`;

        wrapper.appendChild(item);
        container.appendChild(wrapper);
    });
}

// 무한 스크롤 이벤트
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) {
        renderBatch();
    }
});

// 리사이즈 시 초기화 및 재구성
window.addEventListener('resize', () => {
    clearTimeout(window.rt);
    window.rt = setTimeout(() => {
        document.getElementById('stream-container').innerHTML = "";
        renderBatch();
        renderBatch();
    }, 200);
});

init();
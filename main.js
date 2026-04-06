const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

async function init() {
    try {
        const res = await fetch(`${SHEET_URL}&cachebuster=${new Date().getTime()}`);
        const csvText = await res.text();
        
        Papa.parse(csvText, {
            header: false,
            complete: (results) => {
                const rows = results.data.slice(1);
                document.fonts.ready.then(() => processAndRender(rows));
            }
        });
    } catch (err) {
        console.error("데이터 로드 실패", err);
    }
}

function processAndRender(rows) {
    const container = document.getElementById('stream-container');
    container.innerHTML = ""; 

    const wordCounts = {}; 
    const winWidth = window.innerWidth;
    const maxAvailableWidth = winWidth - 120; 

    rows.forEach(row => {
        const middleCells = row.slice(1, -1); 
        middleCells.forEach(cell => {
            if (!cell) return;
            const lines = cell.toString().split('\n');
            lines.forEach(line => {
                const word = line.trim();
                if (word.length > 0) {
                    wordCounts[word] = (wordCounts[word] || 0) + 1;
                }
            });
        });
    });

    let uniqueWords = Object.keys(wordCounts);

    // 랜덤 셔플
    for (let i = uniqueWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniqueWords[i], uniqueWords[j]] = [uniqueWords[j], uniqueWords[i]];
    }

    uniqueWords.forEach(word => {
        const count = wordCounts[word];
        const item = document.createElement('div');
        item.className = 'floating-text';
        item.innerText = word;

        const isSmall = winWidth <= 768;
        const step = isSmall ? 8 : 16; 
        const baseSize = isSmall ? 18 : 24;
        const fontSize = baseSize + (count - 1) * step;
        
        item.style.fontSize = `${fontSize}px`;

        // --- [시각적 상단 정렬 보정] ---
        // 큰 글자일수록 폰트 자체의 상단 여백이 커지므로, 
        // 폰트 크기에 비례하여 아주 살짝 위로(- margin) 끌어올립니다.
        const correction = (fontSize * 0.12); // 폰트 크기의 약 12% 보정
        item.style.marginTop = `-${correction}px`;
        // 하단 간격이 좁아지는 것을 막기 위해 하단 마진은 다시 확보
        item.style.marginBottom = `${correction}px`;

        // 8단어 제한 및 창 밖 이탈 방지
        const wordsArray = word.split(/\s+/);
        if (wordsArray.length > 8) {
            const limitWidth = fontSize * 4.2 * 8; 
            item.style.maxWidth = `${Math.min(limitWidth, maxAvailableWidth)}px`;
        } else {
            item.style.maxWidth = `${maxAvailableWidth}px`;
        }

        container.appendChild(item);
    });
}

window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(init, 250);
});

init();
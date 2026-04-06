const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

let placedRects = []; 

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
        console.error("로드 실패", err);
    }
}

function processAndRender(rows) {
    const container = document.getElementById('stream-container');
    container.innerHTML = ""; 
    placedRects = []; 

    const wordCounts = {}; 
    const winWidth = window.innerWidth;

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

    const uniqueWords = Object.keys(wordCounts);
    
    // 데이터 양에 따라 높이를 넉넉히 설정 (겹침 방지 공간 확보)
    container.style.height = `${Math.max(100, uniqueWords.length * 7)}vh`;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    uniqueWords.forEach(word => {
        const count = wordCounts[word];
        const item = document.createElement('div');
        item.className = 'floating-text';
        item.innerText = word;

        const isSmall = winWidth <= 768;
        const step = isSmall ? 8 : 16; 
        const baseSize = isSmall ? 18 : 24;
        item.style.fontSize = `${baseSize + (count - 1) * step}px`;

        // 좌표 계산을 위해 임시 렌더링
        item.style.visibility = 'hidden';
        container.appendChild(item);
        
        const w = item.offsetWidth;
        const h = item.offsetHeight;

        let foundPosition = false;
        let attempts = 0;
        let x = 0, y = 0;

        // 1000번 시도하여 안전한 좌표 찾기
        while (!foundPosition && attempts < 1000) {
            // [중요] (전체 너비 - 글자 너비) 안에서만 x 좌표 생성
            // 좌우 안전 여백 10px씩 확보
            const maxX = containerWidth - w - 20;
            const maxY = containerHeight - h - 20;

            if (maxX > 0 && maxY > 0) {
                x = Math.random() * maxX + 10;
                y = Math.random() * maxY + 10;

                if (!checkCollision(x, y, w, h)) {
                    foundPosition = true;
                }
            } else {
                // 글자가 화면보다 크면 그냥 맨 왼쪽에 배치 (CSS의 max-width가 해결)
                x = 10;
                y = Math.random() * (containerHeight - h - 20) + 10;
                foundPosition = true;
            }
            attempts++;
        }

        if (foundPosition) {
            item.style.left = `${x}px`;
            item.style.top = `${y}px`;
            item.style.visibility = 'visible';
            placedRects.push({ x, y, w, h });
        } else {
            container.removeChild(item);
        }
    });
}

function checkCollision(x, y, w, h) {
    const padding = 0.5; 
    for (const rect of placedRects) {
        if (
            x < rect.x + rect.w + padding &&
            x + w + padding > rect.x &&
            y < rect.y + rect.h + padding &&
            y + h + padding > rect.y
        ) return true;
    }
    return false;
}

window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(init, 250);
});

init();
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

async function init() {
    try {
        // 실시간 반영을 위해 타임스탬프 추가
        const res = await fetch(`${SHEET_URL}&cachebuster=${new Date().getTime()}`);
        const csvText = await res.text();
        
        Papa.parse(csvText, {
            header: false,
            complete: (results) => {
                // 1행(헤더)을 제외하고 데이터 추출
                const rows = results.data.slice(1);
                renderStream(rows);
            }
        });
    } catch (err) {
        console.error("데이터 로드 실패", err);
    }
}

function renderStream(rows) {
    const container = document.getElementById('stream-container');
    container.innerHTML = ""; 

    rows.forEach(row => {
        // 오직 1열(index 0)의 텍스트만 가져옵니다.
        let mainText = (row[0] || "").toString().replace(/-/g, "").trim();
        
        // 데이터가 비어있으면 건너뜁니다.
        if (!mainText) return;

        const item = document.createElement('div');
        item.className = 'floating-text';
        
        // 빨간색 강조 없이 순수 텍스트만 삽입합니다.
        item.innerText = mainText; 

        // 가로 위치 랜덤 배치 (0% ~ 55%)
        const randomLeft = Math.random() * 55;
        item.style.marginLeft = `${randomLeft}%`;

        // 세로 간격 랜덤 배치 (50px ~ 150px)
        const randomMarginTop = Math.random() * 100 + 50;
        item.style.marginTop = `${randomMarginTop}px`;

        // 부유 애니메이션 속도 랜덤화
        const duration = Math.random() * 5 + 4;
        item.style.animation = `sway ${duration}s infinite alternate ease-in-out`;

        container.appendChild(item);
    });
}

init();
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

async function init() {
    try {
        const res = await fetch(SHEET_URL);
        const csvText = await res.text();
        
        Papa.parse(csvText, {
            header: true,
            complete: (results) => {
                renderCards(results.data);
            }
        });
    } catch (err) {
        console.error("데이터 로드 실패", err);
    }
}

function renderCards(data) {
    const container = document.getElementById('card-container');
    
    // 시트의 각 행(row)을 순회하며 카드 생성
    container.innerHTML = data.map(item => `
        <article class="card">
            <img src="${item.imageUrl || 'https://via.placeholder.com/300'}" alt="이미지">
            <div class="card-content">
                <span class="category">${item.category}</span>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <a href="${item.link}" target="_blank" style="color: #4a90e2; text-decoration: none; font-weight: bold;">자세히 보기 →</a>
            </div>
        </article>
    `).join('');
}

init();
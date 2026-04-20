// 스프레드 시트 CSV 내보내기 URL (N열 제외 로직 포함)
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

async function initSpreadsheetKeywords() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const data = await response.text();
        
        // 1행 데이터 추출 (CSV의 첫 줄)
        const rows = data.split('\n');
        const firstRow = rows[0].split(',');

        // N열(14번째 열, 인덱스 13) 제외하고 키워드 추출
        const keywords = firstRow.filter((item, index) => index !== 13 && item.trim() !== "");

        applyKeywordsToText(keywords);
    } catch (error) {
        console.error("스프레드 시트 로드 실패:", error);
    }
}

function applyKeywordsToText(keywords) {
    const textElement = document.querySelector('.intro-text');
    if (!textElement) return;

    let content = textElement.innerHTML;

    // 1. 키워드 치환 (정규식 사용)
    keywords.forEach(keyword => {
        if (keyword.trim() === "") return;
        // 단어 주위에 이미 span이 쳐져 있지 않은 경우에만 치환 (중복 방지)
        const regex = new RegExp(`(${keyword.trim()})`, 'g');
        content = content.replace(regex, `<span class="keyword">$1</span>`);
    });

    textElement.innerHTML = content;

    // 2. 마우스 호버 이벤트 추가
    const spanKeywords = document.querySelectorAll('.keyword');
    spanKeywords.forEach(el => {
        el.addEventListener('mouseenter', () => {
            el.classList.add('highlight');
        });
        el.addEventListener('mouseleave', () => {
            el.classList.remove('highlight');
        });
    });

    // 텍스트 구조가 변했으므로 레이아웃 재계산
    adjustFontSize();
}

// 초기 실행 로직 수정
window.addEventListener('load', () => {
    initSpreadsheetKeywords(); // 키워드 먼저 적용
    if (document.fonts) {
        document.fonts.ready.then(adjustFontSize);
    }
});

window.addEventListener('resize', () => {
    requestAnimationFrame(adjustFontSize);
});

function adjustFontSize() {
    const container = document.getElementById('landing-page');
    const text = document.querySelector('.intro-text');
    if (!text || !container) return;

    const style = window.getComputedStyle(container);
    const paddingLeft = parseFloat(style.paddingLeft);
    const paddingRight = parseFloat(style.paddingRight);
    // 1. 실제 사용 가능한 영역 (상하좌우 여유분 제외)
    const maxWidth = (container.clientWidth - paddingLeft - paddingRight) * 0.98;
    const maxHeight = container.clientHeight * 0.95;

    // 2. 초기 폰트 사이즈 설정
    // 행간이 넓어졌으므로 세로 비중(sizeByHeight)을 0.18에서 0.15로 하향 조정하여 
    // 처음부터 잘리는 현상을 방지합니다.
    const sizeByWidth = window.innerWidth * 0.12; 
    const sizeByHeight = window.innerHeight * 0.15; 
    
    let fontSize = Math.min(sizeByWidth, sizeByHeight);
    text.style.fontSize = fontSize + "px";

    // 3. 실시간 보정
    let currentHeight = text.offsetHeight;
    let currentWidth = text.offsetWidth;

    // 너비나 높이가 경계선에 닿으면 즉시 비율에 맞춰 꽉 맞춤
    if (currentHeight > maxHeight || currentWidth > maxWidth) {
        const ratioH = maxHeight / currentHeight;
        const ratioW = maxWidth / currentWidth;
        
        // 더 좁은 쪽에 맞춰 폰트 크기 결정
        fontSize = fontSize * Math.min(ratioH, ratioW);
        text.style.fontSize = fontSize + "px";
    } 
    // 창이 커졌을 때 글자가 너무 작게 남지 않도록 다시 키워주는 로직
    else {
        const ratioH = maxHeight / currentHeight;
        const ratioW = maxWidth / currentWidth;
        const potentialIncrease = Math.min(ratioH, ratioW);
        
        // 95% 이상 차지하지 않을 때만 크기를 키움
        if (potentialIncrease > 1.05) {
            fontSize = fontSize * potentialIncrease * 0.98;
            text.style.fontSize = fontSize + "px";
        }
    }

    text.style.opacity = "1";
}

// 리사이즈 시 실시간 반영
window.addEventListener('resize', () => {
    requestAnimationFrame(adjustFontSize);
});

// 초기화
window.addEventListener('load', adjustFontSize);
if (document.fonts) {
    document.fonts.ready.then(adjustFontSize);
}

adjustFontSize();
async function typeWriter(element, text, speed = 30) {
    element.innerText = '';
    element.style.opacity = '1';
    for (let i = 0; i < text.length; i++) {
        element.innerText += text.charAt(i);
        await new Promise(res => setTimeout(res, speed));
    }
}

function adjustFontSize() {
    const container = document.getElementById('landing-page');
    const text = document.querySelector('.intro-text');
    if (!text || !container) return;
    const style = window.getComputedStyle(container);
    const maxWidth = container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const maxHeight = container.clientHeight - 420;
    const baseFontSize = 100;
    const v = document.createElement('div');
    v.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:${maxWidth}px;font-size:${baseFontSize}px;line-height:${style.lineHeight};font-family:${style.fontFamily};font-weight:${style.fontWeight};white-space:pre-wrap;word-break:keep-all;`;
    v.innerText = text.innerText;
    document.body.appendChild(v);
    const ratio = Math.min(maxWidth / v.offsetWidth, maxHeight / v.offsetHeight);
    const finalSize = Math.min(Math.max(Math.floor(baseFontSize * ratio), 25), 55);
    document.body.removeChild(v);
    text.style.fontSize = finalSize + 'px';
}

window.addEventListener('load', async () => {
    const textElement = document.querySelector('.intro-text');
    if (!textElement) return;

    const originalText = textElement.innerText.trim();

    if (document.fonts) await document.fonts.ready;
    adjustFontSize();
    await typeWriter(textElement, originalText, 30);

    // 타이핑 가능한 영역 - 자동타이핑 텍스트 바로 아래
    const userInput = document.createElement('p');
    userInput.contentEditable = 'true';
    userInput.style.cssText = `
        margin: 0;
        padding: 0;
        white-space: pre-wrap;
        word-break: keep-all;
        width: 100%;
        font-weight: 900;
        line-height: 1.35;
        outline: none;
        caret-color: #000;
        font-size: ${textElement.style.fontSize};
        font-family: inherit;
        min-height: 1.35em;
    `;
    document.getElementById('landing-page').appendChild(userInput);
    userInput.focus();

    // 공유 버튼 - 우측 하단 크게
    const shareBtn = document.createElement('div');
    shareBtn.style.cssText = `
        position: fixed;
        bottom: 40px;
        right: 55px;
        cursor: pointer;
        opacity: 1;
        transition: opacity 0.2s ease;
        z-index: 100;
        line-height: 0;
    `;
    shareBtn.innerHTML = `<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>`;
    shareBtn.addEventListener('mouseenter', () => { shareBtn.style.opacity = '0.3'; });
    shareBtn.addEventListener('mouseleave', () => { shareBtn.style.opacity = '1'; });
    shareBtn.addEventListener('click', async () => {
        const text = userInput.innerText || '';
        if (navigator.share) {
            try { await navigator.share({ text }); } catch(e) {}
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            alert('클립보드에 복사되었습니다.');
        }
    });
    document.body.appendChild(shareBtn);
});

window.addEventListener('resize', () => {
    requestAnimationFrame(adjustFontSize);
});
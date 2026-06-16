function scrollThenDo(fn) {
    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY < 80) {
        fn();
        return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const check = setInterval(() => {
        if ((window.scrollY || window.pageYOffset) < 10) {
            clearInterval(check);
            fn();
        }
    }, 50);
    setTimeout(() => { clearInterval(check); fn(); }, 1000);
}

function initBannerDropdown() {
    const bannerOf = document.querySelector('#site-banner span:nth-child(2)');
    if (!bannerOf) return;

    document.getElementById('banner-dropdown')?.remove();

    const pages = [
        { label: 'READ SCROLL CHANGE' },
        { label: 'FILL IN THE BLANK' },
        { label: 'HOVER AND CLICK' },
        { label: 'DESIGNER NAME JOB...' },
        { label: 'WHOSE?' },
        { label: 'WRITE YOUR OWN' },
    ];

    const dropdown = document.createElement('div');
    dropdown.id = 'banner-dropdown';
    dropdown.style.cssText = `
        position: fixed;
        top: 32px;
        left: calc(50% + 12.5%);
        display: none;
        flex-direction: column;
        padding-top: 4px;
        z-index: 200;
        pointer-events: auto;
    `;

    pages.forEach(pg => {
        const item = document.createElement('span');
        item.textContent = pg.label;
        item.style.cssText = `
            display: block;
            font-family: 'LatinThin', "Helvetica Neue", "Helvetica", sans-serif;
            font-size: 14px;
            font-weight: 900;
            color: #C5A028;
            cursor: pointer;
            line-height: 2;
            white-space: nowrap;
            letter-spacing: 0.05em;
        `;
        item.addEventListener('mouseenter', () => { item.style.textDecoration = 'underline'; });
        item.addEventListener('mouseleave', () => { item.style.textDecoration = 'none'; });
        item.addEventListener('click', () => {
            dropdown.style.display = 'none';
            scrollThenDo(() => {
                if (pg.label === 'READ SCROLL CHANGE') {
                    window.location.href = 'bio.html';
                } else if (pg.label === 'FILL IN THE BLANK') {
                    window.location.href = 'bio.html#fillinblank';
                } else if (pg.label === 'HOVER AND CLICK') {
                    window.location.href = 'bio.html#hoverandclick';
                } else if (pg.label === 'DESIGNER NAME JOB...') {
                    window.location.href = 'bio.html#collist';
                } else if (pg.label === 'WHOSE?') {
                    window.location.href = 'bio.html#whose';
                } else if (pg.label === 'WRITE YOUR OWN') {
                    window.location.href = 'end.html';
                }
            });
        });
        dropdown.appendChild(item);
    });

    document.body.appendChild(dropdown);

    bannerOf.style.cursor = 'pointer';
    bannerOf.style.transition = 'color 0.2s ease';
    bannerOf.style.pointerEvents = 'auto';

    let hideTimer = null;

    bannerOf.addEventListener('mouseenter', () => {
        clearTimeout(hideTimer);
        bannerOf.style.color = '#FF00FF';
        dropdown.style.display = 'flex';
    });
    bannerOf.addEventListener('mouseleave', () => {
        hideTimer = setTimeout(() => {
            bannerOf.style.color = '';
            dropdown.style.display = 'none';
        }, 100);
    });
    dropdown.addEventListener('mouseenter', () => {
        clearTimeout(hideTimer);
    });
    dropdown.addEventListener('mouseleave', () => {
        hideTimer = setTimeout(() => {
            bannerOf.style.color = '';
            dropdown.style.display = 'none';
        }, 100);
    });
}

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
    textElement.style.color = '#00FF00';
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

    // 배너 pointer-events 활성화 및 드롭다운 초기화
    const siteBanner = document.getElementById('site-banner');
    if (siteBanner) siteBanner.style.pointerEvents = 'auto';
    initBannerDropdown();
});

window.addEventListener('resize', () => {
    requestAnimationFrame(adjustFontSize);
});
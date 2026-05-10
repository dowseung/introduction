const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5ik6NBgUmc8yqJU0ZGStIv7BKToWATo5oj6pooV8KBHz_CTPwbORSdT93aF59rqEO_ENXdmEkUxXL/pub?gid=403210794&single=true&output=csv';

function parseCSV(text) {
    const rows = [];
    let row = [], cell = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') { inQ = !inQ; }
        else if (c === ',' && !inQ) { row.push(cell.trim()); cell = ''; }
        else if ((c === '\n' || c === '\r') && !inQ) {
            if (cell !== '' || row.length) { row.push(cell.trim()); rows.push(row); }
            row = []; cell = '';
        } else { cell += c; }
    }
    if (row.length) { row.push(cell.trim()); rows.push(row); }
    return rows;
}

function wrapText(word) {
    const tokens = word.split(' ');
    if (tokens.length <= 8) return word;
    const lines = [];
    for (let i = 0; i < tokens.length; i += 8) {
        lines.push(tokens.slice(i, i + 8).join(' '));
    }
    return lines.join('\n');
}

window.addEventListener('load', async () => {
    requestAnimationFrame(() => {
        document.body.classList.add('visible');
        document.body.addEventListener('transitionend', () => {
            document.body.style.transform = 'none';
            document.body.style.transition = '';
        }, { once: true });
    });

    const page = document.getElementById('next-page');
    const svg = document.getElementById('svg-lines');

    const response = await fetch(SHEET_CSV_URL);
    const text = await response.text();
    const rows = parseCSV(text);

    const arrowSVG = `<svg viewBox="0 0 110 60" width="15vw" height="7.5vw" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible;">
    <line x1="0" y1="30" x2="95" y2="30" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
    <polyline points="75,10 95,30 75,50" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

    let resizeTimer = null;

    function showColumnView() {
        document.getElementById('col-container')?.remove();
        document.getElementById('bottom-btn-2')?.remove();
        document.getElementById('bottom-btn-3')?.remove();

        const whoseMsg = document.createElement('div');
        whoseMsg.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
            font-family: "Inter", "Helvetica Neue", "Arial", sans-serif;
            font-weight: 100;
            color: #00FF00;
            pointer-events: none;
            z-index: 0;
            opacity: 1;
            transition: opacity 0.5s ease;
        `;
        whoseMsg.innerHTML = `
        <div style="text-align:left; padding: 0 0 0 55px;">
            <span style="display:block;font-size:min(23vw, 60vh);line-height:1;letter-spacing:0.05em;white-space:nowrap;color:#00FF00;">WHOSE?</span>
        </div>`;
        document.body.appendChild(whoseMsg);

        const textPairs = rows.slice(1)
            .map(row => ({ a: (row[0] || '').trim(), b: (row[1] || '').trim() }))
            .filter(p => p.a);

        for (let i = textPairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [textPairs[i], textPairs[j]] = [textPairs[j], textPairs[i]];
        }

        function getNumCols() {
            const w = window.innerWidth;
            if (w >= 1200) return 8;
            if (w >= 900) return 6;
            if (w >= 600) return 4;
            return 2;
        }

        function renderGrid() {
            document.getElementById('col-container')?.remove();

            const NUM_COLS = getNumCols();
            const padLeft = 55, padRight = 40, gap = 20;
            const totalGap = (NUM_COLS - 1) * gap;
            const colWidth = (window.innerWidth - padLeft - padRight - totalGap) / NUM_COLS;
            const fontSize = Math.max(6, Math.min(13, colWidth / 10));

            const container = document.createElement('div');
            container.id = 'col-container';
            container.style.cssText = `
                display: grid;
                grid-template-columns: repeat(${NUM_COLS}, minmax(0, 1fr));
                align-items: start;
                width: 100%;
                min-height: 100vh;
                padding: 60px 25vw 120px ${padLeft}px;
                box-sizing: border-box;
                column-gap: ${gap}px;
                overflow-x: hidden;
            `;

            const numRows = Math.ceil(textPairs.length / NUM_COLS);
            for (let r = 0; r < numRows; r++) {
                for (let c = 0; c < NUM_COLS; c++) {
                    const idx = r * NUM_COLS + c;
                    const wrapper = document.createElement('div');
                    wrapper.style.cssText = `position: relative; padding-top: 20px; padding-bottom: 20px; border-top: 1.5px solid #C5A028;                    `;

                    if (idx < textPairs.length) {
                        const blockText = textPairs[idx].a;
                        const blockName = textPairs[idx].b || blockText.slice(0, 20);

                        const block = document.createElement('div');
                        block.style.cssText = `
                            position: relative;
                            font-family: 'LatinThin', "Helvetica Neue", "Helvetica", "Asta Sans", sans-serif;
                            font-size: ${fontSize}px;
                            font-weight: 900;
                            line-height: 1.6;
                            overflow-wrap: break-word;
                            word-break: keep-all;
                        `;

                        const textNode = document.createElement('span');
                        textNode.textContent = blockText;
                        textNode.style.cssText = `display: block; position: relative; z-index: 1;`;
                        block.appendChild(textNode);

                        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        svgEl.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; opacity: 0; transition: opacity 0.2s ease;`;
                        const rectBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rectBg.setAttribute('width', '100%'); rectBg.setAttribute('height', '100%');
                        rectBg.setAttribute('fill', 'rgba(0,255,0,0.1)'); rectBg.setAttribute('stroke', 'none');
                        svgEl.appendChild(rectBg);
                        const rectBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rectBorder.setAttribute('width', '100%'); rectBorder.setAttribute('height', '100%');
                        rectBorder.setAttribute('fill', 'none'); rectBorder.setAttribute('stroke', '#00FF00');
                        rectBorder.setAttribute('stroke-width', '1.5');
                        svgEl.appendChild(rectBorder);
                        block.appendChild(svgEl);

                        const copyBtn = document.createElement('div');
                        copyBtn.style.cssText = `position: absolute; top: 18px; left: 50%; transform: translateX(-50%); cursor: pointer; pointer-events: none; opacity: 0; transition: opacity 0.2s ease; z-index: 10; line-height: 0;`;
                        copyBtn.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="0.8" stroke-linecap="square" stroke-linejoin="miter" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="12" height="12"/><polyline points="5,15 3,15 3,3 15,3 15,5"/></svg>`;
                        block.appendChild(copyBtn);

                        const dlBtn = document.createElement('div');
                        dlBtn.style.cssText = `position: absolute; top: 70px; left: 50%; transform: translateX(-50%); cursor: pointer; pointer-events: none; opacity: 0; transition: opacity 0.2s ease; z-index: 10; line-height: 0;`;
                        dlBtn.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="0.8" stroke-linecap="square" stroke-linejoin="miter" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="3" x2="12" y2="15"/><polyline points="7,10 12,15 17,10"/><line x1="5" y1="20" x2="19" y2="20"/></svg>`;
                        block.appendChild(dlBtn);
                        wrapper.appendChild(block);

                        wrapper.addEventListener('mouseenter', () => {
                            const bRect = block.getBoundingClientRect();
                            const perimeter = 2 * (bRect.width + bRect.height);
                            rectBorder.style.transition = 'none';
                            rectBorder.style.strokeDasharray = perimeter;
                            rectBorder.style.strokeDashoffset = perimeter;
                            svgEl.style.opacity = '1';
                            requestAnimationFrame(() => { requestAnimationFrame(() => {
                                rectBorder.style.transition = 'stroke-dashoffset 0.6s ease';
                                rectBorder.style.strokeDashoffset = '0';
                            }); });
                            copyBtn.style.opacity = '1'; copyBtn.style.pointerEvents = 'auto';
                            dlBtn.style.opacity = '1'; dlBtn.style.pointerEvents = 'auto';
                        });
                        wrapper.addEventListener('mouseleave', () => {
                            svgEl.style.opacity = '0';
                            copyBtn.style.opacity = '0'; copyBtn.style.pointerEvents = 'none';
                            dlBtn.style.opacity = '0'; dlBtn.style.pointerEvents = 'none';
                        });
                        copyBtn.addEventListener('mouseenter', () => { copyBtn.style.opacity = '0.3'; });
                        copyBtn.addEventListener('mouseleave', () => { copyBtn.style.opacity = '1'; });
                        copyBtn.addEventListener('click', (e) => { e.stopPropagation(); navigator.clipboard.writeText(blockText); });
                        dlBtn.addEventListener('mouseenter', () => { dlBtn.style.opacity = '0.3'; });
                        dlBtn.addEventListener('mouseleave', () => { dlBtn.style.opacity = '1'; });
                        dlBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const blob = new Blob([blockText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = blockName.replace(/\s+/g, '_') + '.txt';
                            a.click();
                            URL.revokeObjectURL(url);
                        });
                    }
                    container.appendChild(wrapper);
                }
            }

            page.style.height = 'auto';
            page.style.minHeight = '100vh';
            page.appendChild(container);

            // 하단 화살표 버튼
            const bottomBtn3 = document.createElement('div');
            bottomBtn3.id = 'bottom-btn-3';
            bottomBtn3.style.cssText = `position: fixed; top: 30px; right: 55px; cursor: pointer; z-index: 10; line-height: 0;`;
            bottomBtn3.innerHTML = arrowSVG;
            document.body.appendChild(bottomBtn3);

            bottomBtn3.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const onScroll = () => {
                    if (window.scrollY <= 5) {
                        window.removeEventListener('scroll', onScroll);
                        document.body.style.transition = 'transform 0.8s cubic-bezier(0.76, 0, 0.24, 1)';
                        document.body.style.transform = 'translateY(-100%)';
                        setTimeout(() => { window.location.href = 'end.html'; }, 800);
                    }
                };
                window.addEventListener('scroll', onScroll);
                if (window.scrollY <= 5) onScroll();
            });
        }

        renderGrid();
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { renderGrid(); }, 200);
        });

        // WHOSE? 버튼 — 클릭하면 WHOSE? 사라지고 검정 텍스트만 남음
        const whoseBtn = document.createElement('div');
        whoseBtn.id = 'bottom-btn-2';
        whoseBtn.style.cssText = `position: fixed; top: 30px; right: 55px; cursor: pointer; z-index: 10; line-height: 0;`;
        whoseBtn.innerHTML = arrowSVG;
        document.body.appendChild(whoseBtn);

        whoseBtn.addEventListener('click', () => {
            whoseMsg.style.opacity = '0';
            whoseBtn.remove();
            setTimeout(() => {
                whoseMsg.remove();
                document.getElementById('bottom-btn-3') && document.getElementById('bottom-btn-3').style;
            }, 500);
        });
    }

    showColumnView();
});
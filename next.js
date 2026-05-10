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
    svg.style.zIndex = '0';

    const response = await fetch(SHEET_CSV_URL);
    const text = await response.text();
    const rows = parseCSV(text);
    const dataRows = rows.slice(1).filter(r => r.some(c => c.trim()));

    const wordMap = new Map();
    dataRows.forEach((row, rowIdx) => {
        for (let colIdx = 1; colIdx <= 11; colIdx++) {
            const cell = (row[colIdx] || '').trim();
            if (!cell) continue;
            cell.split(/\r?\n/).forEach(v => {
                const val = v.trim();
                if (!val) return;
                if (!wordMap.has(val)) wordMap.set(val, new Set());
                wordMap.get(val).add(rowIdx);
            });
        }
    });

    function sharedRows(a, b) {
        const setA = wordMap.get(a);
        const setB = wordMap.get(b);
        let count = 0;
        setA.forEach(r => { if (setB.has(r)) count++; });
        return count;
    }

    const words = Array.from(wordMap.keys());
    for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
    }

    const arrowSVG = `<svg viewBox="0 0 110 60" width="33vw" height="16.5vw" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible;">
        <line x1="0" y1="30" x2="95" y2="30" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
        <polyline points="75,10 95,30 75,50" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    let placed = [];
    let lineMap = new Map();
    let lockedIdx = null;
    let currentHovered = null;
    let deactivateTimer = null;
    let hoverMsg = null;

    function activate(i) {
        const a = placed[i];
        const ax = a.x + a.w / 2;
        const ay = a.y + a.h / 2;
        const connected = new Set([i]);

        lineMap.forEach((data) => {
            const { line, i: li, j: lj } = data;
            if (li === i || lj === i) {
                connected.add(li);
                connected.add(lj);

                const other = li === i ? placed[lj] : placed[li];
                const bx = other.x + other.w / 2;
                const by = other.y + other.h / 2;
                const len = Math.hypot(bx - ax, by - ay);

                line.setAttribute('x1', ax);
                line.setAttribute('y1', ay);
                line.setAttribute('x2', bx);
                line.setAttribute('y2', by);
                line.style.strokeDasharray = len;
                line.style.strokeDashoffset = len;
                line.style.transition = 'none';
                line.style.opacity = '1';

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        line.style.transition = 'stroke-dashoffset 0.6s ease';
                        line.style.strokeDashoffset = '0';
                    });
                });
            } else {
                line.style.transition = 'none';
                line.style.opacity = '0';
            }
        });

        placed.forEach((b, j) => {
            b.el.classList.toggle('faded', !connected.has(j));
        });
    }

    function deactivate() {
        placed.forEach(b => b.el.classList.remove('faded'));
        lineMap.forEach(({ line }) => {
            line.style.transition = 'opacity 0.2s ease';
            line.style.opacity = '0';
        });
    }

    function showColumnView() {
        placed.forEach(p => p.el.remove());
        placed = [];
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        svg.style.display = 'none';
        document.getElementById('bottom-btn-2')?.remove();
        document.getElementById('col-container')?.remove();

        // A열(소개글)과 B열(이름) 함께 가져오기
        const textPairs = rows.slice(1)
            .map(row => ({ a: (row[0] || '').trim(), b: (row[1] || '').trim() }))
            .filter(p => p.a);

        // 셔플
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
                padding: 30px ${padRight}px 120px ${padLeft}px;
                box-sizing: border-box;
                column-gap: ${gap}px;
                overflow-x: hidden;
            `;

            const numRows = Math.ceil(textPairs.length / NUM_COLS);
            for (let r = 0; r < numRows; r++) {
                for (let c = 0; c < NUM_COLS; c++) {
                    const idx = r * NUM_COLS + c;

                    const wrapper = document.createElement('div');
                    wrapper.style.cssText = `position: relative; padding-top: 20px; padding-bottom: 20px;${r > 0 ? ' border-top: 1px solid #000;' : ''}`;

                    if (idx < textPairs.length) {
                        const blockText = textPairs[idx].a;
                        const blockName = textPairs[idx].b || blockText.slice(0, 20);

                        const block = document.createElement('div');
                        block.style.cssText = `
                            position: relative;
                            font-family: 'LatinThin', "Helvetica Neue", "Helvetica", "Asta Sans", sans-serif;
                            font-size: ${fontSize}px;
                            font-weight: 600;
                            line-height: 1.6;
                            overflow-wrap: break-word;
                            word-break: keep-all;
                        `;

                        const textNode = document.createElement('span');
                        textNode.textContent = blockText;
                        textNode.style.cssText = `display: block; position: relative; z-index: 1;`;
                        block.appendChild(textNode);

                        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        svgEl.style.cssText = `
                            position: absolute;
                            top: 0; left: 0;
                            width: 100%; height: 100%;
                            pointer-events: none;
                            overflow: visible;
                            opacity: 0;
                            transition: opacity 0.2s ease;
                        `;
                        const rectBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rectBg.setAttribute('width', '100%');
                        rectBg.setAttribute('height', '100%');
                        rectBg.setAttribute('fill', 'rgba(0,255,0,0.1)');
                        rectBg.setAttribute('stroke', 'none');
                        svgEl.appendChild(rectBg);
                        const rectBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rectBorder.setAttribute('width', '100%');
                        rectBorder.setAttribute('height', '100%');
                        rectBorder.setAttribute('fill', 'none');
                        rectBorder.setAttribute('stroke', '#00FF00');
                        rectBorder.setAttribute('stroke-width', '1.5');
                        svgEl.appendChild(rectBorder);
                        block.appendChild(svgEl);

                        const copyBtn = document.createElement('div');
                        copyBtn.style.cssText = `
                            position: absolute;
                            top: 18px;
                            left: 50%;
                            transform: translateX(-50%);
                            cursor: pointer;
                            pointer-events: none;
                            opacity: 0;
                            transition: opacity 0.2s ease;
                            z-index: 10;
                            line-height: 0;
                        `;
                        copyBtn.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="0.8" stroke-linecap="square" stroke-linejoin="miter" xmlns="http://www.w3.org/2000/svg">
                            <rect x="9" y="9" width="12" height="12"/>
                            <polyline points="5,15 3,15 3,3 15,3 15,5"/>
                        </svg>`;
                        block.appendChild(copyBtn);

                        const dlBtn = document.createElement('div');
                        dlBtn.style.cssText = `
                            position: absolute;
                            top: 70px;
                            left: 50%;
                            transform: translateX(-50%);
                            cursor: pointer;
                            pointer-events: none;
                            opacity: 0;
                            transition: opacity 0.2s ease;
                            z-index: 10;
                            line-height: 0;
                        `;
                        dlBtn.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="0.8" stroke-linecap="square" stroke-linejoin="miter" xmlns="http://www.w3.org/2000/svg">
                            <line x1="12" y1="3" x2="12" y2="15"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="5" y1="20" x2="19" y2="20"/>
                        </svg>`;
                        block.appendChild(dlBtn);
                        wrapper.appendChild(block);

                        wrapper.addEventListener('mouseenter', () => {
                            const bRect = block.getBoundingClientRect();
                            const perimeter = 2 * (bRect.width + bRect.height);
                            rectBorder.style.transition = 'none';
                            rectBorder.style.strokeDasharray = perimeter;
                            rectBorder.style.strokeDashoffset = perimeter;
                            svgEl.style.opacity = '1';
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    rectBorder.style.transition = 'stroke-dashoffset 0.6s ease';
                                    rectBorder.style.strokeDashoffset = '0';
                                });
                            });
                            copyBtn.style.opacity = '1';
                            copyBtn.style.pointerEvents = 'auto';
                            dlBtn.style.opacity = '1';
                            dlBtn.style.pointerEvents = 'auto';
                        });

                        wrapper.addEventListener('mouseleave', () => {
                            svgEl.style.opacity = '0';
                            copyBtn.style.opacity = '0';
                            copyBtn.style.pointerEvents = 'none';
                            dlBtn.style.opacity = '0';
                            dlBtn.style.pointerEvents = 'none';
                        });

                        copyBtn.addEventListener('mouseenter', () => { copyBtn.style.opacity = '0.3'; });
                        copyBtn.addEventListener('mouseleave', () => { copyBtn.style.opacity = '1'; });
                        copyBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(blockText);
                        });

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

            const bottomBtn3 = document.createElement('div');
            bottomBtn3.style.cssText = `
                display: block;
                margin: 40px auto 80px;
                cursor: pointer;
                width: fit-content;
                z-index: 10;
                position: relative;
                line-height: 0;
            `;
            bottomBtn3.innerHTML = arrowSVG;
            container.appendChild(bottomBtn3);

            bottomBtn3.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const onScroll = () => {
                    if (window.scrollY <= 5) {
                        window.removeEventListener('scroll', onScroll);
                        document.body.style.transition = 'transform 0.8s cubic-bezier(0.76, 0, 0.24, 1)';
                        document.body.style.transform = 'translateY(-100%)';
                        setTimeout(() => {
                            window.location.href = 'end.html';
                        }, 800);
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
    }

    function layout() {
        placed.forEach(p => p.el.remove());
        placed = [];
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        lineMap = new Map();
        document.getElementById('bottom-btn-2')?.remove();

        lockedIdx = null;
        currentHovered = null;
        clearTimeout(deactivateTimer);

        const W = window.innerWidth;
        const padding = 40;
        const margin = 28;
        let currentH = window.innerHeight * 3;

        const measurer = document.createElement('div');
        measurer.style.cssText = `
            position: absolute; visibility: hidden;
            font-family: 'LatinThin', "Helvetica Neue", "Helvetica", sans-serif;
            font-size: clamp(10px, 1.2vw, 18px);
            font-weight: 600; white-space: pre-wrap;
            text-align: center; line-height: 1.4;
        `;
        document.body.appendChild(measurer);

        function overlaps(x, y, w, h) {
            for (const p of placed) {
                if (x < p.x + p.w + margin &&
                    x + w + margin > p.x &&
                    y < p.y + p.h + margin &&
                    y + h + margin > p.y) return true;
            }
            return false;
        }

        words.forEach(word => {
            const wrapped = wrapText(word);
            measurer.textContent = wrapped;
            const w = measurer.offsetWidth;
            const h = measurer.offsetHeight;

            let x, y, found = false;
            for (let attempt = 0; attempt < 5000; attempt++) {
                if (attempt > 0 && attempt % 500 === 0) currentH += window.innerHeight;
                x = padding + Math.random() * (W - w - padding * 2);
                y = padding + Math.random() * (currentH - h - padding * 2);
                if (!overlaps(x, y, w, h)) { found = true; break; }
            }
            if (!found) {
                currentH += h + margin * 2;
                x = padding + Math.random() * (W - w - padding * 2);
                y = currentH - h - padding;
            }

            const el = document.createElement('div');
            el.className = 'word-node';
            el.textContent = wrapped;
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.whiteSpace = 'pre-wrap';
            el.style.textAlign = 'center';
            el.style.lineHeight = '1.4';
            el.style.zIndex = '1';
            page.appendChild(el);

            placed.push({ word, x, y, w, h, el });
        });

        document.body.removeChild(measurer);

        const maxY = Math.max(...placed.map(p => p.y + p.h)) + padding * 2;
        const finalH = Math.max(currentH, maxY);
        const btnSpace = 160;
        page.style.height = (finalH + btnSpace) + 'px';

        svg.setAttribute('width', W);
        svg.setAttribute('height', finalH + btnSpace);
        svg.setAttribute('viewBox', `0 0 ${W} ${finalH + btnSpace}`);

        placed.forEach((a, i) => {
            placed.forEach((b, j) => {
                if (j <= i) return;
                const shared = sharedRows(a.word, b.word);
                if (shared === 0) return;

                const x1 = a.x + a.w / 2;
                const y1 = a.y + a.h / 2;
                const x2 = b.x + b.w / 2;
                const y2 = b.y + b.h / 2;
                const len = Math.hypot(x2 - x1, y2 - y1);

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                line.style.stroke = '#00FF00';
                line.style.strokeWidth = '1';
                line.style.opacity = '0';
                line.style.strokeDasharray = len;
                line.style.strokeDashoffset = len;
                svg.appendChild(line);

                lineMap.set(`${i}-${j}`, { line, i, j });
            });
        });

        placed.forEach((a, i) => {
            a.el.addEventListener('click', (e) => {
                e.stopPropagation();
                if (lockedIdx === i) {
                    lockedIdx = null;
                    currentHovered = null;
                    deactivate();
                } else {
                    lockedIdx = i;
                    activate(i);
                }
            });
        });

        const bottomBtn = document.createElement('div');
        bottomBtn.id = 'bottom-btn-2';
        bottomBtn.innerHTML = arrowSVG;
        bottomBtn.style.cssText = `
            position: absolute;
            top: ${finalH + 40}px;
            left: 50%;
            transform: translateX(-50%);
            cursor: pointer;
            z-index: 10;
            line-height: 0;
        `;
        page.appendChild(bottomBtn);

        bottomBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            page.style.transition = 'opacity 0.5s ease';
            page.style.opacity = '0';
            if (hoverMsg) {
                hoverMsg.style.opacity = '0';
                setTimeout(() => {
                    hoverMsg.style.alignItems = 'flex-start';
                    hoverMsg.style.justifyContent = 'flex-start';
                    hoverMsg.style.padding = '0 7vw 0 4vw';
                    hoverMsg.innerHTML = `
<div style="text-align:left; padding: 0;">
    <span style="display:block;font-size:min(23vw, 60vh);line-height:1;letter-spacing:0.05em;white-space:nowrap;color:#00FF00;">WHOSE?</span>
    <div style="margin-top:0.3em;font-size:min(3.5vw, 8vh);font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-weight:300;color:#00FF00;letter-spacing:0.05em;line-height:1.15;">
        <div style="display:flex;align-items:center;gap:0.4em;"><span>COPY</span></div>
        <div style="display:flex;align-items:center;gap:0.4em;padding-left:1.5em;">
            <svg viewBox="0 0 40 12" width="1.5em" height="0.45em" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
                <line x1="0" y1="6" x2="34" y2="6" stroke="#00FF00" stroke-width="1.0" stroke-linecap="round"/>
                <polyline points="28,1 34,6 28,11" fill="none" stroke="#00FF00" stroke-width="1.0" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>PASTE</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.4em;padding-left:1.5em;">
            <svg viewBox="0 0 40 12" width="1.5em" height="0.45em" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
                <line x1="0" y1="6" x2="34" y2="6" stroke="#00FF00" stroke-width="1.0" stroke-linecap="round"/>
                <polyline points="28,1 34,6 28,11" fill="none" stroke="#00FF00" stroke-width="1.0" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>SEARCH</span>
        </div>
    </div>
</div>`;
                    hoverMsg.style.transition = 'opacity 0.5s ease';
                    hoverMsg.style.opacity = '1';
                }, 500);
            }
            setTimeout(() => {
                showColumnView();
                page.style.transition = 'opacity 0.5s ease';
                page.style.opacity = '1';
            }, 500);
        });
    }

    layout();

    hoverMsg = document.createElement('div');
    hoverMsg.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: "Inter", "Helvetica Neue", "Arial", sans-serif;
        font-weight: 100;
        color: #00FF00;
        pointer-events: none;
        z-index: 2;
        opacity: 0;
        transition: opacity 0.5s ease;
    `;
    hoverMsg.innerHTML = `
        <span style="display:block;transform:rotate(-45deg);font-size:clamp(8vw, 20vw, 22vh);line-height:1.0;letter-spacing:-0.05em;text-align:center;">HOVER<br>AND<br>CLICK</span>
    `;
    document.body.appendChild(hoverMsg);
    setTimeout(() => { hoverMsg.style.opacity = '1'; }, 100);

    document.addEventListener('mousemove', (e) => {
        if (lockedIdx !== null) return;
        const target = e.target.closest ? e.target.closest('.word-node') : null;
        const newIdx = target ? placed.findIndex(p => p.el === target) : -1;
        if (newIdx === currentHovered) return;
        if (newIdx !== -1) {
            clearTimeout(deactivateTimer);
            currentHovered = newIdx;
            activate(newIdx);
        } else {
            deactivateTimer = setTimeout(() => {
                currentHovered = -1;
                deactivate();
            }, 120);
        }
    });

    document.addEventListener('click', () => {
        if (lockedIdx !== null) {
            lockedIdx = null;
            deactivate();
        }
    });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { layout(); }, 200);
    });
});
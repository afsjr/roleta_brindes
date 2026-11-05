/**
 * Componente da Roleta: Canvas 2D, Animação Determinística, Áudio e Vibração
 */
const Roleta = (function () {
    let canvas = null;
    let ctx = null;
    let needleElement = null;
    let beneficios = [];
    let currentRotation = 0;
    let isSpinning = false;
    let winningItem = null;
    let lastTickIndex = -1;

    // Paleta de cores vibrantes com alto contraste
    const COLORS = [
        '#4f46e5', '#f59e0b', '#10b981', '#ef4444', 
        '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'
    ];

    function init(canvasEl, needleEl) {
        canvas = canvasEl;
        needleElement = needleEl;
        ctx = canvas.getContext('2d');

        ajustarResolucao();
        window.addEventListener('resize', () => {
            ajustarResolucao();
            desenhar(currentRotation);
        });

        carregarBeneficios();

        window.addEventListener('beneficios-atualizados', (e) => {
            beneficios = e.detail || [];
            desenhar(currentRotation);
        });
    }

    function ajustarResolucao() {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        ctx.scale(dpr, dpr);
    }

    async function carregarBeneficios() {
        beneficios = await Storage.listarBeneficios();
        desenhar(currentRotation);
    }

    function desenhar(rotacao = 0) {
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        const W = rect.width;
        const H = rect.height;
        const R = Math.min(W, H) / 2 - 8;

        ctx.clearRect(0, 0, W, H);

        if (!beneficios || beneficios.length === 0) {
            ctx.fillStyle = '#f1f5f9';
            ctx.beginPath();
            ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Nenhum benefício ativo', W / 2, H / 2);
            return;
        }

        const total = beneficios.length;
        const arc = (Math.PI * 2) / total;

        for (let i = 0; i < total; i++) {
            const angleStart = rotacao + i * arc;
            const angleEnd = angleStart + arc;

            // Fatia
            ctx.beginPath();
            ctx.moveTo(W / 2, H / 2);
            ctx.arc(W / 2, H / 2, R, angleStart, angleEnd);
            ctx.closePath();
            ctx.fillStyle = COLORS[i % COLORS.length];
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Texto do Benefício
            ctx.save();
            ctx.translate(W / 2, H / 2);
            ctx.rotate(angleStart + arc / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 4;

            const nome = beneficios[i].nome;
            const maxLen = total > 6 ? 15 : 22;
            const label = nome.length > maxLen ? nome.slice(0, maxLen - 1) + '…' : nome;
            ctx.fillText(label, R - 24, 0);
            ctx.restore();
        }

        // Borda circular externa decorativa
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Hub Central
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    function checkTick(rotacao) {
        if (!beneficios || beneficios.length === 0) return;
        const total = beneficios.length;
        const arc = (Math.PI * 2) / total;
        // O ponteiro está no topo (ângulo 3*PI/2)
        const angleAtPointer = (1.5 * Math.PI - (rotacao % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        const currentIndex = Math.floor(angleAtPointer / arc);

        if (currentIndex !== lastTickIndex) {
            lastTickIndex = currentIndex;
            SoundEffects.playTick();

            // Vibração tátil no celular se suportado
            if ('vibrate' in navigator) {
                try { navigator.vibrate(12); } catch (e) { }
            }

            if (needleElement) {
                needleElement.classList.add('ticking');
                setTimeout(() => needleElement.classList.remove('ticking'), 60);
            }
        }
    }

    function girar(duracaoMs = 4200) {
        if (isSpinning || !beneficios || beneficios.length === 0) {
            return Promise.reject("Não é possível girar");
        }

        isSpinning = true;
        const sorteio = Utils.sortearPonderado(beneficios);
        if (!sorteio) {
            isSpinning = false;
            return Promise.reject("Não é possível girar");
        }
        winningItem = sorteio.item;

        const totalSlices = beneficios.length;
        const arc = (Math.PI * 2) / totalSlices;

        // Ângulo onde o centro da fatia sorteada deve parar (topo: 3*PI/2)
        const targetSliceAngle = (sorteio.index + 0.5) * arc;
        const pointerAngle = 1.5 * Math.PI;

        const voltasCompletas = 5 + Math.floor(Math.random() * 3);
        const startRotation = currentRotation % (Math.PI * 2);

        let targetRotation = pointerAngle - targetSliceAngle + (voltasCompletas * Math.PI * 2);
        while (targetRotation <= startRotation) {
            targetRotation += Math.PI * 2;
        }

        return new Promise((resolve) => {
            const startTime = performance.now();

            function animar(agora) {
                const tempoDecorrido = agora - startTime;
                const progresso = Math.min(1, tempoDecorrido / duracaoMs);

                // Desaceleração cúbica suave
                const eased = 1 - Math.pow(1 - progresso, 3);
                currentRotation = startRotation + (targetRotation - startRotation) * eased;

                desenhar(currentRotation);
                checkTick(currentRotation);

                if (progresso < 1) {
                    requestAnimationFrame(animar);
                } else {
                    isSpinning = false;
                    SoundEffects.playWin();
                    if ('vibrate' in navigator) {
                        try { navigator.vibrate([60, 50, 100]); } catch (e) { }
                    }
                    resolve(winningItem);
                }
            }

            requestAnimationFrame(animar);
        });
    }

    function resetar() {
        if (isSpinning) return;
        currentRotation = 0;
        lastTickIndex = -1;
        desenhar(0);
    }

    return {
        init,
        desenhar,
        girar,
        resetar,
        estaGirando: () => isSpinning,
        carregarBeneficios
    };
})();

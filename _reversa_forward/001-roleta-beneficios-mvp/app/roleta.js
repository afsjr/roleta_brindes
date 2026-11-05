// Módulo da Roleta com Canvas 2D e Cálculo Determinístico
const Roleta = (function () {
    let canvas = null;
    let ctx = null;
    let beneficios = [];
    let currentRotation = 0;
    let isSpinning = false;
    let winningItem = null;

    const COLORS = [
        '#4f46e5', '#f59e0b', '#10b981', '#ef4444', 
        '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'
    ];

    function init(canvasElement) {
        canvas = canvasElement;
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
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }

    async function carregarBeneficios() {
        beneficios = await Storage.listarBeneficios();
        desenhar(currentRotation);
    }

    function sortearPonderado() {
        if (!beneficios || beneficios.length === 0) return null;
        
        const totalPeso = beneficios.reduce((sum, b) => sum + (b.peso || 1), 0);
        let random = Math.random() * totalPeso;
        
        for (let i = 0; i < beneficios.length; i++) {
            const peso = beneficios[i].peso || 1;
            if (random < peso) {
                return { index: i, item: beneficios[i] };
            }
            random -= peso;
        }
        return { index: 0, item: beneficios[0] };
    }

    function desenhar(rotacao = 0) {
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        const W = rect.width;
        const H = rect.height;
        const R = Math.min(W, H) / 2 - 8;

        ctx.clearRect(0, 0, W, H);

        if (!beneficios || beneficios.length === 0) {
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#64748b';
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
            const maxChars = total > 6 ? 14 : 20;
            const label = nome.length > maxChars ? nome.slice(0, maxChars - 1) + '…' : nome;
            ctx.fillText(label, R - 22, 0);
            ctx.restore();
        }

        // Centro da roleta
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 28, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    function girar(duracaoMs = 4200) {
        if (isSpinning || !beneficios || beneficios.length === 0) return Promise.reject("Não é possível girar");

        isSpinning = true;
        const sorteio = sortearPonderado();
        winningItem = sorteio.item;

        const totalSlices = beneficios.length;
        const arc = (Math.PI * 2) / totalSlices;
        
        // Ponteiro fixo no topo (ângulo 3*PI/2 ou -PI/2)
        // Para a fatia sorteada index 'i' parar no topo:
        const targetSliceAngle = (sorteio.index + 0.5) * arc;
        const pointerAngle = 1.5 * Math.PI; // Topo
        
        const voltasCompletas = 5 + Math.floor(Math.random() * 3);
        const startRotation = currentRotation % (Math.PI * 2);
        
        // Destino da rotação
        let targetRotation = pointerAngle - targetSliceAngle + (voltasCompletas * Math.PI * 2);
        while (targetRotation <= startRotation) {
            targetRotation += Math.PI * 2;
        }

        return new Promise((resolve) => {
            const startTime = performance.now();

            function animar(agora) {
                const tempoDecorrido = agora - startTime;
                const progresso = Math.min(1, tempoDecorrido / duracaoMs);
                
                // Desaceleração cúbica suave (ease-out cubic)
                const eased = 1 - Math.pow(1 - progresso, 3);
                currentRotation = startRotation + (targetRotation - startRotation) * eased;
                
                desenhar(currentRotation);

                if (progresso < 1) {
                    requestAnimationFrame(animar);
                } else {
                    isSpinning = false;
                    resolve(winningItem);
                }
            }

            requestAnimationFrame(animar);
        });
    }

    function getWinningItem() {
        return winningItem;
    }

    function estaGirando() {
        return isSpinning;
    }

    return {
        init,
        desenhar,
        girar,
        getWinningItem,
        estaGirando,
        carregarBeneficios
    };
})();

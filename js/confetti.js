/**
 * Efeito visual de Confetes com Canvas 2D
 * Leve, sem dependências externas, alto desempenho mobile.
 */
const Confetti = (function () {
    let canvas = null;
    let ctx = null;
    let particles = [];
    let animationId = null;

    const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#3b82f6'];

    function init(canvasElement) {
        canvas = canvasElement;
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    }

    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function trigger(durationMs = 2800) {
        if (!canvas || !ctx) return;
        resize();
        particles = [];

        const count = Math.min(100, Math.floor(window.innerWidth / 4));
        for (let i = 0; i < count; i++) {
            particles.push({
                x: window.innerWidth / 2 + (Math.random() * 80 - 40),
                y: window.innerHeight / 2 - 50,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.8) * 18,
                size: Math.random() * 8 + 4,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                rotation: Math.random() * 360,
                vRot: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        const start = performance.now();
        if (animationId) cancelAnimationFrame(animationId);

        function update(now) {
            const elapsed = now - start;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.45; // Gravidade
                p.rotation += p.vRot;
                p.opacity = Math.max(0, 1 - (elapsed / durationMs));

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            });

            if (elapsed < durationMs) {
                animationId = requestAnimationFrame(update);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles = [];
            }
        }

        animationId = requestAnimationFrame(update);
    }

    return {
        init,
        trigger
    };
})();

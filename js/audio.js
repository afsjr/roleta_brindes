/**
 * Sintetizador de Áudio Procedural (Web Audio API)
 * Funciona 100% offline sem arquivos de mídia externos.
 */
const SoundEffects = (function () {
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Som de "tick" curto ao passar por uma fatia da roleta
    function playTick() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(450, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);

            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } catch (e) {
            // Ignora silenciosamente em navegadores com restrição estrita de áudio
        }
    }

    // Som de fanfarra festiva ao premiar o participante
    function playWin() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const notes = [261.63, 329.63, 392.00, 523.25]; // Acorde Dó Maior (C-E-G-C)
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                const startTime = ctx.currentTime + (idx * 0.09);
                const duration = 0.45;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.22, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + duration);
            });
        } catch (e) {
            // Silencioso se bloqueado pelo navegador
        }
    }

    return {
        playTick,
        playWin
    };
})();

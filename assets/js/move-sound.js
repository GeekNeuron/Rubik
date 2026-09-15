// A short, synthesized "click" per move (Web Audio oscillator + fast
// envelope) - no audio file to fetch or license, and it automatically
// respects the animation speed since it's just a fixed short blip
// regardless of how fast/slow the visual turn plays out.

let audioCtx = null;

function getContext() {
    // Created lazily on first real use (a move only ever happens after a
    // user gesture - a click or drag - so this never trips the browser's
    // autoplay-blocks-audio-before-interaction restriction).
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

export function playMoveSound() {
    const ctx = getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
}

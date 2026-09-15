// Module Worker: runs this app's own from-scratch solver (own-solver.js)
// off the main thread, so solving never blocks the UI. See own-solver.js
// for what it does and why it exists instead of using a third-party
// solver library here.
import { solve } from './own-solver.js';
import { SOLVED } from './own-solver-engine.js';

self.onmessage = function (e) {
    const { id, faceletString } = e.data;
    try {
        if (faceletString === SOLVED.join('')) {
            self.postMessage({ id, ok: true, moves: [] });
            return;
        }
        const moves = solve(faceletString);
        self.postMessage({ id, ok: true, moves });
    } catch (err) {
        self.postMessage({ id, ok: false, error: err.message || String(err) });
    }
};

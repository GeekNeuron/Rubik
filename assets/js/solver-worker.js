// Classic (non-module) Worker: runs the real cubejs Kociemba solver off the
// main thread. importScripts requires classic script files (not ES modules),
// which is exactly the format cube.js/solve.js ship in.
importScripts('../../libs/cube.js', '../../libs/solve.js');

let initialized = false;

function ensureInit() {
    if (!initialized) {
        Cube.initSolver();
        initialized = true;
    }
}

self.onmessage = function (e) {
    const { id, faceletString } = e.data;
    try {
        ensureInit();
        const cube = Cube.fromString(faceletString);

        if (cube.isSolved()) {
            // cubejs's solve() has a known bug: solving an already-solved
            // cube returns a bogus ~14-move "neutral" sequence instead of
            // an empty one. Short-circuit that case ourselves.
            self.postMessage({ id, ok: true, moves: [] });
            return;
        }

        const solutionString = cube.solve();
        const moves = solutionString.trim().split(/\s+/).filter(Boolean);
        self.postMessage({ id, ok: true, moves });
    } catch (err) {
        self.postMessage({ id, ok: false, error: err.message || String(err) });
    }
};

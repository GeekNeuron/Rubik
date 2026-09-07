// Bridges the app to the real Kociemba solver (cubejs, MIT licensed - see
// libs/cubejs-LICENSE.txt), which runs inside a Web Worker so solving never
// blocks the UI thread. Also holds the facelet-string construction logic
// used by the "solve my physical cube" feature.

let worker = null;
let nextId = 1;
const pending = new Map();

function getWorker() {
    if (!worker) {
        worker = new Worker(new URL('./solver-worker.js', import.meta.url));
        worker.onmessage = (e) => {
            const { id, ok, moves, error } = e.data;
            const entry = pending.get(id);
            if (!entry) return;
            pending.delete(id);
            if (ok) entry.resolve(moves);
            else entry.reject(new Error(error));
        };
        worker.onerror = (e) => {
            // Reject every in-flight request if the worker itself crashes.
            pending.forEach(({ reject }) => reject(new Error(e.message || 'Worker error')));
            pending.clear();
        };
    }
    return worker;
}

/**
 * Solves a 54-character facelet string (U R F D L B order, 9 chars each,
 * row-major) using the real Kociemba algorithm. Resolves with an array of
 * moves in STANDARD notation (e.g. "R2","U'","F"), not yet translated to
 * this app's internal engine format.
 */
export function solveFacelets(faceletString, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        const id = nextId++;
        const timer = setTimeout(() => {
            if (!pending.has(id)) return;
            pending.delete(id);
            // The solver got stuck - almost always means the entered colors
            // describe a physically impossible cube. Recreate the worker so
            // future solves aren't left waiting behind the stuck one.
            if (worker) { worker.terminate(); worker = null; }
            reject(new Error('timeout'));
        }, timeoutMs);
        pending.set(id, {
            resolve: (v) => { clearTimeout(timer); resolve(v); },
            reject: (e) => { clearTimeout(timer); reject(e); },
        });
        getWorker().postMessage({ id, faceletString });
    });
}

/**
 * Translates a single standard-notation move token into this app's engine
 * move descriptor(s). IMPORTANT: for this app's rotation-matrix convention,
 * the "positive" rotation direction on the D, L, and B layers is the
 * opposite of what quarter-turn notation calls a plain (unprimed) turn -
 * this was verified empirically against a real solver, not assumed.
 */
const FACE_TO_AXIS_SLICE = {
    U: { axis: 'y', slice: 1 }, D: { axis: 'y', slice: -1 },
    R: { axis: 'x', slice: 1 }, L: { axis: 'x', slice: -1 },
    F: { axis: 'z', slice: 1 }, B: { axis: 'z', slice: -1 },
};
const NEEDS_DIR_FLIP = { D: true, L: true, B: true };
const ROTATION_AXES = { x: 'x', y: 'y', z: 'z' };

export function standardTokenToEngineMoves(token) {
    const face = token[0];
    const mod = token.slice(1); // '', "'", or '2'

    if (ROTATION_AXES[face]) {
        // Whole-cube rotation (x/y/z) - same direction convention as R/U/F
        // respectively, verified against the same reference the face-turn
        // flip table above was built from.
        const axis = ROTATION_AXES[face];
        let dir = 1;
        if (mod === "'") dir = -1;
        if (mod === '2') return [{ axis, slice: null, dir }, { axis, slice: null, dir }];
        return [{ axis, slice: null, dir }];
    }

    const { axis, slice } = FACE_TO_AXIS_SLICE[face];
    let baseDir = 1;
    if (NEEDS_DIR_FLIP[face]) baseDir = -1;
    if (mod === "'") baseDir *= -1;
    if (mod === '2') return [{ axis, slice, dir: baseDir }, { axis, slice, dir: baseDir }];
    return [{ axis, slice, dir: baseDir }];
}

export function standardSequenceToEngineMoves(tokens) {
    return tokens.flatMap(standardTokenToEngineMoves);
}

// --- Facelet net helpers -----------------------------------------------

export const NET_FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'];

/**
 * Given the user's net input (an object mapping face key -> array of 9
 * chosen physical colors, in the SAME row/column layout the app uses
 * internally - see cube-net.js for the exact grid), builds the 54-char
 * facelet string cubejs expects, after remapping each physical color to
 * the canonical U/R/F/D/L/B letter of whichever face currently has that
 * color at its center.
 */
export function netToFaceletString(netColors) {
    const centerColorToLetter = {};
    NET_FACE_ORDER.forEach(face => {
        centerColorToLetter[netColors[face][4]] = face;
    });
    let result = '';
    NET_FACE_ORDER.forEach(face => {
        netColors[face].forEach(color => {
            result += centerColorToLetter[color] || '?';
        });
    });
    return result;
}

/**
 * Validates a net input before sending it to the solver. Returns
 * { valid: true } or { valid: false, reason: 'colorCount' | 'centers' }.
 */
export function validateNetColors(netColors) {
    const allColors = [];
    NET_FACE_ORDER.forEach(face => allColors.push(...netColors[face]));
    if (allColors.some(c => !c)) return { valid: false, reason: 'incomplete' };

    const centers = NET_FACE_ORDER.map(face => netColors[face][4]);
    if (new Set(centers).size !== 6) return { valid: false, reason: 'centers' };

    const counts = {};
    allColors.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
    const badColor = Object.entries(counts).find(([, n]) => n !== 9);
    if (badColor) return { valid: false, reason: 'colorCount', color: badColor[0], count: badColor[1] };

    return { valid: true };
}

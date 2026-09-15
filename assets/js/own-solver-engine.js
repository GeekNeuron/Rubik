// --- Own-solver move engine ---------------------------------------------
// Pure facelet-permutation arithmetic (no third-party solver code at all).
// The six base-move permutation tables below were DERIVED, not copied:
// generated from this app's own already-shipped, already-validated
// cube-validator.js facelet tables (CORNER_SLOTS/EDGE_SLOTS) combined with
// this app's own already-shipped rotation convention
// (physical-solver.js's FACE_TO_AXIS_SLICE/NEEDS_DIR_FLIP,
// cube-state.js's getMoveAngle) - then cross-checked against a live
// snapshot of the actual running Three.js engine after a real scramble
// and found to match exactly. See /solver-dev/ (development-only, not
// shipped) for the derivation and validation scripts.

export const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];
export const SOLVED = Object.freeze("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB".split(''));

export const EDGE_SLOTS = {
    UB: [1, 46], UL: [3, 37], UR: [5, 10], UF: [7, 19],
    RF: [12, 23], RB: [14, 48], RD: [16, 32],
    FL: [21, 41], FD: [25, 28], DL: [30, 43], DB: [34, 52], LB: [39, 50],
};
export const CORNER_SLOTS = {
    ULB: [0, 36, 47], URB: [2, 11, 45], UFL: [6, 18, 38], URF: [8, 9, 20],
    RFD: [15, 26, 29], RDB: [17, 35, 51], FDL: [24, 27, 44], DLB: [33, 42, 53],
};

const BASE_PERMS = {
    U: [6, 3, 0, 7, 4, 1, 8, 5, 2, 45, 46, 47, 12, 13, 14, 15, 16, 17, 9, 10, 11, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 18, 19, 20, 39, 40, 41, 42, 43, 44, 36, 37, 38, 48, 49, 50, 51, 52, 53],
    R: [0, 1, 20, 3, 4, 23, 6, 7, 26, 15, 12, 9, 16, 13, 10, 17, 14, 11, 18, 19, 29, 21, 22, 32, 24, 25, 35, 27, 28, 51, 30, 31, 48, 33, 34, 45, 36, 37, 38, 39, 40, 41, 42, 43, 44, 8, 46, 47, 5, 49, 50, 2, 52, 53],
    F: [0, 1, 2, 3, 4, 5, 44, 41, 38, 6, 10, 11, 7, 13, 14, 8, 16, 17, 24, 21, 18, 25, 22, 19, 26, 23, 20, 15, 12, 9, 30, 31, 32, 33, 34, 35, 36, 37, 27, 39, 40, 28, 42, 43, 29, 45, 46, 47, 48, 49, 50, 51, 52, 53],
    D: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 24, 25, 26, 18, 19, 20, 21, 22, 23, 42, 43, 44, 33, 30, 27, 34, 31, 28, 35, 32, 29, 36, 37, 38, 39, 40, 41, 51, 52, 53, 45, 46, 47, 48, 49, 50, 15, 16, 17],
    L: [53, 1, 2, 50, 4, 5, 47, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 0, 19, 20, 3, 22, 23, 6, 25, 26, 18, 28, 29, 21, 31, 32, 24, 34, 35, 42, 39, 36, 43, 40, 37, 44, 41, 38, 45, 46, 33, 48, 49, 30, 51, 52, 27],
    B: [11, 14, 17, 3, 4, 5, 6, 7, 8, 9, 10, 35, 12, 13, 34, 15, 16, 33, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 36, 39, 42, 2, 37, 38, 1, 40, 41, 0, 43, 44, 51, 48, 45, 52, 49, 46, 53, 50, 47],
};

function invert(perm) { const inv = new Array(54); for (let i = 0; i < 54; i++) inv[perm[i]] = i; return inv; }
function compose(a, b) { const out = new Array(54); for (let i = 0; i < 54; i++) out[i] = a[b[i]]; return out; }

export const MOVE_NAMES = [];
const MOVE_PERMS = {};
for (const f of FACE_NAMES) {
    const base = BASE_PERMS[f];
    MOVE_PERMS[f] = base; MOVE_NAMES.push(f);
    MOVE_PERMS[f + "'"] = invert(base); MOVE_NAMES.push(f + "'");
    MOVE_PERMS[f + '2'] = compose(base, base); MOVE_NAMES.push(f + '2');
}

export function applyMoveName(state, name) {
    const perm = MOVE_PERMS[name];
    const out = new Array(54);
    for (let i = 0; i < 54; i++) out[i] = state[perm[i]];
    return out;
}

export function applySequence(state, seq) {
    let s = state;
    for (const m of seq) s = applyMoveName(s, m);
    return s;
}

export function slotsCorrect(state, slotIdxArrays) {
    return slotIdxArrays.every((idxs) => idxs.every((i) => state[i] === SOLVED[i]));
}

export function countWrong(state, slotIdxArrays) {
    let n = 0;
    for (const idxs of slotIdxArrays) if (!idxs.every((i) => state[i] === SOLVED[i])) n++;
    return n;
}

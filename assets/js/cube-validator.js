// Checks whether a 54-facelet string describes a PHYSICALLY POSSIBLE cube
// (reachable by turning a real cube), catching common data-entry mistakes
// (a misread sticker, a corner read in the wrong order) before wasting time
// on the solver. Based on the standard three Rubik's-cube invariants:
//   1. Edge and corner permutations must have the same parity.
//   2. The sum of edge flips must be even.
//   3. The sum of corner twists must be a multiple of 3.
// The tables below were derived and cross-checked against this app's own
// verified 3D engine (see /solver-dev/gen-*.mjs) - not hand-guessed.

export const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];
export const SOLVED = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB".split('');

export const EDGE_SLOTS = { UB: [1, 46], UL: [3, 37], UR: [5, 10], UF: [7, 19], RF: [12, 23], RB: [14, 48], RD: [16, 32], FL: [21, 41], FD: [25, 28], DL: [30, 43], DB: [34, 52], LB: [39, 50] };
export const CORNER_SLOTS = { ULB: [0, 36, 47], URB: [2, 11, 45], UFL: [6, 18, 38], URF: [8, 9, 20], RFD: [15, 26, 29], RDB: [17, 35, 51], FDL: [24, 27, 44], DLB: [33, 42, 53] };

function faceOfIndex(idx) { return FACE_NAMES[Math.floor(idx / 9)]; }
function setKey(colors) { return colors.slice().sort().join(''); }

const FACE_DIR = { U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

const edgeSlotNames = Object.keys(EDGE_SLOTS);
const cornerSlotNames = Object.keys(CORNER_SLOTS);

// Corner facelet indices reordered into a consistent clockwise-from-outside
// order, needed for a well-defined twist value.
const CORNER_IDXS_CW = {};
cornerSlotNames.forEach(slot => {
    const idxs = CORNER_SLOTS[slot];
    const dirs = idxs.map(i => FACE_DIR[faceOfIndex(i)]);
    const outward = [dirs[0][0] + dirs[1][0] + dirs[2][0], dirs[0][1] + dirs[1][1] + dirs[2][1], dirs[0][2] + dirs[1][2] + dirs[2][2]];
    const cw = dot(cross(dirs[0], dirs[1]), outward) > 0;
    CORNER_IDXS_CW[slot] = cw ? idxs : [idxs[0], idxs[2], idxs[1]];
});

const edgeHomeBySet = {};
edgeSlotNames.forEach(s => edgeHomeBySet[setKey(EDGE_SLOTS[s].map(i => SOLVED[i]))] = s);
const cornerHomeBySet = {};
cornerSlotNames.forEach(s => cornerHomeBySet[setKey(CORNER_IDXS_CW[s].map(i => SOLVED[i]))] = s);

function refPositionForEdge(idxs) {
    const faces = idxs.map(faceOfIndex);
    let pos = faces.indexOf('U'); if (pos === -1) pos = faces.indexOf('D');
    if (pos === -1) pos = faces.indexOf('F'); if (pos === -1) pos = faces.indexOf('B');
    return pos;
}
const edgeRefPos = {}; edgeSlotNames.forEach(s => edgeRefPos[s] = refPositionForEdge(EDGE_SLOTS[s]));
function refPositionForCorner(idxs) {
    const faces = idxs.map(faceOfIndex);
    let pos = faces.indexOf('U'); if (pos === -1) pos = faces.indexOf('D');
    return pos;
}
const cornerRefPos = {}; cornerSlotNames.forEach(s => cornerRefPos[s] = refPositionForCorner(CORNER_IDXS_CW[s]));

function permParity(perm) {
    const seen = new Array(perm.length).fill(false);
    let parity = 0;
    for (let i = 0; i < perm.length; i++) {
        if (seen[i]) continue;
        let len = 0, j = i;
        while (!seen[j]) { seen[j] = true; j = perm[j]; len++; }
        parity += (len - 1);
    }
    return parity % 2;
}

/**
 * Checks a 54-char facelet string (array or string, U R F D L B order) for
 * physical validity. Returns { valid: true } or { valid: false, reason }
 * where reason is one of: 'colorCount' | 'unmatchedEdge' | 'unmatchedCorner'
 * | 'badCornerColors' | 'permutationParity' | 'edgeOrientation' |
 * 'cornerOrientation'.
 */
export function verifyPhysicalCube(faceletInput) {
    const faceletArr = typeof faceletInput === 'string' ? faceletInput.split('') : faceletInput;

    const counts = {};
    faceletArr.forEach(c => counts[c] = (counts[c] || 0) + 1);
    for (const c of FACE_NAMES) if (counts[c] !== 9) return { valid: false, reason: 'colorCount' };

    const edgePerm = new Array(12);
    let edgeFlipSum = 0;
    for (let i = 0; i < 12; i++) {
        const slot = edgeSlotNames[i];
        const idxs = EDGE_SLOTS[slot];
        const colors = idxs.map(j => faceletArr[j]);
        const homeSlot = edgeHomeBySet[setKey(colors)];
        if (!homeSlot) return { valid: false, reason: 'unmatchedEdge' };
        edgePerm[i] = edgeSlotNames.indexOf(homeSlot);
        const colorThere = colors[edgeRefPos[slot]];
        const homeHasUD = homeSlot.includes('U') || homeSlot.includes('D');
        edgeFlipSum += homeHasUD
            ? ((colorThere === 'U' || colorThere === 'D') ? 0 : 1)
            : ((colorThere === 'F' || colorThere === 'B') ? 0 : 1);
    }

    const cornerPerm = new Array(8);
    let cornerTwistSum = 0;
    for (let i = 0; i < 8; i++) {
        const slot = cornerSlotNames[i];
        const idxs = CORNER_IDXS_CW[slot];
        const colors = idxs.map(j => faceletArr[j]);
        const homeSlot = cornerHomeBySet[setKey(colors)];
        if (!homeSlot) return { valid: false, reason: 'unmatchedCorner' };
        cornerPerm[i] = cornerSlotNames.indexOf(homeSlot);
        const refPos = cornerRefPos[slot];
        let twist = -1;
        for (let step = 0; step < 3; step++) {
            const c = colors[(refPos + step) % 3];
            if (c === 'U' || c === 'D') { twist = step; break; }
        }
        if (twist < 0) return { valid: false, reason: 'badCornerColors' };
        cornerTwistSum += twist;
    }

    if (permParity(edgePerm) !== permParity(cornerPerm)) return { valid: false, reason: 'permutationParity' };
    if (edgeFlipSum % 2 !== 0) return { valid: false, reason: 'edgeOrientation' };
    if (cornerTwistSum % 3 !== 0) return { valid: false, reason: 'cornerOrientation' };
    return { valid: true };
}

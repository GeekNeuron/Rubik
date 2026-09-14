// --- Own solver ------------------------------------------------------
// A from-scratch layer-by-layer solver (cross -> F2L -> OLL -> PLL),
// independent of any third-party solver library or its license:
//
//  - Cross and F2L (corners + edges) are solved by a small bounded search
//    (iterative-deepening, admissible-heuristic-pruned) that this app
//    performs itself at solve time - not a lookup, not borrowed code.
//  - OLL/PLL use a small number of "trigger" move sequences applied with
//    original case-detection logic written for this app. Two of these
//    sequences are also demonstrated in this app's own MIT-licensed
//    tutorial content (assets/js/tutorial.js) - they're standard, publicly
//    known cube algorithms (the same category of public knowledge as an
//    opening sequence in chess), not another program's source code.
//    The rest were found by this app's own search against hand-built
//    minimal test cases (see /solver-dev/, development-only tooling).
//
// This trades optimality for independence and transparency: solutions
// run well over 100 moves rather than Kociemba's ~20, but every step is
// this app's own logic, released under this project's own license.

import {
    MOVE_NAMES, applyMoveName, applySequence, slotsCorrect, countWrong,
    SOLVED, EDGE_SLOTS, CORNER_SLOTS,
} from './own-solver-engine.js';

// --- Generic bounded search, reused for cross + F2L -----------------------

function idaStar(startState, isDone, heuristic, maxDepth) {
    const path = [];
    function dfs(state, depth, lastFace) {
        if (isDone(state)) return true;
        if (depth === 0) return false;
        if (heuristic(state) > depth) return false;
        for (const m of MOVE_NAMES) {
            const face = m[0];
            if (face === lastFace) continue;
            path.push(m);
            if (dfs(applyMoveName(state, m), depth - 1, face)) return true;
            path.pop();
        }
        return false;
    }
    for (let depth = 0; depth <= maxDepth; depth++) {
        path.length = 0;
        if (dfs(startState, depth, null)) return [...path];
    }
    return null;
}

function solvePieceBySearch(state, solvedSlots, targetSlot, maxDepth) {
    const allSlots = [...solvedSlots, targetSlot];
    const isDone = (s) => slotsCorrect(s, allSlots);
    const h = (s) => countWrong(s, allSlots);
    return idaStar(state, isDone, h, maxDepth);
}

const CROSS_EDGES = ['FD', 'RD', 'DB', 'DL'];
const F2L_CORNERS = ['RFD', 'RDB', 'FDL', 'DLB'];
const F2L_EDGES = ['RF', 'RB', 'FL', 'LB'];
const U_EDGES = ['UB', 'UL', 'UR', 'UF'];
const U_CORNERS = ['ULB', 'URB', 'UFL', 'URF'];

const F2L_SLOTS = [
    ...CROSS_EDGES.map((e) => EDGE_SLOTS[e]), ...F2L_CORNERS.map((c) => CORNER_SLOTS[c]),
    ...F2L_EDGES.map((e) => EDGE_SLOTS[e]),
];

/** Solves cross + F2L one piece at a time, never disturbing pieces already placed. */
function solveF2L(state, moves) {
    let s = state;
    const solved = [];
    for (const e of CROSS_EDGES) {
        const seq = solvePieceBySearch(s, solved, EDGE_SLOTS[e], 10);
        if (!seq) throw new Error(`Cross edge ${e} unsolvable - invalid cube state?`);
        s = applySequence(s, seq); moves.push(...seq); solved.push(EDGE_SLOTS[e]);
    }
    for (const c of F2L_CORNERS) {
        const seq = solvePieceBySearch(s, solved, CORNER_SLOTS[c], 12);
        if (!seq) throw new Error(`F2L corner ${c} unsolvable - invalid cube state?`);
        s = applySequence(s, seq); moves.push(...seq); solved.push(CORNER_SLOTS[c]);
    }
    for (const e of F2L_EDGES) {
        const seq = solvePieceBySearch(s, solved, EDGE_SLOTS[e], 14);
        if (!seq) throw new Error(`F2L edge ${e} unsolvable - invalid cube state?`);
        s = applySequence(s, seq); moves.push(...seq); solved.push(EDGE_SLOTS[e]);
    }
    return s;
}

// --- OLL: orient the last layer, F2L untouched -----------------------

const U_FACE_OF = (slot) => slot.find((i) => Math.floor(i / 9) === 0);
const U_EDGE_FACE_IDX = U_EDGES.map((e) => U_FACE_OF(EDGE_SLOTS[e])); // [UB,UL,UR,UF]
const U_CORNER_FACE_IDX = U_CORNERS.map((c) => U_FACE_OF(CORNER_SLOTS[c]));

const EDGE_LINE_TRIGGER = "F R U R' U' F'".split(' '); // fixes an opposite ("line") pair - also taught in this app's tutorial as lessonOllEdges
const EDGE_ADJACENT_TRIGGER = "R' U' F' U F R".split(' '); // fixes an adjacent ("L") pair; also reduces "dot" to a line in one application
const CORNER_TWIST_TRIGGER = "R B R' F R B' R' F'".split(' ');

/**
 * Generic bounded search over combinations of a small set of "macro" move
 * sequences (each usually a known trigger, optionally preceded by a U
 * setup turn) - used for OLL-corner-orientation and PLL, where the raw
 * per-move search from solveF2L would be far too slow (some of these
 * algorithms are over a dozen moves long) but a shallow search over a
 * handful of *whole algorithms* converges almost instantly.
 */
function macroSearch(state, isDone, macros, maxMacroDepth) {
    const path = [];
    function dfs(s, depth) {
        if (isDone(s)) return true;
        if (depth === 0) return false;
        for (const macro of macros) {
            const next = applySequence(s, macro);
            path.push(macro);
            if (dfs(next, depth - 1)) return true;
            path.pop();
        }
        return false;
    }
    for (let depth = 0; depth <= maxMacroDepth; depth++) {
        path.length = 0;
        if (dfs(state, depth)) return path.flat();
    }
    return null;
}

function withAllSetups(trigger) {
    const prefixes = [[], ['U'], ['U2'], ["U'"]];
    return prefixes.map((pre) => [...pre, ...trigger]);
}

/** Like withAllSetups, but also tries a trailing AUF - needed whenever a
 * piece type solved in an *earlier* step (so it must stay exactly where it
 * is, not just relatively correct) could be displaced by a leading U
 * prefix that the current trigger's own moves don't compensate for. */
function withAllSetupsAndFollowup(trigger) {
    const prefixes = [[], ['U'], ['U2'], ["U'"]];
    const out = [];
    for (const pre of prefixes) for (const post of prefixes) out.push([...pre, ...trigger, ...post]);
    return out;
}

function orientEdges(state, moves) {
    const isDone = (s) => U_EDGE_FACE_IDX.every((i) => s[i] === 'U');
    const macros = [
        ...withAllSetups(EDGE_LINE_TRIGGER),
        ...withAllSetups(EDGE_ADJACENT_TRIGGER),
    ];
    const seq = macroSearch(state, isDone, macros, 3); // dot needs 2 applications, so depth 3 is a safe margin
    if (!seq) throw new Error('Edge orientation did not converge');
    moves.push(...seq);
    return applySequence(state, seq);
}

function orientCorners(state, moves) {
    const isDone = (s) => U_CORNER_FACE_IDX.every((i) => s[i] === 'U')
        && U_EDGE_FACE_IDX.every((i) => s[i] === 'U') && slotsCorrect(s, F2L_SLOTS);
    const inverseTrigger = [...CORNER_TWIST_TRIGGER].reverse().map(invertToken);
    const macros = [...withAllSetups(CORNER_TWIST_TRIGGER), ...withAllSetups(inverseTrigger)];
    const seq = macroSearch(state, isDone, macros, 6);
    if (!seq) throw new Error('Corner orientation did not converge');
    moves.push(...seq);
    return applySequence(state, seq);
}

function invertToken(tok) {
    if (tok.endsWith('2')) return tok;
    return tok.endsWith("'") ? tok.slice(0, -1) : tok + "'";
}

// --- PLL: permute the last layer, everything else already correct ----

const CORNER_3CYCLE = "R' F R' B2 R F' R' B2 R2".split(' '); // pure corner 3-cycle (this app's tutorial: lessonAPerm)
const EDGE_3CYCLE = "R2 U R U R' U' R' U' R' U R'".split(' '); // pure edge 3-cycle (this app's tutorial: lessonUbPerm)

function solvePllPart(state, moves, slotList, trigger, otherSlotsToPreserve) {
    const isDone = (s) => slotsCorrect(s, slotList) && (!otherSlotsToPreserve || slotsCorrect(s, otherSlotsToPreserve));
    const inverseTrigger = [...trigger].reverse().map(invertToken);
    const macroFn = otherSlotsToPreserve ? withAllSetupsAndFollowup : withAllSetups;
    const macros = [...macroFn(trigger), ...macroFn(inverseTrigger)];
    const seq = macroSearch(state, isDone, macros, otherSlotsToPreserve ? 3 : 6);
    if (!seq) throw new Error('PLL step did not converge');
    moves.push(...seq);
    return applySequence(state, seq);
}

/** A final AUF (align-U-face) so the solve ends fully solved, not just "solved modulo a U turn". */
function finalAuf(state, moves) {
    for (const uPrefix of [[], ['U'], ['U2'], ["U'"]]) {
        const candidate = applySequence(state, uPrefix);
        if (candidate.join('') === SOLVED.join('')) { moves.push(...uPrefix); return candidate; }
    }
    return state; // already checked by caller
}

/**
 * Solves a facelet string (54 chars, U/R/F/D/L/B order, 9 each - see
 * cube-validator.js for the exact convention) and returns the move list
 * to reach the solved state. Throws if the state can't be solved (should
 * only happen for a physically-invalid input, which cube-validator.js is
 * expected to have already rejected before this is ever called).
 */
export function solve(faceletString) {
    let s = faceletString.split('');
    if (s.length !== 54) throw new Error('Expected a 54-character facelet string');
    const moves = [];

    s = solveF2L(s, moves);
    s = orientEdges(s, moves);
    s = orientCorners(s, moves);
    s = solvePllPart(s, moves, U_CORNERS.map((c) => CORNER_SLOTS[c]), CORNER_3CYCLE);
    s = solvePllPart(s, moves, U_EDGES.map((e) => EDGE_SLOTS[e]), EDGE_3CYCLE, U_CORNERS.map((c) => CORNER_SLOTS[c]));
    s = finalAuf(s, moves);

    if (s.join('') !== SOLVED.join('')) throw new Error('Internal error: solve did not converge');
    return moves;
}

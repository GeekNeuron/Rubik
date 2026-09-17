// A small live ticker of move notation (R, U', F2, ...) shown under the
// move-radar corner widget - shows whatever is actually happening to the
// cube right now, from any source (manual drag, scramble, solve, tutorial
// or physical-solver playback), and clears whenever the app itself starts
// a fresh attempt (new scramble, or reaching solved).

import { isMoveTickerVisible } from './settings-state.js';

let containerEl = null;
const MAX_VISIBLE = 8;

export function initMoveTicker() {
    containerEl = document.getElementById('move-ticker');
    applyTickerVisibility();
}

export function applyTickerVisibility() {
    if (containerEl) containerEl.style.display = isMoveTickerVisible() ? '' : 'none';
}

/** Converts this app's internal {axis, slice, dir} move into standard
 * notation (U, R', F2-worthy single turns are pushed twice by callers,
 * not represented here - see cube.js). Middle-slice turns (slice === 0,
 * possible from a drag on the middle layer) use M/E/S wide-turn letters. */
export function moveToNotation({ axis, slice, dir }) {
    const FACE_BY_AXIS_SLICE = {
        'y,1': 'U', 'y,-1': 'D', 'y,0': 'E',
        'x,1': 'R', 'x,-1': 'L', 'x,0': 'M',
        'z,1': 'F', 'z,-1': 'B', 'z,0': 'S',
    };
    const NEEDS_DIR_FLIP = new Set(['D', 'L', 'B', 'E', 'M']);
    const face = FACE_BY_AXIS_SLICE[`${axis},${slice}`];
    if (!face) return '?';
    const baseDir = NEEDS_DIR_FLIP.has(face) ? -1 : 1;
    return dir === baseDir ? face : face + "'";
}

export function pushTickerMove(notation) {
    if (!containerEl) return;
    const span = document.createElement('span');
    span.className = 'ticker-move';
    span.textContent = notation;
    containerEl.appendChild(span);
    // Let the browser paint the starting state before animating in.
    requestAnimationFrame(() => span.classList.add('in'));

    while (containerEl.children.length > MAX_VISIBLE) {
        containerEl.removeChild(containerEl.firstElementChild);
    }
}

/** Clears the list - called wherever the app itself already resets the
 * cube's own move history (new scramble, reaching solved), so this
 * always matches "moves since the last fresh start" instead of drifting
 * from the rest of the app's idea of what counts as a new attempt. */
export function clearTicker() {
    if (containerEl) containerEl.innerHTML = '';
}

// A small live ticker of move notation (R, U', F2, ...) in the footer,
// replacing the static "Created by" line - shows whatever is actually
// happening to the cube right now, from any source (manual drag,
// scramble, solve, tutorial or physical-solver playback).

import { isMoveTickerVisible } from './settings-state.js';

let containerEl = null;
const MAX_VISIBLE = 14;

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
    const placeholder = containerEl.querySelector('.ticker-placeholder');
    if (placeholder) placeholder.remove();

    const span = document.createElement('span');
    span.className = 'ticker-move';
    span.textContent = notation;
    containerEl.appendChild(span);
    // Let the browser paint the starting state before animating in.
    requestAnimationFrame(() => span.classList.add('in'));

    while (containerEl.children.length > MAX_VISIBLE) {
        containerEl.removeChild(containerEl.firstElementChild);
    }
    containerEl.scrollLeft = containerEl.scrollWidth;
}

export function clearTicker() {
    if (containerEl) containerEl.innerHTML = '';
}

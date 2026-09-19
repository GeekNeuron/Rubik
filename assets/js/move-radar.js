// A small always-visible corner widget (GTA-minimap style), rebuilt to
// match the reference design: 3 axis-groups arranged like Olympic rings,
// each made of 3 concentric rings (one per layer along that axis - 9
// rings total), plus 6 small 3x3 color grids sitting at the rings'
// intersection points, one per cube face, always showing that face's
// REAL current colors (read live off the 3D cube, not simulated).
//
// Axis-group layout (SVG viewBox 0 0 100 92):
//   Y axis (U/E/D layers)  - top
//   X axis (L/M/R layers)  - bottom-left
//   Z axis (F/S/B layers)  - bottom-right
// Per group, outer ring = the "+1" layer, middle = the slice-0 middle
// layer, inner = the "-1" layer (see RING_LAYER below for the exact
// per-axis letters).

import { getFaceColorGrid } from './cube.js';

const GROUPS = {
    y: { cx: 50, cy: 34 },
    x: { cx: 33, cy: 60 },
    z: { cx: 67, cy: 60 },
};
const RADII = [24, 19, 14]; // outer -> inner, index matches RING_LAYER below
// Which layer letter each concentric ring (by slice value) belongs to,
// per axis - only used for documentation/debugging, the actual lookup by
// slice happens in pulseMove() directly.
const RING_LAYER = {
    y: { 1: 0, 0: 1, '-1': 2 }, // U=outer, E=middle, D=inner
    x: { 1: 0, 0: 1, '-1': 2 }, // R=outer, M=middle, L=inner
    z: { 1: 0, 0: 1, '-1': 2 }, // F=outer, S=middle, B=inner
};

// Each face's 3x3 grid center position, hand-placed to sit at the visual
// intersection area of the relevant pair of axis-groups (matching the
// reference image's 6 cluster spots) - not a decorative guess, this is
// where those two axes' layers actually meet on a real cube.
const FACE_POSITIONS = {
    U: { cx: 50, cy: 46 },
    D: { cx: 50, cy: 78 },
    L: { cx: 33, cy: 42 },
    R: { cx: 67, cy: 42 },
    F: { cx: 41, cy: 60 },
    B: { cx: 59, cy: 60 },
};

let ringGroupEls = {}; // axis -> [outerG, middleG, innerG]
let ringAngles = {}; // axis -> [outerDeg, middleDeg, innerDeg] (accumulated)
let faceGridEls = {}; // face -> [9 <rect> elements, row-major]

export function initMoveRadar() {
    const container = document.getElementById('move-radar-svg');
    if (!container) return;
    container.innerHTML = '';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 92');
    svg.setAttribute('aria-hidden', 'true');

    // Rings first (so face grids draw on top of them).
    Object.entries(GROUPS).forEach(([axis, { cx, cy }]) => {
        ringGroupEls[axis] = [];
        ringAngles[axis] = [0, 0, 0];
        RADII.forEach((r, i) => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'radar-ring-g');
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', cx);
            circle.setAttribute('cy', cy);
            circle.setAttribute('r', r);
            circle.setAttribute('class', `radar-ring radar-axis-${axis}`);
            circle.setAttribute('stroke-dasharray', '3.2 2.6'); // makes rotation visible
            g.appendChild(circle);
            svg.appendChild(g);
            ringGroupEls[axis].push(g);
        });
    });

    // 6 face color grids (3x3 small squares each).
    const CELL = 2.6, GAP = 0.35;
    Object.entries(FACE_POSITIONS).forEach(([face, { cx, cy }]) => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'radar-face-grid');
        const cells = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                const size = CELL - GAP;
                rect.setAttribute('width', size);
                rect.setAttribute('height', size);
                rect.setAttribute('rx', 0.5);
                rect.setAttribute('x', cx - 1.5 * CELL + col * CELL);
                rect.setAttribute('y', cy - 1.5 * CELL + row * CELL);
                rect.setAttribute('class', 'radar-cell');
                g.appendChild(rect);
                cells.push(rect);
            }
        }
        svg.appendChild(g);
        faceGridEls[face] = cells;
    });

    container.appendChild(svg);
    refreshAllFaces();
}

/** Re-reads all 6 faces' current colors from the live cube and repaints
 * the mini-grids - called on init and after every move. */
export function refreshAllFaces() {
    Object.keys(FACE_POSITIONS).forEach(face => {
        const grid = getFaceColorGrid(face);
        const cells = faceGridEls[face];
        if (!grid || !cells) return;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const color = grid[row][col];
                if (color) cells[row * 3 + col].style.fill = color;
            }
        }
    });
}

/**
 * Rotates the one specific ring that corresponds to this exact move
 * (axis + which of the 3 layers) by a real 90 degrees in the correct
 * direction, and refreshes the face-color grids to match the result -
 * called once per applied move, from cube.js.
 */
export function pulseMove({ axis, slice, dir }) {
    const group = ringGroupEls[axis];
    const layerIdx = RING_LAYER[axis] ? RING_LAYER[axis][slice] : undefined;
    if (group && layerIdx !== undefined) {
        const g = group[layerIdx];
        ringAngles[axis][layerIdx] += dir * 90;
        g.style.transform = `rotate(${ringAngles[axis][layerIdx]}deg)`;
    }
    refreshAllFaces();
}

// Builds an SVG diagram (code-generated, no image assets) that explains how
// to read each face's 3x3 grid in the color-net input: for every face block,
// a small arrow+label on its top edge and right edge shows which neighboring
// face that edge is turned toward - derived directly from the same
// up/right basis used to build the facelet string, so it can never drift
// out of sync with the actual input logic.

// up/right neighbor-face for each block, in NET_FACE_ORDER-independent form.
const ORIENTATION = {
    U: { top: 'B', right: 'R' },
    D: { top: 'F', right: 'R' },
    F: { top: 'U', right: 'R' },
    B: { top: 'U', right: 'L' },
    R: { top: 'U', right: 'B' },
    L: { top: 'U', right: 'F' },
};

const FACE_COLOR_HINT = { U: '#FFFFFF', D: '#FFD500', F: '#009E60', B: '#0051BA', R: '#C41E3A', L: '#FF5800' };

function faceBlockSvg(face, x, y, size) {
    const s = size;
    const half = s / 2;
    return `
    <g transform="translate(${x},${y})">
      <rect width="${s}" height="${s}" fill="${FACE_COLOR_HINT[face]}" stroke="#333" stroke-width="1.5" rx="4"/>
      <text x="${half}" y="${half + 5}" font-size="15" font-weight="bold" text-anchor="middle" fill="#00000099">${face}</text>
      <!-- top arrow: points up, toward the neighbor shown -->
      <line x1="${half}" y1="-4" x2="${half}" y2="-16" stroke="currentColor" stroke-width="2" marker-end="url(#arrowhead)"/>
      <text x="${half}" y="-20" font-size="12" text-anchor="middle" fill="currentColor">${ORIENTATION[face].top}</text>
      <!-- right arrow: points right, toward the neighbor shown -->
      <line x1="${s + 4}" y1="${half}" x2="${s + 15}" y2="${half}" stroke="currentColor" stroke-width="2" marker-end="url(#arrowhead)"/>
      <text x="${s + 24}" y="${half + 4}" font-size="12" text-anchor="middle" fill="currentColor">${ORIENTATION[face].right}</text>
    </g>`;
}

/**
 * A small isometric "how to hold it" reference icon: shows the U (top),
 * F (front), and R (right) faces of a cube from a fixed 3/4 view, using the
 * exact same default colors as the net's palette - a concrete visual anchor
 * to go with the abstract arrow diagram below, aimed at complete beginners.
 */
export function buildHoldReferenceSvg() {
    return `
<svg viewBox="0 0 160 150" xmlns="http://www.w3.org/2000/svg" class="ps-hold-icon" role="img" aria-label="how to hold the cube">
  <polygon points="80,10 140,45 80,80 20,45" fill="${FACE_COLOR_HINT.U}" stroke="#333" stroke-width="1.5"/>
  <polygon points="20,45 80,80 80,140 20,105" fill="${FACE_COLOR_HINT.F}" stroke="#333" stroke-width="1.5"/>
  <polygon points="80,80 140,45 140,105 80,140" fill="${FACE_COLOR_HINT.R}" stroke="#333" stroke-width="1.5"/>
  <text x="80" y="48" font-size="13" font-weight="bold" text-anchor="middle" fill="#00000099">U</text>
  <text x="48" y="98" font-size="13" font-weight="bold" text-anchor="middle" fill="#ffffffcc">F</text>
  <text x="112" y="98" font-size="13" font-weight="bold" text-anchor="middle" fill="#ffffffcc">R</text>
</svg>`;
}

export function buildOrientationGuideSvg() {
    const s = 44; // block size
    const gap = 34; // extra room for arrows/labels between blocks
    const cell = s + gap;
    // cross layout positions (col,row) in grid units: U at (1,0); L,F,R,B at row1 col0-3; D at (1,2)
    const positions = {
        U: [1, 0], L: [0, 1], F: [1, 1], R: [2, 1], B: [3, 1], D: [1, 2],
    };
    const pad = 26;
    const width = 4 * cell + pad * 2;
    const height = 3 * cell + pad * 2;

    let blocks = '';
    Object.entries(positions).forEach(([face, [cx, cy]]) => {
        blocks += faceBlockSvg(face, pad + cx * cell, pad + cy * cell, s);
    });

    return `
<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="ps-orientation-svg" role="img" aria-label="orientation guide">
  <defs>
    <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/>
    </marker>
  </defs>
  ${blocks}
</svg>`;
}

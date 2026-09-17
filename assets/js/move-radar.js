// A small always-visible corner widget (GTA-minimap style) showing which
// rotation axis the cube just turned on. Three overlapping circles, one
// per axis (x/y/z) - visually echoes the "three generators" idea from the
// reference intro animation, but reacts live to the player's own moves
// instead of playing a fixed decorative loop.

const AXIS_POSITIONS = {
    y: { cx: 50, cy: 30 }, // top
    x: { cx: 32, cy: 62 }, // bottom-left
    z: { cx: 68, cy: 62 }, // bottom-right
};
const RADIUS = 26;

let circleEls = {};

export function initMoveRadar() {
    const container = document.getElementById('move-radar-svg');
    if (!container) return;

    container.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 90');
    svg.setAttribute('aria-hidden', 'true');

    Object.entries(AXIS_POSITIONS).forEach(([axis, { cx, cy }]) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', RADIUS);
        circle.setAttribute('class', `radar-circle radar-axis-${axis}`);
        svg.appendChild(circle);
        circleEls[axis] = circle;
    });

    container.appendChild(svg);
}

/** Briefly highlights the circle for this axis - called once per move. */
export function pulseAxis(axis) {
    const circle = circleEls[axis];
    if (!circle) return;
    circle.classList.remove('pulse'); // restart the animation even if it's already mid-pulse
    // eslint-disable-next-line no-unused-expressions
    circle.getBoundingClientRect(); // force reflow so removing+re-adding the class actually restarts the CSS animation
    circle.classList.add('pulse');
}

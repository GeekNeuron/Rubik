// This file is now a wrapper around the powerful 'cube.js' solver library (which defines a global 'Cube' object).

// --- The Logical Core of the Cube ---

let cube = null; // This will hold the solver's cube instance
let isRotatingState = false;

/**
 * Initializes the logical state of the cube.
 */
export function initState() {
    // Cube.initSolver() is a necessary step for the solver library
    if (typeof Cube !== 'undefined' && !Cube.scramble) {
        Cube.initSolver();
    }
    cube = new Cube();
    return cube;
}

/**
 * Applies a move string (e.g., "R", "U'", "F2") to the logical state.
 */
export function applyMove(moveString) {
    if (!cube) return;
    cube.move(moveString);
}

/**
 * Generates a random scramble string.
 * @returns {string} A standard scramble string.
 */
export function getScramble() {
    if (!cube) initState();
    return Cube.scramble();
}

/**
 * Gets the optimal solution for the current cube state.
 * @returns {string} The solution string (e.g., "R U R'").
 */
export function getSolution() {
    if (!cube) return "";
    return cube.solve();
}

/**
 * Checks if the cube is solved.
 * @returns {boolean} True if the cube is solved.
 */
export function isSolved() {
    if (!cube) return true;
    return cube.isSolved();
}

/**
 * Converts the current state to the 54-character facelet string.
 * This is needed to map the logical state to the visual one.
 * @returns {string} The facelet string.
 */
export function toFaceletString() {
    if (!cube) return "";
    return cube.toString();
}

// Simple state management for rotation lock
export const isRotating = () => isRotatingState;
export const setRotating = (state) => { isRotatingState = state; };

import * as THREE from 'three';

// --- The Logical Core of the Cube ---

let pieces = [];
let isRotatingState = false;
let gameReadyState = false;
let moveHistory = []; 

/**
 * Initializes the logical state of the cube.
 */
export function initState() {
    pieces = [];
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 && y === 0 && z === 0) continue;
                pieces.push({
                    name: `cubie_${x}_${y}_${z}`,
                    initialPosition: { x, y, z },
                    position: new THREE.Vector3(x, y, z),
                    quaternion: new THREE.Quaternion(),
                });
            }
        }
    }
    return pieces;
}

/**
 * Resets the cube to its initial, solved state and clears history.
 */
function resetState() {
    initState();
    setGameReady(false);
    moveHistory = [];
    return pieces;
}

/**
 * Applies a single move to the logical state.
 */
function applySingleMove(move) {
    const { axis, dir } = move;
    const angle = (Math.PI / 2) * dir * -1;
    const rotationMatrix = new THREE.Matrix4();
    
    if (axis === 'y') rotationMatrix.makeRotationY(angle);
    if (axis === 'x') rotationMatrix.makeRotationX(angle);
    if (axis === 'z') rotationMatrix.makeRotationZ(angle);

    pieces.forEach(piece => {
        if (isPieceOnSlice(piece, move)) {
            piece.position.applyMatrix4(rotationMatrix).round();
            const rotationQuaternion = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);
            piece.quaternion.premultiply(rotationQuaternion);
        }
    });
}

/**
 * The public function for making a move. It applies the move AND records it to the history.
 */
export function applyMove(move) {
    if (!gameReadyState) {
        moveHistory.push(move);
    }
    applySingleMove(move);
    return pieces;
}

/**
 * Scrambles the cube.
 */
export function scramble() {
    resetState();
    const moves = ['x', 'y', 'z'];
    const slices = [-1, 0, 1];
    const dirs = [-1, 1];
    const scrambleTurnCount = 20;

    for (let i = 0; i < scrambleTurnCount; i++) {
        const randomAxis = moves[Math.floor(Math.random() * moves.length)];
        const randomSlice = slices[Math.floor(Math.random() * slices.length)];
        const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
        applySingleMove({ axis: randomAxis, slice: randomSlice, dir: randomDir });
    }
    
    setGameReady(true);
    return pieces;
}

/**
 * Returns the sequence of moves to solve the cube by reversing the history.
 */
export function getSolution() {
    const solutionMoves = [];
    for (let i = moveHistory.length - 1; i >= 0; i--) {
        const move = moveHistory[i];
        solutionMoves.push({
            ...move,
            dir: move.dir * -1
        });
    }
    moveHistory = [];
    return solutionMoves;
}

// highlight-start
/**
 * Gets the names of cubies on a specific face for animation purposes.
 * This function is now correctly exported.
 * @param {{axis: string, slice: number}} move
 * @returns {Array<string>} An array of cubie names.
 */
export function getCubiesOnFace(move) {
// highlight-end
    const cubieNames = [];
    pieces.forEach(piece => {
        if (isPieceOnSlice(piece, move)) {
            cubieNames.push(piece.name);
        }
    });
    return cubieNames;
}

function isPieceOnSlice(piece, move) {
    const { axis, slice } = move;
    return Math.abs(piece.position[axis] - slice) < 0.1;
}

export function isSolved() {
    const identityQuaternion = new THREE.Quaternion();
    const epsilon = 0.001; 
    return pieces.every(piece => {
        const initialPosVec = new THREE.Vector3(piece.initialPosition.x, piece.initialPosition.y, piece.initialPosition.z);
        const positionMatches = piece.position.equals(initialPosVec);
        const rotationMatches = piece.quaternion.angleTo(identityQuaternion) < epsilon;
        return positionMatches && rotationMatches;
    });
}

export const isRotating = () => isRotatingState;
export const setRotating = (state) => { isRotatingState = state; };
export const isGameReady = () => gameReadyState;
export const setGameReady = (state) => { gameReadyState = state; };

import * as THREE from 'three';

let pieces = [];
let isRotatingState = false;
let gameReadyState = false;
// Add a move history to track all moves since the last scramble
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
export function resetState() {
    initState();
    setGameReady(false);
    moveHistory = []; // Clear history on reset
    return pieces;
}

/**
 * Applies a move to the logical state and records it.
 */
export function applyMove(move) {
    // Record the move before applying it, but only if the game has started
    if (!isGameReady()) {
        moveHistory.push(move);
    }

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
        applyMove({ axis: randomAxis, slice: randomSlice, dir: randomDir });
    }
    
    moveHistory = []; // Clear the history of scramble moves
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
            dir: move.dir * -1 // Reverse the direction
        });
    }
    moveHistory = [];
    return solutionMoves;
}

export function getCubiesOnFace(move) {
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
export const setGameReady = (state) => { isRotatingState = false; gameReadyState = state; }; // Also unlock rotation

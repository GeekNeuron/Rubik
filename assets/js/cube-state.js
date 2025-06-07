import * as THREE from 'three';

// --- The Logical Core of the Cube ---

let pieces = [];
let isRotatingState = false;
// A flag to track if the game is in a "ready to start" state after a scramble.
let gameReadyState = false;

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
 * Resets the cube to its initial, solved state.
 */
export function resetState() {
    initState();
    setGameReady(false); // Game is not ready to start until scrambled
    return pieces;
}

/**
 * Applies a move to the logical state.
 */
export function applyMove(move) {
    const { axis, dir } = move;
    const angle = (Math.PI / 2) * dir * -1; // Rotation angle
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
 * Applies a series of random moves to the cube to scramble it.
 */
export function scramble() {
    // Always start scrambling from a solved state
    resetState();
    
    const moves = ['x', 'y', 'z'];
    const slices = [-1, 0, 1];
    const dirs = [-1, 1];
    const scrambleTurnCount = 20; // Number of random turns

    for (let i = 0; i < scrambleTurnCount; i++) {
        const randomAxis = moves[Math.floor(Math.random() * moves.length)];
        const randomSlice = slices[Math.floor(Math.random() * slices.length)];
        const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
        
        applyMove({ axis: randomAxis, slice: randomSlice, dir: randomDir });
    }
    
    // Set the game state to "ready" so the timer can start on the next move
    setGameReady(true);
    return pieces;
}

/**
 * Gets the names of cubies on a specific face for animation purposes.
 */
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

/**
 * Checks if the cube is in its solved state.
 */
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

// State management functions
export const isRotating = () => isRotatingState;
export const setRotating = (state) => { isRotatingState = state; };
export const isGameReady = () => gameReadyState;
export const setGameReady = (state) => { gameReadyState = state; };

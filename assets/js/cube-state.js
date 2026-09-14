import * as THREE from 'three';

// --- The Logical Core of the Cube ---

let pieces = [];
let isRotatingState = false;
let gameReadyState = false;

// Every move applied since the cube was last in a solved state (scramble
// moves AND manual moves). Solve always reverses this full list, so it can
// bring the cube back to solved no matter how it got scrambled.
let moveHistory = [];

/**
 * Converts a move's direction into a rotation angle. This is the SINGLE
 * source of truth for "which way does this move turn things" - both the
 * logical transform below and the visual animation (in cube.js) use this,
 * so they can never drift apart into an animation that spins the wrong way.
 */
export function getMoveAngle(dir) {
    return (Math.PI / 2) * dir * -1;
}

/**
 * Initializes the logical state of the cube to solved, and clears history.
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
    moveHistory = [];
    setGameReady(false);
    return pieces;
}

/**
 * Resets to a fresh solved state, ready to be scrambled.
 */
/**
 * Replaces the current logical state wholesale with a deep copy of
 * `newPieces` - used by playback features (physical-solver, tutorial) that
 * need to jump to an arbitrary point without touching the scramble/solve
 * history.
 */
export function setPiecesState(newPieces) {
    pieces = newPieces.map(p => ({
        name: p.name,
        initialPosition: p.initialPosition,
        position: p.position.clone(),
        quaternion: p.quaternion.clone(),
    }));
    return pieces;
}

export function getPiecesSnapshot() {
    return pieces.map(p => ({
        name: p.name,
        initialPosition: p.initialPosition,
        position: p.position.clone(),
        quaternion: p.quaternion.clone(),
    }));
}

export function resetForScramble() {
    return initState();
}

function applyTransform(move) {
    const { axis, slice } = move;
    const angle = getMoveAngle(move.dir);
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
 * The SINGLE public entry point for making a move, whether it comes from a
 * scramble sequence or a user's drag. It applies the move AND always
 * records it to history - this is what makes "Solve" actually work: it can
 * reconstruct the exact path back to solved regardless of how the cube got
 * into its current state.
 */
export function applyMove(move) {
    applyTransform(move);
    moveHistory.push(move);
    return pieces;
}

/**
 * Generates a list of random scramble moves without applying them, so the
 * caller (cube.js) can animate them one by one just like a solve playback.
 */
export function generateScrambleMoves(count = 20) {
    const axes = ['x', 'y', 'z'];
    const slices = [-1, 0, 1];
    const dirs = [-1, 1];
    const moves = [];
    for (let i = 0; i < count; i++) {
        moves.push({
            axis: axes[Math.floor(Math.random() * axes.length)],
            slice: slices[Math.floor(Math.random() * slices.length)],
            dir: dirs[Math.floor(Math.random() * dirs.length)],
        });
    }
    return moves;
}

/**
 * Returns the sequence of moves that will undo everything applied since the
 * cube was last solved (the full scramble + manual move history so far).
 */
export function getSolution() {
    const solutionMoves = [];
    for (let i = moveHistory.length - 1; i >= 0; i--) {
        const move = moveHistory[i];
        solutionMoves.push({ ...move, dir: move.dir * -1 });
    }
    return solutionMoves;
}

/**
 * Call once the cube is confirmed solved (by hand or via the Solve button)
 * so a brand new history starts accumulating from this point.
 */
export function clearHistory() {
    moveHistory = [];
}

export function hasHistory() {
    return moveHistory.length > 0;
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
    if (move.slice === null) return true; // whole-cube rotation: every piece moves
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

/**
 * Reads the current cube state and reports how far along a standard
 * layer-by-layer solve it is - used by the tutorial to suggest what to
 * learn next. Treats the fixed U layer as "first layer" and D layer as
 * "last layer", matching the rest of this app's coordinate convention.
 */
export function detectProgress() {
    const identityQuaternion = new THREE.Quaternion();
    const epsilon = 0.001;
    function pieceCorrect(piece) {
        const initialPosVec = new THREE.Vector3(piece.initialPosition.x, piece.initialPosition.y, piece.initialPosition.z);
        return piece.position.equals(initialPosVec) && piece.quaternion.angleTo(identityQuaternion) < epsilon;
    }
    const uEdges = pieces.filter(p => p.initialPosition.y === 1 && (p.initialPosition.x === 0 || p.initialPosition.z === 0));
    const uCorners = pieces.filter(p => p.initialPosition.y === 1 && p.initialPosition.x !== 0 && p.initialPosition.z !== 0);
    const midEdges = pieces.filter(p => p.initialPosition.y === 0);
    const dLayer = pieces.filter(p => p.initialPosition.y === -1);

    const cross = uEdges.every(pieceCorrect);
    const f2l = cross && uCorners.every(pieceCorrect) && midEdges.every(pieceCorrect);

    // OLL = last layer correctly ORIENTED (not necessarily permuted): every
    // D-layer piece's own D-facing sticker actually points toward D.
    const downDir = new THREE.Vector3(0, -1, 0);
    const oll = f2l && dLayer.every(piece => {
        const originalDown = piece.initialPosition.y === -1
            ? new THREE.Vector3(0, -1, 0) : null;
        if (!originalDown) return true;
        const nowDir = originalDown.clone().applyQuaternion(piece.quaternion).round();
        return nowDir.distanceTo(downDir) < 0.1;
    });

    const solved = isSolved();
    return { cross, f2l, oll, solved };
}

export const isRotating = () => isRotatingState;
export const setRotating = (state) => { isRotatingState = state; };
export const isGameReady = () => gameReadyState;
export const setGameReady = (state) => { gameReadyState = state; };

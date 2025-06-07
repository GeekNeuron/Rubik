import * as THREE from 'three';

// --- The Logical Core of the Cube ---

let pieces = [];
let isRotatingState = false;

/**
 * Initializes the logical state of the cube.
 * Each piece has a position and a rotation (quaternion).
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
 * Applies a move to the logical state.
 * This is pure math and has no floating point errors.
 * @param {{axis: string, slice: number, dir: number}} move
 * @returns {Array} The new state array.
 */
export function applyMove(move) {
    const { axis, dir } = move;
    const angle = (Math.PI / 2) * dir * -1; // Rotation angle
    const rotationMatrix = new THREE.Matrix4();
    
    if (axis === 'y') rotationMatrix.makeRotationY(angle);
    if (axis === 'x') rotationMatrix.makeRotationX(angle);
    if (axis === 'z') rotationMatrix.makeRotationZ(angle);

    pieces.forEach(piece => {
        // Check if the piece is on the slice to be rotated
        if (isPieceOnSlice(piece, move)) {
            // Apply rotation to the piece's position vector
            piece.position.applyMatrix4(rotationMatrix).round();
            
            // Apply rotation to the piece's orientation (quaternion)
            const rotationQuaternion = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);
            piece.quaternion.premultiply(rotationQuaternion);
        }
    });
    
    return pieces;
}

/**
 * Gets the names of cubies on a specific face for animation purposes.
 * @param {{axis: string, slice: number}} move
 * @returns {Array<string>} An array of cubie names.
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

// Simple state management for rotation lock
export const isRotating = () => isRotatingState;
export const setRotating = (state) => { isRotatingState = state; };

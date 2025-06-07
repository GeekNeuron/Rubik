import * as THREE from 'three';
// The imported functions from cube-state are now correct and complete
import { applyMove, getCubiesOnFace, isRotating, setRotating, getSolution, scramble as scrambleState } from './cube-state.js';
import { resetClock } from './ui-handler.js';

const CUBIE_SIZE = 1;
const SPACING = 0.05;

/**
 * Creates a single visual cubie piece.
 */
function createVisualCubie(x, y, z) {
    const geometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
    const materials = [
        new THREE.MeshLambertMaterial({ color: new THREE.Color(getCssColor('--color-right')) }),
        new THREE.MeshLambertMaterial({ color: new THREE.Color(getCssColor('--color-left')) }),
        new THREE.MeshLambertMaterial({ color: new THREE.Color(getCssColor('--color-up')) }),
        new THREE.MeshLambertMaterial({ color: new THREE.Color(getCssColor('--color-down')) }),
        new THREE.MeshLambertMaterial({ color: new THREE.Color(getCssColor('--color-front')) }),
        new THREE.MeshLambertMaterial({ color: new THREE.Color(getCssColor('--color-back')) }),
    ];

    const insideColor = new THREE.Color(getCssColor('--color-inside'));
    if (x !== 1) materials[0].color.set(insideColor);
    if (x !== -1) materials[1].color.set(insideColor);
    if (y !== 1) materials[2].color.set(insideColor);
    if (y !== -1) materials[3].color.set(insideColor);
    if (z !== 1) materials[4].color.set(insideColor);
    if (z !== -1) materials[5].color.set(insideColor);

    const cubie = new THREE.Mesh(geometry, materials);
    cubie.name = `cubie_${x}_${y}_${z}`;
    return cubie;
}

/**
 * Creates the main THREE.Group and populates it with visual cubies.
 */
export function createRubiksCubeGroup(logicalState) {
    const cubeGroup = new THREE.Group();
    cubeGroup.name = "RubiksCube";
    logicalState.forEach(piece => {
        const { x, y, z } = piece.initialPosition;
        const cubie = createVisualCubie(x, y, z);
        cubeGroup.add(cubie);
    });
    syncVisualsToState(logicalState, cubeGroup);
    return cubeGroup;
}


/**
 * The "Snap-to-Grid" function. It forces the visual objects to match the logical state.
 */
export function syncVisualsToState(logicalState, cubeGroup) {
    if (!cubeGroup) return;
    logicalState.forEach(piece => {
        const cubieObject = cubeGroup.getObjectByName(piece.name);
        if (cubieObject) {
            const visualPos = new THREE.Vector3(
                piece.position.x * (CUBIE_SIZE + SPACING),
                piece.position.y * (CUBIE_SIZE + SPACING),
                piece.position.z * (CUBIE_SIZE + SPACING)
            );
            cubieObject.position.copy(visualPos);
            cubieObject.quaternion.copy(piece.quaternion);
        }
    });
}

/**
 * A placeholder function to handle color updates.
 * This function is now correctly exported to fix the error.
 */
export function updateCubeColors() {
    alert("Live color update is not fully implemented yet. Please scramble or refresh.");
}

// --- Helper Functions ---
function getCssColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#FF00FF';
}

// The rest of your cube.js logic (solveCube, scrambleCube, rotateFace, etc.)
// should already be in your file and remains unchanged. If you need the full
// logic again, please let me know.

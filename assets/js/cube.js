import * as THREE from 'three';

const CUBIE_SIZE = 1;
const SPACING = 0.05;
let cubeGroup;

/**
 * Creates a single small cube (a "cubie").
 * @param {number} x - The x-coordinate of the cubie.
 * @param {number} y - The y-coordinate of the cubie.
 * @param {number} z - The z-coordinate of the cubie.
 * @returns {THREE.Mesh} The created cubie mesh.
 */
function createCubie(x, y, z) {
    const geometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
    const materials = [
        new THREE.MeshLambertMaterial({ color: getCssColor('--color-right') }),
        new THREE.MeshLambertMaterial({ color: getCssColor('--color-left') }),
        new THREE.MeshLambertMaterial({ color: getCssColor('--color-up') }),
        new THREE.MeshLambertMaterial({ color: getCssColor('--color-down') }),
        new THREE.MeshLambertMaterial({ color: getCssColor('--color-front') }),
        new THREE.MeshLambertMaterial({ color: getCssColor('--color-back') }),
    ];
    const insideColor = getCssColor('--color-inside');
    if (x !== 1) materials[0].color.set(insideColor);
    if (x !== -1) materials[1].color.set(insideColor);
    if (y !== 1) materials[2].color.set(insideColor);
    if (y !== -1) materials[3].color.set(insideColor);
    if (z !== 1) materials[4].color.set(insideColor);
    if (z !== -1) materials[5].color.set(insideColor);

    const cubie = new THREE.Mesh(geometry, materials);
    cubie.position.set(
        x * (CUBIE_SIZE + SPACING),
        y * (CUBIE_SIZE + SPACING),
        z * (CUBIE_SIZE + SPACING)
    );
    return cubie;
}

/**
 * Creates the entire 3x3x3 Rubik's Cube group.
 * @returns {THREE.Group} The group containing all 26 cubies.
 */
export function createRubiksCube() {
    cubeGroup = new THREE.Group();
    // Name the group so we can easily find it in the scene later
    cubeGroup.name = "RubiksCube";
    
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 && y === 0 && z === 0) continue; // Skip the center piece
                const cubie = createCubie(x, y, z);
                cubeGroup.add(cubie);
            }
        }
    }
    return cubeGroup;
}

export function scrambleCube() {
    console.log("Scrambling the cube...");
    alert("Scramble feature is not yet implemented.");
}

export function solveCube() {
    console.log("Solving the cube...");
    alert("Solve feature is not yet implemented.");
}

export function updateCubeColors() {
    if (!cubeGroup) return;
    alert("The cube must be rebuilt for colors to apply. Please refresh the page.");
}

function getCssColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

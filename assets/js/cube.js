// This line has been modified to point to the local file in the libs folder
import * as THREE from '../../libs/three.module.js';

const CUBIE_SIZE = 1;
const SPACING = 0.05;

let cubeGroup;

// Function to create a single cubie
function createCubie(x, y, z) {
    const geometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
    
    // Define materials for each face
    const materials = [
        new THREE.MeshLambertMaterial({ color: getCssColor('--color-right') }),   // Right
        new THREE.MeshLambertMaterial({ color: getCssColor('--color-left') }),    // Left
        new THREE.MeshLambertMaterial({ color: getCssColor('--color-up') }),      // Top
        new THREE.MeshLambertMaterial({ color: getCssColor('--color-down') }),   // Bottom
        new THREE.MeshLambertMaterial({ color: getCssColor('--color-front') }),   // Front
        new THREE.MeshLambertMaterial({ color: getCssColor('--color-back') }),    // Back
    ];

    // Color the inside faces
    const insideColor = getCssColor('--color-inside');
    if (x !== 1) materials[0].color.set(insideColor); // Right face
    if (x !== -1) materials[1].color.set(insideColor); // Left face
    if (y !== 1) materials[2].color.set(insideColor); // Top face
    if (y !== -1) materials[3].color.set(insideColor); // Bottom face
    if (z !== 1) materials[4].color.set(insideColor); // Front face
    if (z !== -1) materials[5].color.set(insideColor); // Back face

    const cubie = new THREE.Mesh(geometry, materials);
    cubie.position.set(
        x * (CUBIE_SIZE + SPACING),
        y * (CUBIE_SIZE + SPACING),
        z * (CUBIE_SIZE + SPACING)
    );
    return cubie;
}

export function createRubiksCube() {
    cubeGroup = new THREE.Group();
    // Create the 26 cubies (3x3x3 minus the center)
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
    // TODO: Implement scramble logic
    alert("Scramble feature is not yet implemented.");
}

export function solveCube() {
    console.log("Solving the cube...");
    // TODO: Implement solve logic
    alert("Solve feature is not yet implemented.");
}

export function updateCubeColors() {
    if (!cubeGroup) return;
    // TODO: Implement logic to update colors after changing in the settings menu
    alert("The cube must be rebuilt for colors to apply. Please refresh the page.");
}


// Helper utility to read color from CSS variables
function getCssColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

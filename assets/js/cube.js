import * as THREE from 'three';

const CUBIE_SIZE = 1;
const SPACING = 0.05;
let cubeGroup;
// A flag to prevent new moves while a rotation animation is active
export let isRotating = false; 

/**
 * Creates a single small cube (a "cubie").
 * This version has been fixed to prevent the 'color is undefined' error.
 * @param {number} x - The x-coordinate of the cubie.
 * @param {number} y - The y-coordinate of the cubie.
 * @param {number} z - The z-coordinate of the cubie.
 * @returns {THREE.Mesh} The created cubie mesh.
 */
function createCubie(x, y, z) {
    const geometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
    
    // FIX: Directly create new THREE.Color objects from the CSS variables
    // This ensures that the color is defined when the material is created.
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
    cubie.position.set(
        x * (CUBIE_SIZE + SPACING),
        y * (CUBIE_SIZE + SPACING),
        z * (CUBIE_SIZE + SPACING)
    );
    return cubie;
}

/**
 * Creates the entire 3x3x3 Rubik's Cube group.
 */
export function createRubiksCube() {
    cubeGroup = new THREE.Group();
    cubeGroup.name = "RubiksCube";
    
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 && y === 0 && z === 0) continue;
                const cubie = createCubie(x, y, z);
                cubeGroup.add(cubie);
            }
        }
    }
    return cubeGroup;
}


// --- Rotation Logic ---

const pivot = new THREE.Group();

/**
 * The main function to rotate a face of the cube.
 * @param {THREE.Object3D} clickedObject - The cubie that was clicked.
 * @param {string} dragDirection - The direction of the drag ('UP', 'DOWN', 'LEFT', 'RIGHT').
 * @param {THREE.Scene} scene - The main scene object.
 * @param {Function} onRotationComplete - Callback to run when animation finishes.
 */
export function rotateFace(clickedObject, dragDirection, scene, onRotationComplete) {
    if (isRotating) return;
    
    const faceNormal = clickedObject.face.normal;
    const clickedCubie = clickedObject.object;
    
    const rotation = getRotationInfo(faceNormal, dragDirection);
    if (!rotation) {
        onRotationComplete(); // Ensure controls are re-enabled even if move is invalid
        return;
    }
    
    isRotating = true;

    // Correctly get the cubies on the face to rotate
    const activeCubies = getCubiesOnFace(rotation.axisName, clickedCubie.position);

    // Use a pivot for smooth rotation
    scene.add(pivot);
    pivot.rotation.set(0, 0, 0); // Reset pivot
    pivot.position.set(0, 0, 0);

    activeCubies.forEach(cubie => {
        pivot.attach(cubie);
    });
    
    // Animate the rotation
    animateRotation(pivot, rotation.axis, rotation.angle, () => {
        // After animation, re-parent the cubies to the main cube group
        while(pivot.children.length > 0) {
            const cubie = pivot.children[0];
            // Update matrix before detaching to preserve world transform
            cubie.updateMatrixWorld(); 
            cubeGroup.attach(cubie);
        }
        scene.remove(pivot);
        isRotating = false;
        if (onRotationComplete) onRotationComplete();
    });
}

/**
 * Animates the rotation of a pivot group.
 * This version uses the correct, modern Three.js methods.
 */
function animateRotation(target, axis, angle, onComplete) {
    const startQuaternion = new THREE.Quaternion().copy(target.quaternion);
    const endQuaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle).multiply(startQuaternion);
    
    const duration = 300; // 300ms animation
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Slerp (Spherical Linear Interpolation) for smooth quaternion rotation
        target.quaternion.slerpQuaternions(startQuaternion, endQuaternion, progress);

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            // Ensure final rotation is exact
            target.quaternion.copy(endQuaternion);
            onComplete();
        }
    }
    requestAnimationFrame(step);
}

/**
 * Determines which cubies are on the face to be rotated.
 * @param {string} axisName - 'x', 'y', or 'z'.
 * @param {THREE.Vector3} position - The position of the clicked cubie.
 * @returns {Array<THREE.Object3D>}
 */
function getCubiesOnFace(axisName, position) {
    const cubies = [];
    const threshold = 0.5; // Tolerance for floating point inaccuracies
    
    cubeGroup.children.forEach(cubie => {
        if (Math.abs(cubie.position[axisName] - position[axisName]) < threshold) {
            cubies.push(cubie);
        }
    });
    return cubies;
}

/**
 * A robust mapping to determine rotation axis and angle.
 * @returns {{axis: THREE.Vector3, axisName: string, angle: number}}
 */
function getRotationInfo(faceNormal, dragDirection) {
    const axis = new THREE.Vector3();
    let axisName = '';
    let angle = Math.PI / 2; // 90 degrees

    const roundedNormal = new THREE.Vector3(Math.round(faceNormal.x), Math.round(faceNormal.y), Math.round(faceNormal.z));

    if (roundedNormal.z === 1) { // Front face
        axisName = 'z';
        axis.set(dragDirection === 'UP' || dragDirection === 'DOWN' ? -1 : 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? 1 : 0, 0);
        if (dragDirection === 'UP' || dragDirection === 'RIGHT') angle *= -1;
    } else if (roundedNormal.z === -1) { // Back face
        axisName = 'z';
        axis.set(dragDirection === 'UP' || dragDirection === 'DOWN' ? 1 : 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? -1 : 0, 0);
        if (dragDirection === 'UP' || dragDirection === 'RIGHT') angle *= -1;
    } else if (roundedNormal.y === 1) { // Top face
        axisName = 'y';
        axis.set(dragDirection === 'UP' || dragDirection === 'DOWN' ? -1 : 0, 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? 1 : 0);
        if (dragDirection === 'UP' || dragDirection === 'RIGHT') angle *= -1;
    } else if (roundedNormal.y === -1) { // Bottom face
        axisName = 'y';
        axis.set(dragDirection === 'UP' || dragDirection === 'DOWN' ? 1 : 0, 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? -1 : 0);
        if (dragDirection === 'DOWN' || dragDirection === 'RIGHT') angle *= -1;
    } else if (roundedNormal.x === 1) { // Right face
        axisName = 'x';
        axis.set(0, dragDirection === 'UP' || dragDirection === 'DOWN' ? -1 : 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? 1 : 0);
        if (dragDirection === 'DOWN' || dragDirection === 'RIGHT') angle *= -1;
    } else if (roundedNormal.x === -1) { // Left face
        axisName = 'x';
        axis.set(0, dragDirection === 'UP' || dragDirection === 'DOWN' ? 1 : 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? -1 : 0);
        if (dragDirection === 'DOWN' || dragDirection === 'RIGHT') angle *= -1;
    } else {
        return null;
    }
    
    return { axis, axisName, angle };
}

// --- Helper and Unchanged Functions ---
function getCssColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

export function scrambleCube() { alert("Scramble feature is not yet implemented."); }
export function solveCube() { alert("Solve feature is not yet implemented."); }
export function updateCubeColors() { alert("Color update feature is not yet implemented."); }

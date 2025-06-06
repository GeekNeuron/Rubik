import * as THREE from 'three';

const CUBIE_SIZE = 1;
const SPACING = 0.05;
let cubeGroup;
// A flag to prevent new moves while a rotation animation is active
export let isRotating = false; 

/**
 * Creates a single small cube (a "cubie").
 * This version is stable and correct.
 */
function createCubie(x, y, z) {
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


// --- START: Rewritten and Robust Rotation Logic ---

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
    
    // Get precise rotation info
    const rotation = getRotationInfo(faceNormal, clickedCubie.position, dragDirection);
    
    if (!rotation) {
        onRotationComplete(); // Ensure controls are re-enabled even if move is invalid
        return;
    }
    
    isRotating = true;

    // Get the cubies on the face to rotate
    const activeCubies = getCubiesOnFace(rotation.axisName, clickedCubie.position);

    // Use a pivot for smooth rotation
    scene.add(pivot);
    pivot.rotation.set(0, 0, 0);
    pivot.position.set(0, 0, 0);

    activeCubies.forEach(cubie => {
        pivot.attach(cubie);
    });
    
    // Animate the rotation
    animateRotation(pivot, rotation.axis, rotation.angle, () => {
        // After animation, re-parent the cubies to the main cube group
        pivot.updateMatrixWorld(); // Ensure pivot's world matrix is up-to-date
        
        while(pivot.children.length > 0) {
            const cubie = pivot.children[0];
            cubeGroup.attach(cubie); // This preserves world transform
        }
        scene.remove(pivot);
        isRotating = false;
        if (onRotationComplete) onRotationComplete();
    });
}

/**
 * Animates the rotation of a pivot group using Quaternions for stability.
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
 */
function getCubiesOnFace(axisName, position) {
    const cubies = [];
    const threshold = 0.5; // Tolerance for floating point inaccuracies
    
    cubeGroup.children.forEach(cubie => {
        // Use the world position for robust checking
        const worldPos = new THREE.Vector3();
        cubie.getWorldPosition(worldPos);
        
        if (Math.abs(worldPos[axisName] - position[axisName]) < threshold) {
            cubies.push(cubie);
        }
    });
    return cubies;
}

/**
 * A robust mapping to determine rotation axis and angle.
 * This function has been completely rewritten.
 * @returns {{axis: THREE.Vector3, axisName: string, angle: number}}
 */
function getRotationInfo(faceNormal, cubiePosition, dragDirection) {
    const mainAxis = new THREE.Vector3(); // Axis the face is on (e.g., Y for top face)
    const rotationAxis = new THREE.Vector3(); // Axis to rotate around (e.g., X or Z for top face)
    let axisName = '';
    let angle = Math.PI / 2; // 90 degrees

    // Determine the main axis of the clicked face
    if (Math.abs(faceNormal.x) > 0.9) mainAxis.set(1, 0, 0);
    else if (Math.abs(faceNormal.y) > 0.9) mainAxis.set(0, 1, 0);
    else if (Math.abs(faceNormal.z) > 0.9) mainAxis.set(0, 0, 1);
    else return null; // Not a clean face click

    if (mainAxis.y === 1) { // TOP FACE
        axisName = 'y';
        rotationAxis.set( (dragDirection === 'UP' || dragDirection === 'DOWN') ? 1 : 0, 0, (dragDirection === 'LEFT' || dragDirection === 'RIGHT') ? -1 : 0 );
        if (dragDirection === 'DOWN' || dragDirection === 'LEFT') angle *= -1;
    } else if (mainAxis.y === -1) { // BOTTOM FACE
        axisName = 'y';
        rotationAxis.set( (dragDirection === 'UP' || dragDirection === 'DOWN') ? -1 : 0, 0, (dragDirection === 'LEFT' || dragDirection === 'RIGHT') ? 1 : 0 );
        if (dragDirection === 'DOWN' || dragDirection === 'LEFT') angle *= -1;
    } else if (mainAxis.x === 1) { // RIGHT FACE
        axisName = 'x';
        rotationAxis.set( 0, (dragDirection === 'UP' || dragDirection === 'DOWN') ? 1 : 0, (dragDirection === 'LEFT' || dragDirection === 'RIGHT') ? -1 : 0 );
        if (dragDirection === 'UP' || dragDirection === 'LEFT') angle *= -1;
    } else if (mainAxis.x === -1) { // LEFT FACE
        axisName = 'x';
        rotationAxis.set( 0, (dragDirection === 'UP' || dragDirection === 'DOWN') ? -1 : 0, (dragDirection === 'LEFT' || dragDirection === 'RIGHT') ? 1 : 0 );
        if (dragDirection === 'UP' || dragDirection === 'LEFT') angle *= -1;
    } else if (mainAxis.z === 1) { // FRONT FACE
        axisName = 'z';
        rotationAxis.set( (dragDirection === 'UP' || dragDirection === 'DOWN') ? 1 : 0, (dragDirection === 'LEFT' || dragDirection === 'RIGHT') ? -1 : 0, 0 );
        if (dragDirection === 'UP' || dragDirection === 'RIGHT') angle *= -1;
    } else if (mainAxis.z === -1) { // BACK FACE
        axisName = 'z';
        rotationAxis.set( (dragDirection === 'UP' || dragDirection === 'DOWN') ? -1 : 0, (dragDirection === 'LEFT' || dragDirection === 'RIGHT') ? 1 : 0, 0 );
        if (dragDirection === 'UP' || dragDirection === 'RIGHT') angle *= -1;
    }
    
    return { axis: rotationAxis, axisName, angle };
}


// --- Helper and Unchanged Functions ---
function getCssColor(varName) {
    const color = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    // Return a default color if CSS variable is not found, to prevent errors.
    return color || '#FF00FF';
}

export function scrambleCube() { alert("Scramble feature is not yet implemented."); }
export function solveCube() { alert("Solve feature is not yet implemented."); }
export function updateCubeColors() { alert("Color update feature is not yet implemented."); }

import * as THREE from 'three';

const CUBIE_SIZE = 1;
const SPACING = 0.05;
let cubeGroup;
// A flag to prevent new moves while a rotation animation is active
export let isRotating = false; 

/**
 * Creates a single small cube (a "cubie").
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
    // Store original position in an attribute for easy identification
    cubie.userData.originalPosition = new THREE.Vector3(x, y, z);
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


// --- START: New Rotation Logic ---

const pivot = new THREE.Group();
let activeCubies = [];

/**
 * The main function to rotate a face of the cube.
 * @param {THREE.Object3D} clickedObject - The cubie that was clicked.
 * @param {string} dragDirection - The direction of the drag ('UP', 'DOWN', 'LEFT', 'RIGHT').
 * @param {THREE.Scene} scene - The main scene object.
 * @param {Function} onRotationComplete - Callback to run when animation finishes.
 */
export function rotateFace(clickedObject, dragDirection, scene, onRotationComplete) {
    if (isRotating) return;
    isRotating = true;

    const faceNormal = clickedObject.face.normal;
    const clickedCubie = clickedObject.object;
    
    // Determine the rotation axis and direction
    const rotation = getRotationAxisAndDirection(faceNormal, clickedCubie.position, dragDirection);
    if (!rotation) {
        isRotating = false;
        return;
    }
    
    // Select the 9 cubies that belong to the face
    activeCubies = getCubiesOnFace(rotation.axis, clickedCubie.position);

    // Use a pivot for smooth rotation
    scene.add(pivot);
    pivot.rotation.set(0, 0, 0); // Reset pivot rotation
    activeCubies.forEach(cubie => {
        pivot.attach(cubie);
    });
    
    // Animate the rotation
    animateRotation(pivot, rotation.axis, rotation.angle, onRotationComplete);
}


function animateRotation(target, axis, angle, onComplete) {
    const startRotation = new THREE.Euler().copy(target.rotation);
    const endRotation = new THREE.Euler().copy(startRotation).add(new THREE.Euler(
        axis.x * angle,
        axis.y * angle,
        axis.z * angle
    ));
    
    const duration = 300; // 300ms animation
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Linear interpolation (lerp) for rotation
        target.rotation.set(
            THREE.MathUtils.lerp(startRotation.x, endRotation.x, progress),
            THREE.MathUtils.lerp(startRotation.y, endRotation.y, progress),
            THREE.MathUtils.lerp(startRotation.z, endRotation.z, progress)
        );

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            // Animation complete, re-parent the cubies
            while(pivot.children.length > 0) {
                const cubie = pivot.children[0];
                cubeGroup.attach(cubie); // This preserves the new world position/rotation
            }
            scene.remove(pivot);
            isRotating = false;
            if (onComplete) onComplete();
        }
    }
    requestAnimationFrame(step);
}


/**
 * Determines which cubies are on the face to be rotated.
 * @param {string} axis - 'x', 'y', or 'z'.
 * @param {THREE.Vector3} position - The position of the clicked cubie.
 * @returns {Array<THREE.Object3D>}
 */
function getCubiesOnFace(axis, position) {
    const cubies = [];
    const threshold = 0.5; // To account for floating point inaccuracies
    
    cubeGroup.children.forEach(cubie => {
        if (Math.abs(cubie.position[axis] - position[axis]) < threshold) {
            cubies.push(cubie);
        }
    });
    return cubies;
}

/**
 * A complex mapping to determine rotation axis and angle.
 * This is the "brain" of the move logic.
 * @returns {{axis: THREE.Vector3, angle: number}}
 */
function getRotationAxisAndDirection(faceNormal, position, dragDirection) {
    const axis = new THREE.Vector3();
    let angle = Math.PI / 2; // 90 degrees

    // Example: Clicked the front face (normal facing camera)
    if (faceNormal.z > 0.9) { 
        if (dragDirection === 'UP' || dragDirection === 'DOWN') axis.set(1, 0, 0); // Rotate around X-axis
        if (dragDirection === 'LEFT' || dragDirection === 'RIGHT') axis.set(0, 1, 0); // Rotate around Y-axis
        if (dragDirection === 'UP' || dragDirection === 'LEFT') angle *= -1;
    } 
    // Example: Clicked the top face (normal facing up)
    else if (faceNormal.y > 0.9) {
        if (dragDirection === 'UP' || dragDirection === 'DOWN') axis.set(1, 0, 0); // Rotate around X-axis
        if (dragDirection === 'LEFT' || dragDirection === 'RIGHT') axis.set(0, 0, 1); // Rotate around Z-axis
        if (dragDirection === 'DOWN' || dragDirection === 'RIGHT') angle *= -1;
    }
    // Example: Clicked the right-side face
    else if (faceNormal.x > 0.9) {
        if (dragDirection === 'UP' || dragDirection === 'DOWN') axis.set(0, 0, 1); // Rotate around Z-axis
        if (dragDirection === 'LEFT' || dragDirection === 'RIGHT') axis.set(0, 1, 0); // Rotate around Y-axis
        if (dragDirection === 'UP' || dragDirection === 'RIGHT') angle *= -1;
    }
    // Other faces would need similar logic...
    else {
        // For simplicity, we only implement 3 faces for now.
        // The other faces (back, bottom, left) work by rotating the camera.
        console.warn("Rotation logic for this face is not fully implemented yet.");
        return null;
    }
    
    return { axis, angle };
}

// --- END: New Rotation Logic ---

// --- Unchanged Functions ---
export function scrambleCube() { /* ... */ }
export function solveCube() { /* ... */ }
export function updateCubeColors() { /* ... */ }
function getCssColor(varName) { /* ... */ }

import * as THREE from 'three';

const CUBIE_SIZE = 1;
const SPACING = 0.05;
let cubeGroup;
export let isRotating = false; 

/**
 * A safer way to get CSS colors.
 * If a color is not found, it returns a bright pink for easy debugging.
 * THIS FUNCTION IS UPDATED.
 */
function getCssColor(varName) {
    const color = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return color || '#FF00FF'; // Returns pink if the variable is not found
}

/**
 * Creates a single small cube (a "cubie").
 * This function now uses the safer getCssColor.
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
    if (x !== 1) materials[0].color.set(new THREE.Color(insideColor));
    if (x !== -1) materials[1].color.set(new THREE.Color(insideColor));
    if (y !== 1) materials[2].color.set(new THREE.Color(insideColor));
    if (y !== -1) materials[3].color.set(new THREE.Color(insideColor));
    if (z !== 1) materials[4].color.set(new THREE.Color(insideColor));
    if (z !== -1) materials[5].color.set(new THREE.Color(insideColor));

    const cubie = new THREE.Mesh(geometry, materials);
    cubie.userData.originalPosition = new THREE.Vector3(x, y, z);
    cubie.position.set(
        x * (CUBIE_SIZE + SPACING),
        y * (CUBIE_SIZE + SPACING),
        z * (CUBIE_SIZE + SPACING)
    );
    return cubie;
}

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
let activeCubies = [];

export function rotateFace(clickedObject, dragDirection, scene, onRotationComplete) {
    if (isRotating) return;
    isRotating = true;

    const faceNormal = clickedObject.face.normal;
    const clickedCubie = clickedObject.object;
    
    const rotation = getRotationAxisAndDirection(faceNormal, clickedCubie.position, dragDirection);
    if (!rotation) {
        isRotating = false;
        return;
    }
    
    activeCubies = getCubiesOnFace(rotation.axis, clickedCubie.position);

    scene.add(pivot);
    pivot.rotation.set(0, 0, 0);
    activeCubies.forEach(cubie => {
        pivot.attach(cubie);
    });
    
    animateRotation(pivot, rotation.axis, rotation.angle, onRotationComplete);
}


/**
 * Animates the rotation of a pivot group.
 * THIS FUNCTION IS UPDATED.
 */
function animateRotation(target, axis, angle, onComplete) {
    const startRotation = new THREE.Euler().copy(target.rotation);
    // highlight-start
    // The .add() method is deprecated. We calculate the end rotation directly.
    const endRotation = new THREE.Euler(
        startRotation.x + (axis.x * angle),
        startRotation.y + (axis.y * angle),
        startRotation.z + (axis.z * angle)
    );
    // highlight-end
    
    const duration = 300;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        target.rotation.set(
            THREE.MathUtils.lerp(startRotation.x, endRotation.x, progress),
            THREE.MathUtils.lerp(startRotation.y, endRotation.y, progress),
            THREE.MathUtils.lerp(startRotation.z, endRotation.z, progress)
        );

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            while(pivot.children.length > 0) {
                const cubie = pivot.children[0];
                cubeGroup.attach(cubie);
            }
            scene.remove(pivot);
            isRotating = false;
            if (onComplete) onComplete();
        }
    }
    requestAnimationFrame(step);
}


function getCubiesOnFace(axisName, position) {
    const cubies = [];
    const threshold = 0.5;
    
    cubeGroup.children.forEach(cubie => {
        if (Math.abs(cubie.position[axisName] - position[axisName]) < threshold) {
            cubies.push(cubie);
        }
    });
    return cubies;
}

function getRotationAxisAndDirection(faceNormal, position, dragDirection) {
    const axis = new THREE.Vector3();
    let axisName = '';
    let angle = Math.PI / 2;

    const roundedNormal = new THREE.Vector3(Math.round(faceNormal.x), Math.round(faceNormal.y), Math.round(faceNormal.z));

    if (roundedNormal.z === 1) { // Front face
        axisName = 'z';
        axis.set(dragDirection === 'UP' || dragDirection === 'DOWN' ? 1 : 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? 1 : 0, 0);
        if (dragDirection === 'UP' || dragDirection === 'LEFT') angle *= -1;
    } else if (roundedNormal.z === -1) { // Back face
        axisName = 'z';
        axis.set(dragDirection === 'UP' || dragDirection === 'DOWN' ? 1 : 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? 1 : 0, 0);
        if (dragDirection === 'UP' || dragDirection === 'RIGHT') angle *= -1;
    } else if (roundedNormal.y === 1) { // Top face
        axisName = 'y';
        axis.set(dragDirection === 'UP' || dragDirection === 'DOWN' ? 1 : 0, 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? 1 : 0);
        if (dragDirection === 'DOWN' || dragDirection === 'RIGHT') angle *= -1;
    } else if (roundedNormal.y === -1) { // Bottom face
        axisName = 'y';
        axis.set(dragDirection === 'UP' || dragDirection === 'DOWN' ? 1 : 0, 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? 1 : 0);
        if (dragDirection === 'UP' || dragDirection === 'LEFT') angle *= -1;
    } else if (roundedNormal.x === 1) { // Right face
        axisName = 'x';
        axis.set(0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? 1 : 0, dragDirection === 'UP' || dragDirection === 'DOWN' ? 1 : 0);
        if (dragDirection === 'UP' || dragDirection === 'RIGHT') angle *= -1;
    } else if (roundedNormal.x === -1) { // Left face
        axisName = 'x';
        axis.set(0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? 1 : 0, dragDirection === 'UP' || dragDirection === 'DOWN' ? 1 : 0);
        if (dragDirection === 'DOWN' || dragDirection === 'RIGHT') angle *= -1;
    } else {
        return null;
    }
    
    // Correct axis based on clicked face
    if(axisName === 'z') axis.y *= -1;
    if(axisName === 'x') axis.y *= -1;

    return { axis, axisName, angle };
}

// Unchanged Functions
export function scrambleCube() { /* ... */ }
export function solveCube() { /* ... */ }
export function updateCubeColors() { /* ... */ }

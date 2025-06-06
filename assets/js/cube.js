import * as THREE from 'three';

const CUBIE_SIZE = 1;
const SPACING = 0.05;
let cubeGroup;
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
    // Store the initial grid position for reference
    cubie.userData.gridPosition = new THREE.Vector3(x, y, z); 
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


// --- START: Completely Rewritten and Robust Rotation Logic ---

const pivot = new THREE.Group();

export function rotateFace(clickedObject, dragDirection, scene, onRotationComplete) {
    if (isRotating) return;
    
    const faceNormal = clickedObject.face.normal;
    const clickedCubie = clickedObject.object;
    
    const rotation = getRotationInfo(faceNormal, dragDirection);
    
    if (!rotation) {
        onRotationComplete();
        return;
    }
    
    isRotating = true;

    const activeCubies = getCubiesOnFace(rotation.axisName, clickedCubie.position);

    scene.add(pivot);
    pivot.rotation.set(0, 0, 0);
    pivot.position.set(0, 0, 0);

    activeCubies.forEach(cubie => {
        pivot.attach(cubie);
    });
    
    animateRotation(pivot, rotation.axis, rotation.angle, () => {
        // After animation, perform the critical "snap-to-grid" operation
        pivot.updateMatrixWorld();
        
        // This temporary matrix will hold the rotation transformation
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationFromQuaternion(pivot.quaternion);

        while(pivot.children.length > 0) {
            const cubie = pivot.children[0];
            
            // Re-parent the cubie back to the main group
            cubeGroup.attach(cubie);

            // Apply the rotation matrix to the cubie's position vector
            cubie.position.applyMatrix4(rotationMatrix);
            
            // **THE SNAP-TO-GRID FIX**
            // Round the final position to the nearest integer grid coordinate
            cubie.position.round(); 
            // Also round the rotation to the nearest 90-degree increment
            cubie.rotation.x = Math.round(cubie.rotation.x / (Math.PI / 2)) * (Math.PI / 2);
            cubie.rotation.y = Math.round(cubie.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
            cubie.rotation.z = Math.round(cubie.rotation.z / (Math.PI / 2)) * (Math.PI / 2);
        }

        scene.remove(pivot);
        isRotating = false;
        if (onRotationComplete) onRotationComplete();
    });
}

function animateRotation(target, axis, angle, onComplete) {
    const startQuaternion = new THREE.Quaternion(); // Start from no rotation
    const endQuaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    
    const duration = 300;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        target.quaternion.slerpQuaternions(startQuaternion, endQuaternion, progress);

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            target.quaternion.copy(endQuaternion);
            onComplete();
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

function getRotationInfo(faceNormal, dragDirection) {
    const axis = new THREE.Vector3();
    let axisName = '';
    let angle = Math.PI / 2;

    const roundedNormal = new THREE.Vector3(Math.round(faceNormal.x), Math.round(faceNormal.y), Math.round(faceNormal.z));

    if (roundedNormal.equals(new THREE.Vector3(0, 0, 1))) { // Front
        axisName = 'z';
        axis.set(dragDirection === 'UP' || dragDirection === 'DOWN' ? -1 : 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? 1 : 0, 0);
        if (dragDirection === 'UP' || dragDirection === 'RIGHT') angle *= -1;
    } else if (roundedNormal.equals(new THREE.Vector3(0, 0, -1))) { // Back
        axisName = 'z';
        axis.set(dragDirection === 'UP' || dragDirection === 'DOWN' ? 1 : 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? -1 : 0, 0);
        if (dragDirection === 'UP' || dragDirection === 'RIGHT') angle *= -1;
    } else if (roundedNormal.equals(new THREE.Vector3(0, 1, 0))) { // Top
        axisName = 'y';
        axis.set(dragDirection === 'UP' || dragDirection === 'DOWN' ? 1 : 0, 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? -1 : 0);
        if (dragDirection === 'DOWN' || dragDirection === 'LEFT') angle *= -1;
    } else if (roundedNormal.equals(new THREE.Vector3(0, -1, 0))) { // Bottom
        axisName = 'y';
        axis.set(dragDirection === 'UP' || dragDirection === 'DOWN' ? -1 : 0, 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? 1 : 0);
        if (dragDirection === 'DOWN' || dragDirection === 'LEFT') angle *= -1;
    } else if (roundedNormal.equals(new THREE.Vector3(1, 0, 0))) { // Right
        axisName = 'x';
        axis.set(0, dragDirection === 'UP' || dragDirection === 'DOWN' ? 1 : 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? -1 : 0);
        if (dragDirection === 'UP' || dragDirection === 'LEFT') angle *= -1;
    } else if (roundedNormal.equals(new THREE.Vector3(-1, 0, 0))) { // Left
        axisName = 'x';
        axis.set(0, dragDirection === 'UP' || dragDirection === 'DOWN' ? -1 : 0, dragDirection === 'LEFT' || dragDirection === 'RIGHT' ? 1 : 0);
        if (dragDirection === 'UP' || dragDirection === 'LEFT') angle *= -1;
    } else {
        return null;
    }
    
    return { axis, axisName, angle };
}

// --- Helper and Unchanged Functions ---
function getCssColor(varName) {
    const color = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return color || '#FF00FF'; // Fallback to pink for debugging
}

export function scrambleCube() { alert("Scramble feature is not yet implemented."); }
export function solveCube() { alert("Solve feature is not yet implemented."); }
export function updateCubeColors() { alert("Color update feature is not yet implemented."); }

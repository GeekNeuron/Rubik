import * as THREE from 'three';
import { applyMove, getCubiesOnFace, isRotating, setRotating } from './cube-state.js';

const CUBIE_SIZE = 1;
const SPACING = 0.05; // Visual spacing only

/**
 * Creates a single visual cubie piece.
 * @param {number} x - The logical x-coordinate (-1, 0, 1).
 * @param {number} y - The logical y-coordinate.
 * @param {number} z - The logical z-coordinate.
 * @returns {THREE.Mesh} The created cubie mesh.
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
    // Assign a unique name to find this object later, based on its initial logical position
    cubie.name = `cubie_${x}_${y}_${z}`;
    return cubie;
}

/**
 * Creates the main THREE.Group and populates it with visual cubies.
 * @param {Array} logicalState - The array of logical piece data.
 * @returns {THREE.Group} The main group for the Rubik's Cube.
 */
export function createRubiksCubeGroup(logicalState) {
    const cubeGroup = new THREE.Group();
    cubeGroup.name = "RubiksCube";
    
    logicalState.forEach(piece => {
        const { x, y, z } = piece.initialPosition;
        const cubie = createVisualCubie(x, y, z);
        cubeGroup.add(cubie);
    });
    
    // Set initial positions and rotations from the logical state
    syncVisualsToState(logicalState, cubeGroup);
    
    return cubeGroup;
}

/**
 * The main function to trigger a rotation.
 * This now delegates the hard work to the logical state manager.
 */
export function rotateFace(clickedObject, dragDirection, scene, onRotationComplete) {
    if (isRotating()) return;

    const faceNormal = clickedObject.face.normal;
    // Use the world position to determine which slice to rotate
    const worldPosition = new THREE.Vector3();
    clickedObject.object.getWorldPosition(worldPosition);

    const move = getRotationInfo(faceNormal, worldPosition, dragDirection, scene.getObjectByName("RubiksCube").quaternion);
    if (!move) {
        onRotationComplete();
        return;
    }
    
    setRotating(true);
    
    // Apply the move to the logical state first
    const newLogicalState = applyMove(move);
    
    // Now, animate the visual representation to match the new logical state
    const cubeGroup = scene.getObjectByName("RubiksCube");
    const cubiesToAnimate = getCubiesOnFace(move);

    animateRotation(cubiesToAnimate, cubeGroup, scene, move, () => {
        // After animation, do a final sync to eliminate any floating point errors
        syncVisualsToState(newLogicalState, cubeGroup);
        setRotating(false);
        if (onRotationComplete) onRotationComplete();
    });
}

/**
 * Animates the visual rotation of the cubies.
 */
function animateRotation(cubieNames, cubeGroup, scene, move, onComplete) {
    const pivot = new THREE.Group();
    scene.add(pivot);

    cubieNames.forEach(name => {
        const cubieObject = cubeGroup.getObjectByName(name);
        if (cubieObject) {
            pivot.attach(cubieObject);
        }
    });

    const startQuaternion = new THREE.Quaternion();
    const endQuaternion = new THREE.Quaternion().setFromAxisAngle(move.rotationAxis, move.angle);
    
    const duration = 300; // 300ms
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        pivot.quaternion.slerpQuaternions(startQuaternion, endQuaternion, progress);

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            pivot.quaternion.copy(endQuaternion);
            // Re-parent the cubies after animation
            while (pivot.children.length > 0) {
                cubeGroup.attach(pivot.children[0]);
            }
            scene.remove(pivot);
            onComplete();
        }
    }
    requestAnimationFrame(step);
}

/**
 * The "Snap-to-Grid" function. It forces the visual objects to match the logical state.
 */
export function syncVisualsToState(logicalState, cubeGroup) {
    if (!cubeGroup) return;
    
    logicalState.forEach(piece => {
        const cubieObject = cubeGroup.getObjectByName(piece.name);
        if (cubieObject) {
            // Set position based on the LOGICAL coordinates, not a previous visual state
            const visualPos = new THREE.Vector3(
                piece.position.x * (CUBIE_SIZE + SPACING),
                piece.position.y * (CUBIE_SIZE + SPACING),
                piece.position.z * (CUBIE_SIZE + SPACING)
            );
            cubieObject.position.copy(visualPos);
            // Set rotation directly from the logical quaternion
            cubieObject.quaternion.copy(piece.quaternion);
        }
    });
}


/**
 * Determines the move to be made based on user interaction.
 * This logic has been made more robust.
 */
function getRotationInfo(faceNormal, worldPosition, dragDirection, cubeQuaternion) {
    const move = { axis: '', slice: 0, dir: 1 };
    
    // Determine the dominant axis of the face normal in world space
    const normal = faceNormal.clone().applyQuaternion(cubeQuaternion).round();

    if (normal.y !== 0) {
        move.axis = 'y';
        move.slice = Math.round(worldPosition.y / (CUBIE_SIZE + SPACING));
        if (dragDirection === 'LEFT' || dragDirection === 'RIGHT') {
            move.dir = (dragDirection === 'LEFT' ? 1 : -1) * Math.sign(normal.y);
        } else { // UP or DOWN
            // This is complex and depends on camera view, needs refinement
            return null; // For now, disable vertical drags on horizontal faces
        }
    } else if (normal.x !== 0) {
        move.axis = 'x';
        move.slice = Math.round(worldPosition.x / (CUBIE_SIZE + SPACING));
        if (dragDirection === 'UP' || dragDirection === 'DOWN') {
            move.dir = (dragDirection === 'UP' ? 1 : -1) * Math.sign(normal.x);
        } else {
            return null;
        }
    } else if (normal.z !== 0) {
        move.axis = 'z';
        move.slice = Math.round(worldPosition.z / (CUBIE_SIZE + SPACING));
         if (dragDirection === 'UP' || dragDirection === 'DOWN') {
            move.dir = (dragDirection === 'UP' ? -1 : 1) * Math.sign(normal.z);
        } else {
             move.dir = (dragDirection === 'LEFT' ? 1 : -1) * Math.sign(normal.z);
        }
    } else {
        return null;
    }
    
    move.rotationAxis = new THREE.Vector3(move.axis === 'x' ? 1 : 0, move.axis === 'y' ? 1 : 0, move.axis === 'z' ? 1 : 0);
    move.angle = move.dir * Math.PI / 2;

    return move;
}


function getCssColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#FF00FF';
}

export function scrambleCube() { alert("Scramble feature is not yet implemented."); }
export function solveCube() { alert("Solve feature is not yet implemented."); }

import * as THREE from 'three';
import { applyMove, getCubiesOnFace, isRotating, setRotating, scramble as scrambleState } from './cube-state.js';
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
 * Main function to trigger a rotation.
 */
export function rotateFace(clickedObject, dragDirection, scene, onRotationComplete) {
    if (isRotating()) return;

    const faceNormal = clickedObject.face.normal;
    const worldPosition = new THREE.Vector3();
    clickedObject.object.getWorldPosition(worldPosition);

    const move = getRotationInfo(faceNormal, worldPosition, dragDirection, scene.getObjectByName("RubiksCube").quaternion);
    if (!move) {
        onRotationComplete();
        return;
    }
    
    setRotating(true);
    
    const newLogicalState = applyMove(move);
    const cubeGroup = scene.getObjectByName("RubiksCube");
    const cubiesToAnimate = getCubiesOnFace(move);

    animateRotation(cubiesToAnimate, cubeGroup, scene, move, () => {
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
    
    const duration = 300;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        pivot.quaternion.slerpQuaternions(startQuaternion, endQuaternion, progress);

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            pivot.quaternion.copy(endQuaternion);
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
 * Forces the visual objects to match the logical state.
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
 * Determines the move to be made based on user interaction.
 */
function getRotationInfo(faceNormal, worldPosition, dragDirection, cubeQuaternion) {
    const move = { axis: '', slice: 0, dir: 1 };
    const normal = faceNormal.clone().applyQuaternion(cubeQuaternion).round();

    if (Math.abs(normal.y) > 0.5) {
        move.axis = 'y';
        move.slice = Math.round(worldPosition.y / (CUBIE_SIZE + SPACING));
        const rotationVec = new THREE.Vector3(1, 0, 0); // Rotate around X for vertical drag
        if (dragDirection === 'LEFT' || dragDirection === 'RIGHT') {
            rotationVec.set(0, 0, 1); // Rotate around Z for horizontal drag
            move.dir = (dragDirection === 'LEFT' ? 1 : -1) * Math.sign(normal.y);
        } else {
            move.dir = (dragDirection === 'DOWN' ? 1 : -1) * Math.sign(normal.y);
        }
    } else if (Math.abs(normal.x) > 0.5) {
        move.axis = 'x';
        move.slice = Math.round(worldPosition.x / (CUBIE_SIZE + SPACING));
        if (dragDirection === 'UP' || dragDirection === 'DOWN') {
            move.dir = (dragDirection === 'UP' ? 1 : -1) * Math.sign(normal.x);
        } else { // LEFT or RIGHT
            move.dir = (dragDirection === 'LEFT' ? -1 : 1) * Math.sign(normal.x);
        }
    } else { // Z-face
        move.axis = 'z';
        move.slice = Math.round(worldPosition.z / (CUBIE_SIZE + SPACING));
         if (dragDirection === 'UP' || dragDirection === 'DOWN') {
            move.dir = (dragDirection === 'UP' ? -1 : 1) * Math.sign(normal.z);
        } else { // LEFT or RIGHT
             move.dir = (dragDirection === 'LEFT' ? 1 : -1) * Math.sign(normal.z);
        }
    }
    
    move.rotationAxis = new THREE.Vector3(move.axis === 'x' ? 1 : 0, move.axis === 'y' ? 1 : 0, move.axis === 'z' ? 1 : 0);
    move.angle = move.dir * Math.PI / 2;

    return move;
}

/**
 * Connects the Scramble button to the scramble logic.
 */
export function scrambleCube(scene) {
    if (isRotating()) return;
    console.log("Scrambling the cube...");
    
    resetClock();

    const newLogicalState = scrambleState();
    
    const cubeGroup = scene.getObjectByName("RubiksCube");
    syncVisualsToState(newLogicalState, cubeGroup);
}

function getCssColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#FF00FF';
}

// Placeholder for future implementation
export function solveCube() { alert("Solve feature is not yet implemented."); }
export function updateCubeColors() { /* ... */ }

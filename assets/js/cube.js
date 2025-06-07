import * as THREE from 'three';
import { applyMove, getCubiesOnFace, isRotating, setRotating, getSolution, scramble as scrambleState } from './cube-state.js';
import { resetClock, stopClock } from './ui-handler.js';

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
 * Forces the visual objects to match the logical state ("Snap-to-Grid").
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
 * Main function to trigger a single user rotation.
 */
export function rotateFace(clickedObject, dragDirection, scene, camera, onRotationComplete) {
    if (isRotating()) return;

    const faceNormal = clickedObject.face.normal;
    const worldPosition = new THREE.Vector3();
    clickedObject.object.getWorldPosition(worldPosition);
    
    const move = getRotationInfo(faceNormal, worldPosition, dragDirection, scene.getObjectByName("RubiksCube").quaternion, camera);
    if (!move) {
        onRotationComplete();
        return;
    }
    
    setRotating(true);
    const newLogicalState = applyMove(move);
    animateAndSync(move, newLogicalState, scene, () => {
        setRotating(false);
        if (onRotationComplete) onRotationComplete();
    });
}

/**
 * The main function to solve the cube by playing back moves.
 */
export function solveCube(scene) {
    if (isRotating()) return;
    stopClock();
    
    const solutionMoves = getSolution();
    if (solutionMoves.length === 0) {
        console.log("Cube is already solved or no moves to undo.");
        return;
    }
    
    setRotating(true);
    
    function executeNextMove(index) {
        if (index >= solutionMoves.length) {
            setRotating(false);
            console.log("Solve complete!");
            return;
        }
        
        const move = solutionMoves[index];
        const newLogicalState = applyMove(move);
        
        animateAndSync(move, newLogicalState, scene, () => {
            executeNextMove(index + 1);
        });
    }
    
    executeNextMove(0);
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

/**
 * Placeholder for color updates.
 */
export function updateCubeColors() {
    alert("Live color update requires a refresh to apply fully.");
}

// --- Internal Helper Functions ---

function animateAndSync(move, newLogicalState, scene, onComplete) {
    const cubeGroup = scene.getObjectByName("RubiksCube");
    const cubiesToAnimate = getCubiesOnFace(move);

    animateRotation(cubiesToAnimate, cubeGroup, scene, move, () => {
        syncVisualsToState(newLogicalState, cubeGroup);
        if (onComplete) onComplete();
    });
}

function animateRotation(cubieNames, cubeGroup, scene, move, onComplete) {
    const pivot = new THREE.Group();
    scene.add(pivot);
    cubieNames.forEach(name => {
        const cubieObject = cubeGroup.getObjectByName(name);
        if (cubieObject) pivot.attach(cubieObject);
    });
    const startQuaternion = new THREE.Quaternion();
    const endQuaternion = new THREE.Quaternion().setFromAxisAngle(move.rotationAxis, move.angle);
    const duration = 150;
    let startTime = null;
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        pivot.quaternion.slerpQuaternions(startQuaternion, endQuaternion, progress);
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            pivot.quaternion.copy(endQuaternion);
            while (pivot.children.length > 0) cubeGroup.attach(pivot.children[0]);
            scene.remove(pivot);
            onComplete();
        }
    }
    requestAnimationFrame(step);
}

function getRotationInfo(faceNormal, worldPosition, dragDirection, cubeQuaternion, camera) {
    const move = { axis: '', slice: 0, dir: 1 };
    const normal = faceNormal.clone().applyQuaternion(cubeQuaternion).round();

    if (Math.abs(normal.y) > 0.5) { // Top or Bottom face
        move.axis = 'y';
        move.slice = Math.round(worldPosition.y / (CUBIE_SIZE + SPACING));
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);

        if (Math.abs(cameraDirection.x) > Math.abs(cameraDirection.z)) {
            move.dir = (dragDirection === 'LEFT' || dragDirection === 'RIGHT') 
                ? (dragDirection === 'LEFT' ? 1 : -1) * Math.sign(normal.y) * -Math.sign(cameraDirection.x)
                : (dragDirection === 'UP' ? 1 : -1) * Math.sign(normal.y);
        } else {
            move.dir = (dragDirection === 'LEFT' || dragDirection === 'RIGHT') 
                ? (dragDirection === 'LEFT' ? 1 : -1) * Math.sign(normal.y) * -Math.sign(cameraDirection.z)
                : (dragDirection === 'UP' ? -1 : 1) * Math.sign(normal.y);
        }
    } else if (Math.abs(normal.x) > 0.5) { // Left or Right face
        move.axis = 'x';
        move.slice = Math.round(worldPosition.x / (CUBIE_SIZE + SPACING));
        move.dir = (dragDirection === 'UP' || dragDirection === 'DOWN') 
            ? (dragDirection === 'UP' ? 1 : -1) * Math.sign(normal.x) 
            : (dragDirection === 'LEFT' ? -1 : 1) * Math.sign(normal.x);
    } else { // Front or Back face
        move.axis = 'z';
        move.slice = Math.round(worldPosition.z / (CUBIE_SIZE + SPACING));
        move.dir = (dragDirection === 'UP' || dragDirection === 'DOWN') 
            ? (dragDirection === 'UP' ? -1 : 1) * Math.sign(normal.z) 
            : (dragDirection === 'LEFT' ? 1 : -1) * Math.sign(normal.z);
    }
    
    move.rotationAxis = new THREE.Vector3(move.axis === 'x' ? 1 : 0, move.axis === 'y' ? 1 : 0, move.axis === 'z' ? 1 : 0);
    move.angle = move.dir * Math.PI / 2;
    return move;
}

function getCssColor(varName){
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "#FF00FF";
}

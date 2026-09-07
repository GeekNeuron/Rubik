import * as THREE from 'three';
import {
    applyMove, getCubiesOnFace, isRotating, setRotating, getSolution,
    resetForScramble, generateScrambleMoves, getMoveAngle,
    clearHistory, isSolved, setGameReady, setPiecesState, getPiecesSnapshot
} from './cube-state.js';
import { resetClock, stopClock, setButtonsEnabled, showToast, t } from './ui-handler.js';
import { standardTokenToEngineMoves } from './physical-solver.js';

const CUBIE_SIZE = 1;
const SPACING = 0.05;

// Kept so updateCubeColors() can recolor the already-built cube live,
// without needing every caller to thread a scene/cubeGroup reference through.
let cachedCubeGroup = null;

/**
 * Creates a single visual cubie piece.
 */
function createVisualCubie(x, y, z) {
    const geometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
    const materials = buildCubieMaterials(x, y, z);
    const cubie = new THREE.Mesh(geometry, materials);
    cubie.name = `cubie_${x}_${y}_${z}`;
    return cubie;
}

/**
 * Builds the 6 face materials for a cubie at logical position (x,y,z),
 * coloring only the faces that are on the outside of the solved cube and
 * using the "inside" color everywhere else. Shared by creation and by
 * updateCubeColors() so the two can never fall out of sync.
 */
function buildCubieMaterials(x, y, z) {
    const insideColor = getCssColor('--color-inside');

    const colors = [
        x === 1 ? getCssColor('--color-right') : insideColor,
        x === -1 ? getCssColor('--color-left') : insideColor,
        y === 1 ? getCssColor('--color-up') : insideColor,
        y === -1 ? getCssColor('--color-down') : insideColor,
        z === 1 ? getCssColor('--color-front') : insideColor,
        z === -1 ? getCssColor('--color-back') : insideColor,
    ];

    return colors.map(color => new THREE.MeshLambertMaterial({ color: new THREE.Color(color) }));
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
    cachedCubeGroup = cubeGroup;
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
 * Plays a list of moves in sequence, animating and syncing each one, then
 * calls onDone. This is the shared engine behind both Scramble and Solve,
 * so scrambling looks the same as solving instead of an instant jump-cut.
 */
function playMoveSequence(moves, scene, onDone) {
    function executeNext(index) {
        if (index >= moves.length) {
            if (onDone) onDone();
            return;
        }
        const move = enrichMoveForAnimation(moves[index]);
        const newLogicalState = applyMove(move);
        animateAndSync(move, newLogicalState, scene, () => executeNext(index + 1));
    }
    executeNext(0);
}

/**
 * Scripted moves (scramble / solve playback) only carry {axis, slice, dir}.
 * The animation also needs a rotation axis vector and angle - fill those in
 * using the same shared formula as drag-based moves (getRotationInfo below)
 * so every move animates consistently regardless of its source.
 */
function enrichMoveForAnimation(move) {
    return {
        ...move,
        rotationAxis: new THREE.Vector3(move.axis === 'x' ? 1 : 0, move.axis === 'y' ? 1 : 0, move.axis === 'z' ? 1 : 0),
        angle: getMoveAngle(move.dir),
    };
}

/**
 * Solves the cube by reversing the full move history (scramble + any
 * manual moves made since), animated turn by turn.
 */
export function solveCube(scene) {
    if (isRotating()) return;
    stopClock();

    const solutionMoves = getSolution();
    if (solutionMoves.length === 0) {
        showToast(t('alreadySolved'));
        return;
    }

    setRotating(true);
    setButtonsEnabled(false);

    playMoveSequence(solutionMoves, scene, () => {
        clearHistory();
        setGameReady(false);
        setRotating(false);
        setButtonsEnabled(true);
        showToast(t('solvedByButton'));
    });
}

/**
 * Resets to solved, then plays an animated scramble sequence (instead of an
 * instant snap), recording every move so Solve can always reverse it later.
 */
export function scrambleCube(scene) {
    if (isRotating()) return;

    resetClock();
    const solvedState = resetForScramble();
    const cubeGroup = scene.getObjectByName("RubiksCube");
    syncVisualsToState(solvedState, cubeGroup);

    const moves = generateScrambleMoves(20);
    setRotating(true);
    setButtonsEnabled(false);

    playMoveSequence(moves, scene, () => {
        setGameReady(true);
        setRotating(false);
        setButtonsEnabled(true);
    });
}

/**
 * Instantly (no animation, no history tracking) sets the cube to the state
 * produced by a standard-notation scramble string like "R U2 F' ...". Used
 * as a visual reference by features (like the speed timer) that generate
 * their own scramble notation independent of this app's scramble/solve
 * history - it does not interact with that history at all.
 */
export function scrambleCubeInstantly(scrambleStr, scene) {
    if (isRotating()) return;
    const solvedState = resetForScramble();
    const cubeGroup = scene.getObjectByName("RubiksCube");
    const tokens = scrambleStr.trim().split(/\s+/).filter(Boolean);
    let state = solvedState;
    tokens.forEach(token => {
        standardTokenToEngineMoves(token).forEach(move => {
            state = applyMove(move);
        });
    });
    syncVisualsToState(state, cubeGroup);
    clearHistory();
    setGameReady(false);
}

/**
 * Recolors every cubie's outer faces live, using the current CSS variables.
 * No refresh needed.
 */
export function updateCubeColors() {
    if (!cachedCubeGroup) return;
    cachedCubeGroup.children.forEach(cubie => {
        const parts = cubie.name.split('_');
        const x = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        const z = parseInt(parts[3], 10);
        const materials = buildCubieMaterials(x, y, z);
        cubie.material.forEach((mat, i) => {
            mat.color.copy(materials[i].color);
            materials[i].dispose();
        });
    });
}

/**
 * Smoothly rotates the whole cube (not the pieces - just the group, so it
 * doesn't interfere with move logic) so the given face points toward the
 * camera. Used to give a live visual reference while entering a physical
 * cube's colors face-by-face.
 */
const FACE_NORMALS = {
    U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1],
};
let previewAnimId = null;
export function previewFace(faceLetter, scene, camera) {
    const cubeGroup = scene.getObjectByName("RubiksCube");
    if (!cubeGroup || !camera) return;
    const normal = FACE_NORMALS[faceLetter];
    if (!normal) return;

    const viewDir = camera.position.clone().normalize();
    const faceNormal = new THREE.Vector3(...normal);
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(faceNormal, viewDir);

    if (previewAnimId) cancelAnimationFrame(previewAnimId);
    const startQuat = cubeGroup.quaternion.clone();
    const duration = 350;
    let startTime = null;
    function step(ts) {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        cubeGroup.quaternion.slerpQuaternions(startQuat, targetQuat, progress);
        if (progress < 1) previewAnimId = requestAnimationFrame(step);
        else previewAnimId = null;
    }
    previewAnimId = requestAnimationFrame(step);
}

/** Smoothly returns the cube group to its neutral (identity) rotation. */
export function resetPreviewRotation(scene) {
    const cubeGroup = scene.getObjectByName("RubiksCube");
    if (!cubeGroup) return;
    if (previewAnimId) cancelAnimationFrame(previewAnimId);
    const startQuat = cubeGroup.quaternion.clone();
    const targetQuat = new THREE.Quaternion();
    const duration = 350;
    let startTime = null;
    function step(ts) {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        cubeGroup.quaternion.slerpQuaternions(startQuat, targetQuat, progress);
        if (progress < 1) previewAnimId = requestAnimationFrame(step);
        else previewAnimId = null;
    }
    previewAnimId = requestAnimationFrame(step);
}

/**
 * Resets the cube to solved, then instantly (no animation) applies the
 * INVERSE of `solutionMoves` - used to put the 3D cube into the exact state
 * that `solutionMoves`, played forward, will solve. This is how the
 * physical-cube-solver and tutorial playback set their starting position.
 * Returns a snapshot of that starting state, for later jump-to-step use.
 */
export function setupForPlayback(solutionMoves, scene) {
    const solvedState = resetForScramble();
    const cubeGroup = scene.getObjectByName("RubiksCube");
    let state = solvedState;
    for (let i = solutionMoves.length - 1; i >= 0; i--) {
        const inverse = { ...solutionMoves[i], dir: -solutionMoves[i].dir };
        state = applyMove(inverse);
    }
    syncVisualsToState(state, cubeGroup);
    return getPiecesSnapshot();
}

/**
 * Creates a controllable player for an arbitrary move list (used by the
 * physical-cube solver and the tutorial section) - independent of the
 * scramble/solve history tracking, since this is a separate "watch and
 * follow along" mode. Returns { play, pause, next, prev, setSpeed, onStep,
 * index, total, isPlaying }.
 */
export function createMovePlayer(moves, scene, options = {}) {
    let index = 0;
    let playing = false;
    let stepListeners = [];
    let speedMs = options.speedMs || 900;
    let animating = false;
    const startState = options.startState || getPiecesSnapshot();

    function notify() {
        stepListeners.forEach(fn => fn({ index, total: moves.length, move: moves[index] || null, playing }));
    }

    function stepForward(auto) {
        if (index >= moves.length || animating) return;
        animating = true;
        const move = enrichMoveForAnimation(moves[index]);
        const newLogicalState = applyMove(move);
        animateAndSync(move, newLogicalState, scene, () => {
            animating = false;
            index += 1;
            notify();
            if (auto && playing && index < moves.length) {
                setTimeout(() => stepForward(true), speedMs * 0.15);
            } else if (index >= moves.length) {
                playing = false;
                notify();
            }
        });
    }

    function stepBackward() {
        if (index <= 0 || animating) return;
        animating = true;
        index -= 1;
        const inverseMove = { ...moves[index], dir: -moves[index].dir };
        const enriched = enrichMoveForAnimation(inverseMove);
        const newLogicalState = applyMove(enriched);
        animateAndSync(enriched, newLogicalState, scene, () => {
            animating = false;
            notify();
        });
    }

    /** Jumps straight to any step (no animation) by replaying from the
     * captured start state - lets the move list act as a scrub bar. */
    function jumpTo(targetIndex) {
        if (animating) return;
        const clamped = Math.max(0, Math.min(targetIndex, moves.length));
        playing = false;
        let state = setPiecesState(startState);
        for (let i = 0; i < clamped; i++) {
            state = applyMove(enrichMoveForAnimation(moves[i]));
        }
        syncVisualsToState(state, scene.getObjectByName("RubiksCube"));
        index = clamped;
        notify();
    }

    return {
        play() { if (playing || index >= moves.length) return; playing = true; notify(); stepForward(true); },
        pause() { playing = false; notify(); },
        next() { playing = false; stepForward(false); },
        prev() { playing = false; stepBackward(); },
        jumpTo,
        setSpeed(ms) { speedMs = ms; },
        onStep(fn) { stepListeners.push(fn); },
        get index() { return index; },
        get total() { return moves.length; },
        get isPlaying() { return playing; },
    };
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
    // Uses the SAME angle formula as the logical state transform (cube-state.js),
    // so the visual spin always matches where the piece actually ends up.
    move.angle = getMoveAngle(move.dir);
    return move;
}

function getCssColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "#FF00FF";
}

import * as THREE from 'three';
import { applyMove, getScramble, getSolution, isRotating, setRotating, toFaceletString, initState } from './cube-state.js';
import { resetClock, stopClock, startClock } from './ui-handler.js';

const CUBIE_SIZE = 1;
const SPACING = 0.05;

// This maps the solver's face names (U, R, F, D, L, B) to our CSS color variables.
const FACE_COLOR_MAP = { U: 'up', R: 'right', F: 'front', D: 'down', L: 'left', B: 'back' };

/**
 * Creates the main THREE.Group for the cube.
 * @returns {THREE.Group}
 */
export function createRubiksCubeGroup() {
    const cubeGroup = new THREE.Group();
    cubeGroup.name = "RubiksCube";
    for (let i = 0; i < 27; i++) {
        // We only create placeholders. The colors will be set by syncVisualsToState.
        const geometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
        const material = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const cubie = new THREE.Mesh(geometry, [material, material, material, material, material, material]);
        cubie.name = `cubie_${i}`;
        cubie.visible = false; // Hide non-center pieces initially
        cubeGroup.add(cubie);
    }
    return cubeGroup;
}

/**
 * The "Snap-to-Grid" function. It reads the logical state and updates the visuals.
 * This is the most critical function for stability.
 */
export function syncVisualsToState(cubeGroup) {
    const faceletString = toFaceletString();
    if (!faceletString || !cubeGroup) return;

    // Define the mapping from facelet index to cubie and face index
    const stickerMap = [
        { c: 7, f: 2 }, { c: 8, f: 2 }, { c: 9, f: 2 }, { c: 4, f: 2 }, { c: 5, f: 2 }, { c: 6, f: 2 }, { c: 1, f: 2 }, { c: 2, f: 2 }, { c: 3, f: 2 },
        { c: 9, f: 0 }, { c: 6, f: 0 }, { c: 3, f: 0 }, { c: 18, f: 0 }, { c: 15, f: 0 }, { c: 12, f: 0 }, { c: 27, f: 0 }, { c: 24, f: 0 }, { c: 21, f: 0 },
        { c: 3, f: 4 }, { c: 2, f: 4 }, { c: 1, f: 4 }, { c: 12, f: 4 }, { c: 11, f: 4 }, { c: 10, f: 4 }, { c: 21, f: 4 }, { c: 20, f: 4 }, { c: 19, f: 4 },
        { c: 19, f: 3 }, { c: 20, f: 3 }, { c: 21, f: 3 }, { c: 22, f: 3 }, { c: 23, f: 3 }, { c: 24, f: 3 }, { c: 25, f: 3 }, { c: 26, f: 3 }, { c: 27, f: 3 },
        { c: 1, f: 1 }, { c: 4, f: 1 }, { c: 7, f: 1 }, { c: 10, f: 1 }, { c: 13, f: 1 }, { c: 16, f: 1 }, { c: 19, f: 1 }, { c: 22, f: 1 }, { c: 25, f: 1 },
        { c: 7, f: 5 }, { c: 8, f: 5 }, { c: 9, f: 5 }, { c: 16, f: 5 }, { c: 17, f: 5 }, { c: 18, f: 5 }, { c: 25, f: 5 }, { c: 26, f: 5 }, { c: 27, f: 5 }
    ];
    
    // Map cubie indices to their 3D positions
    const positionMap = {};
    let i = 1;
    for (let y = 1; y >= -1; y--) {
        for (let z = -1; z <= 1; z++) {
            for (let x = -1; x <= 1; x++) {
                positionMap[i++] = {x, y, z};
            }
        }
    }
    
    // Update colors and positions based on the facelet string
    for (let i = 0; i < 54; i++) {
        const face = FACE_COLOR_MAP[faceletString[i]];
        const color = getCssColor(`--color-${face}`);
        const map = stickerMap[i];
        const cubie = cubeGroup.children[map.c - 1];
        const pos = positionMap[map.c];
        
        cubie.visible = true;
        cubie.position.set(pos.x * (CUBIE_SIZE + SPACING), pos.y * (CUBIE_SIZE + SPACING), pos.z * (CUBIE_SIZE + SPACING));
        cubie.material[map.f].color.set(color);
    }
}

/**
 * Animates a sequence of moves.
 */
function animateMoveSequence(moves, scene, onComplete) {
    if (isRotating()) return;
    setRotating(true);
    
    const moveArray = moves.split(' ');

    function executeNextMove(index) {
        if (index >= moveArray.length) {
            setRotating(false);
            if (onComplete) onComplete();
            return;
        }

        const move = moveArray[index];
        if (!move) { // Handle empty strings from multiple spaces
            executeNextMove(index + 1);
            return;
        }
        
        applyMove(move); // Apply the move to the logical state
        
        // This is a simplified animation. For a true animation, this needs more work.
        // For now, we just snap to the new state.
        syncVisualsToState(scene.getObjectByName("RubiksCube"));
        
        // Use a short delay to simulate animation
        setTimeout(() => {
            executeNextMove(index + 1);
        }, 100); 
    }
    
    executeNextMove(0);
}

export function scrambleCube(scene) {
    if (isRotating()) return;
    console.log("Scrambling the cube...");
    
    resetClock();
    const scrambleMoves = getScramble();
    console.log("Scramble string:", scrambleMoves);
    
    // Animate the scramble
    animateMoveSequence(scrambleMoves, scene, () => {
        // After scrambling is visually complete, the game is ready
        // (This state management can be improved in cube-state.js)
    });
}

export function solveCube(scene) {
    if (isRotating()) return;
    stopClock();
    
    const solutionMoves = getSolution();
    if (!solutionMoves) {
        console.log("Cube is already solved.");
        return;
    }
    
    console.log("Solving cube with moves:", solutionMoves);
    animateMoveSequence(solutionMoves, scene, () => {
        console.log("Solve complete!");
    });
}

function getCssColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#FF00FF';
}

// User interaction logic is now much simpler
export function rotateFace(clickedObject, dragDirection, scene, onRotationComplete) {
    // This part is now very complex because we need to map a visual drag to a logical move (U, F, R', etc.)
    // This is a major feature in itself. For now, we'll leave it disabled to focus on the solver.
    console.log("Manual rotation is complex with the new architecture and needs to be reimplemented.");
    onRotationComplete(); // Re-enable controls immediately
}

import { initScene, initInteraction } from './three-scene.js';
import { createRubiksCubeGroup, scrambleCube, solveCube } from './cube.js';
import { initState } from './cube-state.js';
import { initUI } from './ui-handler.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("Initializing application...");
        
        // 1. Initialize the UI and the logical state
        initUI();
        const logicalState = initState();

        // 2. Initialize the 3D scene
        const scene = initScene();

        // 3. Create the visual representation of the cube
        const rubiksCubeGroup = createRubiksCubeGroup(logicalState);
        scene.add(rubiksCubeGroup);

        // 4. Initialize user interaction handlers
        // Note: Manual rotation is temporarily complex with this new architecture.
        initInteraction();
        
        // 5. Connect buttons
        document.getElementById('scramble-btn').addEventListener('click', () => scrambleCube(scene));
        document.getElementById('solve-btn').addEventListener('click', () => solveCube(scene));

        console.log("Rubik's Cube is ready! 🚀");

    } catch (error) {
        console.error("Application failed to initialize:", error);
    }
});

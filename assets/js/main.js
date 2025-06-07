import { initScene, initInteraction } from './three-scene.js';
import { createRubiksCubeGroup, scrambleCube, solveCube } from './cube.js';
import { initState } from './cube-state.js';
import { initUI } from './ui-handler.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("Initializing application...");
        
        // 1. Initialize the UI elements (buttons, modals, theme)
        initUI();

        // 2. Initialize the core logical state of the cube
        const logicalState = initState();

        // 3. Initialize the 3D scene
        const scene = initScene();

        // 4. Create the visual representation based on the logical state
        const rubiksCubeGroup = createRubiksCubeGroup(logicalState);
        scene.add(rubiksCubeGroup);

        // 5. Initialize user interaction handlers
        initInteraction();
        
        // 6. Connect buttons, passing the scene object to them
        document.getElementById('scramble-btn').addEventListener('click', () => scrambleCube(scene));
        document.getElementById('solve-btn').addEventListener('click', () => solveCube(scene));

        console.log("Rubik's Cube is ready! 🚀");

    } catch (error) {
        console.error("Application failed to initialize:", error);
    }
});

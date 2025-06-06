// highlight-start
// Import the new function from three-scene.js
import { initScene, initInteraction } from './three-scene.js';
// highlight-end
import { createRubiksCube, scrambleCube, solveCube } from './cube.js';
import { initUI } from './ui-handler.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("DOM fully loaded. Initializing application...");

        // 1. Initialize the User Interface
        initUI();
        console.log("UI initialized successfully.");

        // 2. Initialize the 3D Scene
        const scene = initScene();
        console.log("3D scene initialized successfully.");

        // 3. Create and add the Rubik's Cube to the scene
        const rubiksCube = createRubiksCube();
        scene.add(rubiksCube);
        console.log("Rubik's Cube created and added to the scene.");

        // highlight-start
        // 4. Initialize interaction handlers for the cube
        initInteraction();
        console.log("Interaction handlers initialized.");
        // highlight-end

        // 5. Connect control buttons to their functions
        document.getElementById('scramble-btn').addEventListener('click', scrambleCube);
        document.getElementById('solve-btn').addEventListener('click', solveCube);
        console.log("Control buttons initialized.");

        console.log("Rubik's Cube is ready! 🚀");

    } catch (error) {
        console.error("An error occurred during application initialization:", error);
        const container = document.getElementById('scene-container');
        if (container) {
            container.innerHTML = `<div style="color: red; padding: 20px; text-align: center;">
                <h2>Application Failed to Load</h2>
                <p>Please check the browser console (F12) for more details.</p>
            </div>`;
        }
    }
});

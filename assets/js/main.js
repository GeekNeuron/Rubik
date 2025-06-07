import { initScene, initInteraction } from './three-scene.js';
import { createRubiksCubeGroup, scrambleCube, solveCube } from './cube.js';
import { initState } from './cube-state.js';
import { initUI } from './ui-handler.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("Initializing application...");
        
        initUI();

        const logicalState = initState();

        const scene = initScene();

        const rubiksCubeGroup = createRubiksCubeGroup(logicalState);
        scene.add(rubiksCubeGroup);

        initInteraction();
        
        document.getElementById('scramble-btn').addEventListener('click', () => scrambleCube(scene));
        document.getElementById('solve-btn').addEventListener('click', () => solveCube(scene));

        console.log("Rubik's Cube is ready! 🚀");

    } catch (error) {
        console.error("Application failed to initialize:", error);
    }
});

import { initScene } from './three-scene.js';
import { createRubiksCube, scrambleCube, solveCube } from './cube.js';
import { initUI } from './ui-handler.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize the User Interface
    initUI();

    // 2. Initialize the 3D Scene
    const scene = initScene();

    // 3. Create and add the Rubik's Cube to the scene
    const rubiksCube = createRubiksCube();
    scene.add(rubiksCube);

    // 4. Connect buttons to their functions
    document.getElementById('scramble-btn').addEventListener('click', scrambleCube);
    document.getElementById('solve-btn').addEventListener('click', solveCube);

    console.log("Rubik's Cube is ready! 🚀");
});

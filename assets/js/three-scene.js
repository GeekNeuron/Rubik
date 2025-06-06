import * as THREE from 'three';
// CORRECTED IMPORT PATH: We import directly from the "addons" path defined in the importmap
import { OrbitControls } from 'three/addons/OrbitControls.js';

let scene, camera, renderer, controls;

export function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(getComputedStyle(document.body).getPropertyValue('--body-bg').trim());

    const container = document.getElementById('scene-container');
    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(4, 5, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 20;

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    return scene;
}

export function updateBackgroundColor() {
    if (scene) {
        scene.background.set(getComputedStyle(document.body).getPropertyValue('--body-bg').trim());
    }
}

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

let scene, camera, renderer, controls;

// ... (The initScene and updateBackgroundColor functions remain unchanged) ...
// The following is the new code to be added at the end of the file.

// --- START: Interaction Code ---

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let intersectedObject = null;

/**
 * Handles pointer down events (mouse click or touch start).
 * @param {PointerEvent} event
 */
function onPointerDown(event) {
    // Disable interaction if camera is being moved
    // We will add this logic later

    // Calculate pointer position in normalized device coordinates (-1 to +1)
    const canvasBounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    pointer.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    // Update the picking ray with the camera and pointer position
    raycaster.setFromCamera(pointer, camera);

    // Get the full cube group from the scene to check for intersections
    const cube = scene.getObjectByName("RubiksCube");
    if (!cube) {
        console.warn("Could not find RubiksCube group in the scene.");
        return;
    }

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(cube.children);

    if (intersects.length > 0) {
        // The first object in the array is the closest one
        intersectedObject = intersects[0];
        console.log("Clicked on a cubie!");
        // The 'normal' vector tells us which face was clicked
        console.log("Face Normal:", intersectedObject.face.normal); 
    } else {
        intersectedObject = null;
    }
}

/**
 * Initializes all the interaction event listeners.
 * This function will be called once from main.js.
 */
export function initInteraction() {
    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', onPointerDown, false);
    // We will add 'pointermove' and 'pointerup' event listeners here later for dragging.
}

// --- END: Interaction Code ---

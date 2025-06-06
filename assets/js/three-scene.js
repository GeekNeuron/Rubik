import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
// Import the new functions from cube.js
import { rotateFace, isRotating } from '../../assets/js/cube.js';

// Global variables for the scene
let scene, camera, renderer, controls;

// Global variables for interaction logic
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const startPoint = new THREE.Vector2(); // To store the starting point of a drag
const moveDirection = new THREE.Vector2(); // To store the vector of the drag
let isDragging = false; // A flag to know if the user is currently dragging
let intersectedObject = null; // To store the object that was initially clicked

/**
 * Initializes the main 3D scene, camera, lights, and renderer.
 * @returns {THREE.Scene} The initialized scene object.
 */
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

/**
 * Updates the scene's background color when the theme changes.
 */
export function updateBackgroundColor() {
    if (scene) {
        scene.background.set(getComputedStyle(document.body).getPropertyValue('--body-bg').trim());
    }
}

// --- Interaction Logic ---

/**
 * Handles pointer down events (mouse click or touch start).
 * This function starts a "drag session".
 */
function onPointerDown(event) {
    // Prevent starting a new drag if a rotation is already happening
    if (isRotating) return;

    const canvasBounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    pointer.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const cube = scene.getObjectByName("RubiksCube");
    if (!cube) return;

    const intersects = raycaster.intersectObjects(cube.children);
    if (intersects.length > 0) {
        isDragging = true;
        intersectedObject = intersects[0]; // Store the clicked object and face
        startPoint.set(event.clientX, event.clientY); // Store the starting screen coordinates
        
        // Disable camera controls so the camera doesn't move while we drag.
        controls.enabled = false; 
    }
}

/**
 * Handles pointer move events (mouse drag or touch move).
 * This function tracks the direction of the drag.
 */
function onPointerMove(event) {
    if (!isDragging) return; // Only run if a drag has started

    // Calculate the vector of the movement from the start point
    moveDirection.x = event.clientX - startPoint.x;
    moveDirection.y = event.clientY - startPoint.y;
}

/**
 * Handles pointer up events (mouse release or touch end).
 * This function ends the "drag session" and triggers the rotation.
 */
function onPointerUp(event) {
    if (!isDragging) return;

    const dragThreshold = 50; // User must drag at least 50 pixels for it to count
    
    // Check if the drag distance was significant
    if (Math.abs(moveDirection.x) > dragThreshold || Math.abs(moveDirection.y) > dragThreshold) {
        let dragDirection = '';
        // Determine if the drag was more horizontal or vertical
        if (Math.abs(moveDirection.x) > Math.abs(moveDirection.y)) {
            dragDirection = moveDirection.x > 0 ? 'RIGHT' : 'LEFT';
        } else {
            dragDirection = moveDirection.y > 0 ? 'DOWN' : 'UP';
        }
        
        // Call the actual rotation function from cube.js
        rotateFace(intersectedObject, dragDirection, scene, () => {
            // This is a callback function that runs after the rotation animation is complete.
            // We re-enable camera controls here to ensure smooth operation.
            controls.enabled = true;
        });
        
    } else {
        // If drag was too short, just re-enable controls.
        controls.enabled = true;
    }

    // Cleanup for the next interaction
    isDragging = false;
    intersectedObject = null;
    moveDirection.set(0,0);
}

/**
 * Initializes all interaction event listeners for the scene.
 */
export function initInteraction() {
    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', onPointerDown, false);
    domElement.addEventListener('pointermove', onPointerMove, false);
    domElement.addEventListener('pointerup', onPointerUp, false);
    // Also cancel the drag if the pointer leaves the canvas area
    domElement.addEventListener('pointerleave', onPointerUp, false); 
}

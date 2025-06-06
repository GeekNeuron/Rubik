import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

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
 */
export function initScene() {
    // ... (This function remains unchanged)
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
    // ... (This function remains unchanged)
    if (scene) {
        scene.background.set(getComputedStyle(document.body).getPropertyValue('--body-bg').trim());
    }
}

// --- START: Interaction Logic (Updated Section) ---

/**
 * Handles pointer down events (mouse click or touch start).
 * This function starts a "drag session".
 */
function onPointerDown(event) {
    const canvasBounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    pointer.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const cube = scene.getObjectByName("RubiksCube");
    if (!cube) return;

    const intersects = raycaster.intersectObjects(cube.children);

    if (intersects.length > 0) {
        // A cubie was clicked, so start dragging.
        isDragging = true;
        intersectedObject = intersects[0]; // Store the clicked object and face
        startPoint.set(event.clientX, event.clientY); // Store the starting screen coordinates
        
        // IMPORTANT: Disable camera controls so the camera doesn't move while we drag.
        controls.enabled = false; 
        console.log("Drag Started on face with normal:", intersectedObject.face.normal);
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
 * This function ends the "drag session" and determines the final action.
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
        
        console.log(`Drag Ended. Direction: ${dragDirection}`);
        
        // In the next step, we will call the function to actually rotate the face here.
        // For example: rotateFace(intersectedObject, dragDirection);
    } else {
        console.log("Drag was too short, cancelled.");
    }

    // End the drag session and clean up
    isDragging = false;
    intersectedObject = null;
    moveDirection.set(0,0);
    
    // IMPORTANT: Re-enable camera controls.
    controls.enabled = true; 
}

/**
 * Initializes all interaction event listeners for the scene.
 * This is an updated function that now includes move and up events.
 */
export function initInteraction() {
    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', onPointerDown, false);
    domElement.addEventListener('pointermove', onPointerMove, false);
    domElement.addEventListener('pointerup', onPointerUp, false);
    // Also cancel the drag if the pointer leaves the canvas area
    domElement.addEventListener('pointerleave', onPointerUp, false); 
}

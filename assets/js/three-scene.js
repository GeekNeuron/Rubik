import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { rotateFace } from './cube.js';
import { isRotating, isSolved, isGameReady, setGameReady } from './cube-state.js';
import { startClock, stopClock } from './ui-handler.js';

let scene, camera, renderer, controls;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const startPoint = new THREE.Vector2();
const moveDirection = new THREE.Vector2();
let isDragging = false;
let intersectedObject = null;

export function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(getCssColor('--body-bg'));
    const container = document.getElementById('scene-container');
    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 6, 9);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
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
        scene.background.set(getCssColor('--body-bg'));
    }
}

function onPointerDown(event) {
    if (isRotating()) return;
    const canvasBounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    pointer.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const cube = scene.getObjectByName("RubiksCube");
    if (!cube) return;
    const intersects = raycaster.intersectObjects(cube.children);
    if (intersects.length > 0) {
        isDragging = true;
        intersectedObject = intersects[0];
        startPoint.set(event.clientX, event.clientY);
        controls.enabled = false;
    }
}

function onPointerMove(event) {
    if (!isDragging) return;
    moveDirection.x = event.clientX - startPoint.x;
    moveDirection.y = event.clientY - startPoint.y;
}

function onPointerUp() {
    if (!isDragging) return;
    const dragThreshold = 30;
    if (Math.abs(moveDirection.x) > dragThreshold || Math.abs(moveDirection.y) > dragThreshold) {
        let dragDirection = Math.abs(moveDirection.x) > Math.abs(moveDirection.y)
            ? (moveDirection.x > 0 ? 'RIGHT' : 'LEFT')
            : (moveDirection.y > 0 ? 'DOWN' : 'UP');
            
        // Pass the 'camera' object to the rotateFace function
        rotateFace(intersectedObject, dragDirection, scene, camera, () => {
            controls.enabled = true;
            
            if (isGameReady()) {
                startClock();
                setGameReady(false);
            }

            if (isSolved()) {
                stopClock();
                console.log("CONGRATULATIONS! The cube is solved!");
                alert("شما مکعب را حل کردید!"); 
            }
        });
    } else {
        controls.enabled = true;
    }
    isDragging = false;
    intersectedObject = null;
    moveDirection.set(0, 0);
}

export function initInteraction() {
    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointermove', onPointerMove);
    domElement.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('pointerleave', onPointerUp);
}

function getCssColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#FF00FF';
}

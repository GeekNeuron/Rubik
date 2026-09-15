import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { rotateFace } from './cube.js';
import { isRotating, isSolved, clearHistory } from './cube-state.js';
import { startClock, stopClock, showToast, t } from './ui-handler.js';

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // A filmic tone curve + correct color space makes the glossy plastic
    // material below read as "real plastic under studio light" instead of
    // the flat, slightly washed-out look plain linear output gives PBR
    // materials.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Soft image-based lighting from a small procedural "studio" - this is
    // what actually sells glossy plastic (the clearcoat needs *something*
    // to reflect, or it just looks dark/flat) without needing to ship an
    // HDR image asset.
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(buildStudioEnvironment(), 0.04).texture;

    // Three-point lighting instead of flat ambient + one light: a bright
    // key light, a softer cool-toned fill from the opposite side, and a
    // gentle rim light behind/above for edge definition against the
    // background.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);
    const keyLight = new THREE.DirectionalLight(0xfff4e6, 1.35);
    keyLight.position.set(6, 9, 6);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xd6e6ff, 0.5);
    fillLight.position.set(-7, 3, -4);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(-2, 6, -8);
    scene.add(rimLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    // Aim below the cube's actual center so the cube renders higher up in
    // the viewport, leaving clearance at the bottom for the controls panel
    // (otherwise it visually overlaps the lower half of the cube, especially
    // on shorter desktop windows).
    const verticalOffset = -1.6;
    controls.target.set(0, verticalOffset, 0);
    camera.lookAt(controls.target);
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
 * A minimal procedural "studio" (three soft gradient panels around the
 * origin) baked into an environment map via PMREMGenerator. Cheaper than
 * shipping an actual HDR file, and enough for convincing highlights on a
 * glossy clearcoat material - real product-shot studios use exactly this
 * three-panel setup for the same reason.
 */
function buildStudioEnvironment() {
    const envScene = new THREE.Scene();
    const panel = (color, intensity, position, rotationY) => {
        const geo = new THREE.PlaneGeometry(8, 8);
        const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.rotation.y = rotationY;
        mesh.material.color.multiplyScalar(intensity);
        envScene.add(mesh);
    };
    envScene.background = new THREE.Color(0x1a1a1a);
    panel(0xffffff, 1.4, new THREE.Vector3(0, 0, -8), 0);
    panel(0xbcd4ff, 0.6, new THREE.Vector3(-8, 0, 0), Math.PI / 2);
    panel(0xfff0d6, 0.8, new THREE.Vector3(8, 0, 0), -Math.PI / 2);
    return envScene;
}

export function updateBackgroundColor() {
    if (scene) {
        scene.background.set(getCssColor('--body-bg'));
    }
}

export function getCamera() {
    return camera;
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
        rotateFace(intersectedObject, moveDirection.clone(), scene, camera, () => {
            controls.enabled = true;
            startClock(); // no-ops if already running - times any manual turn, scrambled or not

            if (isSolved()) {
                stopClock();
                clearHistory();
                console.log("CONGRATULATIONS! The cube is solved!");
                showToast(t('solvedByUser'));
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
    return getComputedStyle(document.body).getPropertyValue(varName).trim() || '#FF00FF';
}

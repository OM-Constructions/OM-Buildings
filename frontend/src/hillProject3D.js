import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Centralized Model Preloading and Caching
const sharedGLTFLoader = new GLTFLoader();
const modelCache = new Map();

function preloadModel(modelPath) {
    if (!modelCache.has(modelPath)) {
        console.log(`[3D] Loading: ${modelPath}`);
        const loadPromise = new Promise((resolve, reject) => {
            sharedGLTFLoader.load(
                modelPath,
                (gltf) => {
                    console.log(`[3D] Loaded: ${modelPath}`);
                    resolve(gltf);
                },
                undefined,
                (error) => {
                    console.error(`[3D] FAILED: ${modelPath}`, error);
                    reject(error);
                }
            );
        });
        modelCache.set(modelPath, loadPromise);
    }
    return modelCache.get(modelPath);
}

// Immediately trigger preloads to start downloads synchronously with page load
function preloadGLBModels() {
    // 1. Priority load for the smallest/first model
    preloadModel('./assets/models/modern-villa.glb');

    // 2. Load the remaining large models in parallel so HTTP/2 can multiplex them
    preloadModel('./assets/models/apartment-building.glb');
    preloadModel('./assets/models/independent-house.glb');
    preloadModel('./assets/models/contemporary-residence.glb');
}
preloadGLBModels();


function initProject3D(containerId, fallbackId, modelPath, options = {}) {
    const container = document.getElementById(containerId);
    const fallback = document.getElementById(fallbackId);
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Do not initialize scene/renderer if container has zero size (e.g. hidden)
    if (width === 0 || height === 0) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = options.exposure || 1.2;
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    container.style.cursor = 'grab';
    controls.addEventListener('start', () => container.style.cursor = 'grabbing');
    controls.addEventListener('end', () => container.style.cursor = 'grab');

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xdddddd, 2.5);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const frontKey = new THREE.DirectionalLight(0xfff5e6, 3.5);
    frontKey.position.set(20, 40, 20);
    frontKey.castShadow = true;
    frontKey.shadow.mapSize.width = 2048;
    frontKey.shadow.mapSize.height = 2048;
    frontKey.shadow.camera.near = 0.1;
    frontKey.shadow.camera.far = 100;
    frontKey.shadow.camera.left = -20;
    frontKey.shadow.camera.right = 20;
    frontKey.shadow.camera.top = 20;
    frontKey.shadow.camera.bottom = -20;
    frontKey.shadow.bias = -0.002;
    frontKey.shadow.normalBias = 0.05;
    scene.add(frontKey);

    const backKey = new THREE.DirectionalLight(0xffffff, 3.5);
    backKey.position.set(-20, 40, -20);
    scene.add(backKey);

    const frontFill = new THREE.DirectionalLight(0xe6f5ff, 2.0);
    frontFill.position.set(-20, 20, 20);
    scene.add(frontFill);

    const backFill = new THREE.DirectionalLight(0xe6f5ff, 2.0);
    backFill.position.set(20, 20, -20);
    scene.add(backFill);

    // Get the preloaded model promise from cache
    const loadPromise = preloadModel(modelPath);
    
    loadPromise.then((gltf) => {
        // Hide fallback immediately when the model is ready to be added to the scene
        if (fallback) fallback.style.display = 'none';

        // Use the scene directly. .clone() can break complex architectural models 
        // containing instanced meshes, skinned meshes, or certain extensions.
        const model = gltf.scene;

        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;

                if (node.material) {
                    const materials = Array.isArray(node.material) ? node.material : [node.material];
                    materials.forEach(mat => {
                        mat.aoMap = null;
                        mat.lightMap = null;

                        if (mat.metalness !== undefined && mat.metalness > 0.3) {
                            mat.metalness = 0.3; 
                        }
                        if (mat.roughness !== undefined && mat.roughness < 0.5) {
                            mat.roughness = 0.5;
                        }

                        if (mat.color) {
                            const hsl = {};
                            mat.color.getHSL(hsl);
                            if (hsl.l < 0.15) {
                                mat.color.setHSL(hsl.h, hsl.s, 0.15);
                            }
                        }

                        mat.side = THREE.DoubleSide;
                        mat.needsUpdate = true;
                    });
                }
            }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 10;
        const scale = targetSize / maxDim;
        model.scale.setScalar(scale);

        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

        model.position.sub(scaledCenter);
        scene.add(model);

        camera.position.set(targetSize * 0.8, targetSize * 0.6, targetSize * 1.5);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);

        controls.minDistance = targetSize * 0.5;
        controls.maxDistance = targetSize * 3;

    }).catch((error) => {
        // On error, do nothing to the DOM so the fallback remains visible
        // Error logging is already handled in preloadModel
    });

    // Pause animation when out of view
    let isVisible = true;
    if (window.IntersectionObserver) {
        const visObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => isVisible = entry.isIntersecting);
        }, { rootMargin: '100px 0px' });
        visObserver.observe(container);
    }

    function animate() {
        requestAnimationFrame(animate);
        if (!isVisible) return; 
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    function onWindowResize() {
        if (!container) return;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;

        if (newWidth === 0 || newHeight === 0) return;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    }

    window.addEventListener('resize', onWindowResize);

    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
            onWindowResize();
        });
        resizeObserver.observe(container);
    }
}

// Initialize immediately so preloaded models have scenes waiting for them
function initAllProjects() {
    initProject3D('hill-project-container', 'hill-project-fallback', './assets/models/modern-villa.glb', { exposure: 1.0 });
    initProject3D('commercial-complex-container', 'commercial-complex-fallback', './assets/models/apartment-building.glb', { exposure: 1.0 });
    initProject3D('industrial-project-container', 'industrial-project-fallback', './assets/models/independent-house.glb', { exposure: 1.0 });
    initProject3D('residential-project-container', 'residential-project-fallback', './assets/models/contemporary-residence.glb', { exposure: 1.0 });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllProjects);
} else {
    initAllProjects();
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Centralized Model Preloading and Caching
const sharedGLTFLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
sharedGLTFLoader.setDRACOLoader(dracoLoader);

const modelCache = new Map();
let sharedEnvironment = null;

function getSharedEnvironment(renderer) {
    if (!sharedEnvironment) {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        sharedEnvironment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
        pmremGenerator.dispose();
    }
    return sharedEnvironment;
}

// Device Profiling
const deviceProfile = {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768,
    isLowEnd: (navigator.hardwareConcurrency || 4) <= 4,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    get pixelRatio() {
        if (this.isMobile) {
            return this.isLowEnd ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5);
        }
        return Math.min(window.devicePixelRatio || 1, 2.0);
    },
    get enableShadows() {
        return !this.isMobile;
    }
};

// Sequential Loading Queue
const loadQueue = [];
let isQueueProcessing = false;

function processLoadQueue() {
    if (isQueueProcessing || loadQueue.length === 0) return;
    
    isQueueProcessing = true;
    const { modelPath, resolve, reject } = loadQueue.shift();
    
    console.log(`[3D] START QUEUED ${modelPath}`);
    sharedGLTFLoader.load(
        modelPath,
        (gltf) => {
            console.log(`[3D] PARSED ${modelPath}`);
            resolve(gltf);
            isQueueProcessing = false;
            // Delay next load slightly to allow main thread to breathe
            setTimeout(processLoadQueue, 100);
        },
        undefined,
        (error) => {
            console.error(`[3D] FAILED ${modelPath}`, error);
            reject(error);
            isQueueProcessing = false;
            setTimeout(processLoadQueue, 100);
        }
    );
}

function enqueueModelLoad(modelPath) {
    if (!modelCache.has(modelPath)) {
        const loadPromise = new Promise((resolve, reject) => {
            loadQueue.push({ modelPath, resolve, reject });
            processLoadQueue();
        });
        modelCache.set(modelPath, loadPromise);
    }
    return modelCache.get(modelPath);
}

function initProject3D(containerId, fallbackId, modelPath, options = {}) {
    const container = document.getElementById(containerId);
    const fallback = document.getElementById(fallbackId);
    if (!container) return;

    if (deviceProfile.isMobile) {
        if (fallback) fallback.style.display = 'block';
        return;
    }

    let scene, camera, renderer, controls;
    let initialized = false;
    let isVisible = false;
    let animationFrameId = null;

    function startRenderLoop() {
        if (!initialized || animationFrameId !== null) return;
        if (!isVisible || document.visibilityState === 'hidden') return;
        
        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            if (!isVisible || document.visibilityState === 'hidden') {
                stopRenderLoop();
                return;
            }
            controls.update();
            renderer.render(scene, camera);
        }
        animate();
    }

    function stopRenderLoop() {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function setupWebGL() {
        if (initialized) return;
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (width === 0 || height === 0) return;
        
        // Detect WebGL Support
        try {
            const canvas = document.createElement('canvas');
            if (!window.WebGLRenderingContext || (!canvas.getContext('webgl') && !canvas.getContext('experimental-webgl'))) {
                console.warn('[3D] WebGL not supported, falling back to static preview.');
                return; // Fallback remains visible
            }
        } catch (e) {
            console.warn('[3D] WebGL context creation failed, falling back to static preview.', e);
            return;
        }

        initialized = true;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

        renderer = new THREE.WebGLRenderer({ antialias: !deviceProfile.isMobile, alpha: false });
        renderer.setSize(width, height);
        renderer.setPixelRatio(deviceProfile.pixelRatio);
        
        if (deviceProfile.enableShadows) {
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        } else {
            renderer.shadowMap.enabled = false;
        }
        
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = options.exposure || 1.2;
        
        container.appendChild(renderer.domElement);

        scene.environment = getSharedEnvironment(renderer);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        
        if (deviceProfile.prefersReducedMotion || deviceProfile.isLowEnd) {
            controls.autoRotate = false;
        } else {
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.5;
        }

        container.style.cursor = 'grab';
        controls.addEventListener('start', () => container.style.cursor = 'grabbing');
        controls.addEventListener('end', () => container.style.cursor = 'grab');
        
        // When user interacts, we want to render immediately in case it was static
        controls.addEventListener('change', () => {
            if (initialized && isVisible && animationFrameId === null) {
                renderer.render(scene, camera);
            }
        });

        const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
        scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xdddddd, 2.5);
        hemiLight.position.set(0, 50, 0);
        scene.add(hemiLight);

        const frontKey = new THREE.DirectionalLight(0xfff5e6, 3.5);
        frontKey.position.set(20, 40, 20);
        if (deviceProfile.enableShadows) {
            frontKey.castShadow = true;
            frontKey.shadow.mapSize.width = 1024;
            frontKey.shadow.mapSize.height = 1024;
            frontKey.shadow.camera.near = 0.1;
            frontKey.shadow.camera.far = 100;
            const d = 20;
            frontKey.shadow.camera.left = -d;
            frontKey.shadow.camera.right = d;
            frontKey.shadow.camera.top = d;
            frontKey.shadow.camera.bottom = -d;
            frontKey.shadow.bias = -0.002;
        }
        scene.add(frontKey);

        const backKey = new THREE.DirectionalLight(0xffffff, 3.5);
        backKey.position.set(-20, 40, -20);
        scene.add(backKey);

        const loadPromise = enqueueModelLoad(modelPath);
        
        loadPromise.then((gltf) => {
            if (fallback) fallback.style.display = 'none';

            const model = gltf.scene;

            model.traverse((node) => {
                if (node.isMesh) {
                    if (deviceProfile.enableShadows) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                    if (node.material) {
                        const materials = Array.isArray(node.material) ? node.material : [node.material];
                        materials.forEach(mat => {
                            mat.aoMap = null;
                            mat.lightMap = null;
                            if (mat.metalness !== undefined && mat.metalness > 0.3) mat.metalness = 0.3; 
                            if (mat.roughness !== undefined && mat.roughness < 0.5) mat.roughness = 0.5;
                            if (mat.color) {
                                const hsl = {};
                                mat.color.getHSL(hsl);
                                if (hsl.l < 0.15) mat.color.setHSL(hsl.h, hsl.s, 0.15);
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
            
            console.log(`[3D] ADDED TO SCENE ${modelPath}`);
            startRenderLoop();

        }).catch((error) => {
            console.error(`[3D] ERROR ${modelPath} `, error);
            // Fallback naturally remains visible, so the user doesn't see a broken white box
        });
        
        // Listen to visibility changes on the document (e.g. changing tabs)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && isVisible) {
                startRenderLoop();
            } else {
                stopRenderLoop();
            }
        });
    }

    function onWindowResize() {
        if (!initialized || !container) return;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        if (newWidth === 0 || newHeight === 0) return;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
        
        if (isVisible && animationFrameId === null) {
            renderer.render(scene, camera);
        }
    }

    window.addEventListener('resize', onWindowResize);

    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => onWindowResize());
        resizeObserver.observe(container);
    }

    if (window.IntersectionObserver) {
        const visObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (isVisible) {
                    if (!initialized) {
                        setupWebGL();
                    } else {
                        startRenderLoop();
                    }
                } else {
                    stopRenderLoop();
                }
            });
        }, { rootMargin: '200px 0px' });
        visObserver.observe(container);
    } else {
        isVisible = true;
        setupWebGL();
    }
}

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

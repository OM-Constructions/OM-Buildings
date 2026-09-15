import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function initProject3D(containerId, fallbackId, modelPath, options = {}) {
    const container = document.getElementById(containerId);
    const fallback = document.getElementById(fallbackId);
    if (!container) return;

    // Hide fallback
    if (fallback) fallback.style.display = 'none';

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    // Clean white background
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Improve color and lighting rendering
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = options.exposure || 1.2;
    container.appendChild(renderer.domElement);

    // Add Environment / Studio Lighting for 360 visibility
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose(); // Dispose after generating to save memory

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    // Subtle auto-rotation
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Cursor handling for dragging
    container.style.cursor = 'grab';
    controls.addEventListener('start', () => container.style.cursor = 'grabbing');
    controls.addEventListener('end', () => container.style.cursor = 'grab');

    // Lighting setup for a professional architectural look
    // A. Intense Ambient Light to guarantee absolute baseline visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    // B. HemisphereLight for natural sky/ground bounce
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xdddddd, 2.5);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // C. Main Front Key Light (Warm, casts shadow)
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

    // D. Back Key Light to prevent the rear from being dark (Neutral)
    const backKey = new THREE.DirectionalLight(0xffffff, 3.5);
    backKey.position.set(-20, 40, -20);
    scene.add(backKey);

    // E. Symmetrical Cool Fills for shadows
    const frontFill = new THREE.DirectionalLight(0xe6f5ff, 2.0);
    frontFill.position.set(-20, 20, 20);
    scene.add(frontFill);

    const backFill = new THREE.DirectionalLight(0xe6f5ff, 2.0);
    backFill.position.set(20, 20, -20);
    scene.add(backFill);

    // Load Model
    const loader = new GLTFLoader();
    loader.load(
        modelPath,
        (gltf) => {
            const model = gltf.scene;

            // Enable shadows on all meshes
            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;

                    // Removed computeVertexNormals as it can break intentionally mirrored meshes

                    // Optional: adjust material slightly for better architectural look
                    if (node.material) {
                        const materials = Array.isArray(node.material) ? node.material : [node.material];
                        materials.forEach(mat => {
                            // Remove baked AO/Light maps that could force black shadows
                            mat.aoMap = null;
                            mat.lightMap = null;

                            // Prevent highly metallic/glossy surfaces from appearing pitch black
                            // by ensuring they catch diffuse light.
                            if (mat.metalness !== undefined && mat.metalness > 0.3) {
                                mat.metalness = 0.3; 
                            }
                            if (mat.roughness !== undefined && mat.roughness < 0.5) {
                                mat.roughness = 0.5;
                            }

                            // If the base color is extremely dark, it acts like a black hole.
                            // Give it a minimum baseline lightness (L=0.15) so ambient/fill lighting
                            // can actually reveal its details in shadows.
                            if (mat.color) {
                                const hsl = {};
                                mat.color.getHSL(hsl);
                                if (hsl.l < 0.15) {
                                    mat.color.setHSL(hsl.h, hsl.s, 0.15);
                                }
                            }

                            // Architectural models often have missing/inverted backfaces causing black rendering.
                            mat.side = THREE.DoubleSide;

                            // Ensure materials update
                            mat.needsUpdate = true;
                        });
                    }
                }
            });

            // Calculate bounding box and center/scale model
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 10;
            const scale = targetSize / maxDim;
            model.scale.setScalar(scale);

            // Recompute box after scaling
            const scaledBox = new THREE.Box3().setFromObject(model);
            const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

            // Center model at origin
            model.position.sub(scaledCenter);


            scene.add(model);

            // Position camera based on box size
            camera.position.set(targetSize * 0.8, targetSize * 0.6, targetSize * 1.5);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);

            // Limit zoom
            controls.minDistance = targetSize * 0.5;
            controls.maxDistance = targetSize * 3;
        },
        undefined,
        (error) => {
            console.error('Error loading GLB:', modelPath, error);
            // Fallback: restore the original card styling if it fails
            if (fallback) fallback.style.display = 'block';
        }
    );

    // Pause animation when out of view
    let isVisible = true;
    if (window.IntersectionObserver) {
        const visObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => isVisible = entry.isIntersecting);
        }, { rootMargin: '100px 0px' });
        visObserver.observe(container);
    }

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        if (!isVisible) return; // Save CPU/GPU when card is off-screen
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Resize Handler
    function onWindowResize() {
        if (!container) return;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;

        // Prevent setting size to 0
        if (newWidth === 0 || newHeight === 0) return;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(newWidth, newHeight);
    }

    window.addEventListener('resize', onWindowResize);

    // Observer for grid layout changes
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
            onWindowResize();
        });
        resizeObserver.observe(container);
    }
}

// Initialize lazily when user scrolls near the work section
function initAllProjects() {
    const workSection = document.getElementById('work');
    if (workSection) {
        let workInitialized = false;
        if (window.IntersectionObserver) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !workInitialized) {
                        workInitialized = true;
                        // Lazy initialize models only when the section approaches
                        initProject3D('hill-project-container', 'hill-project-fallback', './assets/models/modern-villa.glb', { exposure: 1.0 });
                        initProject3D('commercial-complex-container', 'commercial-complex-fallback', './assets/models/apartment-building.glb', { exposure: 1.0 });
                        initProject3D('industrial-project-container', 'industrial-project-fallback', './assets/models/independent-house.glb', { exposure: 1.0 });
                        initProject3D('residential-project-container', 'residential-project-fallback', './assets/models/contemporary-residence.glb', { exposure: 1.0 });
                        observer.disconnect();
                    }
                });
            }, { rootMargin: '400px 0px' });
            observer.observe(workSection);
        } else {
            // Fallback for very old browsers
            initProject3D('hill-project-container', 'hill-project-fallback', './assets/models/modern-villa.glb', { exposure: 1.0 });
            initProject3D('commercial-complex-container', 'commercial-complex-fallback', './assets/models/apartment-building.glb', { exposure: 1.0 });
            initProject3D('industrial-project-container', 'industrial-project-fallback', './assets/models/independent-house.glb', { exposure: 1.0 });
            initProject3D('residential-project-container', 'residential-project-fallback', './assets/models/contemporary-residence.glb', { exposure: 1.0 });
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllProjects);
} else {
    initAllProjects();
}

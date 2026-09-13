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

    // B. HemisphereLight for natural sky bounce
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe8ecef, 1.5); 
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // C. Main DirectionalLight (Key) for soft, readable shadows
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.5); 
    keyLight.position.set(20, 40, 20);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 100;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    keyLight.shadow.bias = -0.002; 
    keyLight.shadow.normalBias = 0.05;
    scene.add(keyLight);
    
    // D. 360-Degree Fill Ring to eliminate any remaining dark angles
    const fill1 = new THREE.DirectionalLight(0xffffff, 1.2); fill1.position.set(30, 15, 30); scene.add(fill1);
    const fill2 = new THREE.DirectionalLight(0xffffff, 1.2); fill2.position.set(-30, 15, 30); scene.add(fill2);
    const fill3 = new THREE.DirectionalLight(0xffffff, 1.2); fill3.position.set(-30, 15, -30); scene.add(fill3);
    const fill4 = new THREE.DirectionalLight(0xffffff, 1.2); fill4.position.set(30, 15, -30); scene.add(fill4);

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
                            // With an environment map added, metalness works properly!
                            // Keep it natural, but prevent extreme metallic rendering.
                            if (mat.metalness !== undefined) {
                                mat.metalness = 0.1; // Extremely low to ensure diffuse visibility
                            }
                            if (mat.roughness !== undefined) {
                                mat.roughness = 0.8; // Highly rough to catch ambient light
                            }
                            
                            // Remove baked AO/Light maps that could force black shadows
                            mat.aoMap = null;
                            mat.lightMap = null;
                            
                            // Fix for models that refuse to light up on certain sides
                            if (mat.map && modelPath.includes('commercial-complex')) {
                                mat.emissiveMap = mat.map;
                                mat.emissive = new THREE.Color(0x444444); // Stronger baseline illumination
                                mat.emissiveIntensity = 1.0;
                            } else if (mat.color && mat.color.getHex() < 0x111111) {
                                mat.color.setHex(0x555555);
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

            // Add soft shadow plane at the bottom of the model
            const planeGeo = new THREE.PlaneGeometry(targetSize * 5, targetSize * 5);
            const planeMat = new THREE.ShadowMaterial({ opacity: 0.15 });
            const plane = new THREE.Mesh(planeGeo, planeMat);
            plane.rotation.x = -Math.PI / 2;
            plane.position.y = model.position.y + scaledBox.min.y;
            plane.receiveShadow = true;
            scene.add(plane);

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

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
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

// Initialize when DOM is ready
function initAllProjects() {
    initProject3D('hill-project-container', 'hill-project-fallback', './assets/models/hill-project.glb', { exposure: 1.0 });
    initProject3D('commercial-complex-container', 'commercial-complex-fallback', './assets/models/commercial-complex.glb', { exposure: 1.0 });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllProjects);
} else {
    initAllProjects();
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function initHillProject3D() {
    const container = document.getElementById('hill-project-container');
    const fallback = document.getElementById('hill-project-fallback');
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
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Stronger ambient to fill shadows
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff5e6, 2.5); // Warm sun key light
    directionalLight.position.set(20, 40, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.bias = -0.001;
    directionalLight.shadow.normalBias = 0.02; // Improve shadow edge artifacts
    scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0xe0e8ff, 1.5); // Cool fill light
    fillLight.position.set(-20, 20, -20);
    scene.add(fillLight);
    
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.0); // Rim light for better separation
    rimLight.position.set(20, 10, -20);
    scene.add(rimLight);

    // Load Model
    const loader = new GLTFLoader();
    loader.load(
        './assets/models/hill-project.glb',
        (gltf) => {
            const model = gltf.scene;
            
            // Enable shadows on all meshes
            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    
                    // Optional: adjust material slightly for better architectural look
                    if (node.material) {
                        // Without an environment map (HDRI), highly metallic surfaces appear pitch black.
                        // Cap metalness to prevent dark spots while keeping the architectural look.
                        if (node.material.metalness !== undefined) {
                            node.material.metalness = Math.min(0.2, node.material.metalness);
                        }
                        if (node.material.roughness !== undefined) {
                            node.material.roughness = Math.max(0.5, node.material.roughness);
                        }
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
            console.error('Error loading Hill Project GLB:', error);
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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHillProject3D);
} else {
    initHillProject3D();
}

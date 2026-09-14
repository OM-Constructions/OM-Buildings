import * as THREE from 'three';
import { vertexShader, ringFragmentShader, basicFragmentShader, barsFragmentShader, mFragmentShader } from './shaders.js';

export class LogoSystem {
    constructor(scene) {
        this.scene = scene;
        this.sceneGroup = new THREE.Group();
        this.logoGroup = new THREE.Group();
        this.qGroup = new THREE.Group();
        this.mGroup = new THREE.Group();
        
        this.logoGroup.add(this.qGroup);
        this.logoGroup.add(this.mGroup);
        this.sceneGroup.add(this.logoGroup);
        this.scene.add(this.sceneGroup);
        
        this.materials = {};
        this.meshes = {};
    }

    async loadAssets() {
        const loader = new THREE.TextureLoader();
        
        const [ringTex, barsTex, mTex] = await Promise.all([
            loader.loadAsync('Ring.png'),
            loader.loadAsync('Bars.png'),
            loader.loadAsync('M.png')
        ]);
        
        [ringTex, barsTex, mTex].forEach(tex => {
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.colorSpace = THREE.SRGBColorSpace; 
        });

        this.buildLayout(ringTex, barsTex, mTex);
    }

    buildLayout(ringTex, barsTex, mTex) {
        // Base scale configuration
        // We will build the layout using a normalized base scale
        // where the Q Ring height is strictly 1000 units.
        const RING_BASE_HEIGHT = 1000;
        
        // 1. Ring (Q)
        const ringSize = { w: 1008, h: 1072 };
        const ringScale = RING_BASE_HEIGHT / ringSize.h;
        const ringW = ringSize.w * ringScale; 
        const ringH = RING_BASE_HEIGHT; 
        
        const ringGeo = new THREE.PlaneGeometry(ringW, ringH);
        this.materials.ring = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: ringFragmentShader,
            uniforms: {
                uTexture: { value: ringTex },
                uProgress: { value: 0.0 },
                uHoverIntensity: { value: 0.0 }
            },
            transparent: true,
            depthWrite: false
        });
        this.meshes.ring = new THREE.Mesh(ringGeo, this.materials.ring);
        
        // 2. Bars (Significantly larger, growing from bottom)
        const barsSize = { w: 880, h: 1188 };
        // The user requested bars to occupy ~65-75% of the inner hole height.
        // The inner hole is ~60.8% of the total Q height.
        // Therefore, Bars visible height = 0.65 * 0.608 = 0.3952 of Ring height.
        const targetBarsVisibleH = 0.3952 * ringH; 
        
        // The visible portion of Bars.png is 1045px out of 1188px (87.9%).
        // To get a visible height of 395.2, the full canvas height must be scaled up appropriately:
        const barsH = targetBarsVisibleH / (1045 / 1188); 
        
        // Maintain intrinsic aspect ratio
        const barsW = barsH * (barsSize.w / barsSize.h); 
        
        const barsGeo = new THREE.PlaneGeometry(barsW, barsH);
        // Translate origin to the exact visible gold baseline (5.38% padding at bottom)
        barsGeo.translate(0, 0.4462 * barsH, 0);
        
        this.materials.bars = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: barsFragmentShader,
            uniforms: {
                uTexture: { value: barsTex },
                uProgress: { value: 0.0 },
                uHoverIntensity: { value: 0.0 }
            },
            transparent: true,
            depthWrite: false
        });
        this.meshes.bars = new THREE.Mesh(barsGeo, this.materials.bars);
        
        // Position bars to grow from the lower portion of the inner Q
        // Inner hole bottom is roughly 122 units from the bottom of the canvas.
        // Anchoring at 16.2% from bottom places the base exactly 40 units above the inner curve.
        const ringBottomEdge = -ringH / 2;
        const barsYPosition = ringBottomEdge + (0.162 * ringH);
        this.meshes.bars.position.set(0, barsYPosition, 0.1); 
        
        this.qGroup.add(this.meshes.ring);
        this.qGroup.add(this.meshes.bars);
        
        // 3. M Letter
        const mSize = { w: 1065, h: 1008 };
        // The M visible height (850) should be roughly equal to Q visible height (893).
        // 893/1072 * 0.96 (for typographical harmony)
        const targetMVisibleH = (893 / 1072) * ringH * 0.96; 
        const mH = targetMVisibleH / (850 / 1008); 
        const mW = mH * (mSize.w / mSize.h); 
        
        const mGeo = new THREE.PlaneGeometry(mW, mH);
        this.materials.m = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: mFragmentShader,
            uniforms: {
                uTexture: { value: mTex },
                uOpacity: { value: 0.0 },
                uHighlight: { value: 0.0 },
                uHoverIntensity: { value: 0.0 }
            },
            transparent: true,
            depthWrite: false
        });
        this.meshes.m = new THREE.Mesh(mGeo, this.materials.m);
        this.mGroup.add(this.meshes.m);
        
        // 4. Assemble & Center
        // Calculate the exact visual bounds to align and center perfectly using visible ink, not transparent canvas
        const qVisibleRight = (956 - 504) / 1008 * ringW;
        const mVisibleLeft = (61 - 532.5) / 1065 * mW; 
        
        // Desired small visual gap: tightly kerned to ~22 units in our 1000px height space (approx 10px on desktop)
        const visualGap = 22;
        const mGroupX = qVisibleRight + visualGap - mVisibleLeft; 
        
        this.qGroup.position.x = 0;
        this.mGroup.position.x = mGroupX;
        
        // Calculate the total bounding box of the visible artwork
        const qVisibleLeft = (43 - 504) / 1008 * ringW;
        const mVisibleRight = (885 - 532.5) / 1065 * mW;
        
        const totalVisibleLeft = qVisibleLeft;
        const totalVisibleRight = mGroupX + mVisibleRight;
        const visibleCenterX = (totalVisibleLeft + totalVisibleRight) / 2;
        
        // Shift both groups so the unified logo's visible center is at X = 0
        this.qGroup.position.x -= visibleCenterX;
        this.mGroup.position.x -= visibleCenterX;
        
        // Vertical optical alignment based on visible ink centers
        const qVisibleCenterY = ( (1058 + 165)/2 - 536 ) / 1072 * ringH; 
        const mVisibleCenterY = ( (955 + 105)/2 - 504 ) / 1008 * mH; 
        
        // Offset M so its optical center aligns with Q's optical center
        this.mGroup.position.y = - (qVisibleCenterY - mVisibleCenterY);
        
        this.baseLogoWidth = totalVisibleRight - totalVisibleLeft;
        this.baseRingHeight = ringH; 
    }
    
    updateScale(screenWidth, screenHeight) {
        const padding = 40; 
        const availableWidth = screenWidth - padding * 2;
        
        // The logo should be approx 45% of viewport height.
        const targetRingHeight = screenHeight * 0.45;
        let scaleHeight = targetRingHeight / this.baseRingHeight;
        
        let scaleWidth = availableWidth / this.baseLogoWidth;
        
        // Use the smaller scale so it never exceeds screen bounds
        let scale = Math.min(scaleWidth, scaleHeight);
        this.baseScaleValue = scale;
        
        // Shift logo up by 5% of screen height to guarantee breathing room for text below.
        this.sceneGroup.position.y = screenHeight * 0.05; 
        
        // We do not set logoGroup.scale here if interaction is running, 
        // but for safety we set it to baseScaleValue (interaction will override it if active)
        this.logoGroup.scale.set(scale, scale, 1);
    }
}

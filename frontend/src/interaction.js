import * as THREE from 'three';

export class LogoInteraction {
    constructor(camera, logoSystem, renderer) {
        this.camera = camera;
        this.logoSystem = logoSystem;
        this.renderer = renderer;
        
        this.introComplete = false;
        this.isLogoHovered = false;
        this.currentScaleMultiplier = 1.0;
        
        this.logoScreenBounds = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        };
        
        const canvas = this.renderer.domElement;
        canvas.style.pointerEvents = 'auto';
        
        window.addEventListener('pointermove', this.onPointerMove.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));

        console.log("HOVER SYSTEM READY");
    }
    
    enable() {
        this.introComplete = true;
        this.updateLogoScreenBounds();
    }
    
    onWindowResize() {
        this.updateLogoScreenBounds();
    }
    
    updateLogoScreenBounds() {
        // Force a matrix world update to ensure bounds are accurate
        this.logoSystem.sceneGroup.updateMatrixWorld(true);

        // 1. Create Box3 and expand by the visible logo objects
        const box3 = new THREE.Box3().setFromObject(this.logoSystem.logoGroup);
        
        // 2. Convert 8 bounding-box corners from world to screen coordinates
        const corners = [
            new THREE.Vector3(box3.min.x, box3.min.y, box3.min.z),
            new THREE.Vector3(box3.min.x, box3.min.y, box3.max.z),
            new THREE.Vector3(box3.min.x, box3.max.y, box3.min.z),
            new THREE.Vector3(box3.min.x, box3.max.y, box3.max.z),
            new THREE.Vector3(box3.max.x, box3.min.y, box3.min.z),
            new THREE.Vector3(box3.max.x, box3.min.y, box3.max.z),
            new THREE.Vector3(box3.max.x, box3.max.y, box3.min.z),
            new THREE.Vector3(box3.max.x, box3.max.y, box3.max.z),
        ];

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        const rect = this.renderer.domElement.getBoundingClientRect();

        corners.forEach(corner => {
            // Project world coordinate to NDC (-1 to 1)
            corner.project(this.camera);
            
            // 3. Convert NDC (-1 to 1) to screen pixels relative to canvas
            const screenX = (corner.x * 0.5 + 0.5) * rect.width;
            const screenY = -(corner.y * 0.5 - 0.5) * rect.height; // Y is inverted in screen space
            
            if (screenX < minX) minX = screenX;
            if (screenX > maxX) maxX = screenX;
            if (screenY < minY) minY = screenY;
            if (screenY > maxY) maxY = screenY;
        });

        // 4. Add hover padding (30px to prevent flickering and feel generous)
        const padding = 30;
        
        this.logoScreenBounds = {
            left: minX - padding,
            right: maxX + padding,
            top: minY - padding,
            bottom: maxY + padding
        };

        console.log("LOGO BOUNDS:", this.logoScreenBounds);
    }
    
    isPointerInsideLogo(x, y) {
        return (
            x >= this.logoScreenBounds.left &&
            x <= this.logoScreenBounds.right &&
            y >= this.logoScreenBounds.top &&
            y <= this.logoScreenBounds.bottom
        );
    }

    onPointerMove(event) {
        if (!this.introComplete) return;

        // Ensure bounds are perfectly up to date based on current scale
        this.updateLogoScreenBounds();

        const rect = this.renderer.domElement.getBoundingClientRect();
        
        // Calculate pointer X/Y in browser pixels relative to canvas
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;

        // Check whether the pointer is inside logoScreenBounds
        const hovered = this.isPointerInsideLogo(pointerX, pointerY);

        if (hovered !== this.isLogoHovered) {
            this.isLogoHovered = hovered;
            
            console.log("LOGO HOVER:", this.isLogoHovered);
            
            if (this.isLogoHovered) {
                this.renderer.domElement.style.cursor = "pointer";
            } else {
                this.renderer.domElement.style.cursor = "default";
            }
        }
    }

    update() {
        if (!this.introComplete) return;
        
        // Smoothly interpolate the scale every frame
        const targetScaleMultiplier = this.isLogoHovered ? 1.08 : 1.0;
        
        if (Math.abs(this.currentScaleMultiplier - targetScaleMultiplier) > 0.001) {
            this.currentScaleMultiplier += (targetScaleMultiplier - this.currentScaleMultiplier) * 0.12;
            
            // The final scale MUST always be: baseScaleValue * currentScaleMultiplier
            if (this.logoSystem.baseScaleValue) {
                const finalScale = this.logoSystem.baseScaleValue * this.currentScaleMultiplier;
                
                this.logoSystem.logoGroup.scale.set(
                    finalScale,
                    finalScale,
                    1
                );
            }
        }
    }
}

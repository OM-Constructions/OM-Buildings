export const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const ringFragmentShader = `
uniform sampler2D uTexture;
uniform float uProgress;
uniform float uHoverIntensity;
varying vec2 vUv;

#define PI 3.14159265359

void main() {
    vec4 texColor = texture2D(uTexture, vUv);

    vec2 center = vec2(0.5, 0.43);
    vec2 dir = vUv - center;

    float angle = atan(dir.x, dir.y);
    if (angle < 0.0) {
        angle += 2.0 * PI;
    }

    // Offset so Top is exactly 0
    float offset = -16.0 * PI / 180.0;
    angle -= offset;
    
    if (angle < 0.0) angle += 2.0 * PI;
    if (angle >= 2.0 * PI) angle -= 2.0 * PI;

    float normalizedAngle = angle / (2.0 * PI);

    // BEND THE WIPE LINE (TWIST)
    // To make it look like a physical pen stroke rather than a rigid clock hand,
    // we warp the angle based on distance from the center.
    float dist = length(dir);
    float ringRadius = 0.35; // Approximate center of the ring thickness
    
    // Twist factor: pixels further out are drawn later, creating a swept-back curved line
    float twist = (dist - ringRadius) * 1.5;
    
    // Fade the twist near the 0 / 1 boundary so the top seam remains perfectly clean
    float seamDistance = min(normalizedAngle, 1.0 - normalizedAngle);
    float twistMask = smoothstep(0.0, 0.15, seamDistance);
    
    float finalAngle = normalizedAngle + (twist * twistMask);

    // Edge smoothing for anti-aliasing
    float edge = 0.03;
    float mask = 1.0 - smoothstep(uProgress, uProgress + edge, finalAngle);

    // PREMIUM LUMINOUS EDGE HIGHLIGHT
    // Creates the illusion of a subtle light source traveling at the reveal edge
    float highlightWidth = 0.08;
    float highlight = smoothstep(uProgress - highlightWidth, uProgress, finalAngle) * 
                      (1.0 - smoothstep(uProgress, uProgress + edge, finalAngle));
                      
    float isActive = step(0.001, uProgress) * step(uProgress, 1.049);
    vec3 glowColor = vec3(1.0, 0.9, 0.6); // Restrained warm gold
    
    // Additive blend the highlight onto the existing gold texture
    vec3 finalRgb = texColor.rgb + (glowColor * highlight * 2.0 * isActive * texColor.a);

    // Hard clamp at boundaries to avoid bleeding
    if (uProgress >= 1.049) mask = 1.0;
    if (uProgress <= 0.001) mask = 0.0;

    // Apply subtle hover brightness
    vec3 hoverBoost = vec3(0.1, 0.08, 0.05); // slight gold warmth
    finalRgb += hoverBoost * uHoverIntensity * texColor.a;

    gl_FragColor = vec4(finalRgb, texColor.a * mask);
}
`;

export const basicFragmentShader = `
uniform sampler2D uTexture;
uniform float uOpacity;
varying vec2 vUv;

void main() {
    vec4 texColor = texture2D(uTexture, vUv);
    gl_FragColor = vec4(texColor.rgb, texColor.a * uOpacity);
}
`;

export const barsFragmentShader = `
uniform sampler2D uTexture;
uniform float uProgress;
uniform float uHoverIntensity;
varying vec2 vUv;

void main() {
    vec4 texColor = texture2D(uTexture, vUv);
    
    // Subtle stagger: Center bar completes slightly later
    // vUv.x ranges 0 to 1. Center is 0.5.
    float stagger = (1.0 - 2.0 * abs(vUv.x - 0.5)) * 0.12; 
    
    // Remap uProgress so everything finishes by uProgress = 1.0
    // localProgress needs to reach 1.0 when uProgress is 1.0.
    float localProgress = clamp((uProgress * 1.12) - stagger, 0.0, 1.0);
    
    // Smooth vertical mask from bottom to top
    float mask = smoothstep(vUv.y - 0.02, vUv.y + 0.02, localProgress);
    
    // Apply subtle hover brightness
    vec3 hoverBoost = vec3(0.1, 0.08, 0.05);
    vec3 finalRgb = texColor.rgb + (hoverBoost * uHoverIntensity * texColor.a);
    
    gl_FragColor = vec4(finalRgb, texColor.a * mask);
}
`;

export const mFragmentShader = `
uniform sampler2D uTexture;
uniform float uOpacity;
uniform float uHighlight;
uniform float uHoverIntensity;
varying vec2 vUv;

void main() {
    vec4 texColor = texture2D(uTexture, vUv);
    
    // Diagonal glint sweeping across M
    float sweepPos = (vUv.x + vUv.y) * 0.5;
    
    // uHighlight goes 0 to 1, remap so it enters and exits cleanly
    float highlightCenter = uHighlight * 1.5 - 0.25;
    
    // Create a narrow soft band
    float dist = abs(sweepPos - highlightCenter);
    float highlightMask = 1.0 - smoothstep(0.0, 0.15, dist);
    
    // Only show highlight if active (to avoid clamping artifacts at 0 or 1)
    float isActive = step(0.001, uHighlight) * step(uHighlight, 0.999);
    
    vec3 glowColor = vec3(1.0, 0.9, 0.6); // Refined warm gold
    vec3 finalRgb = texColor.rgb + (glowColor * highlightMask * 1.8 * isActive * texColor.a);
    
    // Apply subtle hover brightness
    vec3 hoverBoost = vec3(0.1, 0.08, 0.05);
    finalRgb += hoverBoost * uHoverIntensity * texColor.a;
    
    gl_FragColor = vec4(finalRgb, texColor.a * uOpacity);
}
`;

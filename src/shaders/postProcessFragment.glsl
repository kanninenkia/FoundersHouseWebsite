// Post-Process Fragment Shader
// Applies pencil-sketch effect to rendered 3D scene

precision highp float;

uniform sampler2D tDiffuse;           // Rendered scene
uniform sampler2D uPerlinTexture;     // Perlin noise
uniform sampler2D uPaperTexture;      // Paper grain (optional)
uniform vec3 uPencilColor;
uniform vec3 uPaperColor;
uniform vec3 uBottomFogColor;         // Fog color for bottom vignette
uniform float uTime;
uniform float uPencilStrength;        // 0-1 effect intensity
uniform vec2 uResolution;

varying vec2 vUv;

// Edge detection for pencil strokes
float getEdgeStrength(sampler2D tex, vec2 uv, vec2 resolution) {
  vec2 texel = 1.0 / resolution;

  // Sobel operator for edge detection
  float tl = length(texture2D(tex, uv + vec2(-texel.x, texel.y)).rgb);
  float t  = length(texture2D(tex, uv + vec2(0.0, texel.y)).rgb);
  float tr = length(texture2D(tex, uv + vec2(texel.x, texel.y)).rgb);
  float l  = length(texture2D(tex, uv + vec2(-texel.x, 0.0)).rgb);
  float r  = length(texture2D(tex, uv + vec2(texel.x, 0.0)).rgb);
  float bl = length(texture2D(tex, uv + vec2(-texel.x, -texel.y)).rgb);
  float b  = length(texture2D(tex, uv + vec2(0.0, -texel.y)).rgb);
  float br = length(texture2D(tex, uv + vec2(texel.x, -texel.y)).rgb);

  float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
  float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;

  return length(vec2(gx, gy));
}

// Random2D function
float random2d(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Gaussian blur for depth of field effect
vec4 gaussianBlur(sampler2D tex, vec2 uv, vec2 resolution, float blurAmount) {
  vec2 texel = 1.0 / resolution;
  vec4 sum = vec4(0.0);
  float totalWeight = 0.0;
  
  // 9-tap Gaussian blur
  float weights[9];
  weights[0] = 0.05; weights[1] = 0.09; weights[2] = 0.12;
  weights[3] = 0.09; weights[4] = 0.16; weights[5] = 0.09;
  weights[6] = 0.12; weights[7] = 0.09; weights[8] = 0.05;
  
  int index = 0;
  for(int y = -1; y <= 1; y++) {
    for(int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y)) * texel * blurAmount;
      sum += texture2D(tex, uv + offset) * weights[index];
      totalWeight += weights[index];
      index++;
    }
  }
  
  return sum / totalWeight;
}

void main() {
  // Calculate vertical position for fog gradient
  float verticalPos = vUv.y;

  // Calculate bottom fog gradient (extends higher up the screen)
  // 0.0 at bottom (full fog) -> 1.0 at 50% height (no fog)
  float fogFactor = smoothstep(0.0, 0.5, verticalPos);

  // Sample original scene (no blur)
  vec4 sceneColor = texture2D(tDiffuse, vUv);

  // Detect edges
  float edgeStrength = getEdgeStrength(tDiffuse, vUv, uResolution);
  edgeStrength = smoothstep(0.05, 0.15, edgeStrength);

  // Start with clean scene color
  vec3 finalColor = sceneColor.rgb;

  // Apply bottom fog gradient (reversed fog from bottom up)
  // More fog at bottom, fades to clear at quarter height
  finalColor = mix(uBottomFogColor, finalColor, fogFactor);

  gl_FragColor = vec4(finalColor, 1.0);
}

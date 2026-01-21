// Post-Process Fragment Shader
// Simple pass-through with clean rendering

precision highp float;

uniform sampler2D tDiffuse;

varying vec2 vUv;

void main() {
  vec4 sceneColor = texture2D(tDiffuse, vUv);
  gl_FragColor = vec4(sceneColor.rgb, 1.0);
}

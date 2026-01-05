import * as THREE from 'three'
import postProcessVertexShader from '../shaders/postProcessVertex.glsl?raw'
import postProcessFragmentShader from '../shaders/postProcessFragment.glsl?raw'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { COLORS } from '../constants/designSystem'

export function setupPostProcessing(renderTarget: THREE.WebGLRenderTarget, perlinTexture: THREE.DataTexture) {
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const material = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: renderTarget.texture },
      uPerlinTexture: { value: perlinTexture },
      uPaperTexture: { value: null },
      uPencilColor: { value: new THREE.Color(COLORS.chartogne.black) },
      uPaperColor: { value: new THREE.Color(COLORS.chartogne.creamBg) },
      uBottomFogColor: { value: new THREE.Color(COLORS.day.sky) },
      uTime: { value: 0 },
      uPencilStrength: { value: 1.0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio) },
    },
    vertexShader: postProcessVertexShader,
    fragmentShader: postProcessFragmentShader,
  })

  const geometry = new THREE.PlaneGeometry(2, 2)
  const quad = new THREE.Mesh(geometry, material)
  scene.add(quad)

  return { scene, camera, material }
}

export function setupComposer(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, postProcessMaterial: THREE.ShaderMaterial) {
  try {
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    // DISABLED: Bloom effect (removed white glow)
    // const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.2, 0.95)
    // bloomPass.threshold = 0.95
    // bloomPass.strength = 0.3
    // bloomPass.radius = 0.2
    // composer.addPass(bloomPass)

    const shaderPass = new (ShaderPass as any)(postProcessMaterial as any)
    shaderPass.renderToScreen = true
    composer.addPass(shaderPass)

    // Warm up the composer by rendering once (compiles all post-processing shaders)
    try {
      composer.render()
    } catch (e) {
      // Ignore errors during warmup
    }

    return { composer, bloomPass: null }
  } catch (err) {
    return { composer: null, bloomPass: null }
  }
}

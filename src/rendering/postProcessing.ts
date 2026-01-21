import * as THREE from 'three'
import postProcessVertexShader from '../shaders/postProcessVertex.glsl?raw'
import postProcessFragmentShader from '../shaders/postProcessFragment.glsl?raw'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { COLORS } from '../constants/designSystem'

export function setupPostProcessing(renderTarget: THREE.WebGLRenderTarget, perlinTexture: THREE.DataTexture) {
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const material = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: renderTarget.texture },
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

    const shaderPass = new (ShaderPass as any)(postProcessMaterial as any)
    shaderPass.renderToScreen = true
    composer.addPass(shaderPass)

    try {
      composer.render()
    } catch (e) {}

    return { composer, bloomPass: null }
  } catch (err) {
    return { composer: null, bloomPass: null }
  }
}

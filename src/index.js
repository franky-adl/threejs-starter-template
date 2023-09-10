// ThreeJS and Third-party deps
import * as THREE from "three"
import * as dat from 'dat.gui'
import Stats from "three/examples/jsm/libs/stats.module"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper"
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib"
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass"

// Core boilerplate code deps
import { createCamera, createComposer, createRenderer, runApp, updateLoadingProgressBar, getDefaultUniforms } from "./core-utils"

// Other deps
import Tile from './assets/checker_tile.png'
import { loadTexture } from "./common-utils"

global.THREE = THREE
// previously this feature is .legacyMode = false, see https://www.donmccurdy.com/2020/06/17/color-management-in-threejs/
// turning this on has the benefit of doing certain automatic conversions (for hexadecimal and CSS colors from sRGB to linear-sRGB)
THREE.ColorManagement.enabled = true

/**************************************************
 * 0. Tweakable parameters for the scene
 *************************************************/
const params = {
  // general scene params
  speed: 1,
  lightOneSwitch: true,
  lightTwoSwitch: true,
  lightThreeSwitch: true,
  // Bokeh pass properties
  focus: 0.0,
  aperture: 0.0,
  maxblur: 0.0
}
const uniforms = {
  ...getDefaultUniforms(),
}


/**************************************************
 * 1. Initialize core threejs components
 *************************************************/
// Create the scene
let scene = new THREE.Scene()

// Create the renderer via 'createRenderer',
// 1st param receives additional WebGLRenderer properties
// 2nd param receives a custom callback to further configure the renderer
let renderer = createRenderer({ antialias: true }, (_renderer) => {
  // best practice: ensure output colorspace is in sRGB, see Color Management documentation:
  // https://threejs.org/docs/#manual/en/introduction/Color-management
  _renderer.outputColorSpace = THREE.SRGBColorSpace
})

// Create the camera
// Pass in fov, near, far and camera position respectively
let camera = createCamera(45, 1, 1000, { x: 0, y: 5, z: 15 })

// (Optional) Create the EffectComposer and passes for post-processing
// If you don't need post-processing, just comment/delete the following creation code, and skip passing any composer to 'runApp' at the bottom
let bokehPass = new BokehPass(scene, camera, {
  focus: params.focus,
  aperture: params.aperture,
  maxblur: params.maxblur
})
// The RenderPass is already created in 'createComposer'
let composer = createComposer(renderer, scene, camera, (comp) => {
  comp.addPass(bokehPass)
})

/**************************************************
 * 2. Build your scene in this threejs app
 * This app object needs to consist of at least the async initScene() function (it is async so the animate function can wait for initScene() to finish before being called)
 * initScene() is called after a basic threejs environment has been set up, you can add objects/lighting to you scene in initScene()
 * if your app needs to animate things(i.e. not static), include a updateScene(interval, elapsed) function in the app as well
 *************************************************/
let app = {
  async initScene() {
    // OrbitControls
    this.controls = new OrbitControls(camera, renderer.domElement)
    this.controls.enableDamping = true

    // Scene setup taken from https://threejs.org/examples/#webgl_lights_rectarealight
    // Create rect area lights
    RectAreaLightUniformsLib.init()

    await updateLoadingProgressBar(0.1)

    let rectLight1 = new THREE.RectAreaLight(0xff0000, 5, 4, 10)
    rectLight1.position.set( -5, 5, -5)
    rectLight1.lookAt( -5, 5, 0 )
    scene.add(rectLight1)

    let rectLight2 = new THREE.RectAreaLight(0x00ff00, 5, 4, 10)
    rectLight2.position.set(0, 5, -5)
    rectLight2.lookAt( 0, 5, 0 )
    scene.add(rectLight2)

    let rectLight3 = new THREE.RectAreaLight(0x0000ff, 5, 4, 10)
    rectLight3.position.set(5, 5, -5)
    rectLight3.lookAt( 5, 5, 0 )
    scene.add(rectLight3)

    scene.add(new RectAreaLightHelper(rectLight1))
    scene.add(new RectAreaLightHelper(rectLight2))
    scene.add(new RectAreaLightHelper(rectLight3))

    // Create the floor
    const tex = await loadTexture(Tile)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(40,40)
    const geoFloor = new THREE.BoxGeometry(200, 0.1, 200)
    const matStdFloor = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.5,
      metalness: 0,
      map: tex
    })
    const mshStdFloor = new THREE.Mesh(geoFloor, matStdFloor)
    scene.add(mshStdFloor)

    await updateLoadingProgressBar(0.5)

    // Create the torus knot
    const geoKnot = new THREE.TorusKnotGeometry(1.5, 0.5, 200, 16)
    const matKnot = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0, metalness: 0 })
    // save mesh to 'this' so that we can access it in the 'updateScene' function
    this.meshKnot = new THREE.Mesh(geoKnot, matKnot)
    this.meshKnot.position.set(0, 5, 0)
    // update orbit controls to target meshKnot at center
    this.controls.target.copy(this.meshKnot.position)
    scene.add(this.meshKnot)

    // GUI controls
    const gui = new dat.GUI()

    gui.add(params, "speed", 1, 10, 0.5)
    gui.add(params, "lightOneSwitch").name('Red light').onChange((val) => {
      rectLight1.intensity = val ? 5 : 0
    })
    gui.add(params, "lightTwoSwitch").name('Green light').onChange((val) => {
      rectLight2.intensity = val ? 5 : 0
    })
    gui.add(params, "lightThreeSwitch").name('Blue light').onChange((val) => {
      rectLight3.intensity = val ? 5 : 0
    })

    const matChanger = () => {
      bokehPass.uniforms['focus'].value = params.focus
      bokehPass.uniforms['aperture'].value = params.aperture * 0.00001
      bokehPass.uniforms['maxblur'].value = params.maxblur
    }

    let bokehFolder = gui.addFolder(`Bokeh Pass`)
    bokehFolder.add(params, 'focus', 0.0, 3000.0, 10).onChange(matChanger)
    bokehFolder.add(params, 'aperture', 0, 10, 0.1).onChange(matChanger)
    bokehFolder.add(params, 'maxblur', 0.0, 0.01, 0.001).onChange(matChanger)

    // Stats - show fps
    this.stats1 = new Stats()
    this.stats1.showPanel(0) // Panel 0 = fps
    this.stats1.domElement.style.cssText = "position:absolute;top:0px;left:0px;"
    // this.container is the parent DOM element of the threejs canvas element
    this.container.appendChild(this.stats1.domElement)

    await updateLoadingProgressBar(1.0, 100)
  },
  // @param {number} interval - time elapsed between 2 frames
  // @param {number} elapsed - total time elapsed since app start
  updateScene(interval, elapsed) {
    this.controls.update()
    this.stats1.update()

    // rotate the torus
    this.meshKnot.rotation.y = elapsed * params.speed
  }
}

/**************************************************
 * 3. Run the app
 * 'runApp' will do most of the boilerplate setup code for you:
 * e.g. HTML container, window resize listener, mouse move/touch listener for shader uniforms, THREE.Clock() for animation
 * Executing this line puts everything together and runs the app
 * ps. if you don't use custom shaders, pass undefined to the 'uniforms'(2nd-last) param
 * ps. if you don't use post-processing, pass undefined to the 'composer'(last) param
 *************************************************/
runApp(app, scene, renderer, camera, true, uniforms, composer)

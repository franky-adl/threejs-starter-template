// ThreeJS and Third-party deps
import * as THREE from 'three';
import * as dat from 'dat.gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';

import toonVertexShader from './toon.vert';
import toonFragmentShader from './toon.frag';

// Core boilerplate code deps
import {
  createCamera,
  createComposer,
  createRenderer,
  runApp,
} from './core-utils';

// Other deps
import Tile from './assets/checker_tile.png';

global.THREE = THREE;
// previously this feature is .legacyMode = false, see https://www.donmccurdy.com/2020/06/17/color-management-in-threejs/
// turning this on has the benefit of doing certain automatic conversions (for hexadecimal and CSS colors from sRGB to linear-sRGB)
THREE.ColorManagement.enabled = true;

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
  aperture: 0,
  maxblur: 0.0,
};

/**************************************************
 * 1. Initialize core threejs components
 *************************************************/
// Create the scene
let scene = new THREE.Scene();

// Create the renderer via 'createRenderer',
// 1st param receives additional WebGLRenderer properties
// 2nd param receives a custom callback to further configure the renderer
let renderer = createRenderer({ antialias: true }, (_renderer) => {
  // best practice: ensure output colorspace is in sRGB, see Color Management documentation:
  // https://threejs.org/docs/#manual/en/introduction/Color-management
  _renderer.outputEncoding = THREE.sRGBEncoding;
});

// Create the camera
// Pass in fov, near, far and camera position respectively
let camera = createCamera(45, 1, 1000, { x: 0, y: 5, z: 15 });

// The RenderPass is already created in 'createComposer'
let composer = createComposer(renderer, scene, camera, (comp) => {
  // comp.addPass(bokehPass);
});

/**************************************************
 * 2. Build your scene in this threejs app
 * This app object needs to consist of at least the async initScene() function (it is async so the animate function can wait for initScene() to finish before being called)
 * initScene() is called after a basic threejs environment has been set up, you can add objects/lighting to you scene in initScene()
 * if your app needs to animate things(i.e. not static), include a updateScene(interval, elapsed) function in the app as well
 *************************************************/
let app = {
  async initScene() {
    // OrbitControls
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;

    // Scene setup taken from https://threejs.org/examples/#webgl_lights_rectarealight
    // Create rect area lights
    RectAreaLightUniformsLib.init();

    let rectLight1 = new THREE.RectAreaLight(0xff0000, 5, 4, 10);
    rectLight1.position.set(-5, 5, -5);
    rectLight1.lookAt(-5, 5, 0);
    scene.add(rectLight1);

    let rectLight2 = new THREE.RectAreaLight(0x00ff00, 5, 4, 10);
    rectLight2.position.set(0, 5, -5);
    rectLight2.lookAt(0, 5, 0);
    scene.add(rectLight2);

    let rectLight3 = new THREE.RectAreaLight(0x0000ff, 5, 4, 10);
    rectLight3.position.set(5, 5, -5);
    rectLight3.lookAt(5, 5, 0);
    scene.add(rectLight3);

    scene.add(new RectAreaLightHelper(rectLight1));
    scene.add(new RectAreaLightHelper(rectLight2));
    scene.add(new RectAreaLightHelper(rectLight3));

    // Create the floor
    const geoFloor = new THREE.BoxGeometry(200, 0.1, 200);
    const matStdFloor = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.5,
      metalness: 0,
    });
    const mshStdFloor = new THREE.Mesh(geoFloor, matStdFloor);
    // need await to make sure animation starts only after texture is loaded
    // this works because the animation code is 'then-chained' after initScene(), see core-utils.runApp
    await this.loadTexture(mshStdFloor);
    scene.add(mshStdFloor);

    scene.add(new THREE.AmbientLight(0x888888));

    // the sphere stuff!
    // i discovered a "meshtoonmaterial" that should be built in and looks really good
    // but i can't seem to implement it LOL
    // and i also can't seem to find anything interesting in its source code
    // see here for the articles and source codes respectively
    // https://threejs.org/docs/#api/en/materials/MeshToonMaterial
    // https://threejs.org/examples/#webgl_materials_variations_toon
    // https://github.com/mrdoob/three.js/blob/master/src/materials/MeshToonMaterial.js
    // https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_variations_toon.html

    var geo = new THREE.SphereGeometry(2, 24, 24);
    var material = new THREE.ShaderMaterial({
      lights: true,
      flatShading: true,
      uniforms: {
        ...THREE.UniformsLib.lights,
        uColor: { value: new THREE.Color('#6495ED') },
      },
      // adding the custom shader stuff connected to toon.vert and toon.frag
      vertexShader: toonVertexShader,
      fragmentShader: toonFragmentShader,
    });
    var sphere = new THREE.Mesh(geo, material);
    scene.add(sphere);
    sphere.position.y = sphere.geometry.parameters.radius;

    // GUI controls
    const gui = new dat.GUI();

    gui.add(params, 'speed', 1, 10, 0.5);
    // gui
    //   .add(params, 'lightOneSwitch')
    //   .name('Red light')
    //   .onChange((val) => {
    //     rectLight1.intensity = val ? 5 : 0;
    //   });
    // gui
    //   .add(params, 'lightTwoSwitch')
    //   .name('Green light')
    //   .onChange((val) => {
    //     rectLight2.intensity = val ? 5 : 0;
    //   });
    // gui
    //   .add(params, 'lightThreeSwitch')
    //   .name('Blue light')
    //   .onChange((val) => {
    //     rectLight3.intensity = val ? 5 : 0;
    //   });

    // Stats - show fps
    this.stats1 = new Stats();
    this.stats1.showPanel(0); // Panel 0 = fps
    this.stats1.domElement.style.cssText =
      'position:absolute;top:0px;left:0px;';
    // this.container is the parent DOM element of the threejs canvas element
    this.container.appendChild(this.stats1.domElement);
  },
  // load a texture for the floor
  // returns a promise so the caller can await on this function
  loadTexture(mshStdFloor) {
    return new Promise((resolve, reject) => {
      var loader = new THREE.TextureLoader();
      loader.load(
        Tile,
        function (texture) {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(40, 40);
          mshStdFloor.material.map = texture;
          resolve();
        },
        undefined,
        function (error) {
          console.log(error);
          reject(error);
        }
      );
    });
  },
};

/**************************************************
 * 3. Run the app
 * 'runApp' will do most of the boilerplate setup code for you:
 * e.g. HTML container, window resize listener, mouse move/touch listener for shader uniforms, THREE.Clock() for animation
 * Executing this line puts everything together and runs the app
 * ps. if you don't use custom shaders, pass undefined to the 'uniforms'(2nd-last) param
 * ps. if you don't use post-processing, pass undefined to the 'composer'(last) param
 *************************************************/
runApp(app, scene, renderer, camera, true, undefined, composer);

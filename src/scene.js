import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {blendOverview, createOverviewCamera, fitOverview} from './overview.js';

const vector = xyz => new T.Vector3(...xyz);
const homeEye = vector([-114, 85, -2116]);
const homeTarget = vector([-154, 16, -2285]);
const axis = vector([-166, 0, -2280]);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export async function createScene(canvas, onView, onProgress, onFailure, overviewInsets, onCameraChange) {
  const renderer = new T.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new T.Scene();
  scene.background = new T.Color(0xbdaf99);
  scene.fog = new T.FogExp2(0xc2b8a1, 0.00105);
  const camera = new T.PerspectiveCamera(46, 1, 1, 9500);
  const mapCamera = createOverviewCamera();
  const movingCamera = camera.clone();
  let overviewActive = false;
  let mapProgress = 0, lastMapFrame = 0;
  camera.position.copy(homeEye);
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(homeTarget);
  controls.enableDamping = true;
  controls.dampingFactor = 0.14;
  controls.minDistance = 35;
  controls.maxDistance = 2450;
  controls.minPolarAngle = 0.09;
  controls.maxPolarAngle = Math.PI * 0.465;
  controls.screenSpacePanning = false;
  controls.rotateSpeed = 0.62;
  controls.zoomSpeed = 0.9;
  controls.enabled = false;
  controls.update();

  scene.add(new T.HemisphereLight(0xfff3df, 0xe8d7c5, 1.72));
  const sunlight = new T.DirectionalLight(0xffdfac, 2.3);
  sunlight.position.set(190, 600, -1700);
  sunlight.target.position.copy(axis);
  sunlight.castShadow = true;
  Object.assign(
      sunlight.shadow.camera, {left: -650, right: 650, top: 740, bottom: -740, near: 20, far: 1800});
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.normalBias = 0.18;
  sunlight.shadow.bias = -0.0002;
  scene.add(sunlight, sunlight.target);
  const ground =
      new T.Mesh(new T.PlaneGeometry(15000, 15000), new T.MeshLambertMaterial({color: 0x999781}));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(-166, -5.2, -2250);
  ground.receiveShadow = true;
  scene.add(ground);

  // A directional sky keeps the horizon continuous as visitors orbit the model.
  const sky = new T.Mesh(new T.SphereGeometry(7500, 24, 12), new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    vertexShader:
        'varying vec3 dir; void main(){dir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 dir;
    void main(){
      vec3 n=normalize(dir);
      float h=smoothstep(-.01,.27,n.y);
      vec3 c=mix(vec3(.54,.48,.37),vec3(.12,.24,.30),h);
      c+=vec3(.13,.09,.04)*pow(max(dot(n,normalize(vec3(-.55,.15,-.82))),0.),14.);
      gl_FragColor=vec4(c,1.);
      #include <colorspace_fragment>
    }`
  }));
  sky.position.copy(axis);
  scene.add(sky);

  let resourceError = '';
  const manager = new T.LoadingManager();
  manager.onError = url => {
    resourceError = url.split('/').pop();
  };
  manager.onProgress = (_url, done, total) => onProgress(done, total);
  try {
    const gltf = await new GLTFLoader(manager).loadAsync('./forbidden_city.glb');
    if (resourceError)
      throw Error('未能读取 ' + resourceError);
    gltf.scene.traverse(obj => {
      if (!obj.isMesh)
        return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.material.metalness = 0;
      obj.material.roughness = 1;
      // The atlases include painted light and shade. Retain their colour on backlit eaves.
      if (obj.material.map) {
        obj.material.emissive.set(0xffffff);
        obj.material.emissiveMap = obj.material.map;
        obj.material.emissiveIntensity = 0.23;
      }
      if (obj.material.map)
        obj.material.map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      if (obj.material.transparent) {
        obj.material.alphaTest = 0.42;
        obj.material.transparent = false;
        obj.material.depthWrite = true;
      }
    });
    scene.add(gltf.scene);
  } catch (error) {
    renderer.dispose();
    controls.dispose();
    throw error;
  }

  let frame = 0;
  let flight = null;
  let dirty = true;
  let exploring = false;
  let lost = false;

  function requestFrame() {
    dirty = true;
    if (!frame && !document.hidden && !lost)
      frame = requestAnimationFrame(draw);
  }
  function draw(now) {
    frame = 0;
    const destination = Number(overviewActive);
    if (mapProgress !== destination) {
      const step = Math.max(0, now - lastMapFrame) / 850;
      mapProgress = reduced() ? destination : overviewActive ? Math.min(1, mapProgress + step) : Math.max(0, mapProgress - step);
      lastMapFrame = now;
    }
    const moving = mapProgress > 0 && mapProgress < 1;
    controls.enabled = exploring && !overviewActive && !moving;
    const animation = flight;
    if (animation) {
      const t = Math.min(1, (now - animation.start) / animation.duration);
      const eased = t * t * (3 - 2 * t);
      camera.position.lerpVectors(animation.fromEye, animation.eye, eased);
      controls.target.lerpVectors(animation.fromTarget, animation.target, eased);
      camera.position.y += Math.sin(Math.PI * t) * animation.lift;
      if (t === 1)
        flight = null;
    }
    controls.target.x = T.MathUtils.clamp(controls.target.x, -675, 320);
    controls.target.z = T.MathUtils.clamp(controls.target.z, -3500, -900);
    controls.target.y = T.MathUtils.clamp(controls.target.y, 0, 70);
    const changed = (!mapProgress || animation) && controls.update();
    if (dirty || changed || animation) {
      dirty = false;
      const t = mapProgress * mapProgress * (3 - 2 * mapProgress);
      if (moving) blendOverview(movingCamera, camera, controls.target, mapCamera, t);
      const activeCamera = moving ? movingCamera : mapProgress === 1 ? mapCamera : camera;
      const distance = camera.position.distanceTo(controls.target) * (1 - t) + mapCamera.position.y * t;
      scene.fog.density = (1 - t) * 0.00105 * Math.min(1, 310 / distance);
      renderer.render(scene, activeCamera);
      onView(activeCamera, (1 - t) * controls.getAzimuthalAngle(), distance, mapProgress !== destination);
    }
    if (animation && !flight)
      animation.arrive?.();
    if (changed || flight || mapProgress !== destination)
      requestFrame();
  }

  function resize() {
    onCameraChange();
    camera.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    if (overviewActive || mapProgress > 0) fitMap();
    requestFrame();
  }
  function fitMap() {
    const {top, bottom} = overviewInsets();
    const room = fitOverview(mapCamera, canvas.clientWidth, canvas.clientHeight, top, bottom);
    canvas.parentElement.style.setProperty('--map-side-room', room + 'px');
    canvas.parentElement.classList.toggle('compact-map', room < 220 || canvas.clientHeight < 540);
  }
  function travel(eye, target, ms, lift = 0, arrive) {
    // Drain any residual orbit damping before recording the next camera path.
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = true;
    controls.enabled = exploring && !mapProgress && !overviewActive;
    flight = null;
    if (reduced() || ms === 0) {
      camera.position.copy(eye);
      controls.target.copy(target);
      controls.update();
      requestFrame();
      arrive?.();
      return;
    }
    flight = {
      fromEye: camera.position.clone(),
      fromTarget: controls.target.clone(),
      eye,
      target,
      duration: ms,
      lift,
      arrive,
      start: performance.now()
    };
    requestFrame();
  }

  controls.addEventListener('change', () => {
    onCameraChange();
    requestFrame();
  });
  controls.addEventListener('start', () => {
    flight = null;
  });
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    onFailure('三维画面已中断，请重新载入。');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else
      requestFrame();
  });
  new ResizeObserver(resize).observe(canvas);
  resize();
  return {
    intro() {
      exploring = false;
      camera.position.set(-250, 335, -1540);
      controls.target.set(-160, 7, -2020);
      travel(homeEye, homeTarget, 4200, 15);
    },
    enter() {
      exploring = true;
      travel(homeEye, homeTarget, 0);
    },
    cancel() {
      flight = null;
    },
    focus(place, arrive) {
      const target = vector(place.target ?? place.anchor);
      if (!place.target && !place.parentId) target.y *= .40;
      const eye = target.clone().add(vector(place.offset));
      travel(eye, target, 950, place.parentId ? 5 : 18, arrive);
    },
    overview(active) {
      flight = null;
      overviewActive = active;
      lastMapFrame = performance.now();
      controls.enabled = false;
      if (active) {
        // Discard any pending damping without moving the saved free view.
        const eye = camera.position.clone(), target = controls.target.clone();
        controls.enableDamping = false;
        controls.update();
        camera.position.copy(eye);
        controls.target.copy(target);
        controls.update();
        controls.enableDamping = true;
        fitMap();
      }
      requestFrame();
    },
    zoom(factor) {
      const diff = camera.position.clone().sub(controls.target);
      diff.setLength(
          T.MathUtils.clamp(diff.length() * factor, controls.minDistance, controls.maxDistance));
      travel(controls.target.clone().add(diff), controls.target.clone(), 190);
    },
    refresh: requestFrame
  };
}

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// ============================================================
// DOM references
// ============================================================
const gamedemoSection = document.getElementById('gamedemo');
const canvas = document.getElementById('gameCanvas');
const scoreEl = document.getElementById('gameScore');
const startOverlay = document.getElementById('gameStartOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreEl = document.getElementById('gameFinalScore');
const startBtn = document.getElementById('gameStartBtn');
const retryBtn = document.getElementById('gameRetryBtn');
const exitBtn = document.getElementById('gameExitBtn');
const gameNavLink = document.getElementById('gameNavLink');

// ============================================================
// Constants
// ============================================================
const LANES = [-3.2, 0, 3.2];
const SEG_LENGTH = 20;
const SEG_COUNT = 16;
const TRACK_LENGTH = SEG_LENGTH * SEG_COUNT;
const OBSTACLE_COUNT = 6;
const DECOR_COUNT = 18;
const BASE_SPEED = 16;      // units/sec
const MAX_SPEED = 34;
const SPEED_RAMP = 0.15;    // speed gained per second

// ============================================================
// Device detection (used to trim visual/perf cost on phones)
// ============================================================
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) <= 700;
const isMobile = isCoarsePointer || isSmallScreen;

// ============================================================
// Scene / renderer / camera
// ============================================================
let renderer, scene, camera, sunLight;
let car, carLaneIndex = 1, carTargetX = LANES[1];
let obstacles = [];
let decorations = [];
let clock = new THREE.Clock();

let state = 'idle'; // idle | playing | gameover
let speed = BASE_SPEED;
let distance = 0;

function initScene() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  if (isMobile) renderer.shadowMap.type = THREE.BasicShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fdcff);
  scene.fog = new THREE.Fog(0x9fdcff, 30, 90);

  camera = new THREE.PerspectiveCamera(62, 1, 0.1, 200);
  camera.position.set(0, 6, 11);
  camera.lookAt(0, 1, -10);

  // Lights — bright, flat, toy-like
  const hemi = new THREE.HemisphereLight(0xffffff, 0x5a8a4a, 0.9);
  scene.add(hemi);

  sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
  sunLight.position.set(-8, 14, 6);
  sunLight.castShadow = true;
  const shadowRes = isMobile ? 512 : 1024;
  sunLight.shadow.mapSize.set(shadowRes, shadowRes);
  sunLight.shadow.camera.left = -20;
  sunLight.shadow.camera.right = 20;
  sunLight.shadow.camera.top = 20;
  sunLight.shadow.camera.bottom = -20;
  scene.add(sunLight);

  buildTrack();
  buildCar();
  buildObstaclePool();
  buildDecorPool();

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 200));
  onResize();
}

function onResize() {
  const w = gamedemoSection.clientWidth || window.innerWidth;
  const h = gamedemoSection.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);

  const aspect = w / h;

  // Narrow/portrait viewports need a wider FOV and a camera pulled further
  // back so the full road width stays in frame instead of feeling zoomed in.
  if (aspect < 0.7) {
    camera.fov = 86;
    camera.position.set(0, 7.5, 8.5);
  } else if (aspect < 1.05) {
    camera.fov = 76;
    camera.position.set(0, 7, 9.5);
  } else {
    camera.fov = 62;
    camera.position.set(0, 6, 11);
  }

  camera.aspect = aspect;
  camera.updateProjectionMatrix();
}

// ============================================================
// Track: recycled road + grass segments
// ============================================================
const trackSegments = [];

function buildTrack() {
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x3d4148, roughness: 0.9 });
  const grassMatA = new THREE.MeshStandardMaterial({ color: 0x7bc95a, roughness: 1 });
  const grassMatB = new THREE.MeshStandardMaterial({ color: 0x6fbf4e, roughness: 1 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });

  for (let i = 0; i < SEG_COUNT; i++) {
    const group = new THREE.Group();

    const road = new THREE.Mesh(new THREE.BoxGeometry(9, 0.4, SEG_LENGTH), roadMat);
    road.position.y = -0.2;
    road.receiveShadow = true;
    group.add(road);

    const grassL = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, SEG_LENGTH), i % 2 ? grassMatA : grassMatB);
    grassL.position.set(-11.5, -0.25, 0);
    grassL.receiveShadow = true;
    group.add(grassL);

    const grassR = grassL.clone();
    grassR.position.x = 11.5;
    group.add(grassR);

    // lane divider dashes
    for (const x of [-1.6, 1.6]) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.42, SEG_LENGTH * 0.5), lineMat);
      dash.position.set(x, -0.19, 0);
      group.add(dash);
    }

    group.position.z = -i * SEG_LENGTH;
    scene.add(group);
    trackSegments.push(group);
  }
}

function updateTrack(delta) {
  const move = speed * delta;
  for (const seg of trackSegments) {
    seg.position.z += move;
    if (seg.position.z > SEG_LENGTH) {
      seg.position.z -= TRACK_LENGTH;
    }
  }
}

// ============================================================
// Car: simple low-poly blocks
// ============================================================
function buildCar() {
  car = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff5a3c, roughness: 0.5, metalness: 0.1 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xffe27a, roughness: 0.4 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x232323, roughness: 0.9 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 3.2), bodyMat);
  body.position.y = 0.5;
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 1.6), cabinMat);
  cabin.position.set(0, 1.05, -0.1);
  cabin.castShadow = true;
  car.add(cabin);

  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.4, 12);
  const wheelPositions = [
    [-0.95, 0.35, 1.05], [0.95, 0.35, 1.05],
    [-0.95, 0.35, -1.05], [0.95, 0.35, -1.05]
  ];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    car.add(wheel);
  }

  car.position.set(LANES[carLaneIndex], 0, 3);
  scene.add(car);
}

// ============================================================
// Obstacles (traffic cones / rocks) — collidable, recycled
// ============================================================
function makeObstacleMesh() {
  const isRock = Math.random() > 0.5;
  if (isRock) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x8b8f96, roughness: 1, flatShading: true });
    const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 0), mat);
    mesh.castShadow = true;
    mesh.userData.height = 0.6;
    return mesh;
  }
  const mat = new THREE.MeshStandardMaterial({ color: 0xff7d1a, roughness: 0.6 });
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1, 8), mat);
  mesh.position.y = 0.5;
  mesh.castShadow = true;
  mesh.userData.height = 1;
  return mesh;
}

function buildObstaclePool() {
  for (let i = 0; i < OBSTACLE_COUNT; i++) {
    const mesh = makeObstacleMesh();
    resetObstacle(mesh, true);
    scene.add(mesh);
    obstacles.push(mesh);
  }
}

function resetObstacle(mesh, initial = false) {
  const lane = LANES[Math.floor(Math.random() * LANES.length)];
  mesh.position.x = lane;
  const minZ = -TRACK_LENGTH * 0.3;
  const maxZ = -TRACK_LENGTH * 0.95;
  mesh.position.z = initial
    ? -20 - Math.random() * TRACK_LENGTH
    : minZ + Math.random() * (maxZ - minZ);
  mesh.userData.passed = false;
}

function updateObstacles(delta) {
  const move = speed * delta;
  for (const obs of obstacles) {
    obs.position.z += move;
    obs.rotation.y += delta * 0.6;

    if (state === 'playing' && !obs.userData.passed && obs.position.z > car.position.z - 1 && obs.position.z < car.position.z + 1) {
      const laneHit = Math.abs(obs.position.x - car.position.x) < 1.1;
      if (laneHit) {
        triggerGameOver();
      } else {
        obs.userData.passed = true;
      }
    }

    if (obs.position.z > 8) {
      resetObstacle(obs);
    }
  }
}

// ============================================================
// Decorations (low-poly trees on the grass) — non-collidable
// ============================================================
function makeTree() {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a5a34, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({
    color: [0x4fae4f, 0x5fc25f, 0x39a06e][Math.floor(Math.random() * 3)],
    roughness: 0.9,
    flatShading: true
  });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.1, 6), trunkMat);
  trunk.position.y = 0.55;
  trunk.castShadow = true;
  group.add(trunk);

  const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 7), leafMat);
  leaves.position.y = 1.8;
  leaves.castShadow = true;
  group.add(leaves);

  const scale = 0.8 + Math.random() * 0.7;
  group.scale.setScalar(scale);
  return group;
}

function buildDecorPool() {
  for (let i = 0; i < DECOR_COUNT; i++) {
    const tree = makeTree();
    resetDecor(tree, true);
    scene.add(tree);
    decorations.push(tree);
  }
}

function resetDecor(tree, initial = false) {
  const side = Math.random() > 0.5 ? 1 : -1;
  tree.position.x = side * (7 + Math.random() * 8);
  tree.position.z = initial ? -Math.random() * TRACK_LENGTH : -TRACK_LENGTH * (0.6 + Math.random() * 0.4);
}

function updateDecor(delta) {
  const move = speed * delta;
  for (const tree of decorations) {
    tree.position.z += move;
    if (tree.position.z > 12) {
      resetDecor(tree);
    }
  }
}

// ============================================================
// Input
// ============================================================
function laneLeft() {
  if (state !== 'playing') return;
  carLaneIndex = Math.max(0, carLaneIndex - 1);
  carTargetX = LANES[carLaneIndex];
}
function laneRight() {
  if (state !== 'playing') return;
  carLaneIndex = Math.min(LANES.length - 1, carLaneIndex + 1);
  carTargetX = LANES[carLaneIndex];
}

window.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) laneLeft();
  if (['ArrowRight', 'd', 'D'].includes(e.key)) laneRight();
});

// On-screen steering buttons (touch devices)
const touchLeftBtn = document.getElementById('touchLeftBtn');
const touchRightBtn = document.getElementById('touchRightBtn');

function bindTap(el, fn) {
  el.addEventListener('touchstart', (e) => { e.preventDefault(); fn(); }, { passive: false });
  el.addEventListener('click', fn);
}
bindTap(touchLeftBtn, laneLeft);
bindTap(touchRightBtn, laneRight);

// Fallback: tapping the left/right half of the canvas also steers,
// for touch devices without the buttons in view (e.g. very short screens).
let touchStartX = null;
canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  if (touchStartX === null) return;
  const w = canvas.clientWidth;
  if (touchStartX < w / 2) laneLeft(); else laneRight();
  touchStartX = null;
}, { passive: true });

// ============================================================
// Game loop
// ============================================================
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (state === 'playing') {
    speed = Math.min(MAX_SPEED, speed + SPEED_RAMP * delta);
    distance += speed * delta;
    scoreEl.textContent = Math.floor(distance);
  }

  // car lane lerp + gentle lean
  car.position.x += (carTargetX - car.position.x) * Math.min(1, delta * 8);
  car.rotation.z = (carTargetX - car.position.x) * -0.15;

  updateTrack(delta);
  updateObstacles(delta);
  updateDecor(delta);

  camera.position.x += (car.position.x - camera.position.x) * Math.min(1, delta * 4);
  camera.lookAt(car.position.x, 1, car.position.z - 8);

  renderer.render(scene, camera);
}

// ============================================================
// Game state control
// ============================================================
function resetRun() {
  speed = BASE_SPEED;
  distance = 0;
  carLaneIndex = 1;
  carTargetX = LANES[1];
  car.position.x = LANES[1];
  scoreEl.textContent = '0';
  obstacles.forEach(o => resetObstacle(o, true));
}

function startRun() {
  resetRun();
  state = 'playing';
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
}

function triggerGameOver() {
  if (state !== 'playing') return;
  state = 'gameover';
  finalScoreEl.textContent = Math.floor(distance);
  gameOverOverlay.classList.remove('hidden');
}

// ============================================================
// Section open / close (full takeover of the page)
// ============================================================
let initialized = false;

function openGameDemo() {
  document.body.classList.add('game-active');
  if (!initialized) {
    initScene();
    initialized = true;
    animate();
  } else {
    onResize();
  }
  state = 'idle';
  startOverlay.classList.remove('hidden');
  gameOverOverlay.classList.add('hidden');
}

function closeGameDemo() {
  document.body.classList.remove('game-active');
  state = 'idle';
}

gameNavLink.addEventListener('click', (e) => {
  e.preventDefault();
  if (typeof closeNav === 'function') {
    closeNav();
  } else {
    document.getElementById('sidenav').classList.remove('open');
  }
  openGameDemo();
});

exitBtn.addEventListener('click', closeGameDemo);
startBtn.addEventListener('click', startRun);
retryBtn.addEventListener('click', startRun);

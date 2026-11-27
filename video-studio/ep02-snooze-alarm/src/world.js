import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  makeAlarmScreenTexture,
  makeSaturdayScreenTexture,
  makeX2BadgeTexture,
  makeSignTexture,
  makeSchedulePosterTexture,
  makeWallClockTexture,
  makeDaylightFacadeTexture,
  makeEarthTextures,
} from './textures.js';

export function prand(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function clayMat(color, roughness = 0.76, metalness = 0.04, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}

function rbox(w, h, d, r, matOrCol, x = 0, y = 0, z = 0, cast = true) {
  const mat = typeof matOrCol === 'string' || typeof matOrCol === 'number' ? clayMat(matOrCol) : matOrCol;
  const geo = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w * 0.48, h * 0.48, d * 0.48));
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

const ALARM_TEX = makeAlarmScreenTexture();
const SAT_TEX = makeSaturdayScreenTexture();
const X2_TEX = makeX2BadgeTexture('×2', '#f97316');
const FACADE_GLASS = makeDaylightFacadeTexture('glass');
const FACADE_OFFICE = makeDaylightFacadeTexture('office');
const FACADE_APT = makeDaylightFacadeTexture('apartment');
const FACADE_SHATTERED = makeDaylightFacadeTexture('shattered');
const DORM_PLAQUE_TEX = makeSignTexture('第一大学', '4 号 宿 舍 楼', '#1e3a8a', '#ffffff', '#fde047');
const POSTER_TEX = makeSignTexture('早睡早起', '绝不挂高数', '#dc2626', '#ffffff', '#fef08a');
const DOOR_NUM_TEX = makeSignTexture('404 寝室', '', '#1e293b', '#fde047', '#38bdf8');
const SCHEDULE_TEX = makeSchedulePosterTexture();
const CLOCK_TEX = makeWallClockTexture();
const ALIEN_WARN_TEX = makeSignTexture('⚠ 警告', '07:50 早八高数', '#7f1d1d', '#fef08a', '#ef4444');

export function createSonicDome(colorHex = '#7dd3fc', rimPower = 2.4) {
  const uniforms = {
    uColor: { value: new THREE.Color(colorHex) },
    uOpacity: { value: 0.0 },
    uRimPower: { value: rimPower },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vNormal; varying vec3 vViewDir; void main() { vec4 mvPos = modelViewMatrix * vec4(position, 1.0); vNormal = normalize(normalMatrix * normal); vViewDir = normalize(-mvPos.xyz); gl_Position = projectionMatrix * mvPos; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; uniform float uRimPower; varying vec3 vNormal; varying vec3 vViewDir; void main() { float ndv = abs(dot(normalize(vNormal), normalize(vViewDir))); float fresnel = pow(1.0 - ndv, uRimPower); gl_FragColor = vec4(uColor, clamp((fresnel + 0.06) * uOpacity, 0.0, 1.0)); }`,
  });
  return { mesh: new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), mat), uniforms };
}

export function createX2Sprite(scale = 0.85) {
  const mat = new THREE.SpriteMaterial({ map: X2_TEX, transparent: true, depthWrite: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(scale * 1.45, scale * 0.92, 1);
  sp.visible = false;
  return sp;
}

export function createLowPolyTree(scale = 1, seed = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.5, 7), clayMat('#8b6248', 0.88));
  trunk.position.y = 0.75;
  g.add(trunk);
  const greens = ['#5a9a4a', '#4b8640', '#6fae58', '#3e7234'];
  const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), clayMat(greens[Math.floor(prand(seed) * 4)], 0.85, 0, { flatShading: true }));
  c1.position.set(0, 1.95, 0);
  const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.70, 1), clayMat(greens[Math.floor(prand(seed + 3) * 4)], 0.85, 0, { flatShading: true }));
  c2.position.set(0.5, 1.72, 0.2);
  g.add(c1, c2);
  g.scale.setScalar(scale);
  return g;
}

function createLowPolyCar(color = '#e07a5f') {
  const g = new THREE.Group();
  g.add(rbox(2.4, 0.52, 1.18, 0.14, color, 0, 0.40, 0));
  g.add(rbox(1.32, 0.44, 1.04, 0.14, '#f1f5f9', -0.08, 0.82, 0));
  g.add(rbox(1.36, 0.30, 0.98, 0.06, '#334155', -0.08, 0.82, 0));
  const wMat = clayMat('#1e293b', 0.8);
  [[-0.72, -0.60], [0.72, -0.60], [-0.72, 0.60], [0.72, 0.60]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 10), wMat);
    w.rotation.x = Math.PI / 2; w.position.set(wx, 0.24, wz); g.add(w);
  });
  return g;
}

function createLowPolyBus(color = '#f59e0b') {
  const g = new THREE.Group();
  g.add(rbox(4.6, 1.45, 1.45, 0.16, color, 0, 0.92, 0));
  g.add(rbox(4.4, 0.52, 1.48, 0.04, '#334155', 0.05, 1.15, 0, false));
  const wMat = clayMat('#1e293b', 0.8);
  [[-1.4, -0.74], [1.4, -0.74], [-1.4, 0.74], [1.4, 0.74]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 10), wMat);
    w.rotation.x = Math.PI / 2; w.position.set(wx, 0.32, wz); g.add(w);
  });
  return g;
}

export function createAlarmPhone(scale = 1.0) {
  const group = new THREE.Group();
  const bodyMat = clayMat('#1e293b', 0.25, 0.55);
  group.add(rbox(0.42, 0.74, 0.06, 0.03, bodyMat, 0, 0, 0));
  const screenMat = new THREE.MeshStandardMaterial({
    map: ALARM_TEX, emissive: new THREE.Color('#ef4444'), emissiveMap: ALARM_TEX, emissiveIntensity: 0.9, roughness: 0.12,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.37, 0.66), screenMat);
  screen.position.z = 0.033;
  group.add(screen);
  const light = new THREE.PointLight('#ef4444', 0.0, 7.0, 1.5);
  light.position.set(0, 0, 0.35);
  group.add(light);
  group.scale.setScalar(scale);

  function setMode(mode) {
    if (mode === 'saturday') {
      screenMat.map = SAT_TEX; screenMat.emissiveMap = SAT_TEX;
      screenMat.emissive.set('#38bdf8'); screenMat.emissiveIntensity = 0.95;
    } else {
      screenMat.map = ALARM_TEX; screenMat.emissiveMap = ALARM_TEX;
      screenMat.emissive.set('#ef4444');
    }
    screenMat.needsUpdate = true;
  }
  return { group, bodyMat, screenMat, light, setMode };
}

// ===========================================================================
// UPGRADED CHARACTER (NO CLOWN-NOSE MOUTH! NO DETACHED ARMS! CLEAN COMIC FACE!)
// ===========================================================================
export function createCharacter({
  hoodie = '#0284c7',
  hoodieTrim = '#38bdf8',
  pants = '#1e293b',
  hair = '#171c2b',
  withHeadphones = false,
  sitting = false,
  isAuntie = false,
  holdingPillow = false,
  lightweight = false,
} = {}) {
  const root = new THREE.Group();
  const skin = clayMat('#f6ccb0', 0.72);
  const hairM = clayMat(hair, 0.65);
  const hoodieM = clayMat(hoodie, 0.74);
  const trimM = clayMat(hoodieTrim, 0.70);
  const pantsM = clayMat(pants, 0.80);

  if (lightweight) {
    root.add(rbox(0.54, 0.76, 0.34, 0.12, hoodieM, 0, 1.15, 0));
    root.add(rbox(0.46, 0.46, 0.44, 0.16, skin, 0, 1.84, 0));
    root.add(rbox(0.50, 0.22, 0.48, 0.10, hairM, 0, 2.02, -0.02));
    const armL = new THREE.Group(); armL.position.set(-0.30, 1.44, 0);
    armL.add(rbox(0.16, 0.54, 0.16, 0.06, hoodieM, 0, -0.24, 0));
    const armR = new THREE.Group(); armR.position.set(0.30, 1.44, 0);
    armR.add(rbox(0.16, 0.54, 0.16, 0.06, hoodieM, 0, -0.24, 0));
    const legL = new THREE.Group(); legL.position.set(-0.15, 0.76, 0);
    legL.add(rbox(0.20, 0.72, 0.22, 0.07, pantsM, 0, -0.34, 0));
    const legR = new THREE.Group(); legR.position.set(0.15, 0.76, 0);
    legR.add(rbox(0.20, 0.72, 0.22, 0.07, pantsM, 0, -0.34, 0));
    root.add(armL, armR, legL, legR);
    return { root, armL, armR, legL, legR, setAfro: () => {}, setExpression: () => {} };
  }

  root.add(rbox(0.68, 0.78, 0.40, 0.16, hoodieM, 0, 1.24, 0));
  root.add(rbox(0.62, 0.14, 0.36, 0.05, '#f8fafc', 0, 0.84, 0));
  if (!isAuntie) root.add(rbox(0.44, 0.22, 0.08, 0.05, trimM, 0, 1.04, 0.20));
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.18, 12), skin);
  neck.position.set(0, 1.72, 0);
  root.add(neck);

  if (withHeadphones) {
    const hpBand = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.032, 10, 20, Math.PI * 1.15), clayMat('#1e293b', 0.35, 0.3));
    hpBand.rotation.set(Math.PI / 2 + 0.12, 0, -0.25);
    hpBand.position.set(0, 1.69, 0.02);
    root.add(hpBand);
  }
  if (isAuntie) {
    root.add(rbox(0.56, 0.46, 0.05, 0.02, '#f8fafc', 0, 1.05, 0.22));
  }

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.08, 0);
  root.add(headGroup);
  headGroup.add(rbox(0.68, 0.62, 0.60, 0.20, skin, 0, 0, 0));

  // Normal Hair
  const normalHair = new THREE.Group();
  const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), hairM);
  hairCrown.scale.set(1.04, 0.82, 0.98);
  hairCrown.position.set(0, 0.14, -0.04);
  normalHair.add(hairCrown);
  if (isAuntie) {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), hairM);
    bun.position.set(0, 0.45, -0.14);
    normalHair.add(bun);
  } else {
    [[-0.22, 0.22, 0.24, 0.38], [-0.07, 0.26, 0.28, 0.14], [0.09, 0.26, 0.28, -0.14], [0.22, 0.22, 0.24, -0.36]].forEach(([x, y, z, rz]) => {
      const lock = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.16, 6, 8), hairM);
      lock.position.set(x, y, z); lock.rotation.set(0.3, 0, rz); normalHair.add(lock);
    });
  }
  headGroup.add(normalHair);

  // Clean Giant Afro (Behind & Above Face!)
  const afroGroup = new THREE.Group();
  const afroMat = clayMat('#1c1917', 0.92);
  const afroCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 2), afroMat);
  afroCore.position.set(0, 0.34, -0.22);
  afroCore.scale.set(1.22, 1.05, 0.85);
  afroGroup.add(afroCore);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rx = Math.cos(a) * 0.52;
    const ry = 0.28 + Math.sin(a) * 0.44;
    if (ry < -0.04) continue;
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22 + (i % 3) * 0.04, 1), afroMat);
    puff.position.set(rx, ry, -0.18 - Math.abs(Math.cos(a)) * 0.12);
    afroGroup.add(puff);
  }
  [[-0.24, 0.62, -0.12], [0.0, 0.68, -0.14], [0.24, 0.62, -0.12], [-0.46, 0.34, -0.10], [0.46, 0.34, -0.10]].forEach(([px, py, pz]) => {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), afroMat);
    p.position.set(px, py, pz); afroGroup.add(p);
  });
  afroGroup.visible = false;
  headGroup.add(afroGroup);

  // Eyes + Blush + Optional Glasses
  const whiteM = clayMat('#ffffff', 0.2);
  const irisM = clayMat('#111827', 0.12);
  const glintM = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const makeEye = (x) => {
    const eg = new THREE.Group();
    eg.position.set(x, 0.01, 0.285);
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), whiteM);
    sclera.scale.set(0.95, 1.12, 0.32);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.050, 12, 12), irisM);
    iris.scale.set(0.95, 1.10, 0.34);
    iris.position.set(0, -0.004, 0.014);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), glintM);
    glint.position.set(0.018, 0.024, 0.032);
    eg.add(sclera, iris, glint);
    eg.userData = { iris, glint };
    return eg;
  };
  const eyeL = makeEye(-0.135);
  const eyeR = makeEye(0.135);
  headGroup.add(eyeL, eyeR);

  const blushM = new THREE.MeshBasicMaterial({ color: '#fb7185', transparent: true, opacity: 0.30 });
  [-0.21, 0.21].forEach((bx) => {
    const bl = new THREE.Mesh(new THREE.CircleGeometry(0.048, 12), blushM);
    bl.scale.set(1.2, 0.65, 1);
    bl.position.set(bx, -0.085, 0.302);
    headGroup.add(bl);
  });

  if (isAuntie) {
    const rimM = clayMat('#1e293b', 0.3, 0.5);
    [-0.135, 0.135].forEach((gx) => {
      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.014, 8, 18), rimM);
      frame.position.set(gx, 0.01, 0.312);
      headGroup.add(frame);
    });
    headGroup.add(rbox(0.08, 0.02, 0.02, 0.005, rimM, 0, 0.01, 0.312, false));
  }

  const browL = new THREE.Mesh(new THREE.CapsuleGeometry(0.019, 0.095, 4, 8), hairM);
  browL.rotation.z = Math.PI / 2; browL.position.set(-0.135, 0.125, 0.295);
  const browR = browL.clone(); browR.position.x = 0.135;
  headGroup.add(browL, browR);

  // CLEAN FLAT COMIC MOUTH (ZERO CLOWN-NOSE SPHERE!)
  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(0, -0.155, 0.302);
  const mouthLine = rbox(0.10, 0.024, 0.012, 0.01, '#451a03', 0, 0, 0, false);
  const mouthOpen = new THREE.Group();
  const mouthCavity = rbox(0.15, 0.10, 0.012, 0.04, '#58101c', 0, 0, 0, false);
  const mouthTeeth = rbox(0.11, 0.026, 0.014, 0.008, '#ffffff', 0, 0.028, 0.002, false);
  mouthOpen.add(mouthCavity, mouthTeeth);
  mouthOpen.visible = false;
  const mouthO = new THREE.Mesh(new THREE.CircleGeometry(0.038, 16), new THREE.MeshBasicMaterial({ color: '#58101c' }));
  mouthO.position.z = 0.003;
  mouthO.visible = false;
  mouthGroup.add(mouthLine, mouthOpen, mouthO);
  headGroup.add(mouthGroup);

  const sweat = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.11, 10), clayMat('#38bdf8', 0.2));
  sweat.position.set(0.28, 0.11, 0.22);
  sweat.visible = false;
  headGroup.add(sweat);

  // SNUG CONNECTED ARMS WITH ROUNDED SHOULDER CAPS (ZERO DETACHED LIMBS!)
  const armL = new THREE.Group(); armL.position.set(-0.37, 1.50, 0);
  armL.add(new THREE.Mesh(new THREE.SphereGeometry(0.112, 12, 12), hoodieM));
  armL.add(rbox(0.19, 0.58, 0.19, 0.085, hoodieM, 0, -0.25, 0));
  if (isAuntie) armL.add(rbox(0.21, 0.14, 0.21, 0.04, '#dc2626', 0, -0.15, 0));
  const hL = new THREE.Mesh(new THREE.SphereGeometry(0.086, 10, 10), skin); hL.position.y = -0.57; armL.add(hL);

  const armR = new THREE.Group(); armR.position.set(0.37, 1.50, 0);
  armR.add(new THREE.Mesh(new THREE.SphereGeometry(0.112, 12, 12), hoodieM));
  armR.add(rbox(0.19, 0.58, 0.19, 0.085, hoodieM, 0, -0.25, 0));
  const hR = new THREE.Mesh(new THREE.SphereGeometry(0.086, 10, 10), skin); hR.position.y = -0.57; armR.add(hR);
  root.add(armL, armR);

  // Optional Pillow Prop held at chest height (never occluding angry face!)
  let pillowProp = null;
  if (holdingPillow) {
    pillowProp = rbox(0.76, 0.36, 0.20, 0.09, '#f8fafc', 0, 1.24, 0.34);
    pillowProp.visible = false;
    root.add(pillowProp);
  }

  const legL = new THREE.Group();
  const legR = new THREE.Group();
  if (sitting) {
    legL.position.set(-0.17, 0.80, 0.08);
    legL.add(rbox(0.24, 0.23, 0.76, 0.09, pantsM, 0, 0, 0.36));
    legR.position.set(0.17, 0.80, 0.08);
    legR.add(rbox(0.24, 0.23, 0.76, 0.09, pantsM, 0, 0, 0.36));
  } else {
    legL.position.set(-0.17, 0.80, 0);
    legL.add(rbox(0.24, 0.70, 0.26, 0.09, pantsM, 0, -0.34, 0));
    legR.position.set(0.17, 0.80, 0);
    legR.add(rbox(0.24, 0.70, 0.26, 0.09, pantsM, 0, -0.34, 0));
  }
  root.add(legL, legR);

  function setAfro(on) {
    normalHair.visible = !on;
    afroGroup.visible = on;
  }

  function setExpression(expr, time = 0) {
    const resetEye = (sc = 1.0, showGlint = true, sy = 1.0) => {
      [eyeL, eyeR].forEach((e) => {
        e.scale.set(sc, sy, 1);
        e.userData.iris.scale.set(0.95 * (showGlint ? 1 : 0.36), 1.10 * (showGlint ? 1 : 0.36), 0.34);
        e.userData.glint.visible = showGlint;
      });
    };
    mouthLine.visible = false; mouthOpen.visible = false; mouthO.visible = false;
    if (expr === 'sleepy') {
      resetEye(1.05, false, 0.16);
      browL.rotation.z = Math.PI / 2 + 0.12; browR.rotation.z = Math.PI / 2 - 0.12;
      mouthLine.visible = true; sweat.visible = false;
    } else if (expr === 'angry') {
      resetEye(1.10, true, 0.90);
      browL.rotation.z = Math.PI / 2 - 0.42; browR.rotation.z = Math.PI / 2 + 0.42;
      mouthOpen.visible = true;
      mouthOpen.scale.set(1.05, 0.85 + Math.abs(Math.sin(time * 9)) * 0.35, 1);
      sweat.visible = false;
    } else if (expr === 'panic') {
      resetEye(1.26, true, 1.26);
      browL.rotation.z = Math.PI / 2 + 0.36; browR.rotation.z = Math.PI / 2 - 0.36;
      mouthOpen.visible = true;
      mouthOpen.scale.set(0.88, 1.15, 1);
      sweat.visible = true; sweat.position.y = 0.12 - ((time * 1.8) % 1) * 0.12;
    } else if (expr === 'stunned') {
      resetEye(1.34, false, 1.34);
      browL.rotation.z = Math.PI / 2 + 0.18; browR.rotation.z = Math.PI / 2 - 0.22;
      mouthO.visible = true;
      sweat.visible = true; sweat.position.y = 0.13 - ((time * 0.6) % 1) * 0.08;
    } else {
      resetEye(1.0, true, 1.0);
      browL.rotation.z = Math.PI / 2; browR.rotation.z = Math.PI / 2;
      mouthLine.visible = true; sweat.visible = false;
    }
  }

  return { root, headGroup, armL, armR, legL, legR, afroGroup, pillowProp, setAfro, setExpression };
}

function makeQuestionMarks() {
  const g = new THREE.Group();
  const makeQ = (col) => {
    const q = new THREE.Group();
    const m = clayMat(col, 0.3, 0.05, { emissive: col, emissiveIntensity: 0.42 });
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.048, 10, 18, Math.PI * 1.45), m);
    hook.rotation.z = -0.35; hook.position.y = 0.28;
    const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.09, 6, 10), m);
    stem.position.y = 0.09;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 10), m);
    dot.position.y = -0.06;
    q.add(hook, stem, dot);
    return q;
  };
  const q1 = makeQ('#fde047'); q1.position.set(-0.2, 0.2, 0); q1.rotation.z = 0.18;
  const q2 = makeQ('#fef08a'); q2.position.set(0.28, 0.08, 0); q2.scale.setScalar(0.8); q2.rotation.z = -0.28;
  g.add(q1, q2);
  g.visible = false;
  return g;
}

// ===========================================================================
// WORLD 1: ULTRA-RICH 4-PERSON UNIVERSITY DORM (ZERO BLANK WALLS! 7 CHARACTERS!)
// ===========================================================================
export function buildAlarmDorm() {
  const group = new THREE.Group();
  group.add(new THREE.HemisphereLight('#e0ecff', '#a89078', 0.66));
  const sun = new THREE.DirectionalLight('#fff2dc', 1.38);
  sun.position.set(7.5, 11.5, 6.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -8; sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -8;
  group.add(sun);

  const alarmLight = new THREE.PointLight('#ef4444', 0, 14, 1.5);
  alarmLight.position.set(-3.1, 2.2, -2.2);
  group.add(alarmLight);

  // Room floor, patterned rug, 3 walls (left, back, right so NO empty void behind roommate!)
  group.add(rbox(10.0, 0.45, 10.0, 0.06, '#b88b5a', 0, -0.225, 0, false));
  group.add(rbox(4.6, 0.04, 3.6, 0.02, '#a3b899', 0.2, 0.02, 0.65, false));
  group.add(rbox(10.0, 5.8, 0.34, 0.05, '#e8e0d5', 0, 2.9, -4.75, false));
  group.add(rbox(0.34, 5.8, 10.0, 0.05, '#e4dccf', -4.75, 2.9, 0, false));
  group.add(rbox(0.34, 5.8, 10.0, 0.05, '#e4dccf', 4.75, 2.9, 0, false));
  // Ceiling LED Light Bars (Signature WhatIf Classroom/Dorm Realism!)
  group.add(rbox(3.2, 0.10, 0.22, 0.03, clayMat('#ffffff', 0.2, 0, { emissive: '#f8fafc', emissiveIntensity: 0.9 }), -1.5, 5.35, -1.2, false));
  group.add(rbox(3.2, 0.10, 0.22, 0.03, clayMat('#ffffff', 0.2, 0, { emissive: '#f8fafc', emissiveIntensity: 0.9 }), 1.8, 5.35, -1.2, false));

  // Left Wall: Poster "早睡早起 绝不挂高数" + Floating Bookshelf + Wall Clock (07:50!)
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.82), new THREE.MeshBasicMaterial({ map: POSTER_TEX }));
  poster.position.set(-4.56, 3.55, -1.65); poster.rotation.y = Math.PI / 2; group.add(poster);
  const clockMesh = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ map: CLOCK_TEX }));
  clockMesh.position.set(-4.56, 4.15, 0.55); clockMesh.rotation.y = Math.PI / 2; group.add(clockMesh);

  // Right Wall: 3-TIER BOOKSHELF (between door & bunk so visible in BOTH roommate & Auntie shots!) + CLASS SCHEDULE!
  const rightShelf = new THREE.Group();
  rightShelf.position.set(4.35, 0, -1.55);
  for (let tier = 0; tier < 3; tier++) {
    const sy = 1.65 + tier * 0.72;
    rightShelf.add(rbox(0.42, 0.07, 2.8, 0.02, '#a67c52', 0, sy, 0));
    const bCols = ['#ef4444', '#0284c7', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6'];
    for (let b = 0; b < 7; b++) {
      const bh = 0.34 + ((b + tier) % 3) * 0.07;
      rightShelf.add(rbox(0.28, bh, 0.14, 0.02, bCols[(b + tier * 3) % bCols.length], -0.02, sy + 0.04 + bh / 2, -1.08 + b * 0.34));
    }
  }
  const ramen = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.26, 12), clayMat('#ef4444', 0.5));
  ramen.position.set(-0.04, 1.82, 1.18); rightShelf.add(ramen);
  group.add(rightShelf);

  const schedMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.32), new THREE.MeshBasicMaterial({ map: SCHEDULE_TEX }));
  schedMesh.position.set(4.56, 4.18, -0.45); schedMesh.rotation.y = -Math.PI / 2; group.add(schedMesh);

  // Back Wall: Wall AC + Large Window with Curtains + Outside Skyscraper Silhouette + Breakable Glass
  group.add(rbox(1.85, 0.48, 0.38, 0.08, '#f8fafc', -2.55, 4.75, -4.35));
  group.add(rbox(3.5, 2.7, 0.22, 0.05, '#f8fafc', 0.15, 3.2, -4.55));
  const skyPane = new THREE.Mesh(new THREE.PlaneGeometry(3.15, 2.35), new THREE.MeshBasicMaterial({ color: '#bae6fd' }));
  skyPane.position.set(0.15, 3.2, -4.43); group.add(skyPane);
  const winB1 = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.95), new THREE.MeshBasicMaterial({ map: FACADE_OFFICE }));
  winB1.position.set(-0.55, 3.0, -4.41);
  const winB2 = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 2.15), new THREE.MeshBasicMaterial({ map: FACADE_GLASS }));
  winB2.position.set(0.55, 3.08, -4.41);
  group.add(winB1, winB2);
  const windowGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(3.12, 2.32),
    new THREE.MeshStandardMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0.5 })
  );
  windowGlass.position.set(0.15, 3.2, -4.38); group.add(windowGlass);
  group.add(rbox(0.44, 2.95, 0.22, 0.06, '#d6c7b2', -1.55, 3.15, -4.30));
  group.add(rbox(0.44, 2.95, 0.22, 0.06, '#d6c7b2', 1.85, 3.15, -4.30));

  // Swinging Dorm Door + "404 寝室" Plaque + Hallway Background!
  group.add(rbox(4.2, 4.4, 0.15, 0.02, '#cbd5e1', 3.4, 2.2, -6.2, false)); // corridor far wall
  const doorPivot = new THREE.Group();
  doorPivot.position.set(4.15, 0, -4.52);
  const doorMesh = rbox(1.55, 3.55, 0.14, 0.03, '#92400e', -0.78, 1.77, 0);
  doorMesh.add(rbox(0.14, 0.08, 0.24, 0.02, '#facc15', -0.58, 0.0, 0.08));
  const doorSign = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.28), new THREE.MeshBasicMaterial({ map: DOOR_NUM_TEX }));
  doorSign.position.set(-0.78, 2.75, 0.08);
  doorPivot.add(doorMesh, doorSign);
  group.add(doorPivot);

  // 4 Pajama-Clad Neighbor Students Peeking from the Hallway behind Dorm Auntie!
  const neighbors = [];
  const nCols = ['#38bdf8', '#a78bfa', '#34d399', '#fb7185'];
  [[2.75, -5.2], [3.55, -5.45], [2.15, -5.45], [3.95, -5.1]].forEach(([nx, nz], idx) => {
    const nb = createCharacter({ hoodie: nCols[idx], pants: '#334155', hair: '#292524', sitting: false });
    nb.root.position.set(nx, 0.02, nz);
    nb.root.rotation.y = -0.25;
    nb.root.scale.setScalar(0.95);
    nb.root.visible = false;
    group.add(nb.root);
    neighbors.push(nb);
  });

  // Hero Bed + Xiaojiu + Nightstand + Alarm Phone + Cup Lid
  const bedBounceGroup = new THREE.Group();
  bedBounceGroup.position.set(-1.85, 0, -1.45);
  group.add(bedBounceGroup);
  bedBounceGroup.add(rbox(2.55, 0.50, 3.45, 0.08, '#b88b61', 0, 0.25, 0));
  bedBounceGroup.add(rbox(2.62, 1.45, 0.18, 0.07, '#b88b61', 0, 0.76, -1.68));
  bedBounceGroup.add(rbox(2.42, 0.34, 3.25, 0.10, '#f8fafc', 0, 0.64, 0));
  bedBounceGroup.add(rbox(2.50, 0.40, 2.25, 0.12, '#3b82f6', 0, 0.76, 0.45));
  bedBounceGroup.add(rbox(1.35, 0.30, 0.65, 0.12, '#ffffff', 0, 0.96, -1.18));

  const xiaojiu = createCharacter({ hoodie: '#0284c7', hoodieTrim: '#38bdf8', withHeadphones: true, sitting: true });
  xiaojiu.root.position.set(0, 0.50, -0.52);
  xiaojiu.root.scale.setScalar(1.06);
  bedBounceGroup.add(xiaojiu.root);

  const standGroup = new THREE.Group();
  standGroup.position.set(-3.65, 0, -2.55);
  group.add(standGroup);
  standGroup.add(rbox(0.98, 1.05, 0.98, 0.06, '#c2996d', 0, 0.525, 0));
  const alarmPhone = createAlarmPhone(1.18);
  alarmPhone.group.position.set(0.08, 1.48, 0.05);
  alarmPhone.group.rotation.y = 0.52;
  standGroup.add(alarmPhone.group);

  const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, 0.32, 12), clayMat('#0ea5e9', 0.35));
  cupBody.position.set(-0.24, 1.21, 0.28);
  const cupLid = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), clayMat('#f8fafc', 0.4));
  cupLid.position.set(-0.24, 1.40, 0.28);
  standGroup.add(cupBody, cupLid);

  const handPhone = createAlarmPhone(1.45);
  handPhone.setMode('saturday');
  handPhone.group.visible = false;
  group.add(handPhone.group);

  // Right Side (Tucked cleanly against right wall so center aisle is 100% OPEN!): 2-TIER BUNK BED
  const bunkGroup = new THREE.Group();
  bunkGroup.position.set(3.25, 0, 2.15);
  group.add(bunkGroup);
  // Metal bunk posts (taller so upper bunk clears lower roommate's head cleanly!)
  [[-1.08, -1.42], [1.08, -1.42], [-1.08, 1.42], [1.08, 1.42]].forEach(([px, pz]) => {
    bunkGroup.add(rbox(0.11, 4.10, 0.11, 0.03, '#475569', px, 2.05, pz));
  });
  // Lower bunk
  bunkGroup.add(rbox(2.15, 0.32, 2.85, 0.08, '#f8fafc', 0, 0.52, 0));
  bunkGroup.add(rbox(2.18, 0.34, 1.75, 0.12, '#7da87b', 0, 0.64, 0.45));
  // Upper bunk (at y=3.08 so lower roommate head at y=2.90 is 100% clear; slim rail so upper roommate face is 100% clear!)
  bunkGroup.add(rbox(2.18, 0.24, 2.88, 0.07, '#f8fafc', 0, 3.08, 0));
  bunkGroup.add(rbox(2.20, 0.26, 1.80, 0.09, '#6366f1', 0, 3.20, 0.42));
  bunkGroup.add(rbox(0.06, 0.20, 2.0, 0.02, '#475569', -1.08, 3.42, 0));

  const roommate = createCharacter({ hoodie: '#f59e0b', hoodieTrim: '#fbbf24', hair: '#451a03', sitting: true, holdingPillow: true });
  roommate.root.position.set(3.05, 0.48, 1.55);
  roommate.root.rotation.y = -0.82;
  group.add(roommate.root);

  const upperMate = createCharacter({ hoodie: '#6366f1', hoodieTrim: '#818cf8', hair: '#1e293b', sitting: true });
  upperMate.root.position.set(2.92, 2.95, 1.65);
  upperMate.root.rotation.y = -0.92;
  upperMate.root.scale.setScalar(0.90);
  group.add(upperMate.root);

  // Dorm Auntie
  const auntie = createCharacter({ hoodie: '#be185d', hoodieTrim: '#f472b6', pants: '#1f2937', hair: '#27272a', isAuntie: true, sitting: false });
  auntie.root.position.set(2.5, 0.02, -3.2);
  auntie.root.rotation.y = -0.65;
  auntie.root.scale.setScalar(1.08);
  auntie.root.visible = false;
  group.add(auntie.root);

  // Concentric Sonic Rings + Bloom Pillar + Shattered Glass Shards
  const sonicRings = [];
  for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? '#38bdf8' : '#fb923c', transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.045, 10, 48), mat);
    m.position.set(-3.55, 1.55, -2.50); m.visible = false; group.add(m);
    sonicRings.push({ mesh: m, mat, phase: i / 5 });
  }

  const dormBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.55, 12, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  dormBeam.position.set(-3.55, 5.5, -2.50); group.add(dormBeam);

  const shards = [];
  const shardGeo = new THREE.ConeGeometry(0.11, 0.28, 3);
  const shardMat = new THREE.MeshStandardMaterial({ color: '#bae6fd', roughness: 0.08, metalness: 0.85, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  for (let i = 0; i < 80; i++) {
    const s = new THREE.Mesh(shardGeo, shardMat); s.visible = false; group.add(s);
    shards.push({ mesh: s, x0: 0.15 + (prand(i * 1.9) - 0.5) * 2.8, y0: 3.2 + (prand(i * 2.7) - 0.5) * 2.0, vx: (prand(i * 3.1) - 0.5) * 9.0, vy: (prand(i * 5.7) - 0.25) * 6.5, vz: 3.5 + prand(i * 7.3) * 8.5, rx: prand(i * 9.1) * 14, ry: prand(i * 11.3) * 14 });
  }

  const x2Badges = [createX2Sprite(0.95), createX2Sprite(0.75)];
  x2Badges.forEach((b) => group.add(b));
  const questionMarks = makeQuestionMarks();
  group.add(questionMarks);

  return {
    group, alarmLight, doorPivot, windowGlass, bedBounceGroup, bunkGroup, rightShelf,
    xiaojiu, roommate, upperMate, auntie, neighbors, standGroup, alarmPhone, handPhone, cupLid,
    sonicRings, dormBeam, shards, x2Badges, questionMarks,
  };
}

// ===========================================================================
// WORLD 2: RICH CAMPUS (RED RUNNING TRACK + CRATER + LIFTING 4号楼 + FLYING FURNITURE!)
// ===========================================================================
export function buildAlarmCampus() {
  const group = new THREE.Group();
  group.visible = false;
  group.add(new THREE.HemisphereLight('#e0f2fe', '#94a3b8', 0.68));
  const sun = new THREE.DirectionalLight('#fff4de', 1.38); sun.position.set(20, 32, 22); group.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), clayMat('#d6d0c6', 0.92));
  ground.rotation.x = -Math.PI / 2; group.add(ground);
  group.add(rbox(150, 0.06, 9.5, 0.02, '#475569', 0, 0.03, 12.5, false));

  // Red Athletic Running Track + Green Soccer Field (WhatIf Signature Campus Detail!)
  group.add(rbox(28, 0.08, 18, 0.04, '#dc2626', 24, 0.04, 16, false));
  group.add(rbox(22, 0.10, 12, 0.04, '#22c55e', 24, 0.05, 16, false));
  group.add(rbox(0.25, 0.12, 12, 0.01, '#ffffff', 24, 0.06, 16, false));
  // Left Basketball Court + Hoops!
  group.add(rbox(24, 0.08, 15, 0.04, '#0284c7', -22, 0.04, 16, false));
  group.add(rbox(0.22, 3.6, 0.22, 0.02, '#334155', -11.5, 1.8, 16));
  group.add(rbox(0.15, 1.3, 1.9, 0.02, '#f8fafc', -12.0, 3.2, 16));

  // Dark Ground Crater + Flying Rubble right underneath the lifting Dorm Building!
  const crater = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 5.5, 0.4, 24), clayMat('#292524', 0.95));
  crater.position.set(0, 0.15, -2.0); group.add(crater);
  const rubbles = [];
  const rubGeo = new THREE.DodecahedronGeometry(0.65, 0);
  const rubMat = clayMat('#78716c', 0.92, 0, { flatShading: true });
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(rubGeo, rubMat); group.add(m);
    rubbles.push({ mesh: m, ang: prand(i * 3.1) * Math.PI * 2, rad: 4.5 + prand(i * 5.2) * 5.0, spd: 2.5 + prand(i * 7.1) * 4.0, seed: i });
  }

  // Hero Lifting 8-Story Dorm Building ("第一大学 4号宿舍楼")
  const heroBldGroup = new THREE.Group(); group.add(heroBldGroup);
  const dormTex = FACADE_APT.clone(); dormTex.needsUpdate = true; dormTex.repeat.set(2, 1.5);
  const bldMesh = new THREE.Mesh(new THREE.BoxGeometry(11.4, 18.0, 6.8), new THREE.MeshStandardMaterial({ map: dormTex, roughness: 0.75 }));
  bldMesh.position.set(0, 9.0, -2.0); heroBldGroup.add(bldMesh);
  heroBldGroup.add(rbox(12.0, 0.55, 7.2, 0.06, '#cbd5e1', 0, 18.15, -2.0));
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 3.1), new THREE.MeshBasicMaterial({ map: DORM_PLAQUE_TEX }));
  plaque.position.set(0, 19.95, 1.48);
  heroBldGroup.add(rbox(8.9, 3.4, 0.35, 0.06, '#1e293b', 0, 19.95, 1.25), plaque);

  [[-18, 7, -5, 10, 14, 7, FACADE_OFFICE], [18, 9, -5, 10, 18, 7, FACADE_GLASS], [-24, 11, -20, 13, 22, 8, FACADE_GLASS], [24, 13, -22, 14, 26, 8, FACADE_OFFICE]].forEach(([x, y, z, w, h, d, tex]) => {
    const t = tex.clone(); t.needsUpdate = true; t.repeat.set(2, 2);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.72 }));
    m.position.set(x, y, z); group.add(m);
  });

  [[-10, 6, 1.3], [9.5, 6, 1.35], [-14, 22, 1.2], [14, 22, 1.25]].forEach(([tx, tz, sc], idx) => {
    const tr = createLowPolyTree(sc, idx * 5 + 2); tr.position.set(tx, 0, tz); group.add(tr);
  });

  // 35 Fleeing Pajama Students!
  const runners = [];
  const cols = ['#38bdf8', '#f472b6', '#fbbf24', '#34d399', '#a78bfa', '#fb7185'];
  for (let i = 0; i < 35; i++) {
    const rx = (prand(i * 3.7) - 0.5) * 32;
    const rz = 3.2 + prand(i * 5.9) * 8.0;
    const p = createCharacter({ hoodie: cols[i % cols.length], lightweight: true });
    p.root.position.set(rx, 0.05, rz); p.root.scale.setScalar(0.72);
    const dir = rx < 0 ? -1 : 1;
    p.root.rotation.y = dir < 0 ? -Math.PI * 0.45 : Math.PI * 0.45;
    group.add(p.root);
    runners.push({ p, x0: rx, dir, spd: 2.2 + prand(i * 7.1) * 1.8, phase: prand(i * 2.3) * 6 });
  }

  const campusBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 2.2, 85, 28, 1, true),
    new THREE.MeshBasicMaterial({ color: '#fffbeb', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  campusBeam.position.set(0, 42, -2.0); group.add(campusBeam);

  const shockRings = [];
  for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? '#7dd3fc' : '#fde047', transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.14, 10, 48), mat);
    ring.rotation.x = Math.PI / 2; ring.position.set(0, 2.5 + i * 3.5, -2.0); group.add(ring);
    shockRings.push({ mesh: ring, mat, phase: i / 5 });
  }

  // RICH FLYING PROPS: Colorful Pillows + Books + Desks swirling into the air!
  const flyingProps = [];
  const pilGeo = new RoundedBoxGeometry(1.0, 0.30, 0.65, 2, 0.12);
  const bookGeo = new THREE.BoxGeometry(0.75, 0.14, 0.55);
  const deskGeo = new THREE.BoxGeometry(1.4, 0.85, 0.9);
  const propMats = [clayMat('#ffffff'), clayMat('#38bdf8'), clayMat('#f97316'), clayMat('#facc15'), clayMat('#b88b61')];
  for (let i = 0; i < 64; i++) {
    const geo = i < 34 ? pilGeo : i < 52 ? bookGeo : deskGeo;
    const mat = i < 34 ? propMats[i % 2] : i < 52 ? propMats[1 + (i % 3)] : propMats[4];
    const m = new THREE.Mesh(geo, mat); group.add(m);
    flyingProps.push({ mesh: m, ang: prand(i * 4.1) * Math.PI * 2, rad: 5 + prand(i * 6.3) * 18, y0: 4 + prand(i * 2.9) * 16, spd: 2.0 + prand(i * 8.1) * 3.5, seed: i * 1.7 });
  }

  return { group, heroBldGroup, rubbles, runners, campusBeam, shockRings, flyingProps };
}

// ===========================================================================
// WORLD 3: LIVING METROPOLIS (ROADS + 48 CARS + RIVER + BRIDGE + SHATTERING TOWERS + SWIRLING ALARMS/PILLOWS!)
// ===========================================================================
export function buildAlarmCity() {
  const group = new THREE.Group();
  group.visible = false;
  group.add(new THREE.HemisphereLight('#e0f2fe', '#94a3b8', 0.68));
  const sun = new THREE.DirectionalLight('#fff4de', 1.38); sun.position.set(45, 72, 36); group.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), clayMat('#d2cbc0', 0.92));
  ground.rotation.x = -Math.PI / 2; group.add(ground);

  // Full Paved Avenue Grid + Lane Lines + Turquoise River + Cable Bridge + TV Tower!
  const roadM = clayMat('#475569', 0.88);
  const lineM = clayMat('#f1f5f9', 0.8);
  [-32, -12, 12, 38].forEach((zRoad) => {
    group.add(rbox(260, 0.08, 6.2, 0.02, roadM, 0, 0.04, zRoad, false));
    for (let x = -90; x <= 90; x += 8) group.add(rbox(3.2, 0.09, 0.24, 0.01, lineM, x, 0.045, zRoad, false));
  });
  [-34, -12].forEach((xRoad) => {
    group.add(rbox(6.2, 0.08, 260, 0.02, roadM, xRoad, 0.04, 0, false));
  });

  group.add(rbox(20, 0.12, 320, 0.04, '#38bdf8', 26, 0.06, 0, false));
  group.add(rbox(14, 0.12, 160, 0.04, '#5e964b', 9, 0.06, -10, false));
  group.add(rbox(28, 0.9, 6.6, 0.1, '#e2e8f0', 26, 1.5, 12, false));
  [[19, 9.0], [19, 15.0], [33, 9.0], [33, 15.0]].forEach(([px, pz]) => {
    group.add(rbox(0.95, 9.5, 0.95, 0.08, '#f8fafc', px, 5.2, pz, false));
  });

  // Landmark TV Tower
  const tvTower = new THREE.Group(); tvTower.position.set(-22, 0, -22);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2.4, 38, 12), clayMat('#e2e8f0', 0.65)); shaft.position.y = 19;
  const orb1 = new THREE.Mesh(new THREE.SphereGeometry(3.4, 16, 12), clayMat('#e07a5f', 0.45)); orb1.position.y = 15;
  const orb2 = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 12), clayMat('#38bdf8', 0.35)); orb2.position.y = 29;
  tvTower.add(shaft, orb1, orb2); group.add(tvTower);

  // 48 Moving Cars & Buses on City Avenues!
  const vehicles = [];
  const carCols = ['#ef4444', '#0284c7', '#f59e0b', '#10b981', '#f8fafc', '#6366f1'];
  for (let v = 0; v < 48; v++) {
    const alongX = v < 32;
    const m = v % 6 === 0 ? createLowPolyBus('#f59e0b') : createLowPolyCar(carCols[v % carCols.length]);
    m.scale.setScalar(0.85); group.add(m);
    const roadCoord = alongX ? [-32, -12, 12, 38][v % 4] : [-34, -12][v % 2];
    const dir = v % 2 === 0 ? 1 : -1;
    if (!alongX) m.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    else if (dir < 0) m.rotation.y = Math.PI;
    vehicles.push({ mesh: m, alongX, roadCoord, lane: dir * 1.4, offset: (v * 13.7) % 180 - 90, dir, spd: 8 + (v % 4) * 2.2 });
  }

  // 165 Skyscrapers That VISIBLY LEAN & SHATTER DARK AS THE 194dB SHOCKWAVE HITS THEM!
  const facades = [FACADE_GLASS, FACADE_OFFICE, FACADE_APT];
  const roofM = clayMat('#94a3b8', 0.85);
  const shatMatShared = new THREE.MeshStandardMaterial({ map: FACADE_SHATTERED, roughness: 0.55 });
  const buildings = [];
  for (let i = 0; i < 165; i++) {
    const angle = prand(i * 2.13) * Math.PI * 2;
    const radius = 9.0 + Math.pow(prand(i * 4.71), 0.8) * 66;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (x > 0 && x < 39) continue;
    if (Math.abs(z + 32) < 5.5 || Math.abs(z + 12) < 5.5 || Math.abs(z - 12) < 5.5 || Math.abs(z - 38) < 5.5) continue;
    if (Math.abs(x + 34) < 5.5 || Math.abs(x + 12) < 5.5) continue;
    if (Math.hypot(x + 22, z + 22) < 8) continue;

    const w = 3.4 + prand(i * 6.17) * 4.4;
    const d = 3.4 + prand(i * 8.31) * 4.4;
    const h = (radius < 28 ? 14 : 7) + prand(i * 10.9) * 24;
    const t = facades[i % facades.length].clone(); t.needsUpdate = true;
    t.repeat.set(Math.max(1, Math.round(w / 4.5)), Math.max(1, Math.round(h / 11)));
    const wallMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.65 });
    const pivot = new THREE.Group(); pivot.position.set(x, 0, z);
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [wallMat, wallMat, roofM, roofM, wallMat, wallMat]);
    box.position.y = h / 2; pivot.add(box);
    group.add(pivot);
    buildings.push({ pivot, box, intactMats: [wallMat, wallMat, roofM, roofM, wallMat, wallMat], shatMats: [shatMatShared, shatMatShared, roofM, roofM, shatMatShared, shatMatShared], dist: radius, ang: angle });
  }

  const beamCore = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 2.0, 220, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  beamCore.position.y = 110;
  const beamGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 5.2, 220, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  beamGlow.position.y = 110;
  group.add(beamCore, beamGlow);

  const sonicDome = createSonicDome('#7dd3fc', 2.2); sonicDome.mesh.position.y = 1.0; group.add(sonicDome.mesh);
  const groundWaveMat = new THREE.MeshBasicMaterial({ color: '#fde047', transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const groundWave = new THREE.Mesh(new THREE.RingGeometry(0.90, 1.0, 64), groundWaveMat);
  groundWave.rotation.x = -Math.PI / 2; groundWave.position.y = 0.8; group.add(groundWave);

  // 130 Swirling Colorful Pillows + Blankets + Red Alarm Phones + Floating ×2 Sprites!
  const cityDebris = [];
  const pGeo = new RoundedBoxGeometry(1.6, 0.38, 1.05, 2, 0.14);
  const phoneGeo = new THREE.BoxGeometry(0.9, 1.5, 0.12);
  const pMats = [clayMat('#ffffff'), clayMat('#38bdf8'), clayMat('#f97316'), clayMat('#fde047'), new THREE.MeshBasicMaterial({ map: ALARM_TEX })];
  for (let i = 0; i < 130; i++) {
    const isPh = i >= 105;
    const m = new THREE.Mesh(isPh ? phoneGeo : pGeo, isPh ? pMats[4] : pMats[i % 4]);
    group.add(m);
    cityDebris.push({ mesh: m, ang: prand(i * 3.7) * Math.PI * 2, rad: 8 + prand(i * 5.9) * 56, y0: 8 + prand(i * 7.1) * 44, spd: 0.35 + prand(i * 2.3) * 0.65, seed: i * 1.9 });
  }

  return { group, buildings, vehicles, beamCore, beamGlow, sonicDome, groundWave, groundWaveMat, cityDebris };
}

// ===========================================================================
// WORLD 4: RICH SPACE (CLOUDY EARTH + SPACE STATION + ASTRONAUT + 7-SHIP ALIEN ARMADA!)
// ===========================================================================
export function buildAlarmSpace() {
  const group = new THREE.Group();
  group.visible = false;
  group.add(new THREE.HemisphereLight('#dbeafe', '#0f172a', 0.72));
  const sun = new THREE.DirectionalLight('#fff7ed', 1.48); sun.position.set(16, 10, 14); group.add(sun);

  const starCount = 1600;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = prand(i * 1.7 + 1) * 2 * Math.PI;
    const phi = Math.acos(2 * prand(i * 2.9 + 2) - 1);
    const r = 85 + prand(i * 4.3) * 120;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  group.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#e2e8f0', size: 0.6 })));

  const { earthTex } = makeEarthTextures();
  const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(3.45, 72, 72), new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.68, metalness: 0.08 }));
  group.add(earthMesh);

  // Soft Volumetric-Style Floating Clouds around Earth!
  const clouds = new THREE.Group();
  const cMat = clayMat('#ffffff', 0.9, 0, { transparent: true, opacity: 0.85 });
  for (let i = 0; i < 32; i++) {
    const th = prand(i * 2.3 + 1) * Math.PI * 2;
    const ph = Math.acos(2 * prand(i * 4.7 + 2) - 1);
    const cg = new THREE.Group();
    cg.position.set(3.62 * Math.sin(ph) * Math.cos(th), 3.62 * Math.cos(ph), 3.62 * Math.sin(ph) * Math.sin(th));
    cg.lookAt(0, 0, 0);
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 1), cMat); s.scale.set(1.5, 0.7, 0.25); cg.add(s);
    clouds.add(cg);
  }
  group.add(clouds);

  const atmosShell = new THREE.Mesh(
    new THREE.SphereGeometry(3.88, 48, 48),
    new THREE.ShaderMaterial({
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
      vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vNormal; void main() { float i = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0); gl_FragColor = vec4(0.35, 0.78, 1.0, 1.0) * clamp(i, 0.0, 1.0) * 0.92; }`,
    })
  );
  group.add(atmosShell);

  // Orbiting Space Station + Floating Panicked Astronaut covering ears!
  const station = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.5, 10), clayMat('#f8fafc', 0.4, 0.3));
  hull.rotation.z = Math.PI / 2;
  const solar = clayMat('#1d4ed8', 0.25, 0.4, { emissive: '#0284c7', emissiveIntensity: 0.35 });
  station.add(hull, rbox(0.55, 0.04, 2.4, 0.01, solar, -0.55, 0, 0, false), rbox(0.55, 0.04, 2.4, 0.01, solar, 0.55, 0, 0, false));
  const astro = createCharacter({ hoodie: '#f8fafc', hoodieTrim: '#f97316', pants: '#e2e8f0', lightweight: true });
  astro.root.scale.setScalar(0.32); astro.root.position.set(0.35, 0.35, 0.45);
  astro.armL.rotation.x = -2.4; astro.armR.rotation.x = -2.4;
  station.add(astro.root);
  station.position.set(-3.2, 2.5, 2.8);
  group.add(station);

  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 2), clayMat('#cbd5e1', 0.92, 0, { flatShading: true }));
  moon.position.set(-4.4, 3.8, -5.5); group.add(moon);

  // 3 Concentric Pulsing Sonic Rings Expanding from East Asia into Orbit!
  const earthPulses = [];
  for (let i = 0; i < 3; i++) {
    const ep = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.055, 10, 36),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? '#fde047' : '#38bdf8', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
    );
    ep.position.set(0.65, 0.85, 3.38); ep.lookAt(1.3, 1.7, 6.7);
    group.add(ep);
    earthPulses.push({ mesh: ep, phase: i / 3 });
  }
  const earthCoreGlow = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), new THREE.MeshBasicMaterial({ color: '#fffbeb' }));
  earthCoreGlow.position.set(0.65, 0.85, 3.38); group.add(earthCoreGlow);

  // 7-SHIP ALIEN INVASION ARMADA (1 Giant Mothership + 6 Escort Saucers!)
  const ufoFleet = new THREE.Group();
  const makeUfo = (sc = 1.0) => {
    const u = new THREE.Group();
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.25, 0.34, 24), clayMat('#64748b', 0.25, 0.75));
    const rimMat = new THREE.MeshBasicMaterial({ color: '#22c55e' });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.09, 10, 28), rimMat); rim.rotation.x = Math.PI / 2;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), clayMat('#4ade80', 0.15, 0.2, { emissive: '#22c55e', emissiveIntensity: 0.65 }));
    dome.position.y = 0.14;
    const exhaust = new THREE.Mesh(new THREE.ConeGeometry(0.30, 2.4, 12), new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.0 }));
    exhaust.rotation.x = Math.PI / 2; exhaust.position.z = -1.8;
    u.add(saucer, rim, dome, exhaust); u.scale.setScalar(sc);
    u.userData = { exhaust, rimMat };
    return u;
  };
  const formations = [
    [0, 0, 0, 1.25], [-2.2, 0.8, -1.0, 0.68], [2.2, -0.6, -1.0, 0.68],
    [-3.6, -0.9, -2.2, 0.55], [3.5, 0.9, -2.2, 0.55], [-1.4, -1.5, -1.8, 0.52], [1.6, 1.4, -1.8, 0.52],
  ];
  const ufoShips = formations.map(([x, y, z, sc]) => {
    const s = makeUfo(sc); s.position.set(x, y, z); ufoFleet.add(s); return s;
  });

  const warnSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.15, 0.82),
    new THREE.MeshBasicMaterial({ map: ALIEN_WARN_TEX, transparent: true, side: THREE.DoubleSide })
  );
  warnSign.position.set(0, 1.45, 0.45); warnSign.visible = false; ufoFleet.add(warnSign);
  ufoFleet.visible = false;
  group.add(ufoFleet);

  return { group, earthMesh, clouds, atmosShell, station, moon, earthPulses, earthCoreGlow, ufoFleet, ufoShips, warnSign };
}

import * as THREE from '../node_modules/three/build/three.module.js';
import {
  makeVoxelFaceTexture,
  makeWoodTexture,
  makeBlanketTexture,
  makeGameScreenTexture,
  makePosterTexture,
  makeWindowSkylineTexture,
  makeBuildingFacadeTexture,
  makeEarthTextures,
} from './textures.js';

export function prand(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function vox(w, h, d, colorOrMat, x = 0, y = 0, z = 0, cast = true) {
  const mat =
    typeof colorOrMat === 'string' || typeof colorOrMat === 'number'
      ? new THREE.MeshStandardMaterial({ color: colorOrMat, roughness: 0.62, metalness: 0.06 })
      : colorOrMat;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

const FACES = {
  calm: makeVoxelFaceTexture('calm'),
  sweat: makeVoxelFaceTexture('sweat'),
  panic: makeVoxelFaceTexture('panic'),
  fierce: makeVoxelFaceTexture('fierce'),
  sleep: makeVoxelFaceTexture('sleep'),
  charred: makeVoxelFaceTexture('charred'),
};

const GAME_TEX = makeGameScreenTexture();
const WOOD_TEX = makeWoodTexture();
const WINDOW_TEX = makeWindowSkylineTexture();
const FACADE_BLUE = makeBuildingFacadeTexture('#1e293b', 0.55);
const FACADE_SLATE = makeBuildingFacadeTexture('#273449', 0.45);
const FACADE_DARK = makeBuildingFacadeTexture('#172033', 0.6);

// ---------------------------------------------------------------------------
// 1. CRISP VOXEL PHONE BUILDER
// ---------------------------------------------------------------------------
export function createVoxelPhone() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.32,
    metalness: 0.55,
    emissive: new THREE.Color('#000000'),
    emissiveIntensity: 0,
  });
  const body = vox(0.68, 0.36, 0.07, bodyMat, 0, 0, 0);
  const caseRim = vox(0.72, 0.40, 0.055, '#334155', 0, 0, -0.008);
  group.add(caseRim, body);

  const screenMat = new THREE.MeshStandardMaterial({
    map: GAME_TEX,
    emissive: new THREE.Color('#38bdf8'),
    emissiveMap: GAME_TEX,
    emissiveIntensity: 0.95,
    roughness: 0.2,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.60, 0.29), screenMat);
  screen.position.z = 0.037;
  group.add(screen);

  group.add(vox(0.16, 0.16, 0.03, '#0f172a', -0.22, 0.06, -0.045));
  group.add(vox(0.05, 0.05, 0.02, '#38bdf8', -0.25, 0.09, -0.062));
  group.add(vox(0.05, 0.05, 0.02, '#38bdf8', -0.18, 0.09, -0.062));
  group.add(vox(0.05, 0.05, 0.02, '#38bdf8', -0.25, 0.02, -0.062));

  const light = new THREE.PointLight('#38bdf8', 1.4, 8, 1.7);
  light.position.set(0, 0.14, 0.28);
  group.add(light);

  return { group, bodyMat, caseRim, screenMat, light };
}

// ---------------------------------------------------------------------------
// 2. CRISP MAGICA-VOXEL CHARACTER BUILDER
// ---------------------------------------------------------------------------
export function createVoxelHuman({
  shirt = '#0ea5e9',
  hood = '#38bdf8',
  pants = '#1e293b',
  shoes = '#f8fafc',
  hair = '#151b2c',
  withPhone = true,
  withHeadphones = false,
  sitting = false,
} = {}) {
  const root = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: '#fcd5b5', roughness: 0.65 });
  const faceMat = new THREE.MeshStandardMaterial({ map: FACES.calm, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 0.55 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.58 });
  const hoodMat = new THREE.MeshStandardMaterial({ color: hood, roughness: 0.52 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pants, roughness: 0.72 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: shoes, roughness: 0.48 });

  const torso = vox(0.76, 0.86, 0.44, shirtMat, 0, 0.86, 0);
  const pocket = vox(0.50, 0.24, 0.06, hoodMat, 0, 0.64, 0.24);
  const hoodBack = vox(0.68, 0.24, 0.22, hoodMat, 0, 1.24, -0.22);
  const collar = vox(0.66, 0.12, 0.48, hoodMat, 0, 1.30, 0.02);
  const drawL = vox(0.04, 0.26, 0.04, '#f8fafc', -0.11, 1.12, 0.24);
  const drawR = vox(0.04, 0.26, 0.04, '#f8fafc', 0.11, 1.12, 0.24);
  root.add(torso, pocket, hoodBack, collar, drawL, drawR);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.72, 0);
  root.add(headGroup);

  const headMats = [skinMat, skinMat, hairMat, skinMat, faceMat, hairMat];
  const headCube = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.74, 0.74), headMats);
  headCube.castShadow = true;
  headCube.receiveShadow = true;
  headGroup.add(headCube);

  headGroup.add(vox(0.84, 0.18, 0.82, hairMat, 0, 0.37, -0.02));
  headGroup.add(vox(0.84, 0.58, 0.16, hairMat, 0, 0.08, -0.35));
  headGroup.add(vox(0.10, 0.44, 0.62, hairMat, -0.38, 0.14, -0.06));
  headGroup.add(vox(0.10, 0.44, 0.62, hairMat, 0.38, 0.14, -0.06));
  headGroup.add(vox(0.24, 0.14, 0.10, hairMat, -0.26, 0.28, 0.37));
  headGroup.add(vox(0.28, 0.18, 0.10, hairMat, 0.04, 0.27, 0.37));
  headGroup.add(vox(0.20, 0.13, 0.10, hairMat, 0.28, 0.29, 0.37));
  headGroup.add(vox(0.10, 0.18, 0.10, hairMat, 0.08, 0.52, 0.02));
  headGroup.add(vox(0.12, 0.08, 0.10, hairMat, 0.16, 0.59, 0.02));

  if (withHeadphones) {
    headGroup.add(vox(0.92, 0.08, 0.14, '#1e293b', 0, 0.46, 0));
    headGroup.add(vox(0.12, 0.28, 0.26, '#0f172a', -0.45, 0.02, 0));
    headGroup.add(vox(0.12, 0.28, 0.26, '#0f172a', 0.45, 0.02, 0));
    headGroup.add(vox(0.04, 0.16, 0.16, new THREE.MeshBasicMaterial({ color: '#38bdf8' }), -0.51, 0.02, 0));
    headGroup.add(vox(0.04, 0.16, 0.16, new THREE.MeshBasicMaterial({ color: '#38bdf8' }), 0.51, 0.02, 0));
  }

  const armL = new THREE.Group();
  armL.position.set(-0.52, 1.18, 0);
  const armR = new THREE.Group();
  armR.position.set(0.52, 1.18, 0);
  if (withPhone) {
    armL.add(vox(0.24, 0.24, 0.62, shirtMat, 0.06, -0.10, 0.28));
    armL.add(vox(0.20, 0.20, 0.18, skinMat, 0.14, -0.10, 0.62));
    armR.add(vox(0.24, 0.24, 0.62, shirtMat, -0.06, -0.10, 0.28));
    armR.add(vox(0.20, 0.20, 0.18, skinMat, -0.14, -0.10, 0.62));
  } else {
    armL.add(vox(0.24, 0.66, 0.24, shirtMat, 0, -0.26, 0));
    armL.add(vox(0.20, 0.18, 0.20, skinMat, 0, -0.62, 0));
    armR.add(vox(0.24, 0.66, 0.24, shirtMat, 0, -0.26, 0));
    armR.add(vox(0.20, 0.18, 0.20, skinMat, 0, -0.62, 0));
  }
  root.add(armL, armR);

  const legL = new THREE.Group();
  const legR = new THREE.Group();
  if (sitting) {
    legL.position.set(-0.20, 0.42, 0.12);
    legL.add(vox(0.28, 0.26, 0.72, pantsMat, 0, 0, 0.34));
    legL.add(vox(0.30, 0.28, 0.22, shoeMat, 0, -0.02, 0.75));
    legR.position.set(0.20, 0.42, 0.12);
    legR.add(vox(0.28, 0.26, 0.72, pantsMat, 0, 0, 0.34));
    legR.add(vox(0.30, 0.28, 0.22, shoeMat, 0, -0.02, 0.75));
  } else {
    legL.position.set(-0.20, 0.44, 0);
    legL.add(vox(0.28, 0.56, 0.30, pantsMat, 0, -0.22, 0));
    legL.add(vox(0.30, 0.18, 0.38, shoeMat, 0, -0.52, 0.05));
    legR.position.set(0.20, 0.44, 0);
    legR.add(vox(0.28, 0.56, 0.30, pantsMat, 0, -0.22, 0));
    legR.add(vox(0.30, 0.18, 0.38, shoeMat, 0, -0.52, 0.05));
  }
  root.add(legL, legR);

  let phone = null;
  if (withPhone) {
    phone = createVoxelPhone();
    phone.group.position.set(0, 1.05, 0.78);
    phone.group.rotation.x = -0.52;
    root.add(phone.group);
  }

  function setExpression(expr) {
    if (FACES[expr]) {
      faceMat.map = FACES[expr];
      faceMat.needsUpdate = true;
    }
  }

  return { root, headGroup, armL, armR, legL, legR, phone, setExpression };
}

// Reusable Voxel Helicopter Builder (Used in Act 2 & Act 3!)
function createVoxelHelicopter(bodyColor = '#ef4444', accent = '#f8fafc') {
  const heli = new THREE.Group();
  heli.add(vox(2.4, 1.1, 1.2, bodyColor, 0, 0, 0));
  heli.add(vox(1.1, 0.8, 1.08, '#7dd3fc', 0.9, 0.05, 0)); // cockpit glass
  heli.add(vox(2.6, 0.35, 0.35, accent, -2.2, 0.15, 0)); // tail boom
  heli.add(vox(0.35, 0.95, 0.25, bodyColor, -3.4, 0.45, 0)); // tail fin
  // Landing skids
  heli.add(vox(2.2, 0.12, 0.14, '#334155', 0.1, -0.78, 0.62));
  heli.add(vox(2.2, 0.12, 0.14, '#334155', 0.1, -0.78, -0.62));
  // Spinning main rotor
  const rotor = new THREE.Group();
  rotor.position.set(0, 0.72, 0);
  rotor.add(vox(5.2, 0.08, 0.22, '#e2e8f0', 0, 0, 0, false));
  rotor.add(vox(0.22, 0.08, 5.2, '#e2e8f0', 0, 0, 0, false));
  heli.add(rotor);
  // Searchlight dot
  heli.add(vox(0.25, 0.25, 0.25, new THREE.MeshBasicMaterial({ color: '#fef08a' }), 1.25, -0.42, 0, false));
  return { heli, rotor };
}

// ---------------------------------------------------------------------------
// 3. ACT 1: ULTRA-DENSE VOXEL UNIVERSITY DORM DIORAMA (MAX PROPS & LIFE!)
// ---------------------------------------------------------------------------
export function buildDormRoom() {
  const group = new THREE.Group();

  group.add(new THREE.HemisphereLight('#93c5fd', '#1e293b', 0.95));
  const moonDir = new THREE.DirectionalLight('#bae6fd', 1.18);
  moonDir.position.set(-6, 10, 7);
  moonDir.castShadow = true;
  moonDir.shadow.mapSize.set(1024, 1024);
  group.add(moonDir);

  const lampLight = new THREE.PointLight('#ffb74d', 3.0, 12, 1.5);
  lampLight.position.set(-1.95, 2.35, -1.9);
  lampLight.castShadow = true;
  group.add(lampLight);

  const deskRgbLight = new THREE.PointLight('#38bdf8', 2.0, 8, 1.5);
  deskRgbLight.position.set(2.1, 2.1, -1.8);
  group.add(deskRgbLight);

  const alarmLight = new THREE.PointLight('#ff1e1e', 0, 16, 1.3);
  alarmLight.position.set(0.2, 4.9, 0.2);
  group.add(alarmLight);

  // Thick isometric architectural floor slab + multi-layer pixel rug
  group.add(vox(8.8, 0.45, 8.8, new THREE.MeshStandardMaterial({ map: WOOD_TEX, roughness: 0.72 }), 0, -0.225, 0, false));
  group.add(vox(9.0, 0.16, 9.0, '#0f172a', 0, -0.49, 0, false));
  group.add(vox(3.8, 0.04, 3.0, '#1e3a5f', 0.3, 0.02, 0.85, false));
  group.add(vox(3.3, 0.045, 2.5, '#2563eb', 0.3, 0.024, 0.85, false));
  group.add(vox(2.6, 0.05, 1.8, '#38bdf8', 0.3, 0.028, 0.85, false));
  group.add(vox(2.1, 0.055, 1.3, '#1d4ed8', 0.3, 0.032, 0.85, false));

  // Cutaway Dorm Walls + Wainscoting Trim
  const wallMat = new THREE.MeshStandardMaterial({ color: '#1b2a47', roughness: 0.8 });
  const trimMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.6 });
  group.add(vox(8.8, 5.5, 0.34, wallMat, 0, 2.75, -4.23, false));
  group.add(vox(0.34, 5.5, 8.8, wallMat, -4.23, 2.75, 0, false));
  group.add(vox(8.8, 0.24, 0.08, trimMat, 0, 0.12, -4.04, false));
  group.add(vox(0.08, 0.24, 8.8, trimMat, -4.04, 0.12, 0, false));

  // Large Dorm Window + Curtains + Fairy String Lights + Potted Plants!
  group.add(vox(3.2, 2.6, 0.22, '#e2e8f0', 0.35, 3.25, -4.05));
  const winPane = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 2.26), new THREE.MeshBasicMaterial({ map: WINDOW_TEX }));
  winPane.position.set(0.35, 3.25, -3.92);
  group.add(winPane);
  group.add(vox(0.08, 2.26, 0.08, '#cbd5e1', 0.35, 3.25, -3.90));
  group.add(vox(2.86, 0.08, 0.08, '#cbd5e1', 0.35, 3.45, -3.90));
  group.add(vox(3.4, 0.12, 0.42, '#cbd5e1', 0.35, 1.92, -3.86));
  // 2 potted succulents on windowsill
  group.add(vox(0.24, 0.22, 0.24, '#c2410c', -0.75, 2.09, -3.82));
  group.add(vox(0.16, 0.28, 0.16, '#22c55e', -0.75, 2.32, -3.82));
  group.add(vox(0.22, 0.18, 0.22, '#f59e0b', 1.35, 2.07, -3.82));
  group.add(vox(0.26, 0.22, 0.26, '#10b981', 1.35, 2.24, -3.82));
  // Curtain rod + curtains + glowing warm fairy lights!
  group.add(vox(4.0, 0.07, 0.07, '#94a3b8', 0.35, 4.65, -3.86));
  group.add(vox(0.42, 2.85, 0.22, '#3b82f6', -1.32, 3.2, -3.84));
  group.add(vox(0.42, 2.85, 0.22, '#3b82f6', 2.02, 3.2, -3.84));
  for (let fl = 0; fl < 9; fl++) {
    const fx = -1.1 + fl * 0.36;
    const fy = 4.54 - Math.sin((fl / 8) * Math.PI) * 0.24;
    group.add(vox(0.09, 0.09, 0.09, new THREE.MeshBasicMaterial({ color: fl % 2 === 0 ? '#fde047' : '#38bdf8' }), fx, fy, -3.76, false));
  }

  // Wall Air Conditioner + Neon "WIN" Accent Bar
  group.add(vox(1.75, 0.52, 0.42, '#f1f5f9', 3.05, 4.6, -3.84));
  group.add(vox(1.55, 0.08, 0.08, '#334155', 3.05, 4.44, -3.62));
  group.add(vox(0.10, 0.06, 0.05, new THREE.MeshBasicMaterial({ color: '#22c55e' }), 3.72, 4.66, -3.62));
  // Glowing Neon Wall Accent Strip on Left Wall
  group.add(vox(0.06, 0.10, 2.4, new THREE.MeshBasicMaterial({ color: '#f43f5e' }), -4.02, 4.45, -1.2, false));
  group.add(vox(0.06, 0.10, 1.8, new THREE.MeshBasicMaterial({ color: '#38bdf8' }), -4.02, 4.25, -1.2, false));

  // Posters & Wall Shelf with Books + Trophies + Mini Fridge!
  const poster1 = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.32), new THREE.MeshBasicMaterial({ map: makePosterTexture(0) }));
  poster1.rotation.y = Math.PI / 2;
  poster1.position.set(-4.04, 3.35, -2.0);
  const poster2 = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.18), new THREE.MeshBasicMaterial({ map: makePosterTexture(1) }));
  poster2.rotation.y = Math.PI / 2;
  poster2.position.set(-4.04, 3.35, -0.55);
  group.add(poster1, poster2);

  group.add(vox(0.48, 0.09, 2.5, '#854d0e', -3.82, 2.65, 1.75));
  ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#facc15', '#06b6d4'].forEach((col, i) => {
    const bh = 0.36 + (i % 3) * 0.08;
    group.add(vox(0.32, bh, 0.11, col, -3.84, 2.7 + bh / 2, 0.72 + i * 0.15));
  });
  // Mini-Fridge + Microwave Stack against Left Front Wall!
  group.add(vox(0.95, 1.35, 0.95, '#e2e8f0', -3.55, 0.675, 2.85));
  group.add(vox(0.06, 0.55, 0.08, '#64748b', -3.05, 0.95, 2.55));
  group.add(vox(0.75, 0.48, 0.62, '#1e293b', -3.55, 1.59, 2.85));
  group.add(vox(0.05, 0.32, 0.38, new THREE.MeshBasicMaterial({ color: '#38bdf8' }), -3.16, 1.60, 2.92));

  // HERO BED (Xiaojiu's Bed with Wooden Frame, Plushie, Nightstand, Lamp, Ramen & Cola!)
  const bedGroup = new THREE.Group();
  bedGroup.position.set(-1.85, 0, -1.25);
  group.add(bedGroup);
  const woodDark = '#5c3a21';
  bedGroup.add(vox(2.65, 0.56, 3.55, woodDark, 0, 0.28, 0));
  bedGroup.add(vox(2.75, 1.65, 0.22, woodDark, 0, 0.85, -1.72));
  bedGroup.add(vox(2.75, 0.92, 0.18, woodDark, 0, 0.46, 1.72));
  bedGroup.add(vox(2.50, 0.36, 3.32, '#e2e8f0', 0, 0.72, 0));

  const blanketMat = new THREE.MeshStandardMaterial({
    map: makeBlanketTexture('#1d4ed8', '#60a5fa'),
    roughness: 0.84,
    emissive: new THREE.Color('#000000'),
    emissiveIntensity: 0,
  });
  bedGroup.add(vox(2.58, 0.40, 2.15, blanketMat, 0, 0.82, 0.55));
  bedGroup.add(vox(1.32, 0.32, 0.68, '#f8fafc', 0, 1.06, -1.24));
  // Cute orange voxel cat plushie next to pillow
  bedGroup.add(vox(0.34, 0.34, 0.34, '#fb923c', -0.92, 1.07, -1.12));
  bedGroup.add(vox(0.08, 0.10, 0.08, '#ea580c', -1.03, 1.28, -1.12));
  bedGroup.add(vox(0.08, 0.10, 0.08, '#ea580c', -0.81, 1.28, -1.12));

  // Bedside Nightstand + Glowing Lamp + Digital Clock + Cola + Cup Ramen
  group.add(vox(0.95, 1.05, 0.95, woodDark, -3.45, 0.525, -2.65));
  group.add(vox(0.18, 0.42, 0.18, '#334155', -3.45, 1.26, -2.65));
  group.add(vox(0.56, 0.42, 0.56, new THREE.MeshStandardMaterial({ color: '#fef3c7', emissive: '#fb923c', emissiveIntensity: 1.05 }), -3.45, 1.66, -2.65));
  group.add(vox(0.28, 0.16, 0.16, '#0f172a', -3.22, 1.13, -2.32));
  group.add(vox(0.20, 0.08, 0.02, new THREE.MeshBasicMaterial({ color: '#38bdf8' }), -3.22, 1.13, -2.23));
  group.add(vox(0.13, 0.25, 0.13, '#ef4444', -3.65, 1.18, -2.32));
  group.add(vox(0.20, 0.22, 0.20, '#facc15', -3.45, 1.16, -2.25));

  // FULL DUAL-MONITOR RGB GAMING DESK SETUP (Back-Right)
  const deskGroup = new THREE.Group();
  deskGroup.position.set(2.35, 0, -2.75);
  group.add(deskGroup);
  deskGroup.add(vox(2.85, 0.12, 1.32, '#1e293b', 0, 1.26, 0));
  deskGroup.add(vox(0.12, 1.26, 1.22, '#0f172a', -1.34, 0.63, 0));
  deskGroup.add(vox(0.12, 1.26, 1.22, '#0f172a', 1.34, 0.63, 0));
  deskGroup.add(vox(2.85, 0.06, 0.06, new THREE.MeshBasicMaterial({ color: '#38bdf8' }), 0, 1.24, 0.67));
  // Dual Glowing Monitors!
  deskGroup.add(vox(1.12, 0.68, 0.08, '#0f172a', -0.62, 1.82, -0.35));
  const mon1 = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.58), new THREE.MeshBasicMaterial({ map: GAME_TEX }));
  mon1.position.set(-0.62, 1.82, -0.30);
  deskGroup.add(mon1);
  deskGroup.add(vox(0.75, 0.56, 0.08, '#0f172a', 0.36, 1.76, -0.28));
  deskGroup.add(vox(0.65, 0.46, 0.02, new THREE.MeshBasicMaterial({ color: '#a855f7' }), 0.36, 1.76, -0.23));
  // RGB PC Tower + Mechanical Keyboard + Red/Black Gaming Chair
  deskGroup.add(vox(0.46, 0.88, 0.78, '#0f172a', 1.02, 1.76, -0.10));
  deskGroup.add(vox(0.05, 0.70, 0.58, new THREE.MeshBasicMaterial({ color: '#0ea5e9' }), 0.78, 1.76, -0.10));
  deskGroup.add(vox(0.72, 0.05, 0.24, '#334155', -0.45, 1.34, 0.22));
  deskGroup.add(vox(0.66, 0.02, 0.18, new THREE.MeshBasicMaterial({ color: '#38bdf8' }), -0.45, 1.37, 0.22));

  const chair = new THREE.Group();
  chair.position.set(-0.45, 0, 1.25);
  chair.rotation.y = -0.45;
  chair.add(vox(0.76, 0.14, 0.72, '#1e293b', 0, 0.76, 0));
  chair.add(vox(0.72, 1.15, 0.16, '#ef4444', 0, 1.38, 0.30));
  chair.add(vox(0.12, 0.68, 0.12, '#475569', 0, 0.38, 0));
  chair.add(vox(0.76, 0.08, 0.12, '#475569', 0, 0.08, 0));
  chair.add(vox(0.12, 0.08, 0.76, '#475569', 0, 0.08, 0));
  deskGroup.add(chair);

  // ROOMMATE'S BED & EXPRESSIVE FRONT-FACING ROOMMATE NPC (Turned so viewer clearly sees his funny reaction!)
  const mateBed = new THREE.Group();
  mateBed.position.set(2.35, 0, 1.85);
  group.add(mateBed);
  mateBed.add(vox(2.45, 0.52, 3.15, woodDark, 0, 0.26, 0));
  mateBed.add(vox(2.35, 0.34, 3.0, '#e2e8f0', 0, 0.68, 0));
  mateBed.add(vox(2.42, 0.38, 1.95, new THREE.MeshStandardMaterial({ map: makeBlanketTexture('#15803d', '#4ade80'), roughness: 0.85 }), 0, 0.78, 0.45));
  mateBed.add(vox(1.1, 0.28, 0.6, '#f8fafc', 0, 0.98, -1.1));

  const roommate = createVoxelHuman({
    shirt: '#facc15',
    hood: '#eab308',
    pants: '#334155',
    hair: '#451a03',
    withPhone: false,
    sitting: true,
  });
  roommate.root.position.set(2.35, 0.82, 0.95);
  // Facing toward camera-left so BOTH his face AND Xiaojiu's face are clearly visible!
  roommate.root.rotation.y = -0.35;
  roommate.setExpression('sleep');
  group.add(roommate.root);

  // 3D Voxel Comic Reaction Exclamation Mark `!` floating above Roommate when panic starts!
  const panicIcon = new THREE.Group();
  panicIcon.position.set(2.35, 3.55, 0.95);
  panicIcon.add(vox(0.18, 0.58, 0.18, new THREE.MeshBasicMaterial({ color: '#ef4444' }), 0, 0.35, 0, false));
  panicIcon.add(vox(0.18, 0.18, 0.18, new THREE.MeshBasicMaterial({ color: '#fde047' }), 0, -0.10, 0, false));
  panicIcon.visible = false;
  group.add(panicIcon);

  // Spinning Ceiling Fan + Smoke Alarm!
  const ceilingFan = new THREE.Group();
  ceilingFan.position.set(0.2, 5.15, 0.1);
  ceilingFan.add(vox(0.32, 0.35, 0.32, '#334155', 0, 0.2, 0, false));
  ceilingFan.add(vox(2.4, 0.06, 0.28, '#64748b', 0, 0, 0, false));
  ceilingFan.add(vox(0.28, 0.06, 2.4, '#64748b', 0, 0, 0, false));
  group.add(ceilingFan);

  group.add(vox(0.54, 0.14, 0.54, '#e2e8f0', -1.8, 5.15, -1.2));
  const alarmLedMat = new THREE.MeshBasicMaterial({ color: '#22c55e' });
  group.add(vox(0.14, 0.10, 0.14, alarmLedMat, -1.8, 5.04, -1.2));

  // HERO VOXEL XIAOJIU
  const xiaojiu = createVoxelHuman({
    shirt: '#0284c7',
    hood: '#38bdf8',
    pants: '#1e293b',
    shoes: '#f8fafc',
    hair: '#151b2c',
    withPhone: true,
    withHeadphones: true,
    sitting: true,
  });
  xiaojiu.root.position.set(-1.85, 0.92, -1.88);
  xiaojiu.root.scale.setScalar(1.08);
  group.add(xiaojiu.root);

  // Voxel flames, smoke cubes, molten drops
  const particles = [];
  const fireMats = [
    new THREE.MeshBasicMaterial({ color: '#ef4444' }),
    new THREE.MeshBasicMaterial({ color: '#f97316' }),
    new THREE.MeshBasicMaterial({ color: '#facc15' }),
  ];
  const smokeMat = new THREE.MeshStandardMaterial({ color: '#334155', transparent: true, opacity: 0.72, roughness: 1 });
  const dripMat = new THREE.MeshBasicMaterial({ color: '#fb923c' });

  for (let i = 0; i < 120; i++) {
    const isSmoke = i < 30;
    const isDrip = i >= 30 && i < 46;
    const sz = isSmoke ? 0.26 : isDrip ? 0.085 : 0.23;
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(sz, sz, sz),
      isSmoke ? smokeMat.clone() : isDrip ? dripMat : fireMats[i % 3]
    );
    m.visible = false;
    group.add(m);
    particles.push({ mesh: m, kind: isSmoke ? 'smoke' : isDrip ? 'drip' : 'fire', seed: i * 1.41 + 0.3 });
  }

  return { group, xiaojiu, roommate, panicIcon, ceilingFan, blanketMat, alarmLight, alarmLedMat, particles };
}

// ---------------------------------------------------------------------------
// 4. ACT 2: ULTRA-DENSE VOXEL STREET BLOCK (FIRE TRUCKS + HELICOPTER + FLYING FURNITURE!)
// ---------------------------------------------------------------------------
export function buildStreetBlock() {
  const group = new THREE.Group();
  group.visible = false;

  group.add(new THREE.HemisphereLight('#93c5fd', '#0f172a', 0.88));
  const dir = new THREE.DirectionalLight('#bae6fd', 0.88);
  dir.position.set(-16, 28, 22);
  group.add(dir);
  const blastLight = new THREE.PointLight('#ff5a14', 10, 44, 1.4);
  blastLight.position.set(1.8, 10.6, 5.2);
  group.add(blastLight);

  // Sidewalk, Road, Lane Dashes, Zebra Crosswalk
  group.add(vox(96, 0.4, 96, '#0f172a', 0, -0.2, 0, false));
  group.add(vox(42, 0.24, 16, '#334155', 0, 0.12, -1.5, false));
  for (let i = -6; i <= 6; i++) group.add(vox(2.4, 0.05, 0.35, '#e2e8f0', i * 5.2, 0.03, 12.2, false));
  for (let i = -3; i <= 3; i++) group.add(vox(0.55, 0.05, 3.6, '#f8fafc', 7.5 + i * 1.15, 0.03, 12.2, false));

  // HERO 8-STORY VOXEL DORM BUILDING + Balconies + AC Units + Laundry + Roof Tank
  const heroBldMat = new THREE.MeshStandardMaterial({
    map: FACADE_BLUE,
    roughness: 0.55,
    metalness: 0.15,
    emissive: new THREE.Color('#ea580c'),
    emissiveIntensity: 0,
  });
  group.add(vox(9.2, 17.0, 6.2, heroBldMat, 0, 8.5, -2.0));
  group.add(vox(9.6, 0.6, 6.6, '#1e293b', 0, 17.2, -2.0));
  group.add(vox(2.2, 2.0, 2.2, '#475569', -2.6, 18.4, -2.0));
  group.add(vox(1.4, 1.2, 1.4, '#64748b', 2.4, 18.0, -2.2));
  group.add(vox(3.6, 0.35, 1.8, '#0ea5e9', 0, 2.5, 1.9));
  group.add(vox(2.6, 2.3, 0.2, new THREE.MeshBasicMaterial({ color: '#fde68a' }), 0, 1.2, 1.12));

  for (let fl = 1; fl <= 7; fl++) {
    const y = fl * 2.1 + 0.5;
    [-2.7, 2.7].forEach((bx) => {
      group.add(vox(2.6, 0.22, 1.1, '#475569', bx, y, 1.5));
      group.add(vox(2.6, 0.65, 0.14, '#64748b', bx, y + 0.38, 2.0));
      group.add(vox(0.7, 0.52, 0.42, '#cbd5e1', bx + (bx < 0 ? 1.55 : -1.55), y + 0.35, 1.28));
    });
  }

  // Neighboring Campus Buildings
  [
    [-12.5, 6.5, -3.5, 8.2, 13.0, 6.4, FACADE_SLATE],
    [12.8, 8.0, -3.0, 8.5, 16.0, 6.4, FACADE_DARK],
    [-14.5, 5.2, 8.5, 6.5, 10.4, 6.0, FACADE_DARK],
    [15.2, 6.0, 8.0, 6.8, 12.0, 6.0, FACADE_SLATE],
    [0, 11, -15, 24, 22, 7, FACADE_DARK],
  ].forEach(([x, y, z, w, h, d, tex]) => {
    group.add(vox(w, h, d, new THREE.MeshStandardMaterial({ map: tex, color: '#94a3b8', roughness: 0.7 }), x, y, z));
  });

  // Streetlamps & Layered Voxel Trees
  [-8.5, -4.2, 4.8, 9.8].forEach((tx, idx) => {
    if (idx % 2 === 0) {
      group.add(vox(0.22, 4.6, 0.22, '#334155', tx, 2.3, 5.8));
      group.add(vox(1.1, 0.18, 0.22, '#334155', tx + 0.45, 4.55, 5.8));
      group.add(vox(0.48, 0.16, 0.32, new THREE.MeshBasicMaterial({ color: '#fde68a' }), tx + 0.85, 4.44, 5.8));
    } else {
      group.add(vox(0.45, 1.6, 0.45, '#78350f', tx, 0.9, 5.5));
      group.add(vox(2.1, 1.4, 2.1, '#15803d', tx, 2.2, 5.5));
      group.add(vox(1.5, 1.1, 1.5, '#22c55e', tx, 3.2, 5.5));
    }
  });

  // FLASHING VOXEL FIRE TRUCK (`119`) + Civilian Cars!
  const fireTruck = new THREE.Group();
  fireTruck.position.set(-5.8, 0.55, 9.8);
  fireTruck.add(vox(4.6, 1.45, 1.85, '#dc2626', 0, 0.65, 0));
  fireTruck.add(vox(1.3, 0.75, 1.65, '#bae6fd', 1.65, 0.88, 0)); // windshield
  fireTruck.add(vox(3.6, 0.28, 0.75, '#e2e8f0', -0.4, 1.55, 0)); // roof ladder!
  const sirenR = new THREE.MeshBasicMaterial({ color: '#ef4444' });
  const sirenB = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
  fireTruck.add(vox(0.32, 0.24, 0.45, sirenR, 1.55, 1.52, -0.42, false));
  fireTruck.add(vox(0.32, 0.24, 0.45, sirenB, 1.55, 1.52, 0.42, false));
  [[-1.4, -0.95], [1.4, -0.95], [-1.4, 0.95], [1.4, 0.95]].forEach(([wx, wz]) => {
    fireTruck.add(vox(0.7, 0.7, 0.28, '#0f172a', wx, 0.0, wz));
  });
  group.add(fireTruck);

  function addVoxelCar(x, z, color, dirX = 1) {
    const car = new THREE.Group();
    car.position.set(x, 0.45, z);
    car.add(vox(2.8, 0.72, 1.45, color, 0, 0.28, 0));
    car.add(vox(1.55, 0.62, 1.32, '#e2e8f0', -0.15 * dirX, 0.86, 0));
    [[-0.85, -0.74], [0.85, -0.74], [-0.85, 0.74], [0.85, 0.74]].forEach(([wx, wz]) => {
      car.add(vox(0.55, 0.55, 0.24, '#0f172a', wx, -0.05, wz));
    });
    car.add(vox(0.12, 0.22, 1.1, new THREE.MeshBasicMaterial({ color: '#fef08a' }), 1.42 * dirX, 0.32, 0));
    car.add(vox(0.12, 0.22, 1.1, new THREE.MeshBasicMaterial({ color: '#ef4444' }), -1.42 * dirX, 0.32, 0));
    group.add(car);
  }
  addVoxelCar(3.8, 14.4, '#3b82f6', -1);
  addVoxelCar(-1.6, 14.4, '#f59e0b', -1);
  addVoxelCar(6.5, 9.8, '#10b981', 1);

  // HOVERING VOXEL NEWS HELICOPTER near 7th floor!
  const { heli: newsHeli, rotor: newsRotor } = createVoxelHelicopter('#facc15', '#0f172a');
  newsHeli.position.set(-7.5, 14.5, 7.5);
  newsHeli.rotation.y = -0.55;
  group.add(newsHeli);

  // 7 Panicked Fleeing Voxel Pedestrians!
  const runners = [];
  [
    [-6.2, 4.8, '#ec4899'],
    [-3.4, 5.4, '#22c55e'],
    [-0.8, 4.9, '#38bdf8'],
    [2.1, 5.5, '#f43f5e'],
    [4.4, 4.8, '#a855f7'],
    [6.8, 5.4, '#f59e0b'],
    [8.6, 4.9, '#14b8a6'],
  ].forEach(([rx, rz, col], idx) => {
    const p = createVoxelHuman({ shirt: col, hood: col, withPhone: false });
    p.root.position.set(rx, 0.8, rz);
    p.root.scale.setScalar(0.75);
    p.root.rotation.y = idx < 3 ? -Math.PI * 0.45 : Math.PI * 0.45;
    p.setExpression('panic');
    group.add(p.root);
    runners.push({ p, x0: rx, dir: idx < 3 ? -1 : 1 });
  });

  // CHUNKY VOXEL EXPLOSION + FLYING DORM FURNITURE (Chair, Pillow, Desk Monitor blown out of 6F!)
  const blastOrigin = new THREE.Vector3(2.4, 11.2, 1.5);
  const voxelFireCluster = [];
  const vfMats = [
    new THREE.MeshBasicMaterial({ color: '#fef08a' }),
    new THREE.MeshBasicMaterial({ color: '#f97316' }),
    new THREE.MeshBasicMaterial({ color: '#dc2626' }),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.95 }),
  ];
  for (let i = 0; i < 42; i++) {
    const sz = 0.72 + prand(i * 3.1) * 1.3;
    const m = new THREE.Mesh(new THREE.BoxGeometry(sz, sz, sz), vfMats[i % 4]);
    group.add(m);
    const a = prand(i * 5.1) * Math.PI * 2;
    const b = (prand(i * 7.3) - 0.4) * Math.PI * 0.8;
    const r = 0.4 + prand(i * 9.7) * 2.3;
    voxelFireCluster.push({ mesh: m, dx: Math.cos(a) * Math.cos(b) * r, dy: Math.sin(b) * r + 0.4, dz: Math.abs(Math.sin(a)) * r + 0.5, seed: i * 1.3 });
  }

  // Flying Voxel Chair & Pillow ejected from Xiaojiu's room!
  const flyChair = new THREE.Group();
  flyChair.add(vox(0.85, 0.16, 0.85, '#1e293b', 0, 0, 0));
  flyChair.add(vox(0.85, 1.1, 0.18, '#ef4444', 0, 0.55, -0.34));
  const flyPillow = vox(1.1, 0.34, 0.65, '#f8fafc', 0, 0, 0);
  const flyMonitor = vox(1.15, 0.72, 0.12, '#0f172a', 0, 0, 0);
  group.add(flyChair, flyPillow, flyMonitor);

  const shockRingMat = new THREE.MeshBasicMaterial({ color: '#fb923c', transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const shockRing = new THREE.Mesh(new THREE.RingGeometry(0.86, 1.0, 32), shockRingMat);
  shockRing.position.copy(blastOrigin).add(new THREE.Vector3(0, 0, 1.2));
  group.add(shockRing);

  const shards = [];
  const glassMat = new THREE.MeshStandardMaterial({ color: '#7dd3fc', emissive: '#38bdf8', emissiveIntensity: 0.45, roughness: 0.15 });
  const brickMat = new THREE.MeshStandardMaterial({ color: '#ea580c', emissive: '#dc2626', emissiveIntensity: 0.8 });
  for (let i = 0; i < 130; i++) {
    const isGlass = i % 3 !== 0;
    const s = new THREE.Mesh(isGlass ? new THREE.BoxGeometry(0.36, 0.36, 0.08) : new THREE.BoxGeometry(0.32, 0.24, 0.24), isGlass ? glassMat : brickMat);
    group.add(s);
    const ang = prand(i * 3.1) * Math.PI * 2;
    const elev = (prand(i * 5.7) - 0.28) * 1.3;
    const spd = 4.5 + prand(i * 7.3) * 12.0;
    shards.push({ mesh: s, vx: Math.cos(ang) * spd, vy: elev * spd + 2.8, vz: Math.abs(Math.sin(ang)) * spd + 4.8, rx: prand(i * 9.1) * 10, ry: prand(i * 11.3) * 10 });
  }

  return { group, heroBldMat, blastLight, blastOrigin, voxelFireCluster, shockRing, shockRingMat, shards, runners, sirenR, sirenB, newsHeli, newsRotor, flyChair, flyPillow, flyMonitor };
}

// ---------------------------------------------------------------------------
// 5. ACT 3: ULTRA-DENSE VOXEL METROPOLIS (LANDMARK TV TOWER + HIGH-SPEED TRAIN + HELIS!)
// ---------------------------------------------------------------------------
export function buildVoxelCity() {
  const group = new THREE.Group();
  group.visible = false;

  group.add(new THREE.HemisphereLight('#7dd3fc', '#0f172a', 0.75));
  const dir = new THREE.DirectionalLight('#bae6fd', 0.7);
  dir.position.set(35, 60, 28);
  group.add(dir);
  const beamLight = new THREE.PointLight('#ff5511', 20, 105, 1.4);
  beamLight.position.set(0, 16, 0);
  group.add(beamLight);

  // Ground + Glowing River + Cross-River Suspension Bridge + Elevated Viaduct Track!
  group.add(vox(260, 0.5, 260, '#091022', 0, -0.25, 0, false));
  group.add(vox(16, 0.35, 240, new THREE.MeshStandardMaterial({ color: '#0369a1', emissive: '#0284c7', emissiveIntensity: 0.34, roughness: 0.2 }), 22, 0.05, 0, false));
  group.add(vox(220, 0.14, 6.5, '#1e293b', 0, 0.08, 12, false));
  group.add(vox(6.5, 0.14, 220, '#1e293b', -12, 0.08, 0, false));
  // Suspension bridge deck + towers
  group.add(vox(24, 0.85, 7.2, '#334155', 22, 1.4, 12, false));
  [[15, 8.8], [15, 15.2], [29, 8.8], [29, 15.2]].forEach(([px, pz]) => {
    group.add(vox(0.85, 7.5, 0.85, '#f8fafc', px, 4.6, pz, false));
  });

  // Elevated High-Speed Rail Viaduct + Streaking Voxel Bullet Train (`复兴号` style!)
  group.add(vox(220, 0.75, 2.8, '#475569', 0, 5.5, 24, false));
  for (let p = -80; p <= 80; p += 16) group.add(vox(1.2, 5.5, 1.6, '#334155', p, 2.75, 24, false));
  const train = new THREE.Group();
  for (let c = 0; c < 5; c++) {
    train.add(vox(4.6, 1.15, 1.55, '#f8fafc', -c * 5.1, 6.55, 24, false));
    train.add(vox(4.4, 0.24, 1.62, new THREE.MeshBasicMaterial({ color: '#ef4444' }), -c * 5.1, 6.55, 24, false));
    train.add(vox(4.2, 0.26, 1.62, new THREE.MeshBasicMaterial({ color: '#38bdf8' }), -c * 5.1, 6.86, 24, false));
  }
  group.add(train);

  // Iconic Voxel TV Landmark Tower (Oriental-Pearl inspired voxel spheres + glowing spire!)
  const tvTower = new THREE.Group();
  tvTower.position.set(14, 0, -16);
  tvTower.add(vox(4.5, 2.5, 4.5, '#cbd5e1', 0, 1.25, 0, false));
  tvTower.add(vox(1.4, 34, 1.4, '#e2e8f0', 0, 18, 0, false));
  tvTower.add(vox(5.2, 5.2, 5.2, new THREE.MeshStandardMaterial({ color: '#f43f5e', emissive: '#e11d48', emissiveIntensity: 0.75 }), 0, 14, 0, false));
  tvTower.add(vox(3.6, 3.6, 3.6, new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 0.85 }), 0, 27, 0, false));
  tvTower.add(vox(0.45, 9.5, 0.45, '#f8fafc', 0, 39, 0, false));
  group.add(tvTower);

  // 2 Circling Voxel Helicopters over the burning metropolis!
  const helis = [createVoxelHelicopter('#ef4444', '#f8fafc'), createVoxelHelicopter('#38bdf8', '#f8fafc')];
  helis.forEach((h) => group.add(h.heli));

  // Moving glowing traffic dots along avenues
  const traffic = [];
  for (let i = 0; i < 48; i++) {
    const alongX = i < 24;
    const m = vox(1.1, 0.35, 0.65, new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? '#fef08a' : '#ef4444' }), 0, 0.45, 0, false);
    group.add(m);
    traffic.push({ mesh: m, alongX, offset: (i % 24) * 8.5 - 95, lane: i % 2 === 0 ? -1.4 : 1.4, dir: i % 2 === 0 ? 1 : -1 });
  }

  // 220 Tiered Voxel Skyscrapers with rooftops, spires, and neon billboards!
  const buildings = [];
  const neonColors = ['#38bdf8', '#f43f5e', '#facc15', '#a855f7', '#22c55e'];
  for (let i = 0; i < 220; i++) {
    const angle = prand(i * 2.13) * Math.PI * 2;
    const radius = 7.5 + Math.pow(prand(i * 4.71), 0.78) * 64;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.abs(x - 22) < 10.5 || Math.abs(z - 12) < 5.5 || Math.abs(z - 24) < 4.5 || Math.abs(x + 12) < 5.5) continue;
    if (Math.hypot(x - 14, z + 16) < 8) continue;

    const w = 2.4 + prand(i * 6.17) * 3.8;
    const d = 2.4 + prand(i * 8.31) * 3.8;
    const h = (radius < 26 ? 11 : 4.5) + prand(i * 10.9) * (radius < 28 ? 22 : 13);

    const tex = i % 3 === 0 ? FACADE_BLUE : i % 3 === 1 ? FACADE_SLATE : FACADE_DARK;
    const mat = new THREE.MeshStandardMaterial({ map: tex, color: '#94a3b8', roughness: 0.58, emissive: new THREE.Color('#0ea5e9'), emissiveIntensity: 0.14 });
    const bGroup = new THREE.Group();
    bGroup.position.set(x, 0, z);
    const mainBox = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mainBox.position.y = h / 2;
    bGroup.add(mainBox);

    if (h > 16) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.68, 2.2, d * 0.68), mat);
      cap.position.y = h + 1.1;
      bGroup.add(cap);
      bGroup.add(vox(0.24, 3.6, 0.24, '#cbd5e1', 0, h + 4.0, 0, false));
      if (i % 3 === 0) {
        bGroup.add(vox(w * 0.72, 0.95, 0.22, new THREE.MeshBasicMaterial({ color: neonColors[i % neonColors.length] }), 0, h - 1.2, d / 2 + 0.14, false));
      }
    }
    group.add(bGroup);
    buildings.push({ bGroup, mat, dist: radius, tiltDir: (i % 2 === 0 ? 1 : -1) * 0.08 });
  }

  // Square Voxel Plasma Pillar + Dual Concentric Shockwave Rings + Swirling Fire Cubes
  const beamCore = vox(2.2, 200, 2.2, new THREE.MeshBasicMaterial({ color: '#fef08a', transparent: true, opacity: 0.94, blending: THREE.AdditiveBlending }), 0, 100, 0, false);
  const beamMid = vox(4.2, 200, 4.2, new THREE.MeshBasicMaterial({ color: '#f97316', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending }), 0, 100, 0, false);
  const beamOuter = vox(6.8, 200, 6.8, new THREE.MeshBasicMaterial({ color: '#dc2626', transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending }), 0, 100, 0, false);
  group.add(beamCore, beamMid, beamOuter);

  const waveRingMat = new THREE.MeshBasicMaterial({ color: '#fb923c', transparent: true, opacity: 0.9, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const waveRing = new THREE.Mesh(new THREE.RingGeometry(0.88, 1.0, 48), waveRingMat);
  waveRing.rotation.x = -Math.PI / 2;
  waveRing.position.y = 0.9;
  const waveRing2 = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.0, 48), waveRingMat.clone());
  waveRing2.rotation.x = -Math.PI / 2;
  waveRing2.position.y = 1.6;
  group.add(waveRing, waveRing2);

  const cityDebris = [];
  for (let i = 0; i < 80; i++) {
    const m = vox(0.95, 0.95, 0.95, i % 2 === 0 ? new THREE.MeshBasicMaterial({ color: '#f97316' }) : new THREE.MeshBasicMaterial({ color: '#fde047' }), 0, 0, 0, false);
    group.add(m);
    cityDebris.push({ mesh: m, ang: prand(i * 4.1) * Math.PI * 2, r: 4 + prand(i * 6.3) * 16, spd: 0.6 + prand(i * 2.7) * 1.4, seed: i * 1.9 });
  }

  // Blocky Voxel Clouds arranged around the plasma eye (keeps center sightline crystal clear!)
  for (let i = 0; i < 38; i++) {
    const cg = new THREE.Group();
    const ang = prand(i * 3.9) * Math.PI * 2;
    const r = 42 + prand(i * 7.1) * 52;
    cg.position.set(Math.cos(ang) * r, 52 + prand(i * 5.2) * 14, Math.sin(ang) * r);
    const cMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.9, transparent: true, opacity: 0.85 });
    cg.add(vox(10, 2.4, 6, cMat, 0, 0, 0, false));
    cg.add(vox(6.5, 3.2, 4.5, cMat, 1.5, 1.6, 0.4, false));
    cg.add(vox(5.2, 2.2, 4.2, cMat, -2.8, 1.0, -0.5, false));
    group.add(cg);
  }

  return { group, buildings, traffic, train, helis, beamCore, beamMid, beamOuter, waveRing, waveRing2, waveRingMat, cityDebris };
}

// ---------------------------------------------------------------------------
// 6. ACT 4: VOXEL EARTH + SPACE STATION + SATELLITES + EVACUATING ROCKET!
// ---------------------------------------------------------------------------
export function buildVoxelSpace() {
  const group = new THREE.Group();
  group.visible = false;

  group.add(new THREE.HemisphereLight('#bae6fd', '#0f172a', 0.88));
  const sunLight = new THREE.DirectionalLight('#fff7ed', 1.35);
  sunLight.position.set(16, 10, 12);
  group.add(sunLight);

  const starCount = 1800;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const u = prand(i * 1.7 + 1);
    const v = prand(i * 2.9 + 2);
    const theta = u * 2 * Math.PI;
    const phi = Math.acos(2 * v - 1);
    const r = 90 + prand(i * 4.3) * 130;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  group.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#e2e8f0', size: 0.75 })));

  // Voxel Moon in upper-left background
  const moon = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.15, 2),
    new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.9, flatShading: true })
  );
  moon.position.set(-5.6, 5.1, -9.5);
  group.add(moon);

  // Hero Pixel-Voxel Earth with Custom GLSL Magma Shader
  const { earthTex } = makeEarthTextures();
  const earthUniforms = {
    uEarthTex: { value: earthTex },
    uTime: { value: 0 },
    uHeat: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.72, 0.38, 0.58).normalize() },
  };
  const earthMat = new THREE.ShaderMaterial({
    uniforms: earthUniforms,
    vertexShader: `varying vec2 vUv; varying vec3 vNormal; varying vec3 vPos; void main() { vUv = uv; vNormal = normalize(normalMatrix * normal); vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D uEarthTex; uniform float uTime; uniform float uHeat; uniform vec3 uSunDir;
      varying vec2 vUv; varying vec3 vNormal; varying vec3 vPos;
      float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float noise(vec3 x) {
        vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x), mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x), mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
      }
      float fbm(vec3 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.06; a *= 0.5; } return v; }
      void main() {
        vec3 n = normalize(vNormal); vec3 pDir = normalize(vPos);
        vec3 qDir = normalize(floor(pDir * 24.0) / 24.0);
        float diff = max(dot(n, uSunDir), 0.0);
        vec3 litEarth = texture2D(uEarthTex, vUv).rgb * (0.28 + 0.88 * diff);
        vec3 epic = normalize(vec3(0.22, 0.24, 0.94));
        float dEpic = distance(pDir, epic);
        float spreadRadius = uHeat * 2.55;
        float burnWave = smoothstep(spreadRadius + 0.30, spreadRadius - 0.30, dEpic);
        float n1 = fbm(mix(pDir, qDir, 0.35) * 4.4 + vec3(0.0, uTime * 0.10, uTime * 0.07));
        float n2 = fbm(pDir * 9.5 - vec3(uTime * 0.16, 0.0, 0.0));
        float ridge = abs(n1 - 0.5) * 2.15 + (n2 - 0.5) * 0.30;
        float lavaRiver = 1.0 - smoothstep(0.02, 0.25, ridge);
        float subCrack = 1.0 - smoothstep(0.015, 0.10, abs(n2 - 0.5) * 2.0);
        float lavaMask = clamp(lavaRiver + subCrack * 0.42, 0.0, 1.0);
        vec3 darkBasalt = vec3(0.06, 0.018, 0.015) * (0.65 + 0.55 * diff);
        vec3 deepCrimson = vec3(0.82, 0.08, 0.01);
        vec3 moltenOrange = vec3(1.18, 0.34, 0.02);
        vec3 brightGold = vec3(1.36, 0.84, 0.15);
        vec3 magmaCol = mix(darkBasalt, deepCrimson, smoothstep(0.08, 0.36, lavaMask));
        magmaCol = mix(magmaCol, moltenOrange, smoothstep(0.36, 0.70, lavaMask));
        magmaCol = mix(magmaCol, brightGold, smoothstep(0.72, 0.96, lavaMask));
        float frontier = smoothstep(0.26, 0.0, abs(dEpic - spreadRadius)) * smoothstep(0.05, 0.35, uHeat) * (1.0 - smoothstep(0.72, 0.96, uHeat));
        float epicFlash = exp(-dEpic * dEpic * 28.0) * smoothstep(0.02, 0.25, uHeat) * 1.15;
        vec3 finalCol = mix(litEarth, magmaCol, clamp(burnWave * smoothstep(0.06, 0.82, uHeat), 0.0, 1.0));
        finalCol += vec3(1.15, 0.42, 0.06) * frontier * 0.92 + vec3(1.3, 0.72, 0.18) * epicFlash;
        float rim = pow(1.0 - max(dot(n, vec3(0.0, 0.0, 1.0)), 0.0), 3.4);
        finalCol += mix(vec3(0.20, 0.72, 1.0), vec3(1.25, 0.38, 0.05), clamp(uHeat * 1.35, 0.0, 1.0)) * rim * (0.48 + uHeat * 0.55);
        gl_FragColor = vec4(finalCol, 1.0);
      }
    `,
  });
  const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(3.45, 56, 56), earthMat);
  group.add(earthMesh);

  // Orbiting 3D Blocky Voxel Clouds
  const voxelClouds = new THREE.Group();
  const vCloudMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.9, transparent: true, opacity: 0.92 });
  for (let i = 0; i < 36; i++) {
    const u = prand(i * 2.3 + 1);
    const v = prand(i * 4.7 + 2);
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = 3.72;
    const cg = new THREE.Group();
    cg.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    cg.lookAt(0, 0, 0);
    cg.add(vox(0.85, 0.45, 0.22, vCloudMat, 0, 0, 0, false));
    cg.add(vox(0.55, 0.35, 0.26, vCloudMat, 0.28, 0.16, -0.05, false));
    voxelClouds.add(cg);
  }
  group.add(voxelClouds);

  // Orbiting Voxel Space Station + Satellite + Emergency Evacuating Voxel Rocket!
  const station = new THREE.Group();
  station.add(vox(1.4, 0.28, 0.28, '#f1f5f9', 0, 0, 0));
  station.add(vox(0.28, 0.28, 1.05, '#e2e8f0', 0, 0, 0));
  const solarMat = new THREE.MeshStandardMaterial({ color: '#1d4ed8', emissive: '#0284c7', emissiveIntensity: 0.45, roughness: 0.3 });
  station.add(vox(0.45, 0.04, 2.2, solarMat, -0.62, 0, 0));
  station.add(vox(0.45, 0.04, 2.2, solarMat, 0.62, 0, 0));
  station.scale.setScalar(0.78);
  group.add(station);

  // Evacuating Voxel Escape Rocket with blazing tail flame!
  const rocket = new THREE.Group();
  rocket.add(vox(0.32, 0.95, 0.32, '#f8fafc', 0, 0, 0));
  rocket.add(vox(0.24, 0.28, 0.24, '#ef4444', 0, 0.60, 0));
  rocket.add(vox(0.56, 0.28, 0.10, '#ef4444', 0, -0.35, 0));
  rocket.add(vox(0.22, 0.65, 0.22, new THREE.MeshBasicMaterial({ color: '#facc15' }), 0, -0.78, 0, false));
  rocket.add(vox(0.14, 0.95, 0.14, new THREE.MeshBasicMaterial({ color: '#f97316' }), 0, -1.15, 0, false));
  rocket.scale.setScalar(0.95);
  group.add(rocket);

  // True 3D Fresnel Atmosphere Shell
  const atmosUniforms = { uColor: { value: new THREE.Color('#38bdf8') }, uIntensity: { value: 0.78 } };
  const atmosShell = new THREE.Mesh(
    new THREE.SphereGeometry(3.92, 48, 48),
    new THREE.ShaderMaterial({
      uniforms: atmosUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 uColor; uniform float uIntensity; varying vec3 vNormal; void main() { float i = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2); gl_FragColor = vec4(uColor, 1.0) * clamp(i, 0.0, 1.0) * uIntensity; }`,
    })
  );
  group.add(atmosShell);

  // Orbiting Volcanic Ejecta Voxel Rocks
  const ejecta = [];
  for (let i = 0; i < 80; i++) {
    const sz = 0.12 + prand(i * 1.9) * 0.16;
    const m = vox(sz, sz, sz, i % 3 === 0 ? '#1c1917' : i % 3 === 1 ? new THREE.MeshBasicMaterial({ color: '#fb923c' }) : new THREE.MeshBasicMaterial({ color: '#facc15' }), 0, 0, 0, false);
    group.add(m);
    ejecta.push({ mesh: m, r: 4.0 + prand(i * 3.3) * 3.4, ang: prand(i * 7.7) * Math.PI * 2, yOff: (prand(i * 5.9) - 0.5) * 4.6, spd: 0.4 + prand(i * 2.1) * 1.0 });
  }

  return { group, earthMesh, earthUniforms, voxelClouds, vCloudMat, station, rocket, atmosShell, atmosUniforms, ejecta };
}

// ---------------------------------------------------------------------------
// 7. ACT 5: RICH VOXEL MAGMA APOCALYPSE DIORAMA (SUNKEN SKYLINE + CHARRED ROOMMATE!)
// ---------------------------------------------------------------------------
export function buildVoxelTwist() {
  const group = new THREE.Group();
  group.visible = false;

  group.add(new THREE.HemisphereLight('#fb923c', '#450a0a', 1.05));
  const key = new THREE.DirectionalLight('#e0f2fe', 1.4);
  key.position.set(5, 10, 7);
  group.add(key);
  const rim = new THREE.DirectionalLight('#ff5a14', 1.35);
  rim.position.set(-6, 4, -5);
  group.add(rim);

  // Living 24×24 Grid of Animated Voxel Magma & Basalt Blocks!
  const lavaTiles = [];
  const magmaHotMat = new THREE.MeshBasicMaterial({ color: '#f97316' });
  const magmaGoldMat = new THREE.MeshBasicMaterial({ color: '#facc15' });
  const basaltMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.9 });
  const tileGeo = new THREE.BoxGeometry(1.18, 0.9, 1.18);
  for (let gx = -11; gx <= 11; gx++) {
    for (let gz = -11; gz <= 11; gz++) {
      const h = prand(gx * 13.7 + gz * 29.3);
      const mat = h > 0.78 ? magmaGoldMat : h > 0.30 ? magmaHotMat : basaltMat;
      const m = new THREE.Mesh(tileGeo, mat);
      m.position.set(gx * 1.2, -0.75, gz * 1.2);
      group.add(m);
      lavaTiles.push({ mesh: m, gx, gz });
    }
  }

  // HALF-SUNKEN TILTED VOXEL SKYSCRAPER RUINS & CROOKED TRAFFIC LIGHT in Background!
  const ruinMat = new THREE.MeshStandardMaterial({ map: FACADE_DARK, color: '#64748b', emissive: '#9a3412', emissiveIntensity: 0.35 });
  const ruin1 = vox(3.4, 7.5, 3.4, ruinMat, -5.5, 1.6, -7.2);
  ruin1.rotation.set(0.18, 0.3, -0.28);
  const ruin2 = vox(3.8, 8.8, 3.8, ruinMat, 5.2, 2.0, -8.5);
  ruin2.rotation.set(-0.15, -0.4, 0.24);
  const ruin3 = vox(2.6, 5.2, 2.6, ruinMat, -0.8, 0.9, -10.2);
  ruin3.rotation.set(0.22, 0.1, 0.18);
  group.add(ruin1, ruin2, ruin3);

  // Crooked Traffic Light sticking out of lava!
  const tLight = new THREE.Group();
  tLight.position.set(-3.2, 0.3, -3.4);
  tLight.rotation.z = 0.28;
  tLight.add(vox(0.24, 3.4, 0.24, '#334155', 0, 1.5, 0));
  tLight.add(vox(0.55, 1.15, 0.45, '#0f172a', 0, 3.2, 0));
  tLight.add(vox(0.24, 0.24, 0.08, new THREE.MeshBasicMaterial({ color: '#ef4444' }), 0, 3.52, 0.24, false));
  tLight.add(vox(0.24, 0.24, 0.08, new THREE.MeshBasicMaterial({ color: '#facc15' }), 0, 3.2, 0.24, false));
  group.add(tLight);

  // Surviving Charred Obsidian + Broken Dorm Floor Island in Center!
  group.add(vox(4.6, 1.1, 4.0, '#1c1917', -0.1, -0.1, 0));
  group.add(vox(3.6, 0.22, 3.0, new THREE.MeshStandardMaterial({ map: WOOD_TEX, color: '#64748b' }), -0.1, 0.56, 0));
  const brokenHeadboard = vox(2.2, 1.15, 0.22, '#292524', -1.25, 1.1, -1.05);
  brokenHeadboard.rotation.z = 0.22;
  group.add(brokenHeadboard);
  const brokenLamp = vox(0.45, 0.36, 0.45, new THREE.MeshStandardMaterial({ color: '#fef3c7', emissive: '#fb923c', emissiveIntensity: 0.9 }), -1.55, 1.22, 0.72);
  brokenLamp.rotation.z = -0.35;
  group.add(brokenLamp);
  group.add(vox(0.14, 0.55, 0.14, '#334155', -1.48, 0.9, 0.72));

  // HERO FIERCE VOXEL XIAOJIU
  const xiaojiu = createVoxelHuman({
    shirt: '#0284c7',
    hood: '#38bdf8',
    pants: '#1e293b',
    shoes: '#f8fafc',
    hair: '#151b2c',
    withPhone: true,
    withHeadphones: true,
    sitting: false,
  });
  xiaojiu.root.position.set(-0.35, 1.22, 0.25);
  xiaojiu.root.scale.setScalar(1.16);
  xiaojiu.setExpression('fierce');
  group.add(xiaojiu.root);

  // COMEDY CHARRED ROOMMATE clearly visible right beside Xiaojiu on a bobbing plank waving a white flag!
  const plankGroup = new THREE.Group();
  plankGroup.position.set(2.35, 0.18, -1.05);
  plankGroup.add(vox(1.7, 0.20, 1.3, '#44403c', 0, 0, 0));
  const charredMate = createVoxelHuman({ shirt: '#475569', hood: '#334155', withPhone: false, sitting: true });
  charredMate.root.position.set(0, 0.12, 0);
  charredMate.root.rotation.y = -0.35;
  charredMate.root.scale.setScalar(0.92);
  charredMate.setExpression('charred');
  // Tiny voxel white surrender flag in his raised hand!
  charredMate.armR.rotation.x = -2.4;
  charredMate.armR.add(vox(0.06, 1.05, 0.06, '#e2e8f0', 0, -0.95, 0));
  charredMate.armR.add(vox(0.55, 0.36, 0.05, '#f8fafc', 0.28, -1.28, 0));
  plankGroup.add(charredMate.root);
  group.add(plankGroup);

  // Rising voxel fire ember cubes + background lava fountain bursts
  const embers = [];
  for (let i = 0; i < 75; i++) {
    const m = vox(0.16, 0.16, 0.16, i % 2 === 0 ? magmaGoldMat : magmaHotMat, 0, 0, 0, false);
    group.add(m);
    embers.push({ mesh: m, x: (prand(i * 2.1) - 0.5) * 18, z: (prand(i * 4.3) - 0.5) * 18, seed: i * 1.7 });
  }

  return { group, lavaTiles, xiaojiu, plankGroup, embers };
}

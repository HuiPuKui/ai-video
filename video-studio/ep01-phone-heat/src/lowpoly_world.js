import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  makeEarthTextures,
  makeGameScreenTexture,
  makeDaylightFacadeTexture,
  makeHelipadTexture,
} from './textures.js';

export function prand(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function clayMat(color, roughness = 0.78, metalness = 0.04, extra = {}) {
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

const GAME_TEX = makeGameScreenTexture();
const FACADE_GLASS = makeDaylightFacadeTexture('glass');
const FACADE_OFFICE = makeDaylightFacadeTexture('office');
const FACADE_APT = makeDaylightFacadeTexture('apartment');
const FACADE_CORP = makeDaylightFacadeTexture('corporate');
const HELIPAD_TEX = makeHelipadTexture();

// Shared Fresnel Shockwave Dome
export function createShockwaveDome(colorHex = '#ffedd5', rimPower = 2.6) {
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
    vertexShader: `
      varying vec3 vNormal; varying vec3 vViewDir;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor; uniform float uOpacity; uniform float uRimPower;
      varying vec3 vNormal; varying vec3 vViewDir;
      void main() {
        float ndv = abs(dot(normalize(vNormal), normalize(vViewDir)));
        float fresnel = pow(1.0 - ndv, uRimPower);
        gl_FragColor = vec4(uColor, clamp((fresnel + 0.05) * uOpacity, 0.0, 1.0));
      }
    `,
  });
  return { mesh: new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), mat), uniforms };
}

// Low-Poly Soft Clay Tree
export function createLowPolyTree(scale = 1, seed = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.5, 7), clayMat('#8b6248', 0.88));
  trunk.position.y = 0.75;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  g.add(trunk);
  const greens = ['#5a9a4a', '#4b8640', '#6fae58', '#3e7234'];
  const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), clayMat(greens[Math.floor(prand(seed) * 4)], 0.85, 0, { flatShading: true }));
  c1.position.set(0, 1.95, 0);
  c1.scale.set(1.08, 0.92, 1.02);
  c1.castShadow = true;
  const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 1), clayMat(greens[Math.floor(prand(seed + 3) * 4)], 0.85, 0, { flatShading: true }));
  c2.position.set(0.55, 1.72, 0.25);
  const c3 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 1), clayMat(greens[Math.floor(prand(seed + 7) * 4)], 0.85, 0, { flatShading: true }));
  c3.position.set(-0.48, 1.68, -0.22);
  g.add(c1, c2, c3);
  g.scale.setScalar(scale);
  return g;
}

// Clean Low-Poly Vehicles (Sedan, Bus, Fire Truck, Boat, Helicopter)
function createLowPolyCar(color = '#e07a5f') {
  const g = new THREE.Group();
  g.add(rbox(2.4, 0.52, 1.18, 0.14, color, 0, 0.40, 0));
  g.add(rbox(1.32, 0.44, 1.04, 0.14, '#f1f5f9', -0.08, 0.82, 0));
  g.add(rbox(1.36, 0.30, 0.98, 0.06, '#334155', -0.08, 0.82, 0));
  const wMat = clayMat('#1e293b', 0.8);
  [[-0.72, -0.60], [0.72, -0.60], [-0.72, 0.60], [0.72, 0.60]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 12), wMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(wx, 0.24, wz);
    g.add(w);
  });
  return g;
}

function createLowPolyBus(color = '#f59e0b') {
  const g = new THREE.Group();
  g.add(rbox(4.6, 1.45, 1.45, 0.16, color, 0, 0.92, 0));
  g.add(rbox(4.4, 0.52, 1.48, 0.04, '#334155', 0.05, 1.15, 0, false));
  const wMat = clayMat('#1e293b', 0.8);
  [[-1.4, -0.74], [1.4, -0.74], [-1.4, 0.74], [1.4, 0.74]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 12), wMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(wx, 0.32, wz);
    g.add(w);
  });
  return g;
}

function createLowPolyFireTruck() {
  const g = new THREE.Group();
  g.add(rbox(4.5, 1.38, 1.62, 0.14, '#dc2626', 0, 0.92, 0));
  g.add(rbox(1.15, 0.62, 1.48, 0.08, '#bae6fd', 1.68, 1.12, 0));
  g.add(rbox(3.3, 0.22, 0.68, 0.05, '#e2e8f0', -0.45, 1.72, 0)); // ladder
  const sR = new THREE.MeshBasicMaterial({ color: '#ef4444' });
  const sB = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
  g.add(rbox(0.28, 0.20, 0.38, 0.06, sR, 1.5, 1.72, -0.38, false));
  g.add(rbox(0.28, 0.20, 0.38, 0.06, sB, 1.5, 1.72, 0.38, false));
  const wMat = clayMat('#1e293b', 0.8);
  [[-1.4, -0.82], [1.4, -0.82], [-1.4, 0.82], [1.4, 0.82]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.20, 12), wMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(wx, 0.32, wz);
    g.add(w);
  });
  return { group: g, sR, sB };
}

function createLowPolyHeli(bodyCol = '#dc2626') {
  const heli = new THREE.Group();
  heli.add(rbox(2.3, 1.05, 1.15, 0.35, bodyCol, 0, 0, 0));
  heli.add(rbox(1.05, 0.72, 1.02, 0.25, '#bae6fd', 0.72, 0.06, 0));
  heli.add(rbox(2.5, 0.28, 0.28, 0.08, '#f1f5f9', -2.1, 0.14, 0));
  heli.add(rbox(0.28, 0.85, 0.18, 0.06, bodyCol, -3.25, 0.42, 0));
  const rotor = new THREE.Group();
  rotor.position.set(0, 0.68, 0);
  rotor.add(rbox(5.0, 0.06, 0.20, 0.02, '#334155', 0, 0, 0, false));
  rotor.add(rbox(0.20, 0.06, 5.0, 0.02, '#334155', 0, 0, 0, false));
  heli.add(rotor);
  return { heli, rotor };
}

// ---------------------------------------------------------------------------
// 1. BRAND-NEW ORIGINAL COLLECTIBLE CHARACTER DESIGN (潮玩盲盒手办风「小酒」!)
//    Smooth soft-squircle vinyl head, layered swept hair, expressive glossy eyes
//    with catchlights, trendy oversized streetwear hoodie + neck headphones + sneakers!
// ---------------------------------------------------------------------------
export function createStylizedPhone() {
  const group = new THREE.Group();
  const bodyMat = clayMat('#1e293b', 0.25, 0.6);
  group.add(rbox(0.56, 0.28, 0.045, 0.018, bodyMat, 0, 0, 0));
  const screenMat = new THREE.MeshStandardMaterial({
    map: GAME_TEX,
    emissive: new THREE.Color('#38bdf8'),
    emissiveMap: GAME_TEX,
    emissiveIntensity: 0.85,
    roughness: 0.15,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.50, 0.23), screenMat);
  screen.position.z = 0.024;
  group.add(screen);
  const light = new THREE.PointLight('#fb923c', 0.0, 5.5, 1.6);
  light.position.set(0, 0.1, 0.22);
  group.add(light);
  return { group, bodyMat, screenMat, light };
}

export function createOriginalCharacter({
  hoodie = '#0284c7',
  hoodieTrim = '#38bdf8',
  innerTee = '#f1f5f9',
  pants = '#1e293b',
  shoeAccent = '#0284c7',
  hair = '#1e2436',
  withHeadphones = true,
  withPhone = true,
  sitting = false,
  lightweight = false,
} = {}) {
  const root = new THREE.Group();
  const skin = clayMat('#f6ccb0', 0.72);
  const hairM = clayMat(hair, 0.65);
  const hoodieM = clayMat(hoodie, 0.74);
  const trimM = clayMat(hoodieTrim, 0.70);
  const teeM = clayMat(innerTee, 0.78);
  const pantsM = clayMat(pants, 0.80);
  const shoeWhite = clayMat('#f1f5f9', 0.65);
  const shoeCol = clayMat(shoeAccent, 0.68);

  // Fast lightweight crowd figure for 40+ city/campus crowd characters!
  if (lightweight) {
    root.add(rbox(0.54, 0.76, 0.34, 0.12, hoodieM, 0, 1.15, 0));
    root.add(rbox(0.46, 0.46, 0.44, 0.18, skin, 0, 1.84, 0));
    root.add(rbox(0.50, 0.22, 0.48, 0.10, hairM, 0, 2.02, -0.02));
    const armL = new THREE.Group();
    armL.position.set(-0.36, 1.44, 0);
    armL.add(rbox(0.16, 0.56, 0.16, 0.06, hoodieM, 0, -0.24, 0));
    const armR = new THREE.Group();
    armR.position.set(0.36, 1.44, 0);
    armR.add(rbox(0.16, 0.56, 0.16, 0.06, hoodieM, 0, -0.24, 0));
    const legL = new THREE.Group();
    legL.position.set(-0.15, 0.76, 0);
    legL.add(rbox(0.20, 0.72, 0.22, 0.07, pantsM, 0, -0.34, 0));
    const legR = new THREE.Group();
    legR.position.set(0.15, 0.76, 0);
    legR.add(rbox(0.20, 0.72, 0.22, 0.07, pantsM, 0, -0.34, 0));
    root.add(armL, armR, legL, legR);
    return { root, armL, armR, legL, legR, setExpression: () => {} };
  }

  // Hero Sculpted Streetwear Hoodie Torso (tapered silhouette + inner tee hem + hood collar + kangaroo pocket!)
  const torso = rbox(0.68, 0.78, 0.40, 0.16, hoodieM, 0, 1.24, 0);
  const teeHem = rbox(0.62, 0.14, 0.36, 0.05, teeM, 0, 0.84, 0);
  const pocket = rbox(0.44, 0.22, 0.08, 0.05, trimM, 0, 1.04, 0.20);
  const hoodRim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.085, 10, 20), trimM);
  hoodRim.rotation.x = Math.PI / 2;
  hoodRim.position.set(0, 1.62, -0.02);
  const hoodBack = rbox(0.48, 0.22, 0.18, 0.08, hoodieM, 0, 1.56, -0.22);
  const drawL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.24, 8), teeM);
  drawL.position.set(-0.08, 1.46, 0.21);
  const drawR = drawL.clone();
  drawR.position.x = 0.08;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.18, 14), skin);
  neck.position.set(0, 1.72, 0);
  root.add(torso, teeHem, pocket, hoodRim, hoodBack, drawL, drawR, neck);

  // Stylish Over-Neck Headphones sitting cleanly outside the hoodie collar (zero clipping!)
  if (withHeadphones) {
    const hpBand = new THREE.Mesh(new THREE.TorusGeometry(0.285, 0.032, 10, 22, Math.PI * 1.15), clayMat('#1e293b', 0.35, 0.3));
    hpBand.rotation.x = Math.PI / 2 + 0.12;
    hpBand.rotation.z = -0.25;
    hpBand.position.set(0, 1.69, 0.02);
    const cupL = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.065, 14), clayMat('#0f172a', 0.3, 0.4));
    cupL.rotation.z = Math.PI / 2;
    cupL.position.set(-0.275, 1.64, 0.17);
    const cupR = cupL.clone();
    cupR.position.x = 0.275;
    const ringL = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.070, 12), clayMat('#38bdf8', 0.2, 0.2, { emissive: '#38bdf8', emissiveIntensity: 0.4 }));
    ringL.rotation.z = Math.PI / 2;
    ringL.position.copy(cupL.position);
    const ringR = ringL.clone();
    ringR.position.copy(cupR.position);
    root.add(hpBand, cupL, cupR, ringL, ringR);
  }

  // BRAND-NEW BLIND-BOX VINYL FIGURINE HEAD (Soft Squircle + Cute Ears + Layered Swept Hair!)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.08, 0);
  root.add(headGroup);

  // Soft-squircle sculpted vinyl head
  headGroup.add(rbox(0.68, 0.62, 0.60, 0.22, skin, 0, 0, 0));
  // Cute rounded ears!
  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), skin);
  earL.scale.set(0.65, 1.05, 0.75);
  earL.position.set(-0.34, -0.02, -0.02);
  const earR = earL.clone();
  earR.position.x = 0.34;
  headGroup.add(earL, earR);

  // Sculpted Multi-Layered Swept Anime/Blind-Box Hair (NO clunky block helmet!)
  const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.38, 22, 18), hairM);
  hairCrown.scale.set(1.04, 0.82, 0.98);
  hairCrown.position.set(0, 0.14, -0.04);
  hairCrown.castShadow = true;
  headGroup.add(hairCrown);
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 16), hairM);
  hairBack.scale.set(1.02, 0.92, 0.72);
  hairBack.position.set(0, -0.02, -0.14);
  headGroup.add(hairBack);

  // Swept sculpted bangs framing upper forehead cleanly ABOVE the expressive eyes!
  const bangConfigs = [
    [-0.24, 0.21, 0.22, 0.11, 0.24, 0.42],
    [-0.10, 0.25, 0.27, 0.12, 0.24, 0.18],
    [0.06, 0.26, 0.28, 0.13, 0.25, -0.14],
    [0.22, 0.21, 0.23, 0.11, 0.23, -0.38],
  ];
  bangConfigs.forEach(([x, y, z, rad, len, rz]) => {
    const lock = new THREE.Mesh(new THREE.CapsuleGeometry(rad * 0.72, len * 0.65, 6, 10), hairM);
    lock.position.set(x, y, z);
    lock.rotation.set(0.32, 0, rz);
    headGroup.add(lock);
  });
  // Signature playful top cowlick strand
  const ahoge = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.18, 6, 10), hairM);
  ahoge.position.set(0.06, 0.46, 0.02);
  ahoge.rotation.z = -0.58;
  headGroup.add(ahoge);

  // EXPRESSIVE GLOSSY COLLECTIBLE EYES WITH TWIN CATCHLIGHTS!
  const whiteM = clayMat('#ffffff', 0.2);
  const irisM = clayMat('#111827', 0.12);
  const glintM = new THREE.MeshBasicMaterial({ color: '#ffffff' });

  const makeEye = (x) => {
    const eg = new THREE.Group();
    eg.position.set(x, -0.01, 0.285);
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), whiteM);
    sclera.scale.set(0.95, 1.15, 0.36);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 14), irisM);
    iris.scale.set(0.95, 1.12, 0.38);
    iris.position.set(0, -0.004, 0.014);
    const glint1 = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 8), glintM);
    glint1.position.set(0.018, 0.024, 0.036);
    const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), glintM);
    glint2.position.set(-0.016, -0.018, 0.036);
    eg.add(sclera, iris, glint1, glint2);
    eg.userData = { iris, glint1, glint2 };
    return eg;
  };
  const eyeL = makeEye(-0.135);
  const eyeR = makeEye(0.135);
  headGroup.add(eyeL, eyeR);

  // Curved sculpted eyebrows
  const browL = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.09, 4, 8), hairM);
  browL.rotation.z = Math.PI / 2;
  browL.position.set(-0.135, 0.115, 0.295);
  const browR = browL.clone();
  browR.position.x = 0.135;
  headGroup.add(browL, browR);

  // Cute tiny sculpted nose + blush cheeks + expressive 3D mouth
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), clayMat('#eab494', 0.7));
  nose.position.set(0, -0.065, 0.305);
  headGroup.add(nose);

  const blushM = new THREE.MeshBasicMaterial({ color: '#fb7185', transparent: true, opacity: 0.36 });
  [-0.21, 0.21].forEach((bx) => {
    const bl = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), blushM);
    bl.scale.set(1.25, 0.62, 0.25);
    bl.position.set(bx, -0.095, 0.275);
    headGroup.add(bl);
  });

  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 14), clayMat('#be123c', 0.45));
  mouth.scale.set(1.1, 0.38, 0.45);
  mouth.position.set(0, -0.165, 0.285);
  headGroup.add(mouth);

  const sweat = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.11, 10), clayMat('#38bdf8', 0.2));
  sweat.position.set(0.28, 0.11, 0.22);
  sweat.visible = false;
  headGroup.add(sweat);

  // Smooth Rounded Arms + Sleeves + Hands
  const armL = new THREE.Group();
  armL.position.set(-0.44, 1.50, 0);
  const armR = new THREE.Group();
  armR.position.set(0.44, 1.50, 0);
  if (withPhone) {
    armL.add(rbox(0.21, 0.21, 0.54, 0.09, hoodieM, 0.06, -0.12, 0.24));
    const hL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), skin);
    hL.position.set(0.14, -0.12, 0.54);
    armL.add(hL);
    armR.add(rbox(0.21, 0.21, 0.54, 0.09, hoodieM, -0.06, -0.12, 0.24));
    const hR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), skin);
    hR.position.set(-0.14, -0.12, 0.54);
    armR.add(hR);
  } else {
    armL.add(rbox(0.20, 0.62, 0.20, 0.09, hoodieM, 0, -0.26, 0));
    const hL = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 12), skin);
    hL.position.set(0, -0.60, 0);
    armL.add(hL);
    armR.add(rbox(0.20, 0.62, 0.20, 0.09, hoodieM, 0, -0.26, 0));
    const hR = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 12), skin);
    hR.position.set(0, -0.60, 0);
    armR.add(hR);
  }
  root.add(armL, armR);

  // Tapered Pants + Two-Tone Streetwear Sneakers!
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  if (sitting) {
    legL.position.set(-0.17, 0.80, 0.08);
    legL.add(rbox(0.24, 0.23, 0.76, 0.09, pantsM, 0, 0, 0.36));
    legL.add(rbox(0.25, 0.22, 0.16, 0.06, shoeCol, 0, 0.02, 0.77));
    legL.add(rbox(0.26, 0.08, 0.18, 0.03, shoeWhite, 0, -0.08, 0.77));
    legR.position.set(0.17, 0.80, 0.08);
    legR.add(rbox(0.24, 0.23, 0.76, 0.09, pantsM, 0, 0, 0.36));
    legR.add(rbox(0.25, 0.22, 0.16, 0.06, shoeCol, 0, 0.02, 0.77));
    legR.add(rbox(0.26, 0.08, 0.18, 0.03, shoeWhite, 0, -0.08, 0.77));
  } else {
    legL.position.set(-0.17, 0.80, 0);
    legL.add(rbox(0.24, 0.68, 0.26, 0.09, pantsM, 0, -0.32, 0));
    legL.add(rbox(0.25, 0.14, 0.34, 0.06, shoeCol, 0, -0.68, 0.04));
    legL.add(rbox(0.26, 0.07, 0.36, 0.03, shoeWhite, 0, -0.76, 0.04));
    legR.position.set(0.17, 0.80, 0);
    legR.add(rbox(0.24, 0.68, 0.26, 0.09, pantsM, 0, -0.32, 0));
    legR.add(rbox(0.25, 0.14, 0.34, 0.06, shoeCol, 0, -0.68, 0.04));
    legR.add(rbox(0.26, 0.07, 0.36, 0.03, shoeWhite, 0, -0.76, 0.04));
  }
  root.add(legL, legR);

  let phone = null;
  if (withPhone) {
    phone = createStylizedPhone();
    phone.group.position.set(0, 1.38, 0.68);
    phone.group.rotation.x = -0.52;
    root.add(phone.group);
  }

  function setExpression(expr, time = 0) {
    const resetIris = (scale = 1.0, showGlint = true) => {
      [eyeL, eyeR].forEach((e) => {
        if (!e.userData || !e.userData.iris) return;
        e.userData.iris.scale.set(0.95 * scale, 1.12 * scale, 0.38);
        e.userData.glint1.visible = showGlint;
        e.userData.glint2.visible = showGlint;
      });
    };
    if (expr === 'calm') {
      resetIris(1.0, true);
      eyeL.scale.set(1, 1, 1);
      eyeR.scale.set(1, 1, 1);
      browL.rotation.z = Math.PI / 2;
      browR.rotation.z = Math.PI / 2;
      mouth.scale.set(1.0, 0.35, 0.45);
      sweat.visible = false;
    } else if (expr === 'sweat') {
      resetIris(1.0, true);
      eyeL.scale.set(1.05, 0.82, 1);
      eyeR.scale.set(1.05, 0.82, 1);
      browL.rotation.z = Math.PI / 2 + 0.28;
      browR.rotation.z = Math.PI / 2 - 0.28;
      mouth.scale.set(1.15, 0.72, 0.45);
      sweat.visible = true;
      sweat.position.y = 0.12 - ((time * 1.3) % 1) * 0.12;
    } else if (expr === 'panic') {
      resetIris(0.85, true);
      eyeL.scale.set(1.28, 1.28, 1);
      eyeR.scale.set(1.28, 1.28, 1);
      browL.rotation.z = Math.PI / 2 + 0.38;
      browR.rotation.z = Math.PI / 2 - 0.38;
      mouth.scale.set(1.35, 1.45 + Math.sin(time * 22) * 0.18, 0.55);
      sweat.visible = true;
      sweat.position.y = 0.12 - ((time * 2.4) % 1) * 0.14;
    } else if (expr === 'fierce') {
      resetIris(1.0, true);
      eyeL.scale.set(1.12, 0.88, 1);
      eyeR.scale.set(1.12, 0.88, 1);
      browL.rotation.z = Math.PI / 2 - 0.36;
      browR.rotation.z = Math.PI / 2 + 0.36;
      mouth.scale.set(1.4, 1.15 + Math.sin(time * 18) * 0.2, 0.5);
      sweat.visible = false;
    } else if (expr === 'stunned') {
      // Hilarious blank dot-eyed "⊙_⊙" soul-left-the-body dumbfounded look!
      resetIris(0.36, false);
      eyeL.scale.set(1.34, 1.34, 1);
      eyeR.scale.set(1.34, 1.34, 1);
      browL.rotation.z = Math.PI / 2 + 0.16;
      browR.rotation.z = Math.PI / 2 - 0.26;
      mouth.scale.set(0.55, 0.72, 0.45);
      sweat.visible = true;
      sweat.position.y = 0.13 - ((time * 0.65) % 1) * 0.08;
    }
  }

  return { root, headGroup, armL, armR, legL, legR, phone, setExpression };
}

// ---------------------------------------------------------------------------
// 2. ACT 1: SUNLIT LIVELY 3-PERSON UNIVERSITY DORM (RICH PROPS + 3 CHARACTERS!)
// ---------------------------------------------------------------------------
export function buildSunlitDorm() {
  const group = new THREE.Group();

  group.add(new THREE.HemisphereLight('#e0ecff', '#a89078', 0.58));
  const sun = new THREE.DirectionalLight('#ffefd6', 1.35);
  sun.position.set(7.5, 11.5, 6.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 4;
  sun.shadow.bias = -0.0006;
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  group.add(sun);

  const alarmLight = new THREE.PointLight('#ef4444', 0, 14, 1.5);
  alarmLight.position.set(-0.5, 4.7, -0.5);
  group.add(alarmLight);

  // Room architecture
  group.add(rbox(9.2, 0.45, 9.2, 0.08, '#b88b5a', 0, -0.225, 0, false));
  group.add(rbox(9.4, 0.16, 9.4, 0.04, '#8c653e', 0, -0.48, 0, false));
  group.add(rbox(4.4, 0.04, 3.4, 0.02, '#d6cfc4', 0.2, 0.02, 0.85, false));
  group.add(rbox(3.9, 0.045, 2.9, 0.02, '#a3b899', 0.2, 0.025, 0.85, false));

  const wallM = clayMat('#e4dccf', 0.88);
  const trimM = clayMat('#c9bfb0', 0.85);
  group.add(rbox(9.2, 5.4, 0.34, 0.05, wallM, 0, 2.7, -4.43, false));
  group.add(rbox(0.34, 5.4, 9.2, 0.05, wallM, -4.43, 2.7, 0, false));
  group.add(rbox(9.2, 0.22, 0.08, 0.02, trimM, 0, 0.11, -4.24, false));
  group.add(rbox(0.08, 0.22, 9.2, 0.02, trimM, -4.24, 0.11, 0, false));

  // Large Sunlit Back Window showing detailed daylight apartment towers outside!
  group.add(rbox(3.5, 2.7, 0.22, 0.05, '#f8fafc', 0.45, 3.2, -4.25));
  const skyPane = new THREE.Mesh(new THREE.PlaneGeometry(3.15, 2.35), new THREE.MeshBasicMaterial({ color: '#cbe3fa' }));
  skyPane.position.set(0.45, 3.2, -4.13);
  group.add(skyPane);
  const winBld1 = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.85), new THREE.MeshBasicMaterial({ map: FACADE_OFFICE }));
  winBld1.position.set(-0.35, 2.95, -4.11);
  const winBld2 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.15), new THREE.MeshBasicMaterial({ map: FACADE_GLASS }));
  winBld2.position.set(0.55, 3.05, -4.11);
  const winBld3 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.55), new THREE.MeshBasicMaterial({ map: FACADE_APT }));
  winBld3.position.set(1.45, 2.8, -4.11);
  group.add(winBld1, winBld2, winBld3);
  group.add(rbox(0.08, 2.36, 0.08, 0.02, '#f8fafc', 0.45, 3.2, -4.08));
  group.add(rbox(3.16, 0.08, 0.08, 0.02, '#f8fafc', 0.45, 3.4, -4.08));
  group.add(rbox(3.7, 0.12, 0.44, 0.04, '#f8fafc', 0.45, 1.82, -4.06));
  group.add(rbox(0.42, 2.85, 0.20, 0.06, '#d6c7b2', -1.28, 3.15, -4.04));
  group.add(rbox(0.42, 2.85, 0.20, 0.06, '#d6c7b2', 2.18, 3.15, -4.04));

  // Potted indoor plant, wall AC, framed poster, floating shelf with pastel books, cardboard box!
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.48, 12), clayMat('#d97757', 0.8));
  pot.position.set(-3.55, 0.24, 2.95);
  group.add(pot);
  const indoorTree = createLowPolyTree(0.58, 11);
  indoorTree.position.set(-3.55, 0.35, 2.95);
  group.add(indoorTree);

  group.add(rbox(1.75, 0.48, 0.38, 0.08, '#f8fafc', 3.15, 4.55, -4.04));
  group.add(rbox(0.08, 1.25, 0.95, 0.03, '#8b6248', -4.22, 3.45, -1.65));
  group.add(rbox(0.09, 1.08, 0.78, 0.01, '#fef3c7', -4.21, 3.45, -1.65));
  group.add(rbox(0.10, 0.48, 0.48, 0.04, '#f97316', -4.20, 3.55, -1.65));
  group.add(rbox(0.42, 0.08, 2.2, 0.03, '#b88b61', -4.04, 2.65, 1.45));
  ['#0284c7', '#f59e0b', '#6ba353', '#e07a5f', '#818cf8', '#ec4899'].forEach((col, i) => {
    const bh = 0.34 + (i % 3) * 0.07;
    group.add(rbox(0.28, bh, 0.10, 0.02, col, -4.04, 2.7 + bh / 2, 0.7 + i * 0.16));
  });

  // Hero Bed + Nightstand + Lamp + Snacks
  const bedGroup = new THREE.Group();
  bedGroup.position.set(-1.85, 0, -1.35);
  group.add(bedGroup);
  bedGroup.add(rbox(2.55, 0.50, 3.45, 0.08, '#b88b61', 0, 0.25, 0));
  bedGroup.add(rbox(2.62, 1.45, 0.18, 0.07, '#b88b61', 0, 0.76, -1.68));
  bedGroup.add(rbox(2.42, 0.34, 3.25, 0.10, '#f8fafc', 0, 0.64, 0));
  const blanketMat = clayMat('#5c85b8', 0.85);
  bedGroup.add(rbox(2.50, 0.38, 2.15, 0.12, blanketMat, 0, 0.74, 0.52));
  bedGroup.add(rbox(1.35, 0.30, 0.65, 0.12, '#ffffff', 0, 0.96, -1.18));

  group.add(rbox(0.88, 0.95, 0.88, 0.06, '#c2996d', -3.55, 0.475, -2.65));
  const lampCone = new THREE.Mesh(new THREE.ConeGeometry(0.30, 0.32, 16), clayMat('#fff7ed', 0.6));
  lampCone.position.set(-3.55, 1.48, -2.65);
  group.add(rbox(0.14, 0.38, 0.14, 0.04, '#64748b', -3.55, 1.15, -2.65), lampCone);

  // Study/Gaming Desk + Dual Monitors + Chair + Roommate #2 sitting at desk!
  const desk = new THREE.Group();
  desk.position.set(2.45, 0, -2.95);
  group.add(desk);
  desk.add(rbox(2.85, 0.10, 1.25, 0.04, '#d4b48c', 0, 1.24, 0));
  desk.add(rbox(0.10, 1.24, 1.15, 0.03, '#475569', -1.32, 0.62, 0));
  desk.add(rbox(0.10, 1.24, 1.15, 0.03, '#475569', 1.32, 0.62, 0));
  desk.add(rbox(1.22, 0.70, 0.06, 0.03, '#1e293b', -0.42, 1.82, -0.28));
  desk.add(rbox(1.14, 0.62, 0.02, 0.01, '#38bdf8', -0.42, 1.82, -0.24, false));
  desk.add(rbox(0.76, 0.56, 0.06, 0.03, '#1e293b', 0.68, 1.76, -0.24));
  desk.add(rbox(0.68, 0.48, 0.02, 0.01, '#a855f7', 0.68, 1.76, -0.20, false));
  desk.add(rbox(0.66, 0.04, 0.24, 0.01, '#334155', -0.35, 1.31, 0.18));

  const mateDesk = createOriginalCharacter({
    hoodie: '#6366f1',
    hoodieTrim: '#818cf8',
    pants: '#334155',
    shoeAccent: '#6366f1',
    hair: '#292524',
    withHeadphones: false,
    withPhone: false,
    sitting: true,
  });
  mateDesk.root.position.set(2.1, 0.12, -2.0);
  mateDesk.root.rotation.y = -2.2;
  group.add(mateDesk.root);

  // Roommate #1 Bed + Character
  const mateBed = new THREE.Group();
  mateBed.position.set(2.45, 0, 1.95);
  group.add(mateBed);
  mateBed.add(rbox(2.35, 0.48, 3.05, 0.08, '#b88b61', 0, 0.24, 0));
  mateBed.add(rbox(2.24, 0.32, 2.90, 0.10, '#f8fafc', 0, 0.60, 0));
  mateBed.add(rbox(2.32, 0.36, 1.85, 0.12, '#7da87b', 0, 0.70, 0.45));
  mateBed.add(rbox(1.1, 0.26, 0.58, 0.10, '#ffffff', 0, 0.90, -1.08));

  const roommate = createOriginalCharacter({
    hoodie: '#f59e0b',
    hoodieTrim: '#fbbf24',
    pants: '#334155',
    shoeAccent: '#f59e0b',
    hair: '#451a03',
    withHeadphones: false,
    withPhone: false,
    sitting: true,
  });
  roommate.root.position.set(2.45, 0.48, 1.05);
  roommate.root.rotation.y = -0.48;
  group.add(roommate.root);

  // HERO XIAOJIU (Brand-New Original Blind-Box Streetwear Design!)
  const xiaojiu = createOriginalCharacter({
    hoodie: '#0284c7',
    hoodieTrim: '#38bdf8',
    innerTee: '#f8fafc',
    pants: '#1e293b',
    shoeAccent: '#0284c7',
    hair: '#171c2b',
    withHeadphones: true,
    withPhone: true,
    sitting: true,
  });
  xiaojiu.root.position.set(-1.85, 0.48, -1.92);
  xiaojiu.root.scale.setScalar(1.06);
  group.add(xiaojiu.root);

  // Smooth billowing smoke & fire puffs
  const puffs = [];
  const smokeGeo = new THREE.IcosahedronGeometry(0.24, 2);
  const dripGeo = new THREE.SphereGeometry(0.045, 10, 10);
  for (let i = 0; i < 65; i++) {
    const isDrip = i < 14;
    const isCore = i >= 14 && i < 34;
    const mat = isDrip
      ? clayMat('#fb923c', 0.25, 0.0, { emissive: '#ea580c', emissiveIntensity: 0.7 })
      : isCore
        ? new THREE.MeshStandardMaterial({ color: '#fb923c', emissive: '#f97316', emissiveIntensity: 0.95, roughness: 0.6, transparent: true, opacity: 0.88 })
        : new THREE.MeshStandardMaterial({ color: '#9ca3af', roughness: 0.94, transparent: true, opacity: 0.78 });
    const m = new THREE.Mesh(isDrip ? dripGeo : smokeGeo, mat);
    m.visible = false;
    group.add(m);
    puffs.push({ mesh: m, kind: isDrip ? 'drip' : isCore ? 'fire' : 'smoke', seed: i * 1.43 + 0.2 });
  }

  return { group, xiaojiu, roommate, mateDesk, blanketMat, alarmLight, puffs };
}

// ---------------------------------------------------------------------------
// 3. ACT 2: ULTRA-DETAILED BUSTLING CAMPUS PLAZA (24 STUDENTS + CARS + FIRE TRUCK + DETAILED BALCONIES!)
// ---------------------------------------------------------------------------
export function buildSunlitCampus() {
  const group = new THREE.Group();
  group.visible = false;

  group.add(new THREE.HemisphereLight('#dbeafe', '#9c8a72', 0.58));
  const sun = new THREE.DirectionalLight('#ffefd6', 1.38);
  sun.position.set(20, 32, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 4;
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  group.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), clayMat('#cfc7ba', 0.92));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Lawns, Sidewalks, Basketball Court corner, Road + Dashed Lanes + Zebra Crosswalk!
  group.add(rbox(32, 0.08, 16, 0.03, '#5c9449', -22, 0.04, 16, false));
  group.add(rbox(34, 0.08, 16, 0.03, '#5c9449', 24, 0.04, 16, false));
  group.add(rbox(140, 0.06, 9.5, 0.02, '#475569', 0, 0.03, 12.5, false));
  for (let i = -6; i <= 6; i++) group.add(rbox(2.2, 0.07, 0.28, 0.01, '#f1f5f9', i * 5.2, 0.035, 12.5, false));
  for (let i = -3; i <= 3; i++) group.add(rbox(0.55, 0.07, 3.8, 0.01, '#f8fafc', 7.2 + i * 1.15, 0.035, 12.5, false));

  // HERO 8-STORY DETAILED DORM BUILDING (Daylight Apartment Facade + 3D Balconies + AC Units + Entrance Canopy + Roof Details!)
  const dormTex = FACADE_APT.clone();
  dormTex.needsUpdate = true;
  dormTex.repeat.set(2, 1.5);
  const dormMat = new THREE.MeshStandardMaterial({ map: dormTex, roughness: 0.78, metalness: 0.06 });
  const heroBld = new THREE.Mesh(new THREE.BoxGeometry(11.2, 18.0, 6.6), dormMat);
  heroBld.position.set(0, 9.0, -2.0);
  heroBld.castShadow = true;
  heroBld.receiveShadow = true;
  group.add(heroBld);

  // 3D Architectural Trim: Floor Cornices, Protruding Balconies, AC Units, Entrance Canopy, Rooftop Chillers!
  for (let fl = 1; fl <= 7; fl++) {
    const y = fl * 2.25 + 0.6;
    group.add(rbox(11.6, 0.18, 6.9, 0.04, '#c9bfb0', 0, y - 0.8, -2.0));
    [-3.4, 3.4].forEach((bx) => {
      group.add(rbox(2.6, 0.16, 1.0, 0.04, '#d6cfc4', bx, y - 0.6, 1.65));
      group.add(rbox(2.6, 0.62, 0.10, 0.03, '#94a3b8', bx, y - 0.22, 2.1));
      group.add(rbox(0.62, 0.44, 0.36, 0.05, '#e2e8f0', bx + (bx < 0 ? 1.6 : -1.6), y - 0.25, 1.45));
    });
  }
  // Entrance glass canopy + lobby + vending machine + rooftop structures
  group.add(rbox(4.2, 0.24, 2.2, 0.06, '#0284c7', 0, 2.8, 2.1));
  group.add(rbox(3.4, 2.6, 0.2, 0.04, '#334155', 0, 1.3, 1.32));
  group.add(rbox(0.9, 1.6, 0.65, 0.06, '#ef4444', -4.2, 0.85, 1.8)); // red vending machine
  group.add(rbox(3.6, 1.9, 3.0, 0.10, '#d6cfc4', -2.6, 18.95, -2.0));
  group.add(rbox(1.8, 1.3, 1.8, 0.10, '#94a3b8', 2.8, 18.65, -2.2));
  group.add(rbox(11.8, 0.55, 7.2, 0.06, '#c4b9a8', 0, 18.15, -2.0));

  // Neighboring Detailed Windowed Campus & City Buildings (NO MORE BLANK BOXES!)
  [
    [-16.5, 7.0, -5.0, 9.8, 14.0, 7.0, FACADE_OFFICE],
    [17.0, 9.0, -4.5, 10.2, 18.0, 7.0, FACADE_GLASS],
    [-23, 11, -18, 12, 22, 8, FACADE_CORP],
    [21, 13, -20, 13, 26, 8, FACADE_OFFICE],
    [0, 14, -24, 18, 28, 8, FACADE_GLASS],
  ].forEach(([x, y, z, w, h, d, tex]) => {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 12)));
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.72 }));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  });

  // Trees & Streetlamps
  [[-9.8, 5.8, 1.35], [-5.4, 6.2, 1.15], [6.2, 6.0, 1.4], [11.2, 5.6, 1.2], [-13, 18.5, 1.3], [13, 19, 1.25]].forEach(([tx, tz, sc], idx) => {
    const tr = createLowPolyTree(sc, idx * 5 + 1);
    tr.position.set(tx, 0, tz);
    group.add(tr);
  });

  // VEHICLES: Flashing 119 Fire Truck + Campus Bus + 3 Pastel Cars!
  const fireTruck = createLowPolyFireTruck();
  fireTruck.group.position.set(-6.2, 0.04, 10.2);
  group.add(fireTruck.group);
  const bus = createLowPolyBus('#f59e0b');
  bus.position.set(9.5, 0.04, 14.8);
  bus.rotation.y = Math.PI;
  group.add(bus);
  const c1 = createLowPolyCar('#0284c7');
  c1.position.set(2.4, 0.04, 10.2);
  const c2 = createLowPolyCar('#e07a5f');
  c2.position.set(-1.8, 0.04, 14.8);
  c2.rotation.y = Math.PI;
  const c3 = createLowPolyCar('#10b981');
  c3.position.set(11.5, 0.04, 10.2);
  group.add(c1, c2, c3);

  // HOVERING NEWS HELICOPTER!
  const { heli: newsHeli, rotor: newsRotor } = createLowPolyHeli('#dc2626');
  newsHeli.position.set(-8.2, 15.0, 6.5);
  newsHeli.rotation.y = -0.55;
  group.add(newsHeli);

  // 24 LIVELY ANIMATED CAMPUS STUDENTS & BYSTANDERS FLEEING ACROSS THE PLAZA!
  const runners = [];
  const outfitColors = ['#0284c7', '#e07a5f', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6'];
  for (let i = 0; i < 24; i++) {
    const rx = (prand(i * 3.7) - 0.5) * 24;
    const rz = 3.2 + prand(i * 5.9) * 5.2;
    const col = outfitColors[i % outfitColors.length];
    const p = createOriginalCharacter({ hoodie: col, pants: '#1e293b', lightweight: true });
    p.root.position.set(rx, 0.05, rz);
    p.root.scale.setScalar(0.68);
    const dir = rx < 0 ? -1 : 1;
    p.root.rotation.y = dir < 0 ? -Math.PI * 0.45 : Math.PI * 0.45;
    group.add(p.root);
    runners.push({ p, x0: rx, dir, spd: 1.4 + prand(i * 7.1) * 1.4, phase: prand(i * 2.3) * 6 });
  }

  // Smooth Billowing Explosion Cloud + Translucent Fresnel Shockwave Dome + Glass Slivers
  const blastOrigin = new THREE.Vector3(2.2, 11.4, 1.55);
  const shockDome = createShockwaveDome('#fff7ed', 2.8);
  shockDome.mesh.position.copy(blastOrigin);
  group.add(shockDome.mesh);

  const cloudPuffs = [];
  const puffGeo = new THREE.IcosahedronGeometry(1, 2);
  for (let i = 0; i < 34; i++) {
    const isCore = i < 12;
    const isMid = i >= 12 && i < 22;
    const mat = isCore
      ? new THREE.MeshStandardMaterial({ color: '#fde047', emissive: '#f97316', emissiveIntensity: 0.95, roughness: 0.5 })
      : isMid
        ? new THREE.MeshStandardMaterial({ color: '#ea580c', emissive: '#c2410c', emissiveIntensity: 0.55, roughness: 0.72 })
        : clayMat('#78716c', 0.94, 0, { transparent: true, opacity: 0.88 });
    const m = new THREE.Mesh(puffGeo, mat);
    group.add(m);
    const a = prand(i * 4.1) * Math.PI * 2;
    const b = (prand(i * 6.3) - 0.35) * Math.PI * 0.85;
    const rad = isCore ? 0.4 + prand(i * 2.1) * 1.1 : 1.0 + prand(i * 8.1) * 2.2;
    cloudPuffs.push({ mesh: m, dx: Math.cos(a) * Math.cos(b) * rad, dy: Math.sin(b) * rad + (isCore ? 0 : 0.6), dz: Math.abs(Math.sin(a)) * rad + 0.4, baseR: isCore ? 0.95 : isMid ? 1.15 : 1.25, seed: i * 1.3 });
  }

  const shards = [];
  const glassMat = new THREE.MeshStandardMaterial({ color: '#bae6fd', roughness: 0.1, metalness: 0.75, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const shardGeo = new THREE.ConeGeometry(0.18, 0.45, 3);
  for (let i = 0; i < 75; i++) {
    const s = new THREE.Mesh(shardGeo, glassMat);
    group.add(s);
    const ang = prand(i * 3.1) * Math.PI * 2;
    const elev = (prand(i * 5.7) - 0.25) * 1.2;
    const spd = 5.0 + prand(i * 7.3) * 12.0;
    shards.push({ mesh: s, vx: Math.cos(ang) * spd, vy: elev * spd + 2.5, vz: Math.abs(Math.sin(ang)) * spd + 4.5, rx: prand(i * 9.1) * 12, ry: prand(i * 11.3) * 12 });
  }

  return { group, dormMat, blastOrigin, shockDome, cloudPuffs, shards, runners, fireTruck, newsHeli, newsRotor };
}

// ---------------------------------------------------------------------------
// 4. ACT 3: ULTRA-DETAILED LIVING METROPOLIS (210 WINDOWED SKYSCRAPERS + HELIPADS +
//    55 CARS/BUSES + 48 FLEEING CROWDS + RIVER BOATS + CABLE BRIDGE + HELICOPTERS!)
// ---------------------------------------------------------------------------
export function buildSunlitCity() {
  const group = new THREE.Group();
  group.visible = false;

  group.add(new THREE.HemisphereLight('#dbeafe', '#9c8a72', 0.58));
  const sun = new THREE.DirectionalLight('#ffefd6', 1.35);
  sun.position.set(45, 72, 36);
  group.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), clayMat('#cfc8bc', 0.92));
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  // Full Paved Avenue Grid with White Lane Markings!
  const roadM = clayMat('#475569', 0.88);
  const lineM = clayMat('#f1f5f9', 0.8);
  [-32, -12, 12, 38].forEach((zRoad) => {
    group.add(rbox(260, 0.08, 6.2, 0.02, roadM, 0, 0.04, zRoad, false));
    for (let x = -90; x <= 90; x += 8) group.add(rbox(3.2, 0.09, 0.24, 0.01, lineM, x, 0.045, zRoad, false));
  });
  [-34, -12].forEach((xRoad) => {
    group.add(rbox(6.2, 0.08, 260, 0.02, roadM, xRoad, 0.04, 0, false));
    for (let z = -90; z <= 90; z += 8) group.add(rbox(0.24, 0.09, 3.2, 0.01, lineM, xRoad, 0.045, z, false));
  });

  // Rich Turquoise River with Subtle White Ripples + 4 Moving Boats + Cable-Stayed Suspension Bridge!
  group.add(rbox(20, 0.12, 320, 0.04, '#38bdf8', 26, 0.06, 0, false));
  group.add(rbox(2.4, 0.14, 320, 0.02, '#7dd3fc', 21, 0.07, 0, false));
  group.add(rbox(1.8, 0.14, 320, 0.02, '#7dd3fc', 31, 0.07, 0, false));

  // Cable-Stayed Suspension Bridge (deck + twin pylons + diagonal cables!)
  group.add(rbox(28, 0.9, 6.6, 0.1, '#e2e8f0', 26, 1.5, 12, false));
  [[19, 9.0], [19, 15.0], [33, 9.0], [33, 15.0]].forEach(([px, pz]) => {
    group.add(rbox(0.95, 9.5, 0.95, 0.08, '#f8fafc', px, 5.2, pz, false));
    // Stay cables connecting pylon top to deck
    [-4.5, -2.5, 2.5, 4.5].forEach((dx) => {
      const len = Math.hypot(dx, 7.6);
      const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, len, 5), clayMat('#cbd5e1', 0.5));
      cab.position.set(px + dx / 2, 5.5, pz);
      cab.rotation.z = Math.atan2(dx, 7.6);
      group.add(cab);
    });
  });

  // 4 Moving River Boats with White Wake Trails!
  const boats = [];
  for (let b = 0; b < 4; b++) {
    const bg = new THREE.Group();
    bg.add(rbox(1.5, 0.45, 3.6, 0.15, b % 2 === 0 ? '#f8fafc' : '#e07a5f', 0, 0.35, 0));
    bg.add(rbox(1.0, 0.42, 1.5, 0.10, '#334155', 0, 0.72, -0.2));
    bg.add(rbox(1.1, 0.05, 4.5, 0.02, '#e0f2fe', 0, 0.16, -3.6, false)); // wake
    group.add(bg);
    boats.push({ mesh: bg, x: 21 + (b % 2) * 9.5, z0: -60 + b * 36, dir: b % 2 === 0 ? 1 : -1 });
  }

  // Lush Riverside Park Promenade + Trees + 48 Fleeing Crowd Figures!
  group.add(rbox(14, 0.12, 150, 0.04, '#5e964b', 9, 0.06, -10, false));
  group.add(rbox(3.2, 0.14, 150, 0.02, '#d6cfc4', 14.2, 0.07, -10, false)); // paved riverside walkway!
  for (let t = 0; t < 24; t++) {
    const tr = createLowPolyTree(1.25, t * 7);
    tr.position.set(5.5 + (t % 2) * 5.2, 0.1, -72 + t * 6.2);
    group.add(tr);
  }

  // 48 Visible Tiny Crowd People running along the riverside promenade & plazas!
  const crowd = [];
  const crowdCols = ['#ef4444', '#0284c7', '#f59e0b', '#ec4899', '#8b5cf6', '#f8fafc'];
  for (let i = 0; i < 48; i++) {
    const p = createOriginalCharacter({ hoodie: crowdCols[i % crowdCols.length], lightweight: true });
    const cx = i < 30 ? 12.8 + (prand(i * 4.1) - 0.5) * 3.5 : -12 + (prand(i * 2.3) - 0.5) * 18;
    const cz = (prand(i * 7.3) - 0.5) * 78;
    p.root.position.set(cx, 0.15, cz);
    p.root.scale.setScalar(0.75);
    group.add(p.root);
    crowd.push({ p, x0: cx, z0: cz, dir: cz > 0 ? 1 : -1, spd: 2.2 + prand(i * 5.1) * 2.2 });
  }

  // 56 Moving Low-Poly Cars & Buses along the City Avenues!
  const vehicles = [];
  const carCols = ['#e07a5f', '#0284c7', '#f59e0b', '#10b981', '#f8fafc', '#6366f1'];
  for (let v = 0; v < 56; v++) {
    const alongX = v < 36;
    const m = v % 6 === 0 ? createLowPolyBus(v % 12 === 0 ? '#f59e0b' : '#dc2626') : createLowPolyCar(carCols[v % carCols.length]);
    m.scale.setScalar(0.85);
    group.add(m);
    const roadCoord = alongX ? [-32, -12, 12, 38][v % 4] : [-34, -12][v % 2];
    const dir = v % 2 === 0 ? 1 : -1;
    if (!alongX) m.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    else if (dir < 0) m.rotation.y = Math.PI;
    vehicles.push({ mesh: m, alongX, roadCoord, lane: dir * 1.4, offset: (v * 11.7) % 180 - 90, dir, spd: 9 + (v % 5) * 2.2 });
  }

  // Iconic Landmark TV Tower (Detailed glass + white structural rings + spire!)
  const tvTower = new THREE.Group();
  tvTower.position.set(-22, 0, -22);
  tvTower.add(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2.4, 38, 12), clayMat('#e2e8f0', 0.65)));
  tvTower.children[0].position.y = 19;
  const orb1 = new THREE.Mesh(new THREE.SphereGeometry(3.4, 18, 14), clayMat('#e07a5f', 0.45, 0.2));
  orb1.position.y = 15;
  const orb2 = new THREE.Mesh(new THREE.SphereGeometry(2.4, 18, 14), clayMat('#38bdf8', 0.35, 0.3));
  orb2.position.y = 29;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 11, 8), clayMat('#f8fafc', 0.5));
  spire.position.y = 42;
  tvTower.add(orb1, orb2, spire);
  group.add(tvTower);

  // 2 Circling Rescue Helicopters!
  const helis = [createLowPolyHeli('#dc2626'), createLowPolyHeli('#0284c7')];
  helis.forEach((h) => group.add(h.heli));

  // 210 ULTRA-DETAILED DAYLIGHT ARCHITECTURAL SKYSCRAPERS (Window Curtain Walls + Helipads + HVAC + Podiums + Billboards!)
  const facades = [FACADE_GLASS, FACADE_OFFICE, FACADE_APT, FACADE_CORP];
  const roofM = clayMat('#94a3b8', 0.85);
  const hvacM = clayMat('#cbd5e1', 0.75);
  const helipadM = new THREE.MeshStandardMaterial({ map: HELIPAD_TEX, roughness: 0.8 });
  const billCols = ['#0284c7', '#e07a5f', '#f59e0b', '#10b981'];
  const buildings = [];

  for (let i = 0; i < 210; i++) {
    const angle = prand(i * 2.13) * Math.PI * 2;
    const radius = 8.2 + Math.pow(prand(i * 4.71), 0.78) * 68;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    // Keep river, park, and roads cleanly clear!
    if (x > 0 && x < 39) continue;
    if (Math.abs(z + 32) < 5.5 || Math.abs(z + 12) < 5.5 || Math.abs(z - 12) < 5.5 || Math.abs(z - 38) < 5.5) continue;
    if (Math.abs(x + 34) < 5.5 || Math.abs(x + 12) < 5.5) continue;
    if (Math.hypot(x + 22, z + 22) < 8) continue;

    const w = 3.2 + prand(i * 6.17) * 4.4;
    const d = 3.2 + prand(i * 8.31) * 4.4;
    const h = (radius < 28 ? 13 : 6.0) + prand(i * 10.9) * (radius < 30 ? 25 : 15);

    const baseTex = facades[i % facades.length].clone();
    baseTex.needsUpdate = true;
    baseTex.repeat.set(Math.max(1, Math.round(w / 4.5)), Math.max(1, Math.round(h / 11)));
    const wallMat = new THREE.MeshStandardMaterial({ map: baseTex, roughness: 0.65, metalness: i % 4 === 0 ? 0.22 : 0.06 });

    const bg = new THREE.Group();
    bg.position.set(x, 0, z);

    // Architectural Podium Base + Main Windowed Tower + Roof Rim + Rooftop Props!
    if (i % 8 === 0) {
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.46, w * 0.50, h, 14), [wallMat, roofM, roofM]);
      cyl.position.y = h / 2;
      bg.add(cyl);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.34, w * 0.34, 1.4, 12), hvacM);
      cap.position.y = h + 0.7;
      bg.add(cap);
    } else {
      const mats = [wallMat, wallMat, i % 5 === 0 ? helipadM : roofM, roofM, wallMat, wallMat];
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
      box.position.y = h / 2;
      bg.add(box);
      // Parapet roof trim
      bg.add(rbox(w + 0.22, 0.35, d + 0.22, 0.04, '#cbd5e1', 0, h + 0.12, 0, false));
      // Rooftop HVAC units, water tower, spire, or colorful billboard!
      if (i % 5 !== 0) {
        bg.add(rbox(w * 0.38, 1.1, d * 0.36, 0.05, hvacM, -w * 0.16, h + 0.7, -d * 0.12, false));
        bg.add(rbox(w * 0.22, 0.75, d * 0.24, 0.04, '#64748b', w * 0.20, h + 0.52, d * 0.16, false));
      }
      if (h > 18) {
        const crown = new THREE.Mesh(new THREE.BoxGeometry(w * 0.62, 3.2, d * 0.62), mats);
        crown.position.y = h + 1.6;
        bg.add(crown);
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 5.2, 6), hvacM);
        ant.position.y = h + 5.8;
        bg.add(ant);
      }
      if (i % 4 === 1) {
        bg.add(rbox(w * 0.72, 1.15, 0.22, 0.04, billCols[i % billCols.length], 0, h - 1.4, d / 2 + 0.15, false));
      }
    }
    group.add(bg);
    buildings.push({ bg, wallMat, dist: radius });
  }

  // Smooth Luminous Golden-White Cylindrical Energy Beam + Translucent Fresnel Shockwave Dome!
  const beamCore = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.8, 220, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: '#fffbeb', transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  beamCore.position.y = 110;
  const beamGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 5.2, 220, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: '#fb923c', transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  beamGlow.position.y = 110;
  group.add(beamCore, beamGlow);

  const cityDome = createShockwaveDome('#ff9e44', 2.4);
  cityDome.mesh.position.y = 0.5;
  group.add(cityDome.mesh);

  const groundWaveMat = new THREE.MeshBasicMaterial({ color: '#f97316', transparent: true, opacity: 0.72, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const groundWave = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.0, 64), groundWaveMat);
  groundWave.rotation.x = -Math.PI / 2;
  groundWave.position.y = 0.6;
  group.add(groundWave);

  const ringClouds = [];
  const rcGeo = new THREE.IcosahedronGeometry(1.8, 2);
  const rcMat = clayMat('#f5ebe0', 0.92, 0, { transparent: true, opacity: 0.65 });
  for (let i = 0; i < 28; i++) {
    const m = new THREE.Mesh(rcGeo, rcMat);
    group.add(m);
    ringClouds.push({ mesh: m, ang: (i / 28) * Math.PI * 2, jitter: prand(i * 5.3) * 0.4 + 0.8 });
  }

  // Fluffy High-Altitude Cumulus Clouds around perimeter eye
  const skyCloudMat = clayMat('#ffffff', 0.92, 0, { flatShading: true });
  for (let i = 0; i < 32; i++) {
    const cg = new THREE.Group();
    const ang = prand(i * 3.9) * Math.PI * 2;
    const r = 44 + prand(i * 7.1) * 55;
    cg.position.set(Math.cos(ang) * r, 56 + prand(i * 5.2) * 16, Math.sin(ang) * r);
    const p1 = new THREE.Mesh(new THREE.IcosahedronGeometry(5.2, 1), skyCloudMat);
    const p2 = new THREE.Mesh(new THREE.IcosahedronGeometry(3.8, 1), skyCloudMat);
    p2.position.set(4.0, -0.8, 1.2);
    const p3 = new THREE.Mesh(new THREE.IcosahedronGeometry(3.6, 1), skyCloudMat);
    p3.position.set(-3.8, -1.0, -0.8);
    cg.add(p1, p2, p3);
    group.add(cg);
  }

  return { group, buildings, vehicles, boats, crowd, helis, beamCore, beamGlow, cityDome, groundWave, groundWaveMat, ringClouds };
}

// ---------------------------------------------------------------------------
// 5. ACT 4: ORBITAL EARTH + SPACE STATION + EVACUATION ROCKET + MAGMA PLANET!
// ---------------------------------------------------------------------------
export function buildOrbitalEarth() {
  const group = new THREE.Group();
  group.visible = false;

  group.add(new THREE.HemisphereLight('#dbeafe', '#0f172a', 0.7));
  const sun = new THREE.DirectionalLight('#fff7ed', 1.45);
  sun.position.set(16, 10, 12);
  group.add(sun);

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
  group.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#e2e8f0', size: 0.65 })));

  const { earthTex } = makeEarthTextures();
  earthTex.magFilter = THREE.LinearFilter;
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
      float fbm(vec3 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.06; a *= 0.5; } return v; }
      void main() {
        vec3 n = normalize(vNormal); vec3 pDir = normalize(vPos);
        float diff = max(dot(n, uSunDir), 0.0);
        vec3 litEarth = texture2D(uEarthTex, vUv).rgb * (0.28 + 0.90 * diff);
        vec3 epic = normalize(vec3(0.22, 0.24, 0.94));
        float dEpic = distance(pDir, epic);
        float spreadRadius = uHeat * 2.55;
        float burnWave = smoothstep(spreadRadius + 0.30, spreadRadius - 0.30, dEpic);
        float n1 = fbm(pDir * 4.2 + vec3(0.0, uTime * 0.10, uTime * 0.07));
        float n2 = fbm(pDir * 9.5 - vec3(uTime * 0.16, 0.0, 0.0));
        float ridge = abs(n1 - 0.5) * 2.15 + (n2 - 0.5) * 0.30;
        float lavaRiver = 1.0 - smoothstep(0.02, 0.24, ridge);
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
        finalCol += mix(vec3(0.25, 0.72, 1.0), vec3(1.25, 0.38, 0.05), clamp(uHeat * 1.35, 0.0, 1.0)) * rim * (0.50 + uHeat * 0.55);
        gl_FragColor = vec4(finalCol, 1.0);
      }
    `,
  });
  const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(3.45, 72, 72), earthMat);
  group.add(earthMesh);

  const lowPolyClouds = new THREE.Group();
  const cMat = clayMat('#ffffff', 0.92, 0, { transparent: true, opacity: 0.88, flatShading: true });
  for (let i = 0; i < 32; i++) {
    const u = prand(i * 2.3 + 1);
    const v = prand(i * 4.7 + 2);
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = 3.68;
    const cg = new THREE.Group();
    cg.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    cg.lookAt(0, 0, 0);
    const s1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), cMat);
    s1.scale.set(1.4, 0.75, 0.35);
    const s2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), cMat);
    s2.position.set(0.32, 0.12, 0);
    s2.scale.set(1.1, 0.7, 0.35);
    cg.add(s1, s2);
    lowPolyClouds.add(cg);
  }
  group.add(lowPolyClouds);

  const atmosUniforms = { uColor: { value: new THREE.Color('#60a5fa') }, uIntensity: { value: 0.85 } };
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

  const station = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.25, 10), clayMat('#f8fafc', 0.45, 0.3));
  hull.rotation.z = Math.PI / 2;
  station.add(hull);
  const solar = clayMat('#1d4ed8', 0.25, 0.4, { emissive: '#0284c7', emissiveIntensity: 0.3 });
  station.add(rbox(0.45, 0.03, 2.1, 0.01, solar, -0.45, 0, 0, false));
  station.add(rbox(0.45, 0.03, 2.1, 0.01, solar, 0.45, 0, 0, false));
  station.scale.setScalar(0.8);
  group.add(station);

  // Evacuating sleek rocket
  const rocket = new THREE.Group();
  const rBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.95, 12), clayMat('#f8fafc', 0.4));
  const rNose = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 12), clayMat('#dc2626', 0.45));
  rNose.position.y = 0.65;
  const rFlame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.72, 10), new THREE.MeshBasicMaterial({ color: '#facc15' }));
  rFlame.rotation.x = Math.PI;
  rFlame.position.y = -0.82;
  rocket.add(rBody, rNose, rFlame);
  group.add(rocket);

  const planetDome = createShockwaveDome('#fdba74', 2.8);
  group.add(planetDome.mesh);

  return { group, earthMesh, earthUniforms, lowPolyClouds, cMat, atmosShell, atmosUniforms, station, rocket, planetDome };
}

// ---------------------------------------------------------------------------
// 6. ACT 5: MAGMA TWIST WITH NEW HERO + 2 SHOCKED ROOMMATES + GLASS SKYSCRAPER RUINS!
// ---------------------------------------------------------------------------
export function buildMagmaTwist() {
  const group = new THREE.Group();
  group.visible = false;

  group.add(new THREE.HemisphereLight('#fed7aa', '#450a0a', 0.68));
  const key = new THREE.DirectionalLight('#ffefd6', 1.15);
  key.position.set(5, 10, 7);
  key.castShadow = true;
  group.add(key);

  const lavaUniforms = { uTime: { value: 0 } };
  const lavaSea = new THREE.Mesh(
    new THREE.PlaneGeometry(110, 110, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: lavaUniforms,
      vertexShader: `uniform float uTime; varying vec2 vUv; void main() { vUv = uv; vec3 p = position; p.y += sin(p.x*0.45+uTime*1.8)*cos(p.z*0.4+uTime*1.4)*0.18; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `
        uniform float uTime; varying vec2 vUv;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
        void main(){
          vec2 p = vUv * 24.0 + vec2(uTime*0.18, -uTime*0.14);
          float n = noise(p)*0.6 + noise(p*2.6 - uTime*0.25)*0.4;
          vec3 crust = vec3(0.11, 0.04, 0.03);
          vec3 orange = vec3(0.95, 0.28, 0.04);
          vec3 bright = vec3(1.30, 0.78, 0.18);
          vec3 col = mix(crust, orange, smoothstep(0.38, 0.66, n));
          col = mix(col, bright, smoothstep(0.68, 0.90, n));
          float d = length(vUv - 0.5) * 2.0;
          col = mix(col, vec3(0.24, 0.11, 0.07), smoothstep(0.38, 0.98, d));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  );
  lavaSea.rotation.x = -Math.PI / 2;
  lavaSea.position.y = -0.35;
  group.add(lavaSea);

  // Obsidian rock island + Windowed Half-Sunken Skyscraper Ruins!
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 1), clayMat('#292524', 0.92, 0.05, { flatShading: true }));
  rock.scale.set(1.25, 0.45, 1.1);
  group.add(rock);

  const ruinMat = new THREE.MeshStandardMaterial({ map: FACADE_GLASS, color: '#94a3b8', roughness: 0.7 });
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 8.5, 3.4), ruinMat);
  r1.position.set(-5.6, 1.4, -8.5);
  r1.rotation.set(0.15, 0.3, -0.22);
  const r2 = new THREE.Mesh(new THREE.BoxGeometry(3.8, 9.6, 3.8), ruinMat);
  r2.position.set(5.4, 2.0, -10.5);
  r2.rotation.set(-0.12, -0.35, 0.20);
  group.add(r1, r2);

  // Hero Xiaojiu in brand-new stylish hoodie!
  const xiaojiu = createOriginalCharacter({
    hoodie: '#0284c7',
    hoodieTrim: '#38bdf8',
    innerTee: '#f8fafc',
    pants: '#1e293b',
    shoeAccent: '#0284c7',
    hair: '#171c2b',
    withHeadphones: true,
    withPhone: true,
    sitting: false,
  });
  xiaojiu.root.position.set(-0.25, 0.85, 0.15);
  xiaojiu.root.scale.setScalar(1.12);
  xiaojiu.setExpression('fierce');
  group.add(xiaojiu.root);

  // Shocked Roommate bobbing on an adjacent lava rock waving hands cleanly inside frame!
  const sideRock = new THREE.Group();
  sideRock.position.set(1.75, 0.12, -1.25);
  const srMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(1.05, 1), clayMat('#292524', 0.9, 0, { flatShading: true }));
  srMesh.scale.set(1.2, 0.45, 1.1);
  sideRock.add(srMesh);
  const sideMate = createOriginalCharacter({
    hoodie: '#f59e0b',
    hoodieTrim: '#fbbf24',
    pants: '#334155',
    hair: '#451a03',
    withHeadphones: false,
    withPhone: false,
    sitting: true,
  });
  sideMate.root.position.set(0, 0.22, 0);
  sideMate.root.rotation.y = -0.45;
  sideMate.root.scale.setScalar(0.88);
  sideMate.setExpression('panic');
  sideMate.armL.rotation.x = -2.3;
  sideMate.armR.rotation.x = -2.3;
  sideRock.add(sideMate.root);
  group.add(sideRock);

  // Cartoon white-orange "POOF!" vaporize smoke puffs rising from Xiaojiu's empty hands!
  const vanishPuffs = [];
  const vpGeo = new THREE.IcosahedronGeometry(0.16, 2);
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(
      vpGeo,
      clayMat(i < 5 ? '#fde68a' : '#e5e7eb', 0.9, 0, { transparent: true, opacity: 0.85 })
    );
    m.visible = false;
    group.add(m);
    const ang = (i / 14) * Math.PI * 2;
    vanishPuffs.push({ mesh: m, ang, spd: 0.45 + prand(i * 3.7) * 0.65, seed: i * 1.1 });
  }

  // Cartoon 3D Low-Poly Question Marks ("??") popping above stunned Xiaojiu!
  const makeQuestionMark = (col = '#fde047') => {
    const q = new THREE.Group();
    const qMat = clayMat(col, 0.35, 0.05, { emissive: col, emissiveIntensity: 0.38 });
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.048, 10, 18, Math.PI * 1.45), qMat);
    hook.rotation.z = -0.35;
    hook.position.set(0, 0.28, 0);
    const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.09, 6, 10), qMat);
    stem.position.set(0, 0.09, 0);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 12), qMat);
    dot.position.set(0, -0.06, 0);
    q.add(hook, stem, dot);
    return q;
  };
  const questionMarks = new THREE.Group();
  const q1 = makeQuestionMark('#fde047');
  q1.position.set(0.62, 0.22, 0.15);
  q1.rotation.z = -0.22;
  const q2 = makeQuestionMark('#fef08a');
  q2.position.set(1.02, 0.04, 0.08);
  q2.scale.setScalar(0.76);
  q2.rotation.z = -0.38;
  questionMarks.add(q1, q2);
  questionMarks.position.set(-0.25, 3.65, 0.25);
  questionMarks.visible = false;
  group.add(questionMarks);

  const bgSmoke = [];
  const smGeo = new THREE.IcosahedronGeometry(0.9, 2);
  const smMat = clayMat('#78716c', 0.92, 0, { transparent: true, opacity: 0.42 });
  for (let i = 0; i < 20; i++) {
    const m = new THREE.Mesh(smGeo, smMat);
    group.add(m);
    bgSmoke.push({ mesh: m, x: (prand(i * 3.1) - 0.5) * 22, z: -5 - prand(i * 5.7) * 14, seed: i * 1.9 });
  }

  return { group, lavaUniforms, xiaojiu, sideRock, vanishPuffs, questionMarks, bgSmoke };
}

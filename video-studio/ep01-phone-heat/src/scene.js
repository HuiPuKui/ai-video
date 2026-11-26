import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  prand,
  createOriginalCharacter,
  buildSunlitDorm,
  buildSunlitCampus,
  buildSunlitCity,
  buildOrbitalEarth,
  buildMagmaTwist,
} from './lowpoly_world.js';

const params = new URLSearchParams(window.location.search);
const MODE = params.get('mode') || 'video';

const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.86;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#dfd7ca');

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.22;

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1200);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.0,
  0.26,
  0.92
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(e0, e1, x) { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
function easeOutCubic(x) { const t = clamp(x, 0, 1); return 1 - Math.pow(1 - t, 3); }
function easeOutBack(x) { const t = clamp(x, 0, 1); const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

const dorm = buildSunlitDorm();
const campus = buildSunlitCampus();
const city = buildSunlitCity();
const space = buildOrbitalEarth();
const twist = buildMagmaTwist();
scene.add(dorm.group, campus.group, city.group, space.group, twist.group);

// Cover Hero Character
const coverGroup = new THREE.Group();
coverGroup.visible = false;
scene.add(coverGroup);
coverGroup.add(new THREE.HemisphereLight('#f0f7ff', '#7c2d12', 0.95));
const covKey = new THREE.DirectionalLight('#fffbeb', 1.45);
covKey.position.set(-4, 8, 9);
coverGroup.add(covKey);

const coverXiaojiu = createOriginalCharacter({
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
coverXiaojiu.setExpression('panic', 1.2);
coverXiaojiu.phone.bodyMat.emissive.set('#f97316');
coverXiaojiu.phone.bodyMat.emissiveIntensity = 1.8;
coverXiaojiu.phone.light.intensity = 1.8;
coverGroup.add(coverXiaojiu.root);

// HUD elements
let TIMELINE = null;
const elHudCard = document.getElementById('tl-hud');
const elTime = document.getElementById('tl-time');
const elPower = document.getElementById('tl-power');
const elCompare = document.getElementById('tl-compare');
const elTrPill = document.getElementById('tr-pill');
const elSubtitle = document.getElementById('subtitle-text');
const elFlash = document.getElementById('flash-overlay');
const elCoverLayer = document.getElementById('cover-layer');
const pips = Array.from(document.querySelectorAll('#tl-pips .pip'));

const SUP_MAP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
function toSup(n) { return String(n).split('').map((c) => SUP_MAP[c] || c).join(''); }
function formatWatts(w) {
  if (w < 1000) return `${Math.round(w)} 瓦`;
  if (w < 10000) return `${Math.round(w).toLocaleString('en-US')} 瓦`;
  if (w < 1e8) return `${(w / 1e4).toFixed(w < 1e6 ? 1 : 0)} 万瓦`;
  if (w < 1e12) return `${(w / 1e8).toFixed(w < 1e10 ? 1 : 0)} 亿瓦`;
  if (w < 1e16) return `${(w / 1e12).toFixed(1)} 太瓦`;
  const exp = Math.floor(Math.log10(w));
  return `${(w / Math.pow(10, exp)).toFixed(2)}×10${toSup(exp)} 瓦`;
}

function setActiveWorld(name) {
  dorm.group.visible = name === 'dorm';
  campus.group.visible = name === 'campus';
  city.group.visible = name === 'city';
  space.group.visible = name === 'space';
  twist.group.visible = name === 'twist';
  coverGroup.visible = name === 'cover';
}

function updateDormPuffs(t, heatLvl) {
  const origin = new THREE.Vector3(-1.85, 1.85, -1.25);
  dorm.puffs.forEach((p) => {
    const { mesh, kind, seed } = p;
    if (kind === 'drip') {
      if (heatLvl < 0.34) { mesh.visible = false; return; }
      mesh.visible = true;
      const cyc = (t * 1.45 + seed) % 1;
      mesh.position.set(origin.x + (prand(seed * 2) - 0.5) * 0.45, origin.y - cyc * 0.9, origin.z + (prand(seed * 3) - 0.5) * 0.3);
      mesh.scale.setScalar(1 - cyc * 0.35);
    } else if (kind === 'smoke') {
      if (heatLvl < 0.20) { mesh.visible = false; return; }
      mesh.visible = true;
      const cyc = (t * 0.72 + seed) % 1;
      const spread = 0.5 + heatLvl * 1.4;
      mesh.position.set(origin.x + Math.sin(t * 2.1 + seed) * 0.28 + (prand(seed) - 0.5) * spread, origin.y + 0.1 + cyc * 2.7, origin.z + (prand(seed * 4) - 0.5) * spread);
      mesh.scale.setScalar(0.45 + cyc * (1.2 + heatLvl * 1.4));
      mesh.material.opacity = (1 - cyc) * 0.72 * clamp((heatLvl - 0.20) * 2.5, 0, 1);
    } else {
      if (heatLvl < 0.60) { mesh.visible = false; return; }
      mesh.visible = true;
      const cyc = (t * 1.65 + seed) % 1;
      const spread = 0.65 + (heatLvl - 0.60) * 2.6;
      mesh.position.set(origin.x + (prand(seed * 5) - 0.5) * spread + Math.sin(t * 7 + seed) * 0.12, origin.y - 0.35 + cyc * 1.4, origin.z + 0.25 + (prand(seed * 7) - 0.5) * spread);
      mesh.scale.setScalar((1 - cyc * 0.6) * (0.65 + prand(seed) * 0.8));
      mesh.material.opacity = (1 - cyc) * 0.85;
    }
  });
}

// ---------------------------------------------------------------------------
// BEAT-SYNCED DYNAMIC DIRECTOR ENGINE (ZERO STATIC SHOTS!)
// ---------------------------------------------------------------------------
function renderAtTime(t) {
  if (!TIMELINE) return;
  const beats = TIMELINE.beats;
  const beatSec = TIMELINE.beat_sec || (60 / 124);
  let beat = beats[beats.length - 1];
  for (let i = 0; i < beats.length; i++) {
    if (t >= beats[i].start && t < beats[i].end) { beat = beats[i]; break; }
  }
  const localT = clamp(t - beat.start, 0, beat.duration);
  const u = clamp(localT / Math.max(beat.duration, 0.001), 0, 1);
  const act = beat.act;

  // Musical 124 BPM beat pulse (peaks sharply on every kick downbeat!)
  const beatPhase = (t % beatSec) / beatSec;
  const musicPulse = Math.exp(-beatPhase * 8.5);
  // Transition / Milestone Drop Impact Pulse (peaks right when a new beat starts!)
  const dropPulse = Math.exp(-localT * 6.5);

  const simT = lerp(beat.t_start_sim, beat.t_end_sim, smoothstep(0.0, 0.24, u));

  // HUD Beat-Synced Elastic Pop!
  const isHook = act === 'hook_flash';
  const isTwist = act === 'twist_island';
  elTime.textContent = (isTwist || isHook) ? beat.display_t : `第 ${Math.round(simT)} 秒`;
  elPower.textContent = (isTwist || isHook) ? beat.power_label : (u > 0.24 ? beat.power_label : formatWatts(5 * Math.pow(2, simT)));
  elPower.style.color = isTwist ? '#38bdf8' : '#fb923c';
  elCompare.textContent = beat.compare_line;
  const showTwistSub = !isTwist || localT >= (beat.pre_delay || 1.0) - 0.08;
  if (beat.subtitle && showTwistSub) {
    elSubtitle.style.display = '';
    elSubtitle.innerHTML = beat.subtitle;
  } else {
    elSubtitle.style.display = 'none';
    elSubtitle.innerHTML = '';
  }

  const hudScale = 1.0 + dropPulse * 0.08 + musicPulse * (act === 'dorm_calm' ? 0.012 : 0.022);
  elHudCard.style.transform = `scale(${hudScale.toFixed(4)})`;
  elHudCard.style.transformOrigin = 'top left';

  pips.forEach((p, idx) => p.classList.toggle('on', idx < beat.step_idx));
  if (beat.fast_tag) {
    elTrPill.textContent = beat.fast_tag;
    elTrPill.style.opacity = '1';
    elTrPill.style.transform = `scale(${(1 + musicPulse * 0.05).toFixed(3)})`;
  } else {
    elTrPill.style.opacity = '0';
  }

  const isDark = ['earth_boil', 'magma_planet', 'twist_island'].includes(act) || (isHook && u < 0.48);
  document.body.classList.toggle('dark-scene', isDark);

  // Beat-synced impact flash on major drops
  let flash = 0;
  if (['hook_flash', 'campus_blast', 'city_dome', 'magma_planet'].includes(act)) flash = Math.max(0, 1 - localT / 0.18) * 0.42;
  if (isHook && Math.abs(u - 0.48) < 0.05) flash = Math.max(flash, (1 - Math.abs(u - 0.48) / 0.05) * 0.55);
  elFlash.style.opacity = String(flash);

  // Dynamic handheld + beat impact camera jolt (NEVER dead frozen!)
  let shakeAmp = 0.015; // subtle living handheld motion even in calm scenes!
  if (isHook) shakeAmp = 0.11;
  if (act === 'dorm_melt') shakeAmp = 0.035;
  if (act === 'dorm_smoke') shakeAmp = 0.065;
  if (act === 'campus_blast') shakeAmp = 0.15 * (1 - u * 0.45) + musicPulse * 0.04;
  if (act === 'city_dome') shakeAmp = 0.16 * (1 - u * 0.35) + musicPulse * 0.05;
  if (act === 'magma_planet') shakeAmp = 0.09 + musicPulse * 0.04;
  const sx = Math.sin(t * 43.3) * shakeAmp + Math.sin(t * 2.4) * 0.03;
  const sy = Math.cos(t * 51.7) * shakeAmp + Math.cos(t * 1.9) * 0.025;

  // Beat-synced FOV Zoom Punch (卡点推镜冲击感!)
  const fovPunch = dropPulse * 3.8 + musicPulse * (['hook_flash', 'campus_blast', 'city_dome', 'stratosphere', 'earth_boil', 'magma_planet'].includes(act) ? 1.35 : 0.45);

  space.earthMesh.position.set(0, 0, 0);
  space.lowPolyClouds.position.set(0, 0, 0);
  space.atmosShell.position.set(0, 0, 0);

  // =========================================================================
  // ACT 0: 0–3s VIRAL HOOK FLASH (MAGMA EARTH SHOCK -> RED-HOT PHONE CLOSEUP!)
  // =========================================================================
  if (act === 'hook_flash') {
    if (u < 0.48) {
      const k = easeOutCubic(u / 0.48);
      setActiveWorld('space');
      scene.background.set('#070b17');
      scene.fog = null;
      scene.environmentIntensity = 0.35;
      bloomPass.strength = 0.34 + musicPulse * 0.05;
      space.earthUniforms.uTime.value = 18.0 + t * 2.0;
      space.earthUniforms.uHeat.value = lerp(0.82, 1.0, k);
      space.earthMesh.rotation.y = lerp(0.15, 0.55, k);
      space.lowPolyClouds.visible = false;
      space.atmosUniforms.uColor.value.set('#f97316');
      space.atmosUniforms.uIntensity.value = 1.2;
      space.planetDome.mesh.scale.setScalar(4.0 + k * 2.8);
      space.planetDome.uniforms.uOpacity.value = clamp(0.65 * (1 - k * 0.65), 0.12, 0.65);
      space.station.position.set(4.5, 1.8, 2.0);
      space.rocket.position.set(-3.2, 3.2, 2.2);
      const orbitR = lerp(15.2, 11.8, k);
      camera.fov = 42 - fovPunch;
      camera.position.set(Math.sin(lerp(-0.25, 0.15, k)) * orbitR + sx, lerp(0.9, -0.2, k) + sy, Math.cos(lerp(-0.25, 0.15, k)) * orbitR);
      camera.lookAt(0, -0.2, 0);
    } else {
      const k = easeOutCubic((u - 0.48) / 0.52);
      setActiveWorld('dorm');
      scene.background.set('#dfd7ca');
      scene.fog = null;
      scene.environmentIntensity = 0.22;
      bloomPass.strength = 0.08;
      const heatLvl = 0.55;
      dorm.xiaojiu.setExpression('panic', t);
      dorm.roommate.setExpression('panic', t);
      dorm.mateDesk.setExpression('panic', t);
      dorm.xiaojiu.root.position.y = 0.48 + Math.abs(Math.sin(t * 16)) * 0.08;
      dorm.xiaojiu.headGroup.rotation.set(0.10 + Math.sin(t * 12) * 0.06, Math.sin(t * 8) * 0.10, 0);
      dorm.xiaojiu.phone.bodyMat.emissive.set('#ff4500');
      dorm.xiaojiu.phone.bodyMat.emissiveIntensity = 2.4;
      dorm.xiaojiu.phone.light.intensity = 3.2;
      dorm.xiaojiu.phone.group.position.x = Math.sin(t * 42) * 0.035;
      dorm.alarmLight.intensity = Math.sin(t * 18) > 0 ? 3.5 : 0;
      updateDormPuffs(t + 12.0, heatLvl);
      camera.fov = 38 - fovPunch;
      camera.position.set(lerp(0.85, 0.05, k) + sx, lerp(3.25, 2.85, k) + sy, lerp(2.85, 2.05, k));
      camera.lookAt(-1.82, 2.02, -1.55);
    }
  } else if (act.startsWith('dorm_')) {
    setActiveWorld('dorm');
    scene.background.set('#dfd7ca');
    scene.fog = null;
    scene.environmentIntensity = 0.22;
    bloomPass.strength = 0.0;

    let heatLvl = 0;
    if (act === 'dorm_calm') heatLvl = 0.02;
    if (act === 'dorm_warm') heatLvl = lerp(0.14, 0.34, u);
    if (act === 'dorm_melt') heatLvl = lerp(0.36, 0.60, u);
    if (act === 'dorm_smoke') heatLvl = lerp(0.66, 1.0, u);

    dorm.xiaojiu.setExpression(act === 'dorm_calm' ? 'calm' : act === 'dorm_warm' ? 'sweat' : 'panic', t);
    dorm.roommate.setExpression(act === 'dorm_calm' ? 'calm' : act === 'dorm_warm' ? 'sweat' : 'panic', t);
    dorm.mateDesk.setExpression(act === 'dorm_smoke' ? 'panic' : 'calm', t);

    // CONTINUOUS LIVELY CHARACTER ANIMATIONS (Xiaojiu + Both Roommates ALWAYS ALIVE!)
    // 1. Xiaojiu head bob to 124 BPM + enthusiastic gaming thumb-taps + kicking legs!
    dorm.xiaojiu.headGroup.rotation.x = 0.14 + Math.sin(t * 6.5) * 0.06;
    dorm.xiaojiu.headGroup.rotation.y = Math.sin(t * 3.2) * 0.10;
    dorm.xiaojiu.headGroup.rotation.z = Math.cos(t * 4.5) * 0.05;
    dorm.xiaojiu.armL.position.z = Math.sin(t * 24) * 0.04;
    dorm.xiaojiu.armR.position.z = Math.cos(t * 28) * 0.045;
    dorm.xiaojiu.phone.group.rotation.z = Math.sin(t * 10) * (0.06 + heatLvl * 0.12);
    dorm.xiaojiu.phone.screenMat.emissiveIntensity = 0.8 + Math.sin(t * 18) * 0.25;

    if (act === 'dorm_calm') {
      // Playfully kicking sneakers up & down while gaming!
      dorm.xiaojiu.legL.rotation.x = Math.sin(t * 6.5) * 0.16;
      dorm.xiaojiu.legR.rotation.x = -Math.sin(t * 6.5) * 0.16;
      dorm.xiaojiu.root.position.y = 0.48 + Math.abs(Math.sin(t * 6.5)) * 0.03;
      // Roommate #1 nodding/relaxing, Roommate #2 typing rapidly on keyboard!
      dorm.roommate.headGroup.rotation.y = Math.sin(t * 2.1) * 0.18;
      dorm.roommate.headGroup.rotation.x = Math.sin(t * 4.2) * 0.05;
      dorm.roommate.armL.rotation.x = 0;
      dorm.roommate.armR.rotation.x = 0;
      dorm.mateDesk.root.rotation.y = -2.2;
      dorm.mateDesk.armL.rotation.x = -0.8 + Math.sin(t * 20) * 0.12;
      dorm.mateDesk.armR.rotation.x = -0.8 - Math.sin(t * 20) * 0.12;
      dorm.alarmLight.intensity = 0;
    } else if (act === 'dorm_warm') {
      // Shaking hot hands & leaning head in confusion!
      dorm.xiaojiu.legL.rotation.x = Math.sin(t * 10) * 0.12;
      dorm.xiaojiu.legR.rotation.x = -Math.sin(t * 10) * 0.12;
      dorm.xiaojiu.armR.rotation.x = Math.sin(t * 16) * 0.18;
      dorm.roommate.headGroup.rotation.y = -0.45 + Math.sin(t * 4) * 0.12;
      dorm.roommate.armL.rotation.x = -0.4;
      dorm.roommate.armR.rotation.x = 0;
      dorm.alarmLight.intensity = 0;
    } else if (act === 'dorm_melt') {
      // Recoiling back in shock, legs kicking rapidly!
      dorm.xiaojiu.root.position.y = 0.48 + Math.abs(Math.sin(t * 14)) * 0.07;
      dorm.xiaojiu.legL.rotation.x = -0.25 + Math.sin(t * 18) * 0.22;
      dorm.xiaojiu.legR.rotation.x = -0.25 - Math.sin(t * 18) * 0.22;
      dorm.roommate.headGroup.rotation.y = -0.55;
      dorm.roommate.armL.rotation.x = -1.2 + Math.sin(t * 14) * 0.15;
      dorm.roommate.armR.rotation.x = -1.2 - Math.sin(t * 14) * 0.15;
      dorm.alarmLight.intensity = 0;
    } else {
      // FULL PANIC! Everyone bouncing & waving arms!
      dorm.xiaojiu.root.position.y = 0.48 + Math.abs(Math.sin(t * 16)) * 0.12;
      dorm.xiaojiu.legL.rotation.x = Math.sin(t * 22) * 0.28;
      dorm.xiaojiu.legR.rotation.x = -Math.sin(t * 22) * 0.28;
      dorm.roommate.root.position.y = 0.48 + Math.abs(Math.sin(t * 15)) * 0.18;
      dorm.roommate.armL.rotation.x = -2.4 + Math.sin(t * 22) * 0.3;
      dorm.roommate.armR.rotation.x = -2.4 - Math.sin(t * 22) * 0.3;
      dorm.mateDesk.root.rotation.y = lerp(-2.2, -0.85, easeOutCubic(u));
      dorm.mateDesk.armL.rotation.x = -2.3 + Math.sin(t * 20) * 0.25;
      dorm.mateDesk.armR.rotation.x = -2.3 - Math.sin(t * 20) * 0.25;
      dorm.alarmLight.intensity = Math.sin(t * 16) > 0 ? 4.2 : 0;
    }

    const pCol = new THREE.Color().setHSL(lerp(0.01, 0.08, heatLvl), 0.95, 0.52);
    dorm.xiaojiu.phone.bodyMat.emissive.copy(heatLvl < 0.08 ? new THREE.Color('#000000') : pCol);
    dorm.xiaojiu.phone.bodyMat.emissiveIntensity = heatLvl < 0.08 ? 0 : heatLvl * 2.2;
    dorm.xiaojiu.phone.light.intensity = heatLvl * 2.8;
    dorm.xiaojiu.phone.group.position.x = heatLvl > 0.3 ? Math.sin(t * 36) * 0.04 * heatLvl : 0;

    updateDormPuffs(t, heatLvl);

    // DYNAMIC MULTI-SHOT BEAT-SYNCED CAMERAS (NO STATIC SHOTS!)
    if (act === 'dorm_calm') {
      if (u < 0.36) {
        // Shot 1A (0.0 -> 2.3s): Fast Sweeping Crane Swoop in from wide high dorm into Xiaojiu!
        const k = easeOutCubic(u / 0.36);
        const ang = lerp(1.15, 0.65, k);
        const rad = lerp(11.8, 7.6, k);
        camera.fov = 42 - fovPunch;
        camera.position.set(Math.sin(ang) * rad + sx, lerp(8.4, 4.6, k) + sy, Math.cos(ang) * rad);
        camera.lookAt(lerp(0.4, -1.2, k), lerp(1.8, 1.9, k), lerp(-0.5, -1.4, k));
      } else if (u < 0.68) {
        // Shot 1B (2.3 -> 4.4s): Beat-Synced Cut to Energetic Close-Up Orbit on Gaming Hands & Face!
        const k = (u - 0.36) / 0.32;
        const ang = lerp(-0.55, 0.45, k);
        camera.fov = 36 - fovPunch;
        camera.position.set(-1.85 + Math.sin(ang) * 3.1 + sx, lerp(2.9, 2.55, k) + sy, -1.45 + Math.cos(ang) * 3.1);
        camera.lookAt(-1.85, 1.95, -1.65);
      } else {
        // Shot 1C (4.4 -> 6.5s): Beat-Synced Cut to Sweeping 3-Person Wide Orbit!
        const k = (u - 0.68) / 0.32;
        const ang = lerp(0.55, 0.92, k);
        camera.fov = 40 - fovPunch;
        camera.position.set(Math.sin(ang) * 8.6 + sx, lerp(5.4, 4.8, k) + sy, Math.cos(ang) * 8.6);
        camera.lookAt(0.2, 1.65, -0.75);
      }
    } else if (act === 'dorm_warm') {
      if (u < 0.48) {
        // Shot 2A: Tight dramatic push-in onto the reddening phone!
        const k = easeOutCubic(u / 0.48);
        camera.fov = 34 - fovPunch;
        camera.position.set(lerp(1.4, 0.35, k) + sx, lerp(3.0, 2.55, k) + sy, lerp(2.8, 1.85, k));
        camera.lookAt(-1.8, 1.9, -1.5);
      } else {
        // Shot 2B: Whip-orbit around Xiaojiu sweating & shrugging!
        const k = (u - 0.48) / 0.52;
        const ang = lerp(0.55, -0.55, k);
        camera.fov = 38 - fovPunch;
        camera.position.set(-1.85 + Math.sin(ang) * 3.8 + sx, 3.15 + sy, -1.4 + Math.cos(ang) * 3.8);
        camera.lookAt(-1.75, 2.05, -1.55);
      }
    } else if (act === 'dorm_melt') {
      if (u < 0.50) {
        // Shot 3A: Dramatic left-angle push-in on melting orange drips!
        const k = easeOutCubic(u / 0.50);
        camera.fov = 36 - fovPunch;
        camera.position.set(lerp(-4.5, -3.5, k) + sx, lerp(3.1, 2.7, k) + sy, lerp(2.8, 1.9, k));
        camera.lookAt(-1.75, 1.92, -1.5);
      } else {
        // Shot 3B: Snap cut to low-angle panicked reaction of Xiaojiu + roommate staring!
        const k = (u - 0.50) / 0.50;
        camera.fov = 40 - fovPunch;
        camera.position.set(lerp(1.2, 3.2, k) + sx, lerp(2.4, 3.4, k) + sy, lerp(3.4, 4.8, k));
        camera.lookAt(-0.8, 1.95, -1.1);
      }
    } else {
      // dorm_smoke: Fast whip pull-back + sweeping orbit showing fire, smoke & all 3 panicking!
      const k = easeOutCubic(u);
      const ang = lerp(0.45, 0.98, k);
      const rad = lerp(5.4, 9.4, k);
      camera.fov = 42 - fovPunch;
      camera.position.set(Math.sin(ang) * rad + sx, lerp(3.8, 6.2, k) + sy, Math.cos(ang) * rad);
      camera.lookAt(0.15, 1.85, -0.65);
    }

  // =========================================================================
  // ACT 2: MULTI-SHOT CAMPUS BLAST (STREET LEVEL HERO -> HELI ORBIT SWEEP!)
  // =========================================================================
  } else if (act === 'campus_blast') {
    setActiveWorld('campus');
    scene.background.set('#dcd4c8');
    scene.fog = new THREE.Fog('#dcd4c8', 42, 125);
    scene.environmentIntensity = 0.22;
    bloomPass.strength = 0.0;

    const sF = Math.sin(t * 22) > 0;
    campus.fireTruck.sR.color.set(sF ? '#ff2222' : '#450a0a');
    campus.fireTruck.sB.color.set(sF ? '#0c4a6e' : '#38bdf8');
    campus.newsRotor.rotation.y = t * 28;
    campus.newsHeli.position.set(-7.8 + Math.sin(t * 1.8) * 1.6, 15.0 + Math.cos(t * 2.2) * 0.5, 6.5);

    campus.shockDome.mesh.scale.setScalar(1.2 + u * 24);
    campus.shockDome.uniforms.uOpacity.value = clamp(0.95 - u * 0.9, 0.08, 0.92);

    const grow = 0.65 + smoothstep(0, 0.8, u) * 1.6;
    campus.cloudPuffs.forEach((p) => {
      p.mesh.position.set(campus.blastOrigin.x + p.dx * grow, campus.blastOrigin.y + p.dy * grow + u * 1.4, campus.blastOrigin.z + p.dz * grow);
      p.mesh.scale.setScalar(p.baseR * (0.7 + u * 0.55) * (1 + Math.sin(t * 10 + p.seed) * 0.08));
      p.mesh.rotation.set(t * 0.8 + p.seed, t * 0.9 + p.seed, 0);
    });

    campus.dormMat.emissive.set('#ea580c');
    campus.dormMat.emissiveIntensity = smoothstep(0.25, 0.95, u) * 0.22;

    campus.shards.forEach((gs) => {
      const dt = (localT % 3.2) * 0.72 + 0.14;
      gs.mesh.position.set(campus.blastOrigin.x + gs.vx * dt, campus.blastOrigin.y + gs.vy * dt - 2.6 * dt * dt, campus.blastOrigin.z + 0.8 + gs.vz * dt);
      gs.mesh.rotation.set(gs.rx * dt, gs.ry * dt, 0);
    });

    campus.runners.forEach((r) => {
      r.p.root.position.x = r.x0 + r.dir * localT * r.spd * 1.25;
      r.p.legL.rotation.x = Math.sin(t * 20 + r.phase) * 0.7;
      r.p.legR.rotation.x = -Math.sin(t * 20 + r.phase) * 0.7;
      r.p.armL.rotation.x = -2.2 + Math.sin(t * 20 + r.phase) * 0.35;
      r.p.armR.rotation.x = -2.2 - Math.sin(t * 20 + r.phase) * 0.35;
    });

    if (u < 0.38) {
      // Shot A: Low dramatic street-level hero angle looking UP past fleeing crowd & fire truck at the blast!
      const k = easeOutCubic(u / 0.38);
      camera.fov = 48 - fovPunch;
      camera.position.set(lerp(-7.5, -2.5, k) + sx, lerp(3.4, 5.8, k) + sy, lerp(20.5, 24.5, k));
      camera.lookAt(1.2, lerp(10.5, 9.8, k), 1.5);
    } else {
      // Shot B: Fast Sweeping Helicopter Orbit pulling wide over campus plaza!
      const k = (u - 0.38) / 0.62;
      const ang = lerp(0.25, 0.78, k);
      const rad = lerp(27.5, 40.0, k);
      camera.fov = 44 - fovPunch;
      camera.position.set(Math.sin(ang) * rad + sx, lerp(12.5, 19.5, k) + sy, Math.cos(ang) * rad);
      camera.lookAt(0.5, 7.6, 2.2);
    }

  // =========================================================================
  // ACT 3: MULTI-SHOT LIVING METROPOLIS (LOW CANYON -> HIGH HELI ORBIT -> ROCKET ASCENT!)
  // =========================================================================
  } else if (act === 'city_dome' || act === 'stratosphere') {
    setActiveWorld('city');
    const isRise = act === 'stratosphere';
    const skyCol = new THREE.Color('#c8d9e8').lerp(new THREE.Color('#dca87a'), isRise ? 0.85 : u * 0.58);
    scene.background.copy(skyCol);
    scene.fog = new THREE.Fog(skyCol.getHex(), isRise ? 90 : 68, isRise ? 250 : 195);
    scene.environmentIntensity = 0.22;
    bloomPass.strength = 0.08;

    const waveR = isRise ? 58 + u * 42 : 6 + u * 56;
    city.cityDome.mesh.scale.setScalar(waveR);
    city.cityDome.uniforms.uOpacity.value = clamp(0.88 - waveR / 125, 0.18, 0.85);
    city.groundWave.scale.setScalar(waveR);
    city.groundWaveMat.opacity = clamp(0.95 - waveR / 110, 0.12, 0.82);

    city.vehicles.forEach((v) => {
      const pos = ((v.offset + t * v.spd * 1.35 * v.dir + 90) % 180) - 90;
      if (v.alongX) v.mesh.position.set(pos, 0.08, v.roadCoord + v.lane);
      else v.mesh.position.set(v.roadCoord + v.lane, 0.08, pos);
    });
    city.boats.forEach((b) => {
      const z = ((b.z0 + t * 7.2 * b.dir + 80) % 160) - 80;
      b.mesh.position.set(b.x, 0.12, z);
      b.mesh.rotation.y = b.dir > 0 ? 0 : Math.PI;
    });
    city.crowd.forEach((c) => {
      c.p.root.position.z = c.z0 + c.dir * localT * c.spd * 1.35;
      c.p.legL.rotation.x = Math.sin(t * 18 + c.x0) * 0.65;
      c.p.legR.rotation.x = -Math.sin(t * 18 + c.x0) * 0.65;
      c.p.armL.rotation.x = -2.2 + Math.sin(t * 18 + c.x0) * 0.3;
      c.p.armR.rotation.x = -2.2 - Math.sin(t * 18 + c.x0) * 0.3;
    });
    city.helis.forEach((h, idx) => {
      const a = t * 0.68 + idx * Math.PI;
      const r = 24 + idx * 9;
      h.heli.position.set(Math.cos(a) * r, 24 + idx * 7, Math.sin(a) * r);
      h.heli.rotation.y = -a + Math.PI / 2;
      h.rotor.rotation.y = t * 30;
    });
    city.ringClouds.forEach((rc) => {
      rc.mesh.position.set(Math.cos(rc.ang) * waveR * 0.96, 1.6 * rc.jitter, Math.sin(rc.ang) * waveR * 0.96);
      rc.mesh.scale.setScalar((1.0 + waveR * 0.032) * rc.jitter);
      rc.mesh.rotation.y = t * 0.6 + rc.ang;
    });
    city.buildings.forEach((b) => {
      const hit = smoothstep(b.dist - 4, b.dist + 5, waveR);
      b.wallMat.emissive.set('#ea580c');
      b.wallMat.emissiveIntensity = hit * 0.18;
    });

    if (!isRise) {
      if (u < 0.36) {
        // Shot A: Low dramatic skyline canyon pull-back right between the windowed towers!
        const k = easeOutCubic(u / 0.36);
        camera.fov = 50 - fovPunch;
        camera.position.set(lerp(16, 26, k) + sx, lerp(12, 22, k) + sy, lerp(22, 34, k));
        camera.lookAt(0, 12, 0);
      } else {
        // Shot B: Fast high-energy orbital helicopter sweep over bridge, river, buses & crowds!
        const k = (u - 0.36) / 0.64;
        const ang = lerp(0.45, 1.38, k);
        const dist = lerp(46, 70, k);
        camera.fov = 46 - fovPunch;
        camera.position.set(Math.cos(ang) * dist + sx, lerp(28, 48, k) + sy, Math.sin(ang) * dist);
        camera.lookAt(0, 8, 2);
      }
    } else {
      // Rapid rocket vertical climb + dynamic orbital spin piercing cumulus clouds!
      const k = smoothstep(0, 1, u);
      const ang = lerp(1.38, 2.35, k);
      const dist = lerp(62, 86, k);
      camera.fov = 48 - fovPunch;
      camera.position.set(Math.cos(ang) * dist + sx, lerp(44, 118, k) + sy, Math.sin(ang) * dist);
      camera.lookAt(-2, lerp(10, 0, k), 0);
    }

  // =========================================================================
  // ACT 4: DYNAMIC ORBITAL FLY-BY AROUND EARTH -> MAGMA PLANET!
  // =========================================================================
  } else if (act === 'earth_boil' || act === 'magma_planet') {
    setActiveWorld('space');
    scene.background.set('#070b17');
    scene.fog = null;
    scene.environmentIntensity = 0.35;
    const isMagma = act === 'magma_planet';
    const heat = isMagma ? lerp(0.56, 1.0, smoothstep(0, 0.85, u)) : lerp(0.05, 0.55, u);

    bloomPass.strength = lerp(0.22, 0.36, heat) + musicPulse * 0.04;
    space.earthUniforms.uTime.value = t;
    space.earthUniforms.uHeat.value = heat;
    space.earthMesh.rotation.y = lerp(0.0, 0.95, (t - 42) / 18);

    const cloudFade = clamp(1 - smoothstep(0.16, 0.62, heat), 0, 1);
    space.lowPolyClouds.visible = cloudFade > 0.02;
    space.lowPolyClouds.rotation.y = space.earthMesh.rotation.y * 1.25;
    space.lowPolyClouds.scale.setScalar(1 + (1 - cloudFade) * 0.14);
    space.cMat.opacity = cloudFade * 0.88;

    const stAng = 0.55 + (t - 42) * 0.24;
    space.station.position.set(Math.cos(stAng) * 4.9, 1.6 + Math.sin(stAng) * 0.8, Math.sin(stAng) * 4.9);
    space.station.rotation.set(0.25, -stAng, 0.18);

    const rProg = clamp((t - 52) / 14, 0, 1);
    space.rocket.position.set(lerp(-2.2, -6.2, rProg), lerp(1.9, 5.8, rProg), lerp(3.6, 1.2, rProg));
    space.rocket.rotation.set(0.2, 0.4, 0.72);

    const atmosCol = new THREE.Color('#60a5fa').lerp(new THREE.Color('#f97316'), clamp(heat * 1.35, 0, 1));
    space.atmosUniforms.uColor.value.copy(atmosCol);
    space.atmosUniforms.uIntensity.value = 0.78 + heat * 0.45;

    space.planetDome.mesh.scale.setScalar(isMagma ? 3.8 + u * 4.2 : 3.5);
    space.planetDome.uniforms.uOpacity.value = isMagma ? clamp(0.75 * (1 - u * 0.85), 0, 0.75) : 0;

    // Sweeping orbital arc + beat zoom punch!
    const orbitAng = isMagma ? lerp(0.22, -0.32, u) : lerp(-0.35, 0.22, u);
    const orbitR = isMagma ? lerp(15.6, 12.8, easeOutCubic(u)) : lerp(17.2, 14.8, easeOutCubic(u));
    camera.fov = 40 - fovPunch;
    camera.position.set(Math.sin(orbitAng) * orbitR + sx, lerp(1.2, -0.3, u) + sy, Math.cos(orbitAng) * orbitR);
    camera.lookAt(0, -0.25, 0);

  // =========================================================================
  // ACT 5: PHONE VAPORIZES IN A PUFF OF SMOKE -> XIAOJIU COMPLETELY STUNNED!
  // =========================================================================
  } else if (act === 'twist_island') {
    setActiveWorld('twist');
    scene.background.set('#381810');
    scene.fog = new THREE.Fog('#381810', 8, 34);
    scene.environmentIntensity = 0.22;
    bloomPass.strength = 0.12;
    twist.lavaUniforms.uTime.value = t;

    const vanishT = 0.72; // exact moment (0.72s into twist) the phone poofs into thin air!
    if (localT < vanishT) {
      // Brief flash of superheated phone right before vaporizing
      const k = localT / vanishT;
      twist.xiaojiu.setExpression('panic', t);
      twist.xiaojiu.phone.group.visible = true;
      twist.xiaojiu.phone.bodyMat.emissive.set('#ffffff');
      twist.xiaojiu.phone.bodyMat.emissiveIntensity = lerp(1.5, 4.5, k);
      twist.xiaojiu.phone.group.scale.setScalar(lerp(1.0, 0.2, Math.pow(k, 3)));
      twist.xiaojiu.phone.light.intensity = lerp(2.2, 5.0, k);
      twist.xiaojiu.headGroup.rotation.set(0.22, 0, 0);
      twist.xiaojiu.armL.rotation.set(0, 0, 0);
      twist.xiaojiu.armR.rotation.set(0, 0, 0);
      twist.vanishPuffs.forEach((p) => { p.mesh.visible = false; });
      twist.questionMarks.visible = false;
    } else {
      // PHONE IS GONE!! Empty hands + puff of smoke + floating "??" + completely dumbfounded Xiaojiu!
      const afterT = localT - vanishT;
      const after = clamp(afterT / Math.max(beat.duration - vanishT, 0.01), 0, 1);
      twist.xiaojiu.phone.group.visible = false;
      twist.xiaojiu.phone.light.intensity = 0;
      twist.xiaojiu.setExpression('stunned', t);

      // Smoke "POOF!" burst expanding then drifting gently up from empty hands
      const handOrigin = new THREE.Vector3(-0.25, 2.38, 0.92);
      twist.vanishPuffs.forEach((p) => {
        const dt = clamp(afterT * 0.95, 0, 1.4);
        if (dt > 1.25) {
          p.mesh.visible = false;
          return;
        }
        p.mesh.visible = true;
        const spread = dt * p.spd * 1.4;
        p.mesh.position.set(
          handOrigin.x + Math.cos(p.ang) * spread,
          handOrigin.y + Math.sin(p.ang) * spread * 0.45 + dt * 1.25,
          handOrigin.z + Math.sin(p.ang + 1.1) * spread * 0.6
        );
        const sc = (0.7 + dt * 1.15) * clamp(1.25 - dt, 0, 1);
        p.mesh.scale.setScalar(Math.max(0.01, sc));
        p.mesh.material.opacity = clamp((1.2 - dt) * 0.85, 0, 0.85);
      });

      // Comic "??" pop-in above stunned Xiaojiu's tilted head!
      const qPop = easeOutBack(clamp(after / 0.22, 0, 1));
      twist.questionMarks.visible = true;
      twist.questionMarks.scale.setScalar(Math.max(0.01, qPop * 1.15));
      twist.questionMarks.position.set(-0.25, 3.62 + Math.sin(t * 4.2) * 0.08, 0.25);

      if (after < 0.36) {
        // Phase A: Staring down in disbelief at his empty hands held forward ("Where is it?!")
        const k = easeOutCubic(after / 0.36);
        twist.xiaojiu.headGroup.rotation.set(0.32, Math.sin(t * 7.5) * 0.14, 0.06);
        twist.xiaojiu.armL.rotation.set(0.08, lerp(0, -0.34, k), 0);
        twist.xiaojiu.armR.rotation.set(0.08, lerp(0, 0.34, k), 0);
      } else {
        // Phase B: Slowly looks straight up at camera, arms droop completely limp down his sides!
        const k = easeOutCubic((after - 0.36) / 0.64);
        twist.xiaojiu.headGroup.rotation.set(lerp(0.32, -0.02, k), lerp(0, 0.04, k), lerp(0.06, 0.13, k));
        twist.xiaojiu.armL.rotation.set(lerp(0.08, 1.18, k), lerp(-0.34, -0.08, k), lerp(0, 0.06, k));
        twist.xiaojiu.armR.rotation.set(lerp(0.08, 1.18, k), lerp(0.34, 0.08, k), lerp(0, -0.06, k));
      }
      twist.xiaojiu.root.position.y = 0.85 + Math.sin(t * 2.2) * 0.02;
    }

    // Bobbing panicking roommate beside him!
    twist.sideRock.position.y = 0.12 + Math.sin(t * 3.8) * 0.16;
    twist.sideRock.rotation.z = Math.sin(t * 3.2) * 0.09;

    twist.bgSmoke.forEach((s) => {
      const cyc = (t * 0.38 + s.seed) % 1;
      s.mesh.position.set(s.x + Math.sin(t + s.seed) * 0.9, 0.2 + cyc * 6.8, s.z);
      s.mesh.scale.setScalar(0.8 + cyc * 1.6);
    });

    if (u < 0.38) {
      // Shot A: Punch-in watching the phone poof away & Xiaojiu staring at empty hands!
      const k = easeOutBack(u / 0.38);
      camera.fov = 40 - fovPunch;
      camera.position.set(lerp(-0.9, -0.15, k) + sx, lerp(2.5, 2.75, k) + sy, lerp(4.4, 5.4, k));
      camera.lookAt(-0.15, 2.55, 0.25);
    } else {
      // Shot B: Clean centered pull-back BELOW top-left HUD showing stunned Xiaojiu + "??" + roommate!
      const k = easeOutCubic((u - 0.38) / 0.62);
      const ang = lerp(-0.04, 0.16, k);
      const rad = lerp(6.6, 8.6, k);
      camera.fov = 44 - fovPunch * 0.4;
      camera.position.set(Math.sin(ang) * rad + sx, lerp(2.85, 3.35, k) + sy, Math.cos(ang) * rad);
      camera.lookAt(0.32, 2.58, -0.35);
    }
  }

  camera.updateProjectionMatrix();
  composer.render();
}

function renderCover(mode) {
  document.body.classList.add(`mode-${mode}`);
  dorm.group.visible = false;
  campus.group.visible = false;
  city.group.visible = false;
  twist.group.visible = false;
  space.group.visible = true;
  coverGroup.visible = true;

  scene.background.set('#0a0f1e');
  scene.fog = null;
  scene.environmentIntensity = 0.24;
  bloomPass.strength = 0.18;

  space.earthUniforms.uTime.value = 4.2;
  space.earthUniforms.uHeat.value = 0.95;
  space.earthMesh.rotation.y = 0.35;
  space.lowPolyClouds.visible = false;
  space.station.position.set(1.2, 3.6, 0.5);
  space.rocket.position.set(-2.2, 2.7, 1.5);
  space.rocket.rotation.set(0.2, 0.4, 0.72);
  space.atmosUniforms.uColor.value.set('#f97316');
  space.atmosUniforms.uIntensity.value = 0.95;
  space.planetDome.uniforms.uOpacity.value = 0.25;
  space.planetDome.mesh.scale.setScalar(4.4);

  if (mode === 'cover16x9') {
    space.earthMesh.position.set(4.1, 0.25, -2.8);
    space.atmosShell.position.copy(space.earthMesh.position);
    space.planetDome.mesh.position.copy(space.earthMesh.position);
    coverXiaojiu.root.position.set(2.05, -2.15, 3.5);
    coverXiaojiu.root.rotation.y = -0.35;
    coverXiaojiu.root.scale.setScalar(1.38);
    camera.fov = 40;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.set(0, 0.45, 10.6);
    camera.lookAt(0.4, 0.05, 0);

    elCoverLayer.innerHTML = `
      <div class="cover16x9-wrap">
        <div class="c16-top">
          <div class="c16-pill">3D 物理硬核推演</div>
          <div class="c16-subpill">每秒翻倍系列 · EP01</div>
        </div>
        <div class="c16-main">
          <div class="c16-line1">手机发烫每秒翻倍？</div>
          <div class="c16-line2">60秒烤化地球！</div>
        </div>
        <div class="c16-stat">⚡ 32秒 = 三峡满发 ｜ 60秒 = 33个太阳</div>
      </div>
    `;
  } else if (mode === 'cover4x3') {
    space.earthMesh.position.set(3.25, 0.25, -2.8);
    space.atmosShell.position.copy(space.earthMesh.position);
    space.planetDome.mesh.position.copy(space.earthMesh.position);
    coverXiaojiu.root.position.set(1.85, -2.2, 3.5);
    coverXiaojiu.root.rotation.y = -0.32;
    coverXiaojiu.root.scale.setScalar(1.32);
    camera.fov = 42;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.set(0, 0.45, 11.2);
    camera.lookAt(0.35, 0.05, 0);

    elCoverLayer.innerHTML = `
      <div class="cover4x3-wrap">
        <div class="c16-top">
          <div class="c16-pill c43-pill">3D 物理硬核推演</div>
          <div class="c16-subpill c43-subpill">每秒翻倍 · EP01</div>
        </div>
        <div class="c43-main">
          <div class="c43-line1">手机发烫每秒翻倍？</div>
          <div class="c43-line2">60秒烤化地球！</div>
        </div>
        <div class="c43-stat">⚡ 32秒 = 三峡满发 ｜ 60秒 = 33个太阳</div>
      </div>
    `;
  } else if (mode === 'cover3x4') {
    space.earthMesh.position.set(0, 0.25, -2.5);
    space.atmosShell.position.copy(space.earthMesh.position);
    space.planetDome.mesh.position.copy(space.earthMesh.position);
    coverXiaojiu.root.position.set(0, -3.35, 3.9);
    coverXiaojiu.root.rotation.y = 0.08;
    coverXiaojiu.root.scale.setScalar(1.26);
    camera.fov = 44;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.set(0, -0.15, 11.5);
    camera.lookAt(0, -0.25, 0);

    elCoverLayer.innerHTML = `
      <div class="cover3x4-wrap">
        <div>
          <div class="c9-kicker c34-kicker">3D 物理硬核推演</div>
          <div class="c34-title1">手机发烫每秒翻倍？</div>
          <div class="c34-title2">60秒烤化地球！</div>
        </div>
        <div class="c34-bottom-tag">⚡ 32秒=三峡电站 ｜ 60秒=岩浆星球</div>
      </div>
    `;
  } else {
    space.earthMesh.position.set(0, 0.45, -2.4);
    space.atmosShell.position.copy(space.earthMesh.position);
    space.planetDome.mesh.position.copy(space.earthMesh.position);
    coverXiaojiu.root.position.set(0, -3.75, 3.8);
    coverXiaojiu.root.rotation.y = 0.08;
    coverXiaojiu.root.scale.setScalar(1.35);
    camera.fov = 44;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.set(0, -0.25, 13.0);
    camera.lookAt(0, -0.35, 0);

    elCoverLayer.innerHTML = `
      <div class="cover9x16-wrap">
        <div>
          <div class="c9-kicker">3D 物理硬核推演</div>
          <div class="c9-title1">手机发烫每秒翻倍？</div>
          <div class="c9-title2">60秒烤化地球！</div>
        </div>
        <div class="c9-bottom-tag">⚡ 32秒=三峡电站 ｜ 60秒=岩浆星球</div>
      </div>
    `;
  }

  camera.updateProjectionMatrix();
  composer.render();
}

async function init() {
  const res = await fetch('./timeline.json');
  TIMELINE = await res.json();
  window.TIMELINE = TIMELINE;
  window.renderAtTime = renderAtTime;
  window.renderCover = renderCover;

  if (['cover16x9', 'cover9x16', 'cover4x3', 'cover3x4'].includes(MODE)) {
    renderCover(MODE);
    window.__READY__ = true;
    return;
  }

  renderAtTime(0);
  window.__READY__ = true;

  if (params.get('preview') === '1') {
    const t0 = performance.now();
    function tick() {
      const elapsed = ((performance.now() - t0) / 1000) % TIMELINE.total_duration;
      renderAtTime(elapsed);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
}

init();

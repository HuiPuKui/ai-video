import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  createCharacter,
  createAlarmPhone,
  buildAlarmDorm,
  buildAlarmCampus,
  buildAlarmCity,
  buildAlarmSpace,
} from './world.js';

const params = new URLSearchParams(window.location.search);
const MODE = params.get('mode') || 'video';

const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.88;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#dfe6ed');

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.24;

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1200);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.0, 0.30, 0.88);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(e0, e1, x) { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
function easeOutCubic(x) { const t = clamp(x, 0, 1); return 1 - Math.pow(1 - t, 3); }
function easeInQuad(x) { const t = clamp(x, 0, 1); return t * t; }
function easeOutBack(x) { const t = clamp(x, 0, 1); const c1 = 1.70158; return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

// Normalized slap motion envelope for ANY speed (from 1.15s slow slap down to 0.14s turbo slap!)
// u in [0, 1]: 0..0.40 raise arm -> 0.40..0.56 smash down -> 0.56 impact -> 0.56..1.0 rebound
function slapCycleEnvelope(u) {
  const k = clamp(u, 0, 1);
  if (k < 0.40) {
    return { raise: easeOutCubic(k / 0.40), strike: 0, impact: 0, badgeK: 0 };
  }
  if (k < 0.56) {
    const d = easeInQuad((k - 0.40) / 0.16);
    return { raise: 1 - d, strike: d, impact: d > 0.72 ? 1 : 0, badgeK: 0 };
  }
  const post = (k - 0.56) / 0.44;
  return {
    raise: 0,
    strike: 1 - easeOutCubic(post),
    impact: Math.exp(-post * 5.2),
    badgeK: easeOutBack(clamp(post * 2.2, 0, 1)),
  };
}

const dorm = buildAlarmDorm();
const campus = buildAlarmCampus();
const city = buildAlarmCity();
const space = buildAlarmSpace();
scene.add(dorm.group, campus.group, city.group, space.group);

// Dedicated 4-Ratio Cover Stage
const coverGroup = new THREE.Group();
coverGroup.visible = false;
scene.add(coverGroup);
coverGroup.add(new THREE.HemisphereLight('#e0f2fe', '#7c2d12', 0.95));
const covKey = new THREE.DirectionalLight('#fffbeb', 1.5); covKey.position.set(-4, 8, 9); coverGroup.add(covKey);

const covPhone = createAlarmPhone(3.6);
covPhone.group.position.set(2.8, 0.25, -0.8);
covPhone.group.rotation.set(0.05, -0.28, -0.08);
covPhone.screenMat.emissiveIntensity = 1.15;
coverGroup.add(covPhone.group);

const covRings = [];
for (let i = 0; i < 4; i++) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(2.1 + i * 0.95, 0.09, 10, 48),
    new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? '#fb923c' : '#38bdf8', transparent: true, opacity: 0.72 - i * 0.14, blending: THREE.AdditiveBlending })
  );
  m.position.set(2.8, 0.25, -1.4); coverGroup.add(m); covRings.push(m);
}

const covXiaojiu = createCharacter({ hoodie: '#0284c7', hoodieTrim: '#38bdf8', withHeadphones: true, sitting: false });
covXiaojiu.setExpression('panic', 1.1);
covXiaojiu.armL.rotation.set(-2.0, 0, -0.25); covXiaojiu.armR.rotation.set(-2.0, 0, 0.25);
coverGroup.add(covXiaojiu.root);

const covAuntie = createCharacter({ hoodie: '#be185d', hoodieTrim: '#f472b6', isAuntie: true, sitting: false });
covAuntie.setAfro(true); covAuntie.setExpression('stunned', 1.1);
covAuntie.armL.rotation.set(-1.8, 0, -0.22); covAuntie.armR.rotation.set(-1.8, 0, 0.22);
coverGroup.add(covAuntie.root);

// DOM HUD Refs
let TIMELINE = null;
const elIntro = document.getElementById('intro-title');
const elHudCard = document.getElementById('tl-hud');
const elTime = document.getElementById('tl-time');
const elPower = document.getElementById('tl-power');
const elCompare = document.getElementById('tl-compare');
const elRulePill = document.getElementById('tl-rule-pill');
const elTrPill = document.getElementById('tr-pill');
const elSpaceCallout = document.getElementById('space-callout');
const elSubtitle = document.getElementById('subtitle-text');
const elFlash = document.getElementById('flash-overlay');
const elCoverLayer = document.getElementById('cover-layer');
const pips = Array.from(document.querySelectorAll('#tl-pips .pip'));

function setActiveWorld(name) {
  dorm.group.visible = name === 'dorm';
  campus.group.visible = name === 'campus';
  city.group.visible = name === 'city';
  space.group.visible = name === 'space';
  coverGroup.visible = name === 'cover';
}

function updateSonicRings(t, speed, maxScale, intensity) {
  dorm.sonicRings.forEach((r) => {
    if (intensity <= 0.01) { r.mesh.visible = false; return; }
    r.mesh.visible = true;
    const cyc = (t * speed + r.phase) % 1;
    r.mesh.scale.setScalar(0.35 + cyc * maxScale);
    r.mesh.lookAt(camera.position);
    r.mat.opacity = (1 - cyc) * intensity;
  });
}

function resetDormState(t) {
  dorm.bedBounceGroup.position.set(-1.85, 0, -1.45);
  dorm.bedBounceGroup.rotation.set(0, 0, 0);
  dorm.rightShelf.position.set(4.35, 0, -1.55);
  dorm.cupLid.position.set(-0.24, 1.40, 0.28);
  dorm.cupLid.rotation.set(0, 0, 0);
  dorm.doorPivot.rotation.y = 0;
  dorm.windowGlass.visible = true;
  dorm.shards.forEach((s) => { s.mesh.visible = false; });
  dorm.dormBeam.material.opacity = 0;
  dorm.x2Badges.forEach((b) => { b.visible = false; b.scale.set(1.35, 0.85, 1); });
  dorm.handPhone.group.visible = false;
  dorm.questionMarks.visible = false;
  dorm.alarmPhone.setMode('alarm');
  dorm.alarmPhone.group.visible = true;
  dorm.alarmPhone.group.rotation.set(0, 0.52, 0);
  dorm.alarmPhone.group.scale.setScalar(1.18);

  dorm.xiaojiu.root.position.set(0, 0.50, -0.52);
  dorm.xiaojiu.root.rotation.set(0, 0, 0);
  dorm.xiaojiu.root.scale.setScalar(1.06);
  dorm.xiaojiu.headGroup.rotation.set(0, 0, 0);
  dorm.xiaojiu.armL.rotation.set(0, 0, 0); dorm.xiaojiu.armR.rotation.set(0, 0, 0);

  dorm.roommate.root.position.set(3.05, 0.48, 1.55);
  dorm.roommate.root.rotation.set(0, -0.82, 0);
  dorm.roommate.root.scale.setScalar(1.0);
  dorm.roommate.headGroup.rotation.set(0, 0, 0);
  dorm.roommate.armL.rotation.set(0, 0, 0); dorm.roommate.armR.rotation.set(0, 0, 0);
  if (dorm.roommate.pillowProp) dorm.roommate.pillowProp.visible = false;

  dorm.upperMate.root.position.set(2.92, 2.95, 1.65);
  dorm.upperMate.root.rotation.set(0, -0.92, 0);
  dorm.upperMate.headGroup.rotation.set(0, 0, 0);
  dorm.upperMate.armL.rotation.set(0, 0, 0); dorm.upperMate.armR.rotation.set(0, 0, 0);
  dorm.upperMate.setAfro(false); dorm.upperMate.setExpression('sleepy', t);

  dorm.auntie.root.visible = false;
  dorm.auntie.root.position.set(2.5, 0.02, -3.2);
  dorm.auntie.root.rotation.set(0, -0.65, 0);
  dorm.auntie.root.scale.setScalar(1.08);
  dorm.auntie.afroGroup.scale.setScalar(1.0);
  dorm.auntie.headGroup.rotation.set(0, 0, 0);
  dorm.auntie.armL.rotation.set(0, 0, 0); dorm.auntie.armR.rotation.set(0, 0, 0);
  dorm.xiaojiu.setAfro(false); dorm.roommate.setAfro(false); dorm.auntie.setAfro(false);
  dorm.neighbors.forEach((nb) => { nb.root.visible = false; nb.setAfro(false); nb.setExpression('calm', t); });
}

// ===========================================================================
// REUSABLE ACCELERATING "XIAOJIU SLAPS PHONE" CUT-IN (3 DYNAMIC ANGLES!)
// Played at EVERY doubling beat, accelerating from 1.15s down to 0.14s!
// ===========================================================================
function renderSlapCutIn(beat, localT, t, groove) {
  setActiveWorld('dorm');
  scene.background.set('#e0d8cc');
  scene.fog = null;
  scene.environmentIntensity = 0.26;
  resetDormState(t);

  // Maintain dorm continuity behind Xiaojiu as escalation progresses!
  const bIdx = beat.index;
  if (bIdx >= 4) {
    dorm.doorPivot.rotation.y = 1.85;
    dorm.auntie.root.visible = true;
    dorm.auntie.root.position.set(1.15, 0.02, -2.85);
    dorm.auntie.root.rotation.y = -0.35;
    if (bIdx >= 5) {
      dorm.windowGlass.visible = false;
      dorm.auntie.setAfro(true);
      dorm.auntie.setExpression('stunned', t);
      dorm.roommate.setAfro(true);
      dorm.upperMate.setAfro(true);
    } else {
      dorm.auntie.setExpression('angry', t);
    }
  }
  dorm.xiaojiu.setExpression('sleepy', t);

  const sw = beat.slap_window;
  let activeSlap = sw.slaps[sw.slaps.length - 1];
  let slapIdx = sw.slaps.length - 1;
  for (let i = 0; i < sw.slaps.length; i++) {
    if (localT >= sw.slaps[i].start && localT < sw.slaps[i].end) {
      activeSlap = sw.slaps[i];
      slapIdx = i;
      break;
    }
  }
  const uSlap = clamp((localT - activeSlap.start) / Math.max(activeSlap.dur, 0.01), 0, 1);
  const env = slapCycleEnvelope(uSlap);

  // Clean deliberate slap pose — ZERO vibration!
  dorm.xiaojiu.root.rotation.set(env.strike * 0.20 - env.raise * 0.09, 0, env.strike * 0.16);
  dorm.xiaojiu.armL.rotation.set(-env.raise * 2.35 - env.strike * 1.38, 0, env.raise * 0.20 + env.strike * 0.58);
  dorm.xiaojiu.headGroup.rotation.set(0.14 + env.strike * 0.12, 0.22 * env.strike, -0.05);

  // Crisp squash on phone screen when hand hits
  dorm.alarmPhone.group.rotation.set(0, 0.52, -env.impact * 0.06);
  dorm.alarmPhone.group.scale.set(
    1.18 * (1 + env.impact * 0.22),
    1.18 * (1 - env.impact * 0.25),
    1.18
  );
  dorm.alarmLight.intensity = 1.4 + env.impact * 2.8 + groove * 1.2;

  const ringSpeed = 1.6 + Math.min(bIdx * 0.45, 3.8);
  updateSonicRings(t, ringSpeed, 3.2 + Math.min(bIdx * 0.5, 4.5), 0.72);

  if (bIdx >= 5) {
    dorm.dormBeam.material.opacity = 0.16 + env.impact * 0.14;
    bloomPass.strength = 0.10 + env.impact * 0.08;
  } else {
    bloomPass.strength = 0.0;
  }

  // Pop ×2 badge cleanly right above the phone on every slap impact!
  if (env.badgeK > 0.01) {
    const rise = clamp((uSlap - 0.56) / 0.44, 0, 1);
    dorm.x2Badges[0].visible = true;
    dorm.x2Badges[0].position.set(-3.45 + (slapIdx % 2 === 0 ? 0.08 : -0.10), 2.30 + rise * 0.55, -2.35);
    dorm.x2Badges[0].scale.set(1.42 * env.badgeK, 0.88 * env.badgeK, 1);
    if (sw.slaps.length >= 3 && slapIdx >= 1) {
      dorm.x2Badges[1].visible = true;
      dorm.x2Badges[1].position.set(-2.55, 3.05 + rise * 0.35, -1.75);
      dorm.x2Badges[1].scale.set(1.10 * env.badgeK, 0.68 * env.badgeK, 1);
    }
  }

  // Cycle across 3 crisp steady close-up camera angles — ALL clearly showing Xiaojiu slapping the phone!
  const camIdx = activeSlap.cam_idx;
  const punch = env.impact * 1.9;
  if (camIdx === 0) {
    // Angle 0: Clean Front Hero Two-Shot (Xiaojiu + Slapping Arm + Phone + ×2)
    camera.fov = 39 - punch;
    camera.position.set(lerp(0.25, 0.45, uSlap), 2.85, lerp(2.45, 2.25, uSlap));
    camera.lookAt(-2.55, 1.85, -2.0);
  } else if (camIdx === 1) {
    // Angle 1: Tight Bedside Two-Shot (Full 07:50 Screen + Full Xiaojiu Slapping!)
    camera.fov = 42 - punch;
    camera.position.set(lerp(-0.80, -1.00, uSlap), 2.45, lerp(2.35, 2.15, uSlap));
    camera.lookAt(-2.65, 1.85, -2.05);
  } else {
    // Angle 2: Low-Angle Comedy Shot (Sleepy Xiaojiu slapping while chaos/Afro Auntie sits behind him!)
    camera.fov = 40 - punch;
    camera.position.set(lerp(-0.45, -0.75, uSlap), 1.95, lerp(2.05, 1.85, uSlap));
    camera.lookAt(-2.35, 1.95, -2.10);
  }

  return env.impact;
}

function renderAtTime(t) {
  if (!TIMELINE) return;
  const beats = TIMELINE.beats;
  const fps = TIMELINE.fps || 30;
  const fIdx = clamp(Math.round(t * fps), 0, (TIMELINE.heavy_frames?.length || 1) - 1);

  const groove = TIMELINE.groove_frames ? TIMELINE.groove_frames[fIdx] : 0;

  let beat = beats[beats.length - 1];
  for (let i = 0; i < beats.length; i++) {
    if (t >= beats[i].start && t < beats[i].end) { beat = beats[i]; break; }
  }
  const localT = clamp(t - beat.start, 0, beat.duration);
  const u = clamp(localT / Math.max(beat.duration, 0.001), 0, 1);
  const act = beat.act;
  const sw = beat.slap_window;
  const isTwist = act === 'dorm_saturday';

  // Determine whether we are inside a slap cut-in right now!
  const inLeadSlap = !!(sw && sw.mode === 'lead' && sw.slaps.length > 0 && localT < sw.end);
  const inSoloSlap = !!(sw && sw.mode === 'solo' && sw.slaps.length > 0);
  const inIntroSlap = !!(sw && sw.mode === 'intro' && sw.slaps.length > 0 && localT >= sw.start && localT < sw.end);

  // Normalized time for the main scene AFTER the lead slap cut-in finishes
  const mainStart = (sw && sw.mode === 'lead') ? sw.end : 0.0;
  const mainT = Math.max(0, localT - mainStart);
  const mainDur = Math.max(beat.duration - mainStart, 0.01);
  const au = clamp(mainT / mainDur, 0, 1);

  const dropPulse = Math.exp(-mainT * 9.0);

  // Intro Big Centered Title (0.0s -> 1.85s before first slap)
  if (beat.show_intro_title && localT < 1.85) {
    const fade = localT > 1.52 ? clamp(1 - (localT - 1.52) / 0.33, 0, 1) : easeOutBack(clamp(localT / 0.22, 0, 1));
    elIntro.style.opacity = String(clamp(fade, 0, 1));
    elIntro.style.transform = `translateX(-50%) scale(${(0.94 + clamp(fade, 0, 1) * 0.06).toFixed(3)})`;
    elHudCard.style.opacity = '0';
  } else {
    elIntro.style.opacity = '0';
    elHudCard.style.opacity = '1';
  }

  // HUD Count-Up synced cleanly to the slap cut-in!
  const isSpecialLabel = ['city_pillows', 'space_pointer', 'space_alien', 'dorm_saturday'].includes(act);
  const countFrac = inLeadSlap
    ? smoothstep(0, Math.max(mainStart, 0.01), localT)
    : (inSoloSlap ? smoothstep(0.15, beat.duration - 0.2, localT) : 1.0);
  const simSnooze = Math.round(lerp(beat.snooze_start, beat.snooze_end, countFrac));
  const simDb = Math.round(lerp(beat.db_start, beat.db_end, countFrac));

  elTime.textContent = isTwist ? beat.display_t : `按贪睡 ${simSnooze} 次`;
  elPower.textContent = isSpecialLabel ? beat.power_label : (countFrac > 0.85 ? beat.power_label : `${simDb} 分贝`);
  elPower.style.color = isTwist ? '#38bdf8' : (simDb >= 194 ? '#fde047' : '#fb923c');
  elCompare.textContent = beat.compare_line;
  elRulePill.textContent = beat.rule_pill || '每按一次贪睡 声强 ×2';

  pips.forEach((p, idx) => p.classList.toggle('on', idx < beat.step_idx));

  if (beat.fast_tag) {
    elTrPill.textContent = beat.fast_tag;
    elTrPill.style.opacity = '1';
    elTrPill.style.transform = 'scale(1)';
  } else {
    elTrPill.style.opacity = '0';
  }

  // Space callout only during wide Earth view (Shot C of space_pointer)
  if (act === 'space_pointer' && !inLeadSlap && au >= 0.62) {
    elSpaceCallout.style.opacity = String(clamp(easeOutBack(clamp((au - 0.62) / 0.14, 0, 1)), 0, 1));
  } else {
    elSpaceCallout.style.opacity = '0';
  }

  const showSub = !isTwist || localT >= (beat.pre_delay || 1.15) - 0.05;
  if (beat.subtitle && showSub) {
    elSubtitle.style.display = '';
    elSubtitle.innerHTML = beat.subtitle;
    const subPop = isTwist ? easeOutBack(clamp((localT - 1.08) / 0.24, 0, 1)) : 1.0;
    elSubtitle.style.transform = `scale(${subPop.toFixed(3)})`;
  } else {
    elSubtitle.style.display = 'none';
  }

  const darkActive = !inLeadSlap && ['space_pointer', 'space_alien'].includes(act);
  document.body.classList.toggle('dark-scene', darkActive);

  let flash = 0;
  if (!inLeadSlap && ['dorm_afro', 'campus_lift', 'city_shockwave'].includes(act)) {
    flash = Math.max(0, 1 - mainT / 0.12) * 0.36;
  }
  elFlash.style.opacity = String(flash);

  // =========================================================================
  // 1) IF IN SLAP CUT-IN OR SOLO SLAP MONTAGE -> RENDER CRISP SLAP CUT!
  // =========================================================================
  if (inLeadSlap || inSoloSlap || inIntroSlap) {
    const impact = renderSlapCutIn(beat, localT, t, groove);
    const hudScale = 1.0 + impact * 0.05;
    elHudCard.style.transform = `scale(${hudScale.toFixed(4)})`;
    elHudCard.style.transformOrigin = 'top left';
    camera.updateProjectionMatrix();
    composer.render();
    return;
  }

  const hudScale = 1.0 + dropPulse * 0.04;
  elHudCard.style.transform = `scale(${hudScale.toFixed(4)})`;
  elHudCard.style.transformOrigin = 'top left';

  // Smooth non-oscillating FOV punch on hard cut entry ONLY (ZERO camera vibration!)
  const cutZoom = dropPulse * 1.4;

  // =========================================================================
  // 2) DORM ACTS — STEADY EXPRESSIVE ACTING + 3 HARD CUTS PER BEAT!
  // =========================================================================
  if (act.startsWith('dorm_')) {
    setActiveWorld('dorm');
    scene.background.set('#e0d8cc');
    scene.fog = null;
    scene.environmentIntensity = 0.26;
    resetDormState(t);
    bloomPass.strength = 0.0;

    if (act === 'dorm_alarm') {
      dorm.xiaojiu.setExpression('sleepy', t);
      dorm.roommate.setExpression('sleepy', t);
      dorm.alarmLight.intensity = 1.4 + groove * 1.8;
      updateSonicRings(t, 1.4, 2.5, 0.65);

      if (localT < sw.start) {
        // Shot 1A: Alarm Phone + Sleepy Xiaojiu Opening Intro!
        const k = easeOutCubic(localT / Math.max(sw.start, 0.01));
        camera.fov = 38;
        camera.position.set(lerp(-1.95, -2.20, k), lerp(2.05, 1.85, k), lerp(0.15, -0.35, k));
        camera.lookAt(-2.95, 1.65, -2.25);
      } else {
        // Shot 1C (Post-slap): Wide Dorm Shot showing sonic rings sweeping toward roommates!
        const postK = clamp((localT - sw.end) / Math.max(beat.duration - sw.end, 0.01), 0, 1);
        dorm.x2Badges[0].visible = true;
        dorm.x2Badges[0].position.set(-3.40, 2.55 + postK * 0.35, -2.35);
        camera.fov = 44;
        camera.position.set(lerp(-0.4, 0.25, postK), 3.45, lerp(4.8, 5.4, postK));
        camera.lookAt(-0.55, 1.95, -0.85);
      }
    } else if (act === 'dorm_mate_yell') {
      dorm.xiaojiu.setExpression('sleepy', t);
      dorm.roommate.setExpression('angry', t);
      dorm.upperMate.setExpression('angry', t);
      dorm.roommate.root.rotation.set(0.10, -0.86, 0);
      dorm.roommate.armL.rotation.set(-1.15, 0, 0.28);
      dorm.roommate.armR.rotation.set(-1.15, 0, -0.28);
      if (dorm.roommate.pillowProp) {
        dorm.roommate.pillowProp.visible = true;
        dorm.roommate.pillowProp.position.set(0, 1.24, 0.34);
      }
      dorm.upperMate.root.rotation.set(0.18, -0.95, 0);
      dorm.upperMate.armL.rotation.set(-1.55, 0, -0.22);
      dorm.upperMate.armR.rotation.set(-1.55, 0, 0.22);
      dorm.alarmLight.intensity = 1.8 + groove * 2.0;
      updateSonicRings(t, 2.0, 3.8, 0.78);

      if (au < 0.36) {
        // Shot 2A: Medium Close-Up on Lower Roommate clutching pillow (full angry face + bookshelf!)
        const k = easeOutCubic(au / 0.36);
        camera.fov = 44 - cutZoom;
        camera.position.set(lerp(-0.95, -0.60, k), 2.10, lerp(3.15, 2.85, k));
        camera.lookAt(3.05, 1.90, 1.55);
      } else if (au < 0.70) {
        // Shot 2B: Dramatic Low-Angle Shot on Upper Bunk Roommate yelling + Class Schedule!
        const k = (au - 0.36) / 0.34;
        camera.fov = 42;
        camera.position.set(lerp(-0.55, -0.15, k), 3.35, lerp(2.65, 2.25, k));
        camera.lookAt(2.95, 4.10, 1.45);
      } else {
        // Shot 2C: Full Bunk Two-Shot + Colorful Bookshelf & Class Schedule!
        const k = (au - 0.70) / 0.30;
        camera.fov = 48;
        camera.position.set(lerp(-2.55, -2.15, k), 2.85, lerp(3.45, 3.05, k));
        camera.lookAt(3.05, 2.75, 1.25);
      }
    } else if (act === 'dorm_bounce') {
      dorm.xiaojiu.setExpression('sleepy', t);
      dorm.roommate.setExpression('panic', t);
      dorm.upperMate.setExpression('panic', t);
      if (dorm.roommate.pillowProp) dorm.roommate.pillowProp.visible = true;

      // Smooth rhythmic bed bounce — ZERO high-frequency jitter!
      const hop = Math.abs(Math.sin(mainT * 3.8)) * 0.36;
      dorm.bedBounceGroup.position.y = hop;
      dorm.rightShelf.position.y = Math.abs(Math.sin(mainT * 3.8)) * 0.10;
      const lidK = easeOutCubic(clamp(au * 1.15, 0, 1));
      dorm.cupLid.position.set(-0.24 + lidK * 0.65, 1.40 + Math.sin(lidK * Math.PI) * 1.95, 0.28 + lidK * 0.35);
      dorm.cupLid.rotation.set(lidK * 6.5, lidK * 4.2, 0);
      dorm.alarmLight.intensity = 2.0 + groove * 2.2;
      updateSonicRings(t, 2.5, 5.2, 0.85);
      dorm.x2Badges[0].visible = true; dorm.x2Badges[0].position.set(-3.45, 2.75 + hop * 0.25, -2.45);
      dorm.x2Badges[1].visible = true; dorm.x2Badges[1].position.set(-3.75, 2.15 + hop * 0.18, -2.65);

      if (au < 0.36) {
        // Shot 3A: Front-Left Hero Shot of Bouncing Bed + Xiaojiu!
        const k = au / 0.36;
        camera.fov = 44 - cutZoom;
        camera.position.set(lerp(-1.95, -1.35, k), 3.15, lerp(4.8, 4.4, k));
        camera.lookAt(-1.85, 1.95, -1.65);
      } else if (au < 0.68) {
        // Shot 3B: Tight Close-Up on Water Cup Lid blasting off the nightstand!
        const k = (au - 0.36) / 0.32;
        camera.fov = 35;
        camera.position.set(lerp(-1.75, -1.45, k), lerp(1.95, 2.65, k), lerp(0.15, 0.35, k));
        camera.lookAt(-3.65, 2.15, -2.35);
      } else {
        // Shot 3C: Wide Dorm Overview showing bed, bouncing bookshelf & panicked roommates!
        const k = (au - 0.68) / 0.32;
        camera.fov = 48;
        camera.position.set(lerp(-0.95, -0.35, k), 3.65, lerp(5.4, 5.9, k));
        camera.lookAt(0.35, 2.05, -0.65);
      }
    } else if (act === 'dorm_auntie') {
      const kickK = easeOutBack(clamp(mainT / 0.34, 0, 1));
      dorm.doorPivot.rotation.y = kickK * 1.85;
      dorm.auntie.root.visible = true;
      dorm.auntie.root.position.set(lerp(3.15, 1.65, clamp(kickK, 0, 1.02)), 0.02, lerp(-3.9, -2.35, clamp(kickK, 0, 1.02)));
      dorm.auntie.setExpression('angry', t);
      dorm.auntie.root.rotation.set(0.12, -0.58, 0);
      dorm.auntie.armL.rotation.set(-1.52, 0, -0.14);
      dorm.auntie.armR.rotation.set(-0.32, 0, 0.42);
      dorm.neighbors.forEach((nb) => { nb.root.visible = true; nb.setExpression('panic', t); });
      dorm.xiaojiu.setExpression('sleepy', t);
      dorm.roommate.setExpression('panic', t);
      dorm.upperMate.setExpression('panic', t);
      dorm.alarmLight.intensity = 2.2 + groove * 2.0;
      updateSonicRings(t, 2.8, 5.5, 0.85);

      if (au < 0.36) {
        // Shot 4A: Wide Door Kick-Open Shot ("404 寝室" + Auntie striding in!)
        const k = au / 0.36;
        camera.fov = 43 - cutZoom;
        camera.position.set(lerp(-1.45, -1.05, k), 2.55, lerp(1.55, 1.15, k));
        camera.lookAt(2.15, 2.05, -2.95);
      } else if (au < 0.68) {
        // Shot 4B: Tight Angry Close-Up on Dorm Auntie pointing!
        const k = (au - 0.36) / 0.32;
        camera.fov = 34;
        camera.position.set(lerp(-0.45, -0.25, k), 2.25, lerp(-0.15, -0.45, k));
        camera.lookAt(1.65, 2.05, -2.35);
      } else {
        // Shot 4C: Angle showcasing 4 shocked pajama hallway neighbors peeking behind Auntie!
        const k = (au - 0.68) / 0.32;
        camera.fov = 44;
        camera.position.set(lerp(-0.85, -0.45, k), 2.65, lerp(0.55, 0.25, k));
        camera.lookAt(2.85, 1.95, -4.45);
      }
    } else if (act === 'dorm_afro') {
      dorm.doorPivot.rotation.y = 1.85;
      dorm.auntie.root.visible = true;
      const blastK = easeOutCubic(clamp(mainT / 0.36, 0, 1));
      const afroPop = easeOutBack(clamp(mainT / 0.28, 0, 1));
      dorm.auntie.setAfro(true);
      dorm.auntie.afroGroup.scale.setScalar(Math.max(0.05, afroPop));
      dorm.auntie.setExpression('stunned', t);
      dorm.auntie.root.position.set(lerp(1.65, 2.75, blastK), 0.02 + Math.sin(blastK * Math.PI) * 0.45, lerp(-2.35, -3.25, blastK));
      dorm.auntie.root.rotation.set(-0.12 * blastK, -0.52, -0.08 * blastK);
      dorm.auntie.armL.rotation.set(-2.2, 0, -0.35); dorm.auntie.armR.rotation.set(-2.2, 0, 0.35);

      dorm.roommate.setAfro(true); dorm.roommate.afroGroup.scale.setScalar(Math.max(0.05, afroPop)); dorm.roommate.setExpression('stunned', t);
      dorm.upperMate.setAfro(true); dorm.upperMate.afroGroup.scale.setScalar(Math.max(0.05, afroPop)); dorm.upperMate.setExpression('stunned', t);
      dorm.neighbors.forEach((nb) => { nb.root.visible = true; nb.setAfro(true); nb.setExpression('stunned', t); });
      dorm.xiaojiu.setExpression('panic', t);
      dorm.windowGlass.visible = false;
      bloomPass.strength = 0.14 + groove * 0.06;
      dorm.dormBeam.material.opacity = 0.22 + groove * 0.08;
      updateSonicRings(t, 4.0, 8.5, 0.90);

      dorm.shards.forEach((s) => {
        s.mesh.visible = true;
        const dt = clamp(mainT * 0.85, 0, 2.2);
        s.mesh.position.set(s.x0 + s.vx * dt, s.y0 + s.vy * dt - 2.4 * dt * dt, -4.2 + s.vz * dt);
        s.mesh.rotation.set(s.rx * dt, s.ry * dt, 0);
      });

      if (au < 0.32) {
        // Shot 5A: Window Glass Shattering into 80 Flying Shards!
        const k = au / 0.32;
        camera.fov = 44 - cutZoom;
        camera.position.set(lerp(-0.65, -0.35, k), 2.95, lerp(1.55, 0.85, k));
        camera.lookAt(0.15, 3.05, -4.35);
      } else if (au < 0.66) {
        // Shot 5B: Unobstructed Close-Up on Giant Afro Auntie!
        const k = (au - 0.32) / 0.34;
        camera.fov = 40;
        camera.position.set(lerp(-1.25, -0.75, k), 2.45, lerp(0.35, -0.25, k));
        camera.lookAt(2.55, 2.15, -3.20);
      } else {
        // Shot 5C: Wide Full-Dorm 7-Afro Chaos Shot!
        const k = (au - 0.66) / 0.34;
        camera.fov = 48;
        camera.position.set(lerp(-0.65, -0.25, k), 3.65, lerp(5.4, 6.2, k));
        camera.lookAt(0.45, 2.15, -1.45);
      }
    } else if (act === 'dorm_saturday') {
      updateSonicRings(t, 1.0, 1.0, 0.0);
      dorm.alarmLight.intensity = 0;
      dorm.windowGlass.visible = false;
      dorm.doorPivot.rotation.y = 1.85;
      dorm.auntie.root.visible = true; dorm.auntie.setAfro(true); dorm.auntie.setExpression('stunned', t);
      dorm.auntie.root.position.set(0.75, 0.02, -2.45); dorm.auntie.root.rotation.y = -0.22;
      dorm.roommate.setAfro(true); dorm.roommate.setExpression('stunned', t);
      dorm.upperMate.setAfro(true); dorm.upperMate.setExpression('stunned', t);
      dorm.neighbors.forEach((nb) => { nb.root.visible = true; nb.setAfro(true); nb.setExpression('stunned', t); });
      dorm.xiaojiu.setExpression('stunned', t);
      dorm.alarmPhone.group.visible = false;

      const raiseK = easeOutBack(clamp((localT - 0.12) / 0.36, 0, 1));
      dorm.handPhone.group.visible = localT < 2.85;
      dorm.handPhone.group.position.set(-1.85, lerp(1.15, 1.95, clamp(raiseK, 0, 1.06)), -0.85);
      dorm.handPhone.group.rotation.set(-0.08, 0.22, 0);

      if (localT >= 0.85) {
        dorm.questionMarks.visible = true;
        const qk = easeOutBack(clamp((localT - 0.85) / 0.28, 0, 1));
        dorm.questionMarks.scale.setScalar(qk * 1.15);
        dorm.questionMarks.position.set(-1.85, 3.55 + Math.sin(t * 3.0) * 0.05, -1.55);
      }

      if (localT < 2.85) {
        const k = easeOutCubic(clamp(localT / 0.85, 0, 1));
        camera.fov = 34;
        camera.position.set(lerp(-1.12, -1.38, k), lerp(2.12, 1.98, k), lerp(1.30, 0.56, k));
        camera.lookAt(-1.85, 1.95, -0.85);
      } else {
        const k = easeOutCubic(clamp((localT - 2.85) / 1.4, 0, 1));
        dorm.xiaojiu.headGroup.rotation.set(lerp(0.24, -0.02, k), 0.04, lerp(0, 0.12, k));
        dorm.xiaojiu.armL.rotation.set(lerp(-0.7, 0.10, k), 0, 0.08);
        dorm.xiaojiu.armR.rotation.set(lerp(-0.7, 0.10, k), 0, -0.08);
        camera.fov = 48;
        camera.position.set(lerp(-0.55, -0.50, k), lerp(3.10, 3.55, k), lerp(5.2, 7.2, k));
        camera.lookAt(-0.50, 2.05, -1.75);
      }
    }

  // =========================================================================
  // 3) CAMPUS LIFT ACT — 3 HARD CUTS (LOW HERO / CROWD CRATER / AERIAL TRACK)
  // =========================================================================
  } else if (act === 'campus_lift') {
    setActiveWorld('campus');
    scene.background.set('#d4e0ec');
    scene.fog = new THREE.Fog('#d4e0ec', 48, 155);
    scene.environmentIntensity = 0.24;
    bloomPass.strength = 0.16 + groove * 0.08;

    const liftH = easeOutCubic(au) * 6.5;
    campus.heroBldGroup.position.set(0, liftH, 0);
    campus.heroBldGroup.rotation.z = Math.sin(t * 2.5) * 0.014;

    campus.rubbles.forEach((rb) => {
      const cyc = (mainT * 0.65 + rb.seed * 0.13) % 1;
      rb.mesh.position.set(Math.cos(rb.ang) * (rb.rad + cyc * 4.5), 0.5 + cyc * 7.5, Math.sin(rb.ang) * (rb.rad + cyc * 4.5) - 2.0);
      rb.mesh.rotation.set(t * 2.4 + rb.seed, t * 1.8, 0);
    });
    campus.shockRings.forEach((r) => {
      const cyc = (t * 2.1 + r.phase) % 1;
      r.mesh.scale.setScalar(2.0 + cyc * 24.0);
      r.mat.opacity = (1 - cyc) * 0.78;
    });
    campus.runners.forEach((r) => {
      r.p.root.position.x = r.x0 + r.dir * mainT * r.spd * 1.5;
      r.p.root.position.y = 0.05 + Math.abs(Math.sin(t * 14 + r.phase)) * 0.15;
      r.p.legL.rotation.x = Math.sin(t * 16 + r.phase) * 0.65;
      r.p.legR.rotation.x = -Math.sin(t * 16 + r.phase) * 0.65;
      r.p.armL.rotation.x = -2.3; r.p.armR.rotation.x = -2.3;
    });
    campus.flyingProps.forEach((p) => {
      const ang = p.ang + t * 0.62;
      p.mesh.position.set(Math.cos(ang) * p.rad, p.y0 + mainT * p.spd, Math.sin(ang) * p.rad - 2.0);
      p.mesh.rotation.set(t * 1.9 + p.seed, t * 1.4, p.seed);
    });

    if (au < 0.34) {
      // Shot 6A: Low-Angle Hero Shot looking up at lifting "4号宿舍楼"!
      const k = au / 0.34;
      camera.fov = 48 - cutZoom;
      camera.position.set(lerp(-5.5, -2.5, k), lerp(6.5, 8.5, k), lerp(33, 36, k));
      camera.lookAt(0, 12.5 + liftH * 0.4, -2.0);
    } else if (au < 0.68) {
      // Shot 6B: Ground-Level Crater + Fleeing Pajama Students & Flying Furniture!
      const k = (au - 0.34) / 0.34;
      camera.fov = 46;
      camera.position.set(lerp(13.5, 16.5, k), lerp(4.2, 5.4, k), lerp(20.5, 22.5, k));
      camera.lookAt(0, 4.5, 2.5);
    } else {
      // Shot 6C: High Aerial Orbit revealing Red Track + Blue Court + Lifting Building!
      const k = (au - 0.68) / 0.32;
      const ang = lerp(0.32, 0.72, k);
      camera.fov = 48;
      camera.position.set(Math.sin(ang) * 48, lerp(22, 29, k), Math.cos(ang) * 48);
      camera.lookAt(3, 10.5, 1.0);
    }

  // =========================================================================
  // 4) METROPOLIS ACTS — 3 HARD CUTS EACH (IGNITION / STREET SHATTER / AERIAL)
  // =========================================================================
  } else if (act === 'city_shockwave' || act === 'city_pillows') {
    setActiveWorld('city');
    scene.background.set('#cfdce8');
    scene.fog = new THREE.Fog('#cfdce8', 75, 220);
    scene.environmentIntensity = 0.24;
    bloomPass.strength = 0.14 + groove * 0.06;

    const waveR = act === 'city_pillows' ? 46 + au * 42 : 8 + au * 52;
    city.sonicDome.mesh.scale.setScalar(waveR);
    city.sonicDome.uniforms.uOpacity.value = clamp(0.88 - waveR / 115, 0.16, 0.82);
    city.groundWave.scale.setScalar(waveR);
    city.groundWaveMat.opacity = clamp(0.90 - waveR / 105, 0.14, 0.80);

    city.buildings.forEach((b) => {
      const hitAmt = smoothstep(b.dist - 3, b.dist + 5, waveR);
      b.box.material = hitAmt > 0.35 ? b.shatMats : b.intactMats;
      b.pivot.rotation.z = -Math.cos(b.ang) * hitAmt * 0.11;
      b.pivot.rotation.x = Math.sin(b.ang) * hitAmt * 0.11;
    });

    city.vehicles.forEach((v) => {
      const pos = ((v.offset + t * v.spd * v.dir + 90) % 180) - 90;
      if (v.alongX) v.mesh.position.set(pos, 0.08, v.roadCoord + v.lane);
      else v.mesh.position.set(v.roadCoord + v.lane, 0.08, pos);
    });

    city.cityDebris.forEach((p) => {
      const a = p.ang + t * p.spd;
      const r = p.rad + Math.sin(t * 1.4 + p.seed) * 2.2;
      p.mesh.position.set(Math.cos(a) * r, p.y0 + Math.sin(t * 1.3 + p.seed) * 3.5, Math.sin(a) * r);
      p.mesh.rotation.set(t * 1.9 + p.seed, t * 1.3, t * 0.9);
    });

    if (act === 'city_shockwave') {
      if (au < 0.34) {
        // Shot 7A: Ground-Zero 194 dB Shockwave Dome Expansion!
        const k = au / 0.34;
        camera.fov = 48 - cutZoom;
        camera.position.set(lerp(34, 42, k), lerp(18, 24, k), lerp(28, 34, k));
        camera.lookAt(0, 12, 0);
      } else if (au < 0.68) {
        // Shot 7B: Wide Clear Avenue Canyon Shot (z=12 road corridor!) of Cars + Leaning Shattering Skyscrapers!
        const k = (au - 0.34) / 0.34;
        camera.fov = 48;
        camera.position.set(lerp(-44, -30, k), lerp(14, 18, k), 12.0);
        camera.lookAt(4, 14, 6);
      } else {
        // Shot 7C: High Aerial Metropolis Dome Panorama!
        const k = (au - 0.68) / 0.32;
        const ang = lerp(0.75, 1.15, k);
        camera.fov = 48;
        camera.position.set(Math.cos(ang) * 74, lerp(44, 54, k), Math.sin(ang) * 74);
        camera.lookAt(0, 10, 0);
      }
    } else {
      if (au < 0.35) {
        // Shot 8A: TV Tower + Swirling Colorful Pillows & Red Alarm Phones!
        const k = au / 0.35;
        camera.fov = 46 - cutZoom;
        camera.position.set(lerp(18, 12, k), lerp(28, 34, k), lerp(22, 16, k));
        camera.lookAt(-18, 20, -18);
      } else if (au < 0.68) {
        // Shot 8B: River Bridge + Cars + Leaning Shattered Waterfront Towers!
        const k = (au - 0.35) / 0.33;
        camera.fov = 46;
        camera.position.set(lerp(52, 46, k), lerp(18, 24, k), lerp(38, 30, k));
        camera.lookAt(14, 9, 4);
      } else {
        // Shot 8C: High Panoramic City Skyline & Sky Pillows!
        const k = (au - 0.68) / 0.32;
        const ang = lerp(1.05, 1.45, k);
        camera.fov = 48;
        camera.position.set(Math.cos(ang) * 86, lerp(52, 62, k), Math.sin(ang) * 86);
        camera.lookAt(-4, 12, 0);
      }
    }

  // =========================================================================
  // 5) SPACE ACTS — 3 HARD CUTS EACH (EARTH RINGS / ASTRONAUT / ARMADA WARP!)
  // =========================================================================
  } else if (act === 'space_pointer' || act === 'space_alien') {
    setActiveWorld('space');
    scene.background.set('#050814');
    scene.fog = null;
    scene.environmentIntensity = 0.35;
    bloomPass.strength = 0.22 + groove * 0.08;

    space.earthMesh.rotation.y = lerp(-0.18, 0.22, au);
    space.clouds.rotation.y = space.earthMesh.rotation.y * 1.2;
    space.station.position.set(-2.9 + Math.sin(t * 0.5) * 0.25, 2.35 + Math.cos(t * 0.7) * 0.18, 2.8);
    space.station.rotation.set(0.24, t * 0.22, 0.14);

    space.earthPulses.forEach((ep) => {
      const cyc = (t * 2.0 + ep.phase) % 1;
      ep.mesh.scale.setScalar(0.5 + cyc * 4.5);
      ep.mesh.material.opacity = (1 - cyc) * 0.92;
    });

    if (act === 'space_pointer') {
      space.ufoFleet.visible = false;
      if (au < 0.34) {
        // Shot 9A: Close-Up on Earth Sonic Pulse Flash!
        const k = au / 0.34;
        camera.fov = 38 - cutZoom;
        camera.position.set(lerp(0.6, 1.2, k), lerp(1.0, 0.8, k), lerp(10.8, 9.8, k));
        camera.lookAt(0.5, 0.6, 2.5);
      } else if (au < 0.62) {
        // Shot 9B: Clean Center-Right Shot on Orbiting Space Station & Panicked Ear-Covering Astronaut (clear of HUD!)
        const k = (au - 0.34) / 0.28;
        camera.fov = 40;
        const stP = space.station.position;
        camera.position.set(stP.x + lerp(-1.2, -0.8, k), stP.y + 0.95, stP.z + lerp(5.8, 5.2, k));
        camera.lookAt(stP.x - 0.35, stP.y + 0.60, stP.z);
      } else {
        // Shot 9C: Wide Earth + Moon + Callout Pointer!
        const k = (au - 0.62) / 0.38;
        camera.fov = 40;
        camera.position.set(lerp(-0.9, 0.4, k), lerp(0.85, 0.45, k), lerp(14.5, 13.0, k));
        camera.lookAt(0, 0, 0);
      }
    } else {
      space.ufoFleet.visible = true;
      const flashRed = Math.sin(t * 18) > 0;
      if (au < 0.35) {
        // Shot 10A: 7-Ship Alien Armada Descending Toward Earth!
        const k = easeOutCubic(au / 0.35);
        space.ufoFleet.position.set(lerp(7.5, 0.4, k), lerp(1.6, -0.30, k), lerp(4.6, 5.4, k));
        space.ufoFleet.rotation.set(0.08, -0.35, 0);
        space.warnSign.visible = au > 0.16;
        space.ufoShips.forEach((s) => { s.userData.exhaust.material.opacity = 0.0; s.userData.rimMat.color.set('#22c55e'); });
        camera.fov = 44 - cutZoom;
        camera.position.set(lerp(-1.2, 0.2, k), 1.0, lerp(16.2, 15.0, k));
        camera.lookAt(1.2, 0.0, 3.0);
      } else if (au < 0.64) {
        // Shot 10B: Tight Close-Up on Flagship + Flashing Red "⚠ 07:50 早八高数" Warning!
        const k = (au - 0.35) / 0.29;
        space.ufoFleet.position.set(0.4, -0.30, 5.4);
        space.ufoFleet.rotation.set(0.08, lerp(-0.35, 2.35, smoothstep(0.45, 0.95, k)), 0.10);
        space.warnSign.visible = true;
        space.ufoShips.forEach((s) => { s.userData.exhaust.material.opacity = 0.35; s.userData.rimMat.color.set(flashRed ? '#ef4444' : '#fde047'); });
        camera.fov = 36;
        camera.position.set(lerp(0.6, 1.0, k), 0.75, lerp(11.6, 12.2, k));
        camera.lookAt(0.4, 0.45, 5.2);
      } else {
        // Shot 10C: Wide Warp-Speed Flee with 7 Glowing Blue Exhaust Trails!
        const k = Math.pow((au - 0.64) / 0.36, 2.0);
        space.ufoFleet.position.set(lerp(0.4, 28.0, k), lerp(-0.30, 11.5, k), lerp(5.4, -18.0, k));
        space.ufoFleet.rotation.set(-0.22, 2.55, -0.25);
        space.warnSign.visible = false;
        space.ufoShips.forEach((s) => { s.userData.exhaust.material.opacity = 0.95; s.userData.rimMat.color.set('#38bdf8'); });
        camera.fov = 46;
        camera.position.set(lerp(0.2, 1.8, k), 1.1, 16.5);
        camera.lookAt(lerp(0.4, 4.5, k), lerp(0.0, 2.0, k), 1.5);
      }
    }
  }

  camera.updateProjectionMatrix();
  composer.render();
}

function renderCover(mode) {
  document.body.classList.add(`mode-${mode}`);
  setActiveWorld('cover');
  scene.background.set('#0a1022');
  scene.fog = null;
  scene.environmentIntensity = 0.30;
  bloomPass.strength = 0.24;

  if (mode === 'cover16x9' || mode === 'cover4x3') {
    const is43 = mode === 'cover4x3';
    covPhone.group.position.set(is43 ? 2.4 : 3.2, 0.35, -0.6);
    covRings.forEach((r) => r.position.set(is43 ? 2.4 : 3.2, 0.35, -1.2));
    covXiaojiu.root.position.set(is43 ? 0.65 : 1.25, -2.3, 3.2);
    covXiaojiu.root.rotation.y = -0.3; covXiaojiu.root.scale.setScalar(1.25);
    covAuntie.root.position.set(is43 ? 2.85 : 3.85, -2.35, 2.6);
    covAuntie.root.rotation.y = -0.35; covAuntie.root.scale.setScalar(1.22);
    camera.fov = is43 ? 42 : 40;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.set(0, 0.4, is43 ? 11.4 : 10.8);
    camera.lookAt(0.35, 0.05, 0);

    elCoverLayer.innerHTML = is43
      ? `<div class="cover4x3-wrap">
           <div class="c16-top"><div class="c16-pill c43-pill">07:50 早八噩梦</div><div class="c16-subpill c43-subpill">3D 脑洞推演 · EP02</div></div>
           <div class="c43-main"><div class="c43-line1">每按一次闹钟翻倍？</div><div class="c43-line2">41次炸翻全城！</div></div>
           <div class="c43-stat">⚡ 20次=宿管爆炸头 ｜ 41次=194分贝极限</div>
         </div>`
      : `<div class="cover16x9-wrap">
           <div class="c16-top"><div class="c16-pill">07:50 早八噩梦</div><div class="c16-subpill">3D 脑洞推演 · EP02</div></div>
           <div class="c16-main"><div class="c16-line1">每按一次闹钟翻倍？</div><div class="c16-line2">41次炸翻全城！</div></div>
           <div class="c16-stat">⚡ 20次 = 宿管爆炸头 ｜ 41次 = 194分贝极限</div>
         </div>`;
  } else {
    const is34 = mode === 'cover3x4';
    covPhone.group.position.set(0, is34 ? 0.25 : 0.45, -1.2);
    covPhone.group.rotation.set(0.05, 0.08, -0.05);
    covRings.forEach((r) => r.position.set(0, is34 ? 0.25 : 0.45, -1.8));
    covXiaojiu.root.position.set(-1.15, is34 ? -3.3 : -3.7, 3.6);
    covXiaojiu.root.rotation.y = 0.22; covXiaojiu.root.scale.setScalar(1.22);
    covAuntie.root.position.set(1.25, is34 ? -3.3 : -3.7, 3.4);
    covAuntie.root.rotation.y = -0.25; covAuntie.root.scale.setScalar(1.22);
    camera.fov = 44;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.set(0, -0.2, is34 ? 11.8 : 13.2);
    camera.lookAt(0, -0.3, 0);

    elCoverLayer.innerHTML = is34
      ? `<div class="cover3x4-wrap">
           <div><div class="c9-kicker c34-kicker">07:50 早八噩梦</div><div class="c34-title1">每按一次闹钟翻倍？</div><div class="c34-title2">41次炸翻全城！</div></div>
           <div class="c34-bottom-tag">⚡ 20次=宿管爆炸头 ｜ 41次=194分贝极限</div>
         </div>`
      : `<div class="cover9x16-wrap">
           <div><div class="c9-kicker">07:50 早八噩梦</div><div class="c9-title1">每按一次闹钟翻倍？</div><div class="c9-title2">41次炸翻全城！</div></div>
           <div class="c9-bottom-tag">⚡ 20次=宿管爆炸头 ｜ 41次=194分贝极限</div>
         </div>`;
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
}

init();

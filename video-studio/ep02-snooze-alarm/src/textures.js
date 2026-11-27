import * as THREE from 'three';

// 1. Red Flashing 07:50 Alarm Lock Screen
export function makeAlarmScreenTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 896;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, 896);
  g.addColorStop(0, '#450a0a');
  g.addColorStop(0.5, '#991b1b');
  g.addColorStop(1, '#1c1917');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 896);

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '700 32px "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('闹钟响铃中', 256, 95);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 138px "SF Pro Display", "PingFang SC", sans-serif';
  ctx.fillText('07:50', 256, 280);

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.roundRect(76, 330, 360, 84, 24);
  ctx.fill();
  ctx.fillStyle = '#fef08a';
  ctx.font = '900 50px "PingFang SC", sans-serif';
  ctx.fillText('⚠ 早八高数', 256, 390);

  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.roundRect(56, 540, 400, 128, 64);
  ctx.fill();
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 58px "PingFang SC", sans-serif';
  ctx.fillText('稍后提醒 ×2', 256, 624);

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.roundRect(156, 730, 200, 66, 33);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '700 34px "PingFang SC", sans-serif';
  ctx.fillText('停止', 256, 775);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 2. Comedic Ending Lock Screen: "星期六 · 今日无课"
export function makeSaturdayScreenTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 896;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, 896);
  g.addColorStop(0, '#0c4a6e');
  g.addColorStop(0.55, '#0369a1');
  g.addColorStop(1, '#0f172a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 896);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#bae6fd';
  ctx.font = '800 44px "PingFang SC", sans-serif';
  ctx.fillText('11 月 28 日', 256, 150);

  ctx.fillStyle = '#fde047';
  ctx.font = '900 124px "PingFang SC", sans-serif';
  ctx.fillText('星期六', 256, 320);

  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(66, 400, 380, 120, 30);
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 66px "PingFang SC", sans-serif';
  ctx.fillText('今日无课！', 256, 484);

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = '700 38px "PingFang SC", sans-serif';
  ctx.fillText('已连续贪睡 46 次', 256, 635);
  ctx.fillStyle = '#fb7185';
  ctx.font = '800 36px "PingFang SC", sans-serif';
  ctx.fillText('电量 1% · 闹钟已累死', 256, 705);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 3. Floating Game-Style "×2" Badge Texture
export function makeX2BadgeTexture(label = '×2', bg = '#f97316') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 160;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 160);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(18, 20, 220, 120, 34);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 84px "SF Pro Display", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 128, 84);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 4. Sign / Plaque / Poster Texture
export function makeSignTexture(line1, line2 = '', bg = '#1e3a8a', fg = '#ffffff', accent = '#fde047') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 192);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 12;
  ctx.strokeRect(10, 10, 492, 172);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fg;
  if (line2) {
    ctx.font = '900 62px "PingFang SC", sans-serif';
    ctx.fillText(line1, 256, 68);
    ctx.fillStyle = accent;
    ctx.font = '900 48px "PingFang SC", sans-serif';
    ctx.fillText(line2, 256, 134);
  } else {
    ctx.font = '900 72px "PingFang SC", sans-serif';
    ctx.fillText(line1, 256, 98);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 5. Dorm Wall Weekly Class Schedule Poster (Rich Background Detail!)
export function makeSchedulePosterTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 384;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fffbeb';
  ctx.fillRect(0, 0, 512, 384);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 512, 68);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 34px "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('大一秋季课程表 · 404寝室', 256, 46);

  const days = ['周一', '周二', '周三', '周四', '周五', '周六'];
  const colors = ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#bfdbfe', '#e2e8f0'];
  const cw = 480 / 6;
  for (let i = 0; i < 6; i++) {
    const x = 16 + i * cw;
    ctx.fillStyle = i === 5 ? '#10b981' : '#334155';
    ctx.fillRect(x + 2, 78, cw - 4, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px "PingFang SC", sans-serif';
    ctx.fillText(days[i], x + cw / 2, 102);

    for (let r = 0; r < 4; r++) {
      const y = 118 + r * 62;
      ctx.fillStyle = i === 5 ? '#d1fae5' : colors[(i + r) % 5];
      ctx.fillRect(x + 2, y, cw - 4, 56);
      ctx.fillStyle = i === 5 ? '#065f46' : '#1e293b';
      ctx.font = '800 18px "PingFang SC", sans-serif';
      const label = i === 5 ? (r === 0 ? '无课!' : '') : ['高数', '大物', '线代', '英语'][(i + r) % 4];
      if (label) ctx.fillText(label, x + cw / 2, y + 35);
    }
  }
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 378);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 6. Dorm Wall Clock Reading 07:50!
export function makeWallClockTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(128, 128, 120, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 14; ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.strokeStyle = i % 3 === 0 ? '#dc2626' : '#475569';
    ctx.lineWidth = i % 3 === 0 ? 7 : 4;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * 86, 128 + Math.sin(a) * 86);
    ctx.lineTo(128 + Math.cos(a) * 106, 128 + Math.sin(a) * 106);
    ctx.stroke();
  }
  // Hour hand near 8, minute hand at 10 (07:50!)
  ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(74, 152); ctx.stroke();
  ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(68, 86); ctx.stroke();
  ctx.fillStyle = '#dc2626';
  ctx.beginPath(); ctx.arc(128, 128, 10, 0, Math.PI * 2); ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 7. Crisp Daylight & Shattered Architectural Facade Textures
export function makeDaylightFacadeTexture(style = 'glass') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');

  if (style === 'shattered') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 256, 512);
    const cols = 5, rows = 12, cw = 256 / cols, rh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, r * rh, 256, 6);
      for (let col = 0; col < cols; col++) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(col * cw + 5, r * rh + 10, cw - 10, rh - 14);
        // Jagged bright glass crack lines!
        ctx.strokeStyle = 'rgba(186,230,253,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(col * cw + 5, r * rh + 10);
        ctx.lineTo(col * cw + cw * 0.55, r * rh + rh * 0.55);
        ctx.lineTo(col * cw + cw - 6, r * rh + rh - 6);
        ctx.stroke();
      }
    }
  } else if (style === 'glass') {
    const bg = ctx.createLinearGradient(0, 0, 256, 512);
    bg.addColorStop(0, '#7c9eb8');
    bg.addColorStop(1, '#46647e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 512);
    const cols = 6, rows = 14, cw = 256 / cols, rh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, r * rh, 256, 7);
      for (let col = 0; col < cols; col++) {
        const shade = (r * 11 + col * 7) % 4;
        ctx.fillStyle = ['#93b8d4', '#6b91b0', '#52738f', '#3d5a73'][shade];
        ctx.fillRect(col * cw + 3, r * rh + 10, cw - 6, rh - 12);
      }
    }
  } else if (style === 'apartment') {
    ctx.fillStyle = '#e5dacb';
    ctx.fillRect(0, 0, 256, 512);
    const cols = 4, rows = 10, cw = 256 / cols, rh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = '#c9bca8';
      ctx.fillRect(0, r * rh, 256, 6);
      for (let col = 0; col < cols; col++) {
        const x = col * cw + 8, y = r * rh + 11, w = cw - 16, h = rh - 18;
        ctx.fillStyle = '#475569';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x + 4, y + 3, w - 8, h * 0.52);
        ctx.fillStyle = col % 2 === 0 ? '#d98a6c' : '#cbd5e1';
        ctx.fillRect(x, y + h * 0.58, w, h * 0.42);
      }
    }
  } else {
    ctx.fillStyle = '#dfd7ca';
    ctx.fillRect(0, 0, 256, 512);
    const cols = 5, rows = 12, cw = 256 / cols, rh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = '#c5bba9';
      ctx.fillRect(0, r * rh, 256, 4);
      for (let col = 0; col < cols; col++) {
        ctx.fillStyle = (r + col) % 3 === 0 ? '#476078' : '#33485c';
        ctx.fillRect(col * cw + 6, r * rh + 10, cw - 12, rh - 16);
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 8. High-Res Stylized Earth Texture (1024x512)
export function makeEarthTextures() {
  const w = 1024;
  const h = 512;
  const diffC = document.createElement('canvas');
  diffC.width = w;
  diffC.height = h;
  const dctx = diffC.getContext('2d');

  function hash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function vnoise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  function fbm(x, y) {
    let val = 0, amp = 0.5, freq = 1;
    for (let i = 0; i < 5; i++) {
      val += amp * vnoise(x * freq, y * freq);
      freq *= 2.04;
      amp *= 0.5;
    }
    return val;
  }

  const img = dctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    const lat = (y / h) * Math.PI - Math.PI / 2;
    const polar = Math.abs(lat) / (Math.PI / 2);
    for (let x = 0; x < w; x++) {
      const lon = (x / w) * Math.PI * 2;
      const nx = Math.cos(lon) * Math.cos(lat) * 2.2 + 4.0;
      const ny = Math.sin(lon) * Math.cos(lat) * 2.2 + 4.0;
      const nz = Math.sin(lat) * 2.2 + 4.0;
      const elev = fbm(nx + nz * 0.45, ny - nz * 0.35);

      let r, g, b;
      if (polar > 0.84 + (elev - 0.5) * 0.14) {
        r = 235; g = 245; b = 255;
      } else if (elev > 0.51) {
        const t = Math.min(1, (elev - 0.51) / 0.25);
        r = Math.round(78 + t * 118);
        g = Math.round(154 + t * 32);
        b = Math.round(78 - t * 18);
      } else {
        const t = Math.max(0, elev / 0.51);
        r = Math.round(14 + t * 26);
        g = Math.round(52 + t * 84);
        b = Math.round(126 + t * 88);
      }
      const idx = (y * w + x) * 4;
      d[idx] = r; d[idx + 1] = g; d[idx + 2] = b; d[idx + 3] = 255;
    }
  }
  dctx.putImageData(img, 0, 0);

  const earthTex = new THREE.CanvasTexture(diffC);
  earthTex.colorSpace = THREE.SRGBColorSpace;
  return { earthTex };
}

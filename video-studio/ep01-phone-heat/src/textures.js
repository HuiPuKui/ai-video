import * as THREE from '../node_modules/three/build/three.module.js';

export function makeGameScreenTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 256, 128);
  g.addColorStop(0, '#0c4a6e');
  g.addColorStop(0.5, '#0284c7');
  g.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = 'rgba(125,211,252,0.7)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(22, 108);
  ctx.lineTo(234, 20);
  ctx.stroke();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(210, 32, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(210, 32, 7, 0, Math.PI * 2);
  ctx.fill();
  ['#38bdf8', '#facc15', '#f97316', '#ef4444'].forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(165 + i * 22, 100 - (i % 2) * 10, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = 'rgba(15,23,42,0.75)';
  ctx.fillRect(72, 8, 112, 12);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(75, 11, 10, 6);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// 4 CRISP DAYLIGHT ARCHITECTURAL FACADE TEXTURES (NO MORE BLANK BOX BUILDINGS!)
// ---------------------------------------------------------------------------
export function makeDaylightFacadeTexture(style = 'glass') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');

  if (style === 'glass') {
    // Modern Blue-Grey Daylight Glass Curtain Wall Skyscraper
    const bg = ctx.createLinearGradient(0, 0, 256, 512);
    bg.addColorStop(0, '#7c9eb8');
    bg.addColorStop(0.5, '#5a7d9a');
    bg.addColorStop(1, '#46647e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 512);

    const cols = 6;
    const rows = 14;
    const cw = 256 / cols;
    const rh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      // Concrete/aluminum horizontal spandrel band
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, r * rh, 256, 7);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, r * rh + 7, 256, 2);
      for (let col = 0; col < cols; col++) {
        const x = col * cw + 3;
        const y = r * rh + 10;
        const w = cw - 6;
        const h = rh - 12;
        // Subtle sunlit sky reflection variation per pane!
        const shade = ((r * 11 + col * 7) % 5);
        ctx.fillStyle = shade === 0 ? '#93b8d4' : shade === 1 ? '#6b91b0' : shade === 2 ? '#52738f' : '#3d5a73';
        ctx.fillRect(x, y, w, h);
        // Diagonal sunlit sheen highlight
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.fillRect(x, y, w, 5);
        // Interior blind hint on some panes
        if ((r * 3 + col * 5) % 4 === 0) {
          ctx.fillStyle = 'rgba(254, 243, 199, 0.25)';
          ctx.fillRect(x + 2, y + 3, w - 4, h * 0.45);
        }
      }
    }
  } else if (style === 'office') {
    // Warm Sandstone/Ivory Architectural Office Tower with Recessed Ribbon Windows
    ctx.fillStyle = '#dfd7ca';
    ctx.fillRect(0, 0, 256, 512);
    const cols = 5;
    const rows = 12;
    const cw = 256 / cols;
    const rh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      // Subtle floor groove shadow
      ctx.fillStyle = '#c5bba9';
      ctx.fillRect(0, r * rh, 256, 4);
      for (let col = 0; col < cols; col++) {
        const x = col * cw + 6;
        const y = r * rh + 10;
        const w = cw - 12;
        const h = rh - 16;
        // Deep window recess frame
        ctx.fillStyle = '#9e9484';
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
        ctx.fillStyle = (r + col) % 3 === 0 ? '#476078' : '#33485c';
        ctx.fillRect(x, y, w, h);
        // Window mullion & upper sky reflection
        ctx.fillStyle = 'rgba(224,242,254,0.22)';
        ctx.fillRect(x, y, w, h * 0.35);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x + w / 2 - 1, y, 2, h);
      }
    }
  } else if (style === 'apartment') {
    // Warm Terracotta/Beige Residential Apartment with Balconies & Windows
    ctx.fillStyle = '#e5dacb';
    ctx.fillRect(0, 0, 256, 512);
    const cols = 4;
    const rows = 10;
    const cw = 256 / cols;
    const rh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      // Horizontal floor slab shadow
      ctx.fillStyle = '#c9bca8';
      ctx.fillRect(0, r * rh, 256, 6);
      for (let col = 0; col < cols; col++) {
        const x = col * cw + 8;
        const y = r * rh + 11;
        const w = cw - 16;
        const h = rh - 18;
        // Recessed balcony shadow
        ctx.fillStyle = '#5c554c';
        ctx.fillRect(x, y, w, h);
        // Sliding glass door inside balcony
        ctx.fillStyle = '#3b5268';
        ctx.fillRect(x + 4, y + 3, w - 8, h * 0.55);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x + 5, y + 4, (w - 10) * 0.45, h * 0.48);
        // Balcony railing bottom half
        ctx.fillStyle = col % 2 === 0 ? '#d98a6c' : '#cbd5e1';
        ctx.fillRect(x, y + h * 0.58, w, h * 0.42);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x, y + h * 0.56, w, 3);
      }
    }
  } else {
    // Crisp Cool-Grey Modern Corporate Tower
    ctx.fillStyle = '#cfd6de';
    ctx.fillRect(0, 0, 256, 512);
    const rows = 14;
    const rh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = '#b6c0cc';
      ctx.fillRect(0, r * rh, 256, 4);
      // Continuous horizontal ribbon glass
      ctx.fillStyle = '#3c556e';
      ctx.fillRect(10, r * rh + 10, 236, rh - 16);
      ctx.fillStyle = 'rgba(186,230,253,0.22)';
      ctx.fillRect(10, r * rh + 10, 236, 5);
      for (let x = 40; x < 240; x += 38) {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x, r * rh + 10, 4, rh - 16);
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeHelipadTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(64, 64, 46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(42, 36, 10, 56);
  ctx.fillRect(76, 36, 10, 56);
  ctx.fillRect(42, 59, 44, 10);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeEarthTextures() {
  const w = 512;
  const h = 256;
  const diffC = document.createElement('canvas');
  diffC.width = w;
  diffC.height = h;
  const dctx = diffC.getContext('2d');

  function hash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function vnoise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  function fbm(x, y) {
    let val = 0;
    let amp = 0.5;
    let freq = 1;
    for (let i = 0; i < 4; i++) {
      val += amp * vnoise(x * freq, y * freq);
      freq *= 2.05;
      amp *= 0.5;
    }
    return val;
  }

  const cell = 2;
  for (let y = 0; y < h; y += cell) {
    const lat = (y / h) * Math.PI - Math.PI / 2;
    const polar = Math.abs(lat) / (Math.PI / 2);
    for (let x = 0; x < w; x += cell) {
      const lon = (x / w) * Math.PI * 2;
      const nx = Math.cos(lon) * Math.cos(lat) * 2.1 + 4.0;
      const ny = Math.sin(lon) * Math.cos(lat) * 2.1 + 4.0;
      const nz = Math.sin(lat) * 2.1 + 4.0;
      const elev = fbm(nx + nz * 0.45, ny - nz * 0.35);

      if (polar > 0.83 + (elev - 0.5) * 0.14) {
        dctx.fillStyle = '#e2f1ff';
      } else if (elev > 0.51) {
        const t = Math.min(1, (elev - 0.51) / 0.25);
        dctx.fillStyle = t > 0.58 ? '#a16207' : t > 0.22 ? '#22c55e' : '#4ade80';
      } else {
        dctx.fillStyle = elev > 0.45 ? '#0284c7' : '#0c4a6e';
      }
      dctx.fillRect(x, y, cell, cell);
    }
  }
  const tex = new THREE.CanvasTexture(diffC);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { earthTex: tex };
}

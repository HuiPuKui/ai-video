// 方案 A · 第一句 0–5.26s
// 横屏 16:9。画面始终满：像素雨、漂浮的回忆碎片、远景剪影、
// 他站在左下角的一格里，歌词逐字从碎片里拼出并落在拍上。
import { Clawd } from '../components/Clawd.jsx';
import { BEATS, BARS, EIGHTHS, hit, hitSoft, beatPos, curve, BM } from '../lib/beat.js';
import { clamp, seg, ease, rng, rectsPath } from '../lib/math.js';
import glyphs from '../data/glyphs.json';

const W = 1920, H = 1080;
const LINE = BM.lines[0];
const TEXT = [...LINE.text];
const GN = glyphs.big.n;

const HIM = { x: 430, y: 640 };

function field(seed, n, fn) {
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < n; i++) out.push(fn(r, i));
  return out;
}

// 持续下落的像素雨
const RAIN = field(3, 150, (r) => ({
  x: r() * W, y0: r() * H, spd: 26 + r() * 70, s: 2 + Math.floor(r() * 3),
  pink: r() > 0.86, ph: r(),
}));

// 缓慢漂浮的回忆碎片（成簇的小方块）
const MOTES = field(9, 46, (r) => ({
  x: 60 + r() * (W - 120), y: 60 + r() * (H - 260),
  vx: (r() - 0.5) * 18, vy: -6 - r() * 14,
  n: 3 + Math.floor(r() * 5), rot: r() * 40 - 20, pink: r() > 0.8, ph: r(),
  bits: Array.from({ length: 6 }, () => [Math.floor(r() * 5) * 6, Math.floor(r() * 4) * 6, 4 + Math.floor(r() * 2) * 2]),
}));

// 远景：一排小小的剪影，强调"渺小"
const CROWD = field(17, 26, (r, i) => ({
  x: 40 + i * 74 + (r() - 0.5) * 18,
  s: 0.55 + r() * 0.5,
  ph: r(),
}));

// 他身边被点亮的格子
const TILES = [];
for (let iy = 0; iy < 5; iy++) {
  for (let ix = 0; ix < 8; ix++) {
    const d = Math.hypot(ix - 2.4, iy - 2.6);
    if (d < 4) TILES.push({ ix, iy, k: 1 - d / 4, warm: (ix + iy) % 4 === 0 });
  }
}

// 背景大网格
const GRID = (() => {
  const rs = [];
  for (let x = 0; x <= W; x += 64) rs.push([x, 0, 1, H]);
  for (let y = 0; y <= H; y += 64) rs.push([0, y, W, 1]);
  return rectsPath(rs);
})();

// 拉远时从中心炸开的像素
const BURST = field(23, 110, (r) => ({
  ang: r() * Math.PI * 2, dist: 160 + r() * 1040,
  s: 3 + Math.floor(r() * 5), delay: r() * 0.14, g: 150 + Math.floor(r() * 80),
}));

export default function Scene01({ t }) {
  const low = curve('low', t);
  const mid = curve('mid', t);
  const beat = beatPos(t);
  const kick = hit(BEATS, t, 0.14);
  const bar = hitSoft(BARS, t, 0.015, 0.24);
  const eighth = hit(EIGHTHS, t, 0.07);

  const world = seg(t, 1.9, 2.7, ease.out);
  const title = seg(t, 0.18, 0.7) * (1 - seg(t, 1.32, 1.8));
  const breathe = 0.5 + 0.5 * Math.sin(t * 6.2);
  const pulse = 0.3 + 0.7 * Math.max(breathe * 0.4, kick);
  const cam = 1 + bar * 0.014 + low * 0.01;

  const walk = t > 2.45 ? beat * 0.5 : 0;
  const bob = t > 2.25 ? -kick * 8 : 0;
  const squash = t > 2.25 ? 1 - kick * 0.08 : 1;
  const blink = t > 3.12 && t < 3.32 ? seg(t, 3.12, 3.2) * (1 - seg(t, 3.24, 3.32)) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" shapeRendering="crispEdges" style={{ display: 'block', background: '#09070d' }}>
      <defs>
        <radialGradient id="vig" cx="34%" cy="62%" r="75%">
          <stop offset="0%" stopColor="#1b1522" />
          <stop offset="55%" stopColor="#100d14" />
          <stop offset="100%" stopColor="#07060a" />
        </radialGradient>
        <linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2030" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2a2030" stopOpacity="0" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#vig)" />

      {/* 远景光带 */}
      <rect x="0" y="150" width={W} height="260" fill="url(#horizon)" opacity={0.55 + low * 0.2} shapeRendering="auto" />
      <rect x="0" y={286 + Math.sin(t * 0.7) * 4} width={W} height="2" fill="#F4A8C2" opacity={0.18 + eighth * 0.25} />

      {/* 大网格，随低频轻轻呼吸 */}
      <g opacity={0.55 + world * 0.35} transform={`translate(${W / 2} ${H / 2}) scale(${cam}) translate(${-W / 2} ${-H / 2})`}>
        <path d={GRID} fill="#2c2633" />
      </g>

      {/* 像素雨：全程都在，八分音符时变亮 */}
      {RAIN.map((p, i) => {
        const y = (p.y0 + t * p.spd * (1 + low * 0.6)) % (H + 40) - 20;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(beat * Math.PI * 2 + p.ph * 8));
        return (
          <rect key={i} x={p.x} y={y} width={p.s} height={p.s * 2}
            fill={p.pink ? '#F4A8C2' : '#cbbfb4'}
            opacity={(0.07 + eighth * 0.16) * tw} />
        );
      })}

      {/* 中景：成排的回忆方块，从远处飘向他 */}
      <Midfield t={t} kick={kick} eighth={eighth} world={world} />

      {/* 漂浮的回忆碎片 */}
      {MOTES.map((m, i) => {
        const x = m.x + Math.sin(t * 0.35 + m.ph * 6) * 26 + m.vx * Math.sin(t * 0.2);
        const y = m.y + Math.sin(t * 0.5 + m.ph * 4) * 16 + (beat % 1) * -2;
        const op = (0.16 + eighth * 0.14) * (0.6 + 0.4 * Math.sin(t + m.ph * 5));
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} opacity={Math.max(0.05, op)}>
            {m.bits.slice(0, m.n).map(([bx, by, bs], j) => (
              <rect key={j} x={bx - 12} y={by - 10} width={bs} height={bs} fill={m.pink ? '#F4A8C2' : '#d8cfc6'} />
            ))}
          </g>
        );
      })}

      {/* 远景人群剪影 */}
      <g opacity={0.35 + world * 0.5}>
        {CROWD.map((c, i) => (
          <g key={i} transform={`translate(${c.x} ${300 - Math.sin(beat * Math.PI * 2 + c.ph * 6) * 3}) scale(${c.s})`} opacity={0.55}>
            <Clawd sex={i % 7 === 3 ? 'f' : 'm'} scale={0.42} bob={-kick * 2} walk={beat * 0.3 + c.ph} />
          </g>
        ))}
      </g>

      {/* 地面与他所占的那一格 */}
      <g opacity={0.25 + world * 0.75} transform={`translate(${W / 2} ${H / 2}) scale(${cam}) translate(${-W / 2} ${-H / 2})`}>
        <rect x="0" y="600" width={W} height="480" fill="#120e14" opacity="0.72" />
        {TILES.map((c, i) => (
          <rect key={i} x={250 + c.ix * 62} y={520 + c.iy * 46} width="58" height="42"
            fill={c.warm ? '#3d2b34' : '#26202c'} opacity={0.3 + c.k * 0.45 + kick * c.k * 0.3} />
        ))}
        <rect x={HIM.x - 96} y={HIM.y - 230} width="192" height="268" fill="none" stroke="#F4A8C2" strokeWidth="1.5" opacity={0.35 + kick * 0.3} />

        <g transform={`translate(${HIM.x} ${HIM.y})`}>
          <ellipse cx="0" cy="26" rx="92" ry="12" fill="#000" opacity="0.4" shapeRendering="auto" />
          <Clawd sex="m" scale={3.6} bob={bob} squash={squash} blink={blink} walk={walk}
            lean={Math.sin(beat * 0.5) * 1.1} look={t > 3.6 ? 0.6 : 0} glow={kick * 0.5} />
        </g>

        {/* 他脚边散落的、还没拼上的粉像素 */}
        <Scatter t={t} kick={kick} />
      </g>

      {/* 右侧一列竖排的碎片柱，填满右上空白 */}
      <Columns t={t} eighth={eighth} mid={mid} />

      {/* 拉远爆散 */}
      {t > 1.82 && t < 2.9 && BURST.map((b, i) => {
        const k = ease.out(clamp((t - 1.85 - b.delay) / 0.5));
        if (k <= 0) return null;
        return (
          <rect key={i}
            x={W / 2 + Math.cos(b.ang) * b.dist * k}
            y={H / 2 + Math.sin(b.ang) * b.dist * 0.58 * k}
            width={b.s} height={b.s}
            fill={`rgb(${b.g},${b.g - 8},${b.g - 14})`} opacity={(1 - k) * 0.8} />
        );
      })}

      {/* 前奏核心粉像素 */}
      {t < 2.25 && (
        <g opacity={1 - seg(t, 1.9, 2.25)}>
          <rect x={W / 2 - 140} y={H / 2 - 150} width="280" height="280" fill="#ffb7cc"
            opacity={0.2 * pulse} filter="url(#glow)" shapeRendering="auto" />
          <rect x={W / 2 - 13} y={H / 2 - 22} width="26" height="44" fill="#F4A8C2" opacity={0.45 + 0.55 * pulse} />
          <rect x={W / 2 - 13} y={H / 2 - 22} width="6" height="44" fill="#fff2f6" opacity={0.45 * pulse} />
        </g>
      )}

      {/* 片名 */}
      <g opacity={title}>
        <rect x={W / 2 - 250} y={H / 2 + 40} width="500" height="96" fill="#09070d" opacity="0.55" />
        <PixelWord text="把回忆拼好给你" x={W / 2} y={H / 2 + 56} cell={6} color="#efe6dc" />
        <text x={W / 2} y={H / 2 + 176} textAnchor="middle" fill="#b3a89e" fontSize="22"
          fontFamily="Songti SC, Noto Serif CJK SC, serif" letterSpacing="12">王贰浪</text>
      </g>

      <Lyric t={t} kick={kick} eighth={eighth} />

      {/* 顶栏与底栏信息带，避免上下留白 */}
      <g opacity={0.8}>
        <text x="48" y="46" fill="#8d847c" fontSize="16" fontFamily="Songti SC, Noto Serif CJK SC, serif" letterSpacing="6">把回忆拼好给你</text>
        <text x={W - 48} y="46" textAnchor="end" fill="#8d847c" fontSize="16" fontFamily="ui-monospace, monospace" letterSpacing="3">{t.toFixed(2)}</text>
        <rect x="48" y="60" width={420 * clamp(t / 5.26)} height="2" fill="#F4A8C2" opacity="0.7" />
      </g>
      <rect x="48" y="1052" width={1824 * clamp(t / 5.26)} height="3" fill="#F4A8C2" opacity="0.75" />

      <rect width={W} height={H} fill="#fff" opacity={bar * 0.045} shapeRendering="auto" />
    </svg>
  );
}

function Midfield({ t, eighth, world }) {
  const rows = [360, 430, 500, 570];
  return (
    <g opacity={0.35 + world * 0.55}>
      {rows.map((y, ri) => (
        <g key={ri}>
          {Array.from({ length: 16 }, (_, i) => {
            const drift = ((t * (18 + ri * 7) + i * 130) % (W + 80)) - 40;
            const x = ri % 2 ? W - drift : drift;
            const s = 10 + ((i + ri) % 4) * 4;
            const on = ((i + Math.floor(beatSafe(t)) + ri) % 3) !== 0;
            return (
              <g key={i} opacity={on ? 0.55 + eighth * 0.3 : 0.2}>
                <rect x={x} y={y + Math.sin(t * 1.4 + i) * 6} width={s} height={s}
                  fill={(i + ri) % 6 === 0 ? '#F4A8C2' : '#6e6478'} />
                <rect x={x + s + 4} y={y + 2} width={s * 0.6} height={s * 0.6} fill="#3c3546" />
              </g>
            );
          })}
        </g>
      ))}
      {/* 中间一块未完成的拼图：缺的格子随拍点亮 */}
      <g transform="translate(980 300)">
        <rect x="-16" y="-16" width="392" height="280" fill="#140f18" opacity={0.8} />
        <rect x="-16" y="-16" width="392" height="280" fill="none" stroke="#F4A8C2" strokeWidth="1" opacity="0.3" />
        {Array.from({ length: 24 }, (_, i) => {
          const c = i % 6, r = Math.floor(i / 6);
          const missing = (c === 4 && r === 1) || (c === 2 && r === 2) || (c === 5 && r === 3);
          const lit = !missing && ((c * 3 + r + Math.floor(t * 3)) % 7) < 5;
          return (
            <rect key={i} x={c * 60} y={r * 62} width="52" height="52"
              fill={missing ? 'none' : lit ? (r === 0 ? '#e7b3c4' : '#c98b9a') : '#3a303c'}
              stroke={missing ? '#F4A8C2' : 'none'} strokeWidth="1" strokeDasharray={missing ? '4 3' : undefined}
              opacity={missing ? 0.5 + eighth * 0.4 : 0.85} />
          );
        })}
      </g>
    </g>
  );
}

function beatSafe(t) { return t; }

function Scatter({ t, kick }) {
  const bits = field(41, 22, (r) => ({
    x: (r() - 0.5) * 260, y: 10 + r() * 70, s: 4 + Math.floor(r() * 3) * 2, ph: r(),
  }));
  const show = seg(t, 2.3, 2.9);
  if (show <= 0) return null;
  return (
    <g opacity={show}>
      {bits.map((b, i) => (
        <rect key={i} x={HIM.x + b.x} y={HIM.y + b.y - Math.sin(t * 2 + b.ph * 6) * 4}
          width={b.s} height={b.s} fill={i % 4 === 0 ? '#F4A8C2' : '#d9cfc6'}
          opacity={0.4 + kick * 0.4} />
      ))}
    </g>
  );
}

function Columns({ t, eighth, mid }) {
  const cols = [1500, 1580, 1660, 1740, 1820];
  return (
    <g opacity={0.3 + seg(t, 1.6, 2.4) * 0.6}>
      {cols.map((x, ci) => {
        const h = 180 + ((ci * 97) % 260) + mid * 80;
        const blocks = Math.floor(h / 14);
        return (
          <g key={ci}>
            {Array.from({ length: blocks }, (_, i) => {
              const on = ((i + Math.floor(t * 6) + ci) % 5) !== 0;
              if (!on) return null;
              return (
                <rect key={i} x={x} y={120 + i * 14} width="8" height="8"
                  fill={i % 9 === 0 ? '#F4A8C2' : '#3a3344'}
                  opacity={0.5 + eighth * 0.4} />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

function Lyric({ t, kick }) {
  const cell = 8;
  const gap = 16;
  const lineW = TEXT.length * (GN * cell + gap);
  const x0 = (W - lineW) / 2;
  const y = 812;
  return (
    <g>
      <rect x={x0 - 28} y={y - 18} width={lineW + 40} height={GN * cell + 36}
        fill="#09070d" opacity={0.6 * seg(t, 1.8, 2.2)} />
      {TEXT.map((ch, i) => {
        const k = ease.out(clamp((t - LINE.chars[i]) / 0.18));
        if (k <= 0) return null;
        return (
          <CharGlyph key={i} ch={ch} k={k} ox={x0 + i * (GN * cell + gap)} oy={y}
            cell={cell} i={i} kick={kick} />
        );
      })}
    </g>
  );
}

function CharGlyph({ ch, k, ox, oy, cell, i, kick }) {
  const pts = glyphs.big.g[ch] || [];
  const n = Math.ceil(pts.length * k);
  const r = rng(80 + i);
  const color = i < 5 ? '#f6eee6' : '#F4A8C2';
  return (
    <g>
      <path d={rectsPath(pts.slice(0, n).map(([x, y]) => [ox + x * cell, oy + y * cell, cell - 1.4, cell - 1.4]))} fill={color} />
      {pts.slice(n, Math.min(pts.length, n + 9)).map(([x, y], j) => {
        const s = (1 - k) * 64;
        return (
          <rect key={j} x={ox + x * cell + (r() - 0.5) * s} y={oy + y * cell - s * (0.3 + r() * 0.6)}
            width={cell - 1.4} height={cell - 1.4} fill={color} opacity={0.45 + kick * 0.4} />
        );
      })}
    </g>
  );
}

function PixelWord({ text, x, y, cell, color }) {
  const small = glyphs.small;
  const chars = [...text];
  const w = chars.length * (small.n * cell + 6);
  const ox = x - w / 2;
  return (
    <g>
      {chars.map((ch, i) => {
        const pts = small.g[ch] || [];
        const cx = ox + i * (small.n * cell + 6);
        return <path key={i} d={rectsPath(pts.map(([px, py]) => [cx + px * cell, y + py * cell, cell - 1, cell - 1]))} fill={color} />;
      })}
    </g>
  );
}

// Clawd：按原图像素比例重建。公 = 原色；母 = 更粉 + 发夹。
// 网格 1 单位 = 1 像素。锚点在身体底部中心 (0, 0)，脚底约 y=16。
import { rectsPath, rng, clamp } from '../lib/math.js';

const PAL = {
  m: {
    body: '#CC8B89', hi: '#E09D9B', arm: '#E9BBBA', leg: '#E09B9B',
    shade: '#956564', eye: '#0c0a0b', clip: null,
  },
  f: {
    body: '#F4A8C2', hi: '#F8C2D4', arm: '#F6B7CC', leg: '#F0A0B8',
    shade: '#C97A93', eye: '#3a2030', clip: '#FF4F8B',
  },
};

const BW = 112, BH = 56; // 身体宽高

function build() {
  const body = [[-BW / 2, -BH, BW, BH]];
  const arm = (s) => [[s * (BW / 2), -BH + 15, s * 12, 12]];
  const legs = (s) => [[s * 10, 4, 8, 12], [s * 22, 4, 8, 12]];
  const eyes = [[-9, -BH + 16, 6, 10], [3, -BH + 16, 6, 10]];
  const shade = [[-9, -BH + 15, 6, 1], [3, -BH + 15, 6, 1]];
  return { body, armL: arm(-1), armR: arm(1), legsL: legs(-1), legsR: legs(1), eyes, shade };
}
const PARTS = build();

// 身体上可拆下的粉色像素（伏笔：她在把自己拆给这个世界）
function shedPixels() {
  const r = rng(7);
  const out = [];
  for (let i = 0; i < 34; i++) {
    const x = Math.floor(r() * (BW - 6)) - BW / 2 + 2;
    const y = Math.floor(r() * (BH - 6)) - BH + 2;
    const nearEye = (Math.abs(x + 6) < 10 || Math.abs(x - 6) < 10) && y > -BH + 13 && y < -BH + 30;
    if (nearEye) continue;
    out.push({ x, y, w: 2 + Math.floor(r() * 2), h: 2, d: r() });
  }
  return out;
}
const SHED = shedPixels();

export function Clawd({
  x = 0, y = 0, scale = 1, sex = 'm',
  squash = 1, bob = 0, blink = 0, look = 0,
  walk = 0, arm = 0, lean = 0, opacity = 1,
  missing = 0, clip = true, glow = 0,
}) {
  const pal = PAL[sex];
  const sy = squash, sx = 1 / Math.sqrt(Math.max(0.6, squash));
  const eyeH = 10 * (1 - 0.92 * clamp(blink));
  const eyeY = -BH + 16 + (10 - eyeH);
  const pupil = clamp(look, -1.4, 1.4);
  const step = Math.sin(walk * Math.PI * 2);
  const legL = step * 3.2, legR = -step * 3.2;
  const armL = Math.sin(walk * Math.PI * 2 + 0.4) * 2 + arm * 6;
  const armR = -Math.sin(walk * Math.PI * 2 + 0.4) * 2 - arm * 3;

  let shed = null;
  if (missing > 0) {
    const gone = SHED.filter((p) => p.d < missing);
    shed = gone.length ? rectsPath(gone.map((p) => [p.x, p.y, p.w, p.h])) : null;
  }

  const g = (parts, dx = 0, dy = 0) => rectsPath(parts.map(([a, b, w, h]) => [a + dx, b + dy, w, h]));

  return (
    <g transform={`translate(${x.toFixed(2)} ${(y + bob).toFixed(2)}) scale(${(scale * sx).toFixed(3)} ${(scale * sy).toFixed(3)}) rotate(${lean.toFixed(2)})`} opacity={opacity}>
      {glow > 0 && <rect x={-BW / 2 - 6} y={-BH - 6} width={BW + 12} height={BH + 26} fill={sex === 'f' ? '#ffd0e0' : '#e7cfc8'} opacity={0.35 * glow} />}
      <path d={g(PARTS.legsL, 0, legL)} fill={pal.leg} />
      <path d={g(PARTS.legsR, 0, legR)} fill={pal.leg} />
      <path d={g(PARTS.armL, armL * 0.3, armL)} fill={pal.arm} />
      <path d={g(PARTS.armR, -armR * 0.3, armR)} fill={pal.arm} />
      <path d={g(PARTS.body)} fill={pal.body} />
      <path d={rectsPath([[-BW / 2, -BH, 4, BH], [BW / 2 - 3, -BH + 8, 3, 10]])} fill={pal.hi} opacity="0.85" />
      <path d={g(PARTS.shade)} fill={pal.shade} />
      <path d={rectsPath([[-9 + pupil, eyeY, 6, eyeH], [3 + pupil, eyeY, 6, eyeH]])} fill={pal.eye} />
      {sex === 'f' && clip && (
        <g>
          <rect x={14} y={-BH - 7} width={16} height={5} fill={pal.clip} />
          <rect x={18} y={-BH - 11} width={8} height={5} fill={pal.clip} />
          <rect x={20} y={-BH - 13} width={4} height={3} fill="#fff4f8" />
        </g>
      )}
      {shed && <path d={shed} fill="#f4efe6" />}
    </g>
  );
}

export const CLAWD = { BW, BH };

// 纯函数工具：缓动、插值、确定性随机
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const inv = (a, b, v) => clamp((v - a) / (b - a));
export const mix = (a, b, k) => lerp(a, b, clamp(k));

export const ease = {
  linear: (k) => k,
  inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  out: (k) => 1 - Math.pow(1 - k, 3),
  outQuart: (k) => 1 - Math.pow(1 - k, 4),
  expoOut: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  inOutSine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
  outBack: (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2),
  in: (k) => k * k * k,
};

// 时间段内的缓动进度
export const seg = (t, t0, t1, fn = ease.inOut) => fn(inv(t0, t1, t));

// 关键帧插值：keys = [[t, v], ...]，v 可为数字
export function keys(t, ks, fn = ease.inOut) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) {
      const [t0, v0] = ks[i - 1];
      const [t1, v1, f] = ks[i];
      return lerp(v0, v1, (f || fn)(inv(t0, t1, t)));
    }
  }
  return ks[ks.length - 1][1];
}

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// 一组矩形合并为单条 path，减少 DOM 节点
export const rectsPath = (rs) =>
  rs.map(([x, y, w, h]) => `M${+x.toFixed(2)} ${+y.toFixed(2)}h${+w.toFixed(2)}v${+h.toFixed(2)}h${-w.toFixed(2)}z`).join('');

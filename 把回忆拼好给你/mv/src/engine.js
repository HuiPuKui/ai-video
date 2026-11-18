import B from './data/beats.json'

export const W = 1080, H = 1920
export const DURATION = 59
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
export const lerp = (a, b, k) => a + (b - a) * k
export const prog = (t, a, b) => clamp((t - a) / (b - a))
export const E = {
  out: k => 1 - Math.pow(1 - k, 3),
  in: k => k * k * k,
  inOut: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  back: k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2) },
  elastic: k => (k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
}

export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const mix = (a, b, k) => {
  const ch = s => { const n = parseInt(s.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
  const A = ch(a), Bc = ch(b)
  return '#' + A.map((v, i) => Math.round(v + (Bc[i] - v) * clamp(k)).toString(16).padStart(2, '0')).join('')
}

export const BEATS = B.beats
export const TEMPO = B.tempo

/** 当前拍信息：pulse 在拍点瞬间为 1，随后指数衰减 */
export function beat(t) {
  const bs = BEATS
  if (t < bs[0]) return { i: -1, since: 9, pulse: 0, phase: 0, iv: 0.42 }
  let lo = 0, hi = bs.length - 1
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (bs[m] <= t) lo = m; else hi = m - 1 }
  const since = t - bs[lo]
  const iv = (bs[lo + 1] ?? bs[lo] + 0.42) - bs[lo]
  return { i: lo, since, pulse: Math.exp(-since * 7), phase: clamp(since / iv), iv }
}

/** 0~1 的响度包络 (10fps 插值) */
export function energy(t) {
  const e = B.energy, f = t * B.energyFps, i = Math.floor(f)
  if (i < 0) return 0
  if (i >= e.length - 1) return e[e.length - 1] || 0
  return lerp(e[i], e[i + 1], f - i)
}

export const beatsIn = (a, b) => BEATS.filter(x => x >= a && x < b)

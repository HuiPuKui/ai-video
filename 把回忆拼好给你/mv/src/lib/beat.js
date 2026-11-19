// 节拍系统：所有律动都从这里取值，保证与音频同一时钟
import bm from '../data/beatmap.json';
import { clamp } from './math.js';

export const BM = bm;
export const PERIOD = bm.period;
export const BEATS = bm.beats;
export const BARS = bm.bars;
export const EIGHTHS = BEATS.flatMap((b) => [b, b + PERIOD / 2]);

// 有序数组中 <= t 的最后一个下标
export function lastIndex(arr, t) {
  let lo = 0, hi = arr.length - 1, ans = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (arr[m] <= t) { ans = m; lo = m + 1; } else hi = m - 1;
  }
  return ans;
}

// 距上一个事件的时间（没有则为 Infinity）
export function since(arr, t) {
  const i = lastIndex(arr, t);
  return i < 0 ? Infinity : t - arr[i];
}

// 冲击包络：事件发生瞬间为 1，指数衰减
export const hit = (arr, t, decay = 0.18) => {
  const s = since(arr, t);
  return Number.isFinite(s) ? Math.exp(-s / decay) : 0;
};

// 带极短起音的包络，避免一帧跳变
export const hitSoft = (arr, t, attack = 0.03, decay = 0.2) => {
  const i = lastIndex(arr, t + attack);
  if (i < 0) return 0;
  const s = t - arr[i];
  if (s < 0) return clamp(1 + s / attack);
  return Math.exp(-s / decay);
};

// 连续的拍位置（浮点），用于循环运动
export const beatPos = (t) => (t - bm.phase) / PERIOD;

// 能量曲线采样（每帧一个值，60fps）
export function curve(name, t) {
  const a = bm[name];
  const x = clamp(t * bm.fps, 0, a.length - 1);
  const i = Math.floor(x), f = x - i;
  return a[i] * (1 - f) + (a[Math.min(i + 1, a.length - 1)] || 0) * f;
}

// 平滑后的曲线（向前看 n 帧求均值，避免高频抖动）
export function curveSmooth(name, t, win = 0.12) {
  let s = 0, n = 6;
  for (let k = 0; k < n; k++) s += curve(name, t - (win * k) / n);
  return s / n;
}

import React from 'react'
import { W, H, rng, mix, clamp, lerp, E } from '../engine'
import { GRAIN } from '../data/grain'

/* ---------- 天空 ---------- */
export function Sky({ th, a, b, k = 0, id = 'sky' }) {
  const A = th.sky[a], Bk = th.sky[b || a]
  const top = mix(A[0], Bk[0], k), bot = mix(A[1], Bk[1], k)
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
      </defs>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={`url(#${id})`} />
    </>
  )
}

/* ---------- 星星 ---------- */
const STAR_FIELD = (() => { const r = rng(7); return Array.from({ length: 140 }, () => ({ x: r() * W, y: r() * H * 0.75, s: 0.4 + r() * 1.2, p: r() * 6.28, b: r() < 0.18 })) })()
export function StarShape({ th, s = 1, color }) {
  const c = color || '#FFF6D8'
  if (th.star === 'square') return <rect x={-3 * s} y={-3 * s} width={6 * s} height={6 * s} fill={c} />
  if (th.star === 'cross') return <g stroke={c} strokeWidth={1.6 * s} strokeLinecap="round"><line x1={-7 * s} y1={0} x2={7 * s} y2={0} /><line x1={0} y1={-7 * s} x2={0} y2={7 * s} /></g>
  const pts = Array.from({ length: 10 }, (_, i) => { const r = (i % 2 ? 2.6 : 6.5) * s, a = (i / 10) * Math.PI * 2 - Math.PI / 2; return `${Math.cos(a) * r},${Math.sin(a) * r}` }).join(' ')
  return <polygon points={pts} fill={c} stroke="#FFF8EE" strokeWidth={0.6} strokeLinejoin="round" />
}
export function Stars({ th, t, pulse = 0, alpha = 1, count = 140 }) {
  return (
    <g opacity={alpha}>
      {STAR_FIELD.slice(0, count).map((st, i) => {
        const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.3 + st.p))
        const bump = st.b ? pulse * 0.9 : 0
        return (
          <g key={i} transform={`translate(${st.x} ${st.y}) scale(${st.s * (1 + bump * 0.6)})`} opacity={clamp(tw + bump)}>
            <StarShape th={th} s={0.8} />
          </g>
        )
      })}
    </g>
  )
}

/* ---------- 月亮/太阳 ---------- */
export function Moon({ th, x, y, r, glow = 0.5, color }) {
  const c = color || th.moon
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r * (1.9 + glow)} fill={c} opacity={0.06 + glow * 0.06} />
      <circle r={r * 1.35} fill={c} opacity={0.12 + glow * 0.08} />
      {th.id === 'pixel'
        ? <PixelDisc r={r} c={c} />
        : th.id === 'neon'
          ? <circle r={r} fill="none" stroke={c} strokeWidth={6} filter="url(#softGlow)" />
          : <circle r={r} fill={c} filter="url(#paperShadowBig)" />}
      {th.id !== 'neon' && <g fill={mix(c, '#000000', 0.12)}>
        <circle cx={-r * 0.3} cy={-r * 0.15} r={r * 0.16} /><circle cx={r * 0.25} cy={r * 0.25} r={r * 0.11} /><circle cx={r * 0.1} cy={-r * 0.4} r={r * 0.07} />
      </g>}
    </g>
  )
}
export function PixelDisc({ r, c, step = 12 }) {
  const out = []
  for (let y = -r; y < r; y += step) for (let x = -r; x < r; x += step) {
    if ((x + step / 2) ** 2 + (y + step / 2) ** 2 <= r * r) out.push(<rect key={x + '_' + y} x={x} y={y} width={step + 0.6} height={step + 0.6} fill={c} />)
  }
  return <g>{out}</g>
}

/* ---------- 爱心 ---------- */
const HEART_BMP = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000']
export function Heart({ th, size = 100, color, stroke }) {
  const c = color || th.heart
  if (th.id === 'pixel') {
    const s = size / 7
    return <g transform={`translate(${-size / 2} ${-size * 0.45})`}>{HEART_BMP.flatMap((row, y) => [...row].map((v, x) => v === '1' ? <rect key={x + '-' + y} x={x * s} y={y * s} width={s + 0.5} height={s + 0.5} fill={c} /> : null))}</g>
  }
  const s = size / 100
  const d = 'M0,30 C-10,20 -50,0 -50,-25 C-50,-45 -30,-55 -15,-50 C-5,-47 0,-38 0,-35 C0,-38 5,-47 15,-50 C30,-55 50,-45 50,-25 C50,0 10,20 0,30 Z'
  if (th.id === 'neon') return <path d={d} transform={`scale(${s})`} fill="none" stroke={c} strokeWidth={4 / s} filter="url(#softGlow)" />
  return <path d={d} transform={`scale(${s})`} fill={c} stroke={stroke || '#FFF8EE'} strokeWidth={3 / s} strokeLinejoin="round" filter="url(#paperShadowBig)" />
}

/* ---------- 山丘 / 地面 ---------- */
export function Hills({ th, y = 1500, color, amp = 60, seed = 3, off = 0 }) {
  const r = rng(seed)
  const pts = Array.from({ length: 9 }, (_, i) => [i * (W + 400) / 8 - 200 + off, y - r() * amp])
  let d = `M-300,${H + 300} L${pts[0][0] - 100},${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]
    d += th.id === 'pixel' ? ` L${x0 + (x1 - x0) / 2},${y0} L${x0 + (x1 - x0) / 2},${y1} L${x1},${y1}` : ` Q${(x0 + x1) / 2},${Math.min(y0, y1) - amp * 0.4} ${x1},${y1}`
  }
  d += ` L${W + 300},${H + 300} Z`
  return <path d={d} fill={color || th.ground} stroke={th.id === 'neon' ? th.accent : th.id === 'paper' ? '#FFF8EE' : 'none'} strokeWidth={th.id === 'neon' ? 2 : 4} strokeOpacity={th.id === 'neon' ? 0.5 : 1} filter={th.id === 'paper' ? 'url(#paperShadowBig)' : undefined} />
}

/* ---------- 城市天际线 ---------- */
const CITY = (() => { const r = rng(11); let x = -40; const b = []; while (x < W + 40) { const w = 50 + r() * 90, h = 120 + r() * 360; b.push({ x, w, h, win: Array.from({ length: 24 }, () => r()) }); x += w + 4 } return b })()
export function Skyline({ th, y = 1450, t = 0, beatI = 0, lit = 0.5, color }) {
  const c = color || th.ground
  return (
    <g>
      {CITY.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={y - b.h} width={b.w} height={b.h + 600} fill={th.id === 'neon' ? '#07050F' : c}
            stroke={th.id === 'neon' ? (i % 3 ? '#3A2B7A' : th.accent) : th.id === 'paper' ? '#FFF8EE' : 'none'} strokeWidth={th.id === 'neon' ? 1.5 : 3} />
          {b.win.map((v, j) => {
            const cols = Math.max(2, Math.floor(b.w / 26)), cx = j % cols, cy = Math.floor(j / cols)
            const on = ((v * 97 + beatI * (v > 0.5 ? 1 : 0)) % 1) < lit
            if (cy * 34 + 30 > b.h - 20) return null
            return on ? <rect key={j} x={b.x + 10 + cx * 24} y={y - b.h + 22 + cy * 34} width={10} height={14} fill={th.id === 'neon' ? (v > 0.7 ? '#FF4FA0' : '#7CF7FF') : '#FFD98A'} opacity={0.85} /> : null
          })}
        </g>
      ))}
    </g>
  )
}

/* ---------- 全局滤镜 ---------- */
export function KitDefs() {
  return (
    <>
      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="bigGlow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="22" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="paperShadowBig" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#2A1838" floodOpacity="0.35" />
      </filter>
      <pattern id="grain" width="160" height="160" patternUnits="userSpaceOnUse">
        <image href={GRAIN} width="160" height="160" />
      </pattern>
      <pattern id="scan" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="3" fill="#000" opacity="0.22" />
      </pattern>
    </>
  )
}

/* ---------- 风格化后期层 ---------- */
export function PostFX({ th, t, flash = 0, vignette = 1 }) {
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={th.id === 'paper' ? 0.35 : 0.65} />
        </radialGradient>
      </defs>
      {th.id === 'paper' && <rect width={W} height={H} fill="url(#grain)" />}
      {th.id === 'pixel' && <rect width={W} height={H} fill="url(#scan)" opacity={0.5} />}
      <rect width={W} height={H} fill="url(#vig)" opacity={vignette} />
      {flash > 0 && <rect width={W} height={H} fill={th.id === 'neon' ? '#B98CFF' : '#FFF4D6'} opacity={flash} style={{ mixBlendMode: 'screen' }} />}
    </g>
  )
}

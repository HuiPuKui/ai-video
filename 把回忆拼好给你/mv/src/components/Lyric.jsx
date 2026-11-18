import React from 'react'
import { W, clamp, E, prog } from '../engine'
import { lineAt } from '../data/lyrics'

/** 卡拉OK逐字填色 + 入场/出场动效，三种风格各自的字幕语言 */
export function Lyric({ th, t, pulse }) {
  const L = lineAt(t)
  if (!L) return null
  const chars = [...L.text]
  const dur = L.t1 - L.t0
  const sing = clamp((t - L.t0) / (dur * 0.86))
  const inK = E.out(prog(t, L.t0, L.t0 + 0.35))
  const outK = prog(t, L.t1 - 0.25, L.t1)
  const S = th.lyric
  const size = chars.length > 13 ? S.size * 0.86 : S.size
  const adv = size + S.track
  const total = adv * chars.length
  const x0 = (W - total) / 2 + adv / 2
  const y = 1640
  const filled = sing * chars.length

  return (
    <g opacity={inK * (1 - outK)} style={{ fontFamily: th.font }}>
      {th.id === 'paper' && (
        <g transform={`translate(${W / 2} ${y - size * 0.32}) rotate(${-1.2 + (L.t0 % 2)})`} filter="url(#paperShadowBig)">
          <rect x={-total / 2 - 46} y={-size * 0.82} width={total + 92} height={size * 1.62} fill={S.strip} />
          <rect x={-total / 2 - 70} y={-size * 0.95} width={110} height={34} fill="#F2C46B" opacity={0.75} transform="rotate(-8)" />
        </g>
      )}
      {th.id === 'pixel' && (
        <g>
          <rect x={x0 - adv / 2 - 30} y={y - size - 18} width={total + 60} height={size + 46} fill="#0B0820" opacity={0.78} />
          <rect x={x0 - adv / 2 - 30} y={y - size - 18} width={total + 60} height={size + 46} fill="none" stroke={th.ink} strokeWidth={6} />
          <rect x={x0 - adv / 2 - 30} y={y + 18} width={(total + 60) * sing} height={10} fill={th.accent} />
        </g>
      )}
      {chars.map((c, i) => {
        const k = clamp(filled - i)
        const on = k > 0
        const pop = th.id === 'paper' ? 0 : clamp(1 - (filled - i)) * (k > 0 ? 1 : 0)
        const enter = E.back(clamp(inK * 1.6 - i * 0.04))
        const dy = th.id === 'pixel' ? Math.round((1 - enter) * 40 / 6) * 6 : (1 - enter) * 50
        const lift = on ? pop * (th.id === 'pixel' ? 12 : 8) : 0
        const rot = th.id === 'paper' ? ((i * 37) % 7 - 3) * 0.9 : 0
        return (
          <g key={i} transform={`translate(${x0 + i * adv} ${y + dy - lift}) rotate(${rot})`}>
            {th.id === 'neon' && on && (
              <text textAnchor="middle" fontSize={size} fontWeight={S.weight} fill={th.accent} filter="url(#softGlow)" opacity={0.9}>{c}</text>
            )}
            {th.id === 'pixel' && (
              <text x={6} y={6} textAnchor="middle" fontSize={size} fontWeight={S.weight} fill="#000" opacity={0.6}>{c}</text>
            )}
            <text textAnchor="middle" fontSize={size} fontWeight={S.weight}
              fill={on ? (th.id === 'paper' ? (k >= 1 ? '#3A2C3E' : '#9C6B8E') : th.ink) : th.inkDim}>{c}</text>
          </g>
        )
      })}
    </g>
  )
}

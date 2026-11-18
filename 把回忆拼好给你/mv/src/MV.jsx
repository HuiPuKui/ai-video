import React from 'react'
import { W, H, beat, prog, E } from './engine'
import { THEMES } from './themes'
import { ClawdDefs } from './components/Clawd'
import { KitDefs, PostFX } from './components/Kit'
import { ShotLayer, shotAt } from './components/Scenes'
import { Lyric } from './components/Lyric'

/** 一帧完整画面：纯函数 (theme, t) → SVG，可实时播放，也可逐帧离线渲染 */
export function MVFrame({ theme = 'pixel', t = 0, width = '100%' }) {
  const th = THEMES[theme]
  const b = beat(t)
  const s = shotAt(t)
  const cut = s.t0 > 0 ? 1 - prog(t, s.t0, s.t0 + 0.18) : 0
  const fadeIn = prog(t, 0, 0.5), fadeOut = 1 - prog(t, 58, 59)
  const shake = th.id === 'pixel' ? 0 : 0
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} style={{ display: 'block', background: '#000' }} xmlns="http://www.w3.org/2000/svg">
      <defs><ClawdDefs /><KitDefs /><clipPath id="frame"><rect width={W} height={H} /></clipPath></defs>
      <g clipPath="url(#frame)">
        <g opacity={fadeIn * fadeOut} transform={`translate(${shake} 0)`}>
          <ShotLayer th={th} t={t} />
          <Lyric th={th} t={t} pulse={b.pulse} />
        </g>
        <PostFX th={th} t={t} flash={cut * (th.id === 'neon' ? 0.35 : 0.18)} />
      </g>
    </svg>
  )
}

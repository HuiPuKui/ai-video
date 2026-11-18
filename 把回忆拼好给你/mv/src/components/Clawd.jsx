import React from 'react'
import { mix } from '../engine'

/**
 * Clawd —— 像素小方怪。坐标原点 = 双脚中点（地面），单位 u 像素。
 * kind: 'he'(红·男) | 'she'(粉·女)
 * look: 'pixel' | 'paper' | 'neon'
 * pose: { squash, hop, lean, dir, eyeX, eyeY, blink, armL, armR, step, blush, mood:'normal'|'sad'|'love'|'happy', alpha }
 */
export const PALETTE = {
  he: { body: '#E8553E', light: '#FF8A6B', dark: '#B43A2A', acc: '#FFD7C9' },
  she: { body: '#F49AB8', light: '#FFC6D9', dark: '#CF6C91', acc: '#D6336C' },
}

export function Clawd({ x, y, u = 14, kind = 'he', look = 'pixel', pose = {}, id = kind }) {
  const P = PALETTE[kind]
  const {
    squash = 0, hop = 0, lean = 0, dir = 1, eyeX = 0, eyeY = 0, blink = 0,
    armL = 0, armR = 0, step = 0, blush = 0, mood = 'normal', alpha = 1, glow = 1,
  } = pose
  const sy = 1 - squash, sx = 1 + squash * 0.6
  const legLift = i => (step ? Math.max(0, Math.sin(step * Math.PI * 2 + (i % 2) * Math.PI)) * 0.8 : 0)
  const neon = look === 'neon'
  const paper = look === 'paper'
  const fill = neon ? mix(P.dark, '#000000', 0.55) : P.body
  const stroke = neon ? P.light : paper ? '#FFF8EE' : 'none'
  const sw = neon ? 0.28 : paper ? 0.55 : 0
  const R = (props) => <rect {...props} fill={props.fill ?? fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />

  const eyeH = blink ? 0.25 : mood === 'sad' ? 1.2 : mood === 'happy' ? 0.6 : 2
  const eyeTop = -8.1 + (2 - eyeH) * (mood === 'sad' ? 1 : 0.5) + eyeY
  const eyes = mood === 'love'
    ? [-2.6, 2.6].map((ex, i) => (
        <g key={i} transform={`translate(${ex + eyeX} ${-7.3 + eyeY})`} fill={neon ? '#FF5E8A' : '#E0244F'}>
          <rect x={-0.9} y={-0.9} width={0.8} height={0.8} /><rect x={0.1} y={-0.9} width={0.8} height={0.8} />
          <rect x={-0.9} y={-0.2} width={1.8} height={0.7} /><rect x={-0.5} y={0.4} width={1} height={0.6} />
        </g>))
    : [-2.6, 2.6].map((ex, i) => (
        <rect key={i} x={ex - 0.5 + eyeX} y={eyeTop} width={1} height={eyeH}
          fill={neon ? '#FFFFFF' : '#1A1420'} />))

  return (
    <g transform={`translate(${x} ${y - hop}) rotate(${lean}) scale(${u * dir * sx} ${u * sy})`} opacity={alpha}>
      {paper && <ellipse cx={0} cy={0.25} rx={7} ry={0.9} fill="#000" opacity={0.18} />}
      {!paper && !neon && <ellipse cx={0} cy={0.15} rx={6.5} ry={0.6} fill="#000" opacity={0.25} />}
      <g filter={neon ? `url(#neonGlow-${kind})` : paper ? 'url(#paperShadow)' : undefined}>
        {/* legs */}
        {[-4.6, -2.6, 1.6, 3.6].map((lx, i) => (
          <R key={i} x={lx} y={-2.2 - legLift(i)} width={1} height={2.2} fill={neon ? fill : P.dark} />
        ))}
        {/* arms */}
        <R x={-7.6} y={-5.6 - armL * 2.2} width={1.8} height={1.8} />
        <R x={5.8} y={-5.6 - armR * 2.2} width={1.8} height={1.8} />
        {/* body */}
        <R x={-6} y={-9} width={12} height={7} rx={paper ? 0.6 : 0} />
        {!neon && <>
          <rect x={-6} y={-3} width={12} height={1} fill={P.dark} opacity={0.55} />
          <rect x={-5} y={-8.6} width={3.2} height={0.7} fill={P.light} opacity={0.9} />
          <rect x={-5.4} y={-8.6} width={0.7} height={1.6} fill={P.light} opacity={0.9} />
        </>}
        {/* bow for her */}
        {kind === 'she' && (
          <g transform="translate(3.4 -9.4)">
            <R x={-1.9} y={-1.1} width={1.6} height={2} fill={neon ? fill : P.acc} />
            <R x={0.3} y={-1.1} width={1.6} height={2} fill={neon ? fill : P.acc} />
            <R x={-0.45} y={-0.6} width={0.9} height={1} fill={neon ? fill : mix(P.acc, '#ffffff', 0.25)} />
          </g>
        )}
        {/* antenna sprout for him */}
        {kind === 'he' && (
          <g transform="translate(-3.6 -9)">
            <R x={-0.35} y={-1.4} width={0.7} height={1.4} fill={neon ? fill : P.dark} />
            <R x={-0.8} y={-2.3} width={1.6} height={1} fill={neon ? fill : '#FFC94A'} />
          </g>
        )}
        {eyes}
        {blush > 0 && [-4.2, 3.1].map((bx, i) => (
          <rect key={i} x={bx} y={-5.6} width={1.1} height={0.6} fill="#FF4F7A" opacity={0.75 * blush} />
        ))}
      </g>
    </g>
  )
}

/** 每种风格共用的 SVG defs（滤镜） */
export function ClawdDefs() {
  return (
    <>
      <filter id="paperShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0.5" stdDeviation="0.35" floodColor="#3A2340" floodOpacity="0.35" />
      </filter>
      {['he', 'she'].map(k => (
        <filter key={k} id={`neonGlow-${k}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="b1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="b2" />
          <feMerge><feMergeNode in="b2" /><feMergeNode in="b1" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      ))}
    </>
  )
}

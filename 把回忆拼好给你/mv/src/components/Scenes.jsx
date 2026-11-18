import React from 'react'
import { W, H, clamp, lerp, prog, E, rng, beat, beatsIn, mix } from '../engine'
import { Clawd } from './Clawd'
import { Sky, Stars, Moon, Heart, Hills, Skyline, StarShape, PixelDisc } from './Kit'

/* ===================================================================
 *  分镜（Storyboard）—— 与歌词一一对应，所有运动都挂在拍点上
 * =================================================================== */
export const SHOTS = [
  { id: 'title', t0: 0, t1: 1.5, name: '片头 · 拼图归位' },
  { id: 'city', t0: 1.5, t1: 5, name: '渺小 · 城市与两颗小点' },
  { id: 'globe', t0: 5, t1: 8, name: '小世界 · 玻璃球里的他' },
  { id: 'meet', t0: 8, t1: 11.5, name: '遇见 · 月亮升起' },
  { id: 'eyeSea', t0: 11.5, t1: 15.5, name: '眼中大海 · 一叶小舟' },
  { id: 'polaroid', t0: 15.5, t1: 19, name: '不可取代 · 拍立得' },
  { id: 'bench', t0: 19, t1: 22.5, name: '灰暗日子 · 长椅发呆' },
  { id: 'clouds', t0: 22.5, t1: 25.5, name: '拨开阴霾' },
  { id: 'jar', t0: 25.5, t1: 28, name: '收集快乐 · 星星罐' },
  { id: 'bubbles', t0: 28, t1: 31.5, name: '情话 · 爱心气泡' },
  { id: 'fireworks', t0: 31.5, t1: 35, name: '烟花 · 卡点连爆' },
  { id: 'freeze', t0: 35, t1: 38, name: '一刹那 · 时间冻结' },
  { id: 'sink', t0: 38, t1: 42, name: '无法自拔 · 沉入水面' },
  { id: 'split', t0: 42, t1: 45, name: '时差 · 日夜分屏' },
  { id: 'balloon', t0: 45, t1: 48.5, name: '放下 · 心形气球' },
  { id: 'heart', t0: 48.5, t1: 52.5, name: '炙热 · 心跳' },
  { id: 'outro', t0: 52.5, t1: 59, name: '尾声 · 把回忆拼好给你' },
]
export const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1]

/* 每拍一跳：hop 0→h→0 */
const hopOn = (b, h = 18, every = 1) => (b.i % every === 0 ? Math.sin(b.phase * Math.PI) * h : 0)
const squashOn = b => b.pulse * 0.12
const blinkAt = (t, seed = 0) => ((t + seed) % 3.1) < 0.12 ? 1 : 0

/* 基础姿态 */
function pose(t, b, extra = {}) {
  return { squash: squashOn(b), hop: hopOn(b, 14, 2), blink: blinkAt(t, extra.seed || 0), ...extra }
}

/* ---------- 镜头 ---------- */
function Cam({ zoom = 1, x = W / 2, y = H / 2, rot = 0, shake = 0, children }) {
  return <g transform={`translate(${W / 2 + shake} ${H / 2}) rotate(${rot}) scale(${zoom}) translate(${-x} ${-y})`}>{children}</g>
}

/* =================================================================== */
function Title({ th, t, b }) {
  const k = prog(t, 0, 1.3)
  const r = rng(5)
  const pieces = Array.from({ length: 12 }, (_, i) => ({ c: i % 4, r: Math.floor(i / 4), dx: (r() - 0.5) * 900, dy: (r() - 0.5) * 1200, rot: (r() - 0.5) * 120 }))
  const pw = 180, ph = 180
  return (
    <>
      <Sky th={th} a="deep" />
      <Stars th={th} t={t} pulse={b.pulse} alpha={0.6} />
      <g transform={`translate(${W / 2 - pw * 2} ${H / 2 - ph * 1.5 - 120})`}>
        {pieces.map((p, i) => {
          const kk = E.out(clamp(k * 1.4 - i * 0.03))
          return (
            <g key={i} transform={`translate(${p.c * pw + p.dx * (1 - kk)} ${p.r * ph + p.dy * (1 - kk)}) rotate(${p.rot * (1 - kk)} ${pw / 2} ${ph / 2})`} opacity={kk}>
              <rect width={pw - 6} height={ph - 6} rx={th.id === 'paper' ? 10 : 0}
                fill={th.id === 'neon' ? 'none' : mix(th.sky.dawn[0], th.sky.rose[1], (i % 4) / 4 * 0.6 + p.r * 0.1)}
                stroke={th.id === 'neon' ? (i % 2 ? th.accent : th.heart) : th.id === 'paper' ? '#FFF8EE' : '#0B0820'} strokeWidth={th.id === 'neon' ? 3 : 8}
                filter={th.id === 'neon' ? 'url(#softGlow)' : th.id === 'paper' ? 'url(#paperShadowBig)' : undefined} />
            </g>
          )
        })}
        <g opacity={prog(t, 0.7, 1.2)}>
          <Clawd x={pw * 1.3} y={ph * 2.3} u={16} kind="he" look={th.look} pose={pose(t, b, { dir: 1 })} />
          <Clawd x={pw * 2.7} y={ph * 2.3} u={16} kind="she" look={th.look} pose={pose(t, b, { dir: -1, seed: 1 })} />
        </g>
      </g>
      <TitleText th={th} t={t} y={H / 2 + 420} k={prog(t, 0.3, 1.1)} />
    </>
  )
}
export function TitleText({ th, t, y, k, sub = true }) {
  const txt = '把回忆拼好给你'
  return (
    <g style={{ fontFamily: th.font }} opacity={k}>
      {[...txt].map((c, i) => {
        const kk = E.back(clamp(k * 1.8 - i * 0.1))
        return <text key={i} x={W / 2 + (i - 3) * 112} y={y + (1 - kk) * 60} textAnchor="middle" fontSize={96} fontWeight={800}
          fill={th.id === 'paper' ? '#FFF8EE' : th.ink} stroke={th.id === 'paper' ? '#3A2C3E' : 'none'} strokeWidth={th.id === 'paper' ? 10 : 0} paintOrder="stroke"
          filter={th.id === 'neon' ? 'url(#softGlow)' : undefined}>{c}</text>
      })}
      {sub && <text x={W / 2} y={y + 80} textAnchor="middle" fontSize={30} letterSpacing={14} fill={th.ink} opacity={0.6}>{th.en} · CLAWD MV</text>}
    </g>
  )
}

/* =================================================================== */
function City({ th, t, b, s }) {
  const k = prog(t, s.t0, s.t1)
  const zoom = lerp(1, 1.18, E.inOut(k))
  return (
    <>
      <Sky th={th} a="night" />
      <Cam zoom={zoom} y={H / 2 + 120}>
        <Stars th={th} t={t} pulse={b.pulse} />
        <Moon th={th} x={790} y={420} r={90} glow={0.4 + b.pulse * 0.4} />
        <Skyline th={th} y={1360} beatI={b.i} lit={0.35} color={th.ground2} />
        <Hills th={th} y={1420} color={th.ground} amp={50} />
        <Clawd x={500} y={1395} u={5} kind="he" look={th.look} pose={pose(t, b)} />
        <Clawd x={580} y={1395} u={5} kind="she" look={th.look} pose={pose(t, b, { dir: -1, seed: 1 })} />
      </Cam>
    </>
  )
}

/* =================================================================== */
function Globe({ th, t, b, s }) {
  const k = prog(t, s.t0, s.t1)
  const cx = W / 2, cy = 820, R = 380
  const wob = Math.sin(t * 2) * 3
  return (
    <>
      <Sky th={th} a="warm" />
      <Stars th={th} t={t} pulse={b.pulse} alpha={0.7} />
      <g transform={`translate(0 ${E.out(prog(t, s.t0, s.t0 + 0.6)) * -40 + 40}) rotate(${wob} ${cx} ${cy})`}>
        <defs><clipPath id="globeClip"><circle cx={cx} cy={cy} r={R} /></clipPath></defs>
        <circle cx={cx} cy={cy} r={R} fill={th.sky.night[0]} opacity={0.9} />
        <g clipPath="url(#globeClip)">
          <Stars th={th} t={t + 3} pulse={b.pulse} count={50} />
          <Hills th={th} y={cy + 160} color={th.sea[0]} amp={40} seed={9} off={Math.sin(t) * 30} />
          <Hills th={th} y={cy + 230} color={th.ground2} amp={30} seed={4} />
          <g transform={`translate(${cx + 90} ${cy + 140})`}>
            <rect x={-8} y={-120} width={16} height={120} fill={th.id === 'neon' ? 'none' : th.ground} stroke={th.id === 'neon' ? th.accent : 'none'} strokeWidth={2} />
            <circle cy={-160} r={60 + b.pulse * 6} fill={th.id === 'neon' ? 'none' : th.sea[1]} stroke={th.id === 'neon' ? th.sea[0] : th.id === 'paper' ? '#FFF8EE' : 'none'} strokeWidth={4} filter={th.id === 'neon' ? 'url(#softGlow)' : undefined} />
          </g>
          <Clawd x={cx - 80} y={cy + 150} u={9} kind="he" look={th.look} pose={pose(t, b, { mood: 'sad', eyeY: 0.6, lean: -3 })} />
          {/* 祈愿的小流星 */}
          {beatsIn(s.t0, s.t1).filter((_, i) => i % 2 === 0).map((bt, i) => {
            const kk = prog(t, bt, bt + 0.8)
            if (kk <= 0 || kk >= 1) return null
            return <g key={i} transform={`translate(${cx - 260 + i * 90 + kk * 200} ${cy - 250 + kk * 120})`} opacity={1 - kk}>
              <line x1={-80} y1={-48} x2={0} y2={0} stroke={th.accent} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
              <StarShape th={th} s={1.4} color={th.accent} />
            </g>
          })}
        </g>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={th.id === 'neon' ? th.accent : '#FFF8EE'} strokeWidth={th.id === 'pixel' ? 10 : 6} opacity={0.9} filter={th.id === 'neon' ? 'url(#softGlow)' : undefined} />
        <path d={`M${cx - R * 0.6},${cy - R * 0.55} A${R * 0.85},${R * 0.85} 0 0 1 ${cx - R * 0.1},${cy - R * 0.82}`} stroke="#FFFFFF" strokeWidth={14} fill="none" opacity={0.35} strokeLinecap="round" />
        <rect x={cx - 220} y={cy + R - 20} width={440} height={70} rx={th.id === 'pixel' ? 0 : 20} fill={th.id === 'neon' ? '#0B0418' : th.ground} stroke={th.id === 'neon' ? th.heart : th.id === 'paper' ? '#FFF8EE' : 'none'} strokeWidth={4} />
      </g>
    </>
  )
}

/* =================================================================== */
function Meet({ th, t, b, s }) {
  const k = prog(t, s.t0, s.t1)
  const rise = E.out(prog(t, s.t0, s.t0 + 2.4))
  const burst = prog(t, 10.0, 11.4) // “光明起来”
  const sheX = lerp(W + 120, 600, E.out(prog(t, s.t0 + 0.2, s.t0 + 1.8)))
  const step = prog(t, s.t0 + 0.2, s.t0 + 1.8) < 1 ? t * 2.4 : 0
  return (
    <>
      <Sky th={th} a="night" b="dawn" k={E.inOut(k)} id="skyMeet" />
      <Stars th={th} t={t} pulse={b.pulse} alpha={1 - k * 0.6} />
      <Moon th={th} x={W / 2} y={lerp(1300, 760, rise)} r={150 + burst * 40} glow={0.5 + burst + b.pulse * 0.3} />
      {burst > 0 && Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + t * 0.2
        const r0 = 220, r1 = 220 + E.out(burst) * 600
        return <line key={i} x1={W / 2 + Math.cos(a) * r0} y1={760 + Math.sin(a) * r0} x2={W / 2 + Math.cos(a) * r1} y2={760 + Math.sin(a) * r1}
          stroke={th.moon} strokeWidth={th.id === 'pixel' ? 12 : 6} opacity={(1 - burst) * 0.8} strokeLinecap={th.id === 'pixel' ? 'butt' : 'round'} />
      })}
      <Hills th={th} y={1260} color={th.ground2} amp={70} seed={21} />
      <Hills th={th} y={1360} color={th.ground} amp={30} seed={2} />
      <Clawd x={440} y={1340} u={11} kind="he" look={th.look} pose={pose(t, b, { eyeX: 1, blush: burst, mood: burst > 0.2 ? 'happy' : 'normal' })} />
      <Clawd x={sheX} y={1340} u={11} kind="she" look={th.look} pose={{ ...pose(t, b, { dir: -1, seed: 1 }), step, hop: step ? Math.abs(Math.sin(t * 9)) * 10 : hopOn(b, 14, 2), blush: burst }} />
    </>
  )
}

/* =================================================================== */
function EyeSea({ th, t, b, s }) {
  const k = prog(t, s.t0, s.t1)
  const open = E.out(prog(t, s.t0, s.t0 + 0.9))
  const cx = W / 2, cy = 860, ew = 480, eh = 260 * open
  const zoom = lerp(1, 1.35, E.in(prog(t, 13.5, 15.5)))
  return (
    <>
      <Sky th={th} a="sea" />
      <Stars th={th} t={t} pulse={b.pulse} alpha={0.5} />
      <Cam zoom={zoom} y={cy}>
        <defs><clipPath id="eyeClip"><path d={`M${cx - ew},${cy} Q${cx},${cy - eh * 2} ${cx + ew},${cy} Q${cx},${cy + eh * 2} ${cx - ew},${cy} Z`} /></clipPath></defs>
        {/* 睫毛按拍弹动 */}
        {Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI + (i + 1) / 10 * Math.PI
          const px = cx + Math.cos(a) * ew * 0.95, py = cy - eh * 1.05 + Math.sin(a) * -eh * 0.05 - 10
          const L = 60 + b.pulse * 24
          return <line key={i} x1={px} y1={py + 10} x2={px + Math.cos(a) * L * 0.4} y2={py - L} stroke={th.id === 'neon' ? th.accent : th.ink === '#3A2C3E' ? '#FFF8EE' : th.ink} strokeWidth={th.id === 'pixel' ? 10 : 6} strokeLinecap={th.id === 'pixel' ? 'butt' : 'round'} opacity={open} />
        })}
        <g clipPath="url(#eyeClip)">
          <rect x={0} y={cy - 400} width={W} height={800} fill={th.sky.dawn[1]} />
          <Moon th={th} x={cx + 160} y={cy - 110} r={60} glow={0.3} />
          {[0, 1, 2].map(l => {
            const yy = cy - 30 + l * 70
            let d = `M${cx - ew - 60},${yy}`
            for (let x = -ew - 60; x <= ew + 60; x += 40) d += ` L${cx + x},${yy + Math.sin(x / 70 + t * (2 + l) + l) * (10 + b.pulse * 12)}`
            d += ` L${cx + ew + 60},${cy + 400} L${cx - ew - 60},${cy + 400} Z`
            return <path key={l} d={d} fill={th.id === 'neon' ? '#020A14' : th.sea[l]} stroke={th.id === 'neon' ? th.sea[l] : 'none'} strokeWidth={4} opacity={th.id === 'neon' ? 1 : 0.92} filter={th.id === 'neon' ? 'url(#softGlow)' : undefined} />
          })}
          {/* 小舟上的两只 */}
          <g transform={`translate(${cx - 120 + k * 200} ${cy - 10 + Math.sin(t * 3) * 8}) rotate(${Math.sin(t * 2.4) * 4})`}>
            <Clawd x={-34} y={-6} u={4.2} kind="he" look={th.look} pose={pose(t, b)} />
            <Clawd x={34} y={-6} u={4.2} kind="she" look={th.look} pose={pose(t, b, { dir: -1, seed: 1 })} />
            <path d="M-90,-6 L90,-6 L60,30 L-60,30 Z" fill={th.id === 'neon' ? '#000' : '#FFF8EE'} stroke={th.id === 'neon' ? th.heart : '#3A2C3E'} strokeWidth={th.id === 'neon' ? 3 : 4} filter={th.id === 'neon' ? 'url(#softGlow)' : undefined} />
          </g>
        </g>
        <path d={`M${cx - ew},${cy} Q${cx},${cy - eh * 2} ${cx + ew},${cy} Q${cx},${cy + eh * 2} ${cx - ew},${cy} Z`} fill="none" stroke={th.id === 'neon' ? th.accent : th.id === 'paper' ? '#FFF8EE' : th.ink} strokeWidth={th.id === 'pixel' ? 12 : 8} filter={th.id === 'neon' ? 'url(#softGlow)' : undefined} />
      </Cam>
    </>
  )
}

/* =================================================================== */
function Polaroid({ th, t, b, s }) {
  const bts = beatsIn(s.t0 - 0.1, s.t1)
  const r = rng(31)
  const frames = bts.slice(0, 7).map((bt, i) => ({ bt, x: 140 + r() * 800, y: 250 + r() * 1100, rot: (r() - 0.5) * 40, s: 0.45 + r() * 0.25, scene: i % 3 }))
  const main = E.back(prog(t, s.t0 + 0.2, s.t0 + 1.0))
  return (
    <>
      <Sky th={th} a="warm" />
      {frames.map((f, i) => {
        const kk = E.back(prog(t, f.bt, f.bt + 0.35))
        if (kk <= 0) return null
        return <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.rot}) scale(${f.s * kk})`} opacity={0.7}>
          <PhotoCard th={th} t={t} b={b} w={360} variant={f.scene} />
        </g>
      })}
      <g transform={`translate(${W / 2} ${880}) rotate(${-4 + Math.sin(t) * 1.5}) scale(${main})`}>
        <PhotoCard th={th} t={t} b={b} w={620} caption="不可替代" variant={9} />
      </g>
    </>
  )
}
export function PhotoCard({ th, t, b, w, caption, variant = 0 }) {
  const h = w * 1.18, pad = w * 0.06, ih = w - pad * 2
  const id = 'pc' + variant + Math.round(w)
  const skyKey = ['night', 'sea', 'dawn', 'warm'][variant % 4]
  return (
    <g transform={`translate(${-w / 2} ${-h / 2})`}>
      <rect width={w} height={h} fill={th.id === 'neon' ? '#0A0614' : '#FFF8EE'} stroke={th.id === 'neon' ? th.accent : th.id === 'pixel' ? '#0B0820' : 'none'} strokeWidth={th.id === 'pixel' ? 10 : 3} filter={th.id === 'paper' ? 'url(#paperShadowBig)' : th.id === 'neon' ? 'url(#softGlow)' : undefined} />
      <defs><clipPath id={id}><rect x={pad} y={pad} width={ih} height={ih} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect x={pad} y={pad} width={ih} height={ih} fill={th.sky[skyKey][0]} />
        <rect x={pad} y={pad + ih * 0.5} width={ih} height={ih * 0.5} fill={th.sky[skyKey][1]} opacity={0.6} />
        <g transform={`translate(${pad} ${pad}) scale(${ih / 1000})`}>
          <Moon th={th} x={740} y={260} r={90} glow={0.2} />
          <rect x={0} y={800} width={1000} height={200} fill={th.ground} />
          <Clawd x={420} y={810} u={20} kind="he" look={th.look} pose={{ blush: 1, mood: 'happy' }} />
          <Clawd x={620} y={810} u={20} kind="she" look={th.look} pose={{ dir: -1, blush: 1, mood: variant === 9 ? 'love' : 'happy' }} />
        </g>
      </g>
      {caption && <text x={w / 2} y={h - pad * 1.1} textAnchor="middle" fontSize={w * 0.07} fill={th.id === 'neon' ? th.ink : '#3A2C3E'} style={{ fontFamily: th.font }} letterSpacing={8}>{caption}</text>}
    </g>
  )
}

/* =================================================================== */
function Bench({ th, t, b, s }) {
  const k = prog(t, s.t0, s.t1)
  const lean = E.inOut(prog(t, 20.2, 21.2))
  const r = rng(77)
  return (
    <>
      <Sky th={th} a="deep" />
      <Stars th={th} t={t} pulse={b.pulse * 0.4} alpha={0.5} />
      <Moon th={th} x={820} y={430} r={80} glow={0.2} />
      {/* 细雨 */}
      {Array.from({ length: 70 }, (_, i) => {
        const x = r() * W, sp = 900 + r() * 500, y = ((r() * H + t * sp) % (H + 200)) - 100
        return <line key={i} x1={x} y1={y} x2={x - 8} y2={y + 40} stroke={th.id === 'neon' ? th.accent : '#C9C3E6'} strokeWidth={th.id === 'pixel' ? 4 : 2} opacity={0.25} />
      })}
      {/* 路灯：随拍呼吸 */}
      <g transform="translate(860 1340)">
        <rect x={-6} y={-520} width={12} height={520} fill={th.id === 'neon' ? 'none' : th.ground2} stroke={th.id === 'neon' ? th.accent : 'none'} strokeWidth={2} />
        <circle cy={-540} r={26} fill={th.moon} filter="url(#softGlow)" />
        <path d={`M-26,-530 L-${180 + b.pulse * 30},0 L${180 + b.pulse * 30},0 L26,-530 Z`} fill={th.moon} opacity={0.08 + b.pulse * 0.05} />
      </g>
      <Hills th={th} y={1360} color={th.ground} amp={10} seed={5} />
      {/* 长椅 */}
      <g transform="translate(470 1340)" fill={th.id === 'neon' ? 'none' : th.ground2} stroke={th.id === 'neon' ? th.heart : th.id === 'paper' ? '#FFF8EE' : 'none'} strokeWidth={3}>
        <rect x={-230} y={-130} width={460} height={22} />
        <rect x={-230} y={-200} width={460} height={18} />
        <rect x={-200} y={-108} width={16} height={108} /><rect x={184} y={-108} width={16} height={108} />
      </g>
      <Clawd x={380} y={1210} u={9} kind="he" look={th.look} pose={{ ...pose(t, b), hop: 0, mood: 'sad', lean: lean * 10, eyeY: 0.6 }} />
      <Clawd x={560} y={1210} u={9} kind="she" look={th.look} pose={{ ...pose(t, b, { dir: -1, seed: 1 }), hop: 0, lean: -lean * 4, eyeX: -0.6 }} />
    </>
  )
}

/* =================================================================== */
function Clouds({ th, t, b, s }) {
  const push = E.inOut(prog(t, 23.3, 25.0))
  const cx = W / 2, cy = 760
  const Cloud = ({ dx, y, sc, flip }) => (
    <g transform={`translate(${cx + dx} ${y}) scale(${sc * (flip ? -1 : 1)} ${sc})`}>
      {th.id === 'pixel'
        ? [[-160, -40, 320, 80], [-100, -100, 200, 70], [-40, -140, 140, 60]].map((r, i) => <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} fill="#3A3355" />)
        : <path d="M-180,40 C-220,40 -230,-20 -180,-30 C-190,-90 -110,-110 -80,-70 C-60,-140 40,-140 60,-80 C100,-110 170,-80 160,-30 C220,-30 220,40 170,40 Z"
            fill={th.id === 'neon' ? '#0A0614' : '#4A4266'} stroke={th.id === 'neon' ? '#8F7BFF' : '#FFF8EE'} strokeWidth={th.id === 'neon' ? 3 : 6} filter={th.id === 'paper' ? 'url(#paperShadowBig)' : th.id === 'neon' ? 'url(#softGlow)' : undefined} />}
    </g>
  )
  return (
    <>
      <Sky th={th} a="deep" b="night" k={push} id="skyCloud" />
      <Stars th={th} t={t} pulse={b.pulse} alpha={push} />
      <Moon th={th} x={cx} y={cy} r={150} glow={push * 1.2 + b.pulse * 0.3} />
      <Cloud dx={-120 - push * 520} y={cy - 40} sc={1.6} />
      <Cloud dx={140 + push * 520} y={cy + 70} sc={1.5} flip />
      <Cloud dx={-60 - push * 700} y={cy + 190} sc={1.1} />
      <Hills th={th} y={1360} color={th.ground} amp={40} seed={8} />
      <Clawd x={420} y={1345} u={10} kind="he" look={th.look} pose={pose(t, b, { mood: push > 0.6 ? 'happy' : 'normal', eyeY: -0.6 })} />
      <Clawd x={640} y={1345} u={10} kind="she" look={th.look} pose={pose(t, b, { dir: -1, seed: 1, armL: push > 0 && push < 1 ? Math.abs(Math.sin(t * 9)) : 1, armR: push > 0 && push < 1 ? Math.abs(Math.cos(t * 9)) : 1, eyeY: -0.6 })} />
    </>
  )
}

/* =================================================================== */
function Jar({ th, t, b, s }) {
  const bts = beatsIn(s.t0, s.t1)
  const jx = W / 2, jy = 900
  const r = rng(41)
  const items = bts.map((bt, i) => ({ bt, good: i % 3 !== 2, sx: r() * W, a: r() }))
  const caught = items.filter(it => it.good && t > it.bt + 0.5).length
  return (
    <>
      <Sky th={th} a="sea" b="warm" k={prog(t, s.t0, s.t1)} id="skyJar" />
      <Stars th={th} t={t} pulse={b.pulse} alpha={0.6} />
      {items.map((it, i) => {
        const kk = prog(t, it.bt, it.bt + 0.5)
        if (kk <= 0) return null
        if (it.good) {
          if (kk >= 1) return null
          const x = lerp(it.sx, jx + (it.a - 0.5) * 160, E.inOut(kk)), y = lerp(-60, jy - 40, E.in(kk))
          return <g key={i} transform={`translate(${x} ${y}) rotate(${kk * 360})`}><StarShape th={th} s={3.2} color={th.accent} /></g>
        }
        const k2 = prog(t, it.bt, it.bt + 0.9)
        if (k2 >= 1) return null
        const x = lerp(jx + 240, W + 200, E.in(k2)), y = jy + 300 - Math.sin(k2 * Math.PI) * 400
        return <g key={i} transform={`translate(${x} ${y}) rotate(${k2 * 540})`} opacity={1 - k2}>
          <rect x={-34} y={-34} width={68} height={68} rx={th.id === 'pixel' ? 0 : 20} fill="#5B5670" stroke={th.id === 'neon' ? '#5B5670' : 'none'} />
          <text y={14} textAnchor="middle" fontSize={40} fill="#BDB8D0">×</text>
        </g>
      })}
      {/* 罐子 */}
      <g transform={`translate(${jx} ${jy}) scale(${1 + b.pulse * 0.03})`}>
        <rect x={-210} y={-300} width={420} height={560} rx={th.id === 'pixel' ? 0 : 50} fill={th.id === 'neon' ? '#000' : '#FFFFFF'} opacity={th.id === 'neon' ? 0.4 : 0.18} stroke={th.id === 'neon' ? th.accent : '#FFF8EE'} strokeWidth={8} filter={th.id === 'neon' ? 'url(#softGlow)' : undefined} />
        <rect x={-160} y={-350} width={320} height={60} rx={th.id === 'pixel' ? 0 : 10} fill={th.id === 'neon' ? 'none' : '#C98D5B'} stroke={th.id === 'neon' ? th.heart : 'none'} strokeWidth={4} />
        {Array.from({ length: caught * 3 }, (_, i) => {
          const rr = rng(100 + i)
          return <g key={i} transform={`translate(${(rr() - 0.5) * 340} ${230 - Math.floor(i / 6) * 50 - rr() * 30}) rotate(${rr() * 60})`} opacity={0.9}><StarShape th={th} s={2.2} color={i % 4 ? th.accent : th.moon} /></g>
        })}
        <circle r={140 + caught * 20} fill={th.accent} opacity={0.05 + caught * 0.02} filter="url(#bigGlow)" />
      </g>
      <Hills th={th} y={1360} color={th.ground} amp={20} seed={14} />
      <Clawd x={300} y={1345} u={9} kind="he" look={th.look} pose={pose(t, b, { armR: 1, mood: 'happy', hop: hopOn(b, 22, 1) })} />
      <Clawd x={780} y={1345} u={9} kind="she" look={th.look} pose={pose(t, b, { dir: -1, seed: 1, armL: b.pulse, armR: b.pulse, hop: hopOn(b, 22, 1) })} />
    </>
  )
}

/* =================================================================== */
function Bubbles({ th, t, b, s }) {
  const bts = beatsIn(s.t0, s.t1).filter((_, i) => i % 2 === 0)
  const r = rng(53)
  return (
    <>
      <Sky th={th} a="warm" b="rose" k={prog(t, s.t0, s.t1) * 0.5} id="skyBub" />
      <Stars th={th} t={t} pulse={b.pulse} alpha={0.6} />
      {bts.map((bt, i) => {
        const kk = prog(t, bt, bt + 3)
        if (kk <= 0) return null
        const pop = E.back(prog(t, bt, bt + 0.3))
        const x = 240 + r() * 600, y0 = 1050 - (i % 3) * 30
        const y = y0 - kk * 700 - i * 30
        return <g key={i} transform={`translate(${x + Math.sin(t * 2 + i) * 20} ${y}) scale(${pop})`} opacity={1 - E.in(kk)}>
          <rect x={-120} y={-60} width={240} height={120} rx={th.id === 'pixel' ? 0 : 60} fill={th.id === 'neon' ? '#0A0614' : '#FFF8EE'} stroke={th.id === 'neon' ? th.heart : th.id === 'pixel' ? '#0B0820' : 'none'} strokeWidth={th.id === 'pixel' ? 8 : 3} filter={th.id === 'paper' ? 'url(#paperShadowBig)' : th.id === 'neon' ? 'url(#softGlow)' : undefined} />
          <path d={i % 2 ? 'M-40,55 L-70,100 L-10,58 Z' : 'M40,55 L70,100 L10,58 Z'} fill={th.id === 'neon' ? '#0A0614' : '#FFF8EE'} stroke={th.id === 'neon' ? th.heart : 'none'} strokeWidth={3} />
          {[-60, 0, 60].map((hx, j) => <g key={j} transform={`translate(${hx} 0) scale(${1 + (j === b.i % 3 ? b.pulse * 0.4 : 0)})`}><Heart th={th} size={44} /></g>)}
        </g>
      })}
      <Hills th={th} y={1360} color={th.ground} amp={20} seed={15} />
      <Clawd x={420} y={1345} u={11} kind="he" look={th.look} pose={pose(t, b, { mood: 'love', blush: 1 })} />
      <Clawd x={620} y={1345} u={11} kind="she" look={th.look} pose={pose(t, b, { dir: -1, seed: 1, blush: 1, mood: 'happy' })} />
    </>
  )
}

/* =================================================================== */
const FW_COLORS = ['#FFC94A', '#FF6E9C', '#7CF7FF', '#B98CFF', '#FFFFFF']
function Firework({ th, x, y, k, seed, n = 28, R = 320, color }) {
  const r = rng(seed)
  const c = color || FW_COLORS[seed % FW_COLORS.length]
  if (k <= 0 || k >= 1) return null
  const e = E.out(k), fade = 1 - E.in(k)
  return (
    <g transform={`translate(${x} ${y})`} opacity={fade}>
      <circle r={R * 0.4 * (1 - k)} fill={c} opacity={0.5 * (1 - k)} filter="url(#bigGlow)" />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + r() * 0.1, rr = R * (0.8 + r() * 0.3) * e
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr + k * k * 80
        if (th.spark === 'square') return <rect key={i} x={px - 8} y={py - 8} width={16} height={16} fill={i % 3 ? c : '#FFFFFF'} />
        if (th.spark === 'confetti') return <rect key={i} x={px - 10} y={py - 5} width={20} height={10} fill={FW_COLORS[(i + seed) % 4]} transform={`rotate(${i * 40 + k * 300} ${px} ${py})`} />
        const tail = 0.25 * R * (1 - k)
        return <line key={i} x1={px - Math.cos(a) * tail} y1={py - Math.sin(a) * tail} x2={px} y2={py} stroke={c} strokeWidth={5} strokeLinecap="round" filter="url(#softGlow)" />
      })}
    </g>
  )
}
function Fireworks({ th, t, b, s }) {
  const bts = beatsIn(s.t0 - 0.2, s.t1)
  const r = rng(61)
  const shots = bts.map((bt, i) => ({ bt, x: 180 + r() * 720, y: 300 + r() * 600, seed: i + 3, R: 200 + r() * 220 }))
  const flash = Math.max(0, ...shots.map(sh => { const d = t - sh.bt; return d >= 0 && d < 0.15 ? (1 - d / 0.15) * 0.25 : 0 }))
  return (
    <>
      <Sky th={th} a="deep" b="night" k={0.3} id="skyFw" />
      <rect width={W} height={H} fill={th.accent} opacity={flash * 0.4} />
      <Stars th={th} t={t} pulse={b.pulse} alpha={0.4} />
      {shots.map((sh, i) => {
        const up = prog(t, sh.bt - 0.35, sh.bt)
        return <g key={i}>
          {up > 0 && up < 1 && <line x1={sh.x} y1={1350} x2={sh.x} y2={lerp(1350, sh.y, E.out(up))} stroke={FW_COLORS[sh.seed % 5]} strokeWidth={5} opacity={0.7} strokeDasharray="20 14" />}
          <Firework th={th} x={sh.x} y={sh.y} k={prog(t, sh.bt, sh.bt + 1.4)} seed={sh.seed} R={sh.R} />
        </g>
      })}
      <Skyline th={th} y={1380} beatI={b.i} lit={0.5} color={th.ground2} />
      <Hills th={th} y={1430} color={th.ground} amp={10} seed={2} />
      <Clawd x={460} y={1420} u={7} kind="he" look={th.look} pose={pose(t, b, { eyeY: -0.8, hop: hopOn(b, 16, 1) })} />
      <Clawd x={600} y={1420} u={7} kind="she" look={th.look} pose={pose(t, b, { dir: -1, seed: 1, eyeY: -0.8, hop: hopOn(b, 16, 1) })} />
    </>
  )
}

/* =================================================================== */
function Freeze({ th, t, b, s }) {
  const k = prog(t, s.t0, s.t1)
  const fwK = lerp(0.12, 0.5, E.out(prog(t, s.t0, s.t0 + 0.4))) * (1 - prog(t, s.t1 - 1.0, s.t1) * 0) // 冻结在半开
  const slow = prog(t, s.t1 - 1.2, s.t1)
  return (
    <>
      <Sky th={th} a="deep" />
      <Stars th={th} t={s.t0} pulse={0} alpha={0.4} />
      <g opacity={1 - slow}>
        <Firework th={th} x={W / 2} y={800} k={Math.min(fwK + slow * 0.45, 0.98)} seed={44} n={48} R={460} color={th.heart} />
        <Firework th={th} x={W / 2} y={800} k={Math.min(fwK * 0.8 + slow * 0.4, 0.98)} seed={45} n={30} R={280} color={th.accent} />
      </g>
      {/* 时间冻结的取景框 */}
      <g opacity={1 - slow * 0.6}>
        {[[140, 360], [940, 360], [140, 1240], [940, 1240]].map(([x, y], i) => {
          const sx = i % 2 ? -1 : 1, sy = i > 1 ? -1 : 1
          return <path key={i} d={`M${x},${y + sy * 80} L${x},${y} L${x + sx * 80},${y}`} fill="none" stroke={th.ink === '#3A2C3E' ? '#FFF8EE' : th.ink} strokeWidth={6} />
        })}
        <text x={160} y={330} fontSize={30} fill={th.id === 'paper' ? '#FFF8EE' : th.ink} style={{ fontFamily: 'monospace' }}>● REC 00:00:{String(Math.floor(35 + k * 0.01)).padStart(2, '0')}</text>
      </g>
      <Hills th={th} y={1400} color={th.ground} amp={10} seed={2} />
      <Clawd x={W / 2} y={1385} u={10} kind="he" look={th.look} pose={{ eyeY: -1, blink: 0 }} />
    </>
  )
}

/* =================================================================== */
function Sink({ th, t, b, s }) {
  const k = prog(t, s.t0, s.t1)
  const sink = E.inOut(prog(t, s.t0 + 0.5, s.t1 - 0.3))
  const wy = 1200
  return (
    <>
      <Sky th={th} a="sea" b="deep" k={k} id="skySink" />
      <Stars th={th} t={t} pulse={b.pulse * 0.3} alpha={0.4} />
      <defs><clipPath id="aboveWater"><rect x={0} y={-500} width={W} height={wy + 500} /></clipPath></defs>
      <rect x={0} y={wy} width={W} height={H} fill={th.id === 'neon' ? '#020A14' : th.sea[0]} opacity={0.95} />
      <g clipPath="url(#aboveWater)">
        <Clawd x={W / 2} y={wy + sink * 160 + 6} u={14} kind="he" look={th.look} pose={{ mood: 'sad', eyeY: 0.8, lean: Math.sin(t * 1.5) * 3 }} />
      </g>
      <g opacity={0.35} transform={`translate(0 ${wy * 2}) scale(1 -1)`}>
        <g clipPath="url(#aboveWater)"><Clawd x={W / 2} y={wy + sink * 160 + 6} u={14} kind="he" look={th.look} pose={{ mood: 'sad', eyeY: 0.8 }} /></g>
      </g>
      {/* 涟漪：每两拍一圈 */}
      {beatsIn(s.t0, s.t1).filter((_, i) => i % 2 === 0).map((bt, i) => {
        const kk = prog(t, bt, bt + 1.8)
        if (kk <= 0 || kk >= 1) return null
        return <ellipse key={i} cx={W / 2} cy={wy + 8} rx={120 + kk * 420} ry={(120 + kk * 420) * 0.12} fill="none" stroke={th.id === 'neon' ? th.sea[0] : '#FFFFFF'} strokeWidth={th.id === 'pixel' ? 8 : 4} opacity={(1 - kk) * 0.7} filter={th.id === 'neon' ? 'url(#softGlow)' : undefined} />
      })}
      <line x1={0} y1={wy} x2={W} y2={wy} stroke={th.id === 'neon' ? th.accent : '#FFFFFF'} strokeWidth={3} opacity={0.5} />
    </>
  )
}

/* =================================================================== */
function Split({ th, t, b, s }) {
  const k = prog(t, s.t0, s.t1)
  const open = E.out(prog(t, s.t0, s.t0 + 0.5))
  const sep = W / 2 + Math.sin(t * 1.4) * 14
  const hand = (sp, off) => (t * sp + off) * 360
  const Side = ({ x0, w, sky, he, clockSp, sun }) => (
    <g>
      <defs><clipPath id={'cl' + x0}><rect x={x0} y={0} width={w} height={H} /></clipPath></defs>
      <g clipPath={`url(#cl${x0})`}>
        <rect x={x0} y={0} width={w} height={H} fill={sky[1]} />
        <rect x={x0} y={0} width={w} height={H * 0.4} fill={sky[0]} opacity={0.5} />
        <Moon th={th} x={x0 + w / 2} y={430} r={70} color={sun ? '#FFE7A8' : '#DCE6FF'} glow={0.3} />
        <g transform={`translate(${x0 + w / 2} 820) scale(${open})`}>
          <circle r={130} fill={sun ? '#FFF1D6' : '#DCE6FF'} stroke={th.id === 'neon' ? (sun ? th.heart : th.accent) : th.id === 'paper' ? '#FFF8EE' : '#0B0820'} strokeWidth={8} filter={th.id === 'neon' ? 'url(#softGlow)' : th.id === 'paper' ? 'url(#paperShadowBig)' : undefined} opacity={th.id === 'neon' ? 0.15 : 1} />
          <line x1={0} y1={0} x2={0} y2={-100} stroke="#2A2238" strokeWidth={8} strokeLinecap="round" transform={`rotate(${Math.round(hand(clockSp, 0) / 6) * 6})`} />
          <line x1={0} y1={0} x2={0} y2={-60} stroke="#2A2238" strokeWidth={10} strokeLinecap="round" transform={`rotate(${hand(clockSp / 12, sun ? 0.3 : 0.8)})`} />
          <circle r={10} fill="#2A2238" />
        </g>
        <rect x={x0} y={1360} width={w} height={600} fill={th.ground} />
        <Clawd x={x0 + w / 2} y={1350} u={10} kind={he ? 'he' : 'she'} look={th.look} pose={pose(t, b, { dir: he ? 1 : -1, seed: he ? 0 : 1, eyeX: he ? 1.2 : -1.2, mood: 'sad' })} />
      </g>
    </g>
  )
  return (
    <>
      <Side x0={0} w={sep} sky={th.sky.dawn} he={false} clockSp={1} sun />
      <Side x0={sep} w={W - sep} sky={th.sky.night} he clockSp={-0.6} />
      <line x1={sep} y1={0} x2={sep} y2={H} stroke={th.id === 'neon' ? '#FFFFFF' : '#FFF8EE'} strokeWidth={6} filter={th.id === 'neon' ? 'url(#softGlow)' : undefined} />
    </>
  )
}

/* =================================================================== */
function Balloon({ th, t, b, s }) {
  const k = prog(t, s.t0, s.t1)
  const rel = 46.6
  const fly = E.in(prog(t, rel, s.t1 + 0.4))
  const hx = 560, hy = 1210
  const bx = hx + 40 + fly * 160 + Math.sin(t * 2) * 12, by = hy - 330 - fly * 1400
  return (
    <>
      <Sky th={th} a="warm" b="dawn" k={k} id="skyBal" />
      <Stars th={th} t={t} pulse={b.pulse * 0.3} alpha={0.5} />
      <path d={`M${bx},${by + 80} Q${bx - 40 * (1 - fly)},${(by + hy) / 2} ${fly > 0 ? bx - 30 : hx + 58},${fly > 0 ? by + 400 : hy - 80}`} fill="none" stroke={th.id === 'neon' ? th.ink : '#FFF8EE'} strokeWidth={3} opacity={0.8} />
      <g transform={`translate(${bx} ${by}) rotate(${Math.sin(t * 1.7) * 6}) scale(${1 + b.pulse * 0.05})`}>
        <Heart th={th} size={200} color={th.id === 'neon' ? th.heart : '#F49AB8'} />
      </g>
      <Hills th={th} y={1360} color={th.ground} amp={20} seed={16} />
      <Clawd x={hx} y={1345} u={10} kind="he" look={th.look} pose={{ ...pose(t, b), hop: 0, armR: fly > 0 ? 0.3 : 1, eyeY: -0.8 - fly * 0.4, mood: fly > 0.3 ? 'sad' : 'normal' }} />
    </>
  )
}

/* =================================================================== */
function BigHeart({ th, t, b, s }) {
  const k = prog(t, s.t0, s.t1)
  const dim = E.in(prog(t, 51.0, 52.6))
  const beatS = 1 + b.pulse * 0.16
  const c = mix(th.heart, '#3A2238', dim * 0.8)
  return (
    <>
      <Sky th={th} a="rose" b="deep" k={dim} id="skyHeart" />
      <Stars th={th} t={t} pulse={b.pulse} alpha={0.5} />
      <circle cx={W / 2} cy={760} r={380 * beatS} fill={th.heart} opacity={0.12 * (1 - dim)} filter="url(#bigGlow)" />
      {/* 心跳的冲击环 */}
      {b.since < 0.6 && <circle cx={W / 2} cy={760} r={260 + b.since * 700} fill="none" stroke={th.heart} strokeWidth={th.id === 'pixel' ? 14 : 6} opacity={(1 - b.since / 0.6) * 0.6 * (1 - dim)} />}
      <g transform={`translate(${W / 2} ${780}) scale(${beatS})`}><Heart th={th} size={520} color={c} /></g>
      <Hills th={th} y={1360} color={th.ground} amp={10} seed={17} />
      <Clawd x={W / 2} y={1345} u={11} kind="she" look={th.look} pose={{ ...pose(t, b, { seed: 1 }), hop: 0, eyeY: -0.9, mood: dim > 0.4 ? 'sad' : 'normal', squash: b.pulse * 0.08 }} />
    </>
  )
}

/* =================================================================== */
function Outro({ th, t, b, s }) {
  const k = prog(t, s.t0, s.t1)
  const asm = E.out(prog(t, s.t0, s.t0 + 2.6))
  const r = rng(9)
  const n = 4, pw = 640 / n
  return (
    <>
      <Sky th={th} a="night" b="dawn" k={k * 0.7} id="skyOut" />
      <Stars th={th} t={t} pulse={b.pulse} alpha={0.8} />
      <g transform={`translate(${W / 2} ${820})`}>
        {Array.from({ length: n * n }, (_, i) => {
          const cx = i % n, cy = Math.floor(i / n)
          const delay = r() * 0.4, dx = (r() - 0.5) * 1400, dy = (r() - 0.5) * 1800, rot = (r() - 0.5) * 180
          const kk = E.out(clamp((asm - delay) / (1 - delay)))
          const id = 'op' + i
          return (
            <g key={i} transform={`translate(${dx * (1 - kk)} ${dy * (1 - kk)}) rotate(${rot * (1 - kk)})`}>
              <defs><clipPath id={id}><rect x={-320 + cx * pw} y={-378 + cy * (756 / n)} width={pw + 0.5} height={756 / n + 0.5} /></clipPath></defs>
              <g clipPath={`url(#${id})`}><PhotoCard th={th} t={t} b={b} w={640} caption="把回忆拼好给你" variant={9} /></g>
            </g>
          )
        })}
      </g>
      <g opacity={prog(t, 55.2, 56.2) * (1 - prog(t, 58.2, 59))}>
        <text x={W / 2} y={1420} textAnchor="middle" fontSize={34} letterSpacing={12} fill={th.id === 'paper' ? '#FFF8EE' : th.ink} style={{ fontFamily: th.font }} opacity={0.8}>FOR YOU · 给你</text>
      </g>
    </>
  )
}

/* =================================================================== */
const MAP = { title: Title, city: City, globe: Globe, meet: Meet, eyeSea: EyeSea, polaroid: Polaroid, bench: Bench, clouds: Clouds, jar: Jar, bubbles: Bubbles, fireworks: Fireworks, freeze: Freeze, sink: Sink, split: Split, balloon: Balloon, heart: BigHeart, outro: Outro }

/** 转场：每个镜头开头 0.28s 用风格化方式切入 */
export function ShotLayer({ th, t }) {
  const s = shotAt(t)
  const b = beat(t)
  const C = MAP[s.id]
  const tin = prog(t, s.t0, s.t0 + 0.28)
  let tf = ''
  if (s.t0 > 0 && tin < 1) {
    if (th.id === 'pixel') { const st = Math.round((1 - tin) * 4) / 4; tf = `translate(${W / 2} ${H / 2}) scale(${1 + st * 0.12}) translate(${-W / 2} ${-H / 2})` }
    else if (th.id === 'paper') tf = `translate(${(1 - E.out(tin)) * W * 0.9} ${(1 - E.out(tin)) * 60}) rotate(${(1 - E.out(tin)) * 8} ${W / 2} ${H})`
    else tf = `translate(${W / 2} ${H / 2}) scale(${1 + (1 - E.out(tin)) * 0.25}) translate(${-W / 2} ${-H / 2})`
  }
  const prev = s.t0 > 0 && tin < 1 ? SHOTS[SHOTS.indexOf(s) - 1] : null
  return (
    <>
      {prev && <g>{React.createElement(MAP[prev.id], { th, t: Math.min(t, prev.t1 - 0.001), b, s: prev })}</g>}
      <g transform={tf}>
        {th.id === 'paper' && prev && <rect x={-30} y={-30} width={W + 60} height={H + 60} fill="#000" opacity={0.25} filter="url(#paperShadowBig)" />}
        <C th={th} t={t} b={b} s={s} />
      </g>
      {th.id === 'neon' && prev && (
        <g style={{ mixBlendMode: 'screen' }} opacity={(1 - tin) * 0.8}>
          <rect x={0} y={(t * 9000) % H} width={W} height={60} fill="#FF3D7F" />
          <rect x={0} y={(t * 6000 + 700) % H} width={W} height={24} fill="#7CF7FF" />
        </g>
      )}
    </>
  )
}

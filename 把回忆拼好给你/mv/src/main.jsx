import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MVFrame } from './MV'
import { THEMES, THEME_LIST } from './themes'
import { SHOTS, shotAt } from './components/Scenes'
import { DURATION, TEMPO } from './engine'
import './styles/app.css'

function useClock(audio) {
  const [t, setT] = useState(0)
  useEffect(() => {
    let raf
    const loop = () => { if (audio.current) setT(audio.current.currentTime); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return t
}

function App() {
  const audio = useRef(null)
  const t = useClock(audio)
  const [playing, setPlaying] = useState(false)
  const [focus, setFocus] = useState(null)
  const toggle = () => { const a = audio.current; if (a.paused) { a.play(); setPlaying(true) } else { a.pause(); setPlaying(false) } }
  const seek = v => { audio.current.currentTime = v }
  const s = shotAt(t)
  const list = focus ? [focus] : THEME_LIST
  return (
    <div className="app">
      <header>
        <h1>把回忆拼好给你 <span>· Clawd MV 方案预览</span></h1>
        <p>三套美术方向共用同一套分镜与 {TEMPO.toFixed(0)} BPM 卡点编排，点“只看这套”可放大单独查看。</p>
      </header>
      <audio ref={audio} src="./song.mp3" onEnded={() => setPlaying(false)} />
      <div className={'grid ' + (focus ? 'single' : '')}>
        {list.map(id => (
          <section key={id} className="card">
            <div className="screen"><MVFrame theme={id} t={t} /></div>
            <div className="meta">
              <b>{THEMES[id].name}</b><i>{THEMES[id].en}</i>
              <p>{THEMES[id].pitch}</p>
              <button onClick={() => setFocus(focus ? null : id)}>{focus ? '返回三屏对比' : '只看这套'}</button>
            </div>
          </section>
        ))}
      </div>
      <footer>
        <button className="play" onClick={toggle}>{playing ? '❚❚' : '▶'}</button>
        <input type="range" min={0} max={DURATION} step={0.01} value={t} onChange={e => seek(+e.target.value)} />
        <span className="time">{t.toFixed(1)}s · {s.name}</span>
      </footer>
      <div className="shots">
        {SHOTS.map(x => <button key={x.id} className={x === s ? 'on' : ''} onClick={() => seek(x.t0 + 0.01)}>{x.t0.toFixed(1)}s {x.name}</button>)}
      </div>
    </div>
  )
}
createRoot(document.getElementById('root')).render(<App />)

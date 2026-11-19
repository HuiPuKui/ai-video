import { useEffect, useRef, useState } from 'react';
import Scene01 from './scenes/Scene01.jsx';

const END = 5.26;

export default function App() {
  const audioRef = useRef(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const scrub = useRef(false);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const a = audioRef.current;
      if (a && !scrub.current) setT(a.currentTime);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const play = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.currentTime >= END - 0.05) a.currentTime = 0;
    await a.play();
    setPlaying(true);
  };
  const pause = () => { audioRef.current?.pause(); setPlaying(false); };
  const seek = (v) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = v;
    setT(v);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#050408' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <div style={{ width: 'min(100vw, calc((100vh - 72px) * 16 / 9))', aspectRatio: '16 / 9', background: '#07060a' }}>
          <Scene01 t={t} />
        </div>
      </div>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', borderTop: '1px solid #1c1820' }}>
        <button onClick={playing ? pause : play} style={btn}>{playing ? '暂停' : '播放'}</button>
        <input
          type="range" min={0} max={END} step={0.01} value={Math.min(t, END)}
          onPointerDown={() => { scrub.current = true; }}
          onPointerUp={() => { scrub.current = false; }}
          onChange={(e) => seek(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#F4A8C2' }}
        />
        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13, color: '#9a9088', width: 92 }}>
          {t.toFixed(2)} / {END.toFixed(2)}
        </span>
        <span style={{ fontSize: 12, letterSpacing: 2, color: '#6e665f' }}>方案 A · 第一句</span>
        <audio ref={audioRef} src="./song.mp3" preload="auto" onEnded={() => setPlaying(false)} />
      </div>
    </div>
  );
}

const btn = {
  background: '#F4A8C2', color: '#1a1014', border: 0, borderRadius: 4,
  padding: '7px 16px', fontSize: 13, letterSpacing: 2, cursor: 'pointer',
};

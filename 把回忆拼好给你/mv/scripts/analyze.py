"""离线生成 beatmap.json 与像素字形 glyphs.json。
用法: python3 scripts/analyze.py
"""
import json, numpy as np, librosa
from PIL import Image, ImageDraw, ImageFont

SRC = 'public/song.mp3'
FPS = 60
y, sr = librosa.load(SRC, sr=22050)
dur = len(y) / sr

# ---- 节拍：网格搜索（周期, 相位），对冲击性 onset 求最大响应 ----
hop = 128
yp = librosa.effects.percussive(y, margin=3)
o = librosa.onset.onset_strength(y=yp, sr=sr, hop_length=hop)
ot = librosa.times_like(o, sr=sr, hop_length=hop)
best = None
for P in np.arange(0.420, 0.432, 0.0001):
    for ph in np.arange(0, P, 0.002):
        bt = ph + P * np.arange(int(53 / P)); bt = bt[bt < 53]
        s = np.interp(bt, ot, o).mean()
        if best is None or s > best[0]:
            best = (s, P, ph)
_, P, ph = best
beats = [round(float(ph + P * i), 4) for i in range(int((dur - ph) / P) + 1)]
# 低频最强的相位作为小节第一拍（实测为 k=0，且与首字"我"=1.852s 重合）
S = np.abs(librosa.stft(yp, hop_length=hop)); f = librosa.fft_frequencies(sr=sr)
lo = S[f < 100].sum(0)
k = int(np.argmax([np.interp(beats[i::4], ot, lo).mean() for i in range(4)]))
bars = beats[k::4]

# ---- 能量曲线（每帧） ----
St = np.abs(librosa.stft(y, n_fft=2048, hop_length=256)); ft = librosa.fft_frequencies(sr=sr, n_fft=2048)
tt = librosa.times_like(St[0], sr=sr, hop_length=256)
def band(a, b):
    e = np.sqrt((St[(ft >= a) & (ft < b)] ** 2).sum(0))
    e = np.interp(np.arange(0, dur, 1 / FPS), tt, e)
    e = e / np.percentile(e, 99)
    return [round(float(min(v, 1.2)), 3) for v in e]

# ---- 逐字时间（Whisper 词级 + 中频人声能量峰人工校准） ----
lines = [
    {"text": "我们都是渺小真实存在", "start": 1.86, "end": 4.64,
     "chars": [1.86, 2.10, 2.34, 2.58, 2.82, 3.42, 3.66, 3.84, 4.04, 4.28]},
]

bm = {"bpm": round(60 / P, 3), "period": round(float(P), 5), "phase": round(float(ph), 4),
      "duration": round(dur, 3), "fps": FPS, "beats": beats, "bars": bars,
      "intro_onsets": [0.858, 0.968, 1.073, 1.299, 1.52],
      "lines": lines,
      "low": band(20, 150), "mid": band(500, 3000), "high": band(4000, 11000)}
json.dump(bm, open('src/data/beatmap.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('bpm', bm['bpm'], 'phase', bm['phase'], 'bars', bars[:5])

# ---- 像素字形 ----
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
def glyphs(chars, n, size):
    font = ImageFont.truetype(FONT, size, index=2)  # SC
    out = {}
    for c in chars:
        im = Image.new('L', (n * 2, n * 2), 0)
        d = ImageDraw.Draw(im)
        bb = d.textbbox((0, 0), c, font=font)
        w, h = bb[2] - bb[0], bb[3] - bb[1]
        d.text(((n - w) / 2 - bb[0], (n - h) / 2 - bb[1]), c, fill=255, font=font)
        a = np.array(im)[:n, :n] > 110
        out[c] = [[int(x), int(yy)] for yy, x in zip(*np.where(a))]
    return out
g = {"big": {"n": 22, "g": glyphs("我们都是渺小真实存在", 22, 21)},
     "small": {"n": 14, "g": glyphs("把回忆拼好给你王贰浪", 14, 14)}}
json.dump(g, open('src/data/glyphs.json', 'w'), ensure_ascii=False, separators=(',', ':'))
for c in "渺存":
    pts = set(map(tuple, g['big']['g'][c]))
    print('\n'.join(''.join('█' if (x, yy) in pts else '·' for x in range(22)) for yy in range(22)))

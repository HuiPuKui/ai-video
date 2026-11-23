"""Build the offline ocean preview with esbuild, three@0.160.1 and ffmpeg."""
from base64 import b64encode
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import subprocess
from 打包标本桌 import archive_tags, film_score

source = Path(__file__).resolve().parent
assets = source.parent
cuts = json.loads((source / '镜头字幕.json').read_text())['cuts']
duration = cuts[-1] - cuts[0]
music = assets.parents[1] / '配乐/知识大赏默认配乐.mp3'
with TemporaryDirectory() as tmp:
    clip = Path(tmp) / 'score.m4a'
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(music), '-map', '0:a:0',
                    '-t', f'{duration:.3f}', '-af',
                    f'volume=-3.9dB,afade=t=in:d=0.08,afade=t=out:st={duration - 1.1:.3f}:d=1.1',
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(clip)], check=True)
    score = b64encode(clip.read_bytes()).decode('ascii')
    full_score = film_score(music, tmp)
bundle = subprocess.check_output([
    'esbuild', str(source / '游动镜头.mjs'), '--bundle', '--format=esm',
    '--minify', '--target=es2020', '--supported:top-level-await=true',
], text=True)
model = b64encode((assets / '三维/加拿大奇虾.glb').read_bytes()).decode('ascii')
plates = []
for name in ('俯拍海床.jpg', '右侧岩壁.jpg', '侧拍岩床.jpg'):
    data = (assets / '底图' / name).read_bytes()
    plates.append('<script type="application/octet-stream" data-plate>'
                  + b64encode(data).decode('ascii') + '</script>')
html = f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>奇虾 · 当年的“虾身”，长在哪儿？</title>
<style>*{{box-sizing:border-box}}html,body{{margin:0;width:100%;height:100%;background:#071b22}}body{{display:grid;place-items:center;overflow:hidden}}canvas{{display:block;width:100%;height:100%;object-fit:contain}}
#musicToggle{{position:fixed;right:max(14px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top));width:42px;height:42px;border:1px solid #ffffff63;border-radius:50%;background:#0e201ed4;color:white;cursor:pointer;padding:9px}}
#musicToggle svg{{display:block;width:100%;height:100%}}#musicToggle:focus-visible{{outline:3px solid white;outline-offset:3px}}
#musicToggle[aria-pressed=true] .mute,#musicToggle[aria-pressed=false] .waves{{display:none}}</style>
</head><body data-ocean><canvas aria-label="奇虾从寒武纪海底到化石标本桌的横屏动画"></canvas>
<audio id="score" loop preload="auto" src="data:audio/mp4;base64,{score}"></audio>
<audio id="filmScore" loop preload="auto" src="data:audio/mp4;base64,{full_score}"></audio>
<button id="musicToggle" type="button" aria-label="开启配乐" title="开启配乐" aria-pressed="false" hidden>
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<path d="M11 5 6 9H3v6h3l5 4z"/><g class="waves"><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></g><path class="mute" d="m16 9 5 6m0-6-5 6"/></svg></button>
<script id="model" type="application/octet-stream">{model}</script>
{''.join(plates)}
{archive_tags(assets)}
<script type="module">{bundle}</script></body></html>
'''
(assets / '三维海底预览.html').write_text(html)

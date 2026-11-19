const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const os = require('node:os');

const sourcePath = path.join(__dirname, '剪纸拼贴.html');
const output = path.join(__dirname, '歌词分镜');
const source = fs.readFileSync(sourcePath, 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1];
const firstLines = vm.runInNewContext(script.match(/const LINES = (\[[\s\S]*?\n\]);/)[1]);
const rest = vm.runInNewContext(script.match(/const restLyrics = (\[[\s\S]*?\n\]);/)[1]);
const lyrics = [...firstLines.map(({ text, t }) => ({ text, start: t })), ...rest.map(([text, start]) => ({ text, start }))];
const shots = [...script.matchAll(/^shot\('([^']+)',([\d.]+),([\d.]+),/gm)].map(([, name, start, end]) => ({ name, start: +start, end: Math.min(+end, 59) }));
if (shots.length !== 41 || lyrics.length !== 15) throw new Error('源文件结构已变化，请检查镜头和歌词。');
if (fs.existsSync(output) && !process.argv.includes('--update')) throw new Error('歌词分镜目录已存在；如需重新生成，请传入 --update。');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-video-split-'));
try {
  const decoded = path.join(temp, 'source.wav');
  execFileSync('afconvert', ['-f', 'WAVE', '-d', 'LEI16', path.join(__dirname, '../资源/把回忆拼好给你.mp3'), decoded]);
  const wav = fs.readFileSync(decoded);
  let format, samples;
  for (let at = 12; at + 8 <= wav.length;) {
    const id = wav.toString('ascii', at, at + 4), size = wav.readUInt32LE(at + 4);
    if (id === 'fmt ') format = wav.subarray(at + 8, at + 8 + size);
    if (id === 'data') samples = wav.subarray(at + 8, at + 8 + size);
    at += 8 + size + (size % 2);
  }
  if (!format || !samples || format.readUInt16LE(0) !== 1) throw new Error('需要 PCM WAV 音频。');
  const rate = format.readUInt32LE(4), align = format.readUInt16LE(12);
  if (samples.length / align / rate < 59) throw new Error('音频不足 59 秒。');
  function cutAudio(start, end, destination) {
    const pcm = samples.subarray(Math.round(start * rate) * align, Math.round(end * rate) * align);
    const header = Buffer.alloc(44);
    header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
    header.writeUInt32LE(16, 16); format.copy(header, 20, 0, 16);
    header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
    fs.writeFileSync(destination, Buffer.concat([header, pcm]));
  }

  function makeHtml(start, end, title) {
    const duration = +(end - start).toFixed(6);
    const player = `/* Local audio clock; visual time stays on the original film timeline. */
const CLIP_START=${start}, CLIP_END=${end}, DURATION=${duration};
const audio=new Audio('./配乐.wav');audio.preload='auto';
const controls=document.createElement('div');controls.className='transport';
controls.innerHTML=${JSON.stringify(source.match(/controls.innerHTML=('.*');/)[1].slice(1, -1))};
document.body.appendChild(controls);
const play=document.getElementById('play'),seek=document.getElementById('seek'),timeLabel=document.getElementById('time');
seek.max=DURATION;seek.step='0.001';
let still=clamp(+(new URLSearchParams(location.search).get('t')||0),0,DURATION),frameId=0;
const clock=n=>Math.floor(n/60).toString().padStart(2,'0')+':'+(n%60).toFixed(2).padStart(5,'0');
function updateUI(){const p=!audio.paused;play.setAttribute('aria-label',p?'暂停':'播放');play.querySelector('path').setAttribute('d',p?'M8 5v14M16 5v14':'m8 5 11 7-11 7Z');document.body.classList.toggle('running',p);}
function draw(){renderFilm(CLIP_START+Math.min(still,Math.max(0,DURATION-0.0001)));seek.value=still;timeLabel.textContent=clock(still)+' / '+clock(DURATION);}
function tick(){cancelAnimationFrame(frameId);if(!audio.paused){still=Math.min(audio.currentTime,DURATION);if(still>=DURATION){audio.pause();updateUI();}}draw();if(!audio.paused)frameId=requestAnimationFrame(tick);}
async function start(){try{if(still>=DURATION)still=0;audio.currentTime=still;await audio.play();updateUI();tick();}catch(error){timeLabel.textContent='音频未能播放';console.error(error);}}
play.onclick=()=>{if(audio.paused)start();else{still=audio.currentTime;audio.pause();updateUI();tick();}};
document.getElementById('replay').onclick=()=>{still=0;start();};
seek.oninput=()=>{still=+seek.value;audio.currentTime=still;tick();};
document.getElementById('sound').onclick=e=>{audio.muted=!audio.muted;const b=e.currentTarget;b.style.opacity=audio.muted?.45:1;b.title=audio.muted?'取消静音':'静音';b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',audio.muted);};
document.getElementById('full').onclick=async()=>{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();};
document.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target.tagName!=='INPUT'&&e.target.tagName!=='BUTTON'){e.preventDefault();play.click();}});
audio.addEventListener('pause',updateUI);audio.addEventListener('ended',()=>{still=DURATION;tick();});
window.__audio=audio;window.__clip={start:CLIP_START,end:CLIP_END,duration:DURATION};
window.__render=t=>renderFilm(CLIP_START+clamp(t,0,Math.max(0,DURATION-.0001)));
tick();`;
    return source.replace(/<title>.*?<\/title>/, () => `<title>${title}</title>`)
      .replace('</style>', '.transport span{white-space:nowrap;font-variant-numeric:tabular-nums}@media(max-width:600px){.transport{display:grid;grid-template-columns:32px 32px minmax(0,1fr) 32px 32px;gap:5px;padding:8px 12px}.transport input{grid-column:1/-1;grid-row:1;width:100%;margin:0;height:22px}.transport button,.transport span{grid-row:2}.transport span{text-align:center;font-size:11px}}</style>')
      .replace(/\/\* One clock for playback,[\s\S]*?(?=<\/script>)/, () => player);
  }
  const sections = [
    { text: '前奏', start: 0, end: lyrics[0].start },
    ...lyrics.map((line, i) => ({ ...line, end: lyrics[i + 1]?.start ?? 52.5 })),
    { text: '尾奏', start: 52.5, end: 59 }
  ];
  const manifest = { source: '../剪纸拼贴.html', duration: 59, audio: { format: 'PCM WAV', sampleRate: rate, channels: format.readUInt16LE(2) }, sections: [] };
  const pad = n => String(n).padStart(2, '0');
  const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const rows = [];
  function writeClip(folder, start, end, title) {
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, '画面.html'), makeHtml(start, end, title));
    cutAudio(start, end, path.join(folder, '配乐.wav'));
  }
  for (const [i, section] of sections.entries()) {
    const name = `${pad(i)}_${section.text}`, folder = path.join(output, name);
    writeClip(folder, section.start, section.end, section.text);
    const entry = { ...section, folder: name, shots: [] };
    const links = [];
    for (const shot of shots.filter(s => s.end > section.start && s.start < section.end)) {
      const start = Math.max(section.start, shot.start), end = Math.min(section.end, shot.end);
      const partial = start !== shot.start || end !== shot.end;
      const shotName = shot.name.replace(' / ', '_') + (partial ? '_分段' : '');
      const rel = `${name}/镜头/${shotName}`;
      writeClip(path.join(output, rel), start, end, `${section.text} · ${shot.name}`);
      entry.shots.push({ ...shot, sourceStart: shot.start, sourceEnd: shot.end, start, end, partial, folder: rel });
      links.push(`<a href="${encodeURI(rel)}/画面.html">${esc(shot.name)}${partial ? '（分段）' : ''}</a>`);
    }
    manifest.sections.push(entry);
    rows.push(`<tr><td>${pad(i)}</td><td><a href="${encodeURI(name)}/画面.html">${esc(section.text)}</a></td><td>${section.start.toFixed(3)}–${section.end.toFixed(3)}</td><td><a href="${encodeURI(name)}/配乐.wav">配乐</a></td><td>${links.join(' · ')}</td></tr>`);
  }
  fs.writeFileSync(path.join(output, '分镜清单.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(output, '使用说明.md'), '# 歌词分镜\n\n打开 index.html 浏览全部片段。每个歌词文件夹内：画面.html 为独立播放器，配乐.wav 为同一时间范围的音频，镜头文件夹内为进一步细分的镜头及其配乐。所有文件均可直接本地打开。\n\n歌词边界沿用 HTML 实际字幕时间；跨歌词边界的镜头会拆成两段并标注“分段”。前奏、尾奏单独保留，全片 0–59 秒无遗漏。分镜清单.json 记录原片时间（秒）。播放器进度及 ?t= 参数使用片段内时间，动画、字幕、节拍使用原片时间。\n\nWAV 由原 MP3 解码后按采样点裁切，未额外淡入淡出，便于连续拼接；配乐包含原歌曲人声。原 HTML 和 MP3 保持原样。\n');
  fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>把回忆拼好给你 · 歌词分镜</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f6f7;color:#24332e;font:15px/1.6 system-ui,sans-serif}main{max-width:1440px;margin:auto;padding:32px 20px}h1{font-size:26px;margin:0 0 24px}a{color:#126d72}table{border-collapse:collapse;width:100%;background:white}th,td{text-align:left;padding:12px;border-bottom:1px solid #ddd;vertical-align:top}th{background:#e6ece9}td:last-child a{display:inline-block;margin-right:10px}td:nth-child(3){white-space:nowrap;font-variant-numeric:tabular-nums}.scroll{overflow-x:auto}table{min-width:760px}</style><main><h1>把回忆拼好给你 · 歌词分镜</h1><div class="scroll"><table><thead><tr><th>序号</th><th>歌词 / 段落</th><th>原片时间 / 秒</th><th>配乐</th><th>镜头</th></tr></thead><tbody>${rows.join('\n')}</tbody></table></div></main></html>`);
  console.log(JSON.stringify({ output, sections: sections.length, originalShots: shots.length, shotClips: manifest.sections.reduce((n, s) => n + s.shots.length, 0), sampleRate: rate }, null, 2));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

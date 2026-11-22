// node 版帧渲染：给 HTML 垫一层最小的浏览器环境，用 node-canvas 出帧。
// 用法：node render.js <html> <times.json> <out.png> [cols]
const fs = require('fs');
const { createCanvas, registerFont } = require('/tmp/vibe/node_modules/canvas');

registerFont('/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc', { family: 'Noto Serif CJK SC', weight: '400' });
registerFont('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', { family: 'Noto Sans CJK SC', weight: '400' });
registerFont('/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf', { family: 'Liberation Serif', weight: '400' });
registerFont('/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf', { family: 'Liberation Serif', weight: '400', style: 'italic' });
registerFont('/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf', { family: 'Liberation Serif', weight: '700' });
registerFont('/usr/share/fonts/truetype/liberation2/LiberationMono-Regular.ttf', { family: 'DejaVu Sans Mono', weight: '400' });
registerFont('/usr/share/fonts/truetype/liberation2/LiberationMono-Bold.ttf', { family: 'DejaVu Sans Mono', weight: '700' });

const canvases = [];
function makeCanvas(w, h) { const c = createCanvas(w, h); canvases.push(c); return c; }
class ImageDataShim { constructor(data, w, h) { this.data = data; this.width = w; this.height = h; } }

const html = fs.readFileSync(process.argv[2], 'utf8');
const scripts = [...html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)];
const vm = require('vm');
const sandbox = {
  document: { getElementById: () => makeCanvas(1920, 1080), createElement: () => makeCanvas(256, 256), fonts: { load: async () => true } },
  window: {}, ImageData: ImageDataShim, location: { search: '?static' }, URLSearchParams,
  requestAnimationFrame: () => {}, performance: { now: () => 0 }, console, Math, Date, Promise, setTimeout
};
vm.createContext(sandbox);
for (const m of scripts) {
  const code = m[1] ? fs.readFileSync(m[1], 'utf8') : m[2];
  vm.runInContext(code, sandbox, { filename: m[1] || 'inline' });
}
const times = JSON.parse(process.argv[3]);
const cols = parseInt(process.argv[5] || '4', 10);
const rows = Math.ceil(times.length / cols);
const out = createCanvas(cols * 480, rows * 270);
const o = out.getContext('2d');
o.font = 'bold 22px sans-serif';
const main = canvases[0];
times.forEach((t, i) => {
  sandbox.window.render(t);
  o.drawImage(main, (i % cols) * 480, Math.floor(i / cols) * 270, 480, 270);
  o.fillStyle = 'rgba(0,0,0,.6)'; o.fillRect((i % cols) * 480, Math.floor(i / cols) * 270, 90, 30);
  o.fillStyle = '#ff0'; o.fillText(t.toFixed(1), (i % cols) * 480 + 8, Math.floor(i / cols) * 270 + 22);
});
fs.writeFileSync(process.argv[4], out.toBuffer('image/png'));
console.log('wrote', process.argv[4], times.length, 'frames');

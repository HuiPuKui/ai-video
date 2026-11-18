# 生成点阵字库 -> src/data/glyphs.js ；用法: python3 gen_glyphs.py <out.js>
import sys, json
from PIL import Image, ImageFont, ImageDraw
LY = open(sys.argv[2], encoding='utf-8').read()
EXTRA = "把回忆拼好给你王贰浪存档损坏修复中完成记忆无法覆盖是否时差延迟继续一起保存读取失败错误删除收集完整丢包网络卡顿像素掉线重连开始游戏暂停关卡通关"
CJK = sorted(set(c for c in LY + EXTRA if ord(c) > 127 and c.strip()))
NOTO = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
def runs(im, w, h):
    px = im.load(); d = []
    for y in range(h):
        x = 0
        while x < w:
            if px[x, y] > 127:
                s = x
                while x < w and px[x, y] > 127: x += 1
                d.append(f"M{s} {y}h{x-s}v1h-{x-s}z")
            else: x += 1
    return ''.join(d)
def glyph(font, ch, w, h, base=None):
    im = Image.new('L', (w, h), 0); dr = ImageDraw.Draw(im); dr.fontmode = '1'
    if base is None: dr.text((0, 0), ch, font=font, fill=255)
    else: dr.text((0, base), ch, font=font, fill=255, anchor='ls')
    return runs(im, w, h)
out = {}
for name, cs, ms, mb, mw in (('L', 24, 20, 19, 12), ('S', 16, 13, 12, 8)):
    fc = ImageFont.truetype(NOTO, cs, index=2); fm = ImageFont.truetype(MONO, ms)
    g = {}
    for c in CJK: g[c] = [cs, glyph(fc, c, cs, cs)]
    for i in range(33, 127):
        c = chr(i); g[c] = [mw, glyph(fm, c, mw, cs, mb)]
    g[' '] = [mw, '']
    out[name] = {'h': cs, 'g': g}
open(sys.argv[1], 'w', encoding='utf-8').write('// 自动生成：tools/gen_glyphs.py（Noto Sans CJK Bold / DejaVu Mono 1-bit 点阵）\nexport const FONTS = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n')
print(len(CJK), 'cjk chars')

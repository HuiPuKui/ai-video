"""Rebuild the transparent pieces, 1080p shot states and layout manifest. Requires Pillow and numpy."""
from pathlib import Path
import json, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

ROOT=Path(__file__).resolve().parents[1]
LAY=ROOT/'可动图层'; SRC=ROOT/'来源原图'; BG=ROOT/'底图'
LAY.mkdir(exist_ok=True)
AA=Image.Resampling.LANCZOS
INK=(48,48,41); RED=(161,54,31)
SERIF='/System/Library/Fonts/Supplemental/Songti.ttc'
SANS='/System/Library/Fonts/STHeiti Medium.ttc'
def font(n,serif=False):return ImageFont.truetype(SERIF if serif else SANS,n)
def rgba(wh):return Image.new('RGBA',wh)
def ref(n):return Image.open(next(SRC.glob(n+'_*'))).convert('RGBA')
def save(name,im):im.save(LAY/(name+'.png'));return im
def placed(dst,src,x,y):
    dst.alpha_composite(src,(round(x),round(y)))
def finish_card(name,im):
    return save(name,im)
def paper(wh,color):
    rng=np.random.default_rng(31); w,h=wh
    grain=rng.normal(0,2.7,(h,w,1));a=np.array(color).reshape(1,1,3)+grain
    return Image.fromarray(a.clip(0,255).astype('uint8')).convert('RGBA')
def text(im,xy,s,size,ink=INK,serif=False):
    ImageDraw.Draw(im).text(xy,s,font=font(size,serif),fill=ink,anchor='lt')

# Remove only the dark museum backdrop, retaining the original image and scale in 来源原图.
spec=ref('01');pixels=np.array(spec);alpha=np.max(pixels[:,:,:3],axis=2)
alpha=np.clip((alpha.astype(float)-9)*22,0,255).astype('uint8')
alpha[int(spec.height*.89):,int(spec.width*.86):]=0
spec.putalpha(Image.fromarray(alpha));save('01_附肢石板',spec.resize((2144,1424),AA))
save('02_关节特写',ref('01').crop((610,480,3350,1940)))
hist=ref('02')
sheet=paper((960,730),(235,224,192));placed(sheet,ImageOps.contain(hist,(856,512),AA),52,62)
d=ImageDraw.Draw(sheet);d.line((52,604,905,604),fill=(150,126,88),width=2)
text(sheet,(52,631),'1892',47,RED,True);text(sheet,(230,634),'虾身？',43,serif=True)
text(sheet,(650,645),'据历史描述',25);save('03_历史记录卡',sheet)
pen=rgba((680,110));d=ImageDraw.Draw(pen)
d.polygon([(8,55),(121,24),(677,24),(677,86),(121,86)],fill='#aa7953')
d.polygon([(123,24),(677,24),(677,43),(123,43)],fill='#7e3c2e')
d.polygon([(123,43),(677,43),(677,67),(123,67)],fill='#a0553e')
d.polygon([(123,67),(677,67),(677,86),(123,86)],fill='#6b392c')
d.polygon([(8,55),(125,24),(116,43),(126,54),(116,66),(125,86)],fill='#d8b38b')
d.polygon([(8,55),(40,47),(38,63)],fill='#3d3630');save('01_铅笔',pen)

# These three overlays share the native photograph's coordinate system; annotated positions
# are drawn in a 600 x 622 reference view and scaled to the actual scan.
head=ref('03');save('04_头部化石',head);sw,sh=head.size
def head_layer(name,lines,shade,width,dashed=False):
    im=rgba(head.size);d=ImageDraw.Draw(im)
    for line in lines:
        pts=[(round(x*sw/600),round(y*sh/622)) for x,y in line]
        if dashed:
            for a,b in zip(pts,pts[1:]):
                length=math.dist(a,b)
                for start in range(0,int(length),13):
                    if length<=0:continue
                    frac=lambda k:tuple(round(a[i]+(b[i]-a[i])*min(k/length,1)) for i in (0,1))
                    d.line((frac(start),frac(start+7)),fill=shade,width=width)
        else:d.line(pts,fill=shade,width=width,joint='curve')
    return save(name,im)
head_layer('05_左侧根部描线',[[(153,209),(151,238),(157,261),(172,276)],[(149,275),(159,281),(173,285)]],(255,105,65,255),5)
head_layer('05_右侧根部描线',[[(293,307),(302,280),(312,255),(323,229)],[(284,314),(296,311),(305,304)]],(255,105,65,255),5)
head_layer('06_附肢描图',[[(158,255),(151,232),(151,190),(148,149),(153,110),(162,79),(181,48),(209,29),(245,17),(280,21),(305,43)],[(292,306),(301,274),(314,238),(331,211),(349,182),(366,144),(383,107)],[(77,249),(81,238),(100,227),(115,235),(123,253)],[(283,352),(299,334),(317,335),(338,356)]],(255,226,166,225),3,True)
vellum=paper(head.size,(238,222,183))
atlas=ImageDraw.Draw(vellum)
def sketch(points,ink,width=3):
    atlas.line([(round(x*sw/600),round(y*sh/622)) for x,y in points],fill=ink,width=width,joint='curve')
for outline in [
    [(146,258),(150,213),(147,156),(152,102),(172,62),(201,34),(245,14),(279,20),(306,44),(318,74)],
    [(186,252),(191,213),(202,169),(216,134),(236,109),(252,86),(268,73)],
    [(255,304),(279,265),(293,230),(301,195),(316,157),(334,122),(356,94),(374,89),(386,108),(366,154),(351,190),(334,227),(314,273),(302,311)],
    [(146,267),(130,251),(115,233),(93,230),(75,245),(69,264),(85,287),(111,297),(143,297),(165,285)],
    [(223,305),(254,330),(277,346),(285,367),(302,388),(327,389),(344,366),(330,344),(306,331),(284,339)],
    [(159,292),(149,345),(158,398),(173,452),(192,518),(196,570),(213,615)],
    [(251,398),(293,388),(325,404),(311,426),(269,446)],[(268,453),(333,422),(372,426),(393,441),(368,473),(293,499)],
    [(299,500),(380,461),(420,450),(457,452),(482,470),(457,492),(404,514),(315,543)],
    [(325,549),(408,513),(473,498),(512,494),(530,512),(508,541),(456,560),(351,583)]
]:sketch(outline,(88,75,54),4)
for x,y in [(156,113),(154,138),(151,164),(150,191),(153,214),(159,236)]:
    sketch([(x,y),(x+21,y+8),(x+33,y+24),(x+41,y+35)],(103,85,55),2)
vellum.putalpha(Image.new('L',head.size,192))
save('06_半透明描图纸',vellum)
for side in ['左','右']:
    mask=rgba(head.size);rng=random.Random(51 if side=='左' else 29)
    if side=='右':
        seam=[(int(sw*(.457+.017*math.sin(y/41))+rng.uniform(-5,5)),y) for y in range(0,sh+10,8)]
        poly=seam+[(sw,sh),(sw,0)]
    else:
        seam=[(x,int(sh*(.268+.043*math.cos(x/73))+rng.uniform(-4,4))) for x in range(0,sw+10,8)]
        poly=seam+[(sw,sh),(0,sh)]
    cover=paper(head.size,(153,145,127));m=Image.new('L',head.size)
    ImageDraw.Draw(m).polygon(poly,fill=255);ImageDraw.Draw(cover).line(seam,fill='#dcd0b7',width=5);cover.putalpha(m)
    save('04_纸岩'+side,cover)
animal=Image.open(BG/'奇虾版画原图.png').convert('RGB')
a=np.array(animal).astype(float);strength=np.minimum(a[:,:,0],a[:,:,2])-a[:,:,1]
edge=(1-np.clip((strength-22)/88,0,1));a[:,:,0]-=(1-edge)*np.minimum(strength.clip(0,255),a[:,:,0]);a[:,:,2]-=(1-edge)*np.minimum(strength.clip(0,255),a[:,:,2])
cut=Image.fromarray(a.clip(0,255).astype('uint8')).convert('RGBA');cut.putalpha(Image.fromarray((edge*255).astype('uint8')));save('07_奇虾版画',cut.crop(cut.getbbox()))
fg=rgba((1400,850));d=ImageDraw.Draw(fg);rng=random.Random(31)
for _ in range(67):
    x=rng.randrange(1400);y=rng.randrange(850);r=rng.choice([1,1,2,3]);d.ellipse((x,y,x+r*2,y+r),fill=(199,218,188,rng.randint(28,105)))
save('07_前景悬浮颗粒',fg)

def tag(name,title,sub):
    im=rgba((800,120));d=ImageDraw.Draw(im);d.line((0,5,0,100),fill=RED,width=6)
    text(im,(22,5),title,43,serif=True);text(im,(23,72),sub,22);return save(name,im)
tag('04_清理标注','清理示意','20 世纪 80 年代初')
tag('06_物种标注','加拿大奇虾','Anomalocaris canadensis')
def sea_label():
    im=rgba((800,90));text(im,(2,0),'寒武纪海底',43,(239,225,192),True)
    text(im,(3,56),'生态复原',23,(224,220,195));return save('07_复原标注',im)
sea_label()
def small_ref():
    card=paper((548,396),(225,216,190));im=ImageOps.contain(ref('01'),(508,304),AA);placed(card,im,20+(508-im.width)/2,17)
    text(card,(24,337),'孤立前附肢',27,serif=True);return save('04_对照片',card)
small_ref()

def source(name):
    for folder in (LAY,BG):
        file=folder/(name+'.png')
        if file.is_file():return file
    raise FileNotFoundError(name)
from functools import lru_cache
@lru_cache(maxsize=38)
def asset(name):return Image.open(source(name)).convert('RGBA')

class Frame:
    def __init__(self,path,size,bg):
        self.w,self.h=size;self.path=path;self.data=[dict(file=str(source(bg).relative_to(ROOT)),fit='cover')]
        self.im=ImageOps.fit(asset(bg),size,AA)
    def put(self,name,cx,cy,width,rot=0,shadow=False,opacity=1):
        im=asset(name);w=round(width*self.w);h=round(w*im.height/im.width)
        im=im.resize((w,h),AA)
        if rot:im=im.rotate(rot,Image.Resampling.BICUBIC,expand=True)
        if opacity!=1:im.putalpha(im.getchannel('A').point(lambda a:round(a*opacity)))
        x=round(self.w*cx-im.width/2);y=round(self.h*cy-im.height/2)
        if shadow:
            shadow_im=rgba((im.width+50,im.height+50));m=Image.new('L',shadow_im.size)
            m.paste(im.getchannel('A').point(lambda a:a*62//255),(25,25));shadow_im.putalpha(m.filter(ImageFilter.GaussianBlur(12)))
            placed(self.im,shadow_im,x-18,y-14)
        placed(self.im,im,x,y)
        self.data.append(dict(file=str(source(name).relative_to(ROOT)),center=[cx,cy],width=width,rotation=rot,opacity=opacity,shadow=shadow))
    def save(self):self.im.convert('RGB').save(self.path,quality=94,subsampling=0)

shots=['01_先选一头','02_关节与刺','03_历史记录','04_第二块标本','05a_先露左侧','05b_两侧连接','06_显出附肢','07_生态复原','08a_转身','08b_叠回开场']
manifest={};timing=['0–3 s','3–9 s','9–15 s','15–22 s','22–26 s','26–29 s','29–35 s','35–42 s','42–43 s','43–44 s']
for tall in (True,False):
    size=(1080,1920) if tall else (1920,1080);fmt='竖屏' if tall else '横屏'
    folder=ROOT/fmt;folder.mkdir(exist_ok=True)
    for n,shot in enumerate(shots):
        f=Frame(folder/(shot+'.jpg'),size,'寒武纪海底' if n in [7,8] else '桌面')
        sx,sy,ww=(.51,.47,1.05) if tall else (.52,.51,.65)
        if n in [0,9]:
            f.put('01_附肢石板',sx,sy,ww,14 if tall else 5,True)
            f.put('01_铅笔',.93 if tall else .82,.60 if tall else .72,.43 if tall else .24,-28 if tall else -25,True)
        elif n==1:
            f.put('02_关节特写',.5,.48,1.98 if tall else 1.12,12 if tall else 3,True)
        elif n==2:
            f.put('01_附肢石板',.52 if tall else .32,.34 if tall else .47,.91 if tall else .51,10,True)
            f.put('03_历史记录卡',.53 if tall else .74,.66 if tall else .55,.72 if tall else .31,-4,True)
        elif n in [3,4,5,6]:
            cx,cy,width=(.50,.48,.86) if tall else (.65,.47,.43)
            # All evidence and its highlights share the same pose, including both reveal states.
            f.put('04_头部化石',cx,cy,width,shadow=True)
            if n in [3,4]:f.put('04_纸岩右',cx,cy,width)
            if n==3:f.put('04_纸岩左',cx,cy,width)
            if n==6:f.put('06_半透明描图纸',cx,cy,width)
            if n>=4:f.put('05_左侧根部描线',cx,cy,width)
            if n>=5:f.put('05_右侧根部描线',cx,cy,width)
            if n==6:f.put('06_附肢描图',cx,cy,width)
            if not tall or n==3:
                f.put('04_对照片',.24 if not tall else .24,.45 if not tall else .17,.26 if not tall else .33,-5,True)
            f.put('06_物种标注' if n==6 else '04_清理标注',.53 if tall else .27,.81 if tall else .72,.76 if tall else .34)
        else:
            f.put('奇虾三维游姿' if n==7 else '奇虾三维转身',.5,.52 if tall else .48,.94 if tall else .66,25 if tall else -5)
            f.put('07_前景悬浮颗粒',.5,.48,1.1)
            f.put('07_复原标注',.48 if tall else .24,.81 if tall else .82,.74 if tall else .32)
        f.save();manifest[str(f.path.relative_to(ROOT))]=dict(time=timing[n],size=size,layers=f.data)
(ROOT/'分镜图层.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
for fmt,cols in [('竖屏',4),('横屏',2)]:
    poster=Image.new('RGB',(1216,1182 if fmt=='竖屏' else 1672),'#eae5d9');d=ImageDraw.Draw(poster)
    text(poster,(38,28),'加拿大奇虾',54,serif=True)
    text(poster,(41,98),fmt+'镜头素材  /  标本与生态复原',21)
    chosen=[0,1,2,3,5,6,7,8];tw=274 if fmt=='竖屏' else 562;th=round(tw*(16/9 if fmt=='竖屏' else 9/16))
    for i,idx in enumerate(chosen):
        x=38+(i%cols)*(tw+18);y=145+(i//cols)*(th+40)
        im=Image.open(ROOT/fmt/(shots[idx]+'.jpg')).resize((tw,th),AA)
        poster.paste(im,(x,y));text(poster,(x,y+th+7),f'{i+1:02}  '+shots[idx].split('_')[1],18)
    poster.save(ROOT/('镜头总览_'+fmt+'.jpg'),quality=91)

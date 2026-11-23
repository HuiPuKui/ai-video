"""Export an eight-shot still set and 42-second draft from the compiled Three.js scene."""
import argparse,base64,json,math,subprocess,tempfile,wave
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1];scene=root/'摄影预览.html'
shots=[('01_游近',2.5,'0–4.5'),('02_侧叶跟拍',6.6,'4.5–8.7'),('03_头部特写',10.4,'8.7–12'),('04_乌龙引子',14.9,'12–16'),('05_孤立化石',19.9,'16–22.2'),('06_1892图版',25.4,'22.2–27.4'),('07_头部证据',33.2,'27.4–36'),('08_重返寒武纪',39.6,'36–42')]
parser=argparse.ArgumentParser();parser.add_argument('--stills-only',action='store_true');parser.add_argument('--format',choices=['横版','竖版','全部'],default='全部');args=parser.parse_args()
def ambience(path):
    sr=48000;t=np.arange(42*sr)/sr;rng=np.random.default_rng(2705)
    def drift(hz):
        knots=np.arange(0,42+1/hz,1/hz);return np.interp(t,knots,rng.normal(size=len(knots)))
    sea=np.interp(t,[0,.6,15.58,16.2,35.75,36.6,41.6,42],[0,1,1,0,0,1,1,0])
    bed=(.061*np.sin(2*np.pi*51*t+.25*np.sin(t*.65))+.024*np.sin(2*np.pi*76.5*t)+.040*drift(150)+.019*drift(470))*(.88+.12*np.cos(.8*t))*sea
    air=.012*drift(950)*np.interp(t,[0,16,16.4,35.6,36,42],[0,0,1,1,0,0])
    for when,length,vol,freq in [(4.5,.7,.031,500),(8.7,.58,.03,720),(15.8,.48,.06,1100),(22.2,.45,.07,1800),(28.9,.73,.045,2600),(31.2,.68,.045,2900),(35.9,.7,.04,800)]:
        u=(t-when)/length;air+=np.where((u>=0)&(u<=1),np.sin(np.pi*u)**2,0)*vol*drift(freq)
    out=np.stack([bed+air,.97*bed+np.roll(air,37)],axis=1)*1.6
    with wave.open(str(path),'wb') as w:w.setparams((2,2,sr,0,'NONE',''));w.writeframes((out.clip(-1,1)*32767).astype('<i2').tobytes())
with tempfile.TemporaryDirectory() as tmp, sync_playwright() as pw:
    sound=Path(tmp)/'环境.wav';ambience(sound)
    browser=pw.chromium.launch(channel='chrome',headless=True,args=['--allow-file-access-from-files','--use-gl=angle','--use-angle=metal','--ignore-gpu-blocklist','--disable-background-timer-throttling'])
    p=browser.new_page();p.on('pageerror',lambda e:print('PAGE ERROR',e,flush=True));p.goto(scene.as_uri()+'?render');p.wait_for_function('window.ready===true',timeout=60000)
    for fmt,wh in [('横版',(1920,1080)),('竖版',(1080,1920))]:
        if args.format not in ['全部',fmt]:continue
        dest=root/'新版分镜'/fmt;dest.mkdir(parents=True,exist_ok=True);p.evaluate('([w,h])=>setup(w,h)',wh)
        for name,t,_ in shots:
            (dest/(name+'.jpg')).write_bytes(base64.b64decode(p.evaluate('t=>shot(t,true)',t)))
        ww,hh=(370,209) if fmt=='横版' else (190,338);cols=2 if fmt=='横版' else 4
        board=Image.new('RGB',(cols*(ww+14)+22,70+(8//cols)*(hh+43)),(234,228,214));d=ImageDraw.Draw(board)
        titlefont=ImageFont.truetype('/System/Library/Fonts/Supplemental/Songti.ttc',31);f=ImageFont.truetype('/System/Library/Fonts/STHeiti Medium.ttc',14)
        d.text((14,8),'奇虾    /    从寒武纪海底到标本桌',fill='#303d38',font=titlefont)
        for i,(name,t,span) in enumerate(shots):
            im=Image.open(dest/(name+'.jpg')).resize((ww,hh),Image.Resampling.LANCZOS)
            x=14+i%cols*(ww+14);y=65+i//cols*(hh+43);board.paste(im,(x,y));d.text((x,y+hh+5),name.replace('_','  ')+'   '+span+' s',font=f,fill='#39443c')
        board.save(root/'新版分镜'/('总览_'+fmt+'.jpg'),quality=93)
        if args.stills_only:continue
        # 720p review copies use the same separately framed 1080p master scenes.
        sz=tuple(round(n*2/3) for n in wh);p.evaluate('([w,h])=>setup(w,h)',sz)
        dest=root.parent/('奇虾_'+fmt+'样片.mp4')
        proc=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate','24','-c:v','mjpeg','-i','pipe:0','-i',str(sound),'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-t','42','-movflags','+faststart',str(dest)],stdin=subprocess.PIPE)
        for i in range(1008):
            proc.stdin.write(base64.b64decode(p.evaluate('t=>shot(t)',i/24)))
            if i%240==0:print(fmt,i,flush=True)
        proc.stdin.close()
        if proc.wait():raise RuntimeError('Video encoding failed')
    browser.close()

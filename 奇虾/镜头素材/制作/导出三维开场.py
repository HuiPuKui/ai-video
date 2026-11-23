"""Export and inspect the captioned ocean sequence with its embedded score."""
import argparse,base64,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO
from tempfile import TemporaryDirectory

root=Path(__file__).resolve().parents[1];target=root/'三维'
args=argparse.ArgumentParser();args.add_argument('--test',action='store_true');options=args.parse_args()
with TemporaryDirectory(dir=target) as tmp, sync_playwright() as pw:
    browser=pw.chromium.launch(channel='chrome',args=['--allow-file-access-from-files','--use-gl=angle','--use-angle=metal','--ignore-gpu-blocklist'],headless=True)
    page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text[:300]) if m.type=='error' else None)
    page.goto((root/'三维海底预览.html').as_uri()+'?render');page.wait_for_function('window.ready===true',timeout=45000)
    frames=round(page.evaluate('window.oceanDuration')*24)
    score=Path(tmp)/'score.m4a'
    if not options.test:
        embedded=page.locator('#score').get_attribute('src')
        score.write_bytes(base64.b64decode(embedded.split(',',1)[1],validate=True))
    page.evaluate('setup(1920,1080)')
    def frame(t):return base64.b64decode(page.evaluate('t=>oceanShot(t)',t))
    if options.test:
        w,h=400,225
        out=Image.new('RGB',(w*3,h*2))
        for i,t in enumerate([1.6,5.7,7.84,9.72,13.55,16.80]):
            im=Image.open(BytesIO(frame(t)));im.thumbnail((w,h))
            out.paste(im,(i%3*w,i//3*h))
        out.save(target/'横版机位检查.jpg',quality=92)
    else:
        output=target/'奇虾海底开场_横版.mp4'
        staged=Path(tmp)/output.name
        cmd=['ffmpeg','-y','-loglevel','error','-framerate','24','-f','image2pipe','-vcodec','mjpeg','-i','pipe:0','-i',str(score),'-map','0:v','-map','1:a:0','-c:a','copy','-c:v','libx264','-crf','17','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(staged)]
        p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
        for i in range(frames):p.stdin.write(frame(i/24))
        p.stdin.close()
        if p.wait():raise RuntimeError('Encoding failed')
        if errors:raise RuntimeError(errors)
        staged.replace(output)
        print('横版',frames,'frames',flush=True)
    if errors:raise RuntimeError(errors)
    browser.close()

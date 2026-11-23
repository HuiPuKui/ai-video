"""Offline frame export with Chrome, Playwright and FFmpeg."""
from pathlib import Path
import argparse
import base64
import subprocess
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument("layout", choices=["wide", "vertical"])
parser.add_argument("output", type=Path)
parser.add_argument("--proof", action="store_true")
args = parser.parse_args()
args.output.mkdir(exist_ok=True, parents=True)
vertical = args.layout == "vertical"
label = "抖音竖版" if vertical else "B站横版"
width, height = (1080, 1920) if vertical else (1920, 1080)
with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome", headless=True, args=[
        "--use-gl=angle", "--use-angle=metal", "--ignore-gpu-blocklist",
        "--disable-background-timer-throttling", "--allow-file-access-from-files"])
    page = browser.new_page(viewport={"width":width, "height":height})
    errors = []
    page.on("pageerror", lambda e: (errors.append(str(e)),print("JS ERROR",e,flush=True)))
    page.on("console", lambda m: print(m.text[:600],flush=True) if m.type=="error" else None)
    url = (root / "index.html").as_uri() + "?render" + ("&v" if vertical else "")
    def open_page(suffix=""):
        page.goto(url + suffix)
        page.wait_for_function("window.ready === true",timeout=45000)
    def frame(t):
        data=page.evaluate("""t=>{render(t);return document.getElementById('film').toDataURL('image/jpeg',.96).split(',')[1]}""",t)
        if errors:
            raise ValueError(errors[0])
        return base64.b64decode(data)
    open_page()
    if args.proof:
        for t in [1.3,3.2,7.1,9.0,13.2,14.45,16.9,18.2,19.66,21,25,29,31.8,34.5,38.5,42.0,46.0]:
            (args.output / f"{label}-{t:05.2f}.jpg").write_bytes(frame(t))
    else:
        duration=page.evaluate("window.duration")
        fps=24
        target=args.output / f"{label}.mp4"
        unfinished=target.with_name(target.stem+".partial.mp4")
        command=["ffmpeg","-y","-v","error","-f","image2pipe","-vcodec","mjpeg","-framerate",str(fps),"-i","pipe:0",
                 "-i",str(root / "知识大赏默认配乐.mp3"),"-map","0:v","-map","1:a:0",
                 "-vf","scale=out_color_matrix=bt709,format=yuv420p","-c:v","libx264","-crf","17","-preset","fast",
                 "-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709",
                 "-af",f"volume=-3.9dB,afade=t=in:d=0.05,afade=t=out:st={duration-1.10}:d=1.10",
                 "-c:a","aac","-b:a","192k","-t",str(duration),"-movflags","+faststart",str(unfinished)]
        proc=subprocess.Popen(command,stdin=subprocess.PIPE)
        for i in range(round(duration*fps)):
            proc.stdin.write(frame(i/fps))
            if i%200==0:print(label,i,flush=True)
        proc.stdin.close()
        if proc.wait():
            raise RuntimeError("FFmpeg error")
        unfinished.replace(target)
        sizes = [("3x4","")] if vertical else [("4x3",""),("16x9","=wide")]
        for ratio, query in sizes:
            open_page("&cover"+query)
            (args.output / f"{label}封面-{ratio}.jpg").write_bytes(frame(1.3))
    browser.close()

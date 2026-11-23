"""Render either format with local Chrome, Playwright and FFmpeg."""
import argparse
import base64
import math
from pathlib import Path
import shutil
import subprocess
import sys
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument("format", choices=["wide", "vertical"])
parser.add_argument("output", type=Path)
mode = parser.add_mutually_exclusive_group()
mode.add_argument("--preview", action="store_true")
mode.add_argument("--cover-only", action="store_true")
mode.add_argument("--cover-16x9", action="store_true", help="Export only the 1920x1080 landscape cover")
parser.add_argument("--fps", type=int, default=24)
parser.add_argument("--music", type=Path, default=ROOT / "知识大赏默认配乐.mp3")
args = parser.parse_args()
if args.cover_16x9 and args.format != "wide":
    parser.error("--cover-16x9 requires wide")
vertical = args.format == "vertical"
width, height = (1080, 1920) if vertical else (1920, 1080)
args.output.mkdir(parents=True, exist_ok=True)
name = "抖音竖版" if vertical else "B站横版"
with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome", headless=True, args=[
        "--use-gl=angle", "--use-angle=metal", "--ignore-gpu-blocklist",
        "--disable-background-timer-throttling", "--allow-file-access-from-files",
    ])
    page = browser.new_page(viewport={"width": width, "height": height})
    page.on("pageerror", lambda e: print("PAGE ERROR", e, flush=True))
    page.on("console", lambda m: print(m.text[:900], flush=True) if m.type=="error" else None)
    url = (ROOT / "index.html").as_uri() + "?render" + ("&v" if vertical else "")
    def open_scene(address):
        page.goto(address)
        page.wait_for_function("window.ready === true", timeout=90000)
    def image(t, cover=False):
        data = page.evaluate("""([t,cover])=>{render(t,cover);return document.querySelector('#film').toDataURL('image/jpeg',.96).split(',')[1]}""", [t,cover])
        return base64.b64decode(data)
    if not args.preview:
        open_scene(url + ("&cover=16x9" if args.cover_16x9 else "&cover"))
        cover_name = "横版封面-16x9.jpg" if args.cover_16x9 else f"{name}封面.jpg"
        (args.output / cover_name).write_bytes(image(1.5, True))
    if args.cover_only or args.cover_16x9:
        browser.close()
        sys.exit(0)
    open_scene(url)
    if args.preview:
        for t in [.7, 2.1, 5.4, 10.1, 14.4, 18.6, 23, 27.1, 29.5, 32.4, 36.2, 40.3, 44.1, 48.6]:
            (args.output / f"{name}-{t:04.1f}.jpg").write_bytes(image(t))
    else:
        duration = page.evaluate("window.duration")
        frames = math.ceil(duration * args.fps)
        command = ["ffmpeg","-hide_banner","-loglevel","error","-y","-f","image2pipe","-vcodec","mjpeg",
                   "-framerate",str(args.fps),"-i","pipe:0","-i",str(args.music),"-map","0:v","-map","1:a:0",
                   "-vf","scale=out_color_matrix=bt709,format=yuv420p","-c:v","libx264","-preset","fast","-crf","17",
                   "-color_primaries","bt709","-colorspace","bt709","-color_trc","bt709",
                   "-af",f"volume=-3.9dB,afade=t=in:d=0.045,afade=t=out:st={duration-1.1}:d=1.1",
                   "-c:a","aac","-b:a","192k","-ar","48000","-t",str(frames/args.fps),
                   "-movflags","+faststart",str(args.output / f"{name}.mp4")]
        proc = subprocess.Popen(command, stdin=subprocess.PIPE)
        for frame in range(frames):
            proc.stdin.write(image(frame/args.fps))
            if frame%240==0: print(f"{name} {frame}/{frames}",flush=True)
        proc.stdin.close()
        if proc.wait(): sys.exit("FFmpeg export failed")
    browser.close()

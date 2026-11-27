import http.server
import json
import os
import socketserver
import subprocess
import sys
import threading
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
WORKSPACE_ROOT = ROOT.parent  # Serve video-studio/ so Three.js in ep01-phone-heat/node_modules loads cleanly!
PROJECT_SLUG = ROOT.name
SRC_DIR = ROOT / "src"
FRAMES_DIR = ROOT / "frames"
OUT_DIR = ROOT / "output"
AUDIO_FILE = ROOT / "audio" / "master_mix.m4a"
TIMELINE_FILE = SRC_DIR / "timeline.json"

FRAMES_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WORKSPACE_ROOT), **kwargs)

    def log_message(self, format, *args):
        pass


def start_server():
    httpd = socketserver.TCPServer(("127.0.0.1", 0), QuietHandler)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd, port


def launch_browser(p):
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    launch_args = [
        "--enable-webgl",
        "--ignore-gpu-blocklist",
        "--use-gl=angle",
        "--use-angle=metal",
        "--enable-unsafe-swiftshader",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
    ]
    if os.path.exists(chrome_path):
        return p.chromium.launch(executable_path=chrome_path, headless=True, args=launch_args)
    return p.chromium.launch(headless=True, args=launch_args)


def render_covers(p, base_url):
    browser = launch_browser(p)
    specs = [
        ("cover16x9", 1920, 1080, "cover_bilibili_16x9.png"),
        ("cover9x16", 1080, 1920, "cover_douyin_9x16.png"),
        ("cover4x3", 1440, 1080, "cover_landscape_4x3.png"),
        ("cover3x4", 1080, 1440, "cover_portrait_3x4.png"),
    ]
    try:
        for mode, w, h, fname in specs:
            page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
            page.on("pageerror", lambda err: print(f"[COVER PAGEERROR] {err}"))
            page.goto(f"{base_url}/{PROJECT_SLUG}/src/index.html?mode={mode}", wait_until="networkidle")
            page.wait_for_function("window.__READY__ === true", timeout=30000)
            page.wait_for_timeout(150)
            out_path = OUT_DIR / fname
            page.screenshot(path=str(out_path), type="png")
            page.close()
            print(f"COVER {mode:10s} READY -> {out_path}")
    finally:
        browser.close()


def render_qa_keyframes(p, base_url, timeline):
    browser = launch_browser(p)
    try:
        page = browser.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        page.on("console", lambda msg: print(f"[BROWSER {msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: print(f"[PAGEERROR] {err}"))
        page.goto(f"{base_url}/{PROJECT_SLUG}/src/index.html?mode=video", wait_until="networkidle")
        page.wait_for_function("window.__READY__ === true", timeout=30000)

        for idx, b in enumerate(timeline["beats"]):
            sample_t = round(b["start"] + b["duration"] * 0.45, 3)
            page.evaluate(f"window.renderAtTime({sample_t})")
            out_path = FRAMES_DIR / f"qa_{idx:02d}_{b['id']}.jpg"
            page.screenshot(path=str(out_path), type="jpeg", quality=92)
            print(f"QA FRAME [{idx:02d}] t={sample_t:5.2f}s -> {out_path.name}")
        page.close()
    finally:
        browser.close()


def render_full_video(p, base_url, timeline):
    fps = timeline.get("fps", 30)
    total_dur = timeline["total_duration"]
    total_frames = int(round(total_dur * fps))
    out_mp4 = OUT_DIR / "ep02_snooze_alarm_1080x1920.mp4"

    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-f", "image2pipe",
        "-vcodec", "mjpeg",
        "-framerate", str(fps),
        "-i", "-",
        "-i", str(AUDIO_FILE),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "17",
        "-pix_fmt", "yuv420p",
        "-profile:v", "high",
        "-movflags", "+faststart",
        "-c:a", "copy",
        "-shortest",
        str(out_mp4),
    ]
    ff = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)

    browser = launch_browser(p)
    t_start = time.time()
    try:
        page = browser.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        page.on("pageerror", lambda err: print(f"[VIDEO PAGEERROR] {err}"))
        page.goto(f"{base_url}/{PROJECT_SLUG}/src/index.html?mode=video", wait_until="networkidle")
        page.wait_for_function("window.__READY__ === true", timeout=30000)

        for f in range(total_frames):
            t = f / fps
            jpg_bytes = None
            for attempt in range(5):
                try:
                    page.evaluate(f"window.renderAtTime({t:.4f})")
                    jpg_bytes = page.screenshot(type="jpeg", quality=94)
                    break
                except Exception as exc:
                    if attempt == 4:
                        raise
                    print(f"[WARN] frame {f} retry {attempt+1}: {exc}", flush=True)
                    time.sleep(0.15 * (attempt + 1))
            ff.stdin.write(jpg_bytes)
            if f % 150 == 0 or f == total_frames - 1:
                elapsed = time.time() - t_start
                rate = (f + 1) / max(elapsed, 0.01)
                eta = (total_frames - f - 1) / max(rate, 0.01)
                print(f"RENDERING {f+1:4d}/{total_frames} ({100*(f+1)/total_frames:5.1f}%) | {rate:5.1f} fps | ETA {eta:4.0f}s", flush=True)
        page.close()
    finally:
        browser.close()
        ff.stdin.close()
        err = ff.stderr.read().decode("utf-8", errors="ignore")
        ret = ff.wait()
        if ret != 0:
            print("FFMPEG ERROR:\n", err)
            sys.exit(ret)

    print(f"\nEP02 FULL VIDEO EXPORTED -> {out_mp4}")


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"
    timeline = json.loads(TIMELINE_FILE.read_text(encoding="utf-8"))
    httpd, port = start_server()
    base_url = f"http://127.0.0.1:{port}"
    try:
        with sync_playwright() as p:
            if mode == "covers":
                render_covers(p, base_url)
            if mode in ("qa", "all"):
                render_covers(p, base_url)
                render_qa_keyframes(p, base_url, timeline)
            if mode in ("video", "all"):
                render_full_video(p, base_url, timeline)
    finally:
        httpd.shutdown()


if __name__ == "__main__":
    main()

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
SRC_DIR = ROOT / "src"
FRAMES_DIR = ROOT / "frames"
OUT_DIR = ROOT / "output"
AUDIO_FILE = ROOT / "audio" / "master_mix.m4a"
TIMELINE_FILE = SRC_DIR / "timeline.json"

FRAMES_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

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
    try:
        # 16:9 Bilibili Killer Thumbnail (1920x1080)
        page16 = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
        page16.goto(f"{base_url}/src/index.html?mode=cover16x9", wait_until="networkidle")
        page16.wait_for_function("window.__READY__ === true", timeout=30000)
        page16.wait_for_timeout(150)
        out16 = OUT_DIR / "cover_bilibili_16x9.png"
        page16.screenshot(path=str(out16), type="png")
        page16.close()
        print(f"COVER 16:9 READY -> {out16}")

        # 9:16 Douyin Killer Cover (1080x1920)
        page9 = browser.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        page9.goto(f"{base_url}/src/index.html?mode=cover9x16", wait_until="networkidle")
        page9.wait_for_function("window.__READY__ === true", timeout=30000)
        page9.wait_for_timeout(150)
        out9 = OUT_DIR / "cover_douyin_9x16.png"
        page9.screenshot(path=str(out9), type="png")
        page9.close()
        print(f"COVER 9:16 READY -> {out9}")

        # 4:3 Landscape Cover (1440x1080)
        page43 = browser.new_page(viewport={"width": 1440, "height": 1080}, device_scale_factor=1)
        page43.goto(f"{base_url}/src/index.html?mode=cover4x3", wait_until="networkidle")
        page43.wait_for_function("window.__READY__ === true", timeout=30000)
        page43.wait_for_timeout(150)
        out43 = OUT_DIR / "cover_landscape_4x3.png"
        page43.screenshot(path=str(out43), type="png")
        page43.close()
        print(f"COVER 4:3 READY -> {out43}")

        # 3:4 Portrait Cover (1080x1440)
        page34 = browser.new_page(viewport={"width": 1080, "height": 1440}, device_scale_factor=1)
        page34.goto(f"{base_url}/src/index.html?mode=cover3x4", wait_until="networkidle")
        page34.wait_for_function("window.__READY__ === true", timeout=30000)
        page34.wait_for_timeout(150)
        out34 = OUT_DIR / "cover_portrait_3x4.png"
        page34.screenshot(path=str(out34), type="png")
        page34.close()
        print(f"COVER 3:4 READY -> {out34}")
    finally:
        browser.close()


def render_qa_keyframes(p, base_url, timeline):
    browser = launch_browser(p)
    try:
        page = browser.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        page.on("console", lambda msg: print(f"[BROWSER {msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: print(f"[PAGEERROR] {err}"))
        page.goto(f"{base_url}/src/index.html?mode=video", wait_until="networkidle")
        page.wait_for_function("window.__READY__ === true", timeout=30000)

        for idx, b in enumerate(timeline["beats"]):
            sample_t = round(b["start"] + b["duration"] * 0.52, 3)
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
    out_mp4 = OUT_DIR / "ep01_phone_heat_1080x1920.mp4"

    # Pipe JPEG frames directly into FFmpeg -> H.264 High Profile + Master Audio (-14 LUFS)
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
        page.goto(f"{base_url}/src/index.html?mode=video", wait_until="networkidle")
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
                    print(f"[WARN] frame {f} screenshot retry {attempt+1}: {exc}", flush=True)
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

    print(f"\nFULL VIDEO EXPORTED -> {out_mp4}")


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

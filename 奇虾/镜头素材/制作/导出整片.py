"""Render the archive animation and join it to the approved 440-frame opening."""
import base64
import json
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory
from playwright.sync_api import sync_playwright

assets = Path(__file__).resolve().parents[1]
opening = assets / '三维/奇虾海底开场_横版.mp4'
output = assets.parent / '奇虾_横屏完整版.mp4'
probe = json.loads(subprocess.check_output([
    'ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
    'stream=nb_frames,width,height,r_frame_rate', '-of', 'json', str(opening)
]))['streams'][0]
if (probe['width'], probe['height'], probe['r_frame_rate'], probe['nb_frames']) != (1920, 1080, '24/1', '440'):
    raise ValueError('The approved opening must contain 440 frames at 1920 × 1080 and 24 fps.')

def ffmpeg(args):
    subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', *args], check=True)

with TemporaryDirectory(dir=output.parent) as temp, sync_playwright() as playwright:
    folder = Path(temp)
    browser = playwright.chromium.launch(channel='chrome', args=['--use-gl=angle','--use-angle=metal','--ignore-gpu-blocklist'])
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.goto((assets / '三维海底预览.html').as_uri() + '?render')
    page.wait_for_function('window.ready === true', timeout=60000)
    page.evaluate('setup(1920,1080)')
    frame_count = round(page.evaluate('window.filmDuration') * 24)
    score = page.locator('#filmScore').get_attribute('src').split(',', 1)[1]
    (folder / 'score.m4a').write_bytes(base64.b64decode(score, validate=True))
    args = ['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-f', 'image2pipe', '-c:v', 'mjpeg',
            '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'fast',
            '-pix_fmt', 'yuvj420p', '-video_track_timescale', '12288', str(folder / 'archive.mp4')]
    with subprocess.Popen(args, stdin=subprocess.PIPE) as encoder:
        for frame in range(int(probe['nb_frames']), frame_count):
            data = base64.b64decode(page.evaluate('i => filmShot(i / 24)', frame))
            encoder.stdin.write(data)
            if frame == 516:
                (folder / 'cover.jpg').write_bytes(data)
        encoder.stdin.close()
        if encoder.wait():
            raise RuntimeError('Failed to encode the archive shots.')
    browser.close()
    if errors:
        raise RuntimeError(errors)
    ffmpeg(['-i', str(opening), '-map', '0:v:0', '-c:v', 'copy', str(folder / 'opening.mp4')])
    edit = folder / 'shots.txt'
    edit.write_text("file 'opening.mp4'\nfile 'archive.mp4'\n")
    rendered = folder / 'film.mp4'
    ffmpeg(['-f', 'concat', '-safe', '1', '-i', str(edit), '-i', str(folder / 'score.m4a'),
            '-map', '0:v', '-map', '1:a', '-c', 'copy', '-movflags', '+faststart', str(rendered)])
    rendered.replace(output)
    (folder / 'cover.jpg').replace(assets.parent / '奇虾_横屏封面.jpg')

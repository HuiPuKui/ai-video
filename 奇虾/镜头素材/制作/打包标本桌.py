"""Prepare the archival materials and the continuous soundtrack for the offline film."""
from base64 import b64encode
from io import BytesIO
from pathlib import Path
import json
import subprocess
from PIL import Image, ImageOps


def archive_tags(assets):
    layers = assets / '可动图层'
    originals = assets / '来源原图'
    desk = ImageOps.grayscale(Image.open(assets / '底图/桌面.png'))
    desk = ImageOps.fit(desk, (1536, 864), Image.Resampling.LANCZOS)
    green = ImageOps.colorize(desk, '#14251d', '#37493d', blackpoint=53, whitepoint=228)
    paper = ImageOps.colorize(desk, '#c9c7b7', '#ede9dc', blackpoint=62, whitepoint=236)
    vellum = ImageOps.colorize(desk, '#b9ab8e', '#e6ddbf', blackpoint=57, whitepoint=231)
    whole = Image.open(next(originals.glob('04_*'))).transpose(Image.Transpose.ROTATE_90)
    curved = Image.open(next(originals.glob('07_*')))
    curved.thumbnail((1840, 1400), Image.Resampling.LANCZOS)
    sea = Image.open(assets / '底图/寒武纪海底.png').convert('RGB')
    red, green_water, blue = sea.split()
    sea = Image.merge('RGB', (red, green_water, Image.blend(red, blue, .48)))
    sources = {
        'green': green, 'paper': paper, 'vellum': vellum,
        'slab': Image.open(layers / '01_附肢石板.png'),
        'pencil': Image.open(layers / '01_铅笔.png'),
        'plate': Image.open(next(originals.glob('02_*'))),
        'head': Image.open(next(originals.glob('03_*'))),
        'whole': whole, 'spines': Image.open(next(originals.glob('06_*'))),
        'curved': curved, 'anatomy': Image.open(next(originals.glob('08_*'))),
        'restoration': Image.open(next(originals.glob('05_*'))),
        'sea': sea,
    }
    tags = []
    for key, image in sources.items():
        data = BytesIO()
        image.save(data, 'WEBP', quality=94, method=5)
        encoded = b64encode(data.getvalue()).decode('ascii')
        tags.append(f'<script type="application/octet-stream" data-archive="{key}">{encoded}</script>')
    return ''.join(tags)


def film_score(music, folder):
    score = Path(folder) / 'full.m4a'
    cuts = json.loads(Path(__file__).with_name('全片时间.json').read_text())
    # The pencil touches the plate at 24.40 s and lifts at 25.15 s.
    sound = (
        f"[0:a]atrim=duration={cuts['end']},volume=-3.9dB,"
        f"volume='1-0.42*max(0,1-abs(t-{cuts['head']+2.4})/0.33)':eval=frame,"
        f"afade=t=in:d=0.08,afade=t=out:st={cuts['end']-1}:d=1[music];"
        "anoisesrc=color=pink:duration=0.75:sample_rate=48000:seed=84,"
        "highpass=f=1300,lowpass=f=5800,tremolo=f=17:d=0.6,volume=0.21,"
        "afade=t=in:d=0.06,afade=t=out:st=0.63:d=0.12,adelay=24400[scratch];"
        "[music][scratch]amix=inputs=2:duration=first:normalize=0"
    )
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(music), '-filter_complex', sound,
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(score)], check=True)
    return b64encode(score.read_bytes()).decode('ascii')

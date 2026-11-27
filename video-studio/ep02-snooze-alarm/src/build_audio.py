import json
import math
import subprocess
import wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
TIMELINE_PATH = ROOT / "src" / "timeline.json"
OUT_WAV = AUDIO_DIR / "master_mix.wav"
OUT_AAC = AUDIO_DIR / "master_mix.m4a"

SR = 48000
FPS = 30


def find_bgm_wav(name: str, mp3_fallback: str) -> Path:
    for c in [AUDIO_DIR / "bgm" / name, ROOT.parent / "ep01-phone-heat" / "audio" / "bgm" / name]:
        if c.exists():
            return c
    for mp3 in [AUDIO_DIR / "bgm" / mp3_fallback, ROOT.parent / "ep01-phone-heat" / "audio" / "bgm" / mp3_fallback]:
        if mp3.exists():
            out_wav = AUDIO_DIR / "bgm" / name
            out_wav.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(
                ["ffmpeg", "-y", "-i", str(mp3), "-ar", "48000", "-ac", "2", str(out_wav)],
                check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            return out_wav
    raise FileNotFoundError(f"Cannot find {name} or {mp3_fallback}")


def read_wav_stereo(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as wf:
        n_ch = wf.getnchannels()
        raw = wf.readframes(wf.getnframes())
        data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        return data.reshape(-1, 2) if n_ch == 2 else np.stack([data, data], axis=1)


def write_wav_stereo(path: Path, audio: np.ndarray):
    pcm = (np.clip(audio, -0.98, 0.98) * 32767.0).astype(np.int16)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())


def lowpass(x: np.ndarray, cutoff_hz: float) -> np.ndarray:
    freqs = np.fft.rfftfreq(len(x), d=1.0 / SR)
    H = 1.0 / np.sqrt(1.0 + (freqs / max(cutoff_hz, 20.0)) ** 4)
    return np.fft.irfft(np.fft.rfft(x) * H, n=len(x)).astype(np.float32)


def bandpass(x: np.ndarray, low_hz: float, high_hz: float) -> np.ndarray:
    freqs = np.fft.rfftfreq(len(x), d=1.0 / SR)
    H_lo = 1.0 / np.sqrt(1.0 + (max(low_hz, 10.0) / np.maximum(freqs, 1.0)) ** 4)
    H_hi = 1.0 / np.sqrt(1.0 + (freqs / max(high_hz, 50.0)) ** 4)
    return np.fft.irfft(np.fft.rfft(x) * H_lo * H_hi, n=len(x)).astype(np.float32)


def add_stereo(buf: np.ndarray, start_s: float, sig: np.ndarray, gain: float = 1.0, pan: float = 0.0):
    i0 = int(round(start_s * SR))
    if i0 < 0 or i0 >= len(buf):
        return
    stereo = sig * gain if sig.ndim == 2 else np.stack([sig * gain * math.sqrt(0.5 * (1.0 - pan)), sig * gain * math.sqrt(0.5 * (1.0 + pan))], axis=1)
    n = min(len(stereo), len(buf) - i0)
    if n > 0:
        buf[i0 : i0 + n] += stereo[:n]


def synth_alarm_beep(dur=0.58, pitch_hz=2050.0) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    gate = lowpass(((t % 0.14) < 0.072).astype(np.float32), 140.0)
    return ((np.sin(2 * np.pi * pitch_hz * t) + 0.32 * np.sin(2 * np.pi * pitch_hz * 1.5 * t)) * gate * 0.30).astype(np.float32)


def synth_slap(dur=0.16) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    rng = np.random.default_rng(12)
    snap = bandpass(rng.standard_normal(len(t)).astype(np.float32), 750.0, 5800.0) * np.exp(-t * 36.0)
    thump = np.sin(2 * np.pi * (260.0 * np.exp(-t * 25.0) + 65.0) * t) * np.exp(-t * 22.0)
    return (np.tanh((snap * 1.15 + thump * 0.90) * 1.45) * 0.72).astype(np.float32)


def synth_pop_x2(dur=0.16, pitch_mult=1.0) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    f = (520.0 + 780.0 * (1.0 - np.exp(-t * 26.0))) * pitch_mult
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18.0) * 0.42).astype(np.float32)


def synth_whoosh(dur=0.18) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    rng = np.random.default_rng(88)
    n = bandpass(rng.standard_normal(len(t)).astype(np.float32), 550.0, 3800.0)
    return (n * (np.sin(np.pi * t / dur) ** 1.4) * 0.30).astype(np.float32)


def synth_sub_boom(dur=1.25, f0=135.0, f1=28.0) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    freq = f1 + (f0 - f1) * np.exp(-t * 6.5)
    sub = np.sin(2.0 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 2.6)
    punch = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30.0) * 0.48
    rng = np.random.default_rng(42)
    rumble = lowpass(rng.standard_normal(len(t)).astype(np.float32), 190.0) * np.exp(-t * 3.0) * 0.48
    env = np.minimum(1.0, t / 0.005) * np.minimum(1.0, (dur - t) / 0.12)
    return (np.tanh((sub + punch + rumble) * 1.45) * 0.85 * env).astype(np.float32)


def synth_glass_shatter(dur=1.25) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    rng = np.random.default_rng(303)
    out = np.zeros_like(t)
    for _ in range(36):
        onset = rng.uniform(0.0, 0.24)
        f = rng.uniform(2500.0, 8400.0)
        decay = rng.uniform(14.0, 34.0)
        mask = t >= onset
        dt = t[mask] - onset
        out[mask] += np.sin(2 * np.pi * f * dt) * np.exp(-dt * decay) * rng.uniform(0.04, 0.12)
    return (out + synth_sub_boom(dur, 145.0, 32.0) * 0.78).astype(np.float32)


def synth_ufo_zip(dur=0.95) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    u = t / dur
    f = 440.0 + 180.0 * np.sin(2 * np.pi * 12 * t) + 2100.0 * (u ** 2.6)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * (np.sin(np.pi * u) ** 0.7) * 0.36).astype(np.float32)


def synth_record_stop(dur=0.22) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    freq = 780.0 * np.exp(-t * 15.0) + 45.0
    env = np.minimum(1.0, t / 0.008) * np.exp(-t * 9.0)
    return (np.sin(2 * np.pi * np.cumsum(freq) / SR) * env * 0.58).astype(np.float32)


def synth_battery_die(dur=0.52) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    out = np.zeros_like(t)
    for onset, f0, f1 in [(0.0, 920.0, 700.0), (0.14, 660.0, 440.0), (0.28, 420.0, 210.0)]:
        mask = t >= onset
        dt = t[mask] - onset
        f = f0 + (f1 - f0) * np.minimum(1.0, dt / 0.14)
        out[mask] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-dt * 12.0) * 0.35
    return out.astype(np.float32)


def synth_huh_question(dur=0.40) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    out = np.zeros_like(t)
    for onset, f0, f1 in [(0.0, 460.0, 680.0), (0.12, 600.0, 920.0)]:
        mask = t >= onset
        dt = t[mask] - onset
        f = f0 + (f1 - f0) * np.minimum(1.0, dt / 0.10)
        out[mask] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-dt * 11.0) * 0.38
    return out.astype(np.float32)


def extract_clean_heavy_hits(audio_stereo: np.ndarray, total_frames: int):
    """Extract ONLY strong, clean musical phrase downbeats (separated >= 0.85s so ZERO jittery spasms!)
    plus a silky-smooth musical energy curve."""
    mono = audio_stereo.mean(axis=1)
    hop = SR // FPS
    bass_raw = np.zeros(total_frames, dtype=np.float32)
    flux_raw = np.zeros(total_frames, dtype=np.float32)
    prev_mag = None
    win_fn = np.hanning(2048).astype(np.float32)

    for f in range(total_frames):
        i0 = f * hop
        win = mono[i0 : i0 + 2048]
        if len(win) < 2048:
            win = np.pad(win, (0, 2048 - len(win)))
        spec = np.abs(np.fft.rfft(win * win_fn))
        bass_raw[f] = float(np.sqrt(np.mean(spec[1:10] ** 2)))
        if prev_mag is not None:
            flux_raw[f] = float(np.sum(np.maximum(0.0, spec[:100] - prev_mag[:100])))
        prev_mag = spec

    # Select ONLY major phrase downbeats (minimum spacing = 26 frames ≈ 0.87s -> super clean, zero seizure!)
    heavy_peaks = []
    heavy_env = np.zeros(total_frames, dtype=np.float32)
    local_r = 24
    for f in range(3, total_frames - 3):
        lo = max(0, f - local_r)
        hi = min(total_frames, f + local_r)
        mu = float(np.mean(flux_raw[lo:hi]))
        sd = float(np.std(flux_raw[lo:hi])) + 1e-6
        if flux_raw[f] > mu + 1.45 * sd and flux_raw[f] >= flux_raw[f - 1] and flux_raw[f] >= flux_raw[f + 1]:
            if not heavy_peaks or (f - heavy_peaks[-1]) >= 26:
                heavy_peaks.append(f)
                for df in range(0, min(9, total_frames - f)):
                    val = math.exp(-df * 0.48)
                    if val > heavy_env[f + df]:
                        heavy_env[f + df] = val

    # Smooth groove curve (10-frame moving average) for silky breathing effects
    b95 = float(np.percentile(bass_raw, 95)) + 1e-6
    bass_norm = np.clip(bass_raw / b95, 0.0, 1.0)
    kernel = np.ones(10, dtype=np.float32) / 10.0
    groove_smooth = np.convolve(bass_norm, kernel, mode="same")
    return heavy_peaks, heavy_env, groove_smooth


def snap_to_peak(target_s: float, peak_times: list[float], max_shift: float = 0.65) -> float:
    best = target_s
    best_d = max_shift
    for pt in peak_times:
        d = abs(pt - target_s)
        if d < best_d:
            best_d = d
            best = pt
    return round(best, 3)


def main():
    HALL_START = 75.5
    HALL_DUR = 54.0
    TWIST_DUR = 7.6
    TOTAL_DUR = round(HALL_DUR + TWIST_DUR, 3)
    total_frames = int(round(TOTAL_DUR * FPS))
    n_samples = int(math.ceil(TOTAL_DUR * SR))

    hall = read_wav_stereo(find_bgm_wav("hall_48k.wav", "hall_of_the_mountain_king.mp3"))
    sneaky = read_wav_stereo(find_bgm_wav("sneaky_48k.wav", "sneaky_snitch.mp3"))

    bgm = np.zeros((n_samples, 2), dtype=np.float32)
    i0 = int(round(HALL_START * SR))
    n_cut = int(round((HALL_DUR - 0.04) * SR))
    hall_seg = hall[i0 : i0 + n_cut].copy()

    t_axis = np.linspace(0.0, 1.0, len(hall_seg), dtype=np.float32)
    level_curve = 1.40 * (1.0 - t_axis) ** 1.4 + 0.85 * (1.0 - (1.0 - t_axis) ** 1.4)
    hall_seg *= level_curve[:, None]
    hall_rms = float(np.sqrt(np.mean(hall_seg ** 2)) + 1e-6)
    hall_seg *= 0.22 / hall_rms
    hall_seg[: int(0.05 * SR)] *= np.linspace(0.0, 1.0, int(0.05 * SR))[:, None]
    hall_seg[-int(0.03 * SR) :] *= np.linspace(1.0, 0.0, int(0.03 * SR))[:, None]
    bgm[: len(hall_seg)] = hall_seg

    heavy_peaks, heavy_env, groove_smooth = extract_clean_heavy_hits(bgm[: int(HALL_DUR * SR)], int(round(HALL_DUR * FPS)))
    peak_times = [round(f / FPS, 3) for f in heavy_peaks]

    raw_beats = [
        {"id": "b00_conflict", "act": "dorm_alarm", "target": 0.0, "step_idx": 1, "snooze_start": 1, "snooze_end": 1, "db_start": 70, "db_end": 70, "display_t": "按贪睡 1 次", "power_label": "70 分贝", "compare_line": "≈ 普通手机闹钟", "rule_pill": "每按一次贪睡 声强 ×2", "fast_tag": "", "show_intro_title": True, "subtitle": "<hl>07:50 早八高数！</hl> 啪——稍后提醒", "sfx": "alarm_slap", "slap_cfg": {"mode": "intro", "count": 1, "interval": 1.15, "start_offset": 1.85}},
        {"id": "b01_rule", "act": "dorm_mate_yell", "target": 4.2, "step_idx": 2, "snooze_start": 1, "snooze_end": 2, "db_start": 70, "db_end": 73, "display_t": "按贪睡 2 次", "power_label": "73 分贝", "compare_line": "全寝室崩溃！", "rule_pill": "每按一次贪睡 声强 ×2", "fast_tag": "", "subtitle": "室友们：<hl>快关了！还让不让睡！</hl>", "sfx": "alarm_pop", "slap_cfg": {"mode": "lead", "count": 1, "interval": 0.88, "start_offset": 0.0}},
        {"id": "b02_drill", "act": "dorm_bounce", "target": 8.4, "step_idx": 3, "snooze_start": 2, "snooze_end": 5, "db_start": 73, "db_end": 85, "display_t": "按贪睡 5 次", "power_label": "85 分贝", "compare_line": "≈ 贴脸装修电钻", "rule_pill": "每按一次贪睡 声强 ×2", "fast_tag": "", "subtitle": "床铺与书架<hl>原地蹦迪</hl>", "sfx": "bass_bounce", "slap_cfg": {"mode": "lead", "count": 2, "interval": 0.52, "start_offset": 0.0}},
        {"id": "b03_auntie", "act": "dorm_auntie", "target": 13.0, "step_idx": 4, "snooze_start": 5, "snooze_end": 10, "db_start": 85, "db_end": 100, "display_t": "按贪睡 10 次", "power_label": "100 分贝", "compare_line": "≈ 地铁贴脸进站", "rule_pill": "每按一次贪睡 声强 ×2", "fast_tag": "⚡ ×1,024倍", "subtitle": "宿管阿姨踹门：<hl>谁的闹钟！</hl>", "sfx": "door_kick_slap", "slap_cfg": {"mode": "lead", "count": 2, "interval": 0.44, "start_offset": 0.0}},
        {"id": "b04_afro", "act": "dorm_afro", "target": 18.2, "step_idx": 5, "snooze_start": 10, "snooze_end": 20, "db_start": 100, "db_end": 130, "display_t": "按贪睡 20 次", "power_label": "130 分贝", "compare_line": "≈ 战斗机贴脸起飞", "rule_pill": "每按一次贪睡 声强 ×2", "fast_tag": "⚡ ×100万倍", "subtitle": "宿管与室友<hl>当场吹成爆炸头</hl>", "sfx": "glass_sonic", "slap_cfg": {"mode": "lead", "count": 3, "interval": 0.34, "start_offset": 0.0}},
        {"id": "b05_campus", "act": "campus_lift", "target": 23.6, "step_idx": 6, "snooze_start": 20, "snooze_end": 30, "db_start": 130, "db_end": 160, "display_t": "按贪睡 30 次", "power_label": "160 分贝", "compare_line": "≈ 火箭点火起飞", "rule_pill": "每按一次贪睡 声强 ×2", "fast_tag": "▶▶ 声波失控", "subtitle": "整栋四号楼<hl>连床带人原地起飞</hl>", "sfx": "sonic_boom", "slap_cfg": {"mode": "lead", "count": 3, "interval": 0.29, "start_offset": 0.0}},
        {"id": "b06_stubborn", "act": "dorm_stubborn", "target": 29.0, "step_idx": 7, "snooze_start": 30, "snooze_end": 35, "db_start": 160, "db_end": 175, "display_t": "按贪睡 35 次", "power_label": "175 分贝", "compare_line": "全校提前放假", "rule_pill": "每按一次贪睡 声强 ×2", "fast_tag": "▶▶ 连拍加速", "subtitle": "小酒：<hl>再睡五分钟……</hl>", "sfx": "rapid_solo", "slap_cfg": {"mode": "solo", "count": 7, "interval": 0.38, "interval_end": 0.20, "start_offset": 0.15}},
        {"id": "b07_194db", "act": "city_shockwave", "target": 32.6, "step_idx": 8, "snooze_start": 35, "snooze_end": 41, "db_start": 175, "db_end": 194, "display_t": "按贪睡 41 次", "power_label": "194 分贝", "compare_line": "地球大气声音物理极限！", "rule_pill": "空气极限 · 转为冲击波", "fast_tag": "⚠ 物理极限", "subtitle": "<hl>194 分贝！</hl> 突破空气极限震碎全城玻璃", "sfx": "city_wave", "slap_cfg": {"mode": "lead", "count": 4, "interval": 0.22, "start_offset": 0.0}},
        {"id": "b08_pillows", "act": "city_pillows", "target": 38.6, "step_idx": 9, "snooze_start": 41, "snooze_end": 43, "db_start": 194, "db_end": 194, "display_t": "按贪睡 43 次", "power_label": "冲击波模式", "compare_line": "全城枕头闹钟卷上天", "rule_pill": "空气极限 · 转为冲击波", "fast_tag": "⚠ 冲击波", "subtitle": "全城早高峰，<hl>提前一小时集体清醒</hl>", "sfx": "sonic_boom", "slap_cfg": {"mode": "lead", "count": 4, "interval": 0.19, "start_offset": 0.0}},
        {"id": "b09_space", "act": "space_pointer", "target": 43.2, "step_idx": 9, "snooze_start": 43, "snooze_end": 45, "db_start": 194, "db_end": 194, "display_t": "按贪睡 45 次", "power_label": "能量 ×35万亿", "compare_line": "空间站宇航员捂紧耳朵", "rule_pill": "空气极限 · 转为冲击波", "fast_tag": "🛸 宇宙警报", "subtitle": "从太空都看得见<hl>地面声波闪光</hl>", "sfx": "space_ping", "slap_cfg": {"mode": "lead", "count": 5, "interval": 0.16, "start_offset": 0.0}},
        {"id": "b10_alien", "act": "space_alien", "target": 48.2, "step_idx": 10, "snooze_start": 45, "snooze_end": 46, "db_start": 194, "db_end": 194, "display_t": "按贪睡 46 次", "power_label": "外星舰队跑路", "compare_line": "早八铃声击退入侵", "rule_pill": "地球已成功获救", "fast_tag": "🛸 地球获救", "subtitle": "外星舰队听见早八，<hl>连夜光速逃跑</hl>", "sfx": "ufo_flee", "slap_cfg": {"mode": "lead", "count": 6, "interval": 0.14, "start_offset": 0.0}},
        {"id": "b11_twist", "act": "dorm_saturday", "target": HALL_DUR, "step_idx": 10, "snooze_start": 46, "snooze_end": 46, "db_start": 0, "db_end": 0, "display_t": "闹钟没电了", "power_label": "今天星期六", "compare_line": "早八：根本没课！", "rule_pill": "白按 46 次贪睡", "fast_tag": "", "subtitle": "<hl>今天星期六，根本没早八！</hl><br/>你最多按过几次贪睡？评论区报数！", "pre_delay": 1.15, "sfx": "twist_saturday"},
    ]

    starts = [0.0 if idx == 0 else (HALL_DUR if b["act"] == "dorm_saturday" else snap_to_peak(b["target"], peak_times)) for idx, b in enumerate(raw_beats)]
    beats = []
    for idx, b in enumerate(raw_beats):
        st = starts[idx]
        ed = TOTAL_DUR if idx == len(raw_beats) - 1 else starts[idx + 1]
        dur = round(ed - st, 3)
        cfg = b.get("slap_cfg")
        slap_window = None
        if cfg:
            cnt = cfg["count"]
            iv0 = cfg["interval"]
            iv1 = cfg.get("interval_end", iv0)
            cur = cfg["start_offset"]
            slaps = []
            for k in range(cnt):
                frac = k / max(cnt - 1, 1)
                iv = iv0 + (iv1 - iv0) * frac
                hit_local = cur + iv * 0.56
                if cur + iv <= dur - 0.15:
                    slaps.append({
                        "start": round(cur, 3),
                        "hit": round(hit_local, 3),
                        "end": round(cur + iv, 3),
                        "dur": round(iv, 3),
                        "cam_idx": (idx + k) % 3,
                    })
                    cur += iv
            slap_window = {
                "mode": cfg["mode"],
                "start": slaps[0]["start"] if slaps else 0.0,
                "end": slaps[-1]["end"] if slaps else 0.0,
                "slaps": slaps,
            }
        beat_obj = {k: v for k, v in b.items() if k != "slap_cfg"}
        beat_obj.update({"index": idx, "start": round(st, 3), "end": round(ed, 3), "duration": dur, "slap_window": slap_window})
        beats.append(beat_obj)

    outro_start = HALL_DUR + 1.10
    outro_i0 = int(round(outro_start * SR))
    outro_len = max(0, n_samples - outro_i0)
    if outro_len > 0:
        sn_seg = sneaky[int(0.25 * SR) : int(0.25 * SR) + outro_len].copy()
        sn_seg *= 0.17 / (float(np.sqrt(np.mean(sn_seg ** 2))) + 1e-6)
        sn_seg[: int(0.14 * SR)] *= np.linspace(0.0, 1.0, int(0.14 * SR))[:, None]
        sn_seg[-int(0.45 * SR) :] *= np.linspace(1.0, 0.0, int(0.45 * SR))[:, None]
        bgm[outro_i0 : outro_i0 + len(sn_seg)] += sn_seg

    sfx_track = np.zeros((n_samples, 2), dtype=np.float32)
    for b in beats:
        t0, dur, sfx = b["start"], b["duration"], b["sfx"]
        sw = b.get("slap_window")
        main_start = t0 + (sw["end"] if (sw and sw["mode"] == "lead") else 0.0)

        # Crisp slap + rising-pitch x2 pop SFX on EVERY SINGLE escalating slap!
        if sw and sw["slaps"]:
            if sw["mode"] == "lead":
                add_stereo(sfx_track, max(0.0, t0 - 0.05), synth_whoosh(0.12), gain=0.40)
            for k, sl in enumerate(sw["slaps"]):
                pitch = 1.0 + 0.045 * b["index"] + 0.04 * k
                add_stereo(sfx_track, t0 + sl["hit"], synth_slap(0.14), gain=0.88)
                add_stereo(sfx_track, t0 + sl["hit"] + 0.03, synth_pop_x2(0.14, pitch_mult=min(pitch, 1.85)), gain=0.66)
            if sw["mode"] == "lead":
                add_stereo(sfx_track, max(0.0, main_start - 0.05), synth_whoosh(0.14), gain=0.46)

        if sfx == "alarm_slap":
            add_stereo(sfx_track, t0 + 0.04, synth_alarm_beep(0.55, 2050.0), gain=0.72)
        elif sfx == "alarm_pop":
            add_stereo(sfx_track, main_start + 0.02, synth_alarm_beep(0.42, 2200.0), gain=0.62)
        elif sfx == "bass_bounce":
            add_stereo(sfx_track, main_start, synth_sub_boom(0.85, 120.0, 36.0), gain=0.62)
        elif sfx == "door_kick_slap":
            add_stereo(sfx_track, main_start, synth_sub_boom(0.75, 140.0, 42.0), gain=0.82)
        elif sfx == "glass_sonic":
            add_stereo(sfx_track, main_start, synth_glass_shatter(1.30), gain=0.88)
        elif sfx == "sonic_boom":
            add_stereo(sfx_track, main_start, synth_sub_boom(1.45, 160.0, 26.0), gain=0.88)
        elif sfx == "city_wave":
            add_stereo(sfx_track, main_start, synth_sub_boom(1.75, 175.0, 24.0), gain=0.95)
        elif sfx == "space_ping":
            add_stereo(sfx_track, main_start, synth_sub_boom(1.15, 140.0, 30.0), gain=0.72)
        elif sfx == "ufo_flee":
            rem = max(0.5, (t0 + dur) - main_start)
            add_stereo(sfx_track, main_start + rem * 0.52, synth_ufo_zip(1.05), gain=0.85)
        elif sfx == "twist_saturday":
            add_stereo(sfx_track, max(0.0, t0 - 0.06), synth_record_stop(0.22), gain=0.82)
            add_stereo(sfx_track, t0 + 0.22, synth_battery_die(0.52), gain=0.85)
            add_stereo(sfx_track, t0 + 0.85, synth_huh_question(0.40), gain=0.76)

    mix = np.tanh((bgm * 0.92 + sfx_track * 0.72) * 0.96) / 0.96
    write_wav_stereo(OUT_WAV, mix)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(OUT_WAV), "-af", "loudnorm=I=-14:TP=-1.2:LRA=9", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", str(OUT_AAC)],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )

    full_heavy = np.zeros(total_frames, dtype=np.float32)
    full_groove = np.zeros(total_frames, dtype=np.float32)
    n_h = min(total_frames, len(heavy_env))
    full_heavy[:n_h] = heavy_env[:n_h]
    full_groove[:n_h] = groove_smooth[:n_h]

    tl = {
        "total_duration": TOTAL_DUR,
        "fps": FPS,
        "no_tts": True,
        "beats": beats,
        "heavy_peaks": peak_times,
        "heavy_frames": [round(float(x), 3) for x in full_heavy],
        "groove_frames": [round(float(x), 3) for x in full_groove],
    }
    TIMELINE_PATH.write_text(json.dumps(tl, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"EP02 v2 CLEAN HEAVY-ACCENT AUDIO READY: {OUT_AAC} ({TOTAL_DUR:.2f}s, {len(peak_times)} clean major hits!)")


if __name__ == "__main__":
    main()

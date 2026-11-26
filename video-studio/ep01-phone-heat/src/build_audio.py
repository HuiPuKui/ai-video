import json
import math
import subprocess
import wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "audio"
TIMELINE_PATH = ROOT / "src" / "timeline.json"
OUT_WAV = ROOT / "audio" / "master_mix.wav"
OUT_AAC = ROOT / "audio" / "master_mix.m4a"

SR = 48000
BPM = 124.0
BEAT_SEC = 60.0 / BPM  # 0.48387s per quarter-note beat


def read_wav_stereo(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as wf:
        n_ch = wf.getnchannels()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)
        data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        if n_ch == 2:
            return data.reshape(-1, 2)
        return np.stack([data, data], axis=1)


def write_wav_stereo(path: Path, audio: np.ndarray):
    clipped = np.clip(audio, -0.98, 0.98)
    pcm = (clipped * 32767.0).astype(np.int16)
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
    if sig.ndim == 1:
        gl = gain * math.sqrt(0.5 * (1.0 - pan))
        gr = gain * math.sqrt(0.5 * (1.0 + pan))
        stereo = np.stack([sig * gl, sig * gr], axis=1)
    else:
        stereo = sig * gain
    n = min(len(stereo), len(buf) - i0)
    if n > 0:
        buf[i0 : i0 + n] += stereo[:n]


# --- MUSICAL INSTRUMENTS (CLEAN, MODERN, STUDIO-FEEL) ---
def synth_marimba(freq: float, dur=0.28) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    # Warm wooden marimba fundamental + 4th harmonic click
    sig = (
        np.sin(2 * np.pi * freq * t) * np.exp(-t * 11.5)
        + 0.28 * np.sin(2 * np.pi * freq * 3.98 * t) * np.exp(-t * 32.0)
        + 0.12 * np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t * 18.0)
    )
    env = np.minimum(1.0, t / 0.004)
    return (sig * env * 0.42).astype(np.float32)


def synth_pluck_bass(freq: float, dur=0.24) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    saw = (2.0 * ((t * freq) % 1.0) - 1.0) * 0.45 + np.sin(2 * np.pi * freq * t) * 0.75
    filt = lowpass(saw.astype(np.float32), 420.0)
    env = np.minimum(1.0, t / 0.006) * np.exp(-t * 9.0)
    return (filt * env * 0.55).astype(np.float32)


def synth_kick(punch=1.0) -> np.ndarray:
    dur = 0.24
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    freq = 44.0 + (125.0 * punch) * np.exp(-t * 28.0)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t * 12.5)
    click = np.sin(2 * np.pi * 1200 * t) * np.exp(-t * 120.0) * 0.22
    return (np.tanh((body + click) * 1.35) * 0.52).astype(np.float32)


def synth_snare(epic=False) -> np.ndarray:
    dur = 0.26 if epic else 0.14
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    rng = np.random.default_rng(19)
    n = bandpass(rng.standard_normal(len(t)).astype(np.float32), 900.0, 6800.0)
    tone = np.sin(2 * np.pi * (165.0 if epic else 210.0) * t) * np.exp(-t * 24.0) * 0.45
    decay = 11.0 if epic else 26.0
    return ((n * np.exp(-t * decay) * (0.48 if epic else 0.30) + tone) * 0.75).astype(np.float32)


def synth_hihat(open_hat=False) -> np.ndarray:
    dur = 0.14 if open_hat else 0.045
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    rng = np.random.default_rng(77)
    n = bandpass(rng.standard_normal(len(t)).astype(np.float32), 6200.0, 12500.0)
    return (n * np.exp(-t * (18.0 if open_hat else 72.0)) * 0.18).astype(np.float32)


def synth_epic_brass(freq: float, dur=1.85) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    # Lush detuned Hans-Zimmer hybrid brass stack
    s = np.zeros_like(t)
    for det in (-0.006, 0.0, 0.007, 1.0):
        f = freq * (2.0 if det == 1.0 else 1.0 + det)
        saw = 2.0 * ((t * f) % 1.0) - 1.0
        s += saw * (0.20 if det == 1.0 else 0.30)
    s += np.sin(2 * np.pi * (freq * 0.5) * t) * 0.45  # sub brass weight
    filt = lowpass(s.astype(np.float32), 680.0)
    env = np.minimum(1.0, t / 0.14) * np.minimum(1.0, (dur - t) / 0.28)
    return (np.tanh(filt * 1.15) * env * 0.34).astype(np.float32)


def synth_string_arp(freq: float, dur=0.30) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    sig = (
        np.sin(2 * np.pi * freq * t) * 0.55
        + np.sin(2 * np.pi * freq * 2.002 * t) * 0.25
        + np.sin(2 * np.pi * freq * 3.0 * t) * 0.10
    )
    env = np.minimum(1.0, t / 0.012) * np.exp(-t * 7.5)
    return (sig * env * 0.24).astype(np.float32)


# --- CINEMATIC SFX ---
def synth_sub_boom(dur=1.4, f0=115.0, f1=30.0) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    freq = f1 + (f0 - f1) * np.exp(-t * 6.5)
    phase = 2.0 * np.pi * np.cumsum(freq) / SR
    sub = np.sin(phase) * np.exp(-t * 2.4)
    punch = np.sin(2 * np.pi * 165 * t) * np.exp(-t * 28.0) * 0.45
    rng = np.random.default_rng(42)
    rumble = lowpass(rng.standard_normal(len(t)).astype(np.float32), 180.0) * np.exp(-t * 2.8) * 0.55
    sig = np.tanh((sub + punch + rumble) * 1.45) * 0.85
    env = np.minimum(1.0, t / 0.006) * np.minimum(1.0, (dur - t) / 0.15)
    return (sig * env).astype(np.float32)


def synth_whoosh_cut(dur=0.22) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    rng = np.random.default_rng(88)
    n = bandpass(rng.standard_normal(len(t)).astype(np.float32), 450.0, 3200.0)
    env = np.sin(np.pi * (t / dur)) ** 1.4
    return (n * env * 0.32).astype(np.float32)


def synth_riser(dur=2.2, f0=150.0, f1=1350.0) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    u = t / dur
    rng = np.random.default_rng(7)
    whoosh = bandpass(rng.standard_normal(len(t)).astype(np.float32), 280.0, 2600.0) * (u ** 2.1) * 0.52
    freq = f0 * ((f1 / f0) ** (u ** 1.6))
    phase = 2.0 * np.pi * np.cumsum(freq) / SR
    tone = (np.sin(phase) + 0.3 * np.sin(phase * 1.5)) * (u ** 1.8) * 0.22
    fade_out = np.minimum(1.0, (dur - t) / 0.05)
    return ((whoosh + tone) * fade_out).astype(np.float32)


def synth_sizzle(dur=1.6) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    rng = np.random.default_rng(101)
    hi = bandpass(rng.standard_normal(len(t)).astype(np.float32), 2600.0, 8500.0)
    env = np.minimum(1.0, t / 0.06) * np.exp(-t * 1.4)
    return (hi * env * 0.34).astype(np.float32)


def synth_fire_alarm(dur=2.0) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    gate = lowpass(((t % 0.40) < 0.15).astype(np.float32), 60.0)
    beep = (np.sin(2 * np.pi * 2850 * t) + 0.25 * np.sin(2 * np.pi * 5700 * t)) * gate * 0.15
    rng = np.random.default_rng(202)
    fire_roar = bandpass(rng.standard_normal(len(t)).astype(np.float32), 90.0, 650.0) * 0.34
    env = np.minimum(1.0, t / 0.08) * np.minimum(1.0, (dur - t) / 0.25)
    return ((beep + fire_roar) * env).astype(np.float32)


def synth_glass_shatter(dur=1.5) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    rng = np.random.default_rng(303)
    out = np.zeros_like(t)
    for _ in range(28):
        onset = rng.uniform(0.0, 0.32)
        f = rng.uniform(2200.0, 7800.0)
        decay = rng.uniform(14.0, 34.0)
        mask = t >= onset
        dt = t[mask] - onset
        out[mask] += np.sin(2 * np.pi * f * dt) * np.exp(-dt * decay) * rng.uniform(0.04, 0.12)
    return (out + synth_sub_boom(dur, 135.0, 32.0) * 0.85).astype(np.float32)


def synth_record_stop(dur=0.20) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    freq = 720.0 * np.exp(-t * 15.0) + 45.0
    phase = 2 * np.pi * np.cumsum(freq) / SR
    env = np.minimum(1.0, t / 0.008) * np.exp(-t * 9.0)
    return (np.sin(phase) * env * 0.48).astype(np.float32)


def synth_victory_chime(dur=1.2) -> np.ndarray:
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    notes = [(0.0, 523.25), (0.10, 659.25), (0.20, 783.99), (0.31, 1046.5)]
    out = np.zeros_like(t)
    for onset, f in notes:
        mask = t >= onset
        dt = t[mask] - onset
        out[mask] += (np.sin(2 * np.pi * f * dt) + 0.3 * np.sin(2 * np.pi * f * 2 * dt)) * np.exp(-dt * 4.8) * 0.22
    return out.astype(np.float32)


def synth_poof_vanish(dur=0.45) -> np.ndarray:
    """Comedic cartoon 'POOF!' sound synced to the phone vaporizing into smoke."""
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    rng = np.random.default_rng(777)
    puff = bandpass(rng.standard_normal(len(t)).astype(np.float32), 650.0, 3800.0)
    puff_env = np.minimum(1.0, t / 0.015) * np.exp(-t * 9.5)
    freq = 540.0 * np.exp(-t * 18.0) + 110.0
    pop = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 16.0) * 0.55
    return (puff * puff_env * 0.65 + pop).astype(np.float32)


def synth_huh_question(dur=0.45) -> np.ndarray:
    """Playful two-note 'huh?!' rising pluck synced to the floating ?? question marks."""
    t = np.linspace(0, dur, int(dur * SR), endpoint=False, dtype=np.float32)
    out = np.zeros_like(t)
    for onset, f0, f1 in [(0.0, 460.0, 660.0), (0.12, 580.0, 880.0)]:
        mask = t >= onset
        dt = t[mask] - onset
        f = f0 + (f1 - f0) * np.minimum(1.0, dt / 0.10)
        ph = 2 * np.pi * np.cumsum(f) / SR
        out[mask] += np.sin(ph) * np.exp(-dt * 11.0) * 0.36
    return out.astype(np.float32)


def build_four_phase_bgm(total_dur: float, phase2_t: float, phase3_t: float, twist_t: float) -> np.ndarray:
    n_samples = int(math.ceil(total_dur * SR))
    bgm = np.zeros((n_samples, 2), dtype=np.float32)

    # Catchy A-minor / C-major pop-science chord progression (Am -> F -> C -> G)
    # Frequencies (Hz):
    # A3=220, C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.0, A4=440.0, C5=523.25, D5=587.33, E5=659.25
    chords_bass = [110.0, 87.31, 130.81, 98.0]  # A2, F2, C3, G2
    marimba_patterns = [
        [440.0, 523.25, 659.25, 523.25, 587.33, 523.25, 440.0, 392.0],
        [349.23, 440.0, 523.25, 440.0, 587.33, 523.25, 440.0, 349.23],
        [523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 392.0, 523.25],
        [392.0, 493.88, 587.33, 493.88, 659.25, 587.33, 493.88, 392.0],
    ]
    epic_arps = [
        [440.0, 523.25, 659.25, 880.0],
        [349.23, 440.0, 523.25, 698.46],
        [392.0, 523.25, 659.25, 783.99],
        [392.0, 493.88, 587.33, 783.99],
    ]

    kick_soft = synth_kick(0.75)
    kick_hard = synth_kick(1.25)
    snare_tight = synth_snare(False)
    snare_epic = synth_snare(True)
    hat_c = synth_hihat(False)
    hat_o = synth_hihat(True)

    # Step through 8th-note grid (every half-beat = 0.2419s) for infectious groove!
    step_sec = BEAT_SEC / 2.0
    step_idx = 0
    cur = 0.0
    while cur < total_dur - 0.1:
        bar = (step_idx // 8) % 4
        pos = step_idx % 8  # 0..7 eighth-notes inside a bar

        # --- PHASE 1: PLAYFUL BOUNCY MARIMBA + POP-SCIENCE GROOVE (0 -> phase2_t) ---
        if cur < phase2_t:
            # Playful bouncy marimba melody on 8ths
            if pos in (0, 1, 2, 4, 5, 6):
                note = marimba_patterns[bar][pos]
                pan = -0.25 if pos % 2 == 0 else 0.25
                add_stereo(bgm, cur, synth_marimba(note, 0.26), gain=0.42, pan=pan)
            # Warm bouncy pluck bass
            if pos in (0, 3, 4, 6):
                add_stereo(bgm, cur, synth_pluck_bass(chords_bass[bar], 0.24), gain=0.45)
            # Tight clean beat (Kick on 0, 4 | Snare on 2, 6 | Hi-hat groove)
            if pos in (0, 4):
                add_stereo(bgm, cur, kick_soft, gain=0.55)
            if pos in (2, 6):
                add_stereo(bgm, cur, snare_tight, gain=0.48)
            add_stereo(bgm, cur, hat_o if pos == 7 else hat_c, gain=0.38, pan=0.18 if pos % 2 else -0.18)

        # --- PHASE 2: DRIVING TENSION SYNTH + RISING PERCUSSION (phase2_t -> phase3_t) ---
        elif cur < phase3_t:
            # Driving 8th-note bass pulse + urgent high marimba arpeggio
            add_stereo(bgm, cur, synth_pluck_bass(chords_bass[bar] * (1.0 if pos % 2 == 0 else 1.5), 0.20), gain=0.58)
            note = marimba_patterns[bar][pos]
            add_stereo(bgm, cur, synth_marimba(note, 0.20), gain=0.34, pan=-0.3 if pos % 2 == 0 else 0.3)
            if pos in (0, 3, 4):
                add_stereo(bgm, cur, kick_hard, gain=0.68)
            if pos in (2, 6):
                add_stereo(bgm, cur, snare_tight, gain=0.62)
            add_stereo(bgm, cur, hat_c, gain=0.48, pan=0.22 if pos % 2 else -0.22)
            # Snare roll build-up right before Phase 3!
            if cur > phase3_t - 1.6:
                add_stereo(bgm, cur, snare_tight, gain=0.45)
                add_stereo(bgm, cur + step_sec * 0.5, snare_tight, gain=0.42)

        # --- PHASE 3: EPIC HYBRID ORCHESTRAL BRASS + TAIKO DRUMS + STRINGS (phase3_t -> twist_t - 0.15) ---
        elif cur < twist_t - 0.15:
            # Massive Hans-Zimmer brass swell at the start of every bar!
            if pos == 0:
                add_stereo(bgm, cur, synth_epic_brass(chords_bass[bar], BEAT_SEC * 3.8), gain=0.72)
                add_stereo(bgm, cur, synth_epic_brass(chords_bass[bar] * 1.5, BEAT_SEC * 3.8), gain=0.35, pan=0.2)
            # Shimmering intense 16th/8th string arpeggio
            arp_note = epic_arps[bar][pos % 4]
            add_stereo(bgm, cur, synth_string_arp(arp_note, 0.26), gain=0.45, pan=-0.35 if pos % 2 == 0 else 0.35)
            # Driving bassline
            add_stereo(bgm, cur, synth_pluck_bass(chords_bass[bar], 0.22), gain=0.62)
            # Epic Taiko Kick + Cinematic Snare!
            if pos in (0, 2, 4, 5):
                add_stereo(bgm, cur, kick_hard, gain=0.82)
            if pos in (2, 6):
                add_stereo(bgm, cur, snare_epic, gain=0.75)
            add_stereo(bgm, cur, hat_o if pos in (3, 7) else hat_c, gain=0.45)

        # --- PHASE 4: COMEDIC DEAD SILENCE (THROUGH PHONE POOF!) -> PLAYFUL OUTRO GROOVE (twist_t + 1.45 -> end) ---
        elif cur > twist_t + 1.45:
            if pos in (0, 2, 4, 5, 6):
                note = marimba_patterns[bar][pos]
                add_stereo(bgm, cur, synth_marimba(note * 1.0, 0.26), gain=0.42, pan=-0.25 if pos % 2 == 0 else 0.25)
            if pos in (0, 4):
                add_stereo(bgm, cur, kick_soft, gain=0.45)
                add_stereo(bgm, cur, synth_pluck_bass(chords_bass[bar], 0.24), gain=0.38)
            if pos in (2, 6):
                add_stereo(bgm, cur, snare_tight, gain=0.38)

        cur += step_sec
        step_idx += 1

    # Hard comedic silence cut right before twist_t through the phone vaporize gag!
    cut_i = int(max(0, (twist_t - 0.08) * SR))
    resume_i = int(min(n_samples, (twist_t + 1.42) * SR))
    fade_n = int(0.04 * SR)
    if cut_i > fade_n:
        bgm[cut_i - fade_n : cut_i] *= np.linspace(1.0, 0.0, fade_n)[:, None]
        bgm[cut_i:resume_i] = 0.0

    # Clean smooth 0.35s tail fade-out at very end of video
    tail_n = int(min(n_samples, 0.35 * SR))
    if tail_n > 0:
        bgm[-tail_n:] *= np.linspace(1.0, 0.0, tail_n)[:, None]

    return bgm


def build_real_bgm(total_dur: float, twist_t: float, twist_speech_t: float) -> np.ndarray:
    """Assemble real studio orchestral BGM (Hall of the Mountain King climax-aligned)
    + dead comedic silence through phone vaporize gag + playful Sneaky Snitch outro!"""
    n_samples = int(math.ceil(total_dur * SR))
    bgm = np.zeros((n_samples, 2), dtype=np.float32)

    hall_path = AUDIO_DIR / "bgm" / "hall_48k.wav"
    sneaky_path = AUDIO_DIR / "bgm" / "sneaky_48k.wav"

    hall = read_wav_stereo(hall_path)
    sneaky = read_wav_stereo(sneaky_path)

    # Align Hall of the Mountain King so its exact frantic orchestral climax (129.5s)
    # lands right at twist_t - 0.04s (the end of 60s Magma Planet)!
    cut_t = max(1.0, twist_t - 0.05)
    hall_end_s = min(len(hall) / SR - 0.5, 129.5)
    hall_start_s = max(0.0, hall_end_s - cut_t)
    i_start = int(round(hall_start_s * SR))
    n_cut = int(round(cut_t * SR))
    hall_seg = hall[i_start : i_start + n_cut].copy()

    # Smooth dynamic leveling across the escalation arc:
    # lift the sneaky opening slightly so it's lively, keep the brass climax controlled under narration
    t_axis = np.linspace(0.0, 1.0, len(hall_seg), dtype=np.float32)
    level_curve = 1.48 * (1.0 - t_axis) ** 1.35 + 0.62 * (1.0 - (1.0 - t_axis) ** 1.35)
    hall_seg *= level_curve[:, None]

    # Gentle RMS normalize to consistent musical bed before ducking
    hall_rms = float(np.sqrt(np.mean(hall_seg ** 2)) + 1e-6)
    hall_seg *= 0.145 / hall_rms

    # Short clean fade-in at 0s and sharp comedic cut before record-stop
    fi = min(len(hall_seg), int(0.08 * SR))
    fo = min(len(hall_seg), int(0.04 * SR))
    if fi > 0:
        hall_seg[:fi] *= np.linspace(0.0, 1.0, fi)[:, None]
    if fo > 0:
        hall_seg[-fo:] *= np.linspace(1.0, 0.0, fo)[:, None]

    bgm[: len(hall_seg)] = hall_seg

    # Playful Sneaky Snitch sneaks in right as Xiaojiu drops the punchline + CTA!
    outro_start_t = max(twist_t + 0.95, twist_speech_t - 0.06)
    outro_i0 = int(round(outro_start_t * SR))
    outro_len = max(0, n_samples - outro_i0)
    if outro_len > 0:
        # Start Sneaky Snitch at 0.25s right on its recognizable pizzicato pickup
        sn_i0 = int(0.25 * SR)
        sn_seg = sneaky[sn_i0 : sn_i0 + outro_len].copy()
        sn_rms = float(np.sqrt(np.mean(sn_seg ** 2)) + 1e-6)
        sn_seg *= 0.135 / sn_rms
        sfi = min(len(sn_seg), int(0.18 * SR))
        sfo = min(len(sn_seg), int(0.45 * SR))
        if sfi > 0:
            sn_seg[:sfi] *= np.linspace(0.0, 1.0, sfi)[:, None]
        if sfo > 0:
            sn_seg[-sfo:] *= np.linspace(1.0, 0.0, sfo)[:, None]
        bgm[outro_i0 : outro_i0 + len(sn_seg)] += sn_seg

    return bgm


def main():
    tl = json.loads(TIMELINE_PATH.read_text(encoding="utf-8"))
    total_dur = tl["total_duration"]
    beats = tl["beats"]
    n_samples = int(math.ceil(total_dur * SR))

    voice_track = np.zeros((n_samples, 2), dtype=np.float32)
    sfx_track = np.zeros((n_samples, 2), dtype=np.float32)
    voice_env = np.zeros(n_samples, dtype=np.float32)

    twist_beat = next((b for b in beats if b["act"] == "twist_island"), beats[-1])
    twist_t = twist_beat["start"]
    twist_speech_t = twist_beat.get("speech_start", twist_t + 1.05)

    drop_times = []

    for b in beats:
        if b.get("wav"):
            wav_path = AUDIO_DIR / b["wav"]
            v = read_wav_stereo(wav_path)
            rms = float(np.sqrt(np.mean(v ** 2)) + 1e-6)
            v = v * min(2.4, 0.172 / rms)
            speech_t = b.get("speech_start", b["start"])
            add_stereo(voice_track, speech_t, v, gain=1.0)

            i0 = int(speech_t * SR)
            i1 = min(n_samples, i0 + len(v))
            voice_env[i0:i1] = 1.0

        sfx = b.get("sfx", "")
        t0 = b["start"]
        # Every major beat cut gets a crisp whoosh or boom hit for tactile rhythm!
        if b["index"] > 0 and b["act"] != "twist_island":
            add_stereo(sfx_track, max(0.0, t0 - 0.10), synth_whoosh_cut(0.22), gain=0.45)

        if sfx == "hook_boom":
            add_stereo(sfx_track, 0.0, synth_sub_boom(1.15, 145.0, 32.0), gain=0.78)
            add_stereo(sfx_track, max(0.0, b["duration"] * 0.48 - 0.08), synth_whoosh_cut(0.20), gain=0.62)
            drop_times.append(0.0)
        elif sfx == "tick_soft":
            add_stereo(sfx_track, t0 + 0.02, synth_whoosh_cut(0.22), gain=0.42)
        elif sfx == "heat_hum":
            add_stereo(sfx_track, t0, synth_riser(1.4, 140.0, 420.0), gain=0.38)
            drop_times.append(round(t0, 3))
        elif sfx == "sizzle_pop":
            add_stereo(sfx_track, t0, synth_sub_boom(0.75, 110.0, 40.0), gain=0.52)
            add_stereo(sfx_track, t0 + 0.1, synth_sizzle(2.0), gain=0.58)
            drop_times.append(round(t0, 3))
        elif sfx == "fire_alarm":
            add_stereo(sfx_track, t0, synth_sub_boom(0.95, 125.0, 36.0), gain=0.62)
            add_stereo(sfx_track, t0 + 0.35, synth_fire_alarm(2.2), gain=0.52)
            drop_times.append(round(t0, 3))
        elif sfx == "glass_blast":
            add_stereo(sfx_track, t0, synth_glass_shatter(1.7), gain=0.78)
            drop_times.append(round(t0, 3))
        elif sfx == "city_shockwave":
            add_stereo(sfx_track, t0, synth_sub_boom(1.8, 155.0, 26.0), gain=0.88)
            drop_times.append(round(t0, 3))
        elif sfx == "riser_deep":
            add_stereo(sfx_track, t0, synth_riser(b["duration"] * 0.85, 150.0, 1250.0), gain=0.48)
            drop_times.append(round(t0, 3))
        elif sfx == "earth_boil":
            add_stereo(sfx_track, t0, synth_sub_boom(1.6, 140.0, 28.0), gain=0.82)
            drop_times.append(round(t0, 3))
        elif sfx == "planet_boom":
            add_stereo(sfx_track, max(0.0, t0 - 0.55), synth_riser(0.50, 220.0, 1400.0), gain=0.52)
            add_stereo(sfx_track, t0, synth_sub_boom(2.3, 170.0, 24.0), gain=0.95)
            drop_times.append(round(t0, 3))
        elif sfx == "twist_cut":
            add_stereo(sfx_track, max(0.0, t0 - 0.10), synth_record_stop(0.20), gain=0.72)
            poof_t = t0 + 0.72
            add_stereo(sfx_track, poof_t, synth_poof_vanish(0.45), gain=0.85)
            add_stereo(sfx_track, poof_t + 0.16, synth_huh_question(0.45), gain=0.72)
            drop_times.append(round(t0, 3))

    bgm = build_real_bgm(total_dur, twist_t, twist_speech_t)

    # Smooth sidechain ducking so narration stays super crisp while the real orchestra drives energy!
    duck = np.clip(lowpass(voice_env, 6.0), 0.0, 1.0)
    bgm_gain = 1.0 - 0.50 * duck
    sfx_gain = 1.0 - 0.25 * duck

    mix = voice_track * 1.18 + bgm * bgm_gain[:, None] * 0.56 + sfx_track * sfx_gain[:, None] * 0.62
    mix = np.tanh(mix * 0.96) / 0.96
    write_wav_stereo(OUT_WAV, mix)

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(OUT_WAV),
            "-af",
            "loudnorm=I=-14:TP=-1.2:LRA=8",
            "-ar",
            "48000",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            str(OUT_AAC),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # Export exact musical beat grid + drop timestamps into timeline.json for 3D beat-sync!
    tl["bpm"] = BPM
    tl["beat_sec"] = round(BEAT_SEC, 5)
    tl["drop_times"] = drop_times
    TIMELINE_PATH.write_text(json.dumps(tl, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"REAL ORCHESTRAL AUDIO MASTER READY: {OUT_AAC} ({total_dur:.2f}s, {len(drop_times)} sync drops)")


if __name__ == "__main__":
    main()

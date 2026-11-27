import asyncio
import json
import subprocess
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

VOICE = "zh-CN-YunxiNeural"

BEATS = [
    {
        "id": "b00_conflict",
        "act": "dorm_alarm",
        "step_idx": 1,
        "snooze_start": 1,
        "snooze_end": 1,
        "db_start": 70,
        "db_end": 70,
        "display_t": "按贪睡 1 次",
        "power_label": "70 分贝",
        "compare_line": "≈ 普通手机闹钟",
        "rule_pill": "每按一次贪睡 声强 ×2",
        "fast_tag": "",
        "show_intro_title": True,
        "subtitle": "<hl>07:50 早八高数！</hl> 啪——稍后提醒",
        "tts": "早上七点五十，早八高数闹钟响了，你闭眼按了稍后提醒。",
        "rate": "+24%",
        "pitch": "+1Hz",
        "post_pause": 0.06,
        "sfx": "alarm_slap",
    },
    {
        "id": "b01_rule",
        "act": "dorm_mate_yell",
        "step_idx": 2,
        "snooze_start": 1,
        "snooze_end": 2,
        "db_start": 70,
        "db_end": 73,
        "display_t": "按贪睡 2 次",
        "power_label": "73 分贝",
        "compare_line": "室友：快关了！",
        "rule_pill": "每按一次贪睡 声强 ×2",
        "fast_tag": "",
        "subtitle": "室友：<hl>快关了！</hl> 声强翻倍！",
        "tts": "假如每按一次贪睡，声强直接翻倍！第2次，室友崩溃大喊：快关了！",
        "rate": "+23%",
        "pitch": "+0Hz",
        "post_pause": 0.06,
        "sfx": "alarm_pop",
    },
    {
        "id": "b02_drill",
        "act": "dorm_bounce",
        "step_idx": 3,
        "snooze_start": 2,
        "snooze_end": 5,
        "db_start": 73,
        "db_end": 85,
        "display_t": "按贪睡 5 次",
        "power_label": "85 分贝",
        "compare_line": "≈ 贴脸装修电钻",
        "rule_pill": "每按一次贪睡 声强 ×2",
        "fast_tag": "",
        "subtitle": "按到第 5 次，<hl>床铺原地蹦迪</hl>",
        "tts": "第5次，八十五分贝。像电钻贴脸，整张床开始原地蹦迪！",
        "rate": "+23%",
        "pitch": "+0Hz",
        "post_pause": 0.06,
        "sfx": "bass_bounce",
    },
    {
        "id": "b03_auntie",
        "act": "dorm_auntie",
        "step_idx": 4,
        "snooze_start": 5,
        "snooze_end": 10,
        "db_start": 85,
        "db_end": 100,
        "display_t": "按贪睡 10 次",
        "power_label": "100 分贝",
        "compare_line": "≈ 地铁贴脸进站",
        "rule_pill": "每按一次贪睡 声强 ×2",
        "fast_tag": "⚡ ×1,024倍",
        "subtitle": "宿管阿姨：<hl>谁的闹钟！</hl> 啪——又按了",
        "tts": "第10次，一百分贝！宿管阿姨踹门怒吼：谁的闹钟！你反手又按了一次。",
        "rate": "+23%",
        "pitch": "+1Hz",
        "post_pause": 0.06,
        "sfx": "door_kick_slap",
    },
    {
        "id": "b04_afro",
        "act": "dorm_afro",
        "step_idx": 5,
        "snooze_start": 10,
        "snooze_end": 20,
        "db_start": 100,
        "db_end": 130,
        "display_t": "按贪睡 20 次",
        "power_label": "130 分贝",
        "compare_line": "≈ 战斗机贴脸起飞",
        "rule_pill": "每按一次贪睡 声强 ×2",
        "fast_tag": "⚡ ×100万倍",
        "subtitle": "宿管阿姨<hl>当场吹成爆炸头</hl>",
        "tts": "第20次，一百三十分贝！堪比战斗机起飞，宿管阿姨当场吹成爆炸头，全楼玻璃炸碎！",
        "rate": "+23%",
        "pitch": "+1Hz",
        "post_pause": 0.06,
        "sfx": "glass_sonic",
    },
    {
        "id": "b05_campus",
        "act": "campus_lift",
        "step_idx": 6,
        "snooze_start": 20,
        "snooze_end": 30,
        "db_start": 130,
        "db_end": 160,
        "display_t": "按贪睡 30 次",
        "power_label": "160 分贝",
        "compare_line": "≈ 火箭点火起飞",
        "rule_pill": "每按一次贪睡 声强 ×2",
        "fast_tag": "▶▶ 声波失控",
        "subtitle": "整栋四号楼<hl>震得原地起飞</hl>",
        "tts": "第30次，一百六十分贝！比火箭发射还响，整栋四号楼被声波震得原地起飞！",
        "rate": "+23%",
        "pitch": "+1Hz",
        "post_pause": 0.06,
        "sfx": "sonic_boom",
    },
    {
        "id": "b06_stubborn",
        "act": "dorm_stubborn",
        "step_idx": 7,
        "snooze_start": 30,
        "snooze_end": 35,
        "db_start": 160,
        "db_end": 175,
        "display_t": "按贪睡 35 次",
        "power_label": "175 分贝",
        "compare_line": "全校提前放假",
        "rule_pill": "每按一次贪睡 声强 ×2",
        "fast_tag": "▶▶ 声波失控",
        "subtitle": "小酒：<hl>再睡五分钟……</hl>",
        "tts": "全校提前放假，你蒙着被子嘟囔：再睡五分钟！",
        "rate": "+22%",
        "pitch": "+0Hz",
        "post_pause": 0.06,
        "sfx": "alarm_slap",
    },
    {
        "id": "b07_194db",
        "act": "city_shockwave",
        "step_idx": 8,
        "snooze_start": 35,
        "snooze_end": 41,
        "db_start": 175,
        "db_end": 194,
        "display_t": "按贪睡 41 次",
        "power_label": "194 分贝",
        "compare_line": "达到地球大气声音极限！",
        "rule_pill": "空气极限 · 转为冲击波",
        "fast_tag": "⚠ 物理极限",
        "subtitle": "<hl>194 分贝！</hl> 达到大气声音极限",
        "tts": "第41次，一百九十四分贝！达到地球大气声音极限！空气被抽成真空，声音直接变成毁灭性冲击波！",
        "rate": "+23%",
        "pitch": "+2Hz",
        "post_pause": 0.06,
        "sfx": "city_wave",
    },
    {
        "id": "b08_pillows",
        "act": "city_pillows",
        "step_idx": 9,
        "snooze_start": 41,
        "snooze_end": 43,
        "db_start": 194,
        "db_end": 194,
        "display_t": "按贪睡 43 次",
        "power_label": "冲击波模式",
        "compare_line": "全城枕头飞上天",
        "rule_pill": "空气极限 · 转为冲击波",
        "fast_tag": "⚠ 冲击波",
        "subtitle": "全城早高峰，<hl>提前一小时集体清醒</hl>",
        "tts": "漫天枕头飘满全城，打工人提前一小时集体清醒！",
        "rate": "+23%",
        "pitch": "+1Hz",
        "post_pause": 0.06,
        "sfx": "riser_up",
    },
    {
        "id": "b09_space",
        "act": "space_pointer",
        "step_idx": 9,
        "snooze_start": 43,
        "snooze_end": 45,
        "db_start": 194,
        "db_end": 194,
        "display_t": "按贪睡 45 次",
        "power_label": "能量 ×35万亿",
        "compare_line": "太空可见地面闪光",
        "rule_pill": "空气极限 · 转为冲击波",
        "fast_tag": "🛸 宇宙警报",
        "subtitle": "从太空都看得见，<hl>他还在按稍后提醒</hl>",
        "tts": "冲出大气层，从外太空都能看见地面闪光，他居然还在按稍后提醒！",
        "rate": "+23%",
        "pitch": "+1Hz",
        "post_pause": 0.06,
        "sfx": "space_ping",
    },
    {
        "id": "b10_alien",
        "act": "space_alien",
        "step_idx": 10,
        "snooze_start": 45,
        "snooze_end": 46,
        "db_start": 194,
        "db_end": 194,
        "display_t": "按贪睡 46 次",
        "power_label": "外星人跑路",
        "compare_line": "早八铃声击退入侵",
        "rule_pill": "地球已成功获救",
        "fast_tag": "🛸 地球获救",
        "subtitle": "外星舰队听见早八铃声，<hl>连夜掉头逃跑</hl>",
        "tts": "路过的外星入侵舰队听见早八铃声，直接触发高数恐惧症，连夜掉头光速逃跑！",
        "rate": "+23%",
        "pitch": "+2Hz",
        "post_pause": 0.14,
        "sfx": "ufo_flee",
    },
    {
        "id": "b11_twist",
        "act": "dorm_saturday",
        "step_idx": 10,
        "snooze_start": 46,
        "snooze_end": 46,
        "db_start": 0,
        "db_end": 0,
        "display_t": "闹钟没电了",
        "power_label": "今天星期六",
        "compare_line": "早八：根本没课！",
        "rule_pill": "白按 46 次贪睡",
        "fast_tag": "",
        "subtitle": "<hl>今天星期六，根本没早八！</hl><br/>你最多按过几次贪睡？评论区报数！",
        "tts": "闹钟终于没电了。你惊醒一看手机：今天星期六，根本没早八！你最多按过几次稍后提醒？评论区报数！",
        "pre_delay": 0.95,
        "rate": "+21%",
        "pitch": "+0Hz",
        "post_pause": 0.25,
        "sfx": "twist_saturday",
    },
]


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    ).strip()
    return float(out)


async def generate_all():
    for f in AUDIO_DIR.glob("*.mp3"):
        f.unlink()
    for f in AUDIO_DIR.glob("*.wav"):
        if f.name != "master_mix.wav":
            f.unlink()

    timeline = []
    cursor = 0.0
    for idx, beat in enumerate(BEATS):
        mp3_path = AUDIO_DIR / f"{idx:02d}_{beat['id']}.mp3"
        wav_path = AUDIO_DIR / f"{idx:02d}_{beat['id']}.wav"
        communicate = edge_tts.Communicate(
            text=beat["tts"],
            voice=VOICE,
            rate=beat["rate"],
            pitch=beat["pitch"],
        )
        await communicate.save(str(mp3_path))
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(mp3_path),
                "-af",
                "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-42dB,areverse,silenceremove=start_periods=1:start_silence=0.04:start_threshold=-42dB,areverse",
                "-ar",
                "48000",
                "-ac",
                "2",
                str(wav_path),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        speech_dur = probe_duration(wav_path)
        pre_delay = float(beat.get("pre_delay", 0.0))
        total_dur = round(pre_delay + speech_dur + beat["post_pause"], 3)
        entry = {
            **beat,
            "index": idx,
            "wav": str(wav_path.name),
            "pre_delay": round(pre_delay, 3),
            "start": round(cursor, 3),
            "speech_start": round(cursor + pre_delay, 3),
            "speech_end": round(cursor + pre_delay + speech_dur, 3),
            "end": round(cursor + total_dur, 3),
            "duration": total_dur,
        }
        timeline.append(entry)
        cursor += total_dur
        print(f"[{idx:02d}] {beat['id']:16s} {entry['start']:6.2f}s -> {entry['end']:6.2f}s (speech {speech_dur:.2f}s)")

    out_json = ROOT / "src" / "timeline.json"
    out_json.write_text(
        json.dumps({"total_duration": round(cursor, 3), "fps": 30, "beats": timeline}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\nEP02 TOTAL DURATION: {cursor:.2f}s -> {out_json}")


if __name__ == "__main__":
    asyncio.run(generate_all())

import asyncio
import json
import subprocess
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# 冷静、自然、带 B 站年轻科普感的优质男声（彻底告别激昂营销号腔）
VOICE = "zh-CN-YunxiNeural"

BEATS = [
    {
        "id": "b00_hook",
        "act": "hook_flash",
        "step_idx": 10,
        "t_start_sim": 60,
        "t_end_sim": 60,
        "display_t": "第 60 秒",
        "power_label": "33 倍太阳",
        "compare_line": "60 秒把地球烤成岩浆？",
        "fast_tag": "⚡ 每秒翻倍",
        "subtitle": "假如打排位时，<hl>手机发烫每秒翻倍</hl><br/>你能撑到第几秒？",
        "tts": "假如打排位时，手机发烫每秒翻倍，你能撑到第几秒？",
        "rate": "+24%",
        "pitch": "+1Hz",
        "post_pause": 0.06,
        "sfx": "hook_boom",
    },
    {
        "id": "b01_0s",
        "act": "dorm_calm",
        "step_idx": 1,
        "t_start_sim": 0,
        "t_end_sim": 0,
        "display_t": "第 0 秒",
        "power_label": "5 瓦",
        "compare_line": "≈ 正常高画质排位",
        "fast_tag": "",
        "subtitle": "第 0 秒 <hl>5 瓦</hl>，晋级赛最后一把<br/>最高画质，手感温润",
        "tts": "零秒，五瓦。晋级赛最后一把，最高画质，手感温润。",
        "rate": "+22%",
        "pitch": "+0Hz",
        "post_pause": 0.08,
        "sfx": "tick_soft",
    },
    {
        "id": "b02_5s",
        "act": "dorm_warm",
        "step_idx": 2,
        "t_start_sim": 0,
        "t_end_sim": 5,
        "display_t": "第 5 秒",
        "power_label": "160 瓦",
        "compare_line": "≈ 3 台强力暖手宝",
        "fast_tag": "",
        "subtitle": "第 5 秒 <hl>160 瓦</hl>，像揣了三个暖手宝<br/>你还以为是团战帧率拉高了",
        "tts": "第五秒，一百六十瓦。手里像揣了三个暖手宝，你还以为是团战帧率拉高了。",
        "rate": "+20%",
        "pitch": "+0Hz",
        "post_pause": 0.08,
        "sfx": "heat_hum",
    },
    {
        "id": "b03_8s",
        "act": "dorm_melt",
        "step_idx": 3,
        "t_start_sim": 5,
        "t_end_sim": 8,
        "display_t": "第 8 秒",
        "power_label": "1,280 瓦",
        "compare_line": "≈ 1 台满载微波炉",
        "fast_tag": "",
        "subtitle": "好消息：宿舍不用买微波炉了<br/>坏消息：<hl>手机壳当场化成糖浆</hl>",
        "tts": "第八秒，一千两百八十瓦。好消息，宿舍不用买微波炉了；坏消息，硅胶手机壳当场化成糖浆。",
        "rate": "+20%",
        "pitch": "+0Hz",
        "post_pause": 0.08,
        "sfx": "sizzle_pop",
    },
    {
        "id": "b04_13s",
        "act": "dorm_smoke",
        "step_idx": 4,
        "t_start_sim": 8,
        "t_end_sim": 13,
        "display_t": "第 13 秒",
        "power_label": "4.1 万瓦",
        "compare_line": "≈ 20 台工业电焊机",
        "fast_tag": "▶▶ 升温加速",
        "subtitle": "第 13 秒 <hl>4.1 万瓦</hl>，被窝冒出浓烟<br/>整层楼的烟雾警报先崩了",
        "tts": "第十三秒，四万一千瓦。被窝轰的一声冒出浓烟，室友还没搞清状况，整层楼的烟雾警报先崩了。",
        "rate": "+20%",
        "pitch": "+1Hz",
        "post_pause": 0.10,
        "sfx": "fire_alarm",
    },
    {
        "id": "b05_20s",
        "act": "campus_blast",
        "step_idx": 5,
        "t_start_sim": 13,
        "t_end_sim": 20,
        "display_t": "第 20 秒",
        "power_label": "524 万瓦",
        "compare_line": "≈ 火箭发动机喷口",
        "fast_tag": "▶▶ 指数失控",
        "subtitle": "第 20 秒 <hl>524 万瓦</hl>，冲击波掀碎全楼玻璃<br/>整栋宿舍楼热浪翻涌",
        "tts": "第二十秒，五百二十四万瓦。热流堪比火箭发动机喷口，透明冲击波一把掀碎整栋宿舍楼的玻璃。",
        "rate": "+20%",
        "pitch": "+1Hz",
        "post_pause": 0.10,
        "sfx": "glass_blast",
    },
    {
        "id": "b06_32s",
        "act": "city_dome",
        "step_idx": 6,
        "t_start_sim": 20,
        "t_end_sim": 32,
        "display_t": "第 32 秒",
        "power_label": "215 亿瓦",
        "compare_line": "≈ 整座三峡水电站满发",
        "fast_tag": "▶▶ 指数失控",
        "subtitle": "第 32 秒 <hl>215 亿瓦</hl>，三峡满载发电<br/>全塞进手心这块 6 寸屏幕",
        "tts": "第三十二秒，两百一十五亿瓦。三峡水电站全厂满载发电，现在全塞进你手心这六寸屏幕里，热浪穹顶瞬间扫平整座城市。",
        "rate": "+20%",
        "pitch": "+1Hz",
        "post_pause": 0.10,
        "sfx": "city_shockwave",
    },
    {
        "id": "b07_42s",
        "act": "stratosphere",
        "step_idx": 7,
        "t_start_sim": 32,
        "t_end_sim": 42,
        "display_t": "第 42 秒",
        "power_label": "22 太瓦",
        "compare_line": "> 全人类发电站总和",
        "fast_tag": "▶▶ 冲破云层",
        "subtitle": "第 42 秒 <hl>22 太瓦</hl>，超过全人类总能耗<br/>高温光柱直接捅穿平流层",
        "tts": "第四十二秒，二十二太瓦。一台手机的功率，正式超过全人类所有发电站的总和，热柱直接捅穿平流层。",
        "rate": "+20%",
        "pitch": "+1Hz",
        "post_pause": 0.10,
        "sfx": "riser_deep",
    },
    {
        "id": "b08_55s",
        "act": "earth_boil",
        "step_idx": 8,
        "t_start_sim": 42,
        "t_end_sim": 55,
        "display_t": "第 55 秒",
        "power_label": "1.8×10¹⁷ 瓦",
        "compare_line": "> 地球接收全部太阳光",
        "fast_tag": "▶▶ 行星危机",
        "subtitle": "第 55 秒超越地球接收的<hl>全部太阳辐射</hl><br/>云层蒸干，全球海洋剧烈沸腾",
        "tts": "第五十五秒，超越地球接收的全部太阳辐射。云层瞬间蒸干，全球海洋开始剧烈沸腾。",
        "rate": "+20%",
        "pitch": "+2Hz",
        "post_pause": 0.10,
        "sfx": "earth_boil",
    },
    {
        "id": "b09_60s",
        "act": "magma_planet",
        "step_idx": 9,
        "t_start_sim": 55,
        "t_end_sim": 60,
        "display_t": "第 60 秒",
        "power_label": "5.76×10¹⁸ 瓦",
        "compare_line": "≈ 33 个太阳同时炙烤",
        "fast_tag": "▶▶ 地壳熔融",
        "subtitle": "第 60 秒，<hl>33 个太阳</hl>同时烤地球<br/>地壳彻底熔成一颗岩浆星球",
        "tts": "第六十秒，五点七六百亿亿瓦。相当于三十三个太阳同时烤地球，地壳彻底熔成一颗滚烫岩浆球。",
        "rate": "+19%",
        "pitch": "+2Hz",
        "post_pause": 0.18,
        "sfx": "planet_boom",
    },
    {
        "id": "b10_twist",
        "act": "twist_island",
        "step_idx": 10,
        "t_start_sim": 60,
        "t_end_sim": 60,
        "display_t": "第 60 秒",
        "power_label": "手机：已气化",
        "compare_line": "晋级赛：已挂机判负",
        "fast_tag": "",
        "subtitle": "地球烤化了，<hl>手机先气化，晋级赛判负！</hl><br/>你的手机能撑到第几秒？评论区报型号！",
        "tts": "地球烤化了，手机先气化，晋级赛直接判负！你的手机能撑到第几秒？评论区报型号！",
        "pre_delay": 1.05,
        "rate": "+21%",
        "pitch": "+0Hz",
        "post_pause": 0.25,
        "sfx": "twist_cut",
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
    # Clean old wav/mp3 clips
    for f in AUDIO_DIR.glob("*.mp3"):
        f.unlink()
    for f in AUDIO_DIR.glob("*.wav"):
        if f.name != "master_mix.wav":
            f.unlink()

    timeline = []
    cursor = 0.0
    for idx, beat in enumerate(BEATS):
        if not beat["tts"].strip():
            speech_dur = 0.0
            total_dur = round(float(beat.get("silent_duration", 5.2)), 3)
            entry = {
                **beat,
                "index": idx,
                "wav": "",
                "start": round(cursor, 3),
                "speech_end": round(cursor, 3),
                "end": round(cursor + total_dur, 3),
                "duration": total_dur,
            }
            timeline.append(entry)
            cursor += total_dur
            print(f"[{idx:02d}] {beat['id']:16s} {entry['start']:6.2f}s -> {entry['end']:6.2f}s (silent visual {total_dur:.2f}s)")
            continue

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
    print(f"\nTOTAL DURATION: {cursor:.2f}s -> {out_json}")


if __name__ == "__main__":
    asyncio.run(generate_all())

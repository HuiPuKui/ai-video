"""Generate the episode's 75 BPM music bed and three cues as mono PCM WAV."""
import math
import sys
import wave
from array import array
from functools import lru_cache

RATE = 48000
BEAT = 38400
CHORDS = [(50, 57, 65, 69), (46, 53, 62, 65),
          (53, 60, 65, 69), (48, 55, 62, 67)]


@lru_cache(maxsize=None)
def note(midi, beats, strength, attack):
    length = round(BEAT * beats)
    freq = 440 * 2 ** ((midi - 69) / 12)
    data = array('h')
    for i in range(length):
        t = i / RATE
        phase = math.tau * freq * t
        env = min(1, t / attack) * math.exp(-3 * i / length)
        env *= min(1, (length - i) / (RATE * .12))
        tone = math.sin(phase) + .22 * math.sin(2 * phase) + .08 * math.sin(3 * phase)
        data.append(round(strength * env * tone))
    return data


def write_score(path):
    samples = array('i', [0]) * (168 * BEAT)

    def play(beat, midi, duration, strength, attack):
        start = round(beat * BEAT)
        for i, value in enumerate(note(midi, duration, strength, attack)):
            if start + i >= len(samples):
                break
            samples[start + i] += value

    for bar in range(42):
        root, fifth, third, top = CHORDS[bar % 4]
        beat = 4 * bar
        play(beat, root, 4, 2650, .22)
        play(beat, fifth, 3.8, 1450, .3)
        play(beat + .5, third, 2.1, 1900, .035)
        play(beat + 2.5, top if bar % 2 else fifth + 12, 1.5, 1500, .045)

    for beat, midi in [(2, 62), (78, 65), (152, 69)]:
        play(beat, midi - 12, 1.4, 4800, .008)
        play(beat, midi + 12, 2.4, 3300, .012)

    for i in range(RATE * 2):
        samples[-1 - i] = round(samples[-1 - i] * i / (RATE * 2))
    with wave.open(path, 'wb') as output:
        output.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        output.writeframes(array('h', samples).tobytes())


if __name__ == '__main__':
    write_score(sys.argv[1])

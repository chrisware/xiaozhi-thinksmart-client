"""Synthesize sentences.tsv / sentences_en.tsv with many voices -> $WAKE_EVAL_DATA/tts/<id>~<voice>~<rate>.wav (16 kHz mono).

Voices: 10 Microsoft edge-tts voices (needs internet) and the macOS built-in voices (`say`),
per language. Wake word clips get three speeds, the rest one. Existing files are skipped, so it
can be rerun.

    uv run --no-project --with edge-tts --with numpy python eval/wake/gen_tts.py --lang en
"""
import argparse
import asyncio
import os
import pathlib
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from common import DATA, sentences  # noqa: E402

EDGE = {
    'zh': ['zh-CN-XiaoxiaoNeural', 'zh-CN-XiaoyiNeural', 'zh-CN-YunjianNeural', 'zh-CN-YunxiNeural',
           'zh-CN-YunxiaNeural', 'zh-CN-YunyangNeural', 'zh-CN-liaoning-XiaobeiNeural',
           'zh-CN-shaanxi-XiaoniNeural', 'zh-TW-HsiaoChenNeural', 'zh-TW-YunJheNeural'],
    # NZ first: the owner's accent is what the device has to hear
    'en': ['en-NZ-MollyNeural', 'en-NZ-MitchellNeural', 'en-AU-NatashaNeural', 'en-AU-WilliamNeural',
           'en-US-AriaNeural', 'en-US-GuyNeural', 'en-US-JennyNeural', 'en-US-ChristopherNeural',
           'en-GB-SoniaNeural', 'en-GB-RyanNeural'],
}
SAY = {
    'zh': [f'{v} (中文（中国大陆）)' for v in
           ['Eddy', 'Flo', 'Grandma', 'Grandpa', 'Reed', 'Rocko', 'Sandy', 'Shelley', 'Tingting']],
    # English-accent variety: US, UK, AU, IE, ZA, IN
    'en': ['Samantha (English (US))', 'Daniel (English (UK))', 'Karen (English (Australia))',
           'Moira (English (Ireland))', 'Tessa (English (South Africa))', 'Rishi (English (India))'],
}
RATES = {'slow': ('-10%', 150), 'norm': ('+0%', 190), 'fast': ('+20%', 240)}   # edge, say (words/min)


def to_wav(src, dst):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-ar', '16000', '-ac', '1',
                    '-sample_fmt', 's16', dst], check=True)
    os.unlink(src)


async def edge(sem, text, voice, rate, out):
    import edge_tts
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, voice, rate=rate).save(str(out) + '.mp3')
                await asyncio.to_thread(to_wav, str(out) + '.mp3', out)
                return
            except Exception as e:   # the service drops connections now and then
                print('retry', out.name, e)
                await asyncio.sleep(2)


async def say(sem, text, voice, rate, out):
    async with sem:
        aiff = str(out) + '.aiff'
        p = await asyncio.create_subprocess_exec('say', '-v', voice, '-r', str(rate),
                                                 '-o', aiff, text)
        await p.wait()
        await asyncio.to_thread(to_wav, aiff, str(out))


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lang', choices=sorted(EDGE), default='zh', help='sentences file and voices')
    args = ap.parse_args()
    out_dir = DATA / 'tts'
    out_dir.mkdir(parents=True, exist_ok=True)
    edge_sem, say_sem, jobs = asyncio.Semaphore(6), asyncio.Semaphore(4), []
    for s in sentences(args.lang):
        for name in (RATES if s.kind == 'pos' else ['norm']):
            for v in EDGE[args.lang]:
                f = out_dir / f'{s.id}~{v[3:]}~{name}.wav'
                if not f.exists():
                    jobs.append(edge(edge_sem, s.text, v, RATES[name][0], f))
            for v in SAY[args.lang]:
                f = out_dir / f'{s.id}~mac-{v.split(" (")[0]}~{name}.wav'
                if not f.exists():
                    jobs.append(say(say_sem, s.text, v, RATES[name][1], f))
    print(len(jobs), 'clips to make')
    await asyncio.gather(*jobs)
    print(len(list(out_dir.glob('*.wav'))), 'clips in', out_dir)


asyncio.run(main())

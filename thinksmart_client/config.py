"""Settings: DEFAULTS, overridden by ~/.config/thinksmart-client/config.json.

The file holds only what belongs to this device or its user (ids, settings changed on the page or
by voice), never copies of the defaults, so a client update can change a default."""
import json
import logging
import pathlib
import uuid

log = logging.getLogger(__name__)

PATH = pathlib.Path.home() / '.config' / 'thinksmart-client' / 'config.json'

DEFAULTS = {
    'hub_ws': 'ws://127.0.0.1:16689/xiaozhi/v1/',
    'hub_http': 'http://127.0.0.1:16688',
    'token': 'test-token',
    'device_id': '',      # filled from the Wi-Fi MAC; the hub remembers the model per device id
    'client_id': '',
    # 'en' (default) or 'zh': picks the wake word model (models/kws-<language>), the keyword token
    # format and the wake-word defaults below (LANGUAGE_DEFAULTS). Unknown values use 'en'.
    'language': 'en',
    # sherpa-onnx keywords for the English model: gigaspeech BPE tokens (upper case, '▁' marks a
    # word start), then @label; the label uses _ for spaces (sherpa's keyword parser stops the
    # label at the first space). Make lines with eval/wake/make_keyword.py (models/kws-en/README.md).
    # 'Hey Computer': 4 syllables in 2 words; "computer" is rare in ordinary NZ household speech
    # (people say laptop, PC, phone), so the pair is unlikely to be said by accident. One keyword
    # only: the model catches what a keyword sounds like, not what is written, so near phrases
    # (hey commander, ok computer) need checking with eval/wake before being added — say so here.
    'wake_words': ['▁HE Y ▁COMP U TER @Hey_Computer'],
    'kws_score': 2.0,     # same as zh; the 2026-11-02 sweep (eval/wake --lang en) saw raising
    'kws_threshold': 0.25,  # the threshold cost more true wakes than it removed false ones: at
    # 0.25 everyday speech (1.25 h of 100 sentences x 16 voices) never woke, and the confusable
    # near-phrases that do wake ("OK computer", "hey ... computer desk") contain "computer" —
    # wake_verify 'hub' blocks them; see eval/wake/README.md
    # beam width: with 2 a keyword easily loses its path before it is finished (哈喽阿满 woke only
    # 6/30, 你好小二 25/30 instead of 30/30); 8 costs ~6% more decoding CPU, only while there is sound
    'kws_paths': 8,
    # digital gain in front of the wake word model (not its quiet gate): it misses more at low
    # levels; zh: 10 dB improved eval/wake 15% -> 7% at -30 dBFS (kept); the English model likes
    # more: eval/wake --lang en, 20 dB over 10 dB: near 10% -> 8% missed, far 66% -> 57%, and the
    # false wakes it adds are all sentences that say "computer" close to a hey-like syllable
    'kws_gain_db': 20,
    # batches (40 ms each) to keep decoding after sound stops. Measured with eval/wake --lang en:
    # the English model often needs over 2 s to report a keyword that ends in silence
    # (isolated "Hey Computer" at -20 dBFS: 52% missed with 25, 4% with 60)
    'kws_hangover': 60,
    'kws_model_dir': 'kws-en',
    # second look at each wake word hit (wake_verify.py): 'hub' asks the hub's speech recogniser
    # whether the wake word is really there, '' trusts the wake word model. Off for now: the hub
    # takes 2-2.5 s here, which delays the answer to "Hey Computer what's the weather" said in one
    # go by ~4 s; with language=en the check compares English words (wake_verify.EnglishMatcher)
    'wake_verify': '',
    'follow_up_seconds': 10,   # after a reply: keep listening this long for a follow-up
    'port': 8090,
    'sleep': {'enabled': False, 'start': '22:00', 'end': '07:00'},   # sleep.py
    'brightness': 100,    # the screen's 0-100, set on the page or by voice (no automatic brightness: the user asked)
    # blank this long after the last touch or conversation (device.SCREEN_OFF_MINUTES); off: never
    'screen_off': {'enabled': True, 'minutes': 5},
}

# Wake-word settings for the other languages, applied over DEFAULTS by load()/for_language()
# wherever the user file doesn't set the key.
# 2026-10-31 (zh): renamed 小二 -> 小麦. Tested with 10 edge-tts voices x 3 speeds: 小麦小麦 and
# 哈喽小麦 30/30 each, no false wakes on 20 confusable sentences x 10 voices (小麦色, 小卖部,
# 晓梅...). 小麦 alone woke on nearly every sentence containing it. 小麦同学 added the same day:
# 30/30, the other two unchanged, 1/10 false wake on 小美同学. 你好小麦 left out: 你好小妹 woke it
# 8-9/10 at any threshold (the model can't tell 麦 from 妹 there). Keywords are pinyin
# initials/finals with tones, then @label.
LANGUAGE_DEFAULTS = {
    'zh': {'wake_words': ['x iǎo m ài x iǎo m ài @小麦小麦', 'h ā l óu x iǎo m ài @哈喽小麦',
                          'x iǎo m ài t óng x ué @小麦同学'],
           'kws_score': 2.0, 'kws_threshold': 0.25, 'kws_gain_db': 10, 'kws_hangover': 25,
           'kws_model_dir': 'kws-zh'},
}


def for_language(language):
    """What ships for a language, ignoring the user file (used by eval/wake and the page)."""
    cfg = dict(DEFAULTS)
    cfg.update(LANGUAGE_DEFAULTS.get(language, {}))
    return cfg


def _mac():
    for iface in ('wlan0', 'eth0', 'end0'):
        try:
            return pathlib.Path(f'/sys/class/net/{iface}/address').read_text().strip()
        except OSError:
            continue
    return ''


def load():
    cfg = dict(DEFAULTS)
    try:
        user = json.loads(PATH.read_text())
    except FileNotFoundError:
        user = {}
    except ValueError:
        log.error('%s is not valid JSON, using defaults', PATH)
        user = {}
    cfg.update(user)
    if cfg['language'] not in LANGUAGE_DEFAULTS and cfg['language'] != 'en':
        log.warning('unknown language %r, using en', cfg['language'])
        cfg['language'] = 'en'
    for key, value in LANGUAGE_DEFAULTS.get(cfg['language'], {}).items():
        if key not in user:          # the user file wins over a language default
            cfg[key] = value
    changed = False
    if not cfg['device_id']:
        cfg['device_id'], changed = _mac() or uuid.uuid4().hex[:12], True
    if not cfg['client_id']:
        cfg['client_id'], changed = str(uuid.uuid4()), True
    if changed:
        save(device_id=cfg['device_id'], client_id=cfg['client_id'])
    return cfg


def save(**values):
    """Store these keys in the user file, keeping whatever else it has."""
    try:
        data = json.loads(PATH.read_text())
    except (FileNotFoundError, ValueError):
        data = {}
    data.update(values)
    PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = PATH.with_suffix('.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    tmp.replace(PATH)

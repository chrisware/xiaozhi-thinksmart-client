"""language=en selects the English wake word model and keywords; the second look reads English words.

Needs no device stubs (config and wake_verify import numpy only):
  uv run --no-project --with numpy --with pytest python -m pytest -q tests/test_wake_language.py
"""
import json

from thinksmart_client import config, wake_verify


def test_en_default_ships_the_english_model_and_bpe_keyword():
    d = config.for_language('en')
    assert d['kws_model_dir'] == 'kws-en'
    assert d['wake_words'] == ['▁HE Y ▁COMP U TER @Hey_Computer']   # label: _ for spaces


def test_zh_overrides_wake_words_and_model_dir():
    d = config.for_language('zh')
    assert d['kws_model_dir'] == 'kws-zh'
    assert d['wake_words'][0].startswith('x iǎo m ài') and '小麦小麦' in d['wake_words'][0]


def test_load_picks_language_defaults(monkeypatch, tmp_path):
    monkeypatch.setattr(config, 'PATH', tmp_path / 'config.json')
    (tmp_path / 'config.json').write_text(json.dumps({'language': 'zh'}))
    cfg = config.load()
    assert cfg['kws_model_dir'] == 'kws-zh' and '小麦小麦' in cfg['wake_words'][0]
    # a key the user file sets wins over the language default, the rest still switches
    (tmp_path / 'config.json').write_text(
        json.dumps({'language': 'zh', 'wake_words': ['x iǎo m ài @小麦']}))
    cfg = config.load()
    assert cfg['wake_words'] == ['x iǎo m ài @小麦'] and cfg['kws_model_dir'] == 'kws-zh'


def test_unknown_language_falls_back_to_en(monkeypatch, tmp_path):
    monkeypatch.setattr(config, 'PATH', tmp_path / 'config.json')
    (tmp_path / 'config.json').write_text(json.dumps({'language': 'de'}))
    assert config.load()['language'] == 'en'


def test_english_matcher_judges_words_not_pinyin():
    m = wake_verify.EnglishMatcher(config.for_language('en')['wake_words'])
    assert m.judge('Hey computer, what time is it')[0]
    assert m.judge('HEY, COMPUTER!')[0]                 # case and punctuation carry no weight
    assert m.judge('hay computer')[0]                    # one letter wrong, same first letter
    assert m.judge('hey computers')[0]                   # prefix counts
    assert m.judge('')[0]                                # nothing recognised: fail open
    assert not m.judge('hey there')[0]                   # the hey was meant for a person
    assert not m.judge('they computer is slow')[0]       # they is not hey
    assert not m.judge('turn off the computer')[0]       # the name alone is not a wake
    assert not m.judge('the kettle boiled over')[0]


def test_make_selects_the_matcher_by_language():
    assert isinstance(wake_verify.make('hub', ['@Hey_Computer'], language='en').matcher,
                      wake_verify.EnglishMatcher)
    zh = config.for_language('zh')['wake_words']
    assert isinstance(wake_verify.make('hub', zh, language='zh').matcher, wake_verify.Matcher)
    assert wake_verify.make('', zh) is None

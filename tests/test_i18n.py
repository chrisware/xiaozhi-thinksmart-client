"""The language tables must stay in step: no key exists in one language only, the MCP tool docs
exist for both, and the client's status tells the page which language to render."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import test_barge_in  # noqa: E402  (stubs the audio stack the same way)

from thinksmart_client import app, i18n, mcp  # noqa: E402
from thinksmart_client.config import DEFAULTS, for_language  # noqa: E402


def test_both_string_tables_have_the_same_keys():
    assert set(i18n.STRINGS['en']) == set(i18n.STRINGS['zh'])


def test_t_fills_the_wake_placeholder_per_language():
    assert i18n.t('en', 'didnt_catch', wake='Hey Computer') == 'Sorry, I didn\'t catch that — say «Hey Computer» again'
    assert i18n.t('zh', 'didnt_catch', wake='小麦小麦') == '没听清，可以再说一次「小麦小麦」'


def test_wake_label_reads_the_keyword_format():
    assert i18n.wake_label(DEFAULTS['wake_words']) == 'Hey Computer'
    assert i18n.wake_label(for_language('zh')['wake_words']) == '小麦小麦'


def test_mcp_tools_exist_for_both_languages_with_matching_names():
    en, zh = mcp.tools('en'), mcp.tools('zh')
    assert [t['name'] for t in en] == [t['name'] for t in zh]
    assert all(t['description'].strip() for t in en + zh)
    assert mcp.tools('de') is en   # unknown language falls back to English


def test_status_carries_language_and_wake_label():
    c = test_barge_in.make_client()
    s = c.status()
    assert s['language'] == 'en' and s['wake_label'] == 'Hey Computer'

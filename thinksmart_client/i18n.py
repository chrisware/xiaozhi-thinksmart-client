"""User-facing strings (toasts, API errors) in the client's language.

cfg['language'] picks the table: 'en' ships as the default of this fork, 'zh' carries the strings
the client had before the English port. {wake} is the wake word as spoken (config label);
t() raises KeyError for a key missing from the language — the tests check both tables match.
"""

STRINGS = {
    'en': {
        'mic_off_tip': "The microphone is off — flip the switch on the side of the case to talk",
        'mic_on': 'Microphone on',
        'mic_off': 'Microphone off',
        'hub_unreachable': "Can't reach the voice hub — check that it is running",
        'hub_unreachable_short': "Can't reach the voice hub",
        'didnt_catch': "Sorry, I didn't catch that — say «{wake}» again",
        'no_network': 'Still offline — try again in a moment',
        'no_reply': "No answer came back — the network or the model service may be unreachable. "
                    'Try again shortly',
        'update_busy_power': 'An update is running — shut down once it has finished',
        'halt_failed': "Couldn't shut down — try again later",
        'update_needs_idle': 'Wait for the conversation to end before updating',
    },
    'zh': {
        'mic_off_tip': '麦克风已关，拨开机身侧面的开关就能说话',
        'mic_on': '麦克风已打开',
        'mic_off': '麦克风已关',
        'hub_unreachable': '连不上小智网关，请检查网关是否在运行',
        'hub_unreachable_short': '连不上小智网关',
        'didnt_catch': '没听清，可以再说一次「{wake}」',
        'no_network': '网络还没连上，稍后再试',
        'no_reply': '没收到回答，可能是网络或模型服务连不上，稍后再试',
        'update_busy_power': '正在更新，更新完再关机',
        'halt_failed': '没能关机，请稍后再试',
        'update_needs_idle': '对话结束后再更新',
    },
}


def t(language, key, **kw):
    return STRINGS.get(language, STRINGS['en'])[key].format(**kw)


def wake_label(wake_words):
    """The first keyword's @label, underscores back to spaces ('Hey Computer', '小麦小麦')."""
    return wake_words[0].split('@')[-1].strip().replace('_', ' ') if wake_words else ''

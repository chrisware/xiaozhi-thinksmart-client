"""Device tools the hub's models may call (MCP over the xiaozhi channel): speaker volume, sleep hours,
screen brightness."""
import asyncio
import json
import logging
import re

log = logging.getLogger(__name__)

TOOLS = {
    'en': [
        {
            'name': 'self.audio_speaker.set_volume',
            'description': "Set the device speaker's volume (0-100). Call this when the user says things like "
                           '"louder", "turn the volume down" or "set the volume to 50"; for a relative change '
                           'read the current volume with get_volume first.',
            'inputSchema': {'type': 'object',
                            'properties': {'volume': {'type': 'integer', 'minimum': 0, 'maximum': 100}},
                            'required': ['volume']},
        },
        {
            'name': 'self.audio_speaker.get_volume',
            'description': "Read the device speaker's current volume (0-100).",
            'inputSchema': {'type': 'object', 'properties': {}},
        },
        {
            'name': 'self.sleep_mode.set',
            'description': "Set the device's sleep hours: during them, reports from finished background tasks "
                           "are not spoken aloud, only shown on screen until the user taps or wakes the device; "
                           "the screen dims; wake word and conversations work as normal, volume unchanged. "
                           'When the user says "stop announcing from ten at night to seven in the morning": '
                           'enabled=true, start="22:00", end="07:00"; when they say "turn sleep mode off": '
                           'enabled=false. Times are 24-hour HH:MM and may cross midnight; pass no times when '
                           'only changing the switch.',
            'inputSchema': {'type': 'object',
                            'properties': {'enabled': {'type': 'boolean'},
                                           'start': {'type': 'string', 'description': 'start time HH:MM'},
                                           'end': {'type': 'string', 'description': 'end time HH:MM'}},
                            'required': ['enabled']},
        },
        {
            'name': 'self.sleep_mode.get',
            'description': "Read the sleep-hours settings and whether the device is in them right now.",
            'inputSchema': {'type': 'object', 'properties': {}},
        },
        {
            'name': 'self.screen.set_brightness',
            'description': "Adjust the screen brightness; pass only one of the two arguments. Brightness 0-100: "
                           "0 is the dimmest (still readable), 100 the brightest. "
                           '\'the screen brighter\' → change=20, \'darker\' → change=-20 ("brighter still" also '
                           'sends change, no need to read first); "brightest" → brightness=100, '
                           '"dimmest" → brightness=0, "set brightness to 60" → brightness=60. '
                           'The device has no auto-brightness. A change stays until changed again; during sleep '
                           'hours the screen dims automatically, and a brightness set inside them lasts only '
                           'until that period ends.',
            'inputSchema': {'type': 'object',
                            'properties': {'brightness': {'type': 'integer', 'minimum': 0, 'maximum': 100},
                                           'change': {'type': 'integer', 'minimum': -100, 'maximum': 100,
                                                      'description': 'added to the current brightness'}}},
        },
        {
            'name': 'self.screen.get_brightness',
            'description': 'Read the screen brightness: level is the current 0-100 value, dimmed whether the '
                           'sleep hours have dimmed it.',
            'inputSchema': {'type': 'object', 'properties': {}},
        },
    ],
    'zh': [
        {
            'name': 'self.audio_speaker.set_volume',
            'description': '设置设备扬声器的音量。用户说「声音大一点」「音量调到 50」这类话时调用；'
                           '相对调整时先用 get_volume 读当前音量。',
            'inputSchema': {'type': 'object',
                            'properties': {'volume': {'type': 'integer', 'minimum': 0, 'maximum': 100}},
                            'required': ['volume']},
        },
        {
            'name': 'self.audio_speaker.get_volume',
            'description': '读取设备扬声器当前的音量（0-100）。',
            'inputSchema': {'type': 'object', 'properties': {}},
        },
        {
            'name': 'self.sleep_mode.set',
            'description': '设置设备的睡眠时段：时段内后台任务做完的汇报不主动念，只在屏幕上提示，'
                           '等用户点一下或唤醒再念；屏幕调暗；唤醒和对话照常，音量不变。'
                           '用户说「晚上十点到早上七点别念了」时 enabled=true, start="22:00", end="07:00"；'
                           '说「关掉睡眠模式」时 enabled=false。时间用 24 小时制 HH:MM，可以跨午夜；只改开关时不用传时间。',
            'inputSchema': {'type': 'object',
                            'properties': {'enabled': {'type': 'boolean'},
                                           'start': {'type': 'string', 'description': '开始时间 HH:MM'},
                                           'end': {'type': 'string', 'description': '结束时间 HH:MM'}},
                            'required': ['enabled']},
        },
        {
            'name': 'self.sleep_mode.get',
            'description': '读取睡眠时段的设置，以及现在是否在睡眠时段内。',
            'inputSchema': {'type': 'object', 'properties': {}},
        },
        {
            'name': 'self.screen.set_brightness',
            'description': '调节设备屏幕亮度，两个参数只传一个。亮度 0-100：0 是最暗（仍看得清），100 最亮。'
                           '「屏幕亮一点」change=20，「暗一点」change=-20（「再亮一点」同样传 change，不用先读）；'
                           '「调到最亮」brightness=100，「调到最暗」brightness=0，「亮度调到 60」brightness=60。'
                           '设备没有自动亮度。调过之后一直保持；睡眠时段屏幕会自动调暗，时段内调的亮度用到这次时段结束。',
            'inputSchema': {'type': 'object',
                            'properties': {'brightness': {'type': 'integer', 'minimum': 0, 'maximum': 100},
                                           'change': {'type': 'integer', 'minimum': -100, 'maximum': 100,
                                                      'description': '在当前亮度上加减'}}},
        },
        {
            'name': 'self.screen.get_brightness',
            'description': '读取屏幕亮度：level 当前亮度 0-100，dimmed 是否因睡眠时段调暗。',
            'inputSchema': {'type': 'object', 'properties': {}},
        },
    ],
}


def tools(language):
    """The tool list the hub's models see, in the client's language."""
    return TOOLS.get(language, TOOLS['en'])


async def _wpctl(*args):
    p = await asyncio.create_subprocess_exec('wpctl', *args, stdout=asyncio.subprocess.PIPE,
                                             stderr=asyncio.subprocess.DEVNULL)
    out, _ = await p.communicate()
    return out.decode()


async def get_volume():
    m = re.search(r'([\d.]+)', await _wpctl('get-volume', '@DEFAULT_AUDIO_SINK@'))
    return round(float(m.group(1)) * 100) if m else None


async def set_volume(volume):
    await _wpctl('set-volume', '@DEFAULT_AUDIO_SINK@', f'{max(0, min(100, int(volume))) / 100:.2f}')


async def handle(payload, on_volume=None, client=None):
    """One JSON-RPC request from the hub; returns the reply payload (None for notifications)."""
    method, req_id, params = payload.get('method'), payload.get('id'), payload.get('params') or {}
    if req_id is None:
        return None

    def result(value):
        return {'jsonrpc': '2.0', 'id': req_id, 'result': value}

    def error(message):
        return {'jsonrpc': '2.0', 'id': req_id, 'error': {'code': -32601, 'message': message}}

    if method == 'initialize':
        return result({'protocolVersion': '2024-11-05', 'capabilities': {'tools': {}},
                       'serverInfo': {'name': 'thinksmart-client', 'version': '0.1.0'}})
    if method == 'tools/list':
        return result({'tools': tools(getattr(client, 'language', 'en'))})
    if method == 'tools/call':
        name, args = params.get('name'), params.get('arguments') or {}
        try:
            if name == 'self.audio_speaker.set_volume':
                await set_volume(args['volume'])
                if on_volume:
                    on_volume(int(args['volume']))
                text = json.dumps({'success': True, 'volume': int(args['volume'])})
            elif name == 'self.audio_speaker.get_volume':
                text = json.dumps({'volume': await get_volume()})
            elif name == 'self.sleep_mode.set' and client:
                text = json.dumps({'success': True, 'sleep': await client.set_sleep(
                    enabled=args.get('enabled'), start=args.get('start'), end=args.get('end'))},
                    ensure_ascii=False)
            elif name == 'self.sleep_mode.get' and client:
                text = json.dumps({**client.sleep, 'active': client.sleeping}, ensure_ascii=False)
            elif name == 'self.screen.set_brightness' and client:
                text = json.dumps({'success': True, **await client.set_brightness(
                    level=args.get('brightness'), change=args.get('change'))})
            elif name == 'self.screen.get_brightness' and client:
                text = json.dumps(client.brightness())
            else:
                return error(f'Unknown tool: {name}')
        except Exception as e:
            log.exception('tool %s failed', name)
            return result({'content': [{'type': 'text', 'text': str(e)}], 'isError': True})
        return result({'content': [{'type': 'text', 'text': text}], 'isError': False})
    return error(f'Method not implemented: {method}')

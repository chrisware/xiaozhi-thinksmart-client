// ThinkSmart voice client page v2: renders what the client streams on /events and sends the buttons back.
// Same contract as v1. Open with ?demo (or ?demo=<scene>) to preview without a client.
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = n => String(n).padStart(2, '0');
const DEMO = new URLSearchParams(location.search).get('demo');   // null when not a demo
if (DEMO !== null && /[?&]still\b/.test(location.search)) document.documentElement.classList.add('still');

/* ---- language ----
   The client sends its cfg language and wake label in the snapshot; English is the default of this
   fork. tr() fills {wake} (the spoken wake phrase) and any other params. Strings with <em> are set
   as innerHTML only where named. */
let lang = 'en', WAKE = 'Hey Computer';
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEK = '日一二三四五六';
const GREET = {   // first entry whose end-hour is past now
  en: [[5, 'greet_late'], [12, 'greet_morning'], [17, 'greet_afternoon'], [23, 'greet_evening'], [24, 'greet_late']],
  zh: [[5, 'greet_late'], [9, 'greet_morning'], [12, 'greet_mid_morning'], [14, 'greet_noon'], [18, 'greet_afternoon'], [23, 'greet_evening'], [24, 'greet_late']],
};
const STR = {
  en: {
    page_title: 'Computer', brand: 'Computer',
    s_weather: "What's the weather tomorrow?", s_weekend: 'Plan something for the weekend',
    s_joke: 'Tell me a bad joke', s_quiet: 'Turn the volume down a bit',
    greet_late: "It's late", greet_morning: 'Good morning', greet_mid_morning: 'Good morning',
    greet_noon: 'Good afternoon', greet_afternoon: 'Good afternoon', greet_evening: 'Good evening',
    try_ask: 'Try asking me something',
    idle_t: 'Say <em>«{wake}»</em>', idle_hint: 'or tap the mic; hold it down to talk straight away',
    idle_hint_kept: 'The conversation is still here — wake me and carry on',
    connecting_t: 'Connecting…', connecting_hint: 'I start listening once the voice hub is up',
    ptt_t: 'Release to <em>send</em>', ptt_hint: 'Let go when you have finished',
    listening_t: "I'm listening", listening_hint: 'Pause when you are done and I will answer',
    thinking_t: '<em>{model}</em> is thinking', thinking_hint: 'A tricky question may take a moment',
    speaking_t: 'Answering', speaking_hint: 'Say «{wake}» or tap Interrupt to stop me',
    recog_t: 'Recognising', recog_hint: 'You stopped talking — turning your words into text',
    report_1: '1 report waiting', report_n: '{n} reports waiting',
    micoff_t: 'Microphone off', micoff_hint: 'Flip the switch on the side of the case to talk',
    report_hint: 'A report is waiting — tap Listen (top right) or say «{wake}»',
    sleep_hint: 'Sleep hours: reports are not read out',
    link_on: 'Live', link_off: 'Idle',
    ctl_interrupt: 'Interrupt', ctl_talk: 'Talk', ctl_end: 'End',
    pill_none: 'Choose a model', model: 'Model', badge_on: 'In use', aria_models: 'Switch model', aria_listen: 'Listen to reports',
    aria_settings: 'Settings', aria_sleeping: 'Asleep',
    switch_fail: 'Switch failed', switch_fail_noresp: 'Switch failed: the client is not responding',
    switched: 'Switched to {label}',
    sleep_off_note: 'Sleep hours are off: reports are read out as they arrive; volume and brightness as usual',
    sleep_active_note: "It's sleep hours now; they end at {end}",
    sleep_inactive_note: 'Sleep hours are {start}-{end} every day; not in them right now',
    sheet_models: 'Choose a model', sheet_models_p: 'New questions go to the one you pick; each model keeps its own conversation',
    aria_close: 'Close',
    not_saved: 'Not saved', not_saved_noresp: 'Not saved: the client is not responding',
    bright_dimmed_note: 'The screen is dimmed for the sleep hours; move the slider to set your own for the rest of tonight',
    bright_note: 'This level stays after the screen wakes; you can also say «{wake}, brighter» or "make it the brightest"',
    bright_label: 'Screen brightness',
    off_label: 'Auto screen-off',
    off_desc: 'The screen turns off after a while without a touch or a conversation; a touch, your presence or ' +
      '«{wake}» wakes it. Off keeps the screen on all the time; sleep hours still dim it.',
    off_note: 'Screen off after {n} {unit} without a touch or a conversation',
    off_never: 'The screen stays on and never blanks by itself',
    unit_min: 'min',
    sleep_label: 'Sleep hours',
    sleep_desc: 'During them, finished background tasks only show a note on screen, they are not read out until ' +
      'you tap the note or wake the device; the screen dims. Waking and conversations work as usual, volume unchanged.',
    t_start: 'Start', t_end: 'End', earlier30: '30 minutes earlier', later30: '30 minutes later',
    sleep_say_hint: 'You can also say: «{wake}, stop announcing from ten at night to seven in the morning», ' +
      '"turn sleep mode off"',
    hist_label: 'Chat history',
    hist_desc: 'Kept on this device — it survives disconnects and restarts; only the most recent stretch goes to ' +
      'the model each time, older parts are summarised into memory. Clearing deletes this device\'s records and ' +
      'memories for every model; Claude Code and Grok Bot keep their own conversations, untouched.',
    hist_say_hint: 'You can also say: «{wake}, clear the chat history» — it will ask again.',
    clear: 'Clear', clear_confirm: 'Confirm clear',
    clear_mem: 'Clear memory only, keep the log', clear_mem_confirm: 'Confirm: memory only',
    clear_arm: 'This deletes every model\'s chat history; tap "Confirm clear" again',
    cleared: 'Chat history cleared', clear_fail: "Couldn't clear",
    mem_arm: 'The models forget what was said earlier; the messages stay. Tap "Confirm: memory only" again',
    mem_cleared: 'Memory cleared; the messages are still here',
    agents_keep: "{names} keep their own side of the conversation — that wasn't touched",
    join_and: ' and ',
    ip_label: 'Device IP',
    ip_hint: 'Open http://{ip}:16688/admin on a computer on the same network for the hub console',
    ip_waiting: 'The device address shows up here once the Wi-Fi is connected', ip_none: 'Not online',
    power_label: 'Shut down',
    power_desc: 'Shut down here before unplugging; after the screen goes dark wait 10 seconds, then pull the plug. ' +
      'Yanking the power straight out can corrupt the system so it won\'t boot next time.',
    power: 'Shut down', power_confirm: 'Confirm shutdown',
    power_arm: 'After shutting down, unplug the power; plug it back in after 30 seconds to boot. ' +
      'Tap "Confirm shutdown" again',
    power_demo: 'The demo does not really shut down', power_fail: "Couldn't shut down",
    power_now: 'Shutting down', power_wait: 'Wait 10 seconds after the screen goes dark, then unplug',
    report_now: 'Reading it out now',
    chat_title: 'Chat with {label}', chat: 'Chat',
    meta_n_live: '{n} messages · live', meta_n_saved: '{n} messages · saved', meta_new: 'New conversation',
    cut: 'interrupted', pending_recog: 'Recognising…', pending_ptt: 'Release when done', pending_listen: 'Listening…',
    pending_think: 'Thinking',
    noresp: 'The client is not responding',
    ended: 'Conversation ended; the chat history is saved',
    settings: 'Settings', settings_p: 'Preferences for this device; they survive client updates',
    upd_title: 'Software update', upd_to_title: 'Updating to {v}',
    upd_none: 'This device has no update service installed',
    upd_stage_preparing: 'Preparing', upd_stage_downloading: 'Downloading', upd_stage_installing: 'Installing',
    upd_stage_testing: 'Restarting and self-testing', upd_stage_rolling: 'Self-test failed — rolling back',
    upd_paused: '{stage}{pct}. The voice assistant pauses briefly — please don\'t unplug it',
    upd_avail_title: 'New version {v}', upd_avail_text: '{cur}, about {size} to download',
    upd_retry: '{msg}. You can try again',
    upd_btn: 'Update', upd_btn_confirm: 'Confirm update',
    upd_latest: '{msg} — up to date',
    upd_uptodate: '{cur} — up to date', upd_uptodate_checked: '{cur} — up to date (checked {ago})',
    upd_uptodate_bare: 'Up to date',
    upd_check: 'Check for updates', upd_checking: 'Checking for updates…',
    upd_arm: 'The assistant stops for about a minute to update; tap "Confirm update" again to start',
    upd_demo: 'The demo does not really install anything', upd_fail: "Couldn't start the update",
    ver_current: 'Current version {v}',
    period_join: '{a}. {b}',
    ago_now: 'just now', ago_min: '{n} min ago', ago_hour: '{n} h ago', ago_day: '{n} d ago',
  },
  zh: {
    page_title: '小麦', brand: '小麦',
    s_weather: '明天北京天气怎么样？', s_weekend: '帮我想个周末计划',
    s_joke: '讲个冷笑话', s_quiet: '把音量调小一点',
    greet_late: '夜深了', greet_morning: '早上好', greet_mid_morning: '上午好',
    greet_noon: '中午好', greet_afternoon: '下午好', greet_evening: '晚上好',
    try_ask: '试试这样问我',
    idle_t: '说<em>「{wake}」</em>', idle_hint: '或者点麦克风；按住可以直接说',
    idle_hint_kept: '对话还在，唤醒后可以接着聊',
    connecting_t: '正在连接…', connecting_hint: '连上小智网关后就开始听',
    ptt_t: '松开<em>发送</em>', ptt_hint: '说完松开手指',
    listening_t: '我在听', listening_hint: '说完停一下，我就开始回答',
    thinking_t: '<em>{model}</em> 正在思考', thinking_hint: '复杂的问题可能要想一会儿',
    speaking_t: '正在回答', speaking_hint: '喊「{wake}」或点打断就能停下',
    recog_t: '正在识别', recog_hint: '你说完了，正在把话转成文字',
    report_1: '有一条待汇报', report_n: '有 {n} 条待汇报',
    micoff_t: '麦克风已关', micoff_hint: '拨开机身侧面的开关就能说话',
    report_hint: '有待汇报：点右上角收听，或叫一声「{wake}」',
    sleep_hint: '睡眠时段：汇报不会自动念',
    link_on: '对话中', link_off: '待机',
    ctl_interrupt: '打断', ctl_talk: '说话', ctl_end: '结束',
    pill_none: '选择模型', model: '模型', badge_on: '使用中', aria_models: '切换模型', aria_listen: '收听待汇报',
    aria_settings: '设置', aria_sleeping: '睡眠中',
    switch_fail: '切换失败', switch_fail_noresp: '切换失败：客户端没有响应',
    switched: '已切换到 {label}',
    sleep_off_note: '睡眠时段已关闭：补报一到就念，音量和亮度照常',
    sleep_active_note: '现在是睡眠时段，到 {end} 结束',
    sleep_inactive_note: '每天 {start} 到 {end} 是睡眠时段，现在不在',
    sheet_models: '选择模型', sheet_models_p: '切换后，新的提问交给它回答；每个模型各自保留对话',
    aria_close: '关闭',
    not_saved: '没保存上', not_saved_noresp: '没保存上：客户端没有响应',
    bright_dimmed_note: '睡眠时段内屏幕调暗了；拖一下滑条，这次时段就按你调的亮度',
    bright_note: '熄屏再亮也保持这个亮度；也可以说「{wake}，屏幕亮一点」「调到最亮」',
    bright_label: '屏幕亮度',
    off_label: '自动熄屏',
    off_desc: '一段时间没碰屏幕、也没在对话就熄屏；碰一下屏幕、走近或叫「{wake}」就亮。关掉就一直亮着，睡眠时段照常调暗。',
    off_note: '{n} {unit}没碰屏幕、也没在对话，就熄屏',
    off_never: '屏幕一直亮着，不会自动熄屏',
    unit_min: '分钟',
    sleep_label: '睡眠时段',
    sleep_desc: '时段内后台任务做完的汇报不念出来，只在屏幕上提示，点一下或唤醒后再念；屏幕调暗。叫它的话照常回答，音量不变。',
    t_start: '开始', t_end: '结束', earlier30: '提前半小时', later30: '推后半小时',
    sleep_say_hint: '也可以直接说：「{wake}，晚上十点到早上七点别念了」「关掉睡眠模式」',
    hist_label: '聊天记录',
    hist_desc: '记录保存在本机，断开、重启后还在；每次只带最近一段给模型，更早的自动总结成记忆。清除只删本机存的所有模型的记录和记忆；Claude Code、Grok Bot 有自己的对话和记忆，不受影响。',
    hist_say_hint: '也可以直接说：「{wake}，清除聊天记录」，它会再问一遍。',
    clear: '清除', clear_confirm: '确认清除',
    clear_mem: '只清除记忆、保留记录', clear_mem_confirm: '确认只清除记忆',
    clear_arm: '清除后所有模型的聊天记录都会删掉，再点一下「确认清除」',
    cleared: '聊天记录已清除', clear_fail: '没能清除',
    mem_arm: '模型会忘掉以前聊过的，聊天记录留着；再点一下「确认只清除记忆」',
    mem_cleared: '记忆已清除，聊天记录还在',
    agents_keep: '{names}自己那边的对话没有动',
    join_and: '和',
    ip_label: '本机 IP',
    ip_hint: '在同一网络的电脑上打开 http://{ip}:16688/admin 进网关后台',
    ip_waiting: '连上 WiFi 后这里显示设备的地址', ip_none: '未联网',
    power_label: '关机',
    power_desc: '拔电源之前先在这里关机，屏幕变黑后等 10 秒再拔。插着电直接拔，可能把系统弄坏，下次开不了机。',
    power: '关机', power_confirm: '确认关机',
    power_arm: '关机后要拔掉电源，等 30 秒再插上才会开机，再点一下「确认关机」',
    power_demo: '演示模式不会真的关机', power_fail: '没能关机',
    power_now: '正在关机', power_wait: '屏幕变黑后等 10 秒再拔掉电源',
    report_now: '马上念给你听',
    chat_title: '与 {label} 的对话', chat: '对话',
    meta_n_live: '{n} 条消息 · 对话中', meta_n_saved: '{n} 条消息 · 记录已保存', meta_new: '新对话',
    cut: '已打断', pending_recog: '正在识别…', pending_ptt: '说完松开', pending_listen: '正在听…',
    pending_think: '正在思考',
    noresp: '客户端没有响应',
    ended: '对话已结束，聊天记录已保存',
    settings: '设置', settings_p: '这台设备自己的偏好，升级客户端也会保留',
    upd_title: '软件更新', upd_to_title: '正在更新到 {v}',
    upd_none: '这台设备还没装更新服务',
    upd_stage_preparing: '正在准备', upd_stage_downloading: '正在下载', upd_stage_installing: '正在安装',
    upd_stage_testing: '正在重启并自检', upd_stage_rolling: '自检没通过，正在退回',
    upd_paused: '{stage}{pct}。语音助手会暂停一会儿，请不要断电',
    upd_avail_title: '有新版本 {v}', upd_avail_text: '{cur}，下载约 {size}',
    upd_retry: '{msg}。可以再试一次',
    upd_btn: '更新', upd_btn_confirm: '确认更新',
    upd_latest: '{msg}，已是最新',
    upd_uptodate: '{cur}，已是最新', upd_uptodate_checked: '{cur}，已是最新（{ago}检查过）',
    upd_uptodate_bare: '已是最新',
    upd_check: '检查更新', upd_checking: '正在检查更新…',
    upd_arm: '更新时语音助手会停一会儿（约 1 分钟），再点一下「确认更新」开始',
    upd_demo: '演示模式不会真的安装', upd_fail: '没能开始更新',
    ver_current: '当前版本 {v}',
    period_join: '{a}。{b}',
    ago_now: '刚刚', ago_min: '{n} 分钟前', ago_hour: '{n} 小时前', ago_day: '{n} 天前',
  },
};
function tr(key, params) {
  let s = (STR[lang] && STR[lang][key]) ?? STR.en[key] ?? key;
  s = s.replaceAll('{wake}', WAKE);
  if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
  return s;
}
// Static page text: index.html marks it with data-i18n (textContent) / data-i18n-aria (aria-label).
function applyStatic() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = tr('page_title');
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = tr(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', tr(el.dataset.i18nAria));
  for (const b of $('offMinutes').children) b.textContent = `${b.dataset.m} ${tr('unit_min')}`;
  renderChips();
}
function setLang(l, wake) {
  if (l === lang && (!wake || wake === WAKE)) return;
  lang = l || 'en';
  if (wake) WAKE = wake;
  applyStatic();
  renderModels(); renderStatus(); renderSettings(); renderBright(); renderScreenOff(); renderUpdate();
  renderHead(); renderThread(); renderPending(); tick();
}

const ui = {
  status: { state: 'idle', connected: false, uploading: false },
  models: { current: null, options: [] },
  thread: { entry: null, messages: [] },
  ptt: false,
};

const SUGGEST = [
  ['s_weather', '#ffb54729', '#ffcf7a', '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>'],
  ['s_weekend', '#5ee0ff24', '#8ff0ff', '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>'],
  ['s_joke', '#ff7ac824', '#ff9bd6', '<circle cx="12" cy="12" r="9"/><path d="M8 14.5a5 5 0 0 0 8 0M9 9.5h.01M15 9.5h.01"/>'],
  ['s_quiet', '#9b7bff2b', '#c8b4ff', '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 12h4"/>'],
];
function renderChips() {
  const box = $('chips');
  box.textContent = '';
  for (const [key, bg, fg, icon] of SUGGEST) {
    const q = tr(key);
    const b = document.createElement('button');
    b.className = 'chip';
    b.innerHTML = `<i style="background:${bg};color:${fg}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></i>${esc(q)}`;
    b.addEventListener('click', () => post('/api/text', { text: q }));
    box.appendChild(b);
  }
}

/* ---- clock ---- */
function tick() {
  const now = new Date();
  const hm = pad(now.getHours()) + ':' + pad(now.getMinutes());
  $('time').textContent = hm;
  $('bigTime').textContent = hm;
  $('bigDate').textContent = lang === 'zh'
    ? `${now.getMonth() + 1}月${now.getDate()}日  星期${WEEK[now.getDay()]}`
    : `${DAY[now.getDay()]} ${now.getDate()} ${MONTH[now.getMonth()]}`;
  const h = now.getHours();
  $('greet').textContent = tr((GREET[lang] || GREET.en).find(g => h < g[0])[1]);
}

/* ---- the orb's corona: 48 bars around the orb, one shape per state ----
   idle: short and still. connecting: 12 dashes, turned slowly by CSS. thinking: a comet orbiting (CSS).
   listening: the whole ring pushes outward with your voice, all bars together — loud is big, quiet barely moves.
   speaking: three lobes turning round the ring, swelling with the reply's volume.
   Only listening/speaking redraw every frame; any state change morphs the bars over 0.4 s, then the loop stops.
   All bars are drawn on one canvas: as 48 elements, restyling them 30 times a second kept
   the device's main thread at ~93% and the page at ~17 fps. */
const BARS = 48, R_IN = 110, BAR_W = 6, REST = 8, REACH = 46;   // px; REST + REACH stays inside the canvas
const corona = document.createElement('canvas');
const CSIZE = 330, DPR = Math.min(2, window.devicePixelRatio || 1);
corona.width = corona.height = CSIZE * DPR;
corona.style.width = corona.style.height = '100%';
$('corona').appendChild(corona);
const cx = corona.getContext('2d');
const ANG = Array.from({ length: BARS }, (_, i) => i / BARS * Math.PI * 2);
const COS = ANG.map(Math.cos), SIN = ANG.map(Math.sin);
// per bar: [length px, opacity]; what is on screen, where a morph starts, and where the state wants it
const cur = new Float32Array(BARS * 2), from = new Float32Array(BARS * 2), tgt = new Float32Array(BARS * 2);
let barFill = null, barFillState = '';
function fillFor(state) {
  // one radial gradient for all bars: inner end --c2, outer end --c1
  if (barFillState !== state) {
    const css = getComputedStyle(document.body);
    barFill = cx.createRadialGradient(0, 0, R_IN, 0, 0, R_IN + REST + REACH);
    barFill.addColorStop(0, css.getPropertyValue('--c2').trim());
    barFill.addColorStop(1, css.getPropertyValue('--c1').trim());
    barFillState = state;
  }
  return barFill;
}
// Bars of (nearly) the same opacity share one path and one fill: 48 separate fills cost the device's
// main thread ~20% of a core while speaking. The path takes each bar's transform as it is added.
const bucket = new Uint8Array(BARS);
function drawBars(bars) {
  const c = CSIZE * DPR / 2;
  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.clearRect(0, 0, corona.width, corona.height);
  cx.fillStyle = fillFor(document.body.dataset.state || 'idle');
  for (let i = 0; i < BARS; i++) bucket[i] = bars[i * 2] < .5 ? 0 : Math.max(1, Math.round(bars[i * 2 + 1] * 20));
  for (let q = 1; q <= 20; q++) {
    if (!bucket.includes(q)) continue;
    cx.beginPath();
    for (let i = 0; i < BARS; i++) {
      if (bucket[i] !== q) continue;
      cx.setTransform(COS[i] * DPR, SIN[i] * DPR, -SIN[i] * DPR, COS[i] * DPR, c, c);
      cx.roundRect(-BAR_W / 2, -R_IN - bars[i * 2], BAR_W, bars[i * 2], BAR_W / 2);
    }
    cx.setTransform(DPR, 0, 0, DPR, c, c);   // the radial gradient is centred on the orb
    cx.globalAlpha = q / 20;
    cx.fill();
  }
  cx.globalAlpha = 1;
}

// target shape of a state into out; v = sound level 0..1, p = phase (s), t = seconds in this state
function shapeOf(state, v, p, t, out) {
  for (let i = 0; i < BARS; i++) {
    const a = ANG[i], f = i / BARS;
    let len = REST, alpha = 1;
    if (state === 'thinking') { len = 6.6 + 28.5 * f * f; alpha = .1 + .9 * f ** 1.6; }
    else if (state === 'connecting') { len = i % 4 ? 4.2 : 16.5; alpha = i % 4 ? .35 : 1; }
    else if (state === 'listening') {
      // a short burst on waking says "I'm here", then the ring follows the voice as one
      const env = Math.max(v, .5 * Math.max(0, 1 - t / .6) ** 2);
      const grain = .84 + .16 * Math.sin(a * 5 + p * 3.1) * Math.sin(a * 3 - p * 2.3);
      len = REST - 1 + 1.2 * Math.sin(a * 4 + p * 1.5) + REACH * env * grain;
    } else if (state === 'speaking') {
      const lobe = .5 + .5 * Math.sin(a * 3 - p * 1.3);
      len = REST + 4 * lobe + REACH * v * (.3 + .7 * lobe);
      alpha = .6 + .4 * lobe;
    }
    out[i * 2] = len;
    out[i * 2 + 1] = alpha;
  }
}

// The mic level (RMS) in decibels, so a quiet voice visibly moves the corona. Measured on the device
// (2026-11-01, 9 listening turns): room noise -74..-80 dBFS with rare blips to -62, normal speech
// -60..-42 dBFS. The old linear scale (full at -23 dBFS) moved the corona 1–7% for that speech.
// Now noise stays 0, a quiet voice (-55) reaches ~30%, a normal one (-45) ~58%, a loud one (-30) 100%.
const MIC_FLOOR = -66, MIC_FULL = -30;   // dBFS
const micLevel = rms => Math.min(1, Math.max(0, (20 * Math.log10(rms + 1e-6) - MIC_FLOOR) / (MIC_FULL - MIC_FLOOR)));

const STILL = document.documentElement.classList.contains('still');
const level = { target: 0, value: 0, phase: 0, raf: 0, last: 0, state: '', since: 0, mix: 1 };
const isLive = s => s === 'listening' || s === 'speaking';
function setCorona(state) {
  if (state === level.state) return;
  // morph from what is on screen; a spinning corona is turned by CSS, so carry its angle into the bars
  const m = getComputedStyle($('corona')).transform.match(/matrix\(([^,]+),\s*([^,]+)/);
  const k = m ? Math.round(Math.atan2(+m[2], +m[1]) / (Math.PI * 2) * BARS) : 0;
  for (let i = 0; i < BARS; i++) {
    const j = ((i - k) % BARS + BARS) % BARS;
    from[i * 2] = cur[j * 2]; from[i * 2 + 1] = cur[j * 2 + 1];
  }
  level.state = state;
  level.since = performance.now();
  level.mix = level.last ? 0 : 1;   // the first paint just draws
  if (!isLive(state)) level.target = 0;
  if (STILL) {   // screenshots: one fairly loud, settled frame
    shapeOf(state, isLive(state) ? .7 : 0, 1.2, 9, cur);
    drawBars(cur);
    if (isLive(state)) drawLive(.7, 1.2);
    return;
  }
  if (!level.raf) {
    level.last = performance.now() - 34;
    level.raf = requestAnimationFrame(levelLoop);
  }
}
function levelLoop(now) {
  level.raf = requestAnimationFrame(levelLoop);
  if (now - level.last < 33) return;      // ~30 fps is plenty
  const dt = Math.min(.1, (now - level.last) / 1000);
  level.last = now;
  level.value += (level.target - level.value) * (level.target > level.value ? .55 : .2);
  level.phase += dt * 2.4;
  const live = isLive(level.state);
  shapeOf(level.state, level.value, level.phase, (now - level.since) / 1000, tgt);
  if (level.mix < 1) {
    level.mix = Math.min(1, level.mix + dt / .4);
    const e = 1 - (1 - level.mix) ** 3;
    for (let i = 0; i < tgt.length; i++) cur[i] = from[i] + (tgt[i] - from[i]) * e;
  } else cur.set(tgt);
  drawBars(cur);
  if (live || level.mix < 1) drawLive(level.value, level.phase);   // after live: let the level settle
  else {
    cancelAnimationFrame(level.raf);
    level.raf = 0;
    level.target = level.value = 0;
    $('corona').style.transform = $('core').style.transform = $('micRing').style.transform = $('mouth').style.transform = '';
  }
}
// The whole corona layer grows with the level too (compositor only, no repaint): with the longer bars,
// the tips go from r ≈ 117 px when quiet to ≈ 190 px when loud. Core, mouth, mic ring and the wave follow.
function drawLive(v, p) {
  $('corona').style.transform = `scale(${(1 + v * .16).toFixed(3)})`;
  $('core').style.transform = `scale(${(1 + v * .13).toFixed(3)})`;
  $('mouth').style.transform = `scaleY(${(.55 + v * 1.6).toFixed(3)})`;
  if (level.state === 'listening') $('micRing').style.transform = `scale(${(1 + v * .16).toFixed(3)})`;   // invisible otherwise
  const pending = $('pending');
  if (pending) pending.querySelectorAll('.wave b').forEach((b, i) => { b.style.transform = `scaleY(${(.18 + v * (.5 + .5 * Math.sin(p * 3 + i * 1.3))).toFixed(3)})`; });
}

/* ---- status: orb, title, hint, buttons ---- */
function modelName() {
  const cur = ui.models.current;
  return cur ? cur.label : tr('model');
}
const shownState = () => (ui.ptt ? 'listening' : ui.status.state);

function renderStatus() {
  const { state, connected } = ui.status;
  const shown = shownState();
  document.body.dataset.state = shown;
  const text = {
    idle: [tr('idle_t'), connected ? tr('idle_hint_kept') : tr('idle_hint')],
    connecting: [tr('connecting_t'), tr('connecting_hint')],
    listening: ui.ptt ? [tr('ptt_t'), tr('ptt_hint')] : [tr('listening_t'), tr('listening_hint')],
    thinking: [tr('thinking_t', { model: esc(modelName()) }), tr('thinking_hint')],
    speaking: [tr('speaking_t'), tr('speaking_hint')],
  }[shown] || ['', ''];
  if (ui.status.recognising && !ui.ptt) text.splice(0, 2, tr('recog_t'), tr('recog_hint'));
  const micOff = ui.status.mic === false;
  document.body.classList.toggle('mic-off', micOff);
  const reports = ui.status.reports || 0;
  const sleeping = !!(ui.status.sleep && ui.status.sleep.active);
  document.body.classList.toggle('has-reports', reports > 0);
  document.body.classList.toggle('sleeping', sleeping);
  $('reportText').textContent = reports > 1 ? tr('report_n', { n: reports }) : tr('report_1');
  if (micOff && shown === 'idle') text.splice(0, 2, tr('micoff_t'), tr('micoff_hint'));
  else if (reports && shown === 'idle') text[1] = tr('report_hint');
  else if (sleeping && shown === 'idle' && !connected) text[1] = tr('sleep_hint');
  $('title').innerHTML = text[0];
  $('hint').textContent = text[1];
  // recognising, thinking or speaking: the turn can be interrupted (the question is dropped if nothing was said yet)
  $('btnAbort').disabled = !connected || !(state === 'speaking' || state === 'thinking' || (ui.status.recognising && !ui.ptt));
  $('btnEnd').disabled = !connected;
  const link = $('link');
  link.classList.toggle('on', connected);
  link.querySelector('span').textContent = connected ? tr('link_on') : tr('link_off');
  renderSide();
  renderPending();
  setCorona(shown);
  renderSettings();
  renderBright();
  renderScreenOff();
  renderUpdate();
}

/* ---- models ---- */
const logoSrc = m => (m && m.logo ? `/static/logos/${m.logo}.svg` : '');

function renderModels() {
  const cur = ui.models.current;
  $('pillLogo').src = logoSrc(cur);
  $('pillLabel').textContent = cur ? cur.label : tr('pill_none');
  $('pillModel').textContent = cur ? (cur.model || cur.company || '') : '';
  const grid = $('grid');
  grid.textContent = '';
  for (const m of ui.models.options) {
    const on = cur && cur.entry === m.entry;
    const b = document.createElement('button');
    b.className = 'card' + (on ? ' on' : '');
    b.innerHTML = `<img class="tile" src="${esc(logoSrc(m))}" alt="">` + (on ? `<span class="badge">${tr('badge_on')}</span>` : '') +
      `<span><b>${esc(m.label)}</b><small>${esc(m.model || '')}</small><small class="co">${esc(m.company || '')}</small></span>`;
    b.addEventListener('click', () => switchModel(m));
    grid.appendChild(b);
  }
  renderHead();
}

function openSheet(on) {
  $('sheet').classList.toggle('on', on);
}

// The page switches at once and the hub catches up; if it fails, back to what the client last said.
// While a switch is on its way, the client's events about the old model don't flip the page back.
const server = { models: null, thread: null };
const seenThreads = {};   // entry -> the client's messages for that model, shown at once when switching to it
let switching = null;

async function switchModel(m) {
  openSheet(false);
  if (ui.models.current && ui.models.current.entry === m.entry) return;
  if (DEMO) return demo.switchTo(m);
  switching = m.entry;
  ui.models = Object.assign({}, ui.models, { current: m });
  ui.thread = { entry: m.entry, messages: seenThreads[m.entry] || [] };
  renderModels(); renderThread(); renderStatus();
  let error = null;
  try {
    const r = await (await fetch('/api/model', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                 body: JSON.stringify({ kind: m.kind, vendor: m.vendor, entry: m.entry }) })).json();
    if (r.ok === false) error = r.error || tr('switch_fail');
  } catch (e) {
    error = tr('switch_fail_noresp');
  }
  if (switching !== m.entry) return;   // another switch since
  switching = null;
  if (server.models) ui.models = server.models;
  if (server.thread) ui.thread = server.thread;
  renderModels(); renderThread(); renderStatus();
  toast(error || tr('switched', { label: m.label }), error ? 'error' : '');
}

/* ---- settings: sleep hours ---- */
const sleepEdit = {};   // changes sent but not yet confirmed by a state event
let sleepTimer = null;
function sleepSetting() {
  return Object.assign({ enabled: false, start: '22:00', end: '07:00', active: false }, ui.status.sleep || {}, sleepEdit);
}
function renderSettings() {
  const s = sleepSetting();
  $('sleepSwitch').setAttribute('aria-checked', String(s.enabled));
  $('sleepTimes').classList.toggle('off', !s.enabled);
  $('sleepStart').textContent = s.start;
  $('sleepEnd').textContent = s.end;
  $('sleepNote').textContent = !s.enabled ? tr('sleep_off_note')
    : s.active ? tr('sleep_active_note', { end: s.end }) : tr('sleep_inactive_note', { start: s.start, end: s.end });
}
function sendSleep(changes, delay) {
  Object.assign(sleepEdit, changes);
  renderSettings();
  clearTimeout(sleepTimer);
  sleepTimer = setTimeout(async () => {
    const body = Object.assign({}, sleepEdit);
    if (DEMO) { ui.status.sleep = Object.assign(sleepSetting(), body); for (const k in body) delete sleepEdit[k]; return renderStatus(); }
    try {
      const r = await (await fetch('/api/sleep', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                   body: JSON.stringify(body) })).json();
      if (r.ok === false) toast(r.error || tr('not_saved'), 'error');
    } catch (e) {
      toast(tr('not_saved_noresp'), 'error');
    }
    for (const k in body) if (sleepEdit[k] === body[k]) delete sleepEdit[k];
    renderSettings();
  }, delay);
}
function stepTime(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map(Number);
  const t = ((h * 60 + m + minutes) % 1440 + 1440) % 1440;
  return pad(Math.floor(t / 60)) + ':' + pad(t % 60);
}
$('sleepSwitch').addEventListener('click', () => sendSleep({ enabled: !sleepSetting().enabled }, 0));
for (const b of document.querySelectorAll('.stepper button')) {
  b.addEventListener('click', () => sendSleep({ [b.dataset.k]: stepTime(sleepSetting()[b.dataset.k], Number(b.dataset.d)) }, 600));
}
/* ---- settings: screen brightness (the client hints the system's screen blanker) ---- */
let brightEdit = null;   // the slider's value while the finger is on it or the change is on its way
let brightTimer = null, brightSent = 0, brightDrag = false;
function brightSetting() {
  return Object.assign({ level: 100, dimmed: false }, ui.status.brightness || {},
                       brightEdit === null ? {} : { level: brightEdit, dimmed: false });
}
function renderBright() {
  const b = brightSetting();
  if (brightEdit === null) $('brightRange').value = b.level;
  $('brightRange').style.setProperty('--fill', b.level + '%');
  $('brightNum').textContent = b.level + '%';
  $('brightNote').textContent = b.dimmed ? tr('bright_dimmed_note') : tr('bright_note');
}
async function sendBright(body) {
  if (DEMO) { ui.status.brightness = { level: body.level, dimmed: false }; return; }
  try {
    const r = await (await fetch('/api/brightness', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                       body: JSON.stringify(body) })).json();
    if (r.ok === false) toast(r.error || tr('not_saved'), 'error');
  } catch (e) {
    toast(tr('not_saved_noresp'), 'error');
  }
}
// The slider follows the finger itself (pointer events, like the mic button) instead of relying on
// the browser's own range dragging under touch. While dragging: at most one change every 150 ms
// (the blanker looks every 200 ms); the last one on release.
function dragBright(e) {
  const r = $('brightRange').getBoundingClientRect(), thumb = 48;
  brightEdit = Math.round(Math.max(0, Math.min(1, (e.clientX - r.left - thumb / 2) / (r.width - thumb))) * 100);
  $('brightRange').value = brightEdit;
  renderBright();
  clearTimeout(brightTimer);
  const send = () => { brightSent = Date.now(); sendBright({ level: brightEdit }); };
  if (Date.now() - brightSent > 150) send();
  else brightTimer = setTimeout(send, 150);
}
$('brightRange').addEventListener('pointerdown', e => {
  e.preventDefault();
  brightDrag = true;
  try { $('brightRange').setPointerCapture(e.pointerId); } catch (err) { /* keeps following without capture */ }
  dragBright(e);
});
$('brightRange').addEventListener('pointermove', e => {
  if (brightDrag) dragBright(e);
});
function dropBright() {
  if (!brightDrag) return;
  brightDrag = false;
  clearTimeout(brightTimer);
  const level = brightEdit;
  sendBright({ level }).then(() => { if (brightEdit === level) brightEdit = null; renderStatus(); });
}
$('brightRange').addEventListener('pointerup', dropBright);
$('brightRange').addEventListener('pointercancel', dropBright);

/* ---- settings: auto screen-off (the client hints the system's screen blanker) ---- */
const offEdit = {};   // a change on its way
function offSetting() {
  return Object.assign({ enabled: true, minutes: 5 }, ui.status.screen_off || {}, offEdit);
}
function renderScreenOff() {
  const s = offSetting();
  $('offSwitch').setAttribute('aria-checked', String(s.enabled));
  $('offMinutes').classList.toggle('off', !s.enabled);
  for (const b of $('offMinutes').children) b.classList.toggle('on', Number(b.dataset.m) === s.minutes);
  $('offNote').textContent = s.enabled ? tr('off_note', { n: s.minutes, unit: tr('unit_min') }) : tr('off_never');
}
async function sendScreenOff(changes) {
  Object.assign(offEdit, changes);
  renderScreenOff();
  if (DEMO) { ui.status.screen_off = offSetting(); for (const k in changes) delete offEdit[k]; return renderStatus(); }
  try {
    const r = await (await fetch('/api/screen-off', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                      body: JSON.stringify(changes) })).json();
    if (r.ok === false) toast(r.error || tr('not_saved'), 'error');
  } catch (e) {
    toast(tr('not_saved_noresp'), 'error');
  }
  for (const k in changes) if (offEdit[k] === changes[k]) delete offEdit[k];
  renderScreenOff();
}
$('offSwitch').addEventListener('click', () => sendScreenOff({ enabled: !offSetting().enabled }));
for (const b of $('offMinutes').children) b.addEventListener('click', () => sendScreenOff({ minutes: Number(b.dataset.m) }));

/* ---- settings: software update (update.py: the root updater installs, the page only asks) ---- */
const UPD_STAGE = { preparing: 'upd_stage_preparing', downloading: 'upd_stage_downloading',
                    installing: 'upd_stage_installing', testing: 'upd_stage_testing',
                    rolling_back: 'upd_stage_rolling' };
let updArmed = 0;   // first tap on Update arms it, a second one within 5 s installs
const mb = n => (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + ' MB';
function ago(t) {
  const m = Math.max(0, Math.round((Date.now() / 1000 - t) / 60));
  return m < 2 ? tr('ago_now') : m < 60 ? tr('ago_min', { n: m })
    : m < 1440 ? tr('ago_hour', { n: Math.round(m / 60) }) : tr('ago_day', { n: Math.round(m / 1440) });
}
function renderUpdate() {
  const u = ui.update || {}, job = u.job || {}, avail = u.available;
  const busy = job.state in UPD_STAGE;
  const recent = !!job.time && Date.now() / 1000 - job.time < 86400;
  const failed = !busy && recent && (job.state === 'failed' || job.state === 'rolled_back');
  const cur = ui.version ? tr('ver_current', { v: ui.version }) : '';
  let title = tr('upd_title'), text, bad = false, label = '', notes = [];
  if (!u.enabled) text = cur ? tr('period_join', { a: cur, b: tr('upd_none') }) : tr('upd_none');
  else if (busy) {
    title = tr('upd_to_title', { v: job.version });
    const pct = job.state === 'downloading' && job.progress != null ? ` ${Math.round(job.progress * 100)}%` : '';
    text = tr('upd_paused', { stage: tr(UPD_STAGE[job.state]), pct });
  } else if (avail) {
    title = tr('upd_avail_title', { v: avail.version });
    text = failed ? tr('upd_retry', { msg: job.message }) : tr('upd_avail_text', { cur, size: mb(avail.size) });
    bad = failed;
    notes = avail.notes || [];
    label = Date.now() - updArmed < 5000 ? tr('upd_btn_confirm') : tr('upd_btn');
  } else {
    text = recent && job.state === 'done' ? tr('upd_latest', { msg: job.message })
      : failed ? job.message
      : u.check_error ? tr('period_join', { a: cur, b: u.check_error })
        : cur ? (u.checked ? tr('upd_uptodate_checked', { cur, ago: ago(u.checked) }) : tr('upd_uptodate', { cur }))
          : tr('upd_uptodate_bare');
    bad = failed || (!!u.check_error && !(recent && job.state === 'done'));
    label = tr('upd_check');
  }
  $('upd').classList.toggle('new', !!avail && !busy);
  $('gearDot').classList.toggle('on', !!avail && !busy);
  $('updTitle').textContent = title;
  $('updSub').textContent = text;
  $('updSub').classList.toggle('bad', !!bad);   // toggle(x, undefined) would flip it
  $('updNotes').innerHTML = notes.map(n => `<li>${esc(n)}</li>`).join('');
  const btn = $('updBtn');
  btn.hidden = !label;
  btn.textContent = label;
  btn.disabled = !!avail && ui.status.state !== 'idle';   // not in the middle of a conversation
  $('updBar').hidden = !busy;
  $('updBar').classList.toggle('busy', busy && job.state !== 'downloading');
  $('updFill').style.transform = job.state === 'downloading' ? `scaleX(${job.progress || 0})` : '';
}
function updateFinished(job) {
  // once per install, also when the page reloaded because the client restarted with the new version
  if (!job || !(job.state === 'done' || job.state === 'rolled_back' || job.state === 'failed')) return;
  if (Date.now() / 1000 - job.time > 300) return;
  try { if (localStorage.getItem('updShown') === String(job.time)) return; localStorage.setItem('updShown', String(job.time)); } catch (e) { /* no storage */ }
  toast(job.message, job.state === 'done' ? '' : 'error');
}
$('updBtn').addEventListener('click', async () => {
  const avail = (ui.update || {}).available;
  if (!avail) {
    if (DEMO) return toast(tr('upd_checking'));
    const r = await (await post('/api/update/check'))?.json?.();
    return toast(r && r.ok ? tr('upd_checking') : tr('upd_none'), r && r.ok ? '' : 'error');
  }
  if (Date.now() - updArmed > 5000) {
    updArmed = Date.now();
    renderUpdate();
    setTimeout(renderUpdate, 5100);
    return toast(tr('upd_arm'));
  }
  updArmed = 0;
  if (DEMO) return toast(tr('upd_demo'));
  const r = await (await post('/api/update/install', { version: avail.version }))?.json?.();
  if (!r || !r.ok) toast((r && r.error) || tr('upd_fail'), 'error');
});
if (DEMO !== null) {
  // ?demo&upd=new|busy|failed: preview the update card (opens the settings sheet)
  const kind = new URLSearchParams(location.search).get('upd');
  const avail = { version: '0.2.0', size: 9.4 * 1048576, notes: ['The orb got facial expressions', 'Fixed: sleep hours crossing midnight did nothing'] };
  const now = Date.now() / 1000;
  ui.version = '0.1.0';
  ui.update = { enabled: true, checked: now - 3600, available: kind ? avail : null,
                job: kind === 'busy' ? { state: 'downloading', version: '0.2.0', progress: .42, time: now }
                   : kind === 'failed' ? { state: 'rolled_back', version: '0.2.0', time: now,
                                           message: '0.2.0 failed its self-test (could not reach the hub); rolled back to 0.1.0' } : null };
  if (kind) $('settings').classList.add('on');
}

/* ---- settings: chat history (kept on the hub; clearing also clears the hub's copy) ---- */
let clearArmed = 0, memArmed = 0;   // first tap arms a button, a second one within 5 s clears
function renderClear() {
  $('clearBtn').textContent = Date.now() - clearArmed < 5000 ? tr('clear_confirm') : tr('clear');
  $('clearBtn').classList.toggle('armed', Date.now() - clearArmed < 5000);
  $('clearMemBtn').textContent = Date.now() - memArmed < 5000 ? tr('clear_mem_confirm') : tr('clear_mem');
  $('clearMemBtn').classList.toggle('armed', Date.now() - memArmed < 5000);
}
function agentNote(r) {
  // Claude Code and Grok Bot keep their own context: clearing here doesn't touch it
  return (r.agents || []).length ? tr('agents_keep', { names: r.agents.join(tr('join_and')) }) : '';
}
$('clearBtn').addEventListener('click', async () => {
  if (Date.now() - clearArmed > 5000) {
    clearArmed = Date.now();
    renderClear();
    setTimeout(renderClear, 5100);
    return toast(tr('clear_arm'));
  }
  clearArmed = 0;
  renderClear();
  if (DEMO !== null) { handlers.thread({ entry: ui.thread.entry, messages: [] }); return toast(tr('cleared')); }
  const r = await (await post('/api/history/clear', {}))?.json?.();
  if (!r || !r.ok) return toast((r && r.error) || tr('clear_fail'), 'error');
  const note = agentNote(r);
  toast(note ? tr('period_join', { a: tr('cleared'), b: note }) : tr('cleared'));
});
$('clearMemBtn').addEventListener('click', async () => {
  if (Date.now() - memArmed > 5000) {
    memArmed = Date.now();
    renderClear();
    setTimeout(renderClear, 5100);
    return toast(tr('mem_arm'));
  }
  memArmed = 0;
  renderClear();
  if (DEMO !== null) return toast(tr('mem_cleared'));
  const r = await (await post('/api/history/clear', { memory_only: true }))?.json?.();
  toast(r && r.ok ? tr('mem_cleared') : (r && r.error) || tr('clear_fail'), r && r.ok ? '' : 'error');
});
renderClear();

// The device's address, read each time the sheet opens (it can change with the WiFi)
async function renderIp() {
  let ip = DEMO !== null ? '192.168.1.23' : null;
  if (DEMO === null) {
    try { ip = (await (await fetch('/api/network')).json()).ip; } catch (e) { ip = null; }
  }
  $('ipNum').textContent = ip || tr('ip_none');
  $('ipSub').textContent = ip ? tr('ip_hint', { ip }) : tr('ip_waiting');
}
$('btnSettings').addEventListener('click', () => { $('settings').classList.add('on'); renderIp(); });

// 关机: halts the system (it stays dark with the power cable in), so unplugging can't damage it
let powerArmed = 0;
function renderPower() {
  $('powerBtn').textContent = Date.now() - powerArmed < 5000 ? tr('power_confirm') : tr('power');
  $('powerBtn').classList.toggle('armed', Date.now() - powerArmed < 5000);
}
$('powerBtn').addEventListener('click', async () => {
  if (Date.now() - powerArmed > 5000) {
    powerArmed = Date.now();
    renderPower();
    setTimeout(renderPower, 5100);
    return toast(tr('power_arm'));
  }
  powerArmed = 0;
  renderPower();
  if (DEMO !== null) return toast(tr('power_demo'));
  const r = await (await post('/api/power-off', {}))?.json?.();
  if (!r || !r.ok) toast((r && r.error) || tr('power_fail'), 'error');
});
$('settingsClose').addEventListener('click', () => $('settings').classList.remove('on'));
$('reportPill').addEventListener('click', () => { post('/api/reports/play'); toast(tr('report_now')); });

/* ---- right side: welcome screen or conversation ---- */
// The welcome screen (clock) when idle with nothing going on: no messages yet, or the conversation
// is over (the hub closed the connection). The hub keeps the history, so the thread is rarely empty;
// it comes back with the chat page on the next wake. While the connection lasts (~2 minutes) the
// chat page stays. A new conversation shows the chat (and its "listening" bubble) from the wake on.
function welcomeShown(messages, state, connected) {
  return ['idle', 'connecting'].includes(state) && (!messages || !connected);
}
function renderSide() {
  document.body.classList.toggle('fresh', welcomeShown(ui.thread.messages.length, shownState(), !!ui.status.connected));
}

function entryModel(entry) {
  return ui.models.options.find(o => o.entry === entry) || ui.models.current;
}

function renderHead() {
  const m = entryModel(ui.thread.entry);
  $('headLogo').src = logoSrc(m);
  $('headTitle').textContent = m ? tr('chat_title', { label: m.label }) : tr('chat');
  const n = ui.thread.messages.length;
  $('headMeta').textContent = n ? tr(ui.status.connected ? 'meta_n_live' : 'meta_n_saved', { n }) : tr('meta_new');
}

function fmtTime(t) {
  const d = new Date(t * 1000);
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// A reply grows sentence by sentence; the text just shows as it is (no per-sentence highlight)
function fillMsg(el, m) {
  const html = esc(m.text) + (m.interrupted ? `<span class="cut">${tr('cut')}</span>` : '') + `<span class="ts">${fmtTime(m.time)}</span>`;
  if (m.role === 'bot') el.querySelector('.body').innerHTML = html;
  else el.innerHTML = html;
}

function msgEl(m) {
  const el = document.createElement('div');
  el.className = 'msg ' + m.role;
  el.dataset.id = m.id;
  if (m.role === 'bot') {
    el.innerHTML = `<img class="tile" src="${esc(logoSrc(entryModel(m.entry)))}" alt=""><div class="body"></div>`;
  }
  fillMsg(el, m);
  return el;
}

function scrollDown() {
  const box = $('messages');
  box.scrollTop = box.scrollHeight;
}

function renderThread() {
  const box = $('messages');
  box.textContent = '';
  for (const m of ui.thread.messages) {
    const el = msgEl(m);
    el.style.animation = 'none';
    box.appendChild(el);
  }
  markLive();
  renderHead();
  renderSide();
  renderPending();
  scrollDown();
}

function upsertMessage(m) {
  if (m.entry !== ui.thread.entry) return;
  const i = ui.thread.messages.findIndex(x => x.id === m.id);
  const box = $('messages');
  if (i >= 0) {
    ui.thread.messages[i] = m;
    const el = box.querySelector(`[data-id="${m.id}"]`);
    if (el) fillMsg(el, m);
  } else {
    ui.thread.messages.push(m);
    box.insertBefore(msgEl(m), $('pending'));
  }
  markLive();
  renderHead();
  renderSide();
  scrollDown();
}

function markLive() {
  // the reply being spoken right now: its logo gets a ring
  const box = $('messages');
  box.querySelectorAll('.live').forEach(el => el.classList.remove('live'));
  const last = ui.thread.messages[ui.thread.messages.length - 1];
  if (ui.status.state === 'speaking' && last && last.role === 'bot') {
    const el = box.querySelector(`[data-id="${last.id}"]`);
    if (el) el.classList.add('live');
  }
}

// Placeholder at the end of the conversation while the user talks or the model thinks
function renderPending() {
  const shown = shownState();
  // recognising: the user stopped and the hub is turning it into text (it can take a few seconds)
  const kind = ui.status.recognising && !ui.ptt ? 'user recog' : shown === 'listening' ? (ui.ptt ? 'user ptt' : 'user') :
    shown === 'thinking' ? 'bot' : '';
  let el = $('pending');
  if (el && el.dataset.kind === kind) return;
  if (el) el.remove();
  if (!kind) return;
  el = document.createElement('div');
  el.id = 'pending';
  el.dataset.kind = kind;
  el.className = 'msg pending ' + kind;
  if (kind.startsWith('user')) {
    el.innerHTML = `<span class="wave">${'<b></b>'.repeat(5)}</span>${kind === 'user recog' ? tr('pending_recog') : ui.ptt ? tr('pending_ptt') : tr('pending_listen')}`;
  } else {
    el.innerHTML = `<img class="tile" src="${esc(logoSrc(entryModel(ui.thread.entry)))}" alt="">` +
      `<div class="body"><span class="dots"><i></i><i></i><i></i></span><span class="label">${tr('pending_think')}</span></div>`;
  }
  $('messages').appendChild(el);
  scrollDown();
}

/* ---- overlays ---- */
let toastTimer = null;
function toast(text, kind) {
  const t = $('toast');
  t.textContent = text;
  t.className = 'toast on' + (kind === 'error' ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast' + (kind === 'error' ? ' error' : ''); }, kind === 'error' ? 4500 : 2500);
}

let hudTimer = null;
function showVolume(v) {
  $('hudFill').style.transform = `scaleX(${Math.max(0, Math.min(100, v)) / 100})`;
  $('hudNum').textContent = v;
  $('hud').classList.add('on');
  clearTimeout(hudTimer);
  hudTimer = setTimeout(() => $('hud').classList.remove('on'), 1600);
}

/* ---- events from the client ---- */
const handlers = {
  snapshot(s) {
    if (ui.build && s.build && s.build !== ui.build) return location.reload();   // client restarted (deployed)
    ui.build = s.build;
    ui.status = s.status; ui.models = server.models = s.models; ui.thread = server.thread = s.thread;
    setLang(s.status.language, s.status.wake_label);
    switching = null;
    for (const k in seenThreads) delete seenThreads[k];
    seenThreads[s.thread.entry] = s.thread.messages;
    if (s.update) { ui.version = s.version; ui.update = s.update; }   // the demo's snapshots have none
    renderModels(); renderThread(); renderStatus();
    updateFinished((s.update || {}).job);
  },
  power(p) {
    $('powerOff').classList.toggle('on', p.state === 'off');
  },
  update(u) {
    ui.update = u;
    renderUpdate();
    updateFinished(u.job);
  },
  state(s) {
    ui.status = s; renderStatus(); markLive(); renderHead();
  },
  model(m) {
    server.models = m;
    if (switching && (!m.current || m.current.entry !== switching)) return;
    ui.models = m; renderModels(); renderStatus();
  },
  thread(t) {
    server.thread = t;
    if (t.reset) for (const k in seenThreads) delete seenThreads[k];   // cleared, or the hub's history loaded
    seenThreads[t.entry] = t.messages;
    if (switching && t.entry !== switching) return;
    ui.thread = t; renderThread();
  },
  message: m => upsertMessage(m),
  toast: t => toast(t.text, t.kind),
  volume: v => showVolume(v.volume),
  level(l) {
    level.target = ui.status.state === 'speaking' ? Math.min(1, l.out * 6) : micLevel(l.mic);
  },
};

function connectEvents() {
  const es = new EventSource('/events');
  for (const [name, fn] of Object.entries(handlers)) es.addEventListener(name, e => fn(JSON.parse(e.data)));
}

/* ---- buttons ---- */
function post(path, body) {
  if (DEMO) return demo.action(path, body);
  const opts = { method: 'POST' };
  if (body) Object.assign(opts, { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return fetch(path, opts).catch(() => toast(tr('noresp'), 'error'));
}

// Mic: a tap wakes (or interrupts a reply and listens); holding it is push-to-talk
let holdTimer = null;
function pttStart() {
  ui.ptt = true;
  $('btnMic').classList.add('hold');
  renderStatus();
}
function pttEnd() {
  ui.ptt = false;
  $('btnMic').classList.remove('hold');
  renderStatus();
}
$('btnMic').addEventListener('pointerdown', e => {
  e.preventDefault();
  holdTimer = setTimeout(() => {
    holdTimer = null;
    pttStart();
    post('/api/ptt/start');
  }, 350);
});
function release() {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
    post('/api/wake');
  } else if (ui.ptt) {
    pttEnd();
    post('/api/ptt/stop');
  }
}
$('btnMic').addEventListener('pointerup', release);
$('btnMic').addEventListener('pointercancel', release);
$('btnMic').addEventListener('pointerleave', () => { if (ui.ptt) release(); });
$('btnAbort').addEventListener('click', () => post('/api/abort'));
$('btnEnd').addEventListener('click', () => { post('/api/end'); toast(tr('ended')); });
$('modelPill').addEventListener('click', () => openSheet(true));
$('sheetClose').addEventListener('click', () => openSheet(false));
document.addEventListener('contextmenu', e => e.preventDefault());

/* ---- demo: fake client for previewing the page on a desktop browser ---- */
const demo = DEMO === null ? null : (() => {
  const M = (label, model, logo, company, vendor) => ({ kind: 'llm', vendor, label, model, logo, company, entry: 'llm:' + vendor });
  const options = [
    M('Claude', 'claude-sonnet-4-5', 'claude-color', 'Anthropic', 'claude'),
    M('DeepSeek', 'deepseek-chat', 'deepseek-color', 'DeepSeek', 'deepseek'),
    M('Qwen', 'qwen-max', 'qwen-color', 'Alibaba Qwen', 'qwen'),
    M('Doubao', 'doubao-1.5-pro', 'doubao-color', 'ByteDance Doubao', 'doubao'),
    M('Gemini', 'gemini-2.5-flash', 'gemini-color', 'Google', 'gemini'),
    M('Kimi', 'kimi-k2', 'kimi-color', 'Moonshot Kimi', 'kimi'),
    M('GPT', 'gpt-4.1', 'openai', 'OpenAI', 'openai'),
    M('GLM', 'glm-4.6', 'zhipu-color', 'Zhipu AI', 'glm'),
  ];
  let seq = 0, bot = null, timer = null, stopped = false;
  const threads = {};
  const entry = () => ui.models.current.entry;
  const now = () => Date.now() / 1000;
  const state = (s, connected = true) => handlers.state({ state: s, connected, uploading: s === 'listening' });
  const say = (role, text) => {
    const m = { id: ++seq, role, text, time: now(), entry: entry() };
    (threads[m.entry] = threads[m.entry] || []).push(m);
    handlers.message({ ...m });
    return m;
  };
  const sentence = text => {
    if (!bot) { state('speaking'); bot = say('bot', text); return; }
    bot.text += text;
    handlers.message({ ...bot });
  };
  const done = (cut) => {
    if (bot && cut) { bot.interrupted = true; handlers.message({ ...bot }); }
    bot = null;
  };

  // fake microphone / speaker levels: syllable-like bursts
  setInterval(() => {
    const t = performance.now() / 1000;
    const v = Math.max(0, Math.abs(Math.sin(t * 6.3)) * (.55 + .45 * Math.sin(t * 1.7)) + (Math.random() - .5) * .25);
    handlers.level({ mic: v * .07, out: v * .17 });
  }, 100);

  const steps = [
    ['idle', 4000, () => handlers.snapshot({ status: { state: 'idle', connected: false, uploading: false },
                                              models: { current: options[0], options }, thread: { entry: options[0].entry, messages: [] } })],
    ['connecting', 1600, () => state('connecting', false)],
    ['listening', 3200, () => state('listening')],
    [null, 500, () => say('user', "What's the weather in Wellington tomorrow? Good for a hike?")],
    ['thinking', 2600, () => state('thinking')],
    [null, 1700, () => sentence('Tomorrow in Wellington: sun turning to cloud, 9 to 19 degrees,')],
    [null, 1700, () => sentence('a light north-westerly, air quality good.')],
    ['speaking', 2200, () => sentence('That\'s a great day for the Track — the leaves on the Orongorongo are at their best right now.')],
    [null, 2400, () => sentence('It cools off a lot in the morning and evening, so bring a light jacket.')],
    [null, 2600, () => { done(); state('listening'); }],
    [null, 500, () => say('user', 'Any route with fewer people?')],
    [null, 2000, () => state('thinking')],
    [null, 1800, () => sentence('Try going in via Otari-Wilton\'s Bush and joining the Track at Mangaroa,')],
    ['chat', 2400, () => sentence('far quieter than the gate, and there\'s a stream crossing on the way.')],
    ['cut', 1400, () => { done(true); state('idle'); }],
    ['models', 3200, () => openSheet(true)],
    [null, 600, () => switchTo(options[1])],
    ['volume', 2400, () => showVolume(60)],
    ['ptt', 2600, () => { pttStart(); state('listening'); }],
    [null, 400, () => { pttEnd(); say('user', 'Introduce yourself in one sentence'); state('thinking'); }],
    [null, 1800, () => sentence(`I'm ${WAKE}, the voice assistant living in this screen — just ask me anything.`)],
    [null, 3200, () => { done(); state('idle'); }],
    [null, 3000, () => { state('idle', false); toast(tr('ended')); }],
  ];

  function switchTo(m) {
    openSheet(false);
    handlers.model({ current: m, options });
    handlers.thread({ entry: m.entry, messages: (threads[m.entry] || []).slice() });
    toast(tr('switched', { label: m.label }));
  }

  function run(i, jump) {
    if (stopped) return;
    const [name, wait, fn] = steps[i % steps.length];
    if (i % steps.length === 0) { seq = 0; for (const k in threads) delete threads[k]; }
    fn();
    if (jump && name === jump) return;          // ?demo=<scene>: stop on that scene
    if (jump) return run(i + 1, jump);
    timer = setTimeout(() => run(i + 1), wait);
  }

  // tapping around stops the script and lets the buttons do something plausible
  function action(path, body) {
    stopped = true;
    clearTimeout(timer);
    const answer = q => {
      say('user', q);
      state('thinking');
      timer = setTimeout(() => {
        sentence('This is the demo mode —');
        timer = setTimeout(() => { sentence('a real answer needs the client to be connected.'); timer = setTimeout(() => { done(); state('idle'); }, 2600); }, 1500);
      }, 1600);
    };
    if (path === '/api/wake') state('listening');
    else if (path === '/api/ptt/start') state('listening');
    else if (path === '/api/ptt/stop') answer('(what was said while holding the button)');
    else if (path === '/api/text') answer(body.text);
    else if (path === '/api/abort') { done(true); state('idle'); }
    else if (path === '/api/end') { done(); state('idle', false); }
    return Promise.resolve();
  }

  return { start: () => run(0, DEMO || null), action, switchTo };
})();

applyStatic();
tick();
setInterval(tick, 1000);
renderStatus();
renderThread();
if (demo) demo.start();
else connectEvents();

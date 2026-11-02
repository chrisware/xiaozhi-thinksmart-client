// ThinkSmart voice client page: renders what the client streams on /events and sends the buttons back.
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const pad = n => String(n).padStart(2, '0');

/* ---- language: the client's snapshot says which; English is this fork's default ---- */
let lang = 'en', WAKE = 'Hey Computer';
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEK = '日一二三四五六';
const STR = {
  en: {
    page_title: 'Computer', brand: 'Computer',
    idle_t: 'Say <em>«{wake}»</em>', idle_hint: 'or tap the mic below; hold it down to talk straight away',
    idle_hint_kept: 'The conversation is still here — wake me and carry on',
    connecting_t: 'Connecting…', connecting_hint: 'I start listening once the voice hub is up',
    ptt_t: 'Release to send', ptt_hint: 'Let go when you have finished',
    listening_t: "I'm listening", listening_hint: 'Pause when you are done and I will answer',
    thinking_t: '<em>{model}</em> is thinking…', thinking_hint: 'A tricky question may take a moment',
    speaking_t: 'Answering', speaking_hint: 'Just start talking to interrupt me',
    link_on: 'Live', link_off: 'Idle', model: 'Model',
    ctl_interrupt: 'Interrupt', ctl_talk: 'Talk', ctl_end: 'End', aria_interrupt: 'Interrupt',
    aria_talk: 'Talk', aria_end: 'End', hud_volume: 'Volume',
    switch_fail: 'Switch failed', switch_fail_noresp: 'Switch failed: the client is not responding',
    switched: 'Switched to {label}',
    chat_title: 'Chat with {label}', chat: 'Chat',
    meta_n_live: '{n} messages · context kept', meta_n_saved: '{n} messages · saved', meta_new: 'New conversation',
    cut: 'interrupted',
    empty_big: 'Say «{wake}» to start chatting',
    empty_t1: '"What\'s the weather today?"', empty_t2: '"Hey Claude, plan something for the weekend"',
    empty_t3: '"Turn the volume down a bit"',
    noresp: 'The client is not responding',
    ended: 'Conversation ended; the chat history is saved',
  },
  zh: {
    page_title: '小麦', brand: '小麦',
    idle_t: '说<em>「{wake}」</em>', idle_hint: '或者点下面的麦克风；按住可以直接说',
    idle_hint_kept: '对话还保留着，唤醒后可以接着聊',
    connecting_t: '正在连接…', connecting_hint: '连上小智网关后就开始听',
    ptt_t: '松开发送', ptt_hint: '说完松开手指',
    listening_t: '我在听', listening_hint: '说完停一下我就开始回答',
    thinking_t: '<em>{model}</em> 正在思考…', thinking_hint: '复杂的问题可能要想一会儿',
    speaking_t: '正在回答', speaking_hint: '随时开口就能打断我',
    link_on: '对话中', link_off: '待机', model: '模型',
    ctl_interrupt: '打断', ctl_talk: '说话', ctl_end: '结束', aria_interrupt: '打断',
    aria_talk: '说话', aria_end: '结束', hud_volume: '音量',
    switch_fail: '切换失败', switch_fail_noresp: '切换失败：客户端没有响应',
    switched: '已切换到 {label}',
    chat_title: '与 {label} 的对话', chat: '对话',
    meta_n_live: '{n} 条消息 · 上下文保持中', meta_n_saved: '{n} 条消息 · 已结束', meta_new: '新对话',
    cut: '已打断',
    empty_big: '说「{wake}」开始聊天',
    empty_t1: '「今天北京天气怎么样？」', empty_t2: '「嗨 Claude，帮我想个周末计划」',
    empty_t3: '「把音量调小一点」',
    noresp: '客户端没有响应',
    ended: '对话已结束，聊天记录已保存',
  },
};
function tr(key, params) {
  let s = (STR[lang] && STR[lang][key]) ?? STR.en[key] ?? key;
  s = s.replaceAll('{wake}', WAKE);
  if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
  return s;
}
function applyStatic() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = tr('page_title');
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = tr(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', tr(el.dataset.i18nAria));
}
function setLang(l, wake) {
  if (l === lang && (!wake || wake === WAKE)) return;
  lang = l || 'en';
  if (wake) WAKE = wake;
  applyStatic();
  renderStatus(); renderThread(); renderChatHead(); tick();
}

const ui = {
  status: { state: 'idle', connected: false, uploading: false },
  models: { current: null, options: [] },
  thread: { entry: null, messages: [] },
  ptt: false,
};

/* ---- clock ---- */
function tick() {
  const now = new Date();
  $('time').textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
  $('date').textContent = lang === 'zh'
    ? `${now.getMonth() + 1}月${now.getDate()}日 星期${WEEK[now.getDay()]}`
    : `${DAY[now.getDay()]} ${now.getDate()} ${MONTH[now.getMonth()]}`;
}

/* ---- status: orb colour, title, hint, buttons ---- */
function modelName() {
  const cur = ui.models.current;
  return cur ? cur.label : tr('model');
}

function renderStatus() {
  const { state, connected } = ui.status;
  const shown = ui.ptt ? 'listening' : state;
  document.body.dataset.state = shown;
  const text = {
    idle: [tr('idle_t'), connected ? tr('idle_hint_kept') : tr('idle_hint')],
    connecting: [tr('connecting_t'), tr('connecting_hint')],
    listening: ui.ptt ? [tr('ptt_t'), tr('ptt_hint')] : [tr('listening_t'), tr('listening_hint')],
    thinking: [tr('thinking_t', { model: esc(modelName()) }), tr('thinking_hint')],
    speaking: [tr('speaking_t'), tr('speaking_hint')],
  }[shown] || ['', ''];
  $('title').innerHTML = text[0];
  $('hint').textContent = text[1];
  $('btnAbort').disabled = state !== 'speaking';
  $('btnEnd').disabled = !connected;
  const link = $('link');
  link.classList.toggle('on', connected);
  link.querySelector('span').textContent = connected ? tr('link_on') : tr('link_off');
  if (!['listening', 'speaking'].includes(shown)) document.body.style.setProperty('--lvl', 0);
}

/* ---- models ---- */
function renderModels() {
  const box = $('models');
  box.textContent = '';
  const cur = ui.models.current;
  for (const m of ui.models.options) {
    const b = document.createElement('button');
    b.className = 'model' + (cur && cur.entry === m.entry ? ' on' : '');
    b.innerHTML = (m.logo ? `<img src="/static/logos/${esc(m.logo)}.svg" alt="">` : '') +
      `<span><div class="ml">${esc(m.label)}</div><div class="mm">${esc(m.model || m.company || '')}</div></span>`;
    b.addEventListener('click', () => switchModel(m));
    box.appendChild(b);
  }
  renderChatHead();
}

async function switchModel(m) {
  if (ui.models.current && ui.models.current.entry === m.entry) return;
  try {
    const r = await (await fetch('/api/model', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                 body: JSON.stringify({ kind: m.kind, vendor: m.vendor, entry: m.entry }) })).json();
    if (r.ok === false) toast(r.error || tr('switch_fail'), 'error');
    else toast(tr('switched', { label: m.label }));
  } catch (e) {
    toast(tr('switch_fail_noresp'), 'error');
  }
}

/* ---- conversation ---- */
function entryModel(entry) {
  return ui.models.options.find(o => o.entry === entry) || ui.models.current;
}

function renderChatHead() {
  const m = entryModel(ui.thread.entry);
  $('chatLogo').src = m && m.logo ? `/static/logos/${m.logo}.svg` : '';
  $('chatTitle').textContent = m ? tr('chat_title', { label: m.label }) : tr('chat');
  const n = ui.thread.messages.length;
  $('chatSub').textContent = n ? tr(ui.status.connected ? 'meta_n_live' : 'meta_n_saved', { n }) : tr('meta_new');
}

function fmtTime(t) {
  const d = new Date(t * 1000);
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function msgHtml(m) {
  return esc(m.text) + (m.interrupted ? `<span class="cut">${tr('cut')}</span>` : '') + `<span class="ts">${fmtTime(m.time)}</span>`;
}

function renderThread() {
  const box = $('messages');
  box.textContent = '';
  if (!ui.thread.messages.length) {
    box.innerHTML = `<div class="empty"><div class="big">${tr('empty_big')}</div><div class="tips">
      <div class="tip">${tr('empty_t1')}</div>
      <div class="tip">${tr('empty_t2')}</div>
      <div class="tip">${tr('empty_t3')}</div></div></div>`;
  } else {
    for (const m of ui.thread.messages) box.appendChild(msgEl(m));
  }
  renderChatHead();
  box.scrollTop = box.scrollHeight;
}

function msgEl(m) {
  const el = document.createElement('div');
  el.className = 'msg ' + m.role;
  el.dataset.id = m.id;
  el.innerHTML = msgHtml(m);
  return el;
}

function upsertMessage(m) {
  if (m.entry !== ui.thread.entry) return;
  const i = ui.thread.messages.findIndex(x => x.id === m.id);
  const box = $('messages');
  if (i >= 0) {
    ui.thread.messages[i] = m;
    const el = box.querySelector(`[data-id="${m.id}"]`);
    if (el) el.innerHTML = msgHtml(m);
  } else {
    if (!ui.thread.messages.length) box.textContent = '';
    ui.thread.messages.push(m);
    box.appendChild(msgEl(m));
  }
  markLive();
  renderChatHead();
  box.scrollTop = box.scrollHeight;
}

function markLive() {
  // the reply being spoken right now gets a highlighted border
  const box = $('messages');
  box.querySelectorAll('.live').forEach(el => el.classList.remove('live'));
  const last = ui.thread.messages[ui.thread.messages.length - 1];
  if (ui.status.state === 'speaking' && last && last.role === 'bot') {
    const el = box.querySelector(`[data-id="${last.id}"]`);
    if (el) el.classList.add('live');
  }
}

/* ---- overlays ---- */
let toastTimer = null;
function toast(text, kind) {
  const t = $('toast');
  t.textContent = text;
  t.className = 'toast on' + (kind === 'error' ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, kind === 'error' ? 4500 : 2500);
}

let hudTimer = null;
function showVolume(v) {
  $('hudFill').style.width = v + '%';
  $('hudNum').textContent = v;
  $('hud').classList.add('on');
  clearTimeout(hudTimer);
  hudTimer = setTimeout(() => $('hud').classList.remove('on'), 1600);
}

/* ---- events from the client ---- */
function connectEvents() {
  const es = new EventSource('/events');
  const on = (name, fn) => es.addEventListener(name, e => fn(JSON.parse(e.data)));
  on('snapshot', s => {
    ui.status = s.status; ui.models = s.models; ui.thread = s.thread;
    setLang(s.status.language, s.status.wake_label);
    renderModels(); renderThread(); renderStatus();
  });
  on('state', s => { ui.status = s; renderStatus(); markLive(); renderChatHead(); });
  on('model', m => { ui.models = m; renderModels(); renderStatus(); });
  on('thread', t => { ui.thread = t; renderThread(); });
  on('message', m => upsertMessage(m));
  on('toast', t => toast(t.text, t.kind));
  on('volume', v => showVolume(v.volume));
  on('level', l => {
    const v = ui.status.state === 'speaking' ? l.out * 6 : l.mic * 14;
    document.body.style.setProperty('--lvl', Math.min(1, v).toFixed(3));
  });
}

/* ---- buttons ---- */
const post = path => fetch(path, { method: 'POST' }).catch(() => toast(tr('noresp'), 'error'));

// Mic: a tap wakes (or interrupts a reply and listens); holding it is push-to-talk
let holdTimer = null;
$('btnMic').addEventListener('pointerdown', e => {
  e.preventDefault();
  holdTimer = setTimeout(() => {
    holdTimer = null;
    ui.ptt = true;
    $('btnMic').classList.add('hold');
    renderStatus();
    post('/api/ptt/start');
  }, 350);
});
function release() {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
    post('/api/wake');
  } else if (ui.ptt) {
    ui.ptt = false;
    $('btnMic').classList.remove('hold');
    renderStatus();
    post('/api/ptt/stop');
  }
}
$('btnMic').addEventListener('pointerup', release);
$('btnMic').addEventListener('pointercancel', release);
$('btnMic').addEventListener('pointerleave', () => { if (ui.ptt) release(); });
$('btnAbort').addEventListener('click', () => post('/api/abort'));
$('btnEnd').addEventListener('click', () => { post('/api/end'); toast(tr('ended')); });
document.addEventListener('contextmenu', e => e.preventDefault());

applyStatic();
tick();
setInterval(tick, 1000);
renderStatus();
renderThread();
connectEvents();

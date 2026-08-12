
// ── i18n ────────────────────────────────────────────────
const T = (k, v) => (window.MTI18N ? window.MTI18N.t(k, v) : k);

function applyI18n(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const s = T(key);
    if (!s || s === key) return;
    // ★textContent 로 덮으면 자식 요소가 사라진다 (탭 안의 개수 span 등).
    //   자식이 있으면 첫 텍스트 노드만 갈아끼운다.
    if (el.children.length) {
      const textNode = Array.from(el.childNodes).find((n) => n.nodeType === 3);
      if (textNode) textNode.nodeValue = s;
      else el.insertBefore(document.createTextNode(s), el.firstChild);
    } else {
      el.textContent = s;
    }
  });
  scope.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    const s = T(el.getAttribute('data-i18n-ph'));
    if (s) el.placeholder = s;
  });
  document.querySelectorAll('.lang-opt').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === (window.MTI18N ? window.MTI18N.getLang() : 'en')));
  });
}

function initLanguage() {
  if (!window.MTI18N) return;
  window.MTI18N.init(() => {
    applyI18n();
    document.querySelectorAll('.lang-opt').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const next = btn.dataset.lang;
        window.MTI18N.setLang(next);
        await chrome.storage.sync.set({ lang: next });
        applyI18n();
        // 이미 그려진 목록·상세도 새 언어로 다시 그린다
        try { if (currentPixelId) showDetail(currentPixelId); else loadPixels(); } catch (e) {}
        const note = document.getElementById('lang-note');
        // Gmail 안 표시는 콘텐츠 스크립트가 그리므로 그쪽은 새로고침해야 따라온다
        if (note) note.style.display = 'block';
      });
    });
  });
}


// ── Theme ────────────────────────────────────────────────
// 저장값이 없으면 OS 설정을 따른다. 선택하면 그때부터 그 선택이 이긴다.
function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  const moon = document.getElementById('icon-moon');
  const sun = document.getElementById('icon-sun');
  const btn = document.getElementById('theme-btn');
  const goingLight = mode === 'dark';
  if (moon) moon.style.display = goingLight ? '' : 'none';
  if (sun) sun.style.display = goingLight ? 'none' : '';
  if (btn) btn.title = goingLight ? 'Switch to light theme' : 'Switch to dark theme';
}

async function initTheme() {
  const { theme } = await chrome.storage.sync.get(['theme']);
  const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  applyTheme(theme || system);

  const btn = document.getElementById('theme-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    await chrome.storage.sync.set({ theme: next });
  });
}

// --- State ---
let serverUrl = '';
let dashboardPassword = '';
let currentPixelId = null;
let authFailed = false; // Track if last auth failed

// --- DOM refs ---
const listView = document.getElementById('list-view');
const detailView = document.getElementById('detail-view');
const setupView = document.getElementById('setup-view');
const pixelContainer = document.getElementById('pixel-container');
const toastEl = document.getElementById('toast');

// --- Sanitization ---
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  const { serverUrl: saved, dashboardPassword: savedPass, authFailed: savedAuthFailed } = await chrome.storage.sync.get(['serverUrl', 'dashboardPassword', 'authFailed']);
  serverUrl = saved || 'https://track.edword.ai';
  dashboardPassword = savedPass || '';
  authFailed = savedAuthFailed || false;

  if (!serverUrl || !dashboardPassword || authFailed) {
    showSetup(true);
  } else {
    loadPixels();
  }

  // Event listeners
  document.getElementById('new-btn').addEventListener('click', createPixel);
  document.getElementById('settings-btn').addEventListener('click', () => showSetup(false));
  document.getElementById('back-btn').addEventListener('click', showList);
  document.getElementById('setup-back-btn').addEventListener('click', () => {
    if (serverUrl) {
      setupView.style.display = 'none';
      listView.style.display = 'block';
    }
  });
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  document.getElementById('delete-btn').addEventListener('click', deleteCurrentPixel);

  initTheme();
  initLanguage();

  // Auto-track 전역 토글 — gmail.js 가 storage.onChanged 로 즉시 반영한다
  const autoTrackInput = document.getElementById('autotrack-input');
  if (autoTrackInput) {
    chrome.storage.sync.get(['autoTrack'], ({ autoTrack }) => {
      autoTrackInput.checked = autoTrack !== false; // 미설정 = 켜짐
    });
    autoTrackInput.addEventListener('change', async () => {
      await chrome.storage.sync.set({ autoTrack: autoTrackInput.checked });
      showToast(autoTrackInput.checked
        ? T('settings.track_on')
        : T('settings.track_off'));
    });
  }

  // 알림 토글 — 기본 꺼짐
  const notifyInput = document.getElementById('notify-input');
  if (notifyInput) {
    chrome.storage.sync.get(['notifyOnOpen'], ({ notifyOnOpen }) => {
      notifyInput.checked = notifyOnOpen === true;
    });
    notifyInput.addEventListener('change', async () => {
      await chrome.storage.sync.set({ notifyOnOpen: notifyInput.checked });
      showToast(notifyInput.checked
        ? T('settings.notify_on')
        : T('settings.notify_off'));
    });
  }

  // Password visibility toggle
  const togglePwBtn = document.getElementById('toggle-password');
  const pwInput = document.getElementById('password-input');
  function makeEyeSvg(open) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    if (open) {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z');
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', '12'); c.setAttribute('cy', '12'); c.setAttribute('r', '3');
      svg.appendChild(p); svg.appendChild(c);
    } else {
      const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p1.setAttribute('d', 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94');
      const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p2.setAttribute('d', 'M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19');
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', '1'); l.setAttribute('y1', '1'); l.setAttribute('x2', '23'); l.setAttribute('y2', '23');
      svg.appendChild(p1); svg.appendChild(p2); svg.appendChild(l);
    }
    return svg;
  }
  togglePwBtn.addEventListener('click', () => {
    const isPassword = pwInput.type === 'password';
    pwInput.type = isPassword ? 'text' : 'password';
    togglePwBtn.replaceChildren(makeEyeSvg(!isPassword));
    togglePwBtn.title = isPassword ? 'Hide password' : 'Show password';
  });

  document.getElementById('snippet-html').addEventListener('click', () => {
    copyToClipboard(document.getElementById('snippet-html').dataset.value);
  });
  document.getElementById('snippet-url').addEventListener('click', () => {
    copyToClipboard(document.getElementById('snippet-url').dataset.value);
  });

  document.querySelectorAll('.event-tab').forEach(tab => {
    tab.addEventListener('click', () => selectEventTab(tab.dataset.tab));
  });
});

// --- API helpers ---
async function api(path) {
  const headers = {
    'Accept': 'application/json'
  };
  if (dashboardPassword) {
    headers['Authorization'] = 'Basic ' + btoa(':' + dashboardPassword);
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  try {
    const res = await fetch(`${serverUrl}${path}`, { 
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (res.status === 401) {
      // Authentication failed - clear stored password and show setup
      authFailed = true;
      dashboardPassword = ''; // Clear in memory
      await chrome.storage.sync.set({ authFailed: true, dashboardPassword: '' });
      showSetup(false);
      throw new Error('Authentication required');
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timeout - check your password');
    }
    throw err;
  }
}

// --- Views ---
async function showSetup(isFirst) {
  setupView.style.display = 'block';
  listView.style.display = 'none';
  detailView.classList.remove('active');
  document.getElementById('setup-header').style.display = isFirst ? 'none' : 'flex';
  
  const serverInput = document.getElementById('server-input');
  const passwordInput = document.getElementById('password-input');
  
  // Restore from temporary storage (persists across popup closes)
  const { tempServerUrl, tempPassword } = await chrome.storage.local.get(['tempServerUrl', 'tempPassword']);
  
  serverInput.value = tempServerUrl || serverUrl;
  passwordInput.value = tempPassword || dashboardPassword;
  
  // Save to temp storage on blur (when field loses focus)
  serverInput.onblur = () => chrome.storage.local.set({ tempServerUrl: serverInput.value });
  passwordInput.onblur = () => chrome.storage.local.set({ tempPassword: passwordInput.value });
}

function showList() {
  listView.style.display = 'block';
  detailView.classList.remove('active');
  setupView.style.display = 'none';
  currentPixelId = null;
  loadPixels();
}

// 탭은 한 번만 배선한다. 예전에는 showDetail 마다 리스너를 더해 쌓였다.
function selectEventTab(name) {
  document.querySelectorAll('.event-tab').forEach(t => {
    const on = t.dataset.tab === name;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  const isFiltered = name === 'filtered';
  const recentEl = document.getElementById('events-list');
  const filteredEl = document.getElementById('filtered-list');
  if (recentEl) recentEl.style.display = isFiltered ? 'none' : 'block';
  if (filteredEl) filteredEl.style.display = isFiltered ? 'block' : 'none';
}

function setCopyRow(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.dataset.value = value;
  const slot = el.querySelector('.copy-row-value');
  if (slot) slot.textContent = value;
  el.title = value;
}

// 확장 캡처 이전 레코드는 프록시 경유 여부가 아예 없다.
// 없는 것을 'direct' 로 읽으면 우리가 갖지 않은 확신을 주장하게 된다.
function provenanceOf(e) {
  if (!e) return 'unknown';
  if (e.viaProxy === true || e.confidence === 'proxy') return 'proxy';
  if (e.viaProxy === false || e.confidence === 'direct') return 'direct';
  return 'unknown';
}

// 판정과 그 한계는 한 블록 안에서만 쓴다. 상태만 떼어 읽히는 일이 없게.
function renderReading(data) {
  const box = document.getElementById('detail-reading');
  const stateEl = document.getElementById('detail-state');
  const whenEl = document.getElementById('detail-when');
  const noteEl = document.getElementById('detail-note');
  if (!box || !stateEl || !whenEl || !noteEl) return;

  if (!data) {
    box.classList.remove('is-active');
    stateEl.textContent = 'Reading the log…';
    whenEl.textContent = '';
    noteEl.textContent = '';
    return;
  }

  const events = Array.isArray(data.events) ? data.events : [];
  box.classList.toggle('is-active', events.length > 0);

  if (events.length === 0) {
    stateEl.textContent = T('read.none');
    whenEl.textContent = data.createdAt ? `sent ${timeAgo(data.createdAt)}` : '';
    noteEl.textContent = 'Nothing has asked for the pixel. That is not evidence the email went unread — most mail clients block remote images until the reader allows them.';
    return;
  }

  stateEl.textContent = T('read.some');
  const last = events[events.length - 1];
  whenEl.textContent = last && last.time ? `last ${timeAgo(last.time)}` : '';

  const proxied = events.filter(e => provenanceOf(e) === 'proxy').length;
  const direct = events.filter(e => provenanceOf(e) === 'direct').length;

  if (proxied && direct) {
    noteEl.textContent = 'Some requests loaded straight from a mail client; the rest came through a proxy, which reports itself instead of the reader.';
  } else if (proxied) {
    noteEl.textContent = proxied === events.length
      ? T('read.all_proxy')
      : T('read.known_proxy');
  } else if (direct) {
    noteEl.textContent = direct === events.length
      ? T('read.all_direct')
      : T('read.known_direct');
  } else {
    noteEl.textContent = T('read.unknown');
  }
}

async function showDetail(id) {
  currentPixelId = id;
  listView.style.display = 'none';
  setupView.style.display = 'none';
  detailView.classList.add('active');
  window.scrollTo(0, 0);

  const subjectEl = document.getElementById('detail-subject');
  subjectEl.textContent = id;
  subjectEl.classList.remove('untitled');
  subjectEl.title = '';
  document.getElementById('detail-meta').textContent = id;
  document.getElementById('filtered-count').textContent = '';
  renderReading(null);
  selectEventTab('recent');

  const eventsListEl = document.getElementById('events-list');
  const filteredListEl = document.getElementById('filtered-list');
  filteredListEl.textContent = '';
  eventsListEl.textContent = '';
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading';
  const spinnerDiv = document.createElement('div');
  spinnerDiv.className = 'spinner';
  loadingDiv.appendChild(spinnerDiv);
  eventsListEl.appendChild(loadingDiv);

  const pixelUrl = `${serverUrl}/t/${id}`;
  const htmlSnippet = `<img src="${pixelUrl}" width="1" height="1" style="display:none" />`;
  setCopyRow('snippet-html', htmlSnippet);
  setCopyRow('snippet-url', pixelUrl);

  try {
    const data = await api(`/s/${id}`);

    // 사람이 알아보는 건 제목이다. 목록 화면과 같은 규칙을 쓴다.
    const subject = (data.subject || '').trim();
    if (subject) {
      subjectEl.textContent = subject;
      subjectEl.title = subject;
    } else {
      subjectEl.textContent = 'No subject';
      subjectEl.classList.add('untitled');
    }

    // 식별자·수신자·발송 시각·발신 IP 보호 — 전부 기계 데이터라 한 줄 로그로 눕힌다.
    const metaEl = document.getElementById('detail-meta');
    metaEl.textContent = '';
    const metaLines = [
      [id, data.recipient ? T('meta.to', { r: data.recipient }) : null],
      [
        data.createdAt ? `sent ${timeAgo(data.createdAt)}` : null,
        data.hasSenderProtection ? T('meta.ip_filtered') : T('meta.ip_not_recorded'),
      ],
    ];
    metaLines.forEach(parts => {
      const kept = parts.filter(Boolean);
      if (!kept.length) return;
      const line = document.createElement('div');
      line.textContent = kept.join('  ·  ');
      metaEl.appendChild(line);
    });

    renderReading(data);

    const recentEvents = (data.events || []).slice().reverse().slice(0, 20);
    const filteredEvents = (data.filteredEvents || []).slice().reverse().slice(0, 20);

    document.getElementById('filtered-count').textContent =
      filteredEvents.length ? String(filteredEvents.length) : '';

    eventsListEl.textContent = '';
    filteredListEl.textContent = '';
    renderEventList(eventsListEl, recentEvents, false);
    renderEventList(filteredListEl, filteredEvents, true);
  } catch (err) {
    renderReading(null);
    document.getElementById('detail-state').textContent = 'Could not load the log';
    eventsListEl.textContent = '';
    const errDiv = document.createElement('div');
    errDiv.className = 'detail-error';
    errDiv.textContent = `${err.message}. Check the server URL in Settings, then reopen this tracker.`;
    eventsListEl.appendChild(errDiv);
  }
}

// --- Actions ---
async function loadPixels() {
  pixelContainer.textContent = '';
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading';
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  loadingDiv.appendChild(spinner);
  loadingDiv.appendChild(document.createTextNode('Loading...'));
  pixelContainer.appendChild(loadingDiv);

  try {
    // 서버가 페이지네이션 봉투로 줄 수도, 배열로 줄 수도 있다
    const raw = await api('/list');
    const pixels = Array.isArray(raw) ? raw : (raw.items || []);
    pixelContainer.textContent = '';

    if (pixels.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      const icon = document.createElement('div');
      icon.style.fontSize = '24px';
      icon.textContent = '\u25CB';
      const text = document.createElement('p');
      text.textContent = 'No tracked emails yet. Click + New to create one.';
      empty.appendChild(icon);
      empty.appendChild(text);
      pixelContainer.appendChild(empty);
      return;
    }

    // Sort by most recent open
    pixels.sort((a, b) => {
      if (!a.lastOpen && !b.lastOpen) return 0;
      if (!a.lastOpen) return 1;
      if (!b.lastOpen) return -1;
      return new Date(b.lastOpen) - new Date(a.lastOpen);
    });

    const list = document.createElement('div');
    list.className = 'pixel-list';

    pixels.forEach(p => {
      const item = document.createElement('div');
      item.className = 'pixel-item';
      item.dataset.id = p.id;

      // 횟수는 보여주지 않는다 — 프록시 재요청·다중 수신자 때문에 부정확하고,
      // 사용자가 숫자를 사실로 오해한다. 접촉이 있었는지만 표시한다.
      const opens = document.createElement('div');
      opens.className = 'pixel-opens';
      opens.style.color = p.opens > 0 ? 'var(--signal)' : 'var(--ink-3)';
      opens.style.fontSize = p.opens > 0 ? '15px' : '11px';
      opens.style.paddingTop = p.opens > 0 ? '1px' : '4px';
      opens.style.opacity = p.opens > 0 ? '1' : '.55';
      opens.textContent = p.opens > 0 ? '\u2713' : '\u00b7';
      opens.title = T(p.opens > 0 ? 'list.activity_yes' : 'list.activity_no');

      const info = document.createElement('div');
      info.className = 'pixel-info';

      // 사람이 알아보는 건 제목이다. 주소·ID 는 그 아래 로그로 내린다.
      const subjectDiv = document.createElement('div');
      subjectDiv.className = 'pixel-subject';
      if (p.subject && p.subject.trim()) {
        subjectDiv.textContent = p.subject.trim();
      } else {
        subjectDiv.classList.add('untitled');
        subjectDiv.textContent = T('list.no_subject');
      }
      subjectDiv.title = p.subject || '';
      info.appendChild(subjectDiv);

      const meta = document.createElement('div');
      meta.className = 'pixel-meta';
      const metaParts = [];
      if (p.recipient) metaParts.push(p.recipient);
      metaParts.push(p.createdAt ? T('list.sent_ago', { t: timeAgo(p.createdAt) }) : null);
      metaParts.push(p.lastOpen ? T('list.opened_ago', { t: timeAgo(p.lastOpen) }) : T('list.no_activity'));
      meta.textContent = metaParts.filter(Boolean).join('  ·  ');
      meta.title = p.id;
      info.appendChild(meta);

      item.setAttribute('role', 'button');
      item.tabIndex = 0;
      item.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); showDetail(p.id); }
      });
      item.appendChild(opens);
      item.appendChild(info);

      item.addEventListener('click', () => showDetail(p.id));
      list.appendChild(item);
    });

    pixelContainer.appendChild(list);
  } catch (err) {
    pixelContainer.textContent = '';
    const empty = document.createElement('div');
    empty.className = 'empty';
    const icon = document.createElement('div');
    icon.style.fontSize = '24px';
    icon.textContent = '⚠️';
    const text = document.createElement('p');
    if (err.message === 'Authentication required') {
      text.textContent = 'Password incorrect. Please update your settings.';
    } else {
      text.textContent = `Error: ${err.message}`;
    }
    empty.appendChild(icon);
    empty.appendChild(text);
    pixelContainer.appendChild(empty);
  }
}

async function createPixel() {
  try {
    const data = await api('/new');
    showToast(`Tracker "${data.id}" created!`);
    loadPixels();
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
}

async function deleteCurrentPixel() {
  if (!currentPixelId) return;
  if (!confirm(`Delete tracker "${currentPixelId}"? This cannot be undone.`)) return;

  try {
    await api(`/d/${currentPixelId}`);
    showToast('Tracker deleted');
    showList();
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
}

async function saveSettings() {
  const input = document.getElementById('server-input').value.trim().replace(/\/$/, '');
  const passwordInput = document.getElementById('password-input').value.trim();
  const errorEl = document.getElementById('setup-error');

  if (!input) {
    errorEl.textContent = 'Please enter a URL';
    errorEl.style.display = 'block';
    errorEl.style.color = '#ef4444';
    return;
  }

  // Test connection
  errorEl.textContent = 'Connecting...';
  errorEl.style.display = 'block';
  errorEl.style.color = '#888';

  try {
    const headers = {};
    if (passwordInput) {
      headers['Authorization'] = 'Basic ' + btoa(':' + passwordInput);
    }
    const res = await fetch(`${input}/list`, { headers });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    await res.json();
  } catch (err) {
    errorEl.textContent = `Can't connect: ${err.message}`;
    errorEl.style.color = '#ef4444';
    return;
  }

  serverUrl = input;
  dashboardPassword = passwordInput;
  authFailed = false;
  await chrome.storage.sync.set({ serverUrl: input, dashboardPassword: passwordInput, authFailed: false });
  
  // Clear temp storage after successful save
  await chrome.storage.local.remove(['tempServerUrl', 'tempPassword']);
  
  errorEl.style.display = 'none';
  showToast('Connected!');

  setupView.style.display = 'none';
  listView.style.display = 'block';
  loadPixels();
}

// --- Utilities ---
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2000);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!');
  });
}

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return T('time.just_now');
  if (diff < 3600) return T('time.m_ago', { n: Math.floor(diff / 60) });
  if (diff < 86400) return T('time.h_ago', { n: Math.floor(diff / 3600) });
  if (diff < 604800) return T('time.d_ago', { n: Math.floor(diff / 86400) });
  return new Date(dateStr).toLocaleDateString();
}

function truncate(str, len) {
  if (!str) return '?';
  return str.length > len ? str.slice(0, len) + '...' : str;
}


// User-Agent 를 사람이 읽을 수 있는 이름으로. 원문은 title 로 남긴다.
function describeClient(ua) {
  const u = ua || '';
  if (/GoogleImageProxy|ggpht\.com/i.test(u)) return 'Gmail (image proxy)';
  if (/YahooMailProxy/i.test(u)) return 'Yahoo Mail (proxy)';
  if (/Safelinks|ms-office/i.test(u)) return 'Outlook link scanner';
  if (/Barracuda|Proofpoint|Mimecast|SecurityScan/i.test(u)) return 'Security scanner';
  if (/iPhone|iPad/i.test(u)) return 'iPhone / iPad';
  if (/Android/i.test(u)) return 'Android';
  if (/Thunderbird/i.test(u)) return 'Thunderbird';
  if (/Macintosh|Mac OS X/i.test(u)) return 'Mac';
  if (/Windows/i.test(u)) return 'Windows';
  if (!u || u === 'unknown') return 'Unknown client';
  return truncate(u, 40);
}

function reasonLabel(reason) {
  switch (reason) {
    case 'self_view': return 'You viewed it';
    case 'sender_ip': return 'Your own IP';
    case 'scanner': return 'Security scanner';
    case 'prefetch_too_fast': return 'Machine prefetch';
    default: return reason || 'Filtered';
  }
}

function absoluteTime(t) {
  if (!t) return null;
  const d = new Date(t);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

// 없는 필드는 아예 행을 만들지 않는다. undefined 나 빈 구분자를 찍지 않기 위해.
function addField(dl, label, value) {
  if (value === undefined || value === null) return;
  const text = String(value).trim();
  if (!text) return;
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = text;
  dl.appendChild(dt);
  dl.appendChild(dd);
}

function joinParts(parts) {
  const kept = parts.filter(v => v !== undefined && v !== null && String(v).trim() !== '');
  return kept.length ? kept.join(' · ') : null;
}

// 한 건의 증거. 요약 = 언제 / 얼마나 믿을 수 있나 / 대략 어디.
// 펼치면 = 남아 있는 원시 필드 전부.
function buildEventRow(e, isFiltered) {
  const origin = provenanceOf(e);
  const abs = absoluteTime(e.time);

  const dot = document.createElement('span');
  dot.className = 'ev-dot';
  if (!isFiltered && origin !== 'unknown') dot.classList.add('is-' + origin);

  const head = document.createElement('div');
  head.className = 'ev-head';

  const time = document.createElement('span');
  time.className = 'ev-time';
  time.textContent = e.time ? timeAgo(e.time) : T('time.not_recorded');
  if (abs) time.title = abs;
  head.appendChild(time);

  // 발송 후 얼마 만에 왔는지 — 버리지 않고 보여주기만 한다.
  // 몇 초 만이면 기계일 가능성이 크지만, 알림 보고 바로 여는 사람도 있다.
  if (typeof e.sinceSentMs === 'number' && e.sinceSentMs >= 0) {
    const sec = Math.round(e.sinceSentMs / 1000);
    const gap = document.createElement('span');
    gap.className = 'ev-gap';
    gap.style.cssText = 'margin-left:7px;font-size:10px;color:var(--ink-3);font-family:var(--mono);';
    gap.textContent = sec < 90
      ? T('ev.since_sent', { n: sec })
      : T('ev.since_sent_m', { n: Math.round(sec / 60) });
    head.appendChild(gap);
  }

  const badge = document.createElement('span');
  badge.className = 'ev-badge';
  if (isFiltered) {
    badge.textContent = reasonLabel(e.reason);
    badge.title = T('ev.kept_out');
  } else if (origin === 'proxy') {
    badge.classList.add('is-proxy');
    badge.textContent = 'via proxy';
    badge.title = 'Fetched by the mail provider. One open can fire this several times, and it cannot be tied to one recipient.';
  } else if (origin === 'direct') {
    badge.classList.add('is-direct');
    badge.textContent = 'direct';
    badge.title = 'Loaded straight by the mail client.';
  } else {
    badge.textContent = T('ev.origin_unknown');
    badge.title = 'This record predates origin tracking, so there is no telling whether it came through a proxy.';
  }
  head.appendChild(badge);

  const lines = [];
  const place = joinParts([e.city, e.region, e.country]);
  const primary = place || e.ip || null;
  if (primary) {
    const l = document.createElement('div');
    l.className = 'ev-line';
    l.textContent = primary;
    lines.push(l);
  }
  const secondary = joinParts([
    e.asOrganization,
    e.userAgent ? describeClient(e.userAgent) : null,
  ]);
  if (secondary) {
    const l = document.createElement('div');
    l.className = 'ev-line dim';
    l.textContent = secondary;
    lines.push(l);
  }

  const dl = document.createElement('dl');
  dl.className = 'ev-kv';
  addField(dl, 'Time', abs);
  addField(dl, 'IP', e.ip);
  addField(dl, 'Place', joinParts([e.city, e.region, e.postalCode, e.country, e.continent]));
  if (e.latitude !== undefined && e.latitude !== null && e.latitude !== ''
      && e.longitude !== undefined && e.longitude !== null && e.longitude !== '') {
    addField(dl, 'Coordinates', `${e.latitude}, ${e.longitude}`);
  }
  addField(dl, 'Timezone', e.timezone);
  addField(dl, 'Network', joinParts([e.asn ? `AS${e.asn}` : null, e.asOrganization]));
  addField(dl, 'Edge', e.colo);
  addField(dl, 'Transport', joinParts([e.httpProtocol, e.tlsVersion]));
  if (isFiltered) addField(dl, 'Kept out as', reasonLabel(e.reason));
  addField(dl, 'User agent', e.userAgent);

  // 펼칠 내용이 없으면 disclosure 를 만들지 않는다. 빈 서랍은 만들지 않는다.
  if (!dl.children.length) {
    const row = document.createElement('div');
    row.className = 'ev';
    row.appendChild(dot);
    row.appendChild(head);
    lines.forEach(l => row.appendChild(l));
    return row;
  }

  const row = document.createElement('details');
  row.className = 'ev';
  const summary = document.createElement('summary');
  summary.appendChild(dot);
  summary.appendChild(head);
  lines.forEach(l => summary.appendChild(l));
  const more = document.createElement('span');
  more.className = 'ev-more';
  more.textContent = 'Full record';
  summary.appendChild(more);
  row.appendChild(summary);
  row.appendChild(dl);
  return row;
}

function renderEventList(container, events, isFiltered) {
  const list = Array.isArray(events) ? events : [];
  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'ev-empty';
    empty.textContent = isFiltered
      ? T('ev.none_filtered')
      : T('ev.none_recorded');
    container.appendChild(empty);
    return;
  }
  list.forEach(e => container.appendChild(buildEventRow(e || {}, isFiltered)));
}

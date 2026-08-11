// Gmail content script — auto-injects tracking pixel on Send
// Strategy: Only inject pixels when Send button is clicked

(function () {
  const LOG = '[MailTracker]';
  let serverUrl = '';
  let dashboardPassword = '';
  let trackingEnabled = true;

  // Add CSS for read indicators
  const style = document.createElement('style');
  style.textContent = `
    .mail-tracker-status {
      display: inline-block;
      font-size: 11px;
      font-weight: bold;
      cursor: default;
      opacity: 0.85;
      transition: opacity 0.15s;
    }
    .mail-tracker-status:hover { opacity: 1; }

    /* 네이티브 title 은 커서가 물음표로 바뀌고 1초 넘게 기다려야 뜬다.
       올리는 즉시 뜨는 자체 툴팁으로 대체한다. */
    #mail-tracker-tip {
      position: fixed;
      z-index: 2147483647;
      max-width: 300px;
      padding: 7px 10px;
      border-radius: 7px;
      background: #1f2023;
      color: #f4f4f5;
      font: 500 11.5px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 6px 20px rgba(0,0,0,.28);
      pointer-events: none;
      white-space: pre-line;
      opacity: 0;
      transition: opacity .1s ease;
    }
    #mail-tracker-tip.visible { opacity: 1; }
  `;
  document.head.appendChild(style);


  // ── 즉시 뜨는 툴팁 ──────────────────────────────────────
  let tipEl = null;
  function getTip() {
    if (tipEl && document.body.contains(tipEl)) return tipEl;
    tipEl = document.createElement('div');
    tipEl.id = 'mail-tracker-tip';
    document.body.appendChild(tipEl);
    return tipEl;
  }

  function showTip(target, text) {
    if (!text) return;
    const tip = getTip();
    tip.textContent = text;
    tip.classList.add('visible');
    const r = target.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();
    let left = r.left + r.width / 2 - tr.width / 2;
    let top = r.top - tr.height - 8;
    if (top < 6) top = r.bottom + 8;              // 위가 좁으면 아래로
    left = Math.max(8, Math.min(left, window.innerWidth - tr.width - 8));
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }

  function hideTip() {
    if (tipEl) tipEl.classList.remove('visible');
  }

  // 위임 — 인디케이터가 계속 새로 그려지므로 개별 바인딩은 새어나간다
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest?.('.mail-tracker-status');
    if (el) showTip(el, el.dataset.tip || '');
  }, true);
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest?.('.mail-tracker-status')) hideTip();
  }, true);
  window.addEventListener('scroll', hideTip, true);

  // Cache for tracking data to avoid excessive API calls
  let trackingDataCache = null;
  let lastCacheUpdate = 0;
  const CACHE_DURATION = 5000; // 5 second cache
  let currentView = '';

  // Get tracking data with caching
  async function getTrackingData() {
    // ★설정 로드가 비동기라 serverUrl 이 아직 빈 순간이 있다.
    //   그대로 fetch 하면 mail.google.com/list 로 나가 CORS 로 막히고
    //   'Failed to fetch' 로 보인다.
    if (!serverUrl) {
      console.log(LOG, 'getTrackingData skipped — settings not loaded yet');
      return [];
    }

    const now = Date.now();
    
    console.log(LOG, 'getTrackingData called - cache age:', now - lastCacheUpdate, 'ms');
    
    // Return cached data if still valid
    if (trackingDataCache && (now - lastCacheUpdate) < CACHE_DURATION) {
      console.log(LOG, 'Using cached data, no API call');
      return trackingDataCache;
    }
    
    console.log(LOG, 'Cache expired or empty, making API call...');
    
    try {
      const headers = {};
      if (dashboardPassword) {
        headers['Authorization'] = 'Basic ' + btoa(':' + dashboardPassword);
      }
      
      console.log(LOG, 'Making /list API call');
      const res = await fetch(`${serverUrl}/list`, { headers });
      if (res.ok) {
        const raw = await res.json();
        trackingDataCache = Array.isArray(raw) ? raw : (raw.items || []);
        lastCacheUpdate = now;
        console.log(LOG, 'API call successful, cached', trackingDataCache.length, 'trackers');
        return trackingDataCache;
      } else {
        console.warn(LOG, 'Failed to fetch tracking data:', res.status);
        return [];
      }
    } catch (e) {
      console.warn(LOG, 'Error fetching tracking data:', e);
      return [];
    }
  }

  // ── i18n ──
  const T = (k, v) => (window.MTI18N ? window.MTI18N.t(k, v) : k);
  if (window.MTI18N) window.MTI18N.init(() => {});
  chrome.storage.onChanged.addListener((c) => {
    if (!c.lang || !window.MTI18N) return;
    window.MTI18N.setLang(c.lang.newValue);
    // 이미 그려둔 것들을 걷어내고 다시 그린다 — 새로고침을 요구하지 않기 위해.
    document.querySelectorAll('.mt-compose-toggle, .mt-activity-btn, .mt-activity-panel')
      .forEach((el) => el.remove());
    hideTip();
    scanComposeToggles();
    trackingDataCache = null;
    scheduleIndicators(0);
  });

  // Load settings
  chrome.storage.sync.get(['serverUrl', 'autoTrack', 'dashboardPassword'], (result) => {
    serverUrl = result.serverUrl || '';
    dashboardPassword = result.dashboardPassword || '';
    trackingEnabled = result.autoTrack !== false;
    console.log(LOG, 'Loaded settings:', { serverUrl: serverUrl ? 'set' : 'empty', trackingEnabled });
    // 설정이 들어온 뒤에 한 번 그린다 — 진입 타이머와의 경합을 없앤다
    if (serverUrl) { trackingDataCache = null; scheduleIndicators(200); }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.serverUrl) serverUrl = changes.serverUrl.newValue || '';
    if (changes.dashboardPassword) dashboardPassword = changes.dashboardPassword.newValue || '';
    if (changes.autoTrack) trackingEnabled = changes.autoTrack.newValue !== false;
  });

  // Extract email addresses from a compose form
  function getRecipients(composeForm) {
    const recipients = new Set();

    // Method 1: span[email] inside recipient rows (most reliable in current Gmail)
    composeForm.querySelectorAll('span[email]').forEach(el => {
      const email = el.getAttribute('email');
      if (email && email.includes('@')) recipients.add(email.toLowerCase());
    });

    // Method 2: data-hovercard-id on recipient chips
    composeForm.querySelectorAll('[data-hovercard-id]').forEach(el => {
      const email = el.getAttribute('data-hovercard-id');
      if (email && email.includes('@')) recipients.add(email.toLowerCase());
    });

    // Method 3: [email] attribute
    composeForm.querySelectorAll('[email]').forEach(el => {
      const email = el.getAttribute('email');
      if (email && email.includes('@')) recipients.add(email.toLowerCase());
    });

    return Array.from(recipients);
  }

  // Extract email subject and body preview
  function getEmailContent(composeForm) {
    // Try multiple selectors for subject
    const subjectEl = composeForm.querySelector('input[name="subjectbox"]') ||
                     composeForm.querySelector('input[aria-label*="Subject"]') ||
                     composeForm.querySelector('input[placeholder*="Subject"]') ||
                     composeForm.querySelector('[data-tooltip*="Subject"] input');
    
    const subject = subjectEl?.value || '';
    
    // Try multiple selectors for body
    const bodyEl = composeForm.querySelector('[contenteditable="true"][aria-label*="Message"]') ||
                   composeForm.querySelector('[contenteditable="true"][role="textbox"]') ||
                   composeForm.querySelector('.Am.Al.editable') ||
                   composeForm.querySelector('[contenteditable="true"]');
    
    let bodyPreview = '';
    if (bodyEl) {
      const text = bodyEl.innerText || bodyEl.textContent || '';
      // Get first 2 lines, max 200 chars
      const lines = text.split('\n').filter(line => line.trim());
      bodyPreview = lines.slice(0, 2).join(' ').substring(0, 200);
    }
    
    console.log(LOG, 'Extracted content:', { subject, bodyPreview: bodyPreview.substring(0, 50) + '...' });
    return { subject: subject.trim(), bodyPreview: bodyPreview.trim() };
  }

  // Find compose form containing a body element
  function findComposeForm(bodyEl) {
    return bodyEl.closest('[role="dialog"]') || bodyEl.closest('.nH') || bodyEl.closest('form');
  }

  // Find all compose body elements
  function findComposeBodies() {
    return Array.from(document.querySelectorAll('div[contenteditable="true"]'))
      .filter(el => el.closest('[role="dialog"]') || el.closest('.nH'));
  }

  // Check which recipients don't have tracking pixels yet
  function getUntrackedRecipients(bodyEl, recipients) {
    const existing = Array.from(bodyEl.querySelectorAll('img[data-mail-tracker-to]'))
      .map(img => img.getAttribute('data-mail-tracker-to'));
    return recipients.filter(email => !existing.includes(email));
  }

  // Inject tracking pixel into a compose body for given recipients
  async function injectTracker(bodyEl, recipients) {
    if (!serverUrl || recipients.length === 0) return;

    const form = findComposeForm(bodyEl);
    const emailContent = getEmailContent(form);
    let injectedCount = 0;

    for (const recipient of recipients) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (dashboardPassword) {
          headers['Authorization'] = 'Basic ' + btoa(':' + dashboardPassword);
        }
        
        const payload = {
          to: recipient,
          subject: emailContent.subject,
          bodyPreview: emailContent.bodyPreview,
          messageId: Date.now() + '-' + Math.random().toString(36).substr(2, 9) // Unique message ID
        };
        
        const res = await fetch(`${serverUrl}/new`, { 
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
          console.warn(LOG, 'Failed to create tracker for', recipient, '- status:', res.status);
          continue;
        }
        const data = await res.json();

        const img = document.createElement('img');
        img.src = data.pixel;
        img.width = 1;
        img.height = 1;
        img.style.cssText = 'display:none!important;width:1px!important;height:1px!important;opacity:0!important;position:absolute!important;';
        img.setAttribute('data-mail-tracker', data.id);
        img.setAttribute('data-mail-tracker-to', recipient);
        img.setAttribute('data-message-id', payload.messageId);

        // Try to inject into the actual email content area, not just the compose div
        const contentArea = bodyEl.querySelector('[contenteditable="true"]') || 
                           bodyEl.querySelector('.Am.Al.editable') ||
                           bodyEl;
        
        contentArea.appendChild(img);
        injectedCount++;
        console.log(LOG, 'Injected tracker into content area for', recipient, '- id:', data.id);
      } catch (e) {
        console.warn(LOG, 'Error creating tracker for', recipient, e.message);
      }
    }

    if (injectedCount > 0) {
      console.log(LOG, 'Injected', injectedCount, 'tracking pixels');
    }
  }

  // Extract unique identifiers from Gmail thread
  function getEmailIdentifiers(row) {
    // Try to get Gmail's thread ID or message ID
    const threadId = row.querySelector('[data-thread-id]')?.getAttribute('data-thread-id') ||
                    row.querySelector('[data-legacy-thread-id]')?.getAttribute('data-legacy-thread-id');
    
    // Get subject from the email row
    const subjectEl = row.querySelector('.bog span') || row.querySelector('.y6 span');
    const subject = subjectEl?.textContent?.trim() || '';
    
    // Get timestamp
    const timeEl = row.querySelector('[title*="2026"]') || row.querySelector('span[title]');
    const timestamp = timeEl?.getAttribute('title') || '';
    
    return { threadId, subject, timestamp };
  }

  // Find best matching tracker for an email
  function findMatchingTracker(trackers, email, identifiers) {
    // First try exact subject + recipient match
    let matches = trackers.filter(t => 
      t.recipient === email && 
      t.subject && 
      identifiers.subject.includes(t.subject)
    );
    
    if (matches.length === 1) return matches[0];
    
    // If multiple matches, try to find most recent
    if (matches.length > 1) {
      return matches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    }
    
    // Fallback to any tracker for this recipient (most recent)
    matches = trackers.filter(t => t.recipient === email);
    if (matches.length > 0) {
      return matches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    }
    
    return null;
  }
  function addReadIndicators(composeForm) {
    if (!serverUrl) return;
    console.log(LOG, 'Adding read indicators...');
    
    // Find all recipient chips in the compose form
    const recipientChips = composeForm.querySelectorAll('span[email], [data-hovercard-id]');
    console.log(LOG, 'Found recipient chips:', recipientChips.length);
    
    recipientChips.forEach(async (chip) => {
      const email = chip.getAttribute('email') || chip.getAttribute('data-hovercard-id');
      if (!email || chip.querySelector('.mail-tracker-status')) return;
      
      console.log(LOG, 'Adding indicator for:', email);
      
      // Create status indicator
      const statusEl = document.createElement('span');
      statusEl.className = 'mail-tracker-status';
      // 미열람 = 표시 없음. 열렸을 때만 초록 체크 하나를 띄운다.
      statusEl.style.cssText = 'margin-left: 6px; font-size: 12px; color: #71717a; cursor: help; font-weight: bold;';
      statusEl.textContent = '\u25cf'; // 회색 채운 점 = 발송됨, 아직 활동 없음
      statusEl.dataset.tip = T('gmail.sent_no_activity');
      
      // Insert after the chip
      chip.parentNode.insertBefore(statusEl, chip.nextSibling);
      console.log(LOG, 'Indicator added for:', email);
      
      // Update status with cached data
      const trackers = await getTrackingData();
      const tracker = trackers.find(t => t.recipient === email);
      
      if (tracker && tracker.opens > 0) {
        statusEl.textContent = '\u2713'; // 초록 체크 하나 = 열람됨
        statusEl.style.color = '#34d399';
        
        const lastOpen = tracker.lastOpen ? new Date(tracker.lastOpen).toLocaleString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          month: 'short',
          day: 'numeric'
        }) : 'never';
        
        statusEl.dataset.tip = T('gmail.activity_recorded') + '\n' + T('gmail.last_signal', { t: lastOpen });
      }
    });
  }

  // Process a compose window — inject pixels for untracked recipients
  async function processCompose(bodyEl) {
    const form = findComposeForm(bodyEl);
    if (!form) {
      console.log(LOG, 'Could not find compose form for body element');
      return;
    }

    const recipients = getRecipients(form);
    if (recipients.length === 0) return;

    const untracked = getUntrackedRecipients(bodyEl, recipients);
    if (untracked.length === 0) return;

    console.log(LOG, 'Found untracked recipients:', untracked);
    await injectTracker(bodyEl, untracked);
  }


  // ── 작성창별 추적 on/off ──────────────────────────────────────────
  // 전역 autoTrack 이 기본값을 정하고, 작성창 버튼이 그 창에 한해 덮어쓴다.
  // Gmail 은 작성창을 여러 개 띄울 수 있으므로 상태는 폼 엘리먼트에 붙여 둔다.
  const COMPOSE_STATE = new WeakMap();

  function isTrackingOnFor(form) {
    if (!form) return trackingEnabled;
    const v = COMPOSE_STATE.get(form);
    return v === undefined ? trackingEnabled : v;
  }

  function setTrackingFor(form, on) {
    COMPOSE_STATE.set(form, on);
    const btn = form.querySelector('.mt-compose-toggle');
    if (btn) paintToggle(btn, on);
  }

  function paintToggle(btn, on) {
    btn.setAttribute('aria-pressed', String(on));
    btn.title = on ? T('gmail.tracking_on_title') : T('gmail.tracking_off_title');
    btn.style.color = on ? '#0b8457' : '#5f6368';
    btn.style.borderColor = on ? 'rgba(11,132,87,.35)' : 'rgba(95,99,104,.30)';
    btn.style.background = on ? 'rgba(11,132,87,.08)' : 'transparent';
    btn.textContent = (on ? '\u25cf ' : '\u25cb ') + T(on ? 'gmail.tracking_on' : 'gmail.tracking_off');
  }

  function ensureComposeToggle(sendBtn) {
    const form = sendBtn.closest('[role="dialog"]') || sendBtn.closest('.nH');
    if (!form || form.querySelector('.mt-compose-toggle')) return;

    const btn = document.createElement('div');
    btn.setAttribute('role', 'button');
    btn.tabIndex = 0;
    btn.className = 'mt-compose-toggle';
    btn.style.cssText = [
      'display:inline-flex', 'align-items:center', 'gap:5px',
      'margin:0 4px', 'padding:5px 9px', 'font-size:12px', 'font-weight:600',
      'line-height:1', 'border-radius:6px', 'border:1px solid', 'cursor:pointer',
      'font-family:inherit', 'white-space:nowrap', 'user-select:none',
    ].join(';');
    paintToggle(btn, isTrackingOnFor(form));

    const flip = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      setTrackingFor(form, !isTrackingOnFor(form));
    };
    btn.addEventListener('click', flip, true);
    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') flip(ev);
    }, true);

    // ★Send 는 분할 버튼(본체 + 드롭다운)이라 그 사이에 끼우면 UI 가 깨진다.
    //   작성창 하단 우측 아이콘 툴바에 넣는다. 실패하면 단계적으로 폴백.
    const footer = sendBtn.closest('.aDh, .btC, table') || form;
    const discard =
      footer.querySelector('[role="button"][aria-label*="Discard"], [role="button"][aria-label*="삭제"], .og') ||
      form.querySelector('[role="button"][aria-label*="Discard"], [role="button"][aria-label*="삭제"], .og');

    if (discard && discard.parentNode) {
      // 휴지통 바로 앞 = 툴바 오른쪽 끝
      discard.parentNode.insertBefore(btn, discard);
      return;
    }

    // 폴백 1: 서식 아이콘들이 든 툴바 셀
    const iconBar = footer.querySelector('.gU.a1, .aDj, .btC');
    if (iconBar) { iconBar.appendChild(btn); return; }

    // 폴백 2: Send 를 감싼 셀 '바깥'에 붙인다 (분할 버튼 내부는 건드리지 않음)
    const sendCell = sendBtn.closest('td, .dC');
    if (sendCell && sendCell.parentNode) {
      sendCell.parentNode.insertBefore(btn, sendCell.nextSibling);
      return;
    }
    form.appendChild(btn);
  }

  function scanComposeToggles() {
    document.querySelectorAll(
      'div[role="button"][aria-label*="Send"], div[role="button"][data-tooltip*="Send"]'
    ).forEach(ensureComposeToggle);
  }

  // Gmail 은 DOM 을 수시로 갈아끼우므로 버튼이 사라지면 다시 붙인다
  function startComposeToggleWatcher() {
    scanComposeToggles();
    new MutationObserver(() => scanComposeToggles())
      .observe(document.body, { childList: true, subtree: true });
  }

  // Watch for Send button clicks — block send, inject pixels, then allow send
  let isSending = false; // Flag to prevent infinite loop
  
  function setupSendInterception() {
    document.addEventListener('click', async (e) => {
      if (!serverUrl) return;
      if (isSending) return; // Skip if already sending

      const target = e.target.closest(
        'div[role="button"][aria-label*="Send"], ' +
        'div[role="button"][data-tooltip*="Send"]'
      );

      if (target) {
        console.log(LOG, 'Send button clicked - checking for untracked recipients');
        
        // Prevent the send
        e.stopPropagation();
        e.preventDefault();
        
        // Set flag to prevent re-interception
        isSending = true;
        
        // Process all compose windows
        const bodies = findComposeBodies();
        for (const body of bodies) {
          const form = findComposeForm(body);
          if (!form) continue;

          // 이 작성창에서 추적이 꺼져 있으면 픽셀을 붙이지 않는다
          if (!isTrackingOnFor(form)) {
            console.log(LOG, 'Tracking off for this compose — skipping injection');
            continue;
          }

          const recipients = getRecipients(form);
          const untracked = getUntrackedRecipients(body, recipients);
          
          if (untracked.length > 0) {
            console.log(LOG, 'Injecting pixels for untracked recipients:', untracked);
            await processCompose(body);
            // Wait a bit for pixels to be added to DOM
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        console.log(LOG, 'All pixels injected, sending email now');

        // 방금 만든 트래커가 목록에 바로 반영되도록 캐시를 버린다
        trackingDataCache = null;
        scheduleIndicators(1800);
        
        // Now trigger the actual send
        setTimeout(() => {
          target.click();
          // Reset flag after send
          setTimeout(() => { isSending = false; }, 1000);
        }, 100);
      }
    }, true); // Use capture phase to intercept before Gmail
  }

  // Periodically update read indicators for open compose windows
  function startStatusUpdater() {
    // No periodic updates - only fetch on view changes
  }


  // 목록이 다시 그려지면 인디케이터도 다시 붙인다 (디바운스)
  // ★Gmail 은 새 tr 을 추가하는 대신 기존 행을 재사용해 내용만 갈아끼운다.
  //   그래서 "tr 추가"만 감시하면 새로 온/보낸 메일에 표시가 안 붙는다.
  //   childList 변경 전반을 보되, 우리가 만든 변경은 무시해 루프를 막는다.
  let indicatorTimer = null;
  let selfMutating = false;

  function scheduleIndicators(delay) {
    if (indicatorTimer) clearTimeout(indicatorTimer);
    indicatorTimer = setTimeout(async () => {
      indicatorTimer = null;
      selfMutating = true;
      try {
        await addInboxReadIndicators();
        ensureThreadActivityButton();
      } finally {
        // 우리 변경이 관찰자에 되돌아오는 걸 흘려보낸 뒤 잠금 해제
        setTimeout(() => { selfMutating = false; }, 60);
      }
    }, delay || 500);
  }

  function startIndicatorWatcher() {
    new MutationObserver((muts) => {
      if (selfMutating) return;
      for (const m of muts) {
        // 우리가 넣은 칸/글리프에서 비롯된 변경은 무시
        const t = m.target;
        if (t && t.classList &&
            (t.classList.contains('mail-tracker-cell') ||
             t.classList.contains('mail-tracker-status') ||
             t.id === 'mail-tracker-tip')) continue;
        if (m.addedNodes.length || m.removedNodes.length) {
          scheduleIndicators(500);
          return;
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }


  // ── 스레드 액티비티 패널 ────────────────────────────────
  // 메일을 열었을 때 툴바 버튼으로 켜고 끈다. 기본은 꺼짐 — 볼 때만 본다.
  function describeClientG(ua) {
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
    return u ? u.slice(0, 40) : 'Unknown client';
  }

  function fmtWhen(iso) {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  async function fetchStats(id) {
    const headers = { 'Accept': 'application/json' };
    if (dashboardPassword) headers['Authorization'] = 'Basic ' + btoa(':' + dashboardPassword);
    const res = await fetch(`${serverUrl}/s/${id}?format=json`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function renderActivityPanel(panel, datasets) {
    panel.textContent = '';
    const title = document.createElement('div');
    title.style.cssText = 'font-weight:600;font-size:12px;margin-bottom:8px;color:#202124;';
    title.textContent = T('gmail.activity_heading');
    panel.appendChild(title);

    let any = false;
    datasets.forEach((d) => {
      const events = d.events || [];
      const head = document.createElement('div');
      head.style.cssText = 'font-size:11px;color:#5f6368;margin:8px 0 4px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;';
      head.textContent = d.recipient || d.id;
      panel.appendChild(head);

      if (!events.length) {
        const none = document.createElement('div');
        none.style.cssText = 'font-size:11px;color:#80868b;padding:2px 0 4px;';
        none.textContent = T('gmail.no_activity');
        panel.appendChild(none);
        return;
      }
      any = true;
      events.slice().reverse().slice(0, 12).forEach((e) => {
        const row = document.createElement('div');
        row.style.cssText = 'font-size:11px;line-height:1.5;padding:3px 0;border-top:1px solid #f1f3f4;';
        const proxy = e.viaProxy || e.confidence === 'proxy';
        const place = [e.city, e.region, e.country].filter(Boolean).join(', ') || (e.country || '?');
        const badge = T(proxy ? 'event.via_proxy' : 'event.direct');
        const color = proxy ? '#b45309' : '#0b8457';
        row.innerHTML = '';
        const t = document.createElement('span');
        t.style.cssText = 'font-weight:600;color:#202124;';
        t.textContent = fmtWhen(e.time);
        const b = document.createElement('span');
        b.style.cssText = `margin-left:6px;padding:1px 6px;border-radius:999px;font-size:9px;font-weight:600;color:${color};background:${proxy ? 'rgba(180,83,9,.10)' : 'rgba(11,132,87,.10)'};`;
        b.textContent = badge;
        const sub = document.createElement('div');
        sub.style.cssText = 'color:#5f6368;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;';
        sub.textContent = `${place} · ${e.ip || '?'} · ${describeClientG(e.userAgent)}`;
        row.appendChild(t); row.appendChild(b); row.appendChild(sub);
        panel.appendChild(row);
      });
    });

    if (any) {
      const note = document.createElement('div');
      note.style.cssText = 'margin-top:10px;padding:7px 9px;border-radius:6px;background:rgba(180,83,9,.07);border:1px solid rgba(180,83,9,.2);color:#b45309;font-size:10.5px;line-height:1.5;';
      note.textContent = T('gmail.panel_note');
      panel.appendChild(note);
    }
  }

  function ensureThreadActivityButton() {
    if (!isThreadView() || !serverUrl) return;
    const ids = findPixelIdsInThread();
    if (!ids.length) return;

    const star = document.querySelector(
      '[role="main"] [aria-label*="Star"], [role="main"] [data-tooltip*="Star"], [role="main"] .T-KT'
    );
    if (!star) return;

    // 별 바로 앞, 아이콘 묶음 '안'에 넣는다.
    // 셀 구조면 같은 형태의 셀을 만들어 끼워야 정렬이 안 깨진다.
    const starCell = star.closest('td');
    const host = starCell ? starCell.parentElement : star.parentElement;
    if (!host || host.querySelector('.mt-activity-btn')) return;

    const btn = document.createElement('span');
    btn.className = 'mt-activity-btn';
    btn.setAttribute('role', 'button');
    btn.tabIndex = 0;
    btn.title = T('gmail.activity_title');
    btn.style.cssText =
      'display:inline-flex;align-items:center;justify-content:center;'
      + 'width:28px;height:28px;margin:0 2px;border-radius:50%;'
      + 'cursor:pointer;vertical-align:middle;color:#5f6368;'
      + 'transition:background .12s,color .12s;';
    btn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
      + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M3 12h3.5l2-6 3.5 13 2.5-9 1.7 4H21"/></svg>';
    btn.addEventListener('mouseenter', () => { if (!open) btn.style.background = 'rgba(60,64,67,.08)'; });
    btn.addEventListener('mouseleave', () => { if (!open) btn.style.background = 'transparent'; });

    const panel = document.createElement('div');
    panel.className = 'mt-activity-panel';
    panel.style.cssText =
      'display:none;margin:10px 0 4px;padding:12px 14px;border:1px solid #dadce0;'
      + 'border-radius:10px;background:#fff;max-height:320px;overflow-y:auto;';

    let open = false;
    const toggle = async (ev) => {
      ev?.preventDefault();
      ev?.stopPropagation();
      open = !open;
      btn.style.color = open ? '#0b8457' : '#5f6368';
      btn.style.background = open ? 'rgba(11,132,87,.12)' : 'transparent';
      if (!open) { panel.style.display = 'none'; return; }

      panel.style.display = 'block';
      panel.textContent = T('common.loading');
      const anchor = document.querySelector('[role="main"] .nH.if') || host.closest('.nH') || host.parentElement;
      if (anchor && !anchor.contains(panel)) anchor.insertBefore(panel, anchor.firstChild);
      try {
        const data = await Promise.all(findPixelIdsInThread().map(fetchStats));
        renderActivityPanel(panel, data);
      } catch (e) {
        panel.textContent = T('gmail.load_failed', { e: e.message });
      }
    };
    btn.addEventListener('click', toggle, true);
    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') toggle(ev);
    }, true);

    if (starCell) {
      const cell = document.createElement('td');
      cell.style.cssText = 'padding:0;vertical-align:middle;width:32px;';
      cell.appendChild(btn);
      host.insertBefore(cell, starCell);
    } else {
      host.insertBefore(btn, star);
    }
  }

  // 상태 전용 열. 이름 뒤에 붙이면 이름 길이에 따라 위치가 흔들려 세로 스캔이 안 된다.
  // 발신자 칸(td.yX) 바로 앞에 고정폭 칸을 만든다.
  // ★추적이 없는 행에도 빈 칸을 넣어야 열이 어긋나지 않는다.
  function ensureStatusCell(row) {
    let cell = row.querySelector('td.mail-tracker-cell');
    if (cell) return cell;

    cell = document.createElement('td');
    cell.className = 'mail-tracker-cell';
    cell.style.cssText =
      'width:28px;min-width:28px;padding:0 7px 0 5px;'
      + 'text-align:center;vertical-align:middle;line-height:1;white-space:nowrap;';

    const anchor = row.querySelector('td.yX') || row.querySelector('td.xY:nth-of-type(4)');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(cell, anchor);
    } else {
      row.appendChild(cell);
    }
    return cell;
  }

  // Add read indicators to sent emails in inbox view
  // 추적은 '내가 보낸 메일'에 대한 것이므로 보낸편지함에서만 의미가 있다.
  // 다른 화면에서는 열을 만들지 않고, 이미 만든 것이 있으면 걷어낸다.
  function isSentView() {
    return (location.hash || '').replace('#', '').split('/')[0].toLowerCase() === 'sent';
  }

  function removeAllIndicators() {
    document.querySelectorAll('.mail-tracker-status').forEach((el) => el.remove());
    document.querySelectorAll('td.mail-tracker-cell').forEach((el) => el.remove());
  }

  async function addInboxReadIndicators() {
    if (!serverUrl || !dashboardPassword) return;
    if (!isSentView()) { removeAllIndicators(); return; }
    
    console.log(LOG, 'addInboxReadIndicators called');
    
    // First, remove all existing indicators to prevent duplicates
    document.querySelectorAll('.mail-tracker-status').forEach(el => el.remove());
    // 칸 자체는 유지한다 — 매번 지웠다 만들면 목록이 미세하게 흔들린다
    console.log(LOG, 'Cleared existing indicators');
    
    // Fetch tracking data ONCE before processing emails
    const trackers = await getTrackingData();
    console.log(LOG, 'Got', trackers.length, 'trackers for processing');
    
    // Find sent email rows (emails with "To: " prefix)
    const sentRows = document.querySelectorAll('tr[role="row"]');
    console.log(LOG, 'Found', sentRows.length, 'email rows');
    
    // 먼저 모든 행에 빈 칸을 만들어 열 정렬을 맞춘다
    sentRows.forEach(row => ensureStatusCell(row));

    sentRows.forEach((row, index) => {
      const toField = row.querySelector('.yW');
      if (!toField || !toField.textContent.startsWith('To: ')) return;
      
      const emailSpan = toField.querySelector('span[email]');
      if (!emailSpan) return; // Remove the duplicate check since we cleared all indicators above
      
      const email = emailSpan.getAttribute('email');
      console.log(LOG, 'Processing row', index, 'for email:', email);
      
      // Get email identifiers for better matching
      const identifiers = getEmailIdentifiers(row);
      console.log(LOG, 'Email identifiers:', identifiers);
      
      // Find the best matching tracker for this specific email
      const tracker = findMatchingTracker(trackers, email, identifiers);
      
      // Only add indicator if email was tracked
      if (!tracker) {
        console.log(LOG, 'Email', email, 'not tracked, skipping');
        return;
      }
      
      console.log(LOG, 'Found tracked email to:', email);
      
      // Create status indicator
      const statusEl = document.createElement('span');
      statusEl.className = 'mail-tracker-status';
      statusEl.style.cssText = 'display:inline-block;margin:0;font-size:12px;line-height:1;cursor:help;font-weight:bold;';
      
      if (tracker.opens > 0) {
        statusEl.textContent = '\u2713'; // 초록 체크 하나 = 열람됨
        statusEl.style.color = '#34d399';
        
        const lastOpen = tracker.lastOpen ? new Date(tracker.lastOpen).toLocaleString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          month: 'short',
          day: 'numeric'
        }) : 'never';
        
        statusEl.dataset.tip = T('gmail.activity_recorded') + '\n' + T('gmail.last_signal', { t: lastOpen });
      } else {
        statusEl.textContent = '\u25cf'; // 회색 채운 점 = 발송됨, 아직 활동 없음
        statusEl.style.color = '#71717a';
        statusEl.dataset.tip = T('gmail.sent_no_activity');
      }
      
      // 전용 열에 넣는다 (이름 우측이 아니라)
      statusEl.style.marginLeft = '0';
      const cell = ensureStatusCell(row);
      cell.textContent = '';
      cell.appendChild(statusEl);
      console.log(LOG, 'Added indicator for tracked email:', email);
    });
  }

  // ---- Self-view detection ----
  // When the sender opens a thread containing tracked pixels, notify the worker
  // so it can filter out the self-open (Gmail proxy fires /t/:id around the same time)

  const SELF_VIEW_DELAY_MS = 1000;


  function isThreadView() {
    // Gmail thread URLs look like #inbox/FMfcg... or #sent/FMfcg... or #label/FMfcg...
    const hash = location.hash;
    // Thread views have a second path segment (the thread ID)
    const parts = hash.replace('#', '').split('/');
    return parts.length >= 2 && parts[1].length > 5;
  }

  // Find tracker pixel IDs directly from <img> tags in the thread DOM
  // Gmail proxies images like: https://ci3.googleusercontent.com/meips/...#https://mail-tracker.xxx.workers.dev/t/8bdcb976
  // The actual pixel URL is after the # fragment
  function findPixelIdsInThread() {
    const ids = new Set();
    if (!serverUrl) return [];

    // Extract the host from our server URL to avoid matching other sites' /t/ paths
    const serverHost = new URL(serverUrl).host;

    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.getAttribute('src') || '';
      // Only match if src contains our server host
      if (!src.includes(serverHost)) return;
      const match = src.match(/\/t\/([a-f0-9]{8})\b/);
      if (match) ids.add(match[1]);
    });

    // Also check data attributes set during injection (before Gmail proxied them)
    document.querySelectorAll('img[data-mail-tracker]').forEach(img => {
      ids.add(img.getAttribute('data-mail-tracker'));
    });

    return Array.from(ids);
  }

  async function notifySelfView(ids) {
    if (!serverUrl || ids.length === 0) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (dashboardPassword) {
        headers['Authorization'] = 'Basic ' + btoa(':' + dashboardPassword);
      }
      console.log(LOG, `[self-view] POST /self — ids:`, ids);
      const res = await fetch(`${serverUrl}/self`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log(LOG, '[self-view] response:', JSON.stringify(data));
      } else {
        console.warn(LOG, `[self-view] server returned ${res.status}`);
      }
    } catch (e) {
      console.warn(LOG, `[self-view] error:`, e.message);
    }
  }

  let selfViewTimer = null;

  async function checkSelfView() {
    if (!serverUrl || !isThreadView()) return;

    const ids = findPixelIdsInThread();
    console.log(LOG, `[self-view] found ${ids.length} pixel(s) in thread:`, ids);

    if (ids.length === 0) return;

    // Cancel any existing pending call
    if (selfViewTimer) {
      clearTimeout(selfViewTimer);
      selfViewTimer = null;
    }

    selfViewTimer = setTimeout(async () => {
      await notifySelfView(ids);
      selfViewTimer = null;
    }, SELF_VIEW_DELAY_MS);
  }

  function cancelPendingSelfViews() {
    if (selfViewTimer) {
      console.log(LOG, '[self-view] cancelling pending self-view call (user left thread)');
      clearTimeout(selfViewTimer);
      selfViewTimer = null;
    }
  }

  // Initialize tracking
  if (window.location.hostname === 'mail.google.com') {
    console.log(LOG, 'Initializing...');
    setupSendInterception();
    startComposeToggleWatcher();

    // 진입 즉시 1회 — 설정 로드가 비동기라 여유를 준다
    setTimeout(() => scheduleIndicators(0), 1500);
    // Gmail 은 목록을 비동기로 갈아끼운다. 행이 새로 그려지면 다시 붙인다.
    startIndicatorWatcher();

    // Detect view changes and fetch data only when needed
    let lastUrl = location.href;

    function handleViewChange() {
      const newView = location.hash;
      console.log(LOG, 'URL changed to:', newView);

      // 목록이 있는 화면이면 어디든 표시한다.
      // 종전엔 '#sent' 로 해시가 '바뀔 때'만 돌아서, 이미 그 화면에 있는 상태로
      // 확장을 새로고침하면 아무것도 안 그려졌다.
      if (newView !== currentView) {
        currentView = newView;
        console.log(LOG, 'View changed to:', currentView, '- refreshing indicators');
        trackingDataCache = null;
        scheduleIndicators(600);
      }

      // Self-view detection: check if user opened a thread with tracked pixels
      if (isThreadView()) {
        console.log(LOG, '[self-view] thread view detected, will check for tracked pixels');
        // Small delay to let Gmail render the thread content
        setTimeout(() => checkSelfView(), 800);
      } else {
        // User left a thread view — cancel any pending self-view calls
        cancelPendingSelfViews();
      }
    }

    // Initial load
    if (location.hash === '#sent') {
      handleViewChange();
    }
    // Also check if we loaded directly into a thread
    if (isThreadView()) {
      setTimeout(() => checkSelfView(), 1500);
    }

    // Watch for URL changes with polling instead of MutationObserver
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        handleViewChange();
      }
    }, 1000);
  }

})();

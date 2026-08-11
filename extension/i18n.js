// 확장 전역 i18n. 팝업과 콘텐츠 스크립트가 함께 쓴다.
// 저장값이 없으면 브라우저 UI 언어를 따르고, 고르면 그때부터 선택이 이긴다.
(function (root) {
  const DICT = {
    en: {
      // 공통
      'app.name': 'Mail Tracker',
      'common.refresh_needed': 'Language updated.',
      'common.loading': 'Loading…',

      // 목록
      'list.no_subject': 'No subject',
      'list.no_activity': 'no activity yet',
      'list.sent_ago': 'sent {t}',
      'list.opened_ago': 'opened {t}',
      'list.empty': 'Nothing tracked yet',
      'list.activity_yes': 'Activity recorded — open for details',
      'list.activity_no': 'No activity yet',

      // 상세
      'detail.status': 'Status',
      'detail.opened': 'Opened',
      'detail.no_activity': 'No activity',
      'detail.last_activity': 'Last Activity',
      'detail.filtered_out': 'Filtered Out',
      'detail.sender_protection': 'Sender Protection',
      'detail.active': 'Active',
      'detail.off': 'Off',
      'detail.never': 'Never',
      'detail.caveat': 'Some or all of this activity came through a mail provider’s image proxy. One open can fire it several times, and if the email had more than one recipient it cannot be tied to a specific person. Read the events below and judge for yourself.',
      'detail.snippet_html': 'HTML snippet (click to copy)',
      'detail.snippet_url': 'Tracking URL (click to copy)',
      'detail.tab_recent': 'Recent',
      'detail.tab_filtered': 'Filtered',
      'detail.none_recent': 'No activity recorded yet',
      'detail.none_filtered': 'Nothing filtered out',

      // 이벤트
      'event.via_proxy': 'via proxy',
      'event.direct': 'direct',
      'event.proxy_hint': 'Fetched through the mail provider. A single open can fire this several times, and it cannot be tied to one recipient.',
      'event.direct_hint': 'Loaded directly by the mail client.',
      'reason.self_view': 'You viewed it',
      'reason.sender_ip': 'Your own IP',
      'reason.scanner': 'Security scanner',
      'reason.prefetch_too_fast': 'Machine prefetch',

      // 클라이언트
      'client.gmail_proxy': 'Gmail (image proxy)',
      'client.yahoo_proxy': 'Yahoo Mail (proxy)',
      'client.outlook_scanner': 'Outlook link scanner',
      'client.security_scanner': 'Security scanner',
      'client.unknown': 'Unknown client',

      // 설정
      'ui.manual': '+ Manual',
      'limit.attribution': 'Every recipient’s pixel travels inside the same message body, so one person opening the mail fires all of them. Activity cannot be tied to a specific recipient.',
      'limit.proxy': 'A request routed through a mail proxy reports the proxy, not the reader. A message read on a phone in Korea recorded as The Dalles, Oregon, on Google’s network.',
      'ui.cant_tell': 'What this can’t tell you',
      'ui.who_opened': 'Who opened it',
      'ui.where_were': 'Where they were',
      'ui.recorded': 'Recorded',
      'ui.filtered': 'Filtered',
      'ui.embed_code': 'Embed code',
      'ui.html': 'HTML',
      'ui.url': 'URL',
      'ui.server_hint': 'Enter your Mail Tracker server URL (your Cloudflare Worker URL)',
      'settings.title': 'Settings',
      'settings.server': 'Your Mail Tracker server URL',
      'settings.token': 'Your access token',
      'settings.save': 'Save & Connect',
      'settings.autotrack': 'Track new emails automatically',
      'settings.autotrack_sub': 'Sets the default for every compose window. Turn it off to track only the emails you choose. You can always flip it per email with the Tracking button next to Send.',
      'settings.notify': 'Show a Chrome notification on new activity',
      'settings.notify_sub': 'Off by default. When on, the extension checks for new activity every five minutes and notifies you.',
      'settings.language': 'Language',
      'settings.language_sub': 'Applies everywhere right away, including the labels inside Gmail.',
      'settings.notify_on': 'Notifications on',
      'settings.notify_off': 'Notifications off',
      'settings.track_on': 'New emails will be tracked by default',
      'settings.track_off': 'New emails will not be tracked unless you turn it on',

      // Gmail 안
      'gmail.tracking_on': 'Tracking',
      'gmail.tracking_off': 'Tracking',
      'gmail.tracking_on_title': 'Mail Tracker: this email will be tracked. Click to turn off.',
      'gmail.tracking_off_title': 'Mail Tracker: this email will NOT be tracked. Click to turn on.',
      'gmail.activity_title': 'Tracking activity for this email',
      'gmail.activity_heading': 'Activity on this email',
      'gmail.no_activity': 'No activity recorded yet',
      'gmail.sent_no_activity': 'Sent — no activity recorded yet',
      'gmail.activity_recorded': 'Activity recorded',
      'gmail.last_signal': 'Last signal: {t}',
      'gmail.panel_note': 'Activity through a mail provider proxy can repeat for one open, and cannot be tied to a specific recipient when the email had more than one.',
      'gmail.load_failed': 'Could not load activity: {e}',

      // 시간
      'time.just_now': 'just now',
      'time.m_ago': '{n}m ago',
      'time.h_ago': '{n}h ago',
    },

    ko: {
      'app.name': 'Mail Tracker',
      'common.refresh_needed': '언어를 바꿨어요.',
      'common.loading': '불러오는 중…',

      'list.no_subject': '제목 없음',
      'list.no_activity': '아직 활동 없음',
      'list.sent_ago': '{t} 발송',
      'list.opened_ago': '{t} 열람',
      'list.empty': '추적 중인 메일이 없어요',
      'list.activity_yes': '활동 기록됨 — 눌러서 상세 보기',
      'list.activity_no': '아직 활동 없음',

      'detail.status': '상태',
      'detail.opened': '열람됨',
      'detail.no_activity': '활동 없음',
      'detail.last_activity': '마지막 활동',
      'detail.filtered_out': '걸러짐',
      'detail.sender_protection': '발신자 보호',
      'detail.active': '작동 중',
      'detail.off': '꺼짐',
      'detail.never': '없음',
      'detail.caveat': '이 활동의 일부 또는 전부가 메일 서비스의 이미지 프록시를 거쳐 왔어요. 한 번 열어도 여러 번 기록될 수 있고, 수신자가 여러 명이면 누가 열었는지 특정할 수 없어요. 아래 기록을 보고 직접 판단하세요.',
      'detail.snippet_html': 'HTML 코드 (눌러서 복사)',
      'detail.snippet_url': '추적 URL (눌러서 복사)',
      'detail.tab_recent': '최근',
      'detail.tab_filtered': '걸러짐',
      'detail.none_recent': '아직 기록된 활동이 없어요',
      'detail.none_filtered': '걸러진 것이 없어요',

      'event.via_proxy': '프록시 경유',
      'event.direct': '직접 접속',
      'event.proxy_hint': '메일 서비스를 거쳐 불러온 요청이에요. 한 번 열어도 여러 번 발생할 수 있고, 특정 수신자에게 귀속시킬 수 없어요.',
      'event.direct_hint': '메일 앱이 직접 불러왔어요.',
      'reason.self_view': '본인이 열어봄',
      'reason.sender_ip': '본인 IP',
      'reason.scanner': '보안 스캐너',
      'reason.prefetch_too_fast': '기계 프리페치',

      'client.gmail_proxy': 'Gmail (이미지 프록시)',
      'client.yahoo_proxy': 'Yahoo 메일 (프록시)',
      'client.outlook_scanner': 'Outlook 링크 스캐너',
      'client.security_scanner': '보안 스캐너',
      'client.unknown': '알 수 없는 클라이언트',

      'ui.manual': '+ 수동 생성',
      'limit.attribution': '수신자마다 만든 픽셀이 모두 같은 메일 본문 안에 들어가요. 그래서 한 명이 열면 전부 발생하고, 활동을 특정 수신자에게 귀속시킬 수 없어요.',
      'limit.proxy': '메일 프록시를 거친 요청은 읽은 사람이 아니라 프록시를 알려줘요. 한국에서 폰으로 읽은 메일이 미국 오리건주 더 댈러스, 구글 네트워크로 기록됐어요.',
      'ui.cant_tell': '이걸로는 알 수 없는 것',
      'ui.who_opened': '누가 열었는지',
      'ui.where_were': '어디에 있었는지',
      'ui.recorded': '기록됨',
      'ui.filtered': '걸러짐',
      'ui.embed_code': '삽입 코드',
      'ui.html': 'HTML',
      'ui.url': 'URL',
      'ui.server_hint': 'Mail Tracker 서버 주소를 입력하세요 (본인의 Cloudflare Worker 주소)',
      'settings.title': '설정',
      'settings.server': 'Mail Tracker 서버 주소',
      'settings.token': '액세스 토큰',
      'settings.save': '저장하고 연결',
      'settings.autotrack': '새 메일을 자동으로 추적',
      'settings.autotrack_sub': '모든 작성창의 기본값을 정해요. 꺼두면 직접 켠 메일만 추적돼요. 메일마다 Send 옆 버튼으로 바꿀 수 있어요.',
      'settings.notify': '새 활동이 있으면 Chrome 알림 표시',
      'settings.notify_sub': '기본은 꺼짐이에요. 켜면 5분마다 새 활동을 확인해 알려줘요.',
      'settings.language': '언어',
      'settings.language_sub': 'Gmail 안 표시까지 즉시 바뀌어요.',
      'settings.notify_on': '알림을 켰어요',
      'settings.notify_off': '알림을 껐어요',
      'settings.track_on': '새 메일을 기본으로 추적해요',
      'settings.track_off': '직접 켠 메일만 추적해요',

      'gmail.tracking_on': '추적 중',
      'gmail.tracking_off': '추적 안 함',
      'gmail.tracking_on_title': 'Mail Tracker: 이 메일은 추적돼요. 누르면 꺼져요.',
      'gmail.tracking_off_title': 'Mail Tracker: 이 메일은 추적되지 않아요. 누르면 켜져요.',
      'gmail.activity_title': '이 메일의 추적 활동',
      'gmail.activity_heading': '이 메일의 활동',
      'gmail.no_activity': '아직 기록된 활동이 없어요',
      'gmail.sent_no_activity': '발송됨 — 아직 활동 없음',
      'gmail.activity_recorded': '활동 기록됨',
      'gmail.last_signal': '마지막 신호: {t}',
      'gmail.panel_note': '프록시를 거친 활동은 한 번 열람에도 반복될 수 있고, 수신자가 여러 명이면 특정인에게 귀속시킬 수 없어요.',
      'gmail.load_failed': '활동을 불러오지 못했어요: {e}',

      'time.just_now': '방금',
      'time.m_ago': '{n}분 전',
      'time.h_ago': '{n}시간 전',
    },
  };

  let lang = 'en';

  function detect() {
    try {
      const ui = (chrome.i18n && chrome.i18n.getUILanguage && chrome.i18n.getUILanguage())
        || navigator.language || 'en';
      return ui.toLowerCase().startsWith('ko') ? 'ko' : 'en';
    } catch (e) {
      return 'en';
    }
  }

  function t(key, vars) {
    let s = (DICT[lang] && DICT[lang][key]) || DICT.en[key] || key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }

  function setLang(next) { lang = DICT[next] ? next : 'en'; }
  function getLang() { return lang; }

  function init(cb) {
    try {
      chrome.storage.sync.get(['lang'], ({ lang: saved }) => {
        setLang(saved || detect());
        if (cb) cb(lang);
      });
    } catch (e) {
      setLang(detect());
      if (cb) cb(lang);
    }
  }

  root.MTI18N = { t, init, setLang, getLang, detect, langs: ['en', 'ko'] };
})(typeof window !== 'undefined' ? window : globalThis);

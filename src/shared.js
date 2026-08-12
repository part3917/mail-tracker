export const PIXEL = Uint8Array.from(atob(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRU5ErkJggg=='
), c => c.charCodeAt(0));

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const BOT_PATTERNS = [
  // 링크·첨부 스캐너 (사람 아님)
  /Safelinks/i,
  /ms-office/i,
  /BCLinked/i,
  /Google-SMTP-STS/i,
  /Yahoo! Slurp/i,
  /SecurityScan/i,
  /Barracuda/i,
  /Proofpoint/i,
  /Mimecast/i,
];

// ★프록시 경유 열람 — 봇이 아니라 "사람일 가능성이 높은 프록시 fetch"로 별도 분류
// Gmail은 Apple MPP와 달리 배달 시점 프리페치를 하지 않으므로 실제 열람 신호에 가깝다.
export const PROXY_PATTERNS = [
  /GoogleImageProxy/i,
  /ggpht\.com/i,
  /YahooMailProxy/i,
];

// 발송 후 이 시간 안에 들어온 요청은 기계로 간주 (Apple MPP 프리페치 차단)
export const MACHINE_WINDOW_MS = 10_000;

// ★IP로는 봇/사람 구분 불가 — 사람이 폰에서 Gmail을 열어도 같은 프록시 IP를 경유한다.
// 대역을 막으면 진짜 열람까지 버려지므로 비활성화.
export const PROXY_IP_PREFIXES = [];

export const DEDUP_WINDOW_MS = 5000;

export const FAVICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%236366f1'/><path d='M20 35c0-3 2-5 5-5h50c3 0 5 2 5 5v30c0 3-2 5-5 5H25c-3 0-5-2-5-5V35z' fill='none' stroke='white' stroke-width='5'/><path d='M22 33l28 22 28-22' fill='none' stroke='white' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/><circle cx='75' cy='28' r='12' fill='%2334d399'/><text x='75' y='33' text-anchor='middle' fill='white' font-size='16' font-weight='bold'>1</text></svg>";

export const LOGO_SVG = '<svg width="22" height="22" viewBox="0 0 100 100" style="flex-shrink:0"><rect width="100" height="100" rx="20" fill="#6366f1"/><path d="M20 35c0-3 2-5 5-5h50c3 0 5 2 5 5v30c0 3-2 5-5 5H25c-3 0-5-2-5-5V35z" fill="none" stroke="white" stroke-width="5"/><path d="M22 33l28 22 28-22" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="75" cy="28" r="12" fill="#34d399"/></svg>';

export function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export function isBot(userAgent, ip) {
  if (userAgent && BOT_PATTERNS.some(pattern => pattern.test(userAgent))) return true;
  return false;
}

// 프록시 경유 여부 (Gmail/Yahoo 이미지 프록시)
export function isProxy(userAgent) {
  return !!(userAgent && PROXY_PATTERNS.some(p => p.test(userAgent)));
}

// 발송 직후 10초 이내 = Apple MPP 등 기계 프리페치

// ★자백하지 않는 프록시 판별.
// UA 는 평범한 브라우저로 위장되지만, IP 를 소유한 조직명은 등록기관 값이라 위조하기 어렵다.
// 데이터센터/클라우드 사업자에서 온 요청은 사람의 기기가 아니므로 direct 로 보지 않는다.
// 근거 사례: 2026-08-12 Park Kiely 재발송 — 발송 23초 뒤 asOrganization="Microsoft Corporation",
//            UA 는 평범한 Windows Chrome 이라 기존 패턴에 전혀 안 걸렸다 (MS365 수신 처리).
export const CLOUD_ORG_PATTERNS = [
  /microsoft/i, /google/i, /amazon|aws/i, /cloudflare/i, /oracle/i,
  /digitalocean/i, /linode|akamai/i, /hetzner/i, /ovh/i, /alibaba/i,
  /proofpoint/i, /mimecast/i, /barracuda/i, /fastly/i, /zscaler/i,
];

export function isCloudNetwork(asOrganization) {
  if (!asOrganization) return false;
  return CLOUD_ORG_PATTERNS.some((re) => re.test(asOrganization));
}

export function isTooFast(sentAtMs, nowMs) {
  if (!sentAtMs) return false;
  return (nowMs - sentAtMs) < MACHINE_WINDOW_MS;
}

// ── 멀티테넌트 키 스키마 ────────────────────────────────────────────
//   t:<id>            → 추적 데이터 (owner 필드 포함). 픽셀이 읽는 실데이터
//   u:<token>:<id>    → 소유권 색인 (빈 값). /list 는 이 접두어만 스캔
//   u:<token>:__meta__ → 사용자 등록 레코드 { name, createdAt }
// ★추적 ID 에는 토큰을 절대 넣지 않는다 — 픽셀 URL 은 메일 본문에 실려
//   수신자에게 그대로 노출되므로, ID 에 토큰이 있으면 대시보드 열쇠가 새어 나간다.
export const dataKey = (id) => `t:${id}`;
export const indexKey = (token, id) => `u:${token}:${id}`;
export const metaKey = (token) => `u:${token}:__meta__`;

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

// Basic 인증의 password 자리에 담긴 사용자 토큰을 검증해 반환한다.
// 등록되지 않은 토큰이면 null → 호출부에서 401.
// 관리자 여부는 사용자 등록 레코드의 admin 플래그로 판단한다.
// 별도 비밀번호를 두면 관리할 비밀이 하나 더 늘 뿐이다.
export async function isAdmin(env, token) {
  if (!token) return false;
  try {
    const meta = JSON.parse((await env.TRACKER.get(metaKey(token))) || '{}');
    return meta.admin === true;
  } catch (e) {
    return false;
  }
}

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(bytes, (b) => abc[b % abc.length]).join('');
}

export async function getUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return null;
  let decoded;
  try {
    decoded = atob(authHeader.slice(6));
  } catch (e) {
    return null;
  }
  const sep = decoded.indexOf(':');
  const token = sep >= 0 ? decoded.slice(sep + 1) : decoded;
  if (!TOKEN_RE.test(token)) return null;
  const meta = await env.TRACKER.get(metaKey(token));
  return meta ? token : null;
}

// 추적 데이터 읽기 — 신규 키(t:<id>) 우선, 없으면 구 평면 키로 폴백.
// 이미 발송된 메일의 픽셀이 깨지지 않도록 한동안 유지한다.
export async function readTracker(env, id) {
  const fresh = await env.TRACKER.get(dataKey(id), 'json');
  if (fresh) return { data: fresh, key: dataKey(id) };
  const legacy = await env.TRACKER.get(id, 'json');
  if (legacy) return { data: legacy, key: id };
  return { data: null, key: dataKey(id) };
}

export function requireAuth() {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Mail Tracker"' },
  });
}

export function requireAuthCors() {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Mail Tracker"',
      ...CORS_HEADERS,
    },
  });
}

export function servePixel() {
  return new Response(PIXEL, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  });
}

export function html(content) {
  return new Response(content, { headers: { 'Content-Type': 'text/html' } });
}

export function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

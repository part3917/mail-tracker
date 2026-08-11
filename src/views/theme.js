// 세 화면(dashboard · detail · admin)이 공유하는 테마.
// 저장값이 없으면 OS 설정을 따르고, 토글을 누르면 그때부터 선택이 이긴다.

export const THEME_LIGHT_CSS = `
  :root[data-theme="light"] {
    --bg: #fbfbfc; --surface: #ffffff; --surface-2: #f4f4f6;
    --border: #e5e5ea; --border-hover: #c8c8d0;
    --text: #18181b; --text-2: #52525b; --text-3: #8b8b93;
    --accent: #4f46e5; --accent-glow: rgba(79,70,229,0.12);
    --green: #059669; --green-dim: rgba(5,150,105,0.10);
    --amber: #b45309; --amber-dim: rgba(180,83,9,0.09);
    --red: #dc2626; --red-dim: rgba(220,38,38,0.09);
    --blue: #4f46e5; --blue-dim: rgba(79,70,229,0.10);
  }
  .theme-btn {
    position: fixed; top: 12px; right: 20px; z-index: 60;
    width: 44px; height: 44px; display: inline-flex;
    align-items: center; justify-content: center;
    border: 1px solid var(--border); border-radius: 12px;
    background: var(--surface); color: var(--text-2);
    cursor: pointer; transition: color .15s, border-color .15s, background .15s;
  }
  .theme-btn:hover {
    color: var(--text); border-color: var(--border-hover);
    background: var(--surface-2);
  }
  .theme-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .theme-btn svg { width: 22px; height: 22px; display: block; }
  /* 상단바가 있는 화면에서는 그 안에 얹힌 것처럼 보이게 */
  .top-bar ~ .theme-btn, body > .theme-btn { top: 6px; }
  @media (max-width: 640px) { .theme-btn { top: 8px; right: 12px; width: 40px; height: 40px; } }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

export const THEME_BUTTON_HTML = `
  <button class="theme-btn" id="theme-btn" aria-label="Switch theme" title="Switch theme">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <g id="ic-moon"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></g>
      <g id="ic-sun" style="display:none"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M4.3 4.3l1.6 1.6M18.1 18.1l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.3 19.7l1.6-1.6M18.1 5.9l1.6-1.6"/></g>
    </svg>
  </button>`;

export const THEME_SCRIPT = `
<script>
(function () {
  var KEY = 'mt-theme';
  function paint(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    var moon = document.getElementById('ic-moon');
    var sun = document.getElementById('ic-sun');
    var dark = mode === 'dark';
    if (moon) moon.style.display = dark ? '' : 'none';
    if (sun) sun.style.display = dark ? 'none' : '';
  }
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  paint(saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('#theme-btn')) return;
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    paint(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
  });
})();
</script>`;

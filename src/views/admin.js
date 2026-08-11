import { esc } from '../shared.js';
import { THEME_LIGHT_CSS, THEME_BUTTON_HTML, THEME_SCRIPT } from './theme.js';

export function renderAdmin(users) {
  const rows = users.map((u) => `
    <tr>
      <td class="name">${esc(u.name || '(no name)')}</td>
      <td class="tok"><code>${esc(u.token)}</code></td>
      <td class="when">${u.createdAt ? esc(new Date(u.createdAt).toLocaleDateString()) : '—'}</td>
      <td class="act">${u.admin ? '<span class="badge">admin</span>' : `<button class="revoke" data-token="${esc(u.token)}">Revoke</button>`}</td>
    </tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>Access tokens</title>
<style>
  :root{--bg:#09090b;--surface:#18181b;--surface-2:#1f1f23;--border:#27272a;--border-hover:#3f3f46;--text:#fafafa;--text-2:#a1a1aa;--text-3:#71717a;--accent:#6366f1;--green:#34d399;--red:#f87171;--mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,monospace}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--text);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:40px 24px}
  .wrap{max-width:760px;margin:0 auto}
  h1{font-size:19px;font-weight:600;letter-spacing:-.01em}
  .sub{color:var(--text-3);font-size:12.5px;margin-top:5px}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:12px;margin-top:22px;overflow:hidden}
  .issue{display:flex;gap:8px;padding:16px}
  input{flex:1;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);
        padding:9px 11px;font:13px var(--mono)}
  input:focus{outline:none;border-color:var(--accent)}
  button{background:var(--accent);color:#fff;border:none;border-radius:8px;padding:9px 15px;
         font-size:13px;font-weight:600;cursor:pointer}
  button:hover{filter:brightness(1.08)}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--text-3);
     padding:11px 16px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);font-weight:600}
  td{padding:12px 16px;border-bottom:1px solid var(--border);font-size:13px;vertical-align:middle}
  tr:last-child td{border-bottom:none}
  .tok code{font:12px var(--mono);color:var(--text-2);cursor:pointer}
  .tok code:hover{color:var(--green)}
  .when{color:var(--text-3);font:12px var(--mono)}
  .badge{font-size:10px;font-weight:600;color:var(--accent);background:rgba(99,102,241,.12);
         padding:3px 8px;border-radius:999px}
  .revoke{background:transparent;color:var(--text-3);border:1px solid var(--border);padding:5px 11px;font-size:12px}
  .revoke:hover{color:var(--red);border-color:rgba(248,113,113,.4)}
  .new{margin:16px;padding:13px 15px;border-radius:9px;background:rgba(52,211,153,.10);
       border:1px solid rgba(52,211,153,.3);display:none}
  .new .lbl{font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:var(--green);font-weight:600}
  .new code{display:block;margin-top:6px;font:14px var(--mono);color:var(--text);word-break:break-all}
  .hint{color:var(--text-3);font-size:11.5px;margin-top:14px;line-height:1.6}
${THEME_LIGHT_CSS}
</style></head><body>${THEME_BUTTON_HTML}<div class="wrap">
  <h1>Access tokens</h1>
  <div class="sub">Each token sees only its own tracking records. Hand one to each person.</div>

  <div class="card">
    <form class="issue" id="issue">
      <input id="name" placeholder="Who is this for?" autocomplete="off" required />
      <button type="submit">Issue token</button>
    </form>
    <div class="new" id="new"><div class="lbl">New token — copy it now</div><code id="newtok"></code></div>
    <table>
      <thead><tr><th>Name</th><th>Token</th><th>Issued</th><th></th></tr></thead>
      <tbody id="rows">${rows || '<tr><td colspan="4" style="color:var(--text-3)">No tokens yet</td></tr>'}</tbody>
    </table>
  </div>
  <div class="hint">Click a token to copy it. Revoking locks the person out immediately; their recorded activity stays until deleted.</div>
</div>
<script>
document.getElementById('issue').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  if (!name) return;
  const res = await fetch('/admin/users', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) { alert('Could not issue token: ' + res.status); return; }
  const data = await res.json();
  document.getElementById('newtok').textContent = data.token;
  document.getElementById('new').style.display = 'block';
  document.getElementById('name').value = '';
  setTimeout(() => location.reload(), 1200);
});
document.addEventListener('click', async (e) => {
  const code = e.target.closest('.tok code');
  if (code) { navigator.clipboard.writeText(code.textContent); code.style.color = '#34d399'; return; }
  const btn = e.target.closest('.revoke');
  if (!btn) return;
  if (!confirm('Revoke this token? The person loses access immediately.')) return;
  const res = await fetch('/admin/users/' + encodeURIComponent(btn.dataset.token), { method: 'DELETE' });
  if (res.ok) location.reload(); else alert('Could not revoke: ' + res.status);
});
</script>${THEME_SCRIPT}</body></html>`;
}

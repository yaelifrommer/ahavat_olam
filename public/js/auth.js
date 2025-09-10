// /public/js/auth.js

async function postJSON(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.json = json;
    throw err;
  }
  return json;
}

// עם טעינת הדף: בדיקה אם כבר מחוברים
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const r = await fetch('/api/auth/protected-check', {
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });
    const j = await r.json().catch(() => null);
    if (j?.ok) {
      window.setCandidatesEnabled?.(true);
    } else {
      window.setCandidatesEnabled?.(false);
    }
  } catch {
    window.setCandidatesEnabled?.(false);
  }
});

const sendBtn   = document.getElementById('send');
const verifyBtn = document.getElementById('verify');
const emailEl   = document.getElementById('email');
const codeEl    = document.getElementById('code');

if (sendBtn) {
  sendBtn.addEventListener('click', async () => {
    const el = document.getElementById('sendMsg');
    if (!emailEl || !el) return;
    const email = emailEl.value.trim();
    el.textContent = 'שולח...';
    try {
      await postJSON('/api/auth/request-code', { email });
      el.textContent = 'הקוד נשלח למייל שהזנת.';
    } catch (e) {
      el.textContent = 'שגיאה: ' + (e.json?.error || e.message);
    }
  });
}

if (verifyBtn) {
  verifyBtn.addEventListener('click', async () => {
    const el = document.getElementById('verifyMsg');
    if (!emailEl || !codeEl || !el) return;
    const email = emailEl.value.trim();
    const code  = codeEl.value.trim();
    el.textContent = 'בודק...';
    try {
      await postJSON('/api/auth/verify-code', { email, code });
      el.textContent = 'מחובר ✅';
      window.setCandidatesEnabled?.(true);
      // מעבר לרשימת המועמדים
      const href = document.getElementById('candidatesLink')?.dataset?.href || '/candidates';
      window.location.assign(href);
    } catch (e) {
      el.textContent = 'שגיאה: ' + (e.json?.error || e.message);
      window.setCandidatesEnabled?.(false);
    }
  });
}

// כפתור בדיקה אופציונלי
const checkBtn = document.getElementById('check');
if (checkBtn) {
  checkBtn.addEventListener('click', async () => {
    const out = document.getElementById('checkOut');
    if (!out) return;
    out.textContent = 'בודק...';
    try {
      const res = await fetch('/api/auth/protected-check', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      const j = await res.json();
      out.textContent = JSON.stringify(j, null, 2);
    } catch (e) {
      out.textContent = 'שגיאה: ' + e.message;
    }
  });
}

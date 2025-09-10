async function postJSON(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error || 'HTTP ' + res.status), { status: res.status, json });
  return json;
}

// עם טעינת הדף: בדיקה אם כבר מחובר (לפתוח/לסגור כפתור בהתאם)
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const r = await fetch('/api/auth/protected-check', { credentials: 'include' });
    const j = await r.json();
    if (j?.ok) {
      window.setCandidatesEnabled?.(true);
    } else {
      window.setCandidatesEnabled?.(false);
    }
  } catch {
    window.setCandidatesEnabled?.(false);
  }
});

document.getElementById('send').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const el = document.getElementById('sendMsg');
  el.textContent = 'שולח...';
  try {
    await postJSON('/api/auth/request-code', { email });
    el.textContent = 'הקוד נשלח למייל שהזנת.';
  } catch (e) {
    el.textContent = 'שגיאה: ' + (e.json?.error || e.message);
  }
});

document.getElementById('verify').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const code = document.getElementById('code').value.trim();
  const el = document.getElementById('verifyMsg');
  el.textContent = 'בודק...';
  try {
    const resp = await postJSON('/api/auth/verify-code', { email, code });
    el.textContent = 'מחובר ✅';
    window.setCandidatesEnabled?.(true);   // מאפשר את הכפתור

    // ⬅️ הוספה קטנה: מעבר אוטומטי לרשימת המועמדים
    const href = document.getElementById('candidatesLink')?.dataset?.href || '/candidates';
    window.location.assign(href);
  } catch (e) {
    el.textContent = 'שגיאה: ' + (e.json?.error || e.message);
    window.setCandidatesEnabled?.(false);  // נשאר חסום
  }
});

document.getElementById('check').addEventListener('click', async () => {
  const out = document.getElementById('checkOut');
  out.textContent = 'בודק...';
  try {
    const res = await fetch('/api/auth/protected-check', { credentials: 'include' });
    const j = await res.json();
    out.textContent = JSON.stringify(j, null, 2);
  } catch (e) {
    out.textContent = 'שגיאה: ' + e.message;
  }
});

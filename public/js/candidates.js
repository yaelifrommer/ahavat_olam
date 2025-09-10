// public/js/candidates.js
async function loadCandidates() {
  try {
    const res = await fetch('/api/candidates', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include' // חשוב: שולח את ה-cookie של ההתחברות
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Failed to load candidates:', res.status, text);
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json(); // כאן בטוח JSON
    const rows = Array.isArray(json?.data) ? json.data : [];

    // שליחה ל-filters.js שמאזין ל-candidates:data
    window.dispatchEvent(new CustomEvent('candidates:data', { detail: rows }));
  } catch (err) {
    console.error('Failed to load candidates:', err);
    const stats = document.getElementById('stats');
    if (stats) stats.textContent = 'שגיאה בטעינת הנתונים';
  }
}

// טוענים עם עליית הדף
document.addEventListener('DOMContentLoaded', loadCandidates);

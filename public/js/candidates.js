// public/js/candidates.js
async function loadCandidates() {
    try {
      const res = await fetch('/api/candidates', { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
  
      // השרת מחזיר { ok, stale?, count, data }
      const rows = Array.isArray(json?.data) ? json.data : [];
      // שליחה ל-filters.js שמאזין ל-candidates:data
      window.dispatchEvent(new CustomEvent('candidates:data', { detail: rows }));
    } catch (err) {
      console.error('Failed to load candidates:', err);
      // נעדכן מונה בסיסי למקרה של תקלה
      const stats = document.getElementById('stats');
      if (stats) stats.textContent = 'שגיאה בטעינת הנתונים';
    }
  }
  
  // טוענים עם עליית הדף
  document.addEventListener('DOMContentLoaded', loadCandidates);
  
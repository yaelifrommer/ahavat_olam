// /public/js/candidates-page.js
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-select-all],[data-clear-all]');
      if (!btn) return;
      const key = btn.getAttribute('data-select-all') || btn.getAttribute('data-clear-all');
      const check = btn.hasAttribute('data-select-all');
      document
        .querySelectorAll(`input[type="checkbox"][data-multi="${key}"]`)
        .forEach(cb => { cb.checked = check; });
    });
  });
  
// middleware/authRequired.js
import { getSessionEmail } from '../services/otpStore.js';

export function authRequired(req, res, next) {
  const token = req.signedCookies?.session_token;
  const email = token ? getSessionEmail(token) : null;

  if (!email) {
    const url = req.originalUrl || req.url || '';
    // בקשות API יקבלו 401 JSON, ניווט דפדפן יקבל redirect ל-login
    if (url.startsWith('/api/')) {
      return res.status(401).json({ ok: false, error: 'לא מחובר' });
    }
    return res.redirect('/login.html');
  }

  req.user = { email };
  next();
}

import { getSessionEmail } from '../services/otpStore.js';

export function authRequired(req, res, next) {
  // קוראים את ה-cookie החתום
  const token = req.signedCookies?.session_token;
  const email = token ? getSessionEmail(token) : null;

  if (!email) {
    // לניווט דפדפן נחזיר redirect, ל-API נחזיר JSON 401
    if (req.accepts('html')) return res.redirect('/login.html');
    return res.status(401).json({ ok: false, error: 'לא מחובר' });
  }

  req.user = { email };
  next();
}

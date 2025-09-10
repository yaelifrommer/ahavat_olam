import express from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { issueOtp, verifyOtp, destroySession, getSessionEmail } from '../services/otpStore.js';
import { sendLoginCode } from '../services/mailer.js';

const router = express.Router();

const emailSchema = z.object({ email: z.string().email() });
const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/)
});

// הגבלות קצב נקודתיות (מומלץ)
const requestCodeLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 8,
  message: { ok: false, error: 'יותר מדי בקשות. נסי שוב בעוד רגע.' }
});

const verifyCodeLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 12,
  message: { ok: false, error: 'יותר מדי ניסיונות אימות. נסי שוב בעוד רגע.' }
});

router.post('/request-code', requestCodeLimiter, async (req, res, next) => {
  try {
    const { email } = emailSchema.parse(req.body);

    const allowAll = String(process.env.ALLOW_ALL_EMAILS || 'false').toLowerCase() === 'true';
    if (!allowAll) {
      const { isEmailAllowed } = await import('../services/sheets.js');
      const allowed = await isEmailAllowed(email);
      if (!allowed) return res.status(403).json({ ok: false, error: 'אימייל לא מורשה' });
    }

    const { code, expiresAt } = await issueOtp(email);
    await sendLoginCode(email, code, expiresAt);

    res.json({ ok: true, message: 'קוד נשלח במייל (אם האימייל מורשה).' });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ ok: false, error: 'ולידציה נכשלה' });
    next(err);
  }
});

router.post('/verify-code', verifyCodeLimiter, async (req, res, next) => {
  try {
    const { email, code } = verifySchema.parse(req.body);
    const { sessionToken } = await verifyOtp(email, code);

    const crossSite = String(process.env.CROSS_SITE || 'false').toLowerCase() === 'true';
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: crossSite || (process.env.NODE_ENV === 'production'),
      sameSite: crossSite ? 'none' : 'lax',
      maxAge: 12 * 60 * 60 * 1000,
      path: '/',
      signed: true // 👈 cookie חתום
    });

    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'LOCKED') return res.status(429).json({ ok: false, error: 'ננעל זמנית עקב ניסיונות כושלים' });
    if (err.code === 'INVALID') return res.status(401).json({ ok: false, error: 'קוד שגוי או שפג תוקפו' });
    if (err instanceof z.ZodError) return res.status(400).json({ ok: false, error: 'ולידציה נכשלה' });
    next(err);
  }
});

router.post('/logout', async (req, res) => {
  const token = req.signedCookies?.session_token || req.cookies?.session_token;
  if (token) await destroySession(token);
  res.clearCookie('session_token', { path: '/' });
  res.json({ ok: true });
});

router.get('/protected-check', (req, res) => {
  const token = req.signedCookies?.session_token || req.cookies?.session_token;
  const email = token ? getSessionEmail(token) : null;
  if (!email) return res.status(401).json({ ok: false });
  res.json({ ok: true, email });
});

export default router;

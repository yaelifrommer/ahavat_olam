// services/otpStore.js
import crypto from 'crypto';
import argon2 from 'argon2';

const OTP_TTL_MS   = 10 * 60 * 1000;      // 10 דקות
const MAX_ATTEMPTS = 5;
const LOCK_MS      = 15 * 60 * 1000;      // 15 דקות
const SESSION_HOURS = 12;                 // תוקף סשן

// OTP בזיכרון (בסדר לרוב; אם תרצי גם אותו חסר־מצב—נוסיף בהמשך)
const otps = new Map(); // email -> { hash, exp, tries, lockUntil }

const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-please';
const now = () => Date.now();

// ===== JWT-קליל חתום ב-HMAC (Stateless) =====
function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function signSession(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = b64url(JSON.stringify(payload));
  const data   = `${header}.${body}`;
  const sig    = b64url(crypto.createHmac('sha256', SESSION_SECRET).update(data).digest());
  return `${data}.${sig}`;
}
function verifySession(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  const expected = b64url(crypto.createHmac('sha256', SESSION_SECRET).update(`${h}.${b}`).digest());
  if (s !== expected) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(b.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString());
  } catch {
    return null;
  }
  if (!payload?.email) return null;
  if (payload.exp && payload.exp < Math.floor(now() / 1000)) return null;
  return payload;
}

// ===== OTP =====
export async function issueOtp(email) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = await argon2.hash(code);
  otps.set(email.toLowerCase(), { hash, exp: now() + OTP_TTL_MS, tries: 0, lockUntil: 0 });
  return { code, expiresAt: new Date(now() + OTP_TTL_MS) };
}

export async function verifyOtp(email, code) {
  const key = email.toLowerCase();
  const rec = otps.get(key);
  const t   = now();

  if (!rec) {
    throw Object.assign(new Error('INVALID'), { code: 'INVALID' });
  }
  if (rec.lockUntil && t < rec.lockUntil) {
    throw Object.assign(new Error('LOCKED'), { code: 'LOCKED' });
  }
  if (t > rec.exp) {
    otps.delete(key);
    throw Object.assign(new Error('INVALID'), { code: 'INVALID' });
  }

  const ok = await argon2.verify(rec.hash, code);
  if (!ok) {
    rec.tries = (rec.tries || 0) + 1;
    if (rec.tries >= MAX_ATTEMPTS) rec.lockUntil = t + LOCK_MS;
    throw Object.assign(new Error('INVALID'), { code: rec.lockUntil ? 'LOCKED' : 'INVALID' });
  }

  // הצלחה: מחיקה מה-OTP והנפקת טוקן סשן חתום (Stateless)
  otps.delete(key);
  const sessionToken = signSession({
    email: key,
    exp: Math.floor(t / 1000) + SESSION_HOURS * 60 * 60
  });
  return { sessionToken };
}

export async function destroySession(_token) {
  // Stateless – אין מה למחוק בצד השרת. ניקוי נעשה בצד הלקוח ע"י clearCookie.
  return;
}

export function getSessionEmail(token) {
  const p = verifySession(token);
  return p ? p.email : null;
}

// services/otpStore.js
import crypto from 'crypto';

const OTP_TTL_MS    = 10 * 60 * 1000;  // 10m
const MAX_ATTEMPTS  = 5;
const LOCK_MS       = 15 * 60 * 1000;  // 15m
const SESSION_HOURS = 12;

const SECRET = process.env.SESSION_SECRET || 'change-me-please'; // גם ל-HMAC וגם לסשן

// OTP בזיכרון
const otps = new Map(); // email -> { digest, exp, tries, lockUntil }

const now = () => Date.now();

// --- HMAC helper ---
function hmac(text) {
  return crypto.createHmac('sha256', SECRET).update(String(text)).digest('hex');
}

// --- Stateless Session (JWT קליל חתום ב-HMAC) ---
function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function signSession(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = b64url(JSON.stringify(payload));
  const data   = `${header}.${body}`;
  const sig    = b64url(crypto.createHmac('sha256', SECRET).update(data).digest());
  return `${data}.${sig}`;
}
function verifySession(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  const expected = b64url(crypto.createHmac('sha256', SECRET).update(`${h}.${b}`).digest());
  if (s !== expected) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(b.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString());
  } catch { return null; }
  if (!payload?.email) return null;
  if (payload.exp && payload.exp < Math.floor(now()/1000)) return null;
  return payload;
}

export async function issueOtp(email) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const digest = hmac(code);
  otps.set(email.toLowerCase(), { digest, exp: now() + OTP_TTL_MS, tries: 0, lockUntil: 0 });
  return { code, expiresAt: new Date(now() + OTP_TTL_MS) };
}

export async function verifyOtp(email, code) {
  const key = email.toLowerCase();
  const rec = otps.get(key);
  const t   = now();

  if (!rec)                          throw Object.assign(new Error('INVALID'), { code: 'INVALID' });
  if (rec.lockUntil && t < rec.lockUntil) throw Object.assign(new Error('LOCKED'),  { code: 'LOCKED' });
  if (t > rec.exp) { otps.delete(key); throw Object.assign(new Error('INVALID'), { code: 'INVALID' }); }

  const ok = crypto.timingSafeEqual(Buffer.from(rec.digest), Buffer.from(hmac(code)));
  if (!ok) {
    rec.tries = (rec.tries || 0) + 1;
    if (rec.tries >= MAX_ATTEMPTS) rec.lockUntil = t + LOCK_MS;
    throw Object.assign(new Error('INVALID'), { code: rec.lockUntil ? 'LOCKED' : 'INVALID' });
  }

  otps.delete(key);
  const sessionToken = signSession({ email: key, exp: Math.floor(t/1000) + SESSION_HOURS*60*60 });
  return { sessionToken };
}

export async function destroySession(_token) { /* stateless */ }

export function getSessionEmail(token) {
  const p = verifySession(token);
  return p ? p.email : null;
}

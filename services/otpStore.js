import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

const otpMap = new Map(); // email -> { hash, expiresAt, attempts, lockedUntil }
const sessionMap = new Map(); // token -> { email, expiresAt }

const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

function now() { return Date.now(); }

export async function issueOtp(email) {
  // 6-digit numeric code
  const code = (Math.floor(100000 + Math.random() * 900000)).toString();
  const hash = await argon2.hash(code);
  const expiresAt = now() + OTP_TTL_MS;
  otpMap.set(email.toLowerCase(), { hash, expiresAt, attempts: 0, lockedUntil: 0 });
  return { code, expiresAt };
}

export async function verifyOtp(email, code) {
  const key = email.toLowerCase();
  const entry = otpMap.get(key);
  if (!entry) throw Object.assign(new Error('No OTP'), { code: 'INVALID' });

  if (entry.lockedUntil && entry.lockedUntil > now()) {
    throw Object.assign(new Error('Locked'), { code: 'LOCKED' });
  }
  if (entry.expiresAt < now()) {
    otpMap.delete(key);
    throw Object.assign(new Error('Expired'), { code: 'INVALID' });
  }
  const ok = await argon2.verify(entry.hash, code);
  if (!ok) {
    entry.attempts += 1;
    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.lockedUntil = now() + LOCK_MS;
    }
    throw Object.assign(new Error('Invalid'), { code: entry.lockedUntil ? 'LOCKED' : 'INVALID' });
  }

  // Success: create session
  otpMap.delete(key);
  const sessionToken = uuidv4();
  sessionMap.set(sessionToken, { email: key, expiresAt: now() + SESSION_TTL_MS });
  return { sessionToken };
}

export async function destroySession(token) {
  sessionMap.delete(token);
}

export function getSessionEmail(token) {
  const s = sessionMap.get(token);
  if (!s) return null;
  if (s.expiresAt < now()) {
    sessionMap.delete(token);
    return null;
  }
  return s.email;
}
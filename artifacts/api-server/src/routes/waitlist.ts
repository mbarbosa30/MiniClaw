import { Router } from 'express';
import { db, waitlistEmailsTable } from '@workspace/db';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ipHits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

router.post('/waitlist', async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';

  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return;
  }

  const { email } = req.body as { email?: unknown };

  if (typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  const trimmed = email.trim().toLowerCase();

  if (!EMAIL_RE.test(trimmed)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  try {
    await db.insert(waitlistEmailsTable).values({ email: trimmed }).onConflictDoNothing();
    res.json({ ok: true });
  } catch (err) {
    console.error('[waitlist] db error:', err);
    res.status(500).json({ error: 'Failed to save. Please try again.' });
  }
});

export default router;

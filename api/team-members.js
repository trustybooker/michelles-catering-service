import { neon } from '@neondatabase/serverless';
import { createHmac, timingSafeEqual } from 'node:crypto';

const ownerSession = (req) => {
  const token = String(req.headers.cookie || '').match(/michelle_admin=([^;]+)/)?.[1];
  if (!token || !process.env.ADMIN_SESSION_SECRET) return false;
  const [email, expiry, sig] = token.split('.');
  const payload = `${email}.${expiry}`;
  const expected = createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('hex');
  try { return email.trim().toLowerCase() === String(process.env.ADMIN_EMAIL || '').trim().toLowerCase() && Number(expiry) > Date.now() && sig?.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); } catch { return false; }
};

const cleanEmail = (value) => String(value || '').trim().toLowerCase();
const cleanRole = (value) => ['manager', 'viewer'].includes(String(value || '').toLowerCase()) ? String(value).toLowerCase() : null;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!ownerSession(req)) return res.status(401).json({ error: 'Owner sign-in required' });
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'Database is not configured' });
  const db = neon(process.env.DATABASE_URL);
  try {
    await db`CREATE TABLE IF NOT EXISTS team_members (email TEXT PRIMARY KEY, role TEXT NOT NULL CHECK (role IN ('manager','viewer')), active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    if (req.method === 'GET') return res.status(200).json({ members: await db`SELECT email, role, active, created_at, updated_at FROM team_members ORDER BY email` });
    if (req.method === 'POST') {
      const email = cleanEmail(req.body?.email), role = cleanRole(req.body?.role);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !role || email === String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()) return res.status(400).json({ error: 'Enter a valid non-owner email and role' });
      await db`INSERT INTO team_members (email,role,active,updated_at) VALUES (${email},${role},TRUE,now()) ON CONFLICT (email) DO UPDATE SET role=excluded.role,active=TRUE,updated_at=now()`;
      return res.status(200).json({ ok: true, email, role });
    }
    if (req.method === 'DELETE') {
      const email = cleanEmail(req.body?.email);
      if (!email) return res.status(400).json({ error: 'Email is required' });
      await db`UPDATE team_members SET active=FALSE,updated_at=now() WHERE email=${email}`;
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) { console.error('Team member operation failed', error); return res.status(503).json({ error: 'Team member service unavailable' }); }
}

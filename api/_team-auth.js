import { neon } from '@neondatabase/serverless';
import { createHmac, timingSafeEqual } from 'node:crypto';

export async function sessionRole(req) {
  const token = String(req.headers.cookie || '').match(/michelle_admin=([^;]+)/)?.[1];
  if (!token || !process.env.ADMIN_SESSION_SECRET) return null;
  const end = token.lastIndexOf('.'), middle = token.lastIndexOf('.', end - 1);
  const email = middle > 0 ? token.slice(0, middle) : '', expiry = middle > 0 ? token.slice(middle + 1, end) : '', sig = end > middle ? token.slice(end + 1) : '';
  const payload = `${email}.${expiry}`;
  const expected = createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('hex');
  try {
    if (sig?.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) || Number(expiry) <= Date.now()) return null;
    const normalized = email.trim().toLowerCase();
    if (normalized === String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()) return 'owner';
    if (!process.env.DATABASE_URL) return null;
    const rows = await neon(process.env.DATABASE_URL)`SELECT role FROM team_members WHERE email=${normalized} AND active=TRUE LIMIT 1`;
    return rows[0]?.role || null;
  } catch { return null; }
}

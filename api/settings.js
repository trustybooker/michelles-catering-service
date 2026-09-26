import { neon } from '@neondatabase/serverless';
import { createHmac, timingSafeEqual } from 'node:crypto';
const sql = () => neon(process.env.DATABASE_URL);
const allowed = new Set(['businessName','tagline','heroMessage','phone','serviceArea','zelle','cashapp','paymentNote','instagram','facebook','tiktok','broadcastFrom','inquiryTo','resendFrom','bookingStatus','broadcastStatus','primaryColor','accentColor','classicsPrice','celebrationPrice','officePrice','sweetsPrice','classicsDescription','celebrationDescription','officeDescription','sweetsDescription']);
const cleanSettings = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const output = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!allowed.has(key) || typeof raw !== 'string') continue;
    const value = raw.trim();
    if (value.length <= 1000) output[key] = value;
  }
  return output;
};
const valid = (req) => { const token = String(req.headers.cookie || '').match(/michelle_admin=([^;]+)/)?.[1]; if (!token || !process.env.ADMIN_SESSION_SECRET) return false; const [email, expiry, sig] = token.split('.'); const payload = `${email}.${expiry}`; const expected = createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('hex'); if (!sig || sig.length !== expected.length) return false; try { return email === process.env.ADMIN_EMAIL && Number(expiry) > Date.now() && timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); } catch { return false; } };
export default async function handler(req, res) { res.setHeader('Cache-Control','no-store'); if (!valid(req)) return res.status(401).json({ error:'Owner sign-in required' }); try { const db = sql(); if (req.method === 'GET') { const rows = await db`SELECT settings FROM site_settings WHERE id=1`; return res.status(200).json(rows[0]?.settings || {}); } if (req.method === 'PUT') { const settings = cleanSettings(req.body); if (!settings) return res.status(400).json({ error:'Settings must be a JSON object' }); const serialized = JSON.stringify(settings); if (serialized.length > 20000) return res.status(413).json({ error:'Settings payload is too large' }); await db`INSERT INTO site_settings (id,settings,updated_at) VALUES (1,${serialized}::jsonb,now()) ON CONFLICT (id) DO UPDATE SET settings=excluded.settings,updated_at=now()`; return res.status(200).json({ ok:true }); } res.setHeader('Allow','GET, PUT'); return res.status(405).json({ error:'Method not allowed' }); } catch (error) { console.error('Settings API failure', error); return res.status(503).json({ error:'Settings service unavailable' }); } }

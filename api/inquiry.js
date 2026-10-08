import { neon } from '@neondatabase/serverless';
const attempts = new Map();
const eventTypes = new Set(['Wedding', 'Birthday or celebration', 'Corporate or office event', 'Family reunion', 'Private dinner', 'Other']);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const json = (res, status, body) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); return res.status(status).json(body); };
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { error: 'Method not allowed' }); }
  if (!String(req.headers['content-type'] || '').toLowerCase().includes('application/json')) return json(res, 415, { error: 'JSON is required' });
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim().slice(0, 80);
  const now = Date.now(); const recent = (attempts.get(ip) || []).filter(time => now - time < 60_000);
  if (recent.length >= 5) return json(res, 429, { error: 'Please wait a moment before sending another inquiry' });
  recent.push(now); attempts.set(ip, recent); if (attempts.size > 2000) attempts.delete(attempts.keys().next().value);
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { name, email, date, guests, eventType, message = '', website = '' } = body;
  if (website) return json(res, 400, { error: 'Invalid inquiry' });
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 120 || typeof email !== 'string' || !emailPattern.test(email) || email.length > 254 || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Date.parse(`${date}T23:59:59`) < Date.now() || !eventTypes.has(eventType) || !Number.isInteger(Number(guests)) || Number(guests) < 1 || Number(guests) > 1000 || typeof message !== 'string' || message.length > 2000) return json(res, 400, { error: 'Missing or invalid event details' });
  if (!process.env.RESEND_API_KEY || !process.env.INQUIRY_TO_EMAIL) return json(res, 503, { error: 'Email service is not configured' });
  const safe = value => String(value).slice(0, 2000).replace(/[&<>\"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char]));
  const subject = `New catering inquiry — ${safe(eventType)} — ${safe(date)}`;
  const text = `New Michelle's Catering inquiry\n\nName: ${name}\nEmail: ${email}\nDate: ${date}\nGuests: ${guests}\nEvent: ${eventType}\nDetails: ${message || 'None provided'}`;
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f5efe7;color:#22302d;font-family:Arial,sans-serif"><div style="max-width:640px;margin:24px auto;padding:8px"><div style="background:#173b35;padding:24px 28px;border-radius:18px 18px 0 0"><div style="color:#f4c26b;font-size:12px;letter-spacing:2px;text-transform:uppercase">Michelle's Catering Service</div><h1 style="color:#fff;margin:10px 0 0;font-family:Georgia,serif;font-size:30px">New event inquiry</h1></div><div style="background:#fff;padding:28px;border-radius:0 0 18px 18px"><p><strong>Name:</strong> ${safe(name)}</p><p><strong>Email:</strong> <a href="mailto:${safe(email)}">${safe(email)}</a></p><p><strong>Date:</strong> ${safe(date)}</p><p><strong>Guests:</strong> ${safe(guests)}</p><p><strong>Event:</strong> ${safe(eventType)}</p><p><strong>Details:</strong><br>${safe(message || 'None provided').replace(/\n/g, '<br>')}</p><hr style="border:0;border-top:1px solid #eadfd2"><p style="color:#667;font-size:12px">Sent from Michelle's Catering Service · Port St. Lucie, Florida · (772) 282-3269</p></div></div></body></html>`;
  if (!process.env.DATABASE_URL) return json(res, 503, { error: 'Inquiry database is not configured' });
  try { const sql = neon(process.env.DATABASE_URL); await sql`CREATE TABLE IF NOT EXISTS inquiries (id BIGSERIAL PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,event_date DATE NOT NULL,guests INTEGER NOT NULL,event_type TEXT NOT NULL,message TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'new',created_at TIMESTAMPTZ NOT NULL DEFAULT now())`; await sql`INSERT INTO inquiries (name, email, event_date, guests, event_type, message) VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${date}, ${Number(guests)}, ${eventType}, ${message.trim()})`; } catch (error) { console.error('Inquiry database persistence failed', error); return json(res, 503, { error: 'Inquiry service unavailable' }); }
  let response;
  const configuredFrom = String(process.env.RESEND_FROM_EMAIL || '').trim();
  const from = /@fifynowllc\.com(?:>|$)/i.test(configuredFrom) ? configuredFrom : "Michelle's Catering <noreply@fifynowllc.com>";
  try { response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [process.env.INQUIRY_TO_EMAIL], reply_to: email, subject, html, text }) }); } catch (error) { return json(res, 502, { error: 'Email provider unavailable' }); }
  if (!response.ok) return json(res, 502, { error: 'Email provider rejected the request' });
  return json(res, 200, { ok: true });
}

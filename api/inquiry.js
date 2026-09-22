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
  if (!process.env.RESEND_API_KEY || !process.env.INQUIRY_TO_EMAIL || !process.env.RESEND_FROM_EMAIL) return json(res, 503, { error: 'Email service is not configured' });
  const safe = value => String(value).slice(0, 2000).replace(/[&<>\"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char]));
  const html = `<h2>New Michelle's Catering inquiry</h2><p><strong>Name:</strong> ${safe(name)}</p><p><strong>Email:</strong> ${safe(email)}</p><p><strong>Date:</strong> ${safe(date)}</p><p><strong>Guests:</strong> ${safe(guests)}</p><p><strong>Event:</strong> ${safe(eventType)}</p><p><strong>Details:</strong><br>${safe(message || 'None provided').replace(/\n/g, '<br>')}</p>`;
  if (process.env.DATABASE_URL) { try { const sql = neon(process.env.DATABASE_URL); await sql`INSERT INTO inquiries (name, email, event_date, guests, event_type, message) VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${date}, ${Number(guests)}, ${eventType}, ${message.trim()})`; } catch (error) { console.error('Inquiry database persistence failed', error); } }
  let response;
  try { response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [process.env.INQUIRY_TO_EMAIL], reply_to: email, subject: `New catering inquiry — ${safe(eventType)} — ${safe(date)}`, html }) }); } catch (error) { return json(res, 502, { error: 'Email provider unavailable' }); }
  if (!response.ok) return json(res, 502, { error: 'Email provider rejected the request' });
  return json(res, 200, { ok: true });
}

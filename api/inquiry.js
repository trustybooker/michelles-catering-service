export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, date, guests, eventType, message } = req.body || {};
  if (!name || !email || !date || !eventType || !Number.isInteger(Number(guests)) || Number(guests) < 1 || Number(guests) > 1000) return res.status(400).json({ error: 'Missing or invalid event details' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return res.status(400).json({ error: 'Invalid email address' });
  if (!process.env.RESEND_API_KEY || !process.env.INQUIRY_TO_EMAIL || !process.env.RESEND_FROM_EMAIL) return res.status(503).json({ error: 'Email service is not configured' });
  const safe = value => String(value).slice(0, 2000).replace(/[&<>\"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const html = `<h2>New Michelle's Catering inquiry</h2><p><strong>Name:</strong> ${safe(name)}</p><p><strong>Email:</strong> ${safe(email)}</p><p><strong>Date:</strong> ${safe(date)}</p><p><strong>Guests:</strong> ${safe(guests)}</p><p><strong>Event:</strong> ${safe(eventType)}</p><p><strong>Details:</strong><br>${safe(message || 'None provided').replace(/\n/g, '<br>')}</p>`;
  let response;
  try { response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [process.env.INQUIRY_TO_EMAIL], reply_to: email, subject: `New catering inquiry — ${safe(eventType)} — ${safe(date)}`, html }) }); } catch (error) { return res.status(502).json({ error: 'Email provider unavailable' }); }
  if (!response.ok) return res.status(502).json({ error: 'Email provider rejected the request' });
  return res.status(200).json({ ok: true });
}

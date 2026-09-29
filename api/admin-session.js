import { createHmac, timingSafeEqual } from 'node:crypto';

const OWNER_EMAIL = 'fifynow@gmail.com';

function decodeToken(value) {
  let decoded = String(value || '');
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const requestUrl = new URL(req.url || '/', 'https://michelles-catering-service.vercel.app');
  const queryToken = req.query?.token ?? req.query?.owner_token;
  const rawToken = Array.isArray(queryToken)
    ? queryToken[0]
    : (queryToken || requestUrl.searchParams.get('token') || requestUrl.searchParams.get('owner_token') || '');
  const token = decodeToken(rawToken);
  const lastDot = token.lastIndexOf('.');
  const beforeSignature = lastDot >= 0 ? token.slice(0, lastDot) : '';
  const secondLastDot = beforeSignature.lastIndexOf('.');
  const emailPart = secondLastDot >= 0 ? beforeSignature.slice(0, secondLastDot) : '';
  const expiry = secondLastDot >= 0 ? beforeSignature.slice(secondLastDot + 1) : '';
  const sig = lastDot >= 0 ? token.slice(lastDot + 1) : '';
  const email = decodeToken(emailPart).trim().toLowerCase();
  const reason = !email || !expiry || !sig
    ? 'missing-parts'
    : Number(expiry) < Date.now()
      ? 'expired'
      : !process.env.ADMIN_SESSION_SECRET
        ? 'missing-secret'
        : email !== OWNER_EMAIL
          ? 'owner-mismatch'
          : null;
  if (reason) {
    console.warn('Owner session rejected', reason);
    return res.status(401).json({ error: 'Invalid or expired owner link' });
  }
  const payload = emailPart + '.' + expiry;
  const expected = createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('hex');
  if (sig.length !== expected.length) {
    console.warn('Owner session rejected', 'signature-length');
    return res.status(401).json({ error: 'Invalid owner link' });
  }
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      console.warn('Owner session rejected', 'signature-mismatch');
      return res.status(401).json({ error: 'Invalid owner link' });
    }
  } catch {
    console.warn('Owner session rejected', 'signature-compare');
    return res.status(401).json({ error: 'Invalid owner link' });
  }
  res.setHeader('Set-Cookie', 'michelle_admin=' + token + '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800');
  return res.status(200).json({ ok: true });
}

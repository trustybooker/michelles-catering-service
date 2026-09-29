import { createHmac, timingSafeEqual } from 'node:crypto';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  const queryToken = req.query?.token;
  const token = String(Array.isArray(queryToken) ? queryToken[0] : (queryToken || new URL(req.url, 'https://michelles-catering-service.vercel.app').searchParams.get('token') || ''));
  const [email,expiry,sig]=token.split('.');
  const configuredOwner=String(process.env.ADMIN_EMAIL||'').trim().toLowerCase();
  const reason=!email||!expiry||!sig?'missing-parts':Number(expiry)<Date.now()?'expired':!process.env.ADMIN_SESSION_SECRET?'missing-secret':email.trim().toLowerCase()!==configuredOwner?'owner-mismatch':null;
  if(reason){ console.warn('Owner session rejected',reason); return res.status(401).json({error:'Invalid or expired owner link'}); }
  const payload=`${email}.${expiry}`;
  const expected=createHmac('sha256',process.env.ADMIN_SESSION_SECRET).update(payload).digest('hex');
  if(sig.length!==expected.length){ console.warn('Owner session rejected','signature-length'); return res.status(401).json({error:'Invalid owner link'}); }
  try { if(!timingSafeEqual(Buffer.from(sig),Buffer.from(expected))){ console.warn('Owner session rejected','signature-mismatch'); return res.status(401).json({error:'Invalid owner link'}); } } catch { console.warn('Owner session rejected','signature-compare'); return res.status(401).json({error:'Invalid owner link'}); }
  res.setHeader('Set-Cookie',`michelle_admin=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);
  return res.status(200).json({ok:true});
}

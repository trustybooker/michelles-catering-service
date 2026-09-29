import { createHmac } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
const esc=v=>String(v).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const email=String(req.body?.email||'').trim().toLowerCase(); let ok=email===String(process.env.ADMIN_EMAIL||'').trim().toLowerCase();
 if(!ok&&process.env.DATABASE_URL){const rows=await neon(process.env.DATABASE_URL)`SELECT role FROM team_members WHERE email=${email} AND active=TRUE LIMIT 1`;ok=rows.length>0;}
 if(!email||!ok)return res.status(200).json({ok:true}); if(!process.env.RESEND_API_KEY||!process.env.ADMIN_SESSION_SECRET)return res.status(503).json({error:'Email authentication is not configured'});
 const expiry=Date.now()+900000,payload=`${email}.${expiry}`,sig=createHmac('sha256',process.env.ADMIN_SESSION_SECRET).update(payload).digest('hex'),link=`${process.env.PUBLIC_SITE_URL||'https://michelles-catering-service.vercel.app'}/admin.html?owner_token=${encodeURIComponent(`${payload}.${sig}`)}`;
 const from=String(process.env.RESEND_FROM_EMAIL||'').trim()||"Michelle's Catering <noreply@fifynowllc.com>",html=`<div style="font-family:Arial;max-width:600px;margin:auto"><h1 style="background:#173b35;color:#fff;padding:24px">Michelle's Catering Service</h1><p>Use the secure link below to open the dashboard.</p><p><a href="${esc(link)}" style="background:#b44d2d;color:#fff;padding:14px 20px;border-radius:999px;text-decoration:none">Open dashboard ↗</a></p><p>This link expires in 15 minutes.</p></div>`;
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[email],reply_to:from,subject:"Michelle's Catering dashboard sign-in",html,text:`Open your secure dashboard: ${link}`})});
 if(!response.ok)return res.status(502).json({error:'Email provider rejected the request'}); return res.status(200).json({ok:true});
}

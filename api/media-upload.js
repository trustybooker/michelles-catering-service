import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';
import { sessionRole } from './_team-auth.js';
export default async function handler(req,res){
  const access=await sessionRole(req);if(!access)return res.status(401).json({error:'Admin sign-in required'});if(access==='viewer')return res.status(403).json({error:'Viewer access is read-only'});if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const data=String(req.body?.data||''),name=String(req.body?.name||'flyer').replace(/[^a-z0-9._-]/gi,'-').slice(0,80),match=data.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);if(!match)return res.status(400).json({error:'Upload a PNG, JPG, or WebP image'});const buffer=Buffer.from(match[2],'base64');if(buffer.length>8*1024*1024)return res.status(413).json({error:'Image must be 8 MB or smaller'});
  try{if(process.env.BLOB_READ_WRITE_TOKEN){const blob=await put(`michelle-catering/${Date.now()}-${name}`,buffer,{access:'public',contentType:match[1],addRandomSuffix:true});return res.status(200).json({ok:true,url:blob.url})}if(!process.env.DATABASE_URL)return res.status(503).json({error:'Media storage is not configured'});const sql=neon(process.env.DATABASE_URL),id=randomUUID();await sql`CREATE TABLE IF NOT EXISTS media_assets (id UUID PRIMARY KEY, filename TEXT NOT NULL, content_type TEXT NOT NULL, data BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;await sql`INSERT INTO media_assets (id,filename,content_type,data) VALUES (${id},${name},${match[1]},${buffer})`;return res.status(200).json({ok:true,url:`/api/media?id=${id}`})}catch(error){console.error('Media upload failed',error);return res.status(503).json({error:'Media storage is unavailable'})}
}

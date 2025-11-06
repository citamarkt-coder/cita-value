import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from '../db.js';

export const uploadsRouter = express.Router();

export function ensureUploadsDir(dir){
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb){
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dest = path.join(__dirname, '..', '..', 'uploads');
    ensureUploadsDir(dest);
    cb(null, dest);
  },
  filename: function(req, file, cb){
    const safe = Date.now() + '_' + file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_');
    cb(null, safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

uploadsRouter.get('/', async (req,res)=>{
  const { uid } = req.auth;
  const r = await query(`select id, original_name, mime_type, size, tag, note, created_at from files where user_id=$1 order by created_at desc`, [uid]);
  res.json(r.rows);
});

uploadsRouter.post('/', upload.single('file'), async (req,res)=>{
  const { uid } = req.auth;
  const f = req.file;
  if(!f) return res.status(400).json({ error: 'file missing' });
  const p = path.relative(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'), f.path);
  const r = await query(`insert into files (user_id, original_name, mime_type, path, size) values ($1,$2,$3,$4,$5) returning id, original_name, mime_type, size, created_at`, [uid, f.originalname, f.mimetype, p, f.size]);
  res.json(r.rows[0]);
});

uploadsRouter.delete('/:id', async (req,res)=>{
  const { uid } = req.auth; const { id } = req.params;
  const r = await query(`select path from files where id=$1 and user_id=$2`, [id, uid]);
  const row = r.rows[0];
  if(!row) return res.status(404).json({ error: 'not found' });
  const abs = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', row.path);
  try{ fs.unlinkSync(abs); }catch{}
  await query(`delete from files where id=$1 and user_id=$2`, [id, uid]);
  res.json({ ok:true });
});

uploadsRouter.get('/:id/download', async (req,res)=>{
  const { uid } = req.auth; const { id } = req.params;
  const r = await query(`select original_name, mime_type, path from files where id=$1 and user_id=$2`, [id, uid]);
  const row = r.rows[0];
  if(!row) return res.status(404).json({ error: 'not found' });
  const abs = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', row.path);
  if(!fs.existsSync(abs)) return res.status(404).json({ error: 'file missing' });
  res.setHeader('Content-Type', row.mime_type);
  res.setHeader('Content-Disposition', `attachment; filename="${row.original_name.replace('"','')}"`);
  fs.createReadStream(abs).pipe(res);
});

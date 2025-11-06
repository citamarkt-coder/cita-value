import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export const authRouter = express.Router();

authRouter.post('/register', async (req,res)=>{
  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ error: 'email and password required' });
  try{
    const hashed = await bcrypt.hash(password, 10);
    const r = await query(`insert into users (email, password_hash) values ($1,$2) returning id, email, created_at`, [String(email).toLowerCase(), hashed]);
    const user = r.rows[0];
    const token = jwt.sign({ uid: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  }catch(e){
    if (e.code === '23505') { // unique_violation
      return res.status(409).json({ error: 'email already registered' });
    }
    console.error(e);
    res.status(500).json({ error: 'register failed' });
  }
});

authRouter.post('/login', async (req,res)=>{
  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ error: 'email and password required' });
  try{
    const r = await query(`select * from users where email=$1`, [String(email).toLowerCase()]);
    const user = r.rows[0];
    if(!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if(!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ uid: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id:user.id, email:user.email, created_at:user.created_at } });
  }catch(e){
    console.error(e);
    res.status(500).json({ error: 'login failed' });
  }
});

authRouter.get('/me', async (req,res)=>{
  // Optional: allow unauthenticated me to simplify
  const h = req.headers.authorization || '';
  const token = h.replace('Bearer ', '');
  if(!token) return res.json({ user: null, subscription: null });
  try{
    const { uid } = jwt.verify(token, process.env.JWT_SECRET);
    const u = await query(`select id, email, created_at from users where id=$1`, [uid]);
    const s = await query(`select status, price_id, current_period_end from subscriptions where user_id=$1 and status in ('active','trialing') limit 1`, [uid]);
    res.json({ user: u.rows[0] || null, subscription: s.rows[0] || null });
  }catch(e){
    res.json({ user: null, subscription: null });
  }
});

import express from 'express';
import Stripe from 'stripe';
import { query } from '../db.js';

export const billingRouter = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

async function ensureCustomer(user_id){
  const r = await query(`select stripe_customer_id from customers where user_id=$1`, [user_id]);
  let customerId = r.rows[0]?.stripe_customer_id;
  if(!customerId){
    const u = await query(`select email from users where id=$1`, [user_id]);
    const email = u.rows[0]?.email;
    const customer = await stripe.customers.create({ email, metadata: { user_id } });
    customerId = customer.id;
    await query(`insert into customers (user_id, stripe_customer_id) values ($1,$2) on conflict (user_id) do update set stripe_customer_id=excluded.stripe_customer_id`, [user_id, customerId]);
  }
  return customerId;
}

billingRouter.post('/checkout', async (req,res)=>{
  try{
    const { uid } = req.auth;
    const { price_id } = req.body || {};
    if(!price_id) return res.status(400).json({ error: 'price_id required' });
    const customerId = await ensureCustomer(uid);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: uid,
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: `${process.env.SITE_URL}/#/app`,
      cancel_url: `${process.env.SITE_URL}/#/pricing`,
      allow_promotion_codes: true
    });
    res.json({ url: session.url });
  }catch(e){
    console.error(e);
    res.status(500).json({ error: 'checkout failed' });
  }
});

billingRouter.post('/portal', async (req,res)=>{
  try{
    const { uid } = req.auth;
    const r = await query(`select stripe_customer_id from customers where user_id=$1`, [uid]);
    const customerId = r.rows[0]?.stripe_customer_id;
    if(!customerId) return res.status(400).json({ error: 'no customer' });
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.SITE_URL}/#/app`
    });
    res.json({ url: portal.url });
  }catch(e){
    console.error(e);
    res.status(500).json({ error: 'portal failed' });
  }
});

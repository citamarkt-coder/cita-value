import Stripe from 'stripe';
import { query } from '../db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export async function stripeWebhookHandler(req, res){
  const sig = req.headers['stripe-signature'];
  let event;
  try{
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  }catch(err){
    console.error('Webhook signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try{
    switch(event.type){
      case 'checkout.session.completed': {
        const s = event.data.object;
        const userId = s.client_reference_id;
        if(userId && s.customer){
          await query(`insert into customers (user_id, stripe_customer_id) values ($1,$2) on conflict (user_id) do update set stripe_customer_id=excluded.stripe_customer_id`, [userId, s.customer]);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const r = await query(`select user_id from customers where stripe_customer_id=$1`, [sub.customer]);
        const userId = r.rows[0]?.user_id;
        if(userId){
          await query(`insert into subscriptions (id, user_id, status, price_id, current_period_end, cancel_at_period_end, raw)
                       values ($1,$2,$3,$4,to_timestamp($5),$6,$7)
                       on conflict (id) do update set status=excluded.status, price_id=excluded.price_id, current_period_end=excluded.current_period_end, cancel_at_period_end=excluded.cancel_at_period_end, raw=excluded.raw`,
          [ sub.id, userId, sub.status, sub.items?.data?.[0]?.price?.id || null, sub.current_period_end, sub.cancel_at_period_end || false, sub ]);
        }
        break;
      }
      default:
        // ignore
    }
    res.json({ received: true });
  }catch(e){
    console.error(e);
    res.status(500).send('webhook handler error');
  }
}

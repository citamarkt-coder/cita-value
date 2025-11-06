import express from 'express';
export const publicRouter = express.Router();

publicRouter.get('/config', (req,res)=>{
  res.json({
    site_url: process.env.SITE_URL || 'http://localhost:8080',
    prices: {
      starter: process.env.PRICE_STARTER || null,
      pro: process.env.PRICE_PRO || null,
      expert: process.env.PRICE_EXPERT || null
    }
  });
});

import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Routers/handlers
import { stripeWebhookHandler } from './routes/webhook.js';
import { authRouter } from './routes/auth.js';
import { publicRouter } from './routes/public.js';
import { billingRouter } from './routes/billing.js';
import { projectsRouter } from './routes/projects.js';
import { uploadsRouter, ensureUploadsDir } from './routes/uploads.js';
import { authGuard } from './middleware/auth.js';

const app = express();

// __dirname helper
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads dir
ensureUploadsDir(path.join(__dirname, '..', 'uploads'));

// STRIPE WEBHOOK (raw) – must be before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// JSON parser for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(morgan('dev'));

// Public config
app.use('/api/public', publicRouter);

// Auth
app.use('/api/auth', authRouter);

// Billing (protected)
app.use('/api/billing', authGuard, billingRouter);

// Projects (protected)
app.use('/api/projects', authGuard, projectsRouter);

// Uploads (protected)
app.use('/api/uploads', authGuard, uploadsRouter);

// Static client (single-file React app)
app.use('/', express.static(path.join(__dirname, '..', 'client')));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Cita Value server listening on http://localhost:${PORT}`);
});

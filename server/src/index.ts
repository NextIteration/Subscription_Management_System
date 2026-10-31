import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import member2Router from './routes';
import { initBillingScheduler, stopBillingScheduler } from './modules/billing/billing.scheduler';
import { seedDatabase } from './seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Brightloop Subscription Billing API', timestamp: new Date() });
});

// Mount Member 2 Routes
app.use('/api', member2Router);

// Start server
const server = app.listen(PORT, async () => {
  console.log(`[Brightloop Server] Running on http://localhost:${PORT}`);
  
  // Seed demo data if database is reachable & empty
  try {
    await seedDatabase();
  } catch (err: any) {
    console.warn('[Brightloop Server] Seeding skipped (Database may be connecting or uninitialized):', err.message);
  }

  // Initialize recurring billing scheduler
  initBillingScheduler();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Brightloop Server] SIGTERM received. Shutting down gracefully...');
  stopBillingScheduler();
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[Brightloop Server] SIGINT received. Shutting down gracefully...');
  stopBillingScheduler();
  server.close(() => process.exit(0));
});

export default app;


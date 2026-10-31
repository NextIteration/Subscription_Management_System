import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { config } from './config/env';
import { dbStore } from './services/dbStore';
import { SESSION_COOKIE_NAME } from './middleware/auth';

// Member 1 Route imports
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import planRoutes from './routes/plan.routes';
import quotationRoutes from './routes/quotation.routes';
import subscriptionRoutes from './routes/subscription.routes';
import portalRoutes from './routes/portal.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Member 2 Route and Service imports
import member2Router from './routes';
import { initBillingScheduler, stopBillingScheduler } from './modules/billing/billing.scheduler';
import { seedDatabase } from './seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || config.frontendUrl || 'http://localhost:5173';

// Middlewares
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser(config.sessionSecret));

// Optional Session Extractor: Populates req.user if a valid session cookie exists
app.use((req: Request, _res: Response, next: NextFunction) => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionId) {
    const session = dbStore.sessions.get(sessionId);
    if (session && session.expiresAt > new Date()) {
      const user = dbStore.users.get(session.userId);
      if (user) {
        req.user = user;
        req.sessionId = sessionId;
      }
    }
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Brightloop Subscription & Billing Management API (Unified)',
    environment: process.env.NODE_ENV || 'development',
    modules: {
      member1: ['auth', 'customers', 'products', 'plans', 'quotations', 'subscriptions', 'portal-dashboard'],
      member2: ['tax-rules', 'discount-rules', 'invoices', 'payments', 'billing', 'reports', 'portal-invoices'],
    },
  });
});

// Mount Member 1 API Routers
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Mount Member 2 API Routers (taxes, discounts, invoices, payments, billing, reports, portal invoices)
app.use('/api', member2Router);

// Global Error Handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('[Internal Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'An unexpected internal server error occurred',
  });
});

let server: any = null;

// Boot server
async function startServer() {
  // Initialize Member 1 in-memory dev store
  await dbStore.initialize();

  // Seed Member 2 database if available
  try {
    await seedDatabase();
  } catch (err: any) {
    console.warn('[Brightloop Server] Database seeding skipped (DB may be connecting or uninitialized):', err.message);
  }

  server = app.listen(PORT, () => {
    console.log(`🚀 Brightloop Backend API running at http://localhost:${PORT}`);
    console.log(`📡 CORS allowed for frontend: ${frontendUrl}`);

    // Initialize recurring billing scheduler (Member 2)
    try {
      initBillingScheduler();
    } catch (err: any) {
      console.warn('[Brightloop Server] Billing scheduler initialization warning:', err.message);
    }
  });
}

// Graceful shutdown
const handleShutdown = (signal: string) => {
  console.log(`[Brightloop Server] ${signal} received. Shutting down gracefully...`);
  try {
    stopBillingScheduler();
  } catch (e) {
    // Ignore scheduler cleanup error
  }
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});

export default app;

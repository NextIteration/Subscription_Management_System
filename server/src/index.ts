import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { dbStore } from './services/dbStore.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import customerRoutes from './routes/customer.routes.js';
import productRoutes from './routes/product.routes.js';
import planRoutes from './routes/plan.routes.js';
import quotationRoutes from './routes/quotation.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import portalRoutes from './routes/portal.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

// Middlewares
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser(config.sessionSecret));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Brightloop Subscription Management API (Member 1)',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount modular API routers
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('[Internal Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'An unexpected internal server error occurred',
  });
});

// Boot server
async function startServer() {
  await dbStore.initialize();

  app.listen(config.port, () => {
    console.log(`🚀 Brightloop Backend API running at http://localhost:${config.port}`);
    console.log(`📡 CORS allowed for frontend: ${config.frontendUrl}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});


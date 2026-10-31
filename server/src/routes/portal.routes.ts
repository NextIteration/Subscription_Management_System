import { Router, Request, Response } from 'express';
import { dbStore } from '../services/dbStore.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/portal/dashboard - Summary stats for logged in customer
router.get('/dashboard', requireAuth, requireRole('CUSTOMER'), (req: Request, res: Response) => {
  const customerId = req.user!.customerId;
  if (!customerId) {
    return res.status(400).json({ error: 'Customer ID not associated with current account.' });
  }

  const customer = dbStore.customers.get(customerId);
  const subs = Array.from(dbStore.subscriptions.values()).filter((s) => s.customerId === customerId);

  const activeSubs = subs.filter((s) => s.status === 'ACTIVE');
  const pausedSubs = subs.filter((s) => s.status === 'PAUSED');

  // Find next upcoming billing date
  const nextBillingDate = activeSubs
    .map((s) => s.nextBillingDate)
    .filter(Boolean)
    .sort()[0] || null;

  const totalMonthlyCommitment = activeSubs.reduce((acc, s) => {
    if (s.billingFrequency === 'MONTHLY') return acc + s.totalAmount;
    if (s.billingFrequency === 'YEARLY') return acc + s.totalAmount / 12;
    if (s.billingFrequency === 'WEEKLY') return acc + s.totalAmount * 4;
    return acc + s.totalAmount * 30;
  }, 0);

  res.json({
    customer,
    stats: {
      totalSubscriptions: subs.length,
      activeSubscriptions: activeSubs.length,
      pausedSubscriptions: pausedSubs.length,
      nextBillingDate,
      monthlyEstimate: Math.round(totalMonthlyCommitment * 100) / 100,
    },
    recentSubscriptions: subs.slice(0, 5),
  });
});

// GET /api/portal/subscriptions - My subscriptions list (Strict customer isolation)
router.get('/subscriptions', requireAuth, requireRole('CUSTOMER'), (req: Request, res: Response) => {
  const customerId = req.user!.customerId;
  if (!customerId) {
    return res.status(400).json({ error: 'Customer ID not associated with current account.' });
  }

  const subs = Array.from(dbStore.subscriptions.values())
    .filter((s) => s.customerId === customerId)
    .map((s) => {
      const plan = dbStore.plans.get(s.planId);
      return {
        ...s,
        planAllowsPause: plan?.pauseAllowed ?? false,
        maxPauseDays: plan?.maxPauseDays ?? 0,
      };
    });

  res.json({ subscriptions: subs });
});

// GET /api/portal/subscriptions/:id - View single own subscription
router.get('/subscriptions/:id', requireAuth, requireRole('CUSTOMER'), (req: Request, res: Response) => {
  const customerId = req.user!.customerId;
  const { id } = req.params;
  const sub = dbStore.subscriptions.get(id);

  if (!sub || sub.customerId !== customerId) {
    return res.status(404).json({ error: 'Subscription not found or access denied.' });
  }

  const plan = dbStore.plans.get(sub.planId);

  res.json({
    subscription: sub,
    plan,
  });
});

export default router;


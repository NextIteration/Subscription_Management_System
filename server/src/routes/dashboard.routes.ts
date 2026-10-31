import { Router, Request, Response } from 'express';
import { dbStore } from '../services/dbStore.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard/metrics - Operational statistics for Admin & Staff
router.get('/metrics', requireAuth, requireRole('ADMIN', 'STAFF'), (req: Request, res: Response) => {
  const subs = Array.from(dbStore.subscriptions.values());
  const customers = Array.from(dbStore.customers.values());
  const quotations = Array.from(dbStore.quotations.values());

  const activeSubscriptionsCount = subs.filter((s) => s.status === 'ACTIVE').length;
  const pausedSubscriptionsCount = subs.filter((s) => s.status === 'PAUSED').length;
  const confirmedSubscriptionsCount = subs.filter((s) => s.status === 'CONFIRMED').length;

  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const newClientsThisMonth = customers.filter(
    (c) => c.createdAt.toISOString().slice(0, 7) === currentYearMonth
  ).length;

  // Subscriptions by status breakdown
  const statusCounts = {
    ACTIVE: activeSubscriptionsCount,
    PAUSED: pausedSubscriptionsCount,
    CONFIRMED: confirmedSubscriptionsCount,
    DRAFT: subs.filter((s) => s.status === 'DRAFT').length,
    CLOSED: subs.filter((s) => s.status === 'CLOSED').length,
  };

  // Recent operational events
  const recentActivities = [
    ...subs.map((s) => ({
      id: `act-sub-${s.id}`,
      name: s.customerName,
      title: `${s.planName} (${s.subscriptionNumber})`,
      action: `Subscription ${s.status.toLowerCase()} • $${s.totalAmount.toLocaleString()}`,
      time: s.createdAt.toISOString().split('T')[0],
      type: 'subscription',
    })),
    ...quotations.map((q) => ({
      id: `act-quot-${q.id}`,
      name: q.customerName,
      title: `Quotation ${q.quotationNumber}`,
      action: `Status: ${q.status.toLowerCase()} • $${q.totalAmount.toLocaleString()}`,
      time: q.createdAt.toISOString().split('T')[0],
      type: 'quotation',
    })),
  ]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 8);

  res.json({
    metrics: {
      activeSubscriptionsCount,
      pausedSubscriptionsCount,
      totalCustomersCount: customers.length,
      newClientsThisMonth,
      pendingQuotationsCount: quotations.filter((q) => q.status === 'SENT' || q.status === 'DRAFT').length,
      statusCounts,
    },
    recentActivities,
  });
});

export default router;


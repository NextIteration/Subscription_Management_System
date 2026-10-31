import { Router, Request, Response } from 'express';
import {
  dbStore,
  SubscriptionEntity,
  SubscriptionLineItemEntity,
} from '../services/dbStore.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  subscriptionSchema,
  pauseSubscriptionSchema,
  closeSubscriptionSchema,
  updateRenewalSchema,
  updateStatusSchema,
} from '../validators/subscription.validator.js';

const router = Router();

// GET /api/subscriptions - List subscriptions
router.get('/', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const { status, customerId, planId, billingDue } = req.query;

  let subs = Array.from(dbStore.subscriptions.values());

  // Role isolation: Customers can ONLY see their own subscriptions
  if (user.role === 'CUSTOMER') {
    subs = subs.filter((s) => s.customerId === user.customerId);
  } else {
    // Admin / Staff filters
    if (customerId) {
      subs = subs.filter((s) => s.customerId === customerId);
    }
  }

  if (status) {
    subs = subs.filter((s) => s.status.toUpperCase() === (status as string).toUpperCase());
  }

  if (planId) {
    subs = subs.filter((s) => s.planId === planId);
  }

  // Member 2 Integration Hook: subscriptions due for billing
  if (billingDue === 'true') {
    const today = new Date().toISOString().split('T')[0];
    subs = subs.filter((s) => s.status === 'ACTIVE' && s.nextBillingDate <= today);
  }

  res.json({ subscriptions: subs });
});

// GET /api/subscriptions/:id - Subscription detail
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const sub = dbStore.subscriptions.get(id);

  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  // Customer authorization check
  if (user.role === 'CUSTOMER' && user.customerId !== sub.customerId) {
    return res.status(403).json({ error: 'Unauthorized to view this subscription' });
  }

  const plan = dbStore.plans.get(sub.planId);
  res.json({ subscription: sub, plan });
});

// POST /api/subscriptions - Create subscription (ADMIN, STAFF)
router.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), validate(subscriptionSchema), (req: Request, res: Response) => {
  const data = req.body;

  const customer = dbStore.customers.get(data.customerId);
  if (!customer) {
    return res.status(400).json({ error: 'Customer not found' });
  }

  const plan = dbStore.plans.get(data.planId);
  if (!plan) {
    return res.status(400).json({ error: 'Plan not found' });
  }

  const subscriptionId = `sub-${Date.now()}`;
  const subscriptionNumber = `SUB-2026-00${dbStore.subscriptions.size + 1}`;

  const lines: SubscriptionLineItemEntity[] = data.lines.map((l: any, idx: number) => ({
    id: `sl-${Date.now()}-${idx + 1}`,
    subscriptionId,
    productId: l.productId,
    productName: l.productName,
    variantId: l.variantId,
    variantName: l.variantName,
    quantity: Number(l.quantity) || 1,
    unitPrice: Number(l.unitPrice) || 0,
    taxRate: Number(l.taxRate) || 0,
    lineTotal: (Number(l.quantity) || 1) * (Number(l.unitPrice) || 0),
  }));

  const subtotal = lines.reduce((acc, l) => acc + l.lineTotal, 0);
  const taxTotal = Number(data.taxTotal) || 0;
  const totalAmount = subtotal + taxTotal;

  const newSub: SubscriptionEntity = {
    id: subscriptionId,
    subscriptionNumber,
    customerId: data.customerId,
    customerName: customer.name,
    planId: data.planId,
    planName: plan.name,
    billingFrequency: data.billingFrequency,
    status: 'DRAFT', // Lifecycle starts at DRAFT
    startDate: data.startDate,
    expiryDate: data.expiryDate,
    nextBillingDate: data.nextBillingDate || data.startDate,
    paymentTerms: data.paymentTerms || 'NET30',
    taxReference: data.taxReference || 'TAX-US-CA-STD',
    lines,
    subtotal,
    taxTotal,
    totalAmount,
    autoRenew: data.autoRenew !== undefined ? Boolean(data.autoRenew) : plan.autoRenewDefault,
    renewalNotificationDays: Number(data.renewalNotificationDays) || 14,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dbStore.subscriptions.set(subscriptionId, newSub);

  res.status(201).json({
    message: `Subscription ${subscriptionNumber} created successfully`,
    subscription: newSub,
  });
});

// PATCH /api/subscriptions/:id/status - Status transitions
router.patch('/:id/status', requireAuth, requireRole('ADMIN', 'STAFF'), validate(updateStatusSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const sub = dbStore.subscriptions.get(id);

  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  // Lifecycle transition enforcement (PRD §2.6)
  // DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED
  const current = sub.status;
  const target = status;

  const allowedTransitions: Record<string, string[]> = {
    DRAFT: ['QUOTATION', 'CONFIRMED', 'CLOSED'],
    QUOTATION: ['CONFIRMED', 'CLOSED'],
    CONFIRMED: ['ACTIVE', 'CLOSED'],
    ACTIVE: ['PAUSED', 'CLOSED'],
    PAUSED: ['ACTIVE', 'CLOSED'],
    CLOSED: [], // terminal
  };

  if (!allowedTransitions[current]?.includes(target)) {
    return res.status(400).json({
      error: `Invalid lifecycle transition from ${current} to ${target}. Allowed: [${allowedTransitions[current]?.join(', ')}]`,
    });
  }

  sub.status = target;
  if (target === 'CLOSED') {
    sub.closedAt = new Date().toISOString().split('T')[0];
    sub.closureReason = reason || 'Manual closure';
  }
  sub.updatedAt = new Date();
  dbStore.subscriptions.set(id, sub);

  res.json({
    message: `Subscription status updated to ${target}`,
    subscription: sub,
  });
});

// POST /api/subscriptions/:id/pause - Pause with plan rules (PRD §2.6 & §2.4)
router.post('/:id/pause', requireAuth, requireRole('ADMIN', 'STAFF'), validate(pauseSubscriptionSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const sub = dbStore.subscriptions.get(id);

  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  if (sub.status !== 'ACTIVE') {
    return res.status(400).json({ error: `Only ACTIVE subscriptions can be paused. Current status is ${sub.status}.` });
  }

  // Enforce plan pause rules
  const plan = dbStore.plans.get(sub.planId);
  if (plan && !plan.pauseAllowed) {
    return res.status(400).json({
      error: `Subscription plan "${plan.name}" does not allow pausing.`,
    });
  }

  sub.status = 'PAUSED';
  sub.pauseReason = reason;
  sub.pausedAt = new Date().toISOString().split('T')[0];
  sub.pauseDaysRemaining = plan?.maxPauseDays || 30;
  sub.updatedAt = new Date();
  dbStore.subscriptions.set(id, sub);

  res.json({
    message: `Subscription ${sub.subscriptionNumber} paused successfully`,
    subscription: sub,
  });
});

// POST /api/subscriptions/:id/resume - Resume from pause
router.post('/:id/resume', requireAuth, requireRole('ADMIN', 'STAFF'), (req: Request, res: Response) => {
  const { id } = req.params;
  const sub = dbStore.subscriptions.get(id);

  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  if (sub.status !== 'PAUSED') {
    return res.status(400).json({ error: `Only PAUSED subscriptions can be resumed. Current status is ${sub.status}.` });
  }

  sub.status = 'ACTIVE';
  sub.pauseReason = undefined;
  sub.pausedAt = undefined;
  sub.pauseDaysRemaining = undefined;
  sub.updatedAt = new Date();
  dbStore.subscriptions.set(id, sub);

  res.json({
    message: `Subscription ${sub.subscriptionNumber} resumed to ACTIVE`,
    subscription: sub,
  });
});

// POST /api/subscriptions/:id/close - Close with early closure penalty (PRD §2.4 & §2.6)
router.post('/:id/close', requireAuth, requireRole('ADMIN', 'STAFF'), validate(closeSubscriptionSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const sub = dbStore.subscriptions.get(id);

  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  if (sub.status === 'CLOSED') {
    return res.status(400).json({ error: 'Subscription is already closed.' });
  }

  const plan = dbStore.plans.get(sub.planId);
  const now = new Date().toISOString().split('T')[0];
  const isEarlyClosure = sub.expiryDate > now;

  let penaltyPercentage = 0;
  let penaltyAmount = 0;

  if (isEarlyClosure && plan && plan.earlyClosurePenaltyPercentage > 0) {
    penaltyPercentage = plan.earlyClosurePenaltyPercentage;
    penaltyAmount = (sub.totalAmount * penaltyPercentage) / 100;
  }

  sub.status = 'CLOSED';
  sub.closedAt = now;
  sub.closureReason = reason;
  sub.updatedAt = new Date();
  dbStore.subscriptions.set(id, sub);

  res.json({
    message: `Subscription ${sub.subscriptionNumber} closed successfully.${penaltyAmount > 0 ? ` Early closure fee: $${penaltyAmount.toFixed(2)} (${penaltyPercentage}%).` : ''}`,
    subscription: sub,
    penalty: {
      isEarlyClosure,
      penaltyPercentage,
      penaltyAmount,
    },
  });
});

// PATCH /api/subscriptions/:id/renewal - Update renewal settings (PRD §2.4 & §2.6)
router.patch('/:id/renewal', requireAuth, validate(updateRenewalSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const { autoRenew, renewalNotificationDays } = req.body;
  const sub = dbStore.subscriptions.get(id);

  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  // Customer authorization check
  if (user.role === 'CUSTOMER' && user.customerId !== sub.customerId) {
    return res.status(403).json({ error: 'Unauthorized to update this subscription' });
  }

  sub.autoRenew = Boolean(autoRenew);
  sub.renewalNotificationDays = Number(renewalNotificationDays);
  sub.updatedAt = new Date();
  dbStore.subscriptions.set(id, sub);

  res.json({
    message: 'Renewal settings updated successfully',
    subscription: sub,
  });
});

export default router;


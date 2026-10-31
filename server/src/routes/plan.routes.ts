import { Router, Request, Response } from 'express';
import { dbStore, PlanEntity } from '../services/dbStore.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { planSchema, updatePlanSchema } from '../validators/plan.validator.js';

const router = Router();

// GET /api/plans - List plans (ADMIN, STAFF)
router.get('/', requireAuth, requireRole('ADMIN', 'STAFF'), (req: Request, res: Response) => {
  const status = req.query.status as string;
  let plans = Array.from(dbStore.plans.values());

  if (status) {
    plans = plans.filter((p) => p.status === status);
  }

  res.json({ plans });
});

// GET /api/plans/:id - Plan detail (ADMIN, STAFF)
router.get('/:id', requireAuth, requireRole('ADMIN', 'STAFF'), (req: Request, res: Response) => {
  const { id } = req.params;
  const plan = dbStore.plans.get(id);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const linkedSubs = Array.from(dbStore.subscriptions.values()).filter((s) => s.planId === id);

  res.json({
    plan,
    subscriptionsCount: linkedSubs.length,
    activeSubscriptionsCount: linkedSubs.filter((s) => s.status === 'ACTIVE').length,
  });
});

// POST /api/plans - Create plan (ADMIN only per PRD §2.4)
router.post('/', requireAuth, requireRole('ADMIN'), validate(planSchema), (req: Request, res: Response) => {
  const data = req.body;

  const existingCode = Array.from(dbStore.plans.values()).find(
    (p) => p.code.toLowerCase() === data.code.trim().toLowerCase()
  );
  if (existingCode) {
    return res.status(409).json({ error: `A plan with code "${data.code}" already exists.` });
  }

  const planId = `plan-${Date.now()}`;
  const newPlan: PlanEntity = {
    id: planId,
    name: data.name,
    code: data.code.toUpperCase().trim(),
    billingFrequency: data.billingFrequency,
    minimumQuantity: Number(data.minimumQuantity) || 1,
    price: Number(data.price),
    availableFrom: data.availableFrom,
    availableUntil: data.availableUntil,
    autoRenewDefault: Boolean(data.autoRenewDefault),
    earlyClosurePenaltyPercentage: Number(data.earlyClosurePenaltyPercentage) || 0,
    pauseAllowed: Boolean(data.pauseAllowed),
    maxPauseDays: data.pauseAllowed ? Number(data.maxPauseDays) || 30 : 0,
    description: data.description || '',
    status: data.status || 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dbStore.plans.set(planId, newPlan);

  res.status(201).json({
    message: 'Subscription plan created successfully',
    plan: newPlan,
  });
});

// PUT /api/plans/:id - Update plan (ADMIN only)
router.put('/:id', requireAuth, requireRole('ADMIN'), validate(updatePlanSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const plan = dbStore.plans.get(id);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const data = req.body;
  const pauseAllowed = data.pauseAllowed !== undefined ? Boolean(data.pauseAllowed) : plan.pauseAllowed;

  const updatedPlan: PlanEntity = {
    ...plan,
    ...data,
    pauseAllowed,
    maxPauseDays: pauseAllowed ? (data.maxPauseDays !== undefined ? Number(data.maxPauseDays) : plan.maxPauseDays) : 0,
    updatedAt: new Date(),
  };

  dbStore.plans.set(id, updatedPlan);

  res.json({
    message: 'Subscription plan updated successfully',
    plan: updatedPlan,
  });
});

export default router;


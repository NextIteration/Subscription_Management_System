import { Router, Request, Response } from 'express';
import {
  dbStore,
  QuotationEntity,
  QuotationTemplateEntity,
  SubscriptionEntity,
} from '../services/dbStore.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  quotationSchema,
  quotationTemplateSchema,
} from '../validators/quotation.validator.js';

const router = Router();

// ==========================================
// Quotation Templates (PRD §2.5)
// ==========================================

// GET /api/quotations/templates - List templates
router.get('/templates', requireAuth, requireRole('ADMIN', 'STAFF'), (req: Request, res: Response) => {
  const templates = Array.from(dbStore.quotationTemplates.values());
  res.json({ templates });
});

// POST /api/quotations/templates - Create template
router.post('/templates', requireAuth, requireRole('ADMIN', 'STAFF'), validate(quotationTemplateSchema), (req: Request, res: Response) => {
  const data = req.body;
  const templateId = `tmpl-${Date.now()}`;

  const defaultLines = data.defaultLines.map((line: any, index: number) => ({
    id: `tl-${Date.now()}-${index + 1}`,
    templateId,
    productId: line.productId,
    variantId: line.variantId,
    quantity: Number(line.quantity) || 1,
  }));

  const newTemplate: QuotationTemplateEntity = {
    id: templateId,
    name: data.name,
    description: data.description || '',
    planId: data.planId,
    validityDays: Number(data.validityDays) || 30,
    defaultLines,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dbStore.quotationTemplates.set(templateId, newTemplate);

  res.status(201).json({
    message: 'Quotation template created successfully',
    template: newTemplate,
  });
});

// PUT /api/quotations/templates/:id - Update template
router.put('/templates/:id', requireAuth, requireRole('ADMIN', 'STAFF'), validate(quotationTemplateSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const template = dbStore.quotationTemplates.get(id);
  if (!template) {
    return res.status(404).json({ error: 'Quotation template not found' });
  }

  const data = req.body;
  const defaultLines = data.defaultLines.map((line: any, index: number) => ({
    id: line.id || `tl-${Date.now()}-${index + 1}`,
    templateId: id,
    productId: line.productId,
    variantId: line.variantId,
    quantity: Number(line.quantity) || 1,
  }));

  const updatedTemplate: QuotationTemplateEntity = {
    ...template,
    ...data,
    defaultLines,
    updatedAt: new Date(),
  };

  dbStore.quotationTemplates.set(id, updatedTemplate);

  res.json({
    message: 'Quotation template updated successfully',
    template: updatedTemplate,
  });
});

// DELETE /api/quotations/templates/:id - Delete template
router.delete('/templates/:id', requireAuth, requireRole('ADMIN', 'STAFF'), (req: Request, res: Response) => {
  const { id } = req.params;
  if (!dbStore.quotationTemplates.has(id)) {
    return res.status(404).json({ error: 'Quotation template not found' });
  }

  dbStore.quotationTemplates.delete(id);
  res.json({ message: 'Quotation template removed successfully' });
});

// ==========================================
// Quotations (PRD §2.5)
// ==========================================

// GET /api/quotations - List quotations
router.get('/', requireAuth, requireRole('ADMIN', 'STAFF'), (req: Request, res: Response) => {
  const customerId = req.query.customerId as string;
  const status = req.query.status as string;

  let quotations = Array.from(dbStore.quotations.values());

  // Check validity and auto-flag expired quotations
  const now = new Date().toISOString().split('T')[0];
  quotations.forEach((q) => {
    if (q.status !== 'ACCEPTED' && q.status !== 'REJECTED' && q.validUntil < now) {
      q.status = 'EXPIRED';
      q.updatedAt = new Date();
    }
  });

  if (customerId) {
    quotations = quotations.filter((q) => q.customerId === customerId);
  }
  if (status) {
    quotations = quotations.filter((q) => q.status.toUpperCase() === status.toUpperCase());
  }

  res.json({ quotations });
});

// GET /api/quotations/:id - Quotation detail
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const quotation = dbStore.quotations.get(id);

  if (!quotation) {
    return res.status(404).json({ error: 'Quotation not found' });
  }

  // Customer authorization check
  if (user.role === 'CUSTOMER' && user.customerId !== quotation.customerId) {
    return res.status(403).json({ error: 'You are only authorized to view your own quotations.' });
  }

  // Check expiry
  const now = new Date().toISOString().split('T')[0];
  if (quotation.status !== 'ACCEPTED' && quotation.status !== 'REJECTED' && quotation.validUntil < now) {
    quotation.status = 'EXPIRED';
  }

  res.json({ quotation });
});

// POST /api/quotations - Create quotation
router.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), validate(quotationSchema), (req: Request, res: Response) => {
  const data = req.body;

  const customer = dbStore.customers.get(data.customerId);
  if (!customer) {
    return res.status(400).json({ error: 'Selected customer does not exist' });
  }

  const plan = dbStore.plans.get(data.planId);
  if (!plan) {
    return res.status(400).json({ error: 'Selected plan does not exist' });
  }

  const quotationId = `quot-${Date.now()}`;
  const quotationNumber = `QT-2026-0${100 + dbStore.quotations.size + 1}`;

  const lines = data.lines.map((l: any, idx: number) => ({
    id: `ql-${Date.now()}-${idx + 1}`,
    quotationId,
    productId: l.productId,
    productName: l.productName,
    variantId: l.variantId,
    variantName: l.variantName,
    quantity: Number(l.quantity) || 1,
    unitPrice: Number(l.unitPrice) || 0,
    taxRate: Number(l.taxRate) || 0,
    lineTotal: (Number(l.quantity) || 1) * (Number(l.unitPrice) || 0),
  }));

  const subtotal = lines.reduce((acc: number, l: any) => acc + l.lineTotal, 0);
  const taxAmount = Number(data.taxAmount) || 0;
  const discountAmount = Number(data.discountAmount) || 0;
  const totalAmount = subtotal + taxAmount - discountAmount;

  const newQuotation: QuotationEntity = {
    id: quotationId,
    quotationNumber,
    customerId: data.customerId,
    customerName: customer.name,
    customerEmail: customer.email,
    planId: data.planId,
    planName: plan.name,
    templateId: data.templateId,
    status: 'DRAFT',
    validUntil: data.validUntil,
    lines,
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    notes: data.notes || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dbStore.quotations.set(quotationId, newQuotation);

  res.status(201).json({
    message: `Quotation ${quotationNumber} prepared successfully`,
    quotation: newQuotation,
  });
});

// PATCH /api/quotations/:id/status - Update status (SENT, ACCEPTED, REJECTED)
router.patch('/:id/status', requireAuth, requireRole('ADMIN', 'STAFF'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const quotation = dbStore.quotations.get(id);

  if (!quotation) {
    return res.status(404).json({ error: 'Quotation not found' });
  }

  // Check validity
  const now = new Date().toISOString().split('T')[0];
  if (quotation.validUntil < now) {
    quotation.status = 'EXPIRED';
    return res.status(400).json({ error: 'Quotation has expired and cannot be accepted or updated.' });
  }

  const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'];
  const targetStatus = status.toUpperCase();

  if (!validStatuses.includes(targetStatus)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: [${validStatuses.join(', ')}]` });
  }

  quotation.status = targetStatus as any;
  quotation.updatedAt = new Date();
  dbStore.quotations.set(id, quotation);

  res.json({
    message: `Quotation marked as ${targetStatus}`,
    quotation,
  });
});

// POST /api/quotations/:id/convert - Convert accepted quotation to subscription (PRD §2.5 & §2.6)
router.post('/:id/convert', requireAuth, requireRole('ADMIN', 'STAFF'), (req: Request, res: Response) => {
  const { id } = req.params;
  const quotation = dbStore.quotations.get(id);

  if (!quotation) {
    return res.status(404).json({ error: 'Quotation not found' });
  }

  // Enforce validity period rule (PRD §2.5: Expired quotations must not be treated as valid)
  const now = new Date().toISOString().split('T')[0];
  if (quotation.validUntil < now) {
    quotation.status = 'EXPIRED';
    return res.status(400).json({ error: 'This quotation has expired and cannot be converted into an active subscription.' });
  }

  const plan = dbStore.plans.get(quotation.planId) || Array.from(dbStore.plans.values())[0];
  const subscriptionId = `sub-${Date.now()}`;
  const subscriptionNumber = `SUB-2026-00${dbStore.subscriptions.size + 1}`;

  // Copy line items
  const lines = quotation.lines.map((ql, idx) => ({
    id: `sl-${Date.now()}-${idx + 1}`,
    subscriptionId,
    productId: ql.productId,
    productName: ql.productName,
    variantId: ql.variantId,
    variantName: ql.variantName,
    quantity: ql.quantity,
    unitPrice: ql.unitPrice,
    taxRate: ql.taxRate,
    lineTotal: ql.lineTotal,
  }));

  const startDate = new Date().toISOString().split('T')[0];
  // Calculate expiry date based on plan frequency
  const expiry = new Date();
  if (plan.billingFrequency === 'DAILY') expiry.setDate(expiry.getDate() + 30);
  else if (plan.billingFrequency === 'WEEKLY') expiry.setDate(expiry.getDate() + 90);
  else if (plan.billingFrequency === 'MONTHLY') expiry.setFullYear(expiry.getFullYear() + 1);
  else expiry.setFullYear(expiry.getFullYear() + 1);

  const newSub: SubscriptionEntity = {
    id: subscriptionId,
    subscriptionNumber,
    customerId: quotation.customerId,
    customerName: quotation.customerName,
    planId: quotation.planId,
    planName: quotation.planName,
    billingFrequency: plan.billingFrequency,
    status: 'CONFIRMED', // Moves to CONFIRMED in lifecycle
    startDate,
    expiryDate: expiry.toISOString().split('T')[0],
    nextBillingDate: startDate,
    paymentTerms: 'NET30',
    lines,
    taxReference: 'TAX-US-CA-STD',
    subtotal: quotation.subtotal,
    taxTotal: quotation.taxAmount,
    totalAmount: quotation.totalAmount,
    autoRenew: plan.autoRenewDefault,
    renewalNotificationDays: 14,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dbStore.subscriptions.set(subscriptionId, newSub);

  // Mark quotation accepted
  quotation.status = 'ACCEPTED';
  quotation.updatedAt = new Date();
  dbStore.quotations.set(id, quotation);

  res.status(201).json({
    message: `Quotation converted to Subscription ${subscriptionNumber}`,
    subscription: newSub,
  });
});

export default router;


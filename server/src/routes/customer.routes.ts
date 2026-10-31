import { Router, Request, Response } from 'express';
import { dbStore, CustomerEntity } from '../services/dbStore.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { customerSchema, updateCustomerSchema } from '../validators/customer.validator.js';

const router = Router();

// GET /api/customers - List customers (ADMIN, STAFF)
router.get('/', requireAuth, requireRole('ADMIN', 'STAFF'), (req: Request, res: Response) => {
  const search = (req.query.search as string || '').toLowerCase().trim();
  const page = parseInt(req.query.page as string || '1', 10);
  const pageSize = parseInt(req.query.pageSize as string || '50', 10);

  let customers = Array.from(dbStore.customers.values());

  if (search) {
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.company.toLowerCase().includes(search) ||
        (c.phone && c.phone.toLowerCase().includes(search))
    );
  }

  // Enrich with active subscription counts and total value
  const total = customers.length;
  const paginated = customers.slice((page - 1) * pageSize, page * pageSize).map((c) => {
    const custSubs = Array.from(dbStore.subscriptions.values()).filter(
      (s) => s.customerId === c.id
    );
    const activeSubscriptionsCount = custSubs.filter(
      (s) => s.status === 'ACTIVE' || s.status === 'PAUSED' || s.status === 'CONFIRMED'
    ).length;
    const totalSpent = custSubs.reduce((acc, s) => acc + s.totalAmount, 0);

    return {
      ...c,
      activeSubscriptionsCount,
      totalSpent,
      createdAt: c.createdAt.toISOString().split('T')[0],
    };
  });

  res.json({
    data: paginated,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

// GET /api/customers/:id - Customer detail (ADMIN, STAFF, or own customer)
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  if (user.role === 'CUSTOMER' && user.customerId !== id) {
    return res.status(403).json({ error: 'You are only authorized to access your own customer record.' });
  }

  const customer = dbStore.customers.get(id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const custSubs = Array.from(dbStore.subscriptions.values()).filter((s) => s.customerId === id);
  const custQuotations = Array.from(dbStore.quotations.values()).filter((q) => q.customerId === id);

  res.json({
    customer: {
      ...customer,
      createdAt: customer.createdAt.toISOString().split('T')[0],
      activeSubscriptionsCount: custSubs.filter((s) => s.status === 'ACTIVE').length,
      totalSpent: custSubs.reduce((acc, s) => acc + s.totalAmount, 0),
    },
    subscriptions: custSubs,
    quotations: custQuotations,
  });
});

// POST /api/customers - Create customer (ADMIN, STAFF)
router.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), validate(customerSchema), (req: Request, res: Response) => {
  const data = req.body;
  const normalizedEmail = data.email.trim().toLowerCase();

  const existing = Array.from(dbStore.customers.values()).find(
    (c) => c.email.toLowerCase() === normalizedEmail
  );
  if (existing) {
    return res.status(409).json({ error: 'A customer with this email address already exists.' });
  }

  const newId = `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newCustomer: CustomerEntity = {
    id: newId,
    name: data.name,
    email: normalizedEmail,
    phone: data.phone || '',
    company: data.company,
    address: data.address || '',
    taxNumber: data.taxNumber || '',
    status: data.status || 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dbStore.customers.set(newId, newCustomer);

  res.status(201).json({
    message: 'Customer record created successfully',
    customer: {
      ...newCustomer,
      createdAt: newCustomer.createdAt.toISOString().split('T')[0],
      activeSubscriptionsCount: 0,
      totalSpent: 0,
    },
  });
});

// PUT /api/customers/:id - Update customer (ADMIN, STAFF)
router.put('/:id', requireAuth, requireRole('ADMIN', 'STAFF'), validate(updateCustomerSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const customer = dbStore.customers.get(id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const updates = req.body;
  const updatedCustomer: CustomerEntity = {
    ...customer,
    ...updates,
    updatedAt: new Date(),
  };

  dbStore.customers.set(id, updatedCustomer);

  res.json({
    message: 'Customer updated successfully',
    customer: {
      ...updatedCustomer,
      createdAt: updatedCustomer.createdAt.toISOString().split('T')[0],
    },
  });
});

// DELETE /api/customers/:id - Deactivate customer (ADMIN only)
router.delete('/:id', requireAuth, requireRole('ADMIN'), (req: Request, res: Response) => {
  const { id } = req.params;
  const customer = dbStore.customers.get(id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  customer.status = 'inactive';
  customer.updatedAt = new Date();
  dbStore.customers.set(id, customer);

  res.json({ message: 'Customer marked as inactive' });
});

export default router;


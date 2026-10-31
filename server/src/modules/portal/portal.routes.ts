import { Router, Request, Response } from 'express';
import prisma from '../../db';
import { invoicePdfService } from '../invoice/invoice-pdf.service';
import { paymentService } from '../payment/payment.service';

const router = Router();

// Helper to extract customerId from request session (provided by Member 1) or query/header fallback
function getCustomerId(req: Request): string | null {
  // 1. From session user
  const user = (req as any).user;
  if (user?.customerId) return user.customerId;
  
  // 2. From custom header (for testing/portal context)
  const headerId = req.headers['x-customer-id'];
  if (headerId && typeof headerId === 'string') return headerId;

  // 3. From query parameter if development
  if (req.query.customerId && typeof req.query.customerId === 'string') {
    return req.query.customerId;
  }

  return null;
}

// GET /api/portal/invoices - Customer-scoped invoices list
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ message: 'Customer identity not found on session' });
    }

    const invoices = await prisma.invoice.findMany({
      where: { customerId },
      include: {
        lines: true,
        payments: true,
        subscription: {
          select: { subscriptionNumber: true, planName: true },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch customer invoices' });
  }
});

// GET /api/portal/invoices/:id - Customer-scoped invoice detail (prevents IDOR)
router.get('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ message: 'Customer identity not found on session' });
    }

    const id = String(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        lines: true,
        payments: true,
        discounts: true,
        subscription: true,
      },
    });

    // Enforce ownership: Return 404 to avoid information disclosure
    if (!invoice || invoice.customerId !== customerId) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch invoice' });
  }
});

// GET /api/portal/invoices/:id/pdf - Customer-scoped PDF download
router.get('/invoices/:id/pdf', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ message: 'Customer identity not found on session' });
    }

    const id = String(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        lines: true,
        payments: true,
        subscription: true,
      },
    });

    if (!invoice || invoice.customerId !== customerId) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    invoicePdfService.generatePdf(invoice, res);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to generate PDF' });
  }
});

// POST /api/portal/invoices/:id/pay - Customer self-service checkout
router.post('/invoices/:id/pay', async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ message: 'Customer identity not found on session' });
    }

    const id = String(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice || invoice.customerId !== customerId) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { paymentMethod, reference } = req.body;
    const amount = Number(req.body.amount || invoice.amountDue);

    const result = await paymentService.recordPayment({
      invoiceId: invoice.id,
      amount,
      paymentMethod: paymentMethod || 'Credit Card',
      reference: reference || `PORTAL-PAY-${Date.now()}`,
      notes: 'Settled via customer portal self-service checkout',
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Payment processing failed' });
  }
});

export default router;

import { Request, Response } from 'express';
import { paymentService } from './payment.service';

export class PaymentController {
  async list(req: Request, res: Response) {
    try {
      const { search, invoiceId, customerId, page, limit } = req.query;
      const take = limit ? Number(limit) : 50;
      const skip = page ? (Number(page) - 1) * take : 0;

      const result = await paymentService.listPayments({
        search: search as string,
        invoiceId: invoiceId as string,
        customerId: customerId as string,
        limit: take,
        offset: skip,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to list payments' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const payment = await paymentService.getPaymentById(id);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch payment' });
    }
  }

  async record(req: Request, res: Response) {
    try {
      const { invoiceId, amount, paymentMethod, reference, notes, paymentDate } = req.body;
      if (!invoiceId || amount === undefined || !paymentMethod || !reference) {
        return res.status(400).json({ message: 'invoiceId, amount, paymentMethod, and reference are required' });
      }

      const result = await paymentService.recordPayment({
        invoiceId,
        amount: Number(amount),
        paymentMethod,
        reference,
        notes,
        paymentDate,
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to record payment' });
    }
  }
}

export const paymentController = new PaymentController();

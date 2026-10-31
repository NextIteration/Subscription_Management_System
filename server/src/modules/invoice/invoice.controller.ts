import { Request, Response } from 'express';
import { invoiceService } from './invoice.service';
import { invoicePdfService } from './invoice-pdf.service';

export class InvoiceController {
  async list(req: Request, res: Response) {
    try {
      const { status, customerId, search, page, limit } = req.query;
      const take = limit ? Number(limit) : 50;
      const skip = page ? (Number(page) - 1) * take : 0;

      const result = await invoiceService.listInvoices({
        status: status as string,
        customerId: customerId as string,
        search: search as string,
        limit: take,
        offset: skip,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to list invoices' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const invoice = await invoiceService.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch invoice' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { customerId, subscriptionId, issueDate, dueDate, paymentTerms, notes, lines, discountAmount } = req.body;
      if (!customerId || !dueDate || !lines || !Array.isArray(lines) || lines.length === 0) {
        return res.status(400).json({ message: 'customerId, dueDate, and at least one line item are required' });
      }

      const created = await invoiceService.createAdHocInvoice({
        customerId,
        subscriptionId,
        issueDate,
        dueDate,
        paymentTerms,
        notes,
        lines,
        discountAmount: discountAmount ? Number(discountAmount) : 0,
      });

      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to create invoice' });
    }
  }

  async confirm(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const updated = await invoiceService.confirmInvoice(id);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to confirm invoice' });
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const updated = await invoiceService.cancelInvoice(id);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to cancel invoice' });
    }
  }

  async send(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await invoiceService.sendInvoice(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to send invoice' });
    }
  }

  async downloadPdf(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const invoice = await invoiceService.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      invoicePdfService.generatePdf(invoice, res);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to generate invoice PDF' });
    }
  }
}

export const invoiceController = new InvoiceController();

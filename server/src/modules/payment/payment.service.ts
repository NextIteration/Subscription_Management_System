import prisma from '../../db';

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  notes?: string;
  paymentDate?: Date | string;
}

export class PaymentService {
  async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.payment.count();
    const sequence = String(count + 1).padStart(4, '0');
    return `PAY-${year}-${sequence}`;
  }

  async listPayments(filters?: {
    search?: string;
    invoiceId?: string;
    customerId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.search) {
      const q = filters.search.trim();
      where.OR = [
        { paymentNumber: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { reference: { contains: q, mode: 'insensitive' } },
        { invoice: { invoiceNumber: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: { invoiceNumber: true, totalAmount: true, amountDue: true },
          },
          customer: {
            select: { name: true, email: true, company: true },
          },
        },
        orderBy: { paymentDate: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
    ]);

    return { total, items };
  }

  async getPaymentById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: true,
        customer: true,
      },
    });
  }

  async recordPayment(data: RecordPaymentInput) {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Fetch invoice with lock / fresh state
      const invoice = await tx.invoice.findUnique({
        where: { id: data.invoiceId },
      });

      if (!invoice) {
        throw new Error(`Invoice ${data.invoiceId} not found`);
      }

      if (['DRAFT', 'CANCELLED'].includes(invoice.status)) {
        throw new Error(`Cannot record payment against an invoice in "${invoice.status}" status`);
      }

      if (invoice.status === 'PAID' || invoice.amountDue <= 0) {
        throw new Error('This invoice has already been fully paid');
      }

      if (amount > invoice.amountDue + 0.001) {
        throw new Error(`Payment amount ($${amount.toFixed(2)}) exceeds outstanding balance ($${invoice.amountDue.toFixed(2)})`);
      }

      const paymentNumber = await this.generatePaymentNumber();
      const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();

      // 2. Create Payment record
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          amount,
          paymentMethod: data.paymentMethod,
          paymentDate,
          reference: data.reference,
          status: 'completed',
          notes: data.notes || '',
        },
      });

      // 3. Update Invoice amounts & status
      const newAmountPaid = Number((invoice.amountPaid + amount).toFixed(2));
      const newAmountDue = Math.max(0, Number((invoice.totalAmount - newAmountPaid).toFixed(2)));
      const newStatus = newAmountDue <= 0 ? 'PAID' : invoice.status;

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus,
        },
      });

      return { payment, invoice: updatedInvoice };
    });
  }
}

export const paymentService = new PaymentService();


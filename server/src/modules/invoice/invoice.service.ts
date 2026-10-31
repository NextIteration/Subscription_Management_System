import prisma from '../../db';
import { discountService } from '../discount/discount.service';
import { invoicePdfService } from './invoice-pdf.service';
import { emailService } from '../email/email.service';

export interface CreateAdHocInvoiceInput {
  customerId: string;
  subscriptionId?: string;
  issueDate?: Date | string;
  dueDate: Date | string;
  paymentTerms?: string;
  notes?: string;
  lines: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    taxRuleId?: string;
  }[];
  discountAmount?: number;
}

export class InvoiceService {
  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();
    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${year}-${sequence}`;
  }

  async listInvoices(filters?: {
    status?: string;
    customerId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    // Check and update overdue status first
    await this.detectOverdueInvoices();

    const where: any = {};

    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.search) {
      const q = filters.search.trim();
      where.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: {
          lines: true,
          payments: true,
          discounts: true,
          subscription: {
            select: { subscriptionNumber: true, planName: true },
          },
        },
        orderBy: { issueDate: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
    ]);

    return { total, items };
  }

  async getInvoiceById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        lines: {
          include: { taxRule: true },
        },
        payments: true,
        discounts: true,
        subscription: true,
        customer: true,
      },
    });
  }

  async createAdHocInvoice(data: CreateAdHocInvoiceInput) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new Error('Customer not found');

    const invoiceNumber = await this.generateInvoiceNumber();
    const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
    const dueDate = new Date(data.dueDate);

    // Calculate line totals and taxes
    let subtotal = 0;
    let taxAmount = 0;

    const calculatedLines = data.lines.map((l) => {
      const lineSub = Number((l.quantity * l.unitPrice).toFixed(2));
      const rate = l.taxRate || 0;
      const lineTax = Number(((lineSub * rate) / 100).toFixed(2));
      const total = Number((lineSub + lineTax).toFixed(2));

      subtotal += lineSub;
      taxAmount += lineTax;

      return {
        productId: l.productId,
        productName: l.productName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: rate,
        taxAmount: lineTax,
        taxRuleId: l.taxRuleId || null,
        lineTotal: total,
      };
    });

    const discountAmount = data.discountAmount || 0;
    const totalAmount = Number((subtotal + taxAmount - discountAmount).toFixed(2));

    return prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: data.customerId,
        subscriptionId: data.subscriptionId || null,
        customerName: customer.name,
        customerEmail: customer.email,
        issueDate,
        dueDate,
        status: 'DRAFT',
        subtotal: Number(subtotal.toFixed(2)),
        taxAmount: Number(taxAmount.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        totalAmount,
        amountPaid: 0,
        amountDue: totalAmount,
        paymentTerms: data.paymentTerms || 'NET30',
        notes: data.notes || '',
        lines: {
          create: calculatedLines,
        },
      },
      include: {
        lines: true,
      },
    });
  }

  async generateInvoiceForSubscription(
    subscriptionId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
    billingAttemptId?: string
  ) {
    // 1. Idempotency Check
    const existing = await prisma.invoice.findFirst({
      where: {
        subscriptionId,
        billingPeriodStart,
        billingPeriodEnd,
        status: { not: 'CANCELLED' },
      },
      include: { lines: true },
    });

    if (existing) {
      return { invoice: existing, isDuplicate: true };
    }

    // 2. Fetch authoritative Subscription data from Member 1
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        customer: true,
        lines: true,
      },
    });

    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    if (subscription.status !== 'ACTIVE') {
      throw new Error(`Subscription ${subscription.subscriptionNumber} is not active (Status: ${subscription.status})`);
    }

    // 3. Resolve tax rules & build invoice lines
    const defaultTax = await prisma.taxRule.findFirst({ where: { isDefault: true, status: 'active' } });

    let subtotal = 0;
    let totalTax = 0;
    const productIds: string[] = [];

    const linesToCreate = [];

    for (const sLine of subscription.lines) {
      productIds.push(sLine.productId);
      const lineSub = Number((sLine.quantity * sLine.unitPrice).toFixed(2));

      // Resolve tax rule
      let taxRule = null;
      if (sLine.taxReference) {
        taxRule = await prisma.taxRule.findUnique({ where: { code: sLine.taxReference } });
      }
      if (!taxRule) taxRule = defaultTax;

      const rate = taxRule?.ratePercentage || sLine.taxRate || 0;
      const lineTax = Number(((lineSub * rate) / 100).toFixed(2));
      const lineTotal = Number((lineSub + lineTax).toFixed(2));

      subtotal += lineSub;
      totalTax += lineTax;

      linesToCreate.push({
        productId: sLine.productId,
        productName: sLine.productName,
        variantId: sLine.variantId || null,
        variantName: sLine.variantName || null,
        quantity: sLine.quantity,
        unitPrice: sLine.unitPrice,
        taxRuleId: taxRule?.id || null,
        taxRate: rate,
        taxAmount: lineTax,
        lineTotal,
      });
    }

    // 4. Check eligible discounts
    const eligibleDiscounts = await discountService.checkEligibility(subtotal, productIds);
    let totalDiscount = 0;
    const discountsToCreate: any[] = [];

    for (const disc of eligibleDiscounts) {
      let applied = 0;
      if (disc.type === 'percentage') {
        applied = Number(((subtotal * disc.value) / 100).toFixed(2));
      } else {
        applied = Math.min(disc.value, subtotal);
      }

      if (applied > 0) {
        totalDiscount += applied;
        discountsToCreate.push({
          discountRuleId: disc.id,
          discountCode: disc.code,
          discountType: disc.type,
          discountValue: disc.value,
          appliedAmount: applied,
        });

        // Increment discount usage
        await discountService.incrementUsage(disc.id);
      }
    }

    const totalAmount = Math.max(0, Number((subtotal + totalTax - totalDiscount).toFixed(2)));
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate due date based on payment terms
    const dueDate = new Date(billingPeriodStart);
    if (subscription.paymentTerms === 'NET15') dueDate.setDate(dueDate.getDate() + 15);
    else if (subscription.paymentTerms === 'NET30') dueDate.setDate(dueDate.getDate() + 30);
    else if (subscription.paymentTerms === 'NET60') dueDate.setDate(dueDate.getDate() + 60);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        subscriptionId: subscription.id,
        billingPeriodStart,
        billingPeriodEnd,
        customerId: subscription.customerId,
        customerName: subscription.customer.name,
        customerEmail: subscription.customer.email,
        issueDate: billingPeriodStart,
        dueDate,
        status: 'CONFIRMED', // Generated recurring invoices are confirmed
        subtotal: Number(subtotal.toFixed(2)),
        taxAmount: Number(totalTax.toFixed(2)),
        discountAmount: Number(totalDiscount.toFixed(2)),
        totalAmount,
        amountPaid: 0,
        amountDue: totalAmount,
        paymentTerms: subscription.paymentTerms,
        notes: `Automated recurring invoice for subscription ${subscription.subscriptionNumber}`,
        lines: { create: linesToCreate },
        discounts: { create: discountsToCreate },
      },
      include: {
        lines: true,
        discounts: true,
      },
    });

    return { invoice, isDuplicate: false };
  }

  async confirmInvoice(id: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'DRAFT') {
      throw new Error(`Cannot confirm invoice with status "${invoice.status}". Only DRAFT invoices can be confirmed.`);
    }

    return prisma.invoice.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });
  }

  async cancelInvoice(id: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'PAID') {
      throw new Error('Cannot cancel an invoice that has already been paid.');
    }

    return prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async sendInvoice(id: string) {
    const invoice = await this.getInvoiceById(id);
    if (!invoice) throw new Error('Invoice not found');

    if (invoice.status === 'CANCELLED') {
      throw new Error('Cannot send a cancelled invoice.');
    }

    if (!invoice.customerEmail) {
      throw new Error('Customer does not have a valid email address on record.');
    }

    // 1. Generate PDF document in-memory
    const pdfBuffer = await invoicePdfService.generatePdfBuffer(invoice);

    // 2. Dispatch via Nodemailer SMTP service
    const emailResult = await emailService.sendInvoiceEmail(invoice, pdfBuffer);

    // 3. If invoice was DRAFT, advance it to CONFIRMED
    const newStatus = invoice.status === 'DRAFT' ? 'CONFIRMED' : invoice.status;
    const dispatchNote = `[Dispatched via Email] Sent to ${emailResult.to} on ${new Date().toISOString().split('T')[0]}`;
    const updatedNotes = invoice.notes ? `${invoice.notes}\n${dispatchNote}` : dispatchNote;

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: newStatus,
        notes: updatedNotes,
      },
      include: {
        lines: true,
        payments: true,
        discounts: true,
        subscription: true,
      },
    });

    return { invoice: updated, emailResult };
  }

  async detectOverdueInvoices() {
    const now = new Date();
    await prisma.invoice.updateMany({
      where: {
        status: 'CONFIRMED',
        dueDate: { lt: now },
        amountDue: { gt: 0 },
      },
      data: {
        status: 'OVERDUE',
      },
    });
  }
}

export const invoiceService = new InvoiceService();

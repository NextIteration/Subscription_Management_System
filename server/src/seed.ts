import prisma from './db';
import {
  initialCustomers,
  initialProducts,
  initialPlans,
  initialSubscriptions,
  initialTaxRules,
  initialDiscountRules,
  initialInvoices,
  initialPayments,
} from '../../src/data/mockData';

export async function seedDatabase() {
  const taxCount = await prisma.taxRule.count();
  if (taxCount > 0) {
    return; // Already seeded
  }

  console.log('[Seed] Seeding initial database records...');

  // 1. Seed Tax Rules
  for (const t of initialTaxRules) {
    await prisma.taxRule.upsert({
      where: { code: t.code },
      update: {},
      create: {
        id: t.id,
        name: t.name,
        code: t.code,
        ratePercentage: t.ratePercentage,
        country: t.country,
        state: t.state || null,
        description: t.description,
        isDefault: t.isDefault,
        status: t.status,
      },
    });
  }

  // 2. Seed Customers
  for (const c of initialCustomers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        address: c.address,
        taxNumber: c.taxNumber,
        status: c.status,
      },
    });
  }

  // 3. Seed Products
  for (const p of initialProducts) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        type: p.type,
        salesPrice: p.salesPrice,
        costPrice: p.costPrice,
        status: p.status,
      },
    });
  }

  // 4. Seed Discount Rules
  for (const d of initialDiscountRules) {
    await prisma.discountRule.upsert({
      where: { code: d.code },
      update: {},
      create: {
        id: d.id,
        code: d.code,
        description: d.description,
        type: d.type,
        value: d.value,
        minOrderAmount: d.minOrderAmount,
        validFrom: new Date(d.validFrom),
        validUntil: new Date(d.validUntil),
        maxUses: d.maxUses,
        usedCount: d.usedCount,
        status: d.status,
      },
    });
  }

  // 5. Seed Subscriptions
  for (const s of initialSubscriptions) {
    await prisma.subscription.upsert({
      where: { subscriptionNumber: s.subscriptionNumber },
      update: {},
      create: {
        id: s.id,
        subscriptionNumber: s.subscriptionNumber,
        customerId: s.customerId,
        planId: s.planId,
        planName: s.planName,
        billingFrequency: s.billingFrequency,
        status: s.status,
        startDate: new Date(s.startDate),
        expiryDate: new Date(s.expiryDate),
        nextBillingDate: new Date(s.nextBillingDate),
        paymentTerms: s.paymentTerms,
        taxReference: s.taxReference,
        subtotal: s.subtotal,
        taxTotal: s.taxTotal,
        totalAmount: s.totalAmount,
        autoRenew: s.autoRenew,
        renewalNotificationDays: s.renewalNotificationDays,
        lines: {
          create: s.lines.map((l) => ({
            productId: l.productId,
            productName: l.productName,
            variantId: l.variantId,
            variantName: l.variantName,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate,
            taxReference: s.taxReference,
            lineTotal: l.lineTotal,
          })),
        },
      },
    });
  }

  // 6. Seed Invoices
  for (const inv of initialInvoices) {
    await prisma.invoice.upsert({
      where: { invoiceNumber: inv.invoiceNumber },
      update: {},
      create: {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        subscriptionId: inv.subscriptionId || null,
        customerId: inv.customerId,
        customerName: inv.customerName,
        customerEmail: inv.customerEmail,
        issueDate: new Date(inv.issueDate),
        dueDate: new Date(inv.dueDate),
        status: inv.status.toUpperCase() === 'ISSUED' ? 'CONFIRMED' : inv.status.toUpperCase(),
        subtotal: inv.subtotal,
        taxAmount: inv.taxAmount,
        discountAmount: inv.discountAmount,
        totalAmount: inv.totalAmount,
        amountPaid: inv.amountPaid,
        amountDue: inv.amountDue,
        paymentTerms: inv.paymentTerms,
        notes: inv.notes,
        lines: {
          create: inv.lines.map((l) => ({
            productId: l.productId,
            productName: l.productName,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate,
            taxAmount: Number(((l.quantity * l.unitPrice * l.taxRate) / 100).toFixed(2)),
            lineTotal: l.lineTotal,
          })),
        },
      },
    });
  }

  // 7. Seed Payments
  for (const p of initialPayments) {
    // Only if invoice exists
    const inv = await prisma.invoice.findUnique({ where: { invoiceNumber: p.invoiceNumber } });
    if (inv) {
      await prisma.payment.upsert({
        where: { paymentNumber: p.paymentNumber },
        update: {},
        create: {
          id: p.id,
          paymentNumber: p.paymentNumber,
          invoiceId: inv.id,
          customerId: p.customerId,
          customerName: p.customerName,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          paymentDate: new Date(p.paymentDate),
          reference: p.reference,
          status: p.status,
          notes: p.notes,
        },
      });
    }
  }

  console.log('[Seed] Database successfully seeded with base demo records.');
}


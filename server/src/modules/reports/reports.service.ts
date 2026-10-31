import prisma from '../../db';

export class ReportsService {
  async getFinancialSummary(customerId?: string) {
    const whereInvoice: any = customerId ? { customerId } : {};

    // 1. Run overdue detection check
    const now = new Date();
    await prisma.invoice.updateMany({
      where: {
        status: 'CONFIRMED',
        dueDate: { lt: now },
        amountDue: { gt: 0 },
      },
      data: { status: 'OVERDUE' },
    });

    // 2. Fetch invoice aggregations
    const allInvoices = await prisma.invoice.findMany({
      where: whereInvoice,
      select: {
        totalAmount: true,
        amountPaid: true,
        amountDue: true,
        status: true,
      },
    });

    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueInvoicesCount = 0;

    for (const inv of allInvoices) {
      if (inv.status !== 'CANCELLED') {
        totalBilled += inv.totalAmount;
        totalCollected += inv.amountPaid;
        totalOutstanding += inv.amountDue;

        if (inv.status === 'OVERDUE' || (inv.amountDue > 0 && inv.status === 'overdue')) {
          totalOverdue += inv.amountDue;
          overdueInvoicesCount++;
        }
      }
    }

    // 3. Active Subscriptions & MRR calculation
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        ...(customerId ? { customerId } : {}),
      },
      select: {
        totalAmount: true,
        billingFrequency: true,
      },
    });

    let mrr = 0;
    for (const sub of activeSubscriptions) {
      const freq = sub.billingFrequency.toLowerCase();
      if (freq === 'monthly') mrr += sub.totalAmount;
      else if (freq === 'yearly') mrr += sub.totalAmount / 12;
      else if (freq === 'weekly') mrr += sub.totalAmount * 4.33;
      else if (freq === 'daily') mrr += sub.totalAmount * 30;
      else mrr += sub.totalAmount;
    }

    const arr = mrr * 12;
    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 100;

    return {
      totalRevenue: Number(totalCollected.toFixed(2)),
      totalBilled: Number(totalBilled.toFixed(2)),
      mrr: Number(mrr.toFixed(2)),
      arr: Number(arr.toFixed(2)),
      totalOutstanding: Number(totalOutstanding.toFixed(2)),
      totalOverdue: Number(totalOverdue.toFixed(2)),
      activeSubscriptionsCount: activeSubscriptions.length,
      overdueInvoicesCount,
      collectionRate: Number(collectionRate.toFixed(1)),
    };
  }

  async getRevenueTrend(timeRange = '30d') {
    // Generate monthly aggregation
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: { gte: sixMonthsAgo },
        status: { not: 'CANCELLED' },
      },
      select: {
        issueDate: true,
        totalAmount: true,
        amountPaid: true,
        amountDue: true,
        status: true,
      },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map<string, { revenue: number; collections: number; overdue: number }>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap.set(key, { revenue: 0, collections: 0, overdue: 0 });
    }

    for (const inv of invoices) {
      const d = new Date(inv.issueDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyMap.has(key)) {
        const item = monthlyMap.get(key)!;
        item.revenue += inv.totalAmount;
        item.collections += inv.amountPaid;
        if (inv.status === 'OVERDUE') item.overdue += inv.amountDue;
      }
    }

    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month: month.split(' ')[0],
      revenue: Number(data.revenue.toFixed(2)),
      collections: Number(data.collections.toFixed(2)),
      overdue: Number(data.overdue.toFixed(2)),
    }));
  }

  async getAgingReport() {
    const now = new Date();
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        amountDue: { gt: 0 },
        status: { notIn: ['DRAFT', 'CANCELLED', 'PAID'] },
      },
      select: {
        dueDate: true,
        amountDue: true,
      },
    });

    const brackets = {
      Current: 0,
      '1-15d': 0,
      '16-30d': 0,
      '31-60d': 0,
      '60d+': 0,
    };

    for (const inv of unpaidInvoices) {
      const diffMs = now.getTime() - new Date(inv.dueDate).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) brackets.Current += inv.amountDue;
      else if (diffDays <= 15) brackets['1-15d'] += inv.amountDue;
      else if (diffDays <= 30) brackets['16-30d'] += inv.amountDue;
      else if (diffDays <= 60) brackets['31-60d'] += inv.amountDue;
      else brackets['60d+'] += inv.amountDue;
    }

    return Object.entries(brackets).map(([bracket, amount]) => ({
      bracket,
      amount: Number(amount.toFixed(2)),
    }));
  }
}

export const reportsService = new ReportsService();


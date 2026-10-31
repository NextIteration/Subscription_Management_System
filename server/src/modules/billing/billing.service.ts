import prisma from '../../db';
import { invoiceService } from '../invoice/invoice.service';

export class BillingService {
  calculateNextDate(currentDate: Date, frequency: string): Date {
    const next = new Date(currentDate);
    switch (frequency.toLowerCase()) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setMonth(next.getMonth() + 1);
    }
    return next;
  }

  async runBillingCycle() {
    const now = new Date();

    // 1. Create a BillingRun log
    const billingRun = await prisma.billingRun.create({
      data: {
        startedAt: now,
        status: 'running',
      },
    });

    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    try {
      // 2. Find all eligible ACTIVE subscriptions due for billing
      const dueSubscriptions = await prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          nextBillingDate: { lte: now },
        },
        include: {
          lines: true,
          customer: true,
        },
      });

      totalProcessed = dueSubscriptions.length;

      // 3. Process each subscription individually
      for (const sub of dueSubscriptions) {
        const periodStart = new Date(sub.nextBillingDate);
        const periodEnd = this.calculateNextDate(periodStart, sub.billingFrequency);

        // Create billing attempt record (ensures auditability)
        const attempt = await prisma.billingAttempt.create({
          data: {
            billingRunId: billingRun.id,
            subscriptionId: sub.id,
            billingPeriodStart: periodStart,
            billingPeriodEnd: periodEnd,
            status: 'pending',
          },
        });

        try {
          // Generate invoice idempotently
          const { invoice, isDuplicate } = await invoiceService.generateInvoiceForSubscription(
            sub.id,
            periodStart,
            periodEnd,
            attempt.id
          );

          if (isDuplicate) {
            totalSkipped++;
            await prisma.billingAttempt.update({
              where: { id: attempt.id },
              data: {
                status: 'skipped_duplicate',
                invoiceId: invoice.id,
              },
            });
          } else {
            totalSucceeded++;
            await prisma.billingAttempt.update({
              where: { id: attempt.id },
              data: {
                status: 'success',
                invoiceId: invoice.id,
              },
            });

            // Advance subscription's next billing date
            await prisma.subscription.update({
              where: { id: sub.id },
              data: {
                nextBillingDate: periodEnd,
              },
            });
          }
        } catch (err: any) {
          totalFailed++;
          await prisma.billingAttempt.update({
            where: { id: attempt.id },
            data: {
              status: 'failed',
              errorMessage: err.message || 'Billing attempt failed',
            },
          });
          // Do not rethrow: continue loop to ensure other subscriptions are processed!
        }
      }

      // 4. Update BillingRun summary
      return prisma.billingRun.update({
        where: { id: billingRun.id },
        data: {
          completedAt: new Date(),
          status: 'completed',
          totalProcessed,
          totalSucceeded,
          totalFailed,
          totalSkipped,
        },
        include: {
          attempts: true,
        },
      });
    } catch (criticalError: any) {
      return prisma.billingRun.update({
        where: { id: billingRun.id },
        data: {
          completedAt: new Date(),
          status: 'failed',
          errorMessage: criticalError.message,
          totalProcessed,
          totalSucceeded,
          totalFailed,
          totalSkipped,
        },
      });
    }
  }

  async retryFailedAttempt(attemptId: string) {
    const attempt = await prisma.billingAttempt.findUnique({
      where: { id: attemptId },
      include: { subscription: true },
    });

    if (!attempt) throw new Error('Billing attempt not found');
    if (attempt.status === 'success') throw new Error('Cannot retry an already successful attempt');

    try {
      const { invoice } = await invoiceService.generateInvoiceForSubscription(
        attempt.subscriptionId,
        attempt.billingPeriodStart,
        attempt.billingPeriodEnd,
        attempt.id
      );

      const updated = await prisma.billingAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'success',
          invoiceId: invoice.id,
          attemptNumber: attempt.attemptNumber + 1,
          errorMessage: null,
        },
      });

      // Advance subscription nextBillingDate if appropriate
      await prisma.subscription.update({
        where: { id: attempt.subscriptionId },
        data: { nextBillingDate: attempt.billingPeriodEnd },
      });

      return updated;
    } catch (err: any) {
      return prisma.billingAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'failed',
          attemptNumber: attempt.attemptNumber + 1,
          errorMessage: err.message || 'Retry failed',
        },
      });
    }
  }

  async listBillingRuns(limit = 20) {
    return prisma.billingRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        attempts: {
          take: 10,
        },
      },
    });
  }
}

export const billingService = new BillingService();


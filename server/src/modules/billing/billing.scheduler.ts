import cron, { ScheduledTask } from 'node-cron';
import { billingService } from './billing.service';

let schedulerTask: ScheduledTask | null = null;

export function initBillingScheduler() {
  // Run daily at midnight: '0 0 * * *'
  // For development/testing, can be configured via BILLING_CRON_SCHEDULE env var
  const schedule = process.env.BILLING_CRON_SCHEDULE || '0 0 * * *';

  schedulerTask = cron.schedule(schedule, async () => {
    console.log(`[BillingScheduler] Running scheduled recurring billing cycle at ${new Date().toISOString()}...`);
    try {
      const summary = await billingService.runBillingCycle();
      console.log(`[BillingScheduler] Completed. Processed: ${summary.totalProcessed}, Succeeded: ${summary.totalSucceeded}, Failed: ${summary.totalFailed}`);
    } catch (err: any) {
      console.error('[BillingScheduler] Error executing automated billing run:', err);
    }
  });

  console.log(`[BillingScheduler] Initialized with schedule pattern: "${schedule}"`);
}

export function stopBillingScheduler() {
  if (schedulerTask) {
    schedulerTask.stop();
    console.log('[BillingScheduler] Scheduler stopped.');
  }
}

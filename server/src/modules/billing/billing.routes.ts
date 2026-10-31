import { Router, Request, Response } from 'express';
import { billingService } from './billing.service';

const router = Router();

router.get('/runs', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const runs = await billingService.listBillingRuns(limit);
    res.json(runs);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to list billing runs' });
  }
});

router.post('/run', async (req: Request, res: Response) => {
  try {
    const result = await billingService.runBillingCycle();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to trigger billing cycle' });
  }
});

router.post('/retry/:attemptId', async (req: Request, res: Response) => {
  try {
    const attemptId = String(req.params.attemptId);
    const result = await billingService.retryFailedAttempt(attemptId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to retry billing attempt' });
  }
});

export default router;

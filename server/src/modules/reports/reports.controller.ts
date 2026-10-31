import { Request, Response } from 'express';
import { reportsService } from './reports.service';

export class ReportsController {
  async getSummary(req: Request, res: Response) {
    try {
      const customerId = req.query.customerId as string;
      const summary = await reportsService.getFinancialSummary(customerId);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch financial summary' });
    }
  }

  async getRevenueTrend(req: Request, res: Response) {
    try {
      const timeRange = (req.query.timeRange as string) || '30d';
      const trend = await reportsService.getRevenueTrend(timeRange);
      res.json(trend);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch revenue trend' });
    }
  }

  async getAging(req: Request, res: Response) {
    try {
      const aging = await reportsService.getAgingReport();
      res.json(aging);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch aging report' });
    }
  }
}

export const reportsController = new ReportsController();


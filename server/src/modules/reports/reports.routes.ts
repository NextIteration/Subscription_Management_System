import { Router } from 'express';
import { reportsController } from './reports.controller';

const router = Router();

router.get('/summary', (req, res) => reportsController.getSummary(req, res));
router.get('/revenue-trend', (req, res) => reportsController.getRevenueTrend(req, res));
router.get('/aging', (req, res) => reportsController.getAging(req, res));

export default router;


import { Router } from 'express';
import { paymentController } from './payment.controller';

const router = Router();

router.get('/', (req, res) => paymentController.list(req, res));
router.get('/:id', (req, res) => paymentController.getById(req, res));
router.post('/', (req, res) => paymentController.record(req, res));

export default router;


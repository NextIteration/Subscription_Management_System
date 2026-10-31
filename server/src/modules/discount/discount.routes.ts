import { Router } from 'express';
import { discountController } from './discount.controller';

const router = Router();

router.get('/', (req, res) => discountController.list(req, res));
router.get('/eligible', (req, res) => discountController.checkEligibility(req, res));
router.get('/:id', (req, res) => discountController.getById(req, res));
router.post('/', (req, res) => discountController.create(req, res));
router.put('/:id', (req, res) => discountController.update(req, res));
router.patch('/:id/status', (req, res) => discountController.toggleStatus(req, res));

export default router;


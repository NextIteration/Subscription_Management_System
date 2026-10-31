import { Router } from 'express';
import { taxController } from './tax.controller';

const router = Router();

router.get('/', (req, res) => taxController.list(req, res));
router.get('/default', (req, res) => taxController.getDefault(req, res));
router.get('/:id', (req, res) => taxController.getById(req, res));
router.post('/', (req, res) => taxController.create(req, res));
router.put('/:id', (req, res) => taxController.update(req, res));
router.patch('/:id/status', (req, res) => taxController.toggleStatus(req, res));

export default router;


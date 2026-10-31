import { Router } from 'express';
import { invoiceController } from './invoice.controller';

const router = Router();

router.get('/', (req, res) => invoiceController.list(req, res));
router.get('/:id', (req, res) => invoiceController.getById(req, res));
router.get('/:id/pdf', (req, res) => invoiceController.downloadPdf(req, res));
router.post('/', (req, res) => invoiceController.create(req, res));
router.patch('/:id/confirm', (req, res) => invoiceController.confirm(req, res));
router.patch('/:id/cancel', (req, res) => invoiceController.cancel(req, res));
router.patch('/:id/send', (req, res) => invoiceController.send(req, res));

export default router;

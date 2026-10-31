import { Router } from 'express';
import taxRoutes from './modules/tax/tax.routes';
import discountRoutes from './modules/discount/discount.routes';
import invoiceRoutes from './modules/invoice/invoice.routes';
import paymentRoutes from './modules/payment/payment.routes';
import billingRoutes from './modules/billing/billing.routes';
import reportsRoutes from './modules/reports/reports.routes';
import portalRoutes from './modules/portal/portal.routes';

export const member2Router = Router();

member2Router.use('/tax-rules', taxRoutes);
member2Router.use('/discount-rules', discountRoutes);
member2Router.use('/invoices', invoiceRoutes);
member2Router.use('/payments', paymentRoutes);
member2Router.use('/billing', billingRoutes);
member2Router.use('/reports', reportsRoutes);
member2Router.use('/portal', portalRoutes);

export default member2Router;


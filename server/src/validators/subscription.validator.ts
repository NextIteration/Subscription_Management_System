import { z } from 'zod';

export const subscriptionLineItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productName: z.string().min(1, 'Product name is required'),
  variantId: z.string().optional(),
  variantName: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).default(0),
  lineTotal: z.number().min(0),
});

export const subscriptionSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  planId: z.string().min(1, 'Plan is required'),
  billingFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: z.string().min(1, 'Start date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  nextBillingDate: z.string().optional(),
  paymentTerms: z.enum(['IMMEDIATE', 'NET15', 'NET30', 'NET60']).default('NET30'),
  taxReference: z.string().optional().default(''),
  lines: z.array(subscriptionLineItemSchema).min(1, 'At least one line item is required'),
  subtotal: z.number().min(0),
  taxTotal: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  autoRenew: z.boolean().default(false),
  renewalNotificationDays: z.number().int().min(1).default(14),
});

export const pauseSubscriptionSchema = z.object({
  reason: z.string().min(3, 'Pause reason must be provided (at least 3 characters)'),
});

export const closeSubscriptionSchema = z.object({
  reason: z.string().min(3, 'Closure reason must be provided (at least 3 characters)'),
});

export const updateRenewalSchema = z.object({
  autoRenew: z.boolean(),
  renewalNotificationDays: z.number().int().min(1).max(90),
});

export const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED']),
  reason: z.string().optional(),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type PauseSubscriptionInput = z.infer<typeof pauseSubscriptionSchema>;
export type CloseSubscriptionInput = z.infer<typeof closeSubscriptionSchema>;
export type UpdateRenewalInput = z.infer<typeof updateRenewalSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;


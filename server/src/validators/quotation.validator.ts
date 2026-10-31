import { z } from 'zod';

export const quotationTemplateLineSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
});

export const quotationTemplateSchema = z.object({
  name: z.string().min(2, 'Template name is required'),
  description: z.string().optional(),
  planId: z.string().min(1, 'Plan ID is required'),
  validityDays: z.number().int().min(1).default(30),
  defaultLines: z.array(quotationTemplateLineSchema).min(1, 'At least one product line is required'),
});

export const quotationLineItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productName: z.string().min(1, 'Product name is required'),
  variantId: z.string().optional(),
  variantName: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).default(0),
  lineTotal: z.number().min(0),
});

export const quotationSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  planId: z.string().min(1, 'Plan is required'),
  templateId: z.string().optional(),
  validUntil: z.string().min(1, 'Validity date is required'),
  lines: z.array(quotationLineItemSchema).min(1, 'At least one line item is required'),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
});

export type QuotationTemplateInput = z.infer<typeof quotationTemplateSchema>;
export type QuotationInput = z.infer<typeof quotationSchema>;
export type QuotationLineItemInput = z.infer<typeof quotationLineItemSchema>;


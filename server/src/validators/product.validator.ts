import { z } from 'zod';

export const productVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().min(1, 'SKU is required'),
  priceAdjustment: z.number().default(0),
  description: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  type: z.enum(['Software License', 'Cloud Service', 'API Access', 'Support & Service']),
  salesPrice: z.number().min(0, 'Sales price must be positive'),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  notes: z.string().optional().default(''),
  status: z.enum(['active', 'archived']).default('active'),
  variants: z.array(productVariantSchema).default([]),
});

export const updateProductSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;


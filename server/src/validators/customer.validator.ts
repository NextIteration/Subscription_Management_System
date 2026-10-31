import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  phone: z.string().optional(),
  company: z.string().min(1, 'Company name is required'),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const updateCustomerSchema = customerSchema.partial();

export type CustomerInput = z.infer<typeof customerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;


import { z } from 'zod';

export const planSchema = z
  .object({
    name: z.string().min(2, 'Plan name must be at least 2 characters'),
    code: z.string().min(2, 'Plan code is required'),
    billingFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    minimumQuantity: z.number().int().min(1, 'Minimum quantity must be at least 1').default(1),
    price: z.number().min(0, 'Price must be positive'),
    availableFrom: z.string().min(1, 'Available from date is required'),
    availableUntil: z.string().min(1, 'Available until date is required'),
    autoRenewDefault: z.boolean().default(false),
    earlyClosurePenaltyPercentage: z.number().min(0).max(100, 'Penalty cannot exceed 100%').default(0),
    pauseAllowed: z.boolean().default(false),
    maxPauseDays: z.number().int().min(0).default(0),
    description: z.string().optional().default(''),
    status: z.enum(['active', 'archived']).default('active'),
  })
  .refine(
    (data) => {
      if (data.availableFrom && data.availableUntil) {
        return new Date(data.availableFrom) <= new Date(data.availableUntil);
      }
      return true;
    },
    {
      message: 'availableFrom date must be earlier than or equal to availableUntil',
      path: ['availableUntil'],
    }
  );

export const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
  billingFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  minimumQuantity: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  availableFrom: z.string().optional(),
  availableUntil: z.string().optional(),
  autoRenewDefault: z.boolean().optional(),
  earlyClosurePenaltyPercentage: z.number().min(0).max(100).optional(),
  pauseAllowed: z.boolean().optional(),
  maxPauseDays: z.number().int().min(0).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export type PlanInput = z.infer<typeof planSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;


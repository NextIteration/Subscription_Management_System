import prisma from '../../db';

export interface CreateDiscountRuleInput {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  validFrom: Date | string;
  validUntil: Date | string;
  maxUses: number;
  applicableProductIds?: string[];
}

export interface UpdateDiscountRuleInput {
  code?: string;
  description?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  minOrderAmount?: number;
  validFrom?: Date | string;
  validUntil?: Date | string;
  maxUses?: number;
  status?: string;
  applicableProductIds?: string[];
}

export class DiscountService {
  async listDiscountRules() {
    return prisma.discountRule.findMany({
      include: {
        applicableProducts: {
          include: {
            product: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDiscountRuleById(id: string) {
    return prisma.discountRule.findUnique({
      where: { id },
      include: {
        applicableProducts: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async getDiscountRuleByCode(code: string) {
    return prisma.discountRule.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: {
        applicableProducts: true,
      },
    });
  }

  async createDiscountRule(data: CreateDiscountRuleInput) {
    const validFrom = new Date(data.validFrom);
    const validUntil = new Date(data.validUntil);

    return prisma.discountRule.create({
      data: {
        code: data.code.trim().toUpperCase(),
        description: data.description,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount || 0,
        validFrom,
        validUntil,
        maxUses: data.maxUses,
        usedCount: 0,
        status: 'active',
        applicableProducts: data.applicableProductIds && data.applicableProductIds.length > 0
          ? {
              create: data.applicableProductIds.map((productId) => ({
                product: { connect: { id: productId } },
              })),
            }
          : undefined,
      },
      include: {
        applicableProducts: true,
      },
    });
  }

  async updateDiscountRule(id: string, data: UpdateDiscountRuleInput) {
    return prisma.$transaction(async (tx) => {
      // If applicableProductIds provided, replace them
      if (data.applicableProductIds !== undefined) {
        await tx.discountProduct.deleteMany({
          where: { discountRuleId: id },
        });

        if (data.applicableProductIds.length > 0) {
          await tx.discountProduct.createMany({
            data: data.applicableProductIds.map((productId) => ({
              discountRuleId: id,
              productId,
            })),
          });
        }
      }

      return tx.discountRule.update({
        where: { id },
        data: {
          ...(data.code !== undefined && { code: data.code.trim().toUpperCase() }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.value !== undefined && { value: data.value }),
          ...(data.minOrderAmount !== undefined && { minOrderAmount: data.minOrderAmount }),
          ...(data.validFrom !== undefined && { validFrom: new Date(data.validFrom) }),
          ...(data.validUntil !== undefined && { validUntil: new Date(data.validUntil) }),
          ...(data.maxUses !== undefined && { maxUses: data.maxUses }),
          ...(data.status !== undefined && { status: data.status }),
        },
        include: {
          applicableProducts: true,
        },
      });
    });
  }

  async checkEligibility(subtotal: number, productIds: string[] = []): Promise<any[]> {
    const now = new Date();
    const activeRules = await prisma.discountRule.findMany({
      where: {
        status: 'active',
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      include: {
        applicableProducts: true,
      },
    });

    return activeRules.filter((rule) => {
      // Usage limit check
      if (rule.usedCount >= rule.maxUses) return false;

      // Minimum order amount check
      if (subtotal < rule.minOrderAmount) return false;

      // Product applicability check (if restricted to specific products)
      if (rule.applicableProducts.length > 0) {
        const allowedIds = new Set(rule.applicableProducts.map((ap) => ap.productId));
        const hasApplicableProduct = productIds.some((id) => allowedIds.has(id));
        if (!hasApplicableProduct) return false;
      }

      return true;
    });
  }

  async incrementUsage(id: string) {
    const rule = await prisma.discountRule.findUnique({ where: { id } });
    if (!rule) return null;

    const newUsedCount = rule.usedCount + 1;
    const isNowExpired = newUsedCount >= rule.maxUses;

    return prisma.discountRule.update({
      where: { id },
      data: {
        usedCount: newUsedCount,
        ...(isNowExpired && { status: 'expired' }),
      },
    });
  }

  async toggleStatus(id: string, status: string) {
    return prisma.discountRule.update({
      where: { id },
      data: { status },
    });
  }
}

export const discountService = new DiscountService();


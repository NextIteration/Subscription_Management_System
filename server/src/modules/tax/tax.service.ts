import prisma from '../../db';

export interface CreateTaxRuleInput {
  name: string;
  code: string;
  ratePercentage: number;
  country: string;
  state?: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateTaxRuleInput {
  name?: string;
  code?: string;
  ratePercentage?: number;
  country?: string;
  state?: string;
  description?: string;
  isDefault?: boolean;
  status?: string;
}

export class TaxService {
  async listTaxRules() {
    return prisma.taxRule.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getTaxRuleById(id: string) {
    return prisma.taxRule.findUnique({
      where: { id },
    });
  }

  async getTaxRuleByCode(code: string) {
    return prisma.taxRule.findUnique({
      where: { code },
    });
  }

  async getDefaultTaxRule() {
    return prisma.taxRule.findFirst({
      where: { isDefault: true, status: 'active' },
    });
  }

  async createTaxRule(data: CreateTaxRuleInput) {
    // If setting as default, clear any existing default
    if (data.isDefault) {
      await prisma.taxRule.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.taxRule.create({
      data: {
        name: data.name,
        code: data.code.trim().toUpperCase(),
        ratePercentage: data.ratePercentage,
        country: data.country,
        state: data.state || null,
        description: data.description || '',
        isDefault: Boolean(data.isDefault),
        status: 'active',
      },
    });
  }

  async updateTaxRule(id: string, data: UpdateTaxRuleInput) {
    if (data.isDefault) {
      await prisma.taxRule.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return prisma.taxRule.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code.trim().toUpperCase() }),
        ...(data.ratePercentage !== undefined && { ratePercentage: data.ratePercentage }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.state !== undefined && { state: data.state || null }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  async toggleStatus(id: string, status: string) {
    return prisma.taxRule.update({
      where: { id },
      data: { status },
    });
  }
}

export const taxService = new TaxService();


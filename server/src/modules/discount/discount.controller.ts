import { Request, Response } from 'express';
import { discountService } from './discount.service';

export class DiscountController {
  async list(req: Request, res: Response) {
    try {
      const discounts = await discountService.listDiscountRules();
      res.json(discounts);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to list discount rules' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const discount = await discountService.getDiscountRuleById(id);
      if (!discount) {
        return res.status(404).json({ message: 'Discount rule not found' });
      }
      res.json(discount);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch discount rule' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        code,
        description,
        type,
        value,
        minOrderAmount,
        validFrom,
        validUntil,
        maxUses,
        applicableProductIds,
      } = req.body;

      if (!code || !description || !type || value === undefined || !validFrom || !validUntil || !maxUses) {
        return res.status(400).json({
          message: 'code, description, type, value, validFrom, validUntil, and maxUses are required',
        });
      }

      const existing = await discountService.getDiscountRuleByCode(code.trim().toUpperCase());
      if (existing) {
        return res.status(409).json({ message: `Discount rule with code "${code}" already exists` });
      }

      const created = await discountService.createDiscountRule({
        code,
        description,
        type,
        value: Number(value),
        minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : 0,
        validFrom,
        validUntil,
        maxUses: Number(maxUses),
        applicableProductIds,
      });

      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to create discount rule' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const {
        code,
        description,
        type,
        value,
        minOrderAmount,
        validFrom,
        validUntil,
        maxUses,
        status,
        applicableProductIds,
      } = req.body;

      if (code) {
        const existing = await discountService.getDiscountRuleByCode(code.trim().toUpperCase());
        if (existing && existing.id !== id) {
          return res.status(409).json({ message: `Discount rule with code "${code}" already exists` });
        }
      }

      const updated = await discountService.updateDiscountRule(id, {
        code,
        description,
        type,
        value: value !== undefined ? Number(value) : undefined,
        minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : undefined,
        validFrom,
        validUntil,
        maxUses: maxUses !== undefined ? Number(maxUses) : undefined,
        status,
        applicableProductIds,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to update discount rule' });
    }
  }

  async checkEligibility(req: Request, res: Response) {
    try {
      const subtotal = Number(req.query.subtotal) || 0;
      const productIds = req.query.productIds
        ? String(req.query.productIds).split(',')
        : [];

      const eligible = await discountService.checkEligibility(subtotal, productIds);
      res.json(eligible);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to check discount eligibility' });
    }
  }

  async toggleStatus(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      if (!status || !['active', 'expired', 'disabled'].includes(status)) {
        return res.status(400).json({ message: 'Status must be active, expired, or disabled' });
      }

      const updated = await discountService.toggleStatus(id, status);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to toggle discount rule status' });
    }
  }
}

export const discountController = new DiscountController();

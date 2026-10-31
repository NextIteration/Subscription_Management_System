import { Request, Response } from 'express';
import { taxService } from './tax.service';

export class TaxController {
  async list(req: Request, res: Response) {
    try {
      const taxes = await taxService.listTaxRules();
      res.json(taxes);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to list tax rules' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const tax = await taxService.getTaxRuleById(id);
      if (!tax) {
        return res.status(404).json({ message: 'Tax rule not found' });
      }
      res.json(tax);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch tax rule' });
    }
  }

  async getDefault(req: Request, res: Response) {
    try {
      const defaultTax = await taxService.getDefaultTaxRule();
      res.json(defaultTax || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get default tax rule' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, code, ratePercentage, country, state, description, isDefault } = req.body;
      if (!name || !code || ratePercentage === undefined || !country) {
        return res.status(400).json({ message: 'Name, code, ratePercentage, and country are required' });
      }

      const existing = await taxService.getTaxRuleByCode(code.trim().toUpperCase());
      if (existing) {
        return res.status(409).json({ message: `Tax rule with code "${code}" already exists` });
      }

      const created = await taxService.createTaxRule({
        name,
        code,
        ratePercentage: Number(ratePercentage),
        country,
        state,
        description,
        isDefault: Boolean(isDefault),
      });

      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to create tax rule' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { name, code, ratePercentage, country, state, description, isDefault, status } = req.body;

      if (code) {
        const existing = await taxService.getTaxRuleByCode(code.trim().toUpperCase());
        if (existing && existing.id !== id) {
          return res.status(409).json({ message: `Tax rule with code "${code}" already exists` });
        }
      }

      const updated = await taxService.updateTaxRule(id, {
        name,
        code,
        ratePercentage: ratePercentage !== undefined ? Number(ratePercentage) : undefined,
        country,
        state,
        description,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
        status,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to update tax rule' });
    }
  }

  async toggleStatus(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Status must be active or inactive' });
      }

      const updated = await taxService.toggleStatus(id, status);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to toggle tax rule status' });
    }
  }
}

export const taxController = new TaxController();

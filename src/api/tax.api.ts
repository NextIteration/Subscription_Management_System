import { apiClient } from './client';
import { TaxRule } from '../types';

export async function fetchTaxRules(): Promise<TaxRule[]> {
  return apiClient<TaxRule[]>('/tax-rules');
}

export async function createTaxRule(data: Omit<TaxRule, 'id'>): Promise<TaxRule> {
  return apiClient<TaxRule>('/tax-rules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTaxRule(id: string, updates: Partial<TaxRule>): Promise<TaxRule> {
  return apiClient<TaxRule>(`/tax-rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function toggleTaxRuleStatus(id: string, status: string): Promise<TaxRule> {
  return apiClient<TaxRule>(`/tax-rules/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}


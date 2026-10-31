import { apiClient } from './client';
import { DiscountRule } from '../types';

export async function fetchDiscountRules(): Promise<DiscountRule[]> {
  return apiClient<DiscountRule[]>('/discount-rules');
}

export async function createDiscountRule(data: Omit<DiscountRule, 'id' | 'usedCount'>): Promise<DiscountRule> {
  return apiClient<DiscountRule>('/discount-rules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDiscountRule(id: string, updates: Partial<DiscountRule>): Promise<DiscountRule> {
  return apiClient<DiscountRule>(`/discount-rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function toggleDiscountRuleStatus(id: string, status: string): Promise<DiscountRule> {
  return apiClient<DiscountRule>(`/discount-rules/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}


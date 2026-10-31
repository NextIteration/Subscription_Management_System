import { apiClient } from './client';
import { FinancialMetric } from '../types';

export interface RevenueTrendItem {
  month: string;
  revenue: number;
  collections: number;
  overdue: number;
}

export interface AgingReportItem {
  bracket: string;
  amount: number;
}

export async function fetchFinancialSummary(customerId?: string): Promise<FinancialMetric> {
  const query = customerId ? `?customerId=${customerId}` : '';
  return apiClient<FinancialMetric>(`/reports/summary${query}`);
}

export async function fetchRevenueTrend(timeRange = '30d'): Promise<RevenueTrendItem[]> {
  return apiClient<RevenueTrendItem[]>(`/reports/revenue-trend?timeRange=${timeRange}`);
}

export async function fetchAgingReport(): Promise<AgingReportItem[]> {
  return apiClient<AgingReportItem[]>('/reports/aging');
}


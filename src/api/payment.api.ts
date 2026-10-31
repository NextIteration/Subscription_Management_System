import { apiClient } from './client';
import { Payment } from '../types';

export interface PaymentListResponse {
  total: number;
  items: Payment[];
}

export async function fetchPayments(params?: {
  search?: string;
  invoiceId?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}): Promise<PaymentListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.invoiceId) query.set('invoiceId', params.invoiceId);
  if (params?.customerId) query.set('customerId', params.customerId);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiClient<PaymentListResponse>(`/payments${qs ? `?${qs}` : ''}`);
}

export async function recordPayment(data: {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  notes?: string;
  paymentDate?: string;
}): Promise<{ payment: Payment; invoice: any }> {
  return apiClient<{ payment: Payment; invoice: any }>('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}


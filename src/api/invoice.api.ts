import { apiClient } from './client';
import { Invoice } from '../types';

export interface InvoiceListResponse {
  total: number;
  items: Invoice[];
}

export async function fetchInvoices(params?: {
  status?: string;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<InvoiceListResponse> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.customerId) query.set('customerId', params.customerId);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiClient<InvoiceListResponse>(`/invoices${qs ? `?${qs}` : ''}`);
}

export async function fetchInvoiceById(id: string): Promise<Invoice> {
  return apiClient<Invoice>(`/invoices/${id}`);
}

export async function createInvoice(data: any): Promise<Invoice> {
  return apiClient<Invoice>('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function confirmInvoice(id: string): Promise<Invoice> {
  return apiClient<Invoice>(`/invoices/${id}/confirm`, {
    method: 'PATCH',
  });
}

export async function cancelInvoice(id: string): Promise<Invoice> {
  return apiClient<Invoice>(`/invoices/${id}/cancel`, {
    method: 'PATCH',
  });
}

export async function sendInvoice(id: string): Promise<{ invoice: Invoice; emailResult: any }> {
  return apiClient<{ invoice: Invoice; emailResult: any }>(`/invoices/${id}/send`, {
    method: 'PATCH',
  });
}

export function getInvoicePdfUrl(id: string): string {
  const base = import.meta.env.VITE_API_URL || '/api';
  return `${base}/invoices/${id}/pdf`;
}

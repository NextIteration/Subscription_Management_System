import { apiClient } from './client';
import { Invoice } from '../types';

export async function fetchPortalInvoices(customerId?: string): Promise<Invoice[]> {
  const query = customerId ? `?customerId=${customerId}` : '';
  return apiClient<Invoice[]>(`/portal/invoices${query}`, {
    headers: customerId ? { 'x-customer-id': customerId } : {},
  });
}

export async function fetchPortalInvoiceById(id: string, customerId?: string): Promise<Invoice> {
  return apiClient<Invoice>(`/portal/invoices/${id}`, {
    headers: customerId ? { 'x-customer-id': customerId } : {},
  });
}

export function getPortalInvoicePdfUrl(id: string, customerId?: string): string {
  const base = import.meta.env.VITE_API_URL || '/api';
  return `${base}/portal/invoices/${id}/pdf${customerId ? `?customerId=${customerId}` : ''}`;
}

export async function payPortalInvoice(id: string, data: { paymentMethod?: string; reference?: string; amount?: number }, customerId?: string) {
  return apiClient(`/portal/invoices/${id}/pay`, {
    method: 'POST',
    headers: customerId ? { 'x-customer-id': customerId } : {},
    body: JSON.stringify(data),
  });
}


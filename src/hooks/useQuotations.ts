import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Quotation, QuotationTemplate } from '../types';

export function useQuotations(params?: { customerId?: string; status?: string }) {
  return useQuery({
    queryKey: ['quotations', params],
    queryFn: async () => {
      const res = await api.get<{ quotations: Quotation[] }>('/quotations', {
        params,
      });
      return res.data.quotations;
    },
  });
}

export function useQuotation(id?: string) {
  return useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<{ quotation: Quotation }>(`/quotations/${id}`);
      return res.data.quotation;
    },
    enabled: Boolean(id),
  });
}

export function useQuotationTemplates() {
  return useQuery({
    queryKey: ['quotation-templates'],
    queryFn: async () => {
      const res = await api.get<{ templates: QuotationTemplate[] }>('/quotations/templates');
      return res.data.templates;
    },
  });
}

export function useCreateQuotationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<QuotationTemplate, 'id'>) => {
      const res = await api.post<{ message: string; template: QuotationTemplate }>('/quotations/templates', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-templates'] });
    },
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post<{ message: string; quotation: Quotation }>('/quotations', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch<{ message: string; quotation: Quotation }>(`/quotations/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

export function useConvertQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ message: string; subscription: any }>(`/quotations/${id}/convert`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}


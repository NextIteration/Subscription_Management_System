import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Customer } from '../types';

export function useCustomers(search = '', page = 1) {
  return useQuery({
    queryKey: ['customers', search, page],
    queryFn: async () => {
      const res = await api.get<{
        data: Customer[];
        pagination: { page: number; pageSize: number; total: number; totalPages: number };
      }>('/customers', {
        params: { search, page },
      });
      return res.data;
    },
  });
}

export function useCustomer(id?: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<{
        customer: Customer;
        subscriptions: any[];
        quotations: any[];
      }>(`/customers/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Customer, 'id' | 'createdAt' | 'totalSpent' | 'activeSubscriptionsCount'>) => {
      const res = await api.post<{ message: string; customer: Customer }>('/customers', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Customer> }) => {
      const res = await api.put<{ message: string; customer: Customer }>(`/customers/${id}`, updates);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<{ message: string }>(`/customers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}


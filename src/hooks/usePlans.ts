import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Plan } from '../types';

export function usePlans(status?: string) {
  return useQuery({
    queryKey: ['plans', status],
    queryFn: async () => {
      const res = await api.get<{ plans: Plan[] }>('/plans', {
        params: { status },
      });
      return res.data.plans;
    },
  });
}

export function usePlan(id?: string) {
  return useQuery({
    queryKey: ['plan', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<{ plan: Plan; subscriptionsCount: number; activeSubscriptionsCount: number }>(`/plans/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Plan, 'id'>) => {
      const res = await api.post<{ message: string; plan: Plan }>('/plans', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Plan> }) => {
      const res = await api.put<{ message: string; plan: Plan }>(`/plans/${id}`, updates);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan', variables.id] });
    },
  });
}


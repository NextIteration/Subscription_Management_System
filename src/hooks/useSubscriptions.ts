import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Subscription, SubscriptionStatus } from '../types';

export function useSubscriptions(params?: { status?: string; customerId?: string; planId?: string }) {
  return useQuery({
    queryKey: ['subscriptions', params],
    queryFn: async () => {
      const res = await api.get<{ subscriptions: Subscription[] }>('/subscriptions', {
        params,
      });
      return res.data.subscriptions;
    },
  });
}

export function useSubscription(id?: string) {
  return useQuery({
    queryKey: ['subscription', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<{ subscription: Subscription; plan: any }>(`/subscriptions/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post<{ message: string; subscription: Subscription }>('/subscriptions', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useUpdateSubscriptionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: SubscriptionStatus; reason?: string }) => {
      const res = await api.patch<{ message: string; subscription: Subscription }>(`/subscriptions/${id}/status`, {
        status,
        reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function usePauseSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post<{ message: string; subscription: Subscription }>(`/subscriptions/${id}/pause`, {
        reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useResumeSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ message: string; subscription: Subscription }>(`/subscriptions/${id}/resume`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useCloseSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post<{ message: string; subscription: Subscription; penalty: any }>(
        `/subscriptions/${id}/close`,
        { reason }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

export function useUpdateRenewal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      autoRenew,
      renewalNotificationDays,
    }: {
      id: string;
      autoRenew: boolean;
      renewalNotificationDays: number;
    }) => {
      const res = await api.patch<{ message: string; subscription: Subscription }>(
        `/subscriptions/${id}/renewal`,
        { autoRenew, renewalNotificationDays }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}


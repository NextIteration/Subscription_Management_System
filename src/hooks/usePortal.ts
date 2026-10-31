import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Subscription, Customer } from '../types';

export function usePortalDashboard() {
  return useQuery({
    queryKey: ['portal-dashboard'],
    queryFn: async () => {
      const res = await api.get<{
        customer: Customer;
        stats: {
          totalSubscriptions: number;
          activeSubscriptions: number;
          pausedSubscriptions: number;
          nextBillingDate: string | null;
          monthlyEstimate: number;
        };
        recentSubscriptions: Subscription[];
      }>('/portal/dashboard');
      return res.data;
    },
  });
}

export function usePortalSubscriptions() {
  return useQuery({
    queryKey: ['portal-subscriptions'],
    queryFn: async () => {
      const res = await api.get<{
        subscriptions: (Subscription & { planAllowsPause: boolean; maxPauseDays: number })[];
      }>('/portal/subscriptions');
      return res.data.subscriptions;
    },
  });
}

export function usePortalSubscription(id?: string) {
  return useQuery({
    queryKey: ['portal-subscription', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<{
        subscription: Subscription;
        plan: any;
      }>(`/portal/subscriptions/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });
}


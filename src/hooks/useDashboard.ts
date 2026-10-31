import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const res = await api.get<{
        metrics: {
          activeSubscriptionsCount: number;
          pausedSubscriptionsCount: number;
          totalCustomersCount: number;
          newClientsThisMonth: number;
          pendingQuotationsCount: number;
          statusCounts: Record<string, number>;
        };
        recentActivities: {
          id: string;
          name: string;
          title: string;
          action: string;
          time: string;
          type: string;
        }[];
      }>('/dashboard/metrics');
      return res.data;
    },
  });
}


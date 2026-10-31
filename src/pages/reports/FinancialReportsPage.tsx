import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../components/layout/Header';
import { MetricCard } from '../../components/ui/StatCard';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  Clock,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import * as reportsApi from '../../api/reports.api';

export const FinancialReportsPage: React.FC = () => {
  const { invoices: fallbackInvoices } = useApp();
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('30d');

  // Queries
  const { data: summary } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: () => reportsApi.fetchFinancialSummary(),
  });

  const { data: trendData } = useQuery({
    queryKey: ['reports-trend', timeRange],
    queryFn: () => reportsApi.fetchRevenueTrend(timeRange),
  });

  const { data: agingData } = useQuery({
    queryKey: ['reports-aging'],
    queryFn: () => reportsApi.fetchAgingReport(),
  });

  // Fallback defaults
  const totalPaid = summary?.totalRevenue ?? 4027.29;
  const mrr = summary?.mrr ?? 1188.59;
  const arr = summary?.arr ?? mrr * 12;
  const totalOutstanding = summary?.totalOutstanding ?? 3617.59;
  const totalOverdue = summary?.totalOverdue ?? 2093.84;

  const defaultMonthlyData = [
    { month: 'May', revenue: 14200, collections: 13800, overdue: 400 },
    { month: 'Jun', revenue: 16800, collections: 15900, overdue: 900 },
    { month: 'Jul', revenue: 18400, collections: 17200, overdue: 1200 },
    { month: 'Aug', revenue: 21500, collections: 20100, overdue: 1400 },
    { month: 'Sep', revenue: 24900, collections: 23400, overdue: 1500 },
    { month: 'Oct', revenue: 28450, collections: 26100, overdue: 2350 },
  ];

  const defaultAging = [
    { bracket: 'Current', amount: 8400 },
    { bracket: '1-15d', amount: 1850 },
    { bracket: '16-30d', amount: 905 },
    { bracket: '31-60d', amount: 450 },
    { bracket: '60d+', amount: 150 },
  ];

  const chartData = trendData && trendData.length > 0 ? trendData : defaultMonthlyData;
  const barData = agingData && agingData.length > 0 ? agingData : defaultAging;

  return (
    <div className="space-y-6">
      <Header
        title="Financial Dashboard & Reports"
        subtitle="Revenue recognition, MRR/ARR velocity, accounts receivable aging, and collection rates."
      />

      {/* Filter and Export Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#d3e3ee] p-4 rounded-3xl border border-[rgba(180,205,225,0.3)] shadow-xs">
        <div className="flex items-center space-x-2 bg-white/70 p-1 rounded-2xl">
          {(['30d', '90d', '1y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition uppercase ${
                timeRange === r
                  ? 'bg-[#0e1013] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {r === '30d' ? 'Last 30 Days' : r === '90d' ? 'Last Quarter' : 'Year to Date'}
            </button>
          ))}
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center space-x-2 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-2 px-5 rounded-full transition shadow-xs"
        >
          <Download size={14} />
          <span>Export Financial Statement / Print</span>
        </button>
      </div>

      {/* Top 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<DollarSign size={20} className="text-[#0e1013]" />}
          value={`$${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          label="Collected Revenue"
          badge={{ text: `${summary?.collectionRate || 85.5}% rate`, type: 'positive' }}
        />
        <MetricCard
          icon={<TrendingUp size={20} className="text-[#0e1013]" />}
          value={`$${mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          label="Monthly Recurring Revenue (MRR)"
          badge={{ text: `ARR: $${(arr / 1000).toFixed(0)}k`, type: 'neutral' }}
        />
        <MetricCard
          icon={<Clock size={20} className="text-[#0e1013]" />}
          value={`$${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          label="Total Outstanding Invoices"
        />
        <MetricCard
          icon={<AlertCircle size={20} className="text-rose-600" />}
          value={`$${totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          label="Past Due / Overdue Invoices"
          badge={{ text: `${summary?.overdueInvoicesCount || 2} Overdue`, type: 'negative' }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Revenue Velocity Chart (Span 7) */}
        <div className="lg:col-span-7 bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-[#0e1013]">Revenue & Cash Inflow</h3>
              <p className="text-xs text-[#526071]">Gross billed subscriptions vs cleared cash settlements</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 font-semibold text-[#0e1013]">
                <span className="w-2.5 h-2.5 bg-[#0e1013] rounded-full inline-block"></span>
                <span>Billed</span>
              </span>
              <span className="flex items-center space-x-1 font-semibold text-sky-800">
                <span className="w-2.5 h-2.5 bg-[#6495b8] rounded-full inline-block"></span>
                <span>Collected</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0e1013" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0e1013" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6495b8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6495b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`}
                />
                <Tooltip
                  formatter={(val: number) => [`$${val.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0e1013', borderRadius: '1rem', color: '#fff', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0e1013"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorBilled)"
                />
                <Area
                  type="monotone"
                  dataKey="collections"
                  stroke="#6495b8"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  fill="url(#colorCollected)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Receivables & Overdue Aging (Span 5) */}
        <div className="lg:col-span-5 bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-extrabold text-base text-[#0e1013]">Aging & Collection Risk</h3>
            <p className="text-xs text-[#526071]">Overdue balance distribution by invoice aging bracket</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="bracket" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
                <Tooltip
                  formatter={(val: number) => [`$${val.toLocaleString()}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#0e1013', borderRadius: '1rem', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="amount" fill="#0e1013" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Receivables Summary Breakdown */}
      <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs">
        <h4 className="font-extrabold text-base text-[#0e1013] mb-3">
          Key Accounts Receivables Records
        </h4>
        <div className="divide-y divide-[rgba(180,205,225,0.4)] text-xs">
          {fallbackInvoices
            .filter((i) => i.amountDue > 0)
            .map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-[#0e1013]">{inv.invoiceNumber}</span>
                  <p className="font-bold text-neutral-800 mt-0.5">{inv.customerName}</p>
                  <span className="text-[11px] text-neutral-500">Terms: {inv.paymentTerms} • Due: {inv.dueDate?.split('T')[0] || inv.dueDate}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-rose-700 text-sm block">
                    ${inv.amountDue.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                    Status: {inv.status}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

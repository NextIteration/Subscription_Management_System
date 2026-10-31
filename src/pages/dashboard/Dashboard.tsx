import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { MetricCard, DarkStatusCard, DarkEventCard } from '../../components/ui/StatCard';
import {
  Wallet,
  Clock,
  Users,
  CreditCard,
  FileText,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { mockRevenueChartData, mockRecentActivities, mockTodoItems } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { subscriptions, invoices, customers, showToast } = useApp();
  const navigate = useNavigate();
  const [engineProgress, setEngineProgress] = useState(68);
  const [engineRunning, setEngineRunning] = useState(false);

  // Dynamic calculations
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue').length;
  const totalCollected = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amountPaid, 0);

  const handleRunBillingEngine = () => {
    setEngineRunning(true);
    setEngineProgress(10);
    showToast('Scheduled billing cycle execution initiated...');
    const interval = setInterval(() => {
      setEngineProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setEngineRunning(false);
          showToast('Billing cycle and auto-renewals successfully processed!');
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  return (
    <div className="space-y-6">
      <Header />

      {/* Main Grid: Left Main Area + Right Sidebar Area (matching screenshot layout) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column Area (Span 9 on XL) */}
        <div className="xl:col-span-9 space-y-5">
          {/* Top Row: 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<Wallet size={20} className="text-[#0e1013]" />}
              value="$143,624"
              label="Your bank balance"
              onClick={() => navigate('/invoices')}
            />
            <MetricCard
              icon={<Clock size={20} className="text-[#0e1013]" />}
              value="12"
              label="Uncategorized transactions"
              onClick={() => navigate('/subscriptions')}
            />
            <MetricCard
              icon={<Users size={20} className="text-[#0e1013]" />}
              value={activeSubs || 7}
              label="Active subscriptions"
              onClick={() => navigate('/subscriptions')}
            />
            <MetricCard
              icon={<CreditCard size={20} className="text-[#0e1013]" />}
              value="$3,287.49"
              label="This week's card spending"
              onClick={() => navigate('/payments')}
            />
          </div>

          {/* Middle Row: New clients / Invoices overdue + Revenue Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left mini metric cards column (3 cols) */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
              <MetricCard
                value={customers.length > 0 ? customers.length * 10 + 4 : 54}
                label="New clients"
                badge={{ text: '+ 18.7%', type: 'positive' }}
                onClick={() => navigate('/customers')}
                className="h-full"
              />
              <MetricCard
                value={overdueInvoices || 6}
                label="Invoices overdue"
                badge={{ text: '+ 2.7%', type: 'negative' }}
                onClick={() => navigate('/invoices')}
                className="h-full"
              />
            </div>

            {/* Center Revenue Chart Card (8 cols) */}
            <div className="lg:col-span-8 bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-[#0e1013] tracking-tight">Revenue</h3>
                  <p className="text-xs text-[#526071]">Last 7 days VS prior week</p>
                </div>
                <div className="flex items-center space-x-3 text-xs font-semibold">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0e1013]"></span>
                    <span className="text-[#0e1013]">Current</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6495b8]"></span>
                    <span className="text-[#526071]">Prior week</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-52 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockRevenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(v) => `${v / 1000}k`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#0e1013] text-white p-3 rounded-2xl shadow-xl text-xs space-y-1">
                              <p className="text-neutral-400 font-semibold">{payload[0].payload.day}</p>
                              <p className="text-white font-bold">
                                • Current: ${(payload[0].value as number).toLocaleString()}
                              </p>
                              {payload[1] && (
                                <p className="text-[#9bc2de] font-semibold">
                                  • Prior: ${(payload[1].value as number).toLocaleString()}
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="natural"
                      dataKey="currentWeek"
                      stroke="#0e1013"
                      strokeWidth={2.8}
                      dot={{ r: 4, fill: '#0e1013', strokeWidth: 2, stroke: '#d3e3ee' }}
                      activeDot={{ r: 6, fill: '#0e1013' }}
                    />
                    <Line
                      type="natural"
                      dataKey="priorWeek"
                      stroke="#86a9c4"
                      strokeWidth={2.2}
                      dot={{ r: 3, fill: '#86a9c4' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Card: Recent Subscriptions / Invoices & Activity */}
          <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-[#0e1013] tracking-tight">
                  Recent subscriptions & billing updates
                </h3>
                <p className="text-xs text-[#526071]">Live stream of lifecycle and customer events</p>
              </div>
              <button
                onClick={() => navigate('/subscriptions')}
                className="text-xs font-bold text-[#0e1013] hover:underline"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-[rgba(180,205,225,0.4)]">
              {mockRecentActivities.map((act) => (
                <div
                  key={act.id}
                  className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4 hover:bg-white/30 px-3 rounded-2xl transition"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <img
                      src={act.avatar}
                      alt={act.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-xs flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0e1013] truncate">{act.name}</p>
                      <p className="text-[11px] text-[#526071] truncate">{act.action}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-medium text-[#475569]">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column Area (Span 3 on XL) */}
        <div className="xl:col-span-3 space-y-5">
          {/* Top Black Card: Formation status / Billing Batch Engine */}
          <DarkStatusCard
            title="Formation status"
            subtitle={engineRunning ? 'Executing batch...' : 'In progress'}
            progressPercent={engineProgress}
            noteTitle="Estimated processing"
            noteValue="4-5 business days"
            buttonText={engineRunning ? 'Processing Engine...' : 'View status'}
            onButtonClick={handleRunBillingEngine}
          />

          {/* Your to-Do list (matching screenshot styling) */}
          <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-sm">
            <h4 className="font-extrabold text-base text-[#0e1013] tracking-tight mb-4">
              Your to-Do list
            </h4>

            <div className="space-y-3.5">
              {mockTodoItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-1.5 rounded-2xl hover:bg-white/40 transition cursor-pointer"
                  onClick={() => showToast(`To-do opened: ${item.title}`)}
                >
                  {/* Black rounded icon badge */}
                  <div className="w-9 h-9 rounded-full bg-[#0e1013] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    {idx === 0 && <FileText size={16} />}
                    {idx === 1 && <Clock size={16} />}
                    {idx === 2 && <ShieldCheck size={16} />}
                    {idx === 3 && <CheckCircle2 size={16} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#0e1013] leading-snug truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#526071] mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Black Card: Board meeting reminder */}
          <DarkEventCard
            title="Board meeting"
            datetime="Feb 22 at 6:00 PM"
            description="You have been invited to attend a meeting of the Board Directors."
          />
        </div>
      </div>
    </div>
  );
};


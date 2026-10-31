import React from 'react';
import { Header } from '../../components/layout/Header';
import { MetricCard, DarkStatusCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { usePortalDashboard, usePortalSubscriptions } from '../../hooks/usePortal';
import { RefreshCw, Receipt, CreditCard, Shield, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomerPortalDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { invoices, payments } = useApp();
  const navigate = useNavigate();

  const { data: portalData } = usePortalDashboard();
  const { data: portalSubs = [] } = usePortalSubscriptions();

  // Enforce customer scoping: customer only accesses their own records
  const customerId = currentUser?.customerId || 'cust-1';
  const mySubs = portalSubs.length > 0 ? portalSubs : [];
  const myInvoices = invoices.filter((i) => i.customerId === customerId);
  const myPayments = payments.filter((p) => p.customerId === customerId);

  const activeSubsCount = portalData?.stats.activeSubscriptions ?? mySubs.filter((s) => s.status === 'ACTIVE').length;
  const unpaidInvoices = myInvoices.filter((i) => i.status === 'issued' || i.status === 'overdue');
  const totalDue = unpaidInvoices.reduce((sum, i) => sum + i.amountDue, 0);

  return (
    <div className="space-y-6">
      <Header
        title={`Welcome back, ${currentUser?.name.split(' ')[0]}!`}
        subtitle={`Organization: ${currentUser?.company || 'Nexus Technologies'} • Client Self-Service Portal`}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <MetricCard
          icon={<RefreshCw size={20} className="text-[#0e1013]" />}
          value={activeSubsCount}
          label="Active Platform Subscriptions"
          onClick={() => navigate('/portal/subscriptions')}
        />
        <MetricCard
          icon={<Receipt size={20} className="text-[#0e1013]" />}
          value={`$${totalDue.toFixed(2)}`}
          label="Current Amount Due"
          badge={totalDue > 0 ? { text: `${unpaidInvoices.length} Unpaid`, type: 'negative' } : { text: 'All Paid', type: 'positive' }}
          onClick={() => navigate('/portal/invoices')}
        />
        <MetricCard
          icon={<CreditCard size={20} className="text-[#0e1013]" />}
          value={myInvoices.length}
          label="Total Invoices on Record"
          onClick={() => navigate('/portal/invoices')}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: My Subscriptions & Invoices (Span 8) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Subscriptions Card */}
          <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-[#0e1013]">My Active Subscriptions</h3>
                <p className="text-xs text-[#526071]">Live software tier allocations & billing schedules</p>
              </div>
              <button
                onClick={() => navigate('/portal/subscriptions')}
                className="text-xs font-bold text-[#0e1013] hover:underline"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {mySubs.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => navigate(`/portal/subscriptions`)}
                  className="bg-white/80 hover:bg-white p-4 rounded-2xl border border-[rgba(180,205,225,0.4)] transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-[#0e1013]">
                        {sub.subscriptionNumber}
                      </span>
                      <StatusBadge status={sub.status} />
                    </div>
                    <h4 className="font-bold text-sm text-[#0e1013] mt-1">{sub.planName}</h4>
                    <p className="text-xs text-[#526071]">
                      Billing: <span className="uppercase font-semibold">{sub.billingFrequency}</span> • Renews: {sub.nextBillingDate}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-base font-extrabold text-[#0e1013] block">
                      ${sub.totalAmount.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-medium">
                      Terms: {sub.paymentTerms}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Invoices Card */}
          <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-[#0e1013]">Recent Invoices</h3>
                <p className="text-xs text-[#526071]">Payment history and statements</p>
              </div>
              <button
                onClick={() => navigate('/portal/invoices')}
                className="text-xs font-bold text-[#0e1013] hover:underline"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-[rgba(180,205,225,0.4)]">
              {myInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => navigate('/portal/invoices')}
                  className="py-3 flex items-center justify-between hover:bg-white/30 px-3 rounded-2xl transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-[#0e1013]">
                        {inv.invoiceNumber}
                      </span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <span className="text-[11px] text-[#526071]">Due Date: {inv.dueDate}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-xs text-[#0e1013] block">
                      ${inv.totalAmount.toFixed(2)}
                    </span>
                    {inv.amountDue > 0 ? (
                      <span className="text-[10px] font-bold text-rose-600">
                        Balance: ${inv.amountDue.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600">Paid in full</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Portal Status Card (Span 4) */}
        <div className="lg:col-span-4 space-y-5">
          <DarkStatusCard
            title="Service Tier Status"
            subtitle="Platform Cluster Active"
            progressPercent={100}
            noteTitle="Next Scheduled Maintenance"
            noteValue="Zero-downtime rolling update"
            buttonText="Review Plan Options"
            onButtonClick={() => navigate('/portal/subscriptions')}
          />

          <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs">
            <h4 className="font-extrabold text-sm text-[#0e1013] mb-3">Enterprise SLA Support</h4>
            <div className="bg-white/70 p-3.5 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Dedicated Engineer:</span>
                <span className="font-bold text-[#0e1013]">Sarah Connor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Guaranteed SLA:</span>
                <span className="font-bold text-emerald-700">99.99% Uptime</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Emergency Response:</span>
                <span className="font-bold text-[#0e1013]">15 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


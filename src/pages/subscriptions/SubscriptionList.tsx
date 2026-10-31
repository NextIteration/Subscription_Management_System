import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { Subscription, SubscriptionStatus } from '../../types';
import {
  useSubscriptions,
  useCreateSubscription,
  useUpdateSubscriptionStatus,
  usePauseSubscription,
  useResumeSubscription,
  useCloseSubscription,
  useUpdateRenewal,
} from '../../hooks/useSubscriptions';
import { useCustomers } from '../../hooks/useCustomers';
import { usePlans } from '../../hooks/usePlans';
import { useProducts } from '../../hooks/useProducts';
import {
  RefreshCw,
  Plus,
  Search,
  Pause,
  Play,
  XCircle,
  Settings,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const SubscriptionList: React.FC = () => {
  const { showToast } = useApp();
  const { data: rawSubscriptions = [], isLoading } = useSubscriptions();
  const { data: customerData } = useCustomers();
  const customers = customerData?.data || [];
  const { data: rawPlans = [] } = usePlans();
  const { data: products = [] } = useProducts();

  // Normalize plans with lowercase billing frequency for frontend dropdowns
  const plans = rawPlans.map((p: any) => ({
    ...p,
    billingFrequency: (p.billingFrequency?.toLowerCase() || 'monthly') as any,
  }));

  const subscriptions: Subscription[] = rawSubscriptions.map((s: any) => ({
    ...s,
    billingFrequency: (s.billingFrequency?.toLowerCase() || 'monthly') as any,
  }));

  const createSubscriptionMutation = useCreateSubscription();
  const updateStatusMutation = useUpdateSubscriptionStatus();
  const pauseMutation = usePauseSubscription();
  const resumeMutation = useResumeSubscription();
  const closeMutation = useCloseSubscription();
  const updateRenewalMutation = useUpdateRenewal();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  // Modal controls
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [isRenewalOpen, setIsRenewalOpen] = useState(false);

  // Action fields
  const [targetSubId, setTargetSubId] = useState('');
  const [pauseReason, setPauseReason] = useState('System maintenance & temporary deployment freeze');
  const [closeReason, setCloseReason] = useState('Customer contract cancellation request');
  const [autoRenewSetting, setAutoRenewSetting] = useState(true);
  const [renewalNoticeDays, setRenewalNoticeDays] = useState(14);

  // New Subscription Form
  const [newCustId, setNewCustId] = useState(customers[0]?.id || '');
  const [newPlanId, setNewPlanId] = useState(plans[0]?.id || '');
  const [newStatus, setNewStatus] = useState<SubscriptionStatus>('DRAFT');
  const [newTerms, setNewTerms] = useState<Subscription['paymentTerms']>('NET30');
  const [newTaxRef, setNewTaxRef] = useState('TAX-US-CA-STD');

  const filteredSubs = subscriptions.filter((s) => {
    const matchesSearch =
      s.subscriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.planName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenPause = (sub: Subscription) => {
    setTargetSubId(sub.id);
    setPauseReason('Scheduled client migration freeze');
    setIsPauseOpen(true);
  };

  const handleConfirmPause = (e: React.FormEvent) => {
    e.preventDefault();
    pauseMutation.mutate(
      { id: targetSubId, reason: pauseReason },
      {
        onSuccess: (data: any) => {
          showToast(data.message || 'Subscription paused.');
          if (selectedSub?.id === targetSubId && data.subscription) {
            setSelectedSub(data.subscription);
          }
        },
        onError: (err: any) => showToast(err.message, 'error'),
      }
    );
    setIsPauseOpen(false);
  };

  const handleOpenClose = (sub: Subscription) => {
    setTargetSubId(sub.id);
    setCloseReason('Early termination notice');
    setIsCloseOpen(true);
  };

  const handleConfirmClose = (e: React.FormEvent) => {
    e.preventDefault();
    closeMutation.mutate(
      { id: targetSubId, reason: closeReason },
      {
        onSuccess: (data: any) => {
          showToast(data.message || 'Subscription closed.');
          if (selectedSub?.id === targetSubId && data.subscription) {
            setSelectedSub(data.subscription);
          }
        },
        onError: (err: any) => showToast(err.message, 'error'),
      }
    );
    setIsCloseOpen(false);
  };

  const handleOpenRenewal = (sub: Subscription) => {
    setTargetSubId(sub.id);
    setAutoRenewSetting(sub.autoRenew);
    setRenewalNoticeDays(sub.renewalNotificationDays);
    setIsRenewalOpen(true);
  };

  const handleConfirmRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    updateRenewalMutation.mutate(
      {
        id: targetSubId,
        autoRenew: autoRenewSetting,
        renewalNotificationDays: renewalNoticeDays,
      },
      {
        onSuccess: () => {
          showToast('Renewal settings updated successfully.');
          if (selectedSub?.id === targetSubId) {
            setSelectedSub({
              ...selectedSub,
              autoRenew: autoRenewSetting,
              renewalNotificationDays: renewalNoticeDays,
            });
          }
        },
        onError: (err: any) => showToast(err.message, 'error'),
      }
    );
    setIsRenewalOpen(false);
  };

  const handleResume = (subId: string) => {
    resumeMutation.mutate(subId, {
      onSuccess: (data: any) => {
        showToast(data.message || 'Subscription resumed.');
        if (selectedSub?.id === subId && data.subscription) {
          setSelectedSub(data.subscription);
        }
      },
      onError: (err: any) => showToast(err.message, 'error'),
    });
  };

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === newCustId) || customers[0];
    const plan = plans.find((p) => p.id === newPlanId) || plans[0];
    const defaultProd = products[0] || { id: 'prod-1', name: 'Core Platform' };

    const today = new Date().toISOString().split('T')[0];
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const lines = [
      {
        id: `sl-${Date.now()}`,
        productId: defaultProd.id,
        productName: defaultProd.name,
        quantity: 1,
        unitPrice: plan.price,
        taxRate: 8.25,
        lineTotal: plan.price,
      },
    ];

    createSubscriptionMutation.mutate(
      {
        customerId: cust.id,
        customerName: cust.name,
        planId: plan.id,
        planName: plan.name,
        billingFrequency: plan.billingFrequency.toUpperCase(),
        startDate: today,
        expiryDate: oneYearLater,
        nextBillingDate: today,
        paymentTerms: newTerms,
        taxReference: newTaxRef,
        lines,
        subtotal: plan.price,
        taxTotal: (plan.price * 8.25) / 100,
        totalAmount: plan.price * 1.0825,
        autoRenew: autoRenewSetting,
        renewalNotificationDays: renewalNoticeDays,
      },
      {
        onSuccess: (data: any) => showToast(data.message || 'Subscription registered.'),
        onError: (err: any) => showToast(err.message, 'error'),
      }
    );

    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Subscription Management"
        subtitle="Full lifecycle orchestration (DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED) with pause & penalty handling."
      />

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#d3e3ee] p-4 rounded-3xl border border-[rgba(180,205,225,0.3)] shadow-xs">
        <div className="flex items-center space-x-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="text"
              placeholder="Search by subscription #, customer, plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/80 border border-transparent focus:border-[rgba(160,190,215,0.8)] focus:outline-none text-xs text-[#0e1013]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-white/80 text-xs font-semibold text-[#0e1013] border-none outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PAUSED">PAUSED</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center space-x-2 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-2.5 px-5 rounded-full transition shadow-xs"
        >
          <Plus size={16} />
          <span>New Subscription</span>
        </button>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[rgba(180,205,225,0.5)] text-[#475569] font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Subscription #</th>
                <th className="pb-3 px-3">Customer</th>
                <th className="pb-3 px-3">Plan & Cycle</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Next Billing</th>
                <th className="pb-3 px-3">Auto-Renew</th>
                <th className="pb-3 px-3 text-right">Amount</th>
                <th className="pb-3 px-3 text-center">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(180,205,225,0.3)]">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[#526071]">
                    No subscriptions matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-white/40 transition cursor-pointer"
                      onClick={() => setSelectedSub(sub)}
                    >
                      <td className="py-3.5 px-3 font-mono font-extrabold text-[#0e1013]">
                        {sub.subscriptionNumber}
                      </td>

                      <td className="py-3.5 px-3">
                        <p className="font-bold text-[#0e1013]">{sub.customerName}</p>
                        <span className="text-[10px] text-neutral-400">Terms: {sub.paymentTerms}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-[#0e1013]">{sub.planName}</p>
                        <span className="text-[10px] uppercase font-bold text-neutral-500">
                          {sub.billingFrequency}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <StatusBadge status={sub.status} />
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-medium text-[#0e1013]">{sub.nextBillingDate}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[11px] font-bold ${
                            sub.autoRenew ? 'text-emerald-700' : 'text-neutral-500'
                          }`}
                        >
                          {sub.autoRenew ? 'Yes (Auto)' : 'Manual'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-extrabold text-sm text-[#0e1013]">
                        ${sub.totalAmount.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Lifecycle Status Progression */}
                          {sub.status === 'DRAFT' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: sub.id, status: 'QUOTATION' })
                              }
                              className="px-2 py-1 bg-white hover:bg-neutral-100 text-purple-700 font-bold rounded-lg text-[10px]"
                            >
                              → Quotation
                            </button>
                          )}
                          {sub.status === 'QUOTATION' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: sub.id, status: 'CONFIRMED' })
                              }
                              className="px-2 py-1 bg-white hover:bg-neutral-100 text-blue-700 font-bold rounded-lg text-[10px]"
                            >
                              → Confirm
                            </button>
                          )}
                          {sub.status === 'CONFIRMED' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: sub.id, status: 'ACTIVE' })
                              }
                              className="px-2 py-1 bg-[#0e1013] text-white hover:bg-neutral-800 font-bold rounded-lg text-[10px]"
                            >
                              Activate
                            </button>
                          )}

                          {sub.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => handleOpenPause(sub)}
                                className="p-1.5 rounded-full hover:bg-white text-amber-700 transition"
                                title="Pause subscription"
                              >
                                <Pause size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenClose(sub)}
                                className="p-1.5 rounded-full hover:bg-rose-100 text-rose-600 transition"
                                title="Close subscription"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}

                          {sub.status === 'PAUSED' && (
                            <button
                              onClick={() => handleResume(sub.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center space-x-1"
                              title="Resume subscription"
                            >
                              <Play size={10} />
                              <span>Resume</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenRenewal(sub)}
                            className="p-1.5 rounded-full hover:bg-white text-neutral-600 transition"
                            title="Renewal settings"
                          >
                            <Settings size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Detail Modal */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title={`Subscription ${selectedSub.subscriptionNumber}`}
          subtitle={`Client: ${selectedSub.customerName} • Plan: ${selectedSub.planName}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs">
            {/* PRD Lifecycle Visual Stepper */}
            <div className="bg-white/80 p-4 rounded-2xl border border-[rgba(180,205,225,0.4)]">
              <span className="font-bold text-[10px] uppercase text-neutral-500 tracking-wider block mb-3">
                Lifecycle Progression: DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED
              </span>
              <div className="flex items-center justify-between">
                {(['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'] as SubscriptionStatus[]).map(
                  (step, idx) => {
                    const isCurrent = selectedSub.status === step;
                    const isPast =
                      ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'].indexOf(
                        selectedSub.status
                      ) >= idx;

                    return (
                      <div key={step} className="flex-1 flex items-center">
                        <div
                          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isCurrent
                              ? 'bg-[#0e1013] text-white shadow-xs'
                              : isPast
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-100 text-neutral-400'
                          }`}
                        >
                          <span>{step}</span>
                        </div>
                        {idx < 4 && <div className="flex-1 h-0.5 bg-neutral-200 mx-1"></div>}
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-white/60 p-3 rounded-2xl">
                <span className="text-[10px] text-neutral-500 font-semibold block">Start Date</span>
                <span className="font-bold text-[#0e1013]">{selectedSub.startDate}</span>
              </div>
              <div className="bg-white/60 p-3 rounded-2xl">
                <span className="text-[10px] text-neutral-500 font-semibold block">Expiry Date</span>
                <span className="font-bold text-[#0e1013]">{selectedSub.expiryDate}</span>
              </div>
              <div className="bg-white/60 p-3 rounded-2xl">
                <span className="text-[10px] text-neutral-500 font-semibold block">Next Billing</span>
                <span className="font-bold text-[#0e1013]">{selectedSub.nextBillingDate}</span>
              </div>
              <div className="bg-white/60 p-3 rounded-2xl">
                <span className="text-[10px] text-neutral-500 font-semibold block">Payment Terms</span>
                <span className="font-bold text-[#0e1013]">{selectedSub.paymentTerms}</span>
              </div>
            </div>

            {/* Pause / Closure Notes */}
            {selectedSub.status === 'PAUSED' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start space-x-2">
                <Clock size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold">Subscription Currently Paused:</span>
                  <p className="mt-0.5">{selectedSub.pauseReason}</p>
                  <span className="text-[10px] font-semibold text-amber-700">
                    Paused on {selectedSub.pausedAt} ({selectedSub.pauseDaysRemaining} pause days remaining)
                  </span>
                </div>
              </div>
            )}

            {selectedSub.status === 'CLOSED' && (
              <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-2xl text-neutral-800">
                <span className="font-bold">Contract Closed on {selectedSub.closedAt}:</span>
                <p className="mt-0.5">{selectedSub.closureReason}</p>
              </div>
            )}

            {/* Product Lines */}
            <div>
              <span className="font-bold text-[#0e1013] block mb-2">Subscription Product Lines:</span>
              <div className="space-y-2">
                {selectedSub.lines.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-[rgba(180,205,225,0.4)]"
                  >
                    <div>
                      <span className="font-bold text-[#0e1013]">{l.productName}</span>
                      <span className="text-[11px] text-[#526071] block">
                        Qty: {l.quantity} × ${l.unitPrice.toFixed(2)} | Tax Ref: {selectedSub.taxReference}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-[#0e1013]">
                      ${l.lineTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Billing */}
            <div className="bg-white/60 p-3 rounded-2xl space-y-1 text-right">
              <div className="flex justify-between">
                <span className="text-[#526071]">Subtotal:</span>
                <span className="font-bold text-[#0e1013]">${selectedSub.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526071]">Tax Total ({selectedSub.taxReference}):</span>
                <span className="font-bold text-[#0e1013]">${selectedSub.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5 text-sm font-extrabold text-[#0e1013]">
                <span>Total Billing Amount:</span>
                <span>${selectedSub.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Pause Modal */}
      <Modal
        isOpen={isPauseOpen}
        onClose={() => setIsPauseOpen(false)}
        title="Pause Subscription"
        subtitle="Temporarily freeze recurring invoice generation and billing cycles."
      >
        <form onSubmit={handleConfirmPause} className="space-y-4 text-xs font-medium text-[#334155]">
          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Reason for Pausing</label>
            <textarea
              rows={3}
              required
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
              placeholder="Provide reason for audit log..."
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl text-[11px] text-amber-800">
            Subscription will pause until resumed or until plan's max allowed pause duration elapses.
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsPauseOpen(false)}
              className="px-4 py-2 rounded-full font-bold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Confirm Pause
            </button>
          </div>
        </form>
      </Modal>

      {/* Close Modal (with PRD penalty calculator) */}
      <Modal
        isOpen={isCloseOpen}
        onClose={() => setIsCloseOpen(false)}
        title="Close Subscription"
        subtitle="Terminate subscription lifecycle and apply plan's early closure penalty rules."
      >
        <form onSubmit={handleConfirmClose} className="space-y-4 text-xs font-medium text-[#334155]">
          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Reason for Closure</label>
            <textarea
              rows={3}
              required
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
              placeholder="e.g. Contract completed, consolidated vendors..."
            />
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-[11px] text-rose-900 flex items-start space-x-2">
            <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold">Plan Early-Closure Rule Enforced:</span>
              <p className="mt-0.5">
                The configured early termination penalty fee specified in the plan rules will be
                calculated and recorded upon closure.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsCloseOpen(false)}
              className="px-4 py-2 rounded-full font-bold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Terminate Subscription
            </button>
          </div>
        </form>
      </Modal>

      {/* Renewal Settings Modal */}
      <Modal
        isOpen={isRenewalOpen}
        onClose={() => setIsRenewalOpen(false)}
        title="Renewal Settings"
        subtitle="Manage automated renewal execution and customer notification advance notice."
      >
        <form onSubmit={handleConfirmRenewal} className="space-y-4 text-xs font-medium text-[#334155]">
          <div className="p-3 bg-white/70 rounded-2xl space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRenewSetting}
                onChange={(e) => setAutoRenewSetting(e.target.checked)}
                className="rounded text-[#0e1013] focus:ring-0"
              />
              <span className="font-bold text-[#0e1013]">
                Enable Auto-Renew at Contract Expiry
              </span>
            </label>
            <p className="text-[11px] text-neutral-500">
              When enabled, a renewal order and next cycle invoice will be automatically generated upon
              contract expiration.
            </p>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">
              Advance Notification Window (Days before expiry)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={renewalNoticeDays}
              onChange={(e) => setRenewalNoticeDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsRenewalOpen(false)}
              className="px-4 py-2 rounded-full font-bold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#0e1013] text-white font-bold hover:bg-neutral-800"
            >
              Save Settings
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Subscription Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Subscription"
        subtitle="Assign customer, plan, payment terms, and initial status."
      >
        <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs font-medium text-[#334155]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Customer</label>
              <select
                value={newCustId}
                onChange={(e) => setNewCustId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Subscription Plan</label>
              <select
                value={newPlanId}
                onChange={(e) => setNewPlanId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.price}/{p.billingFrequency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Initial Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as SubscriptionStatus)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="QUOTATION">QUOTATION</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="ACTIVE">ACTIVE</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Payment Terms</label>
              <select
                value={newTerms}
                onChange={(e) => setNewTerms(e.target.value as Subscription['paymentTerms'])}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              >
                <option value="IMMEDIATE">IMMEDIATE</option>
                <option value="NET15">NET15</option>
                <option value="NET30">NET30</option>
                <option value="NET60">NET60</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Tax Reference Code</label>
              <input
                type="text"
                value={newTaxRef}
                onChange={(e) => setNewTaxRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-full font-bold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#0e1013] text-white font-bold hover:bg-neutral-800"
            >
              Create Subscription
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Subscription } from '../../types';
import { usePortalSubscriptions } from '../../hooks/usePortal';
import { usePlans } from '../../hooks/usePlans';
import {
  usePauseSubscription,
  useResumeSubscription,
  useCloseSubscription,
  useUpdateRenewal,
} from '../../hooks/useSubscriptions';
import {
  RefreshCw,
  Pause,
  Play,
  RotateCw,
  Calendar,
  AlertCircle,
  Clock,
  Shield,
  XCircle,
} from 'lucide-react';

export const CustomerMySubscriptions: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useApp();
  const { data: mySubs = [], isLoading } = usePortalSubscriptions();
  const { data: plans = [] } = usePlans();

  const pauseMutation = usePauseSubscription();
  const resumeMutation = useResumeSubscription();
  const closeMutation = useCloseSubscription();
  const updateRenewalMutation = useUpdateRenewal();

  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('Quarterly cloud migration maintenance freeze');
  const [closeReason, setCloseReason] = useState('Consolidating developer infrastructure');

  const handlePause = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    pauseMutation.mutate(
      { id: selectedSub.id, reason: pauseReason },
      {
        onSuccess: (data: any) => showToast(data.message || 'Subscription paused.'),
        onError: (err: any) => showToast(err.message, 'error'),
      }
    );
    setIsPauseOpen(false);
    setSelectedSub(null);
  };

  const handleResume = (sub: Subscription) => {
    resumeMutation.mutate(sub.id, {
      onSuccess: (data: any) => showToast(data.message || 'Subscription resumed.'),
      onError: (err: any) => showToast(err.message, 'error'),
    });
  };

  const handleClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    closeMutation.mutate(
      { id: selectedSub.id, reason: closeReason },
      {
        onSuccess: (data: any) => showToast(data.message || 'Subscription closed.'),
        onError: (err: any) => showToast(err.message, 'error'),
      }
    );
    setIsCloseOpen(false);
    setSelectedSub(null);
  };

  const handleToggleRenewal = (sub: Subscription) => {
    updateRenewalMutation.mutate(
      {
        id: sub.id,
        autoRenew: !sub.autoRenew,
        renewalNotificationDays: sub.renewalNotificationDays,
      },
      {
        onSuccess: () => showToast('Renewal preference updated.'),
        onError: (err: any) => showToast(err.message, 'error'),
      }
    );
  };

  return (
    <div className="space-y-6">
      <Header
        title="My Subscriptions"
        subtitle="Manage software license commitments, scheduled renewals, and pause requests."
      />

      {/* Grid of Subscriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mySubs.length === 0 ? (
          <div className="col-span-2 bg-[#d3e3ee] p-8 rounded-3xl text-center text-[#526071]">
            No active subscriptions found for your organization account.
          </div>
        ) : (
          mySubs.map((sub) => {
            const plan = plans.find((p) => p.id === sub.planId);

            return (
              <div
                key={sub.id}
                className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#0e1013] bg-white/70 px-2.5 py-1 rounded-full">
                        {sub.subscriptionNumber}
                      </span>
                      <h4 className="text-lg font-extrabold text-[#0e1013] mt-2 tracking-tight">
                        {sub.planName}
                      </h4>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  <div className="my-4">
                    <span className="text-3xl font-extrabold text-[#0e1013] tracking-tight">
                      ${sub.totalAmount.toFixed(2)}
                    </span>
                    <span className="text-xs text-[#526071] font-medium uppercase ml-1">
                      / {sub.billingFrequency}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2 bg-white/60 p-3 rounded-2xl text-xs">
                    <div>
                      <span className="text-neutral-500 block text-[10px]">Start Date:</span>
                      <span className="font-bold text-[#0e1013]">{sub.startDate}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px]">Contract Expiry:</span>
                      <span className="font-bold text-[#0e1013]">{sub.expiryDate}</span>
                    </div>
                    <div className="col-span-2 border-t pt-1.5 mt-1">
                      <span className="text-neutral-500 block text-[10px]">Next Billing Cycle:</span>
                      <span className="font-bold text-sky-950">{sub.nextBillingDate}</span>
                    </div>
                  </div>

                  {/* Product Lines */}
                  <div className="mt-4">
                    <span className="text-[11px] font-bold text-[#0e1013] block mb-1">
                      Allocated Product Units:
                    </span>
                    <div className="space-y-1.5">
                      {sub.lines.map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between bg-white/70 px-3 py-1.5 rounded-xl text-xs"
                        >
                          <span className="font-semibold text-[#0e1013]">{l.productName}</span>
                          <span className="font-bold text-neutral-600">Qty: {l.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pause notes if paused */}
                  {sub.status === 'PAUSED' && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
                      <span className="font-bold block">Paused by Customer:</span>
                      <p>{sub.pauseReason}</p>
                    </div>
                  )}
                </div>

                {/* Customer Action Bar (Only permitted actions per plan rules) */}
                <div className="mt-5 pt-4 border-t border-[rgba(180,205,225,0.4)] flex flex-wrap items-center justify-between gap-2 text-xs">
                  {/* Auto-renew switch */}
                  <button
                    onClick={() => handleToggleRenewal(sub)}
                    className="flex items-center space-x-1.5 text-neutral-700 hover:text-black font-semibold"
                  >
                    <RotateCw size={14} className={sub.autoRenew ? 'text-emerald-600' : 'text-neutral-400'} />
                    <span>Auto-Renew: {sub.autoRenew ? 'ON' : 'OFF'}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {sub.status === 'ACTIVE' && plan?.pauseAllowed && (
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setIsPauseOpen(true);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-amber-800 rounded-xl font-bold transition flex items-center space-x-1 shadow-2xs"
                      >
                        <Pause size={12} />
                        <span>Request Pause</span>
                      </button>
                    )}

                    {sub.status === 'PAUSED' && (
                      <button
                        onClick={() => handleResume(sub)}
                        className="px-3 py-1.5 bg-[#0e1013] hover:bg-neutral-800 text-white rounded-xl font-bold transition flex items-center space-x-1"
                      >
                        <Play size={12} />
                        <span>Resume Now</span>
                      </button>
                    )}

                    {sub.status === 'ACTIVE' && (
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setIsCloseOpen(true);
                        }}
                        className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pause Modal */}
      <Modal
        isOpen={isPauseOpen}
        onClose={() => setIsPauseOpen(false)}
        title="Request Subscription Pause"
        subtitle={`Plan: ${selectedSub?.planName}`}
      >
        <form onSubmit={handlePause} className="space-y-4 text-xs font-medium text-[#334155]">
          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Reason for Temporary Pause</label>
            <textarea
              rows={3}
              required
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              placeholder="e.g. Vacation, seasonal hiatus, migration..."
            />
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
              className="px-5 py-2 rounded-full bg-[#0e1013] text-white font-bold hover:bg-neutral-800"
            >
              Confirm Pause
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel / Close Modal */}
      <Modal
        isOpen={isCloseOpen}
        onClose={() => setIsCloseOpen(false)}
        title="Cancel Subscription"
        subtitle={`Early termination policy for ${selectedSub?.planName}`}
      >
        <form onSubmit={handleClose} className="space-y-4 text-xs font-medium text-[#334155]">
          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Cancellation Feedback</label>
            <textarea
              rows={3}
              required
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl text-[11px] text-amber-900">
            Per agreement terms, any configured early termination fee will be assessed on final invoice.
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsCloseOpen(false)}
              className="px-4 py-2 rounded-full font-bold text-neutral-600"
            >
              Keep Subscription
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirm Cancellation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


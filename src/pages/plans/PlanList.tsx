import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { Plan, BillingFrequency } from '../../types';
import { usePlans, useCreatePlan, useUpdatePlan } from '../../hooks/usePlans';
import {
  Layers,
  Plus,
  Edit2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  RotateCw,
} from 'lucide-react';

export const PlanList: React.FC = () => {
  const { showToast } = useApp();
  const { data: rawPlans = [], isLoading } = usePlans();
  const createPlanMutation = useCreatePlan();
  const updatePlanMutation = useUpdatePlan();

  // Normalize lowercase billingFrequency for frontend component display
  const plans: Plan[] = rawPlans.map((p: any) => ({
    ...p,
    billingFrequency: (p.billingFrequency?.toLowerCase() || 'monthly') as BillingFrequency,
  }));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('monthly');
  const [minimumQuantity, setMinimumQuantity] = useState(1);
  const [price, setPrice] = useState(799);
  const [availableFrom, setAvailableFrom] = useState('2025-01-01');
  const [availableUntil, setAvailableUntil] = useState('2028-12-31');
  const [autoRenewDefault, setAutoRenewDefault] = useState(true);
  const [earlyClosurePenaltyPercentage, setEarlyClosurePenaltyPercentage] = useState(10);
  const [pauseAllowed, setPauseAllowed] = useState(true);
  const [maxPauseDays, setMaxPauseDays] = useState(60);
  const [description, setDescription] = useState('');

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setName('');
    setCode('PLN-NEW');
    setBillingFrequency('monthly');
    setMinimumQuantity(1);
    setPrice(499);
    setAvailableFrom(new Date().toISOString().split('T')[0]);
    setAvailableUntil('2028-12-31');
    setAutoRenewDefault(true);
    setEarlyClosurePenaltyPercentage(10);
    setPauseAllowed(true);
    setMaxPauseDays(30);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setCode(plan.code);
    setBillingFrequency(plan.billingFrequency);
    setMinimumQuantity(plan.minimumQuantity);
    setPrice(plan.price);
    setAvailableFrom(plan.availableFrom);
    setAvailableUntil(plan.availableUntil);
    setAutoRenewDefault(plan.autoRenewDefault);
    setEarlyClosurePenaltyPercentage(plan.earlyClosurePenaltyPercentage);
    setPauseAllowed(plan.pauseAllowed);
    setMaxPauseDays(plan.maxPauseDays);
    setDescription(plan.description);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      code,
      billingFrequency: billingFrequency.toUpperCase() as any,
      minimumQuantity: Number(minimumQuantity),
      price: Number(price),
      availableFrom,
      availableUntil,
      autoRenewDefault,
      earlyClosurePenaltyPercentage: Number(earlyClosurePenaltyPercentage),
      pauseAllowed,
      maxPauseDays: Number(maxPauseDays),
      description,
      status: 'active' as const,
    };

    if (editingPlan) {
      updatePlanMutation.mutate(
        { id: editingPlan.id, updates: payload },
        {
          onSuccess: () => showToast('Plan updated successfully.'),
          onError: (err: any) => showToast(err.message, 'error'),
        }
      );
    } else {
      createPlanMutation.mutate(payload, {
        onSuccess: () => showToast('Plan created successfully.'),
        onError: (err: any) => showToast(err.message, 'error'),
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Subscription Plans"
        subtitle="Manage billing cycles (daily, weekly, monthly, yearly), minimum commitments, pause limits, and early closure rules."
      />

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-[#d3e3ee] p-4 rounded-3xl border border-[rgba(180,205,225,0.3)] shadow-xs">
        <div>
          <h3 className="font-extrabold text-base text-[#0e1013]">Configured Plans</h3>
          <p className="text-xs text-[#526071]">
            Standardized policy templates driving automatic subscription billing & renewals.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-2.5 px-5 rounded-full transition shadow-xs"
        >
          <Plus size={16} />
          <span>New Plan</span>
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs flex flex-col justify-between hover:bg-[#c9dbe7] transition"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-white/70 px-2.5 py-1 rounded-full">
                  {plan.billingFrequency}
                </span>
                <button
                  onClick={() => handleOpenEdit(plan)}
                  className="p-1.5 rounded-full hover:bg-white text-neutral-600 hover:text-neutral-900 transition"
                >
                  <Edit2 size={14} />
                </button>
              </div>

              <h4 className="text-base font-extrabold text-[#0e1013] mt-2 tracking-tight">
                {plan.name}
              </h4>
              <p className="text-[11px] font-mono text-[#526071]">{plan.code}</p>

              <div className="my-4">
                <span className="text-3xl font-extrabold text-[#0e1013] tracking-tight">
                  ${plan.price.toFixed(2)}
                </span>
                <span className="text-xs text-[#475569] font-medium">/{plan.billingFrequency}</span>
              </div>

              <p className="text-xs text-[#526071] leading-relaxed mb-4">
                {plan.description}
              </p>

              {/* Rules and Policies */}
              <div className="space-y-2 bg-white/60 p-3 rounded-2xl text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#526071]">Min Quantity:</span>
                  <span className="font-bold text-[#0e1013]">{plan.minimumQuantity} seat(s)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#526071]">Auto-renew Default:</span>
                  <span className="font-bold text-[#0e1013]">
                    {plan.autoRenewDefault ? 'Enabled' : 'Manual'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#526071]">Pause Allowed:</span>
                  <span className="font-bold text-[#0e1013]">
                    {plan.pauseAllowed ? `Yes (max ${plan.maxPauseDays}d)` : 'Disallowed'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#526071]">Early Closure Penalty:</span>
                  <span className="font-bold text-[#0e1013]">{plan.earlyClosurePenaltyPercentage}% fee</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[rgba(160,190,215,0.4)] text-[10px] text-neutral-400 flex items-center justify-between">
              <span>Valid: {plan.availableFrom}</span>
              <span>Until: {plan.availableUntil}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Plan' : 'Create Subscription Plan'}
        subtitle="Configure billing frequency, early termination fees, and pause eligibility rules."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-[#334155]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Plan Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
                placeholder="e.g. Growth Monthly Cloud"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Plan Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs font-mono text-[#0e1013]"
                placeholder="e.g. PLN-GROWTH-M"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Billing Frequency</label>
              <select
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value as BillingFrequency)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Base Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Min Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={minimumQuantity}
                onChange={(e) => setMinimumQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Available From</label>
              <input
                type="date"
                required
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Available Until</label>
              <input
                type="date"
                required
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Plan Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs text-[#0e1013]"
              placeholder="Key specifications, target user tier, SLA agreements..."
            />
          </div>

          {/* Business rules & lifecycle policy */}
          <div className="p-3 bg-white/70 rounded-2xl space-y-3">
            <h5 className="font-bold text-[#0e1013] text-xs">Lifecycle & Renewal Rules</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRenewDefault}
                  onChange={(e) => setAutoRenewDefault(e.target.checked)}
                  className="rounded text-[#0e1013] focus:ring-0"
                />
                <span className="text-xs font-semibold text-[#0e1013]">Auto-renew Default</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={pauseAllowed}
                  onChange={(e) => setPauseAllowed(e.target.checked)}
                  className="rounded text-[#0e1013] focus:ring-0"
                />
                <span className="text-xs font-semibold text-[#0e1013]">Allow Subscriptions to Pause</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block mb-1 text-[11px] font-bold text-[#0e1013]">
                  Max Pause Duration (Days)
                </label>
                <input
                  type="number"
                  disabled={!pauseAllowed}
                  value={maxPauseDays}
                  onChange={(e) => setMaxPauseDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-neutral-200 outline-none text-xs disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-bold text-[#0e1013]">
                  Early Closure Penalty Fee (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={earlyClosurePenaltyPercentage}
                  onChange={(e) => setEarlyClosurePenaltyPercentage(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-neutral-200 outline-none text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-[rgba(160,190,215,0.4)]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-neutral-600 hover:bg-white/60 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#0e1013] text-white text-xs font-bold hover:bg-neutral-800 transition shadow-xs"
            >
              {editingPlan ? 'Save Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


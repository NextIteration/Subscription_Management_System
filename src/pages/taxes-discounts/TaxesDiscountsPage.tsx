import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { TaxRule, DiscountRule } from '../../types';
import { Percent, Tag, Plus, Edit2, CheckCircle2, ShieldCheck, Calendar, DollarSign } from 'lucide-react';
import * as taxApi from '../../api/tax.api';
import * as discountApi from '../../api/discount.api';

export const TaxesDiscountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast, taxRules: fallbackTaxRules, discountRules: fallbackDiscountRules } = useApp();
  const [activeTab, setActiveTab] = useState<'taxes' | 'discounts'>('taxes');

  // Queries
  const { data: taxRules = fallbackTaxRules } = useQuery({
    queryKey: ['tax-rules'],
    queryFn: taxApi.fetchTaxRules,
    placeholderData: fallbackTaxRules,
  });

  const { data: discountRules = fallbackDiscountRules } = useQuery({
    queryKey: ['discount-rules'],
    queryFn: discountApi.fetchDiscountRules,
    placeholderData: fallbackDiscountRules,
  });

  // Mutations
  const createTaxMutation = useMutation({
    mutationFn: taxApi.createTaxRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rules'] });
      showToast('Tax rule created successfully');
    },
    onError: (err: any) => showToast(err.message || 'Failed to create tax rule', 'error'),
  });

  const updateTaxMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaxRule> }) => taxApi.updateTaxRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rules'] });
      showToast('Tax rule updated successfully');
    },
    onError: (err: any) => showToast(err.message || 'Failed to update tax rule', 'error'),
  });

  const createDiscountMutation = useMutation({
    mutationFn: discountApi.createDiscountRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-rules'] });
      showToast('Discount rule created successfully');
    },
    onError: (err: any) => showToast(err.message || 'Failed to create discount rule', 'error'),
  });

  const updateDiscountMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DiscountRule> }) => discountApi.updateDiscountRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-rules'] });
      showToast('Discount rule updated successfully');
    },
    onError: (err: any) => showToast(err.message || 'Failed to update discount rule', 'error'),
  });

  // Tax Modal State
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxRule | null>(null);
  const [taxName, setTaxName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [taxRate, setTaxRate] = useState(8.25);
  const [taxCountry, setTaxCountry] = useState('United States');
  const [taxState, setTaxState] = useState('California');
  const [taxDesc, setTaxDesc] = useState('');
  const [taxIsDefault, setTaxIsDefault] = useState(false);

  // Discount Modal State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountRule | null>(null);
  const [discCode, setDiscCode] = useState('');
  const [discDesc, setDiscDesc] = useState('');
  const [discType, setDiscType] = useState<'percentage' | 'fixed'>('percentage');
  const [discValue, setDiscValue] = useState(15);
  const [discMinOrder, setDiscMinOrder] = useState(1000);
  const [discValidFrom, setDiscValidFrom] = useState('2025-01-01');
  const [discValidUntil, setDiscValidUntil] = useState('2027-12-31');
  const [discMaxUses, setDiscMaxUses] = useState(500);

  const handleOpenCreateTax = () => {
    setEditingTax(null);
    setTaxName('');
    setTaxCode('TAX-');
    setTaxRate(8.25);
    setTaxCountry('United States');
    setTaxState('California');
    setTaxDesc('');
    setTaxIsDefault(false);
    setIsTaxModalOpen(true);
  };

  const handleOpenEditTax = (tax: TaxRule) => {
    setEditingTax(tax);
    setTaxName(tax.name);
    setTaxCode(tax.code);
    setTaxRate(tax.ratePercentage);
    setTaxCountry(tax.country);
    setTaxState(tax.state || '');
    setTaxDesc(tax.description);
    setTaxIsDefault(tax.isDefault);
    setIsTaxModalOpen(true);
  };

  const handleSubmitTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTax) {
      await updateTaxMutation.mutateAsync({
        id: editingTax.id,
        data: {
          name: taxName,
          code: taxCode,
          ratePercentage: Number(taxRate),
          country: taxCountry,
          state: taxState,
          description: taxDesc,
          isDefault: taxIsDefault,
        },
      });
    } else {
      await createTaxMutation.mutateAsync({
        name: taxName,
        code: taxCode,
        ratePercentage: Number(taxRate),
        country: taxCountry,
        state: taxState,
        description: taxDesc,
        isDefault: taxIsDefault,
        status: 'active',
      });
    }
    setIsTaxModalOpen(false);
  };

  const handleOpenCreateDiscount = () => {
    setEditingDiscount(null);
    setDiscCode('');
    setDiscDesc('');
    setDiscType('percentage');
    setDiscValue(15);
    setDiscMinOrder(500);
    setDiscValidFrom(new Date().toISOString().split('T')[0]);
    setDiscValidUntil('2027-12-31');
    setDiscMaxUses(250);
    setIsDiscountModalOpen(true);
  };

  const handleOpenEditDiscount = (d: DiscountRule) => {
    setEditingDiscount(d);
    setDiscCode(d.code);
    setDiscDesc(d.description);
    setDiscType(d.type);
    setDiscValue(d.value);
    setDiscMinOrder(d.minOrderAmount);
    setDiscValidFrom(d.validFrom?.split('T')[0] || d.validFrom);
    setDiscValidUntil(d.validUntil?.split('T')[0] || d.validUntil);
    setDiscMaxUses(d.maxUses);
    setIsDiscountModalOpen(true);
  };

  const handleSubmitDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDiscount) {
      await updateDiscountMutation.mutateAsync({
        id: editingDiscount.id,
        data: {
          code: discCode.toUpperCase(),
          description: discDesc,
          type: discType,
          value: Number(discValue),
          minOrderAmount: Number(discMinOrder),
          validFrom: discValidFrom,
          validUntil: discValidUntil,
          maxUses: Number(discMaxUses),
        },
      });
    } else {
      await createDiscountMutation.mutateAsync({
        code: discCode.toUpperCase(),
        description: discDesc,
        type: discType,
        value: Number(discValue),
        minOrderAmount: Number(discMinOrder),
        validFrom: discValidFrom,
        validUntil: discValidUntil,
        maxUses: Number(discMaxUses),
        status: 'active',
      });
    }
    setIsDiscountModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Taxes & Discount Rules"
        subtitle="Jurisdictional tax compliance, nexus definitions, promo vouchers, and subscription discount eligibility."
      />

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#d3e3ee] p-4 rounded-3xl border border-[rgba(180,205,225,0.3)] shadow-xs">
        <div className="flex items-center space-x-2 bg-white/70 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('taxes')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'taxes'
                ? 'bg-[#0e1013] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Percent size={14} />
            <span>Tax Rules ({taxRules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('discounts')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'discounts'
                ? 'bg-[#0e1013] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Tag size={14} />
            <span>Discount Rules ({discountRules.length})</span>
          </button>
        </div>

        {activeTab === 'taxes' ? (
          <button
            onClick={handleOpenCreateTax}
            className="flex items-center justify-center space-x-2 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-2 px-4 rounded-full transition shadow-xs"
          >
            <Plus size={16} />
            <span>New Tax Rule</span>
          </button>
        ) : (
          <button
            onClick={handleOpenCreateDiscount}
            className="flex items-center justify-center space-x-2 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-2 px-4 rounded-full transition shadow-xs"
          >
            <Plus size={16} />
            <span>New Discount Rule</span>
          </button>
        )}
      </div>

      {/* Taxes Tab */}
      {activeTab === 'taxes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {taxRules.map((tax) => (
            <div
              key={tax.id}
              className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] font-bold text-[#0e1013] bg-white/70 px-2 py-0.5 rounded-lg">
                        {tax.code}
                      </span>
                      {tax.isDefault && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Default Rule
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-extrabold text-[#0e1013] mt-2">{tax.name}</h4>
                  </div>
                  <button
                    onClick={() => handleOpenEditTax(tax)}
                    className="p-1.5 rounded-full hover:bg-white text-neutral-600"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>

                <div className="my-3 flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-[#0e1013]">
                    {tax.ratePercentage}%
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">Standard Assessment</span>
                </div>

                <p className="text-xs text-[#526071] leading-relaxed">{tax.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[rgba(160,190,215,0.4)] text-[11px] text-neutral-500 flex justify-between">
                <span>Country: {tax.country}</span>
                <span>Jurisdiction: {tax.state || 'National'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Discounts Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {discountRules.map((disc) => (
            <div
              key={disc.id}
              className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-black text-white bg-[#0e1013] px-3 py-1 rounded-full tracking-wider">
                    {disc.code}
                  </span>
                  <button
                    onClick={() => handleOpenEditDiscount(disc)}
                    className="p-1.5 rounded-full hover:bg-white text-neutral-600"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>

                <h4 className="text-base font-extrabold text-[#0e1013] mt-2">{disc.description}</h4>

                <div className="my-3">
                  <span className="text-2xl font-extrabold text-[#0e1013]">
                    {disc.type === 'percentage' ? `${disc.value}% OFF` : `$${disc.value} CREDITS`}
                  </span>
                  <span className="text-[11px] text-neutral-500 block mt-0.5">
                    Min order commitment: ${disc.minOrderAmount}
                  </span>
                </div>

                <div className="bg-white/60 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Quota Redemption:</span>
                    <span className="font-bold text-[#0e1013]">
                      {disc.usedCount} / {disc.maxUses} used
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0e1013] h-full"
                      style={{ width: `${Math.min(100, (disc.usedCount / disc.maxUses) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[rgba(160,190,215,0.4)] text-[10px] text-neutral-400 flex justify-between">
                <span>Valid: {disc.validFrom?.split('T')[0] || disc.validFrom}</span>
                <span>Until: {disc.validUntil?.split('T')[0] || disc.validUntil}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tax Rule Modal */}
      <Modal
        isOpen={isTaxModalOpen}
        onClose={() => setIsTaxModalOpen(false)}
        title={editingTax ? 'Edit Tax Rule' : 'Create Tax Rule'}
        subtitle="Define regional tax rates and default applicability."
      >
        <form onSubmit={handleSubmitTax} className="space-y-4 text-xs font-medium text-[#334155]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Rule Name</label>
              <input
                type="text"
                required
                value={taxName}
                onChange={(e) => setTaxName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
                placeholder="e.g. California SaaS Assessment"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Tax Reference Code</label>
              <input
                type="text"
                required
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Rate Percentage (%)</label>
              <input
                type="number"
                step="0.001"
                required
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs font-bold"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Country</label>
              <input
                type="text"
                required
                value={taxCountry}
                onChange={(e) => setTaxCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">State / Province</label>
              <input
                type="text"
                value={taxState}
                onChange={(e) => setTaxState(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Description & Legal Reference</label>
            <textarea
              rows={2}
              value={taxDesc}
              onChange={(e) => setTaxDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
            />
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={taxIsDefault}
              onChange={(e) => setTaxIsDefault(e.target.checked)}
              className="rounded text-[#0e1013]"
            />
            <span className="font-bold text-[#0e1013]">Set as System Default Tax Rule</span>
          </label>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsTaxModalOpen(false)}
              className="px-4 py-2 rounded-full font-bold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTaxMutation.isPending || updateTaxMutation.isPending}
              className="px-5 py-2 rounded-full bg-[#0e1013] text-white font-bold hover:bg-neutral-800 disabled:opacity-50"
            >
              Save Rule
            </button>
          </div>
        </form>
      </Modal>

      {/* Discount Modal */}
      <Modal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        title={editingDiscount ? 'Edit Discount Voucher' : 'Create Discount Rule'}
        subtitle="Define coupon code, discount percentage or fixed deduction, and usage caps."
      >
        <form onSubmit={handleSubmitDiscount} className="space-y-4 text-xs font-medium text-[#334155]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Discount Promo Code</label>
              <input
                type="text"
                required
                value={discCode}
                onChange={(e) => setDiscCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs font-mono uppercase font-bold"
                placeholder="e.g. ANNUAL20"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Description</label>
              <input
                type="text"
                required
                value={discDesc}
                onChange={(e) => setDiscDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
                placeholder="e.g. 20% Off Enterprise Commitment"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Discount Type</label>
              <select
                value={discType}
                onChange={(e) => setDiscType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Value ({discType === 'percentage' ? '%' : '$'})</label>
              <input
                type="number"
                required
                value={discValue}
                onChange={(e) => setDiscValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs font-bold"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Min Order ($)</label>
              <input
                type="number"
                required
                value={discMinOrder}
                onChange={(e) => setDiscMinOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Valid From</label>
              <input
                type="date"
                required
                value={discValidFrom}
                onChange={(e) => setDiscValidFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Valid Until</label>
              <input
                type="date"
                required
                value={discValidUntil}
                onChange={(e) => setDiscValidUntil(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Maximum Uses</label>
              <input
                type="number"
                min="1"
                required
                value={discMaxUses}
                onChange={(e) => setDiscMaxUses(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsDiscountModalOpen(false)}
              className="px-4 py-2 rounded-full font-bold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createDiscountMutation.isPending || updateDiscountMutation.isPending}
              className="px-5 py-2 rounded-full bg-[#0e1013] text-white font-bold hover:bg-neutral-800 disabled:opacity-50"
            >
              Save Discount Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { Quotation, QuotationTemplate, LineItem } from '../../types';
import {
  useQuotations,
  useQuotationTemplates,
  useCreateQuotation,
  useUpdateQuotationStatus,
  useConvertQuotation,
  useCreateQuotationTemplate,
} from '../../hooks/useQuotations';
import { useCustomers } from '../../hooks/useCustomers';
import { usePlans } from '../../hooks/usePlans';
import { useProducts } from '../../hooks/useProducts';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Send,
  Calendar,
  Building2,
  DollarSign,
  ArrowRight,
  FileCheck2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuotationList: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();

  const { data: rawQuotations = [], isLoading: isQuotationsLoading } = useQuotations();
  const { data: quotationTemplates = [] } = useQuotationTemplates();
  const { data: customerData } = useCustomers();
  const customers = customerData?.data || [];
  const { data: plans = [] } = usePlans();
  const { data: products = [] } = useProducts();

  const createQuotationMutation = useCreateQuotation();
  const updateStatusMutation = useUpdateQuotationStatus();
  const convertMutation = useConvertQuotation();
  const createTemplateMutation = useCreateQuotationTemplate();

  // Normalize status casing for UI badge
  const quotations: Quotation[] = rawQuotations.map((q: any) => ({
    ...q,
    status: (q.status?.toLowerCase() || 'draft') as Quotation['status'],
  }));

  const [activeTab, setActiveTab] = useState<'quotations' | 'templates'>('quotations');
  const [searchTerm, setSearchTerm] = useState('');
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // New quotation form state
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]?.id || '');
  const [selectedPlan, setSelectedPlan] = useState(plans[0]?.id || '');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [lines, setLines] = useState<LineItem[]>([
    {
      id: `ql-${Date.now()}`,
      productId: products[0]?.id || 'prod-1',
      productName: products[0]?.name || 'Base License',
      quantity: 1,
      unitPrice: products[0]?.salesPrice || 499,
      taxRate: 8.25,
      lineTotal: products[0]?.salesPrice || 499,
    },
  ]);
  const [notes, setNotes] = useState('Standard enterprise quotation valid for 30 calendar days.');

  // Template form state
  const [tmplName, setTmplName] = useState('');
  const [tmplDesc, setTmplDesc] = useState('');
  const [tmplPlanId, setTmplPlanId] = useState(plans[0]?.id || '');
  const [tmplValidity, setTmplValidity] = useState(30);

  // Filtered lists
  const filteredQuotations = quotations.filter(
    (q) =>
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tmpl = quotationTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;

    setSelectedPlan(tmpl.planId);
    setValidityDays(tmpl.validityDays);

    const generatedLines: LineItem[] = tmpl.defaultLines.map((dl, idx) => {
      const prod = products.find((p) => p.id === dl.productId) || products[0];
      const variant = prod.variants.find((v) => v.id === dl.variantId);
      const unitPrice = prod.salesPrice + (variant?.priceAdjustment || 0);
      return {
        id: `ql-${Date.now()}-${idx}`,
        productId: prod.id,
        productName: variant ? `${prod.name} (${variant.name})` : prod.name,
        variantId: variant?.id,
        variantName: variant?.name,
        quantity: dl.quantity,
        unitPrice,
        taxRate: 8.25,
        lineTotal: unitPrice * dl.quantity,
      };
    });

    setLines(generatedLines);
  };

  const handleAddLine = () => {
    const defaultProd = products[0];
    const newLine: LineItem = {
      id: `ql-${Date.now()}`,
      productId: defaultProd.id,
      productName: defaultProd.name,
      quantity: 1,
      unitPrice: defaultProd.salesPrice,
      taxRate: 8.25,
      lineTotal: defaultProd.salesPrice,
    };
    setLines([...lines, newLine]);
  };

  const handleLineChange = (id: string, updates: Partial<LineItem>) => {
    setLines(
      lines.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates };
        updated.lineTotal = updated.quantity * updated.unitPrice;
        return updated;
      })
    );
  };

  const handleRemoveLine = (id: string) => {
    setLines(lines.filter((l) => l.id !== id));
  };

  const calculateSubtotal = () => lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const calculateTax = () => lines.reduce((sum, l) => sum + (l.lineTotal * l.taxRate) / 100, 0);
  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === selectedCustomer) || customers[0];
    const plan = plans.find((p) => p.id === selectedPlan) || plans[0];

    const validUntilDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    createQuotationMutation.mutate(
      {
        customerId: cust.id,
        customerName: cust.name,
        customerEmail: cust.email,
        planId: plan.id,
        planName: plan.name,
        templateId: selectedTemplate || undefined,
        validUntil: validUntilDate,
        lines,
        subtotal: calculateSubtotal(),
        taxAmount: calculateTax(),
        discountAmount: 0,
        totalAmount: calculateTotal(),
        notes,
      },
      {
        onSuccess: (data: any) => showToast(data.message || 'Quotation created successfully.'),
        onError: (err: any) => showToast(err.message, 'error'),
      }
    );

    setIsQuotationModalOpen(false);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    createTemplateMutation.mutate(
      {
        name: tmplName,
        description: tmplDesc,
        planId: tmplPlanId,
        validityDays: tmplValidity,
        defaultLines: [
          { productId: products[0]?.id || 'prod-1', quantity: 1 },
        ],
      },
      {
        onSuccess: () => showToast('Quotation template created successfully.'),
        onError: (err: any) => showToast(err.message, 'error'),
      }
    );
    setIsTemplateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Quotation Management"
        subtitle="Prepare customer proposals, apply standardized bundle templates, track expiration, and convert to active subscriptions."
      />

      {/* Navigation tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#d3e3ee] p-4 rounded-3xl border border-[rgba(180,205,225,0.3)] shadow-xs">
        <div className="flex items-center space-x-2 bg-white/70 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('quotations')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'quotations'
                ? 'bg-[#0e1013] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Quotations ({quotations.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'templates'
                ? 'bg-[#0e1013] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Quotation Templates ({quotationTemplates.length})
          </button>
        </div>

        {activeTab === 'quotations' ? (
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-white/80 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#0e1013]"
              />
            </div>
            <button
              onClick={() => setIsQuotationModalOpen(true)}
              className="flex items-center space-x-2 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-2 px-4 rounded-full transition shadow-xs"
            >
              <Plus size={16} />
              <span>Prepare Quotation</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center space-x-2 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-2 px-4 rounded-full transition shadow-xs"
          >
            <Plus size={16} />
            <span>New Template</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'quotations' ? (
        <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[rgba(180,205,225,0.5)] text-[#475569] font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Quotation #</th>
                  <th className="pb-3 px-3">Client</th>
                  <th className="pb-3 px-3">Target Plan</th>
                  <th className="pb-3 px-3">Validity</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  <th className="pb-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(180,205,225,0.3)]">
                {filteredQuotations.map((q) => {
                  const isExpired = new Date(q.validUntil) < new Date() && q.status !== 'accepted';

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-white/40 transition cursor-pointer"
                      onClick={() => setSelectedQuotation(q)}
                    >
                      <td className="py-3.5 px-3 font-mono font-extrabold text-[#0e1013]">
                        {q.quotationNumber}
                      </td>

                      <td className="py-3.5 px-3">
                        <p className="font-bold text-[#0e1013]">{q.customerName}</p>
                        <p className="text-[11px] text-[#526071]">{q.customerEmail}</p>
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-[#0e1013]">{q.planName}</td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`font-semibold ${
                            isExpired ? 'text-rose-600 font-bold' : 'text-[#475569]'
                          }`}
                        >
                          {q.validUntil} {isExpired && '(Expired)'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <StatusBadge status={isExpired ? 'expired' : q.status} />
                      </td>

                      <td className="py-3.5 px-3 text-right font-extrabold text-sm text-[#0e1013]">
                        ${q.totalAmount.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-1.5">
                          {q.status === 'draft' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate(
                                  { id: q.id, status: 'SENT' },
                                  {
                                    onSuccess: () => showToast('Quotation sent to client.'),
                                    onError: (err: any) => showToast(err.message, 'error'),
                                  }
                                )
                              }
                              className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-800 rounded-lg text-[11px] font-bold flex items-center space-x-1 shadow-2xs"
                              title="Dispatch quotation to client"
                            >
                              <Send size={12} />
                              <span>Send</span>
                            </button>
                          )}

                          {q.status === 'sent' && (
                            <button
                              disabled={isExpired}
                              onClick={() =>
                                convertMutation.mutate(q.id, {
                                  onSuccess: (data: any) =>
                                    showToast(data.message || 'Quotation converted to subscription!'),
                                  onError: (err: any) => showToast(err.message, 'error'),
                                })
                              }
                              className="px-2.5 py-1 bg-[#0e1013] hover:bg-neutral-800 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 disabled:opacity-40"
                              title="Accept and convert quotation into live subscription"
                            >
                              <FileCheck2 size={12} />
                              <span>Convert</span>
                            </button>
                          )}

                          {q.status === 'accepted' && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Converted
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Quotation Templates Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quotationTemplates.map((tmpl) => {
            const plan = plans.find((p) => p.id === tmpl.planId);
            return (
              <div
                key={tmpl.id}
                className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-white/70 px-2.5 py-1 rounded-full">
                    Template • {tmpl.validityDays} Days Validity
                  </span>
                  <h4 className="text-base font-extrabold text-[#0e1013] mt-2 tracking-tight">
                    {tmpl.name}
                  </h4>
                  <p className="text-xs text-[#526071] mt-1 leading-relaxed">{tmpl.description}</p>

                  <div className="my-4 bg-white/60 p-3 rounded-2xl text-xs">
                    <span className="text-[#526071] block text-[11px]">Associated Plan:</span>
                    <span className="font-bold text-[#0e1013]">{plan?.name || 'Standard Plan'}</span>
                    <span className="text-[11px] text-neutral-400 block mt-1">
                      {tmpl.defaultLines.length} default line items preconfigured
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleTemplateSelect(tmpl.id);
                    setActiveTab('quotations');
                    setIsQuotationModalOpen(true);
                  }}
                  className="w-full bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-2.5 rounded-full transition shadow-xs flex items-center justify-center space-x-2"
                >
                  <Plus size={14} />
                  <span>Use This Template</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Quotation Details Modal */}
      {selectedQuotation && (
        <Modal
          isOpen={!!selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
          title={`Quotation ${selectedQuotation.quotationNumber}`}
          subtitle={`Client: ${selectedQuotation.customerName} • Valid Until: ${selectedQuotation.validUntil}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between bg-white/70 p-3.5 rounded-2xl">
              <div>
                <span className="text-[11px] text-[#526071] block">Plan Selected</span>
                <span className="font-bold text-sm text-[#0e1013]">{selectedQuotation.planName}</span>
              </div>
              <StatusBadge status={selectedQuotation.status} />
            </div>

            <div>
              <span className="font-bold text-[#0e1013] block mb-2">Quotation Line Items:</span>
              <div className="space-y-2">
                {selectedQuotation.lines.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl"
                  >
                    <div>
                      <span className="font-bold text-[#0e1013]">{l.productName}</span>
                      <span className="text-[11px] text-[#526071] block">
                        Qty: {l.quantity} × ${l.unitPrice.toFixed(2)} (Tax: {l.taxRate}%)
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-[#0e1013]">
                      ${l.lineTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotal, Tax, Total */}
            <div className="bg-white/60 p-3 rounded-2xl space-y-1.5 text-right font-medium">
              <div className="flex justify-between">
                <span className="text-[#526071]">Subtotal:</span>
                <span className="font-bold text-[#0e1013]">
                  ${selectedQuotation.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526071]">Estimated Tax:</span>
                <span className="font-bold text-[#0e1013]">
                  ${selectedQuotation.taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1.5 text-sm font-extrabold text-[#0e1013]">
                <span>Total Proposal:</span>
                <span>${selectedQuotation.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 pt-3 border-t">
              {selectedQuotation.status !== 'accepted' && (
                <button
                  onClick={() => {
                    convertMutation.mutate(selectedQuotation.id, {
                      onSuccess: (data: any) => showToast(data.message || 'Quotation converted to subscription!'),
                      onError: (err: any) => showToast(err.message, 'error'),
                    });
                    setSelectedQuotation(null);
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#0e1013] text-white font-bold hover:bg-neutral-800 transition shadow-xs flex items-center space-x-2"
                >
                  <FileCheck2 size={16} />
                  <span>Accept & Generate Subscription</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Prepare Quotation Modal */}
      <Modal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        title="Prepare Customer Quotation"
        subtitle="Select customer, assign bundle template or customized product lines, and define validity terms."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs font-medium text-[#334155]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Target Customer</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
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
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.billingFrequency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Apply Template (Optional)</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              >
                <option value="">Custom Items</option>
                {quotationTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-[#0e1013]">Quotation Products & Lines</label>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-bold text-sky-900 hover:underline flex items-center space-x-1"
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lines.map((l) => (
                <div key={l.id} className="flex items-center space-x-2 bg-white/70 p-2 rounded-xl">
                  <select
                    value={l.productId}
                    onChange={(e) => {
                      const p = products.find((prod) => prod.id === e.target.value);
                      if (p) {
                        handleLineChange(l.id, {
                          productId: p.id,
                          productName: p.name,
                          unitPrice: p.salesPrice,
                        });
                      }
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.salesPrice})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center space-x-1 w-20">
                    <span className="text-[10px] text-neutral-400">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={l.quantity}
                      onChange={(e) => handleLineChange(l.id, { quantity: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs"
                    />
                  </div>

                  <div className="flex items-center space-x-1 w-24">
                    <span className="text-neutral-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={l.unitPrice}
                      onChange={(e) => handleLineChange(l.id, { unitPrice: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs"
                    />
                  </div>

                  <div className="w-20 font-mono font-bold text-xs text-right pr-2">
                    ${l.lineTotal.toFixed(2)}
                  </div>

                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(l.id)}
                      className="text-neutral-400 hover:text-rose-600 p-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Validity Period (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Terms & Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-white/60 p-3 rounded-2xl flex items-center justify-between font-bold">
            <span className="text-neutral-600">Total Quotation Value:</span>
            <span className="text-base text-[#0e1013] font-extrabold font-mono">
              ${calculateTotal().toFixed(2)}
            </span>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-[rgba(160,190,215,0.4)]">
            <button
              type="button"
              onClick={() => setIsQuotationModalOpen(false)}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-neutral-600 hover:bg-white/60 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#0e1013] text-white text-xs font-bold hover:bg-neutral-800 transition shadow-xs"
            >
              Save Quotation
            </button>
          </div>
        </form>
      </Modal>

      {/* New Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Create Quotation Template"
        subtitle="Define predefined plans and product lines for sales team reuse."
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs font-medium text-[#334155]">
          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Template Name</label>
            <input
              type="text"
              required
              value={tmplName}
              onChange={(e) => setTmplName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              placeholder="e.g. Startup Seed Package"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Description</label>
            <textarea
              rows={2}
              value={tmplDesc}
              onChange={(e) => setTmplDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              placeholder="Package contents and scope..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Associated Plan</label>
              <select
                value={tmplPlanId}
                onChange={(e) => setTmplPlanId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Default Validity (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={tmplValidity}
                onChange={(e) => setTmplValidity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(false)}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-neutral-600 hover:bg-white/60 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#0e1013] text-white text-xs font-bold hover:bg-neutral-800 transition"
            >
              Save Template
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


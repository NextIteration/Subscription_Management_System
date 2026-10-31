import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { Payment } from '../../types';
import { Search, Plus } from 'lucide-react';
import * as paymentApi from '../../api/payment.api';
import * as invoiceApi from '../../api/invoice.api';

export const PaymentList: React.FC = () => {
  const queryClient = useQueryClient();
  const { payments: fallbackPayments, invoices: fallbackInvoices, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Queries
  const { data: paymentData } = useQuery({
    queryKey: ['payments', searchTerm],
    queryFn: () => paymentApi.fetchPayments({ search: searchTerm }),
  });

  const { data: invoiceData } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoiceApi.fetchInvoices(),
  });

  const payments = paymentData?.items || fallbackPayments;
  const invoices = invoiceData?.items || fallbackInvoices;

  // Filter invoices that have an outstanding balance
  const unpaidInvoices = invoices.filter((i) => i.amountDue > 0 && i.status.toUpperCase() !== 'CANCELLED');

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(unpaidInvoices[0]?.id || invoices[0]?.id || '');
  const [amount, setAmount] = useState<number>(500);
  const [paymentMethod, setPaymentMethod] = useState<Payment['paymentMethod']>('Credit Card');
  const [reference, setReference] = useState(`REF-${Math.floor(100000 + Math.random() * 900000)}`);

  // Mutation
  const recordPaymentMutation = useMutation({
    mutationFn: paymentApi.recordPayment,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      showToast(`Payment ${result.payment.paymentNumber} of $${result.payment.amount.toFixed(2)} recorded`);
      setIsRecordModalOpen(false);
    },
    onError: (err: any) => showToast(err.message || 'Failed to record payment', 'error'),
  });

  const filteredPayments = payments.filter(
    (p) =>
      p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p as any).invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const inv = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];
    if (!inv) return;

    await recordPaymentMutation.mutateAsync({
      invoiceId: inv.id,
      amount: Number(amount),
      paymentMethod,
      reference,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: 'Recorded via payment reconciliation module',
    });
  };

  return (
    <div className="space-y-6">
      <Header
        title="Payment Management"
        subtitle="Process collections, reconcile settlements, inspect transaction references, and monitor payment rails."
      />

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#d3e3ee] p-4 rounded-3xl border border-[rgba(180,205,225,0.3)] shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by payment #, invoice #, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/80 border border-transparent focus:border-[rgba(160,190,215,0.8)] focus:outline-none text-xs text-[#0e1013]"
          />
        </div>

        <button
          onClick={() => {
            setReference(`REF-${Math.floor(100000 + Math.random() * 900000)}`);
            if (unpaidInvoices.length > 0) {
              setSelectedInvoiceId(unpaidInvoices[0].id);
              setAmount(unpaidInvoices[0].amountDue);
            }
            setIsRecordModalOpen(true);
          }}
          className="flex items-center justify-center space-x-2 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-2.5 px-5 rounded-full transition shadow-xs"
        >
          <Plus size={16} />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[rgba(180,205,225,0.5)] text-[#475569] font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Payment #</th>
                <th className="pb-3 px-3">Linked Invoice</th>
                <th className="pb-3 px-3">Customer</th>
                <th className="pb-3 px-3">Payment Method</th>
                <th className="pb-3 px-3">Settlement Date</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(180,205,225,0.3)]">
              {filteredPayments.map((pay) => (
                <tr
                  key={pay.id}
                  className="hover:bg-white/40 transition cursor-pointer"
                  onClick={() => setSelectedPayment(pay)}
                >
                  <td className="py-3.5 px-3 font-mono font-extrabold text-[#0e1013]">
                    {pay.paymentNumber}
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold text-sky-900">
                    {pay.invoiceNumber || (pay as any).invoice?.invoiceNumber}
                  </td>

                  <td className="py-3.5 px-3 font-bold text-[#0e1013]">{pay.customerName}</td>

                  <td className="py-3.5 px-3">
                    <span className="bg-white/70 px-2.5 py-1 rounded-full text-neutral-700 font-semibold">
                      {pay.paymentMethod}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-neutral-600 font-medium">
                    {pay.paymentDate?.split('T')[0] || pay.paymentDate}
                  </td>

                  <td className="py-3.5 px-3">
                    <StatusBadge status={pay.status} />
                  </td>

                  <td className="py-3.5 px-3 text-right font-extrabold text-sm text-[#0e1013]">
                    ${pay.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={`Payment Receipt ${selectedPayment.paymentNumber}`}
          subtitle={`Settlement applied towards ${selectedPayment.invoiceNumber || (selectedPayment as any).invoice?.invoiceNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-white/80 p-4 rounded-2xl border border-[rgba(180,205,225,0.4)] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 block font-bold uppercase">
                  Amount Transferred
                </span>
                <span className="text-2xl font-black font-mono text-[#0e1013]">
                  ${selectedPayment.amount.toFixed(2)}
                </span>
              </div>
              <StatusBadge status={selectedPayment.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 bg-white/60 p-3 rounded-2xl">
              <div>
                <span className="text-neutral-500 block">Payer / Organization:</span>
                <span className="font-bold text-[#0e1013]">{selectedPayment.customerName}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Rail / Method:</span>
                <span className="font-bold text-[#0e1013]">{selectedPayment.paymentMethod}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Processed On:</span>
                <span className="font-bold text-[#0e1013]">
                  {selectedPayment.paymentDate?.split('T')[0] || selectedPayment.paymentDate}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Transaction Reference:</span>
                <span className="font-mono font-bold text-[#0e1013]">{selectedPayment.reference}</span>
              </div>
            </div>

            {selectedPayment.notes && (
              <p className="text-neutral-600 bg-white/40 p-2.5 rounded-xl">
                {selectedPayment.notes}
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Received Payment"
        subtitle="Manually allocate client funds against an outstanding or issued invoice."
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs font-medium text-[#334155]">
          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Select Outstanding Invoice</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => {
                setSelectedInvoiceId(e.target.value);
                const inv = invoices.find((i) => i.id === e.target.value);
                if (inv) setAmount(inv.amountDue > 0 ? inv.amountDue : inv.totalAmount);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
            >
              {(unpaidInvoices.length > 0 ? unpaidInvoices : invoices).map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customerName} (Due: ${inv.amountDue.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Amount Received ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="ACH">ACH Direct</option>
                <option value="Stripe">Stripe Checkout</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Gateway / Settlement Reference</label>
            <input
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs font-mono"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 rounded-full font-bold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordPaymentMutation.isPending}
              className="px-5 py-2 rounded-full bg-[#0e1013] text-white font-bold hover:bg-neutral-800 disabled:opacity-50"
            >
              Submit Settlement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

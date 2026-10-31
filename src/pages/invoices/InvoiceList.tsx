import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import {
  Search,
  Printer,
  DollarSign,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Send,
  Plus,
} from 'lucide-react';
import * as invoiceApi from '../../api/invoice.api';
import * as paymentApi from '../../api/payment.api';

export const InvoiceList: React.FC = () => {
  const queryClient = useQueryClient();
  const { invoices: fallbackInvoices, customers, subscriptions, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Queries
  const { data: invoiceData } = useQuery({
    queryKey: ['invoices', statusFilter, searchTerm],
    queryFn: () => invoiceApi.fetchInvoices({ status: statusFilter, search: searchTerm }),
  });

  const invoices = invoiceData?.items || fallbackInvoices;

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: invoiceApi.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      showToast('Invoice created successfully');
    },
    onError: (err: any) => showToast(err.message || 'Failed to create invoice', 'error'),
  });

  const confirmInvoiceMutation = useMutation({
    mutationFn: invoiceApi.confirmInvoice,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showToast(`Invoice ${updated.invoiceNumber} confirmed`);
      if (selectedInvoice?.id === updated.id) {
        setSelectedInvoice((prev: any) => (prev ? { ...prev, status: 'CONFIRMED' } : null));
      }
    },
    onError: (err: any) => showToast(err.message || 'Failed to confirm invoice', 'error'),
  });

  const cancelInvoiceMutation = useMutation({
    mutationFn: invoiceApi.cancelInvoice,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showToast(`Invoice ${updated.invoiceNumber} cancelled`);
      if (selectedInvoice?.id === updated.id) {
        setSelectedInvoice((prev: any) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      }
    },
    onError: (err: any) => showToast(err.message || 'Failed to cancel invoice', 'error'),
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: invoiceApi.sendInvoice,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showToast(`Invoice ${result.invoice.invoiceNumber} emailed to ${result.emailResult.to}`);
      if (selectedInvoice?.id === result.invoice.id) {
        setSelectedInvoice((prev: any) => (prev ? { ...prev, ...result.invoice } : null));
      }
    },
    onError: (err: any) => showToast(err.message || 'Failed to email invoice', 'error'),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: paymentApi.recordPayment,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      showToast(`Payment ${result.payment.paymentNumber} recorded successfully`);
      if (selectedInvoice?.id === result.invoice.id) {
        setSelectedInvoice((prev: any) => (prev ? { ...prev, ...result.invoice } : null));
      }
    },
    onError: (err: any) => showToast(err.message || 'Failed to record payment', 'error'),
  });

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'Credit Card' | 'Bank Transfer' | 'ACH' | 'Stripe'>('Credit Card');
  const [payRef, setPayRef] = useState('TXN-');

  // Create Invoice Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCustId, setNewCustId] = useState(customers[0]?.id || '');
  const [newSubId, setNewSubId] = useState(subscriptions[0]?.id || '');
  const [newTerms, setNewTerms] = useState('NET30');
  const [newDueDate, setNewDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newAmount, setNewAmount] = useState(799);

  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch =
      i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.subscriptionNumber && i.subscriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || i.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.amountDue > 0 ? inv.amountDue : inv.totalAmount);
    setPayRef(`REF-${Math.floor(100000 + Math.random() * 900000)}`);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    await recordPaymentMutation.mutateAsync({
      invoiceId: selectedInvoice.id,
      amount: Number(payAmount),
      paymentMethod: payMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      reference: payRef,
      notes: `Recorded via invoice billing management console.`,
    });

    setIsPaymentModalOpen(false);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === newCustId) || customers[0];
    const sub = subscriptions.find((s) => s.id === newSubId);

    await createInvoiceMutation.mutateAsync({
      customerId: cust.id,
      subscriptionId: sub?.id,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate,
      paymentTerms: newTerms,
      notes: 'Generated via invoice bill generator.',
      lines: [
        {
          productId: 'prod-1',
          productName: sub?.planName || 'Platform Subscription License',
          quantity: 1,
          unitPrice: newAmount,
          taxRate: 8.25,
        },
      ],
    });

    setIsCreateOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Header
        title="Invoice Management"
        subtitle="Manage billing cycles, dispatch customer invoices, track payment status, and process collections."
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
              placeholder="Search by invoice #, client, subscription #..."
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
            <option value="all">All Invoices</option>
            <option value="paid">Paid</option>
            <option value="confirmed">Confirmed / Due</option>
            <option value="overdue">Overdue</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center space-x-2 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-2.5 px-5 rounded-full transition shadow-xs"
        >
          <Plus size={16} />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Invoice Table */}
      <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[rgba(180,205,225,0.5)] text-[#475569] font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Invoice #</th>
                <th className="pb-3 px-3">Client</th>
                <th className="pb-3 px-3">Subscription</th>
                <th className="pb-3 px-3">Issue Date</th>
                <th className="pb-3 px-3">Due Date</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Amount</th>
                <th className="pb-3 px-3 text-right">Amount Due</th>
                <th className="pb-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(180,205,225,0.3)]">
              {filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-white/40 transition cursor-pointer"
                  onClick={() => setSelectedInvoice(inv)}
                >
                  <td className="py-3.5 px-3 font-mono font-extrabold text-[#0e1013]">
                    {inv.invoiceNumber}
                  </td>

                  <td className="py-3.5 px-3">
                    <p className="font-bold text-[#0e1013]">{inv.customerName}</p>
                    <p className="text-[11px] text-[#526071]">{inv.customerEmail}</p>
                  </td>

                  <td className="py-3.5 px-3 font-mono text-[11px] text-[#0e1013]">
                    {inv.subscriptionNumber || (inv as any).subscription?.subscriptionNumber || 'Ad-hoc invoice'}
                  </td>

                  <td className="py-3.5 px-3 text-neutral-600">
                    {inv.issueDate?.split('T')[0] || inv.issueDate}
                  </td>

                  <td className="py-3.5 px-3 font-medium">
                    <span className={inv.status.toLowerCase() === 'overdue' ? 'text-rose-600 font-bold' : 'text-[#0e1013]'}>
                      {inv.dueDate?.split('T')[0] || inv.dueDate}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <StatusBadge status={inv.status} />
                  </td>

                  <td className="py-3.5 px-3 text-right font-bold text-[#0e1013]">
                    ${inv.totalAmount.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <span
                      className={`font-extrabold ${
                        inv.amountDue > 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      ${inv.amountDue.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center space-x-1.5">
                      {inv.status.toUpperCase() === 'DRAFT' && (
                        <button
                          onClick={() => confirmInvoiceMutation.mutate(inv.id)}
                          className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1"
                          title="Confirm invoice"
                        >
                          <CheckCircle size={12} />
                          <span>Confirm</span>
                        </button>
                      )}

                      {inv.status.toUpperCase() !== 'CANCELLED' && (
                        <button
                          onClick={() => sendInvoiceMutation.mutate(inv.id)}
                          disabled={sendInvoiceMutation.isPending}
                          className="p-1.5 rounded-full hover:bg-white text-neutral-600 hover:text-sky-700 transition"
                          title="Send invoice via email"
                        >
                          <Send size={14} />
                        </button>
                      )}

                      {inv.amountDue > 0 && inv.status.toUpperCase() !== 'DRAFT' && inv.status.toUpperCase() !== 'CANCELLED' && (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="px-2.5 py-1 bg-[#0e1013] hover:bg-neutral-800 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 shadow-2xs"
                          title="Record customer payment"
                        >
                          <DollarSign size={12} />
                          <span>Pay</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 rounded-full hover:bg-white text-neutral-600 transition"
                        title="View printable invoice layout"
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Invoice Details Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          subtitle={`Billing statement for ${selectedInvoice.customerName}`}
          maxWidth="max-w-3xl"
        >
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-neutral-200 text-[#0e1013] space-y-6">
            {/* Header: Brightloop logo + Invoice info */}
            <div className="flex flex-col sm:flex-row items-start justify-between border-b pb-6 gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0e1013] text-white flex items-center justify-center font-extrabold text-sm">
                    bl
                  </div>
                  <span className="font-extrabold text-lg tracking-tight">brightloop</span>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Brightloop Software Systems Inc.<br />
                  100 Montgomery St, Suite 1200<br />
                  San Francisco, CA 94104<br />
                  billing@brightloop.io
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-2xl font-black font-mono tracking-tight block">INVOICE</span>
                <span className="text-xs font-mono font-bold text-neutral-600">
                  {selectedInvoice.invoiceNumber}
                </span>
                <div className="mt-2">
                  <StatusBadge status={selectedInvoice.status} />
                </div>
              </div>
            </div>

            {/* Bill To & Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  Billed To
                </span>
                <p className="font-bold text-sm text-[#0e1013]">{selectedInvoice.customerName}</p>
                <p className="text-neutral-500">{selectedInvoice.customerEmail}</p>
                <p className="text-neutral-500 mt-1">Payment Terms: {selectedInvoice.paymentTerms}</p>
              </div>

              <div className="sm:text-right space-y-1">
                <div>
                  <span className="text-neutral-400 mr-2">Issue Date:</span>
                  <span className="font-bold">{selectedInvoice.issueDate?.split('T')[0] || selectedInvoice.issueDate}</span>
                </div>
                <div>
                  <span className="text-neutral-400 mr-2">Due Date:</span>
                  <span className="font-bold text-rose-600">{selectedInvoice.dueDate?.split('T')[0] || selectedInvoice.dueDate}</span>
                </div>
                <div>
                  <span className="text-neutral-400 mr-2">Subscription Ref:</span>
                  <span className="font-mono font-bold">
                    {selectedInvoice.subscriptionNumber || (selectedInvoice as any).subscription?.subscriptionNumber || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div className="border rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b text-neutral-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {selectedInvoice.lines?.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2.5 px-3 font-semibold">{l.productName}</td>
                      <td className="py-2.5 px-3 text-center font-medium">{l.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">${l.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        ${l.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal, tax, paid, balance */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Tax:</span>
                  <span className="font-mono font-bold">${selectedInvoice.taxAmount.toFixed(2)}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount:</span>
                    <span className="font-mono">-${selectedInvoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-sm font-extrabold text-[#0e1013]">
                  <span>Total:</span>
                  <span className="font-mono">${selectedInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Amount Paid:</span>
                  <span className="font-mono">-${selectedInvoice.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 text-base font-black text-rose-700">
                  <span>Balance Due:</span>
                  <span className="font-mono">${selectedInvoice.amountDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedInvoice.notes && (
              <div className="p-3 bg-neutral-50 rounded-xl text-neutral-600 text-xs">
                <span className="font-bold block mb-0.5">Notes:</span>
                <p className="whitespace-pre-line">{selectedInvoice.notes}</p>
              </div>
            )}

            {/* Footer action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full font-bold text-xs transition"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>

                <a
                  href={invoiceApi.getInvoicePdfUrl(selectedInvoice.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full font-bold text-xs transition"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </a>
              </div>

              <div className="flex items-center space-x-2">
                {selectedInvoice.status.toUpperCase() !== 'CANCELLED' && (
                  <button
                    onClick={() => sendInvoiceMutation.mutate(selectedInvoice.id)}
                    disabled={sendInvoiceMutation.isPending}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-full font-bold text-xs transition shadow-xs disabled:opacity-50"
                  >
                    <Send size={14} />
                    <span>{sendInvoiceMutation.isPending ? 'Sending...' : 'Send Email'}</span>
                  </button>
                )}

                {selectedInvoice.status.toUpperCase() === 'DRAFT' && (
                  <>
                    <button
                      onClick={() => cancelInvoiceMutation.mutate(selectedInvoice.id)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-full font-bold text-xs transition"
                    >
                      <XCircle size={14} />
                      <span>Cancel Invoice</span>
                    </button>
                    <button
                      onClick={() => confirmInvoiceMutation.mutate(selectedInvoice.id)}
                      className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full font-bold text-xs transition shadow-sm"
                    >
                      <CheckCircle size={14} />
                      <span>Confirm Invoice</span>
                    </button>
                  </>
                )}

                {selectedInvoice.amountDue > 0 && selectedInvoice.status.toUpperCase() !== 'DRAFT' && selectedInvoice.status.toUpperCase() !== 'CANCELLED' && (
                  <button
                    onClick={() => handleOpenPayment(selectedInvoice)}
                    className="flex items-center space-x-1.5 px-5 py-2.5 bg-[#0e1013] hover:bg-neutral-800 text-white rounded-full font-bold text-xs transition shadow-sm"
                  >
                    <DollarSign size={14} />
                    <span>Record Payment</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment"
        subtitle={`Apply payment to Invoice ${selectedInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs font-medium text-[#334155]">
          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Payment Amount ($)</label>
            <input
              type="number"
              step="0.01"
              required
              max={selectedInvoice?.amountDue || 99999}
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs font-mono font-bold text-[#0e1013]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="ACH">ACH Direct</option>
                <option value="Stripe">Stripe Checkout</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Transaction Reference</label>
              <input
                type="text"
                required
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 rounded-full font-bold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordPaymentMutation.isPending}
              className="px-5 py-2 rounded-full bg-[#0e1013] text-white font-bold hover:bg-neutral-800 disabled:opacity-50"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Invoice"
        subtitle="Generate an ad-hoc billing invoice for client or recurring services."
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs font-medium text-[#334155]">
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
              <label className="block mb-1 font-bold text-[#0e1013]">Linked Subscription</label>
              <select
                value={newSubId}
                onChange={(e) => setNewSubId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              >
                {subscriptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subscriptionNumber} ({s.planName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Base Amount ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Due Date</label>
              <input
                type="date"
                required
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Payment Terms</label>
              <select
                value={newTerms}
                onChange={(e) => setNewTerms(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              >
                <option value="IMMEDIATE">IMMEDIATE</option>
                <option value="NET15">NET15</option>
                <option value="NET30">NET30</option>
              </select>
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
              disabled={createInvoiceMutation.isPending}
              className="px-5 py-2 rounded-full bg-[#0e1013] text-white font-bold hover:bg-neutral-800 disabled:opacity-50"
            >
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

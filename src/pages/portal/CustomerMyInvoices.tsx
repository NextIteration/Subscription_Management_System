import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { Printer, CreditCard, FileText, Download } from 'lucide-react';
import * as portalApi from '../../api/portal.api';

export const CustomerMyInvoices: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { invoices: fallbackInvoices, showToast } = useApp();

  const customerId = currentUser?.customerId || 'cust-1';

  // Query customer invoices
  const { data: myInvoices = fallbackInvoices.filter((i) => i.customerId === customerId) } = useQuery({
    queryKey: ['portal-invoices', customerId],
    queryFn: () => portalApi.fetchPortalInvoices(customerId),
  });

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<'Credit Card' | 'Bank Transfer'>('Credit Card');

  // Mutation to pay invoice
  const payMutation = useMutation({
    mutationFn: ({ invoiceId, method }: { invoiceId: string; method: string }) =>
      portalApi.payPortalInvoice(
        invoiceId,
        {
          paymentMethod: method,
          reference: `CARD-${Math.floor(1000 + Math.random() * 9000)}-SUCCESS`,
        },
        customerId
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });
      showToast('Payment successfully processed and confirmed!');
      setIsPayModalOpen(false);
      setSelectedInvoice(null);
    },
    onError: (err: any) => showToast(err.message || 'Payment processing failed', 'error'),
  });

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    await payMutation.mutateAsync({
      invoiceId: selectedInvoice.id,
      method: payMethod,
    });
  };

  return (
    <div className="space-y-6">
      <Header
        title="My Invoices & Billing"
        subtitle="View statements, check dues, download printable receipts, and pay balances."
      />

      {/* Invoices List */}
      <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[rgba(180,205,225,0.5)] text-[#475569] font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Invoice #</th>
                <th className="pb-3 px-3">Subscription</th>
                <th className="pb-3 px-3">Issue Date</th>
                <th className="pb-3 px-3">Due Date</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Total</th>
                <th className="pb-3 px-3 text-right">Balance Due</th>
                <th className="pb-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(180,205,225,0.3)]">
              {myInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-white/40 transition cursor-pointer"
                  onClick={() => setSelectedInvoice(inv)}
                >
                  <td className="py-3.5 px-3 font-mono font-extrabold text-[#0e1013]">
                    {inv.invoiceNumber}
                  </td>

                  <td className="py-3.5 px-3 font-mono text-neutral-600">
                    {inv.subscriptionNumber || (inv as any).subscription?.subscriptionNumber || 'Service Charge'}
                  </td>

                  <td className="py-3.5 px-3 text-neutral-600">
                    {inv.issueDate?.split('T')[0] || inv.issueDate}
                  </td>

                  <td className="py-3.5 px-3 font-medium">
                    <span className={inv.status.toLowerCase() === 'overdue' ? 'text-rose-600 font-bold' : ''}>
                      {inv.dueDate?.split('T')[0] || inv.dueDate}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <StatusBadge status={inv.status} />
                  </td>

                  <td className="py-3.5 px-3 text-right font-extrabold text-[#0e1013]">
                    ${inv.totalAmount.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <span
                      className={`font-black ${
                        inv.amountDue > 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      ${inv.amountDue.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center space-x-1.5">
                      {inv.amountDue > 0 && inv.status.toUpperCase() !== 'CANCELLED' ? (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsPayModalOpen(true);
                          }}
                          className="px-3 py-1 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold rounded-lg text-[10px] flex items-center space-x-1 shadow-2xs"
                        >
                          <CreditCard size={12} />
                          <span>Pay Now</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Paid
                        </span>
                      )}
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1 rounded-full hover:bg-white text-neutral-600"
                        title="Print / View"
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

      {/* Invoice Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Statement ${selectedInvoice.invoiceNumber}`}
          subtitle={`Due date: ${selectedInvoice.dueDate?.split('T')[0] || selectedInvoice.dueDate}`}
          maxWidth="max-w-2xl"
        >
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 text-xs space-y-4">
            <div className="flex justify-between border-b pb-4">
              <div>
                <span className="font-extrabold text-base block">brightloop</span>
                <span className="text-neutral-500 text-[11px]">Subscription & Cloud Billing</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold block">{selectedInvoice.invoiceNumber}</span>
                <StatusBadge status={selectedInvoice.status} />
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#0e1013] block">Itemized charges:</span>
              {selectedInvoice.lines?.map((l) => (
                <div key={l.id} className="flex justify-between bg-neutral-50 p-2.5 rounded-xl">
                  <span>
                    {l.productName} (Qty: {l.quantity})
                  </span>
                  <span className="font-mono font-bold">${l.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right pt-2 border-t">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span>${selectedInvoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Tax:</span>
                <span>${selectedInvoice.taxAmount.toFixed(2)}</span>
              </div>
              {selectedInvoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount:</span>
                  <span>-${selectedInvoice.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-[#0e1013] pt-1">
                <span>Balance Due:</span>
                <span className="text-rose-700">${selectedInvoice.amountDue.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-full font-bold flex items-center space-x-1.5"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <a
                  href={portalApi.getPortalInvoicePdfUrl(selectedInvoice.id, customerId)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-full font-bold flex items-center space-x-1.5"
                >
                  <Download size={14} />
                  <span>PDF</span>
                </a>
              </div>

              {selectedInvoice.amountDue > 0 && selectedInvoice.status.toUpperCase() !== 'CANCELLED' && (
                <button
                  onClick={() => setIsPayModalOpen(true)}
                  className="px-5 py-2.5 bg-[#0e1013] text-white rounded-full font-bold hover:bg-neutral-800 flex items-center space-x-1.5"
                >
                  <CreditCard size={14} />
                  <span>Pay Balance (${selectedInvoice.amountDue.toFixed(2)})</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Online Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Checkout Payment"
        subtitle={`Pay outstanding balance of $${selectedInvoice?.amountDue.toFixed(2)} for ${selectedInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handlePay} className="space-y-4 text-xs font-medium text-[#334155]">
          <div className="p-4 bg-white rounded-2xl border space-y-3">
            <span className="font-bold text-[#0e1013] block">Select Payment Rail</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayMethod('Credit Card')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold ${
                  payMethod === 'Credit Card'
                    ? 'bg-[#0e1013] text-white border-[#0e1013]'
                    : 'bg-neutral-50 text-neutral-700'
                }`}
              >
                Credit / Debit Card
              </button>
              <button
                type="button"
                onClick={() => setPayMethod('Bank Transfer')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold ${
                  payMethod === 'Bank Transfer'
                    ? 'bg-[#0e1013] text-white border-[#0e1013]'
                    : 'bg-neutral-50 text-neutral-700'
                }`}
              >
                ACH Direct Debit
              </button>
            </div>

            <div>
              <label className="block mb-1 text-[11px] text-neutral-500">Card details</label>
              <input
                type="text"
                disabled
                value="•••• •••• •••• 4242 (Visa Corporate)"
                className="w-full px-3 py-2 bg-neutral-100 rounded-xl font-mono text-xs text-neutral-700"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 rounded-full font-bold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={payMutation.isPending}
              className="px-5 py-2.5 rounded-full bg-[#0e1013] text-white font-bold hover:bg-neutral-800 disabled:opacity-50"
            >
              Authorize Payment of ${selectedInvoice?.amountDue.toFixed(2)}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

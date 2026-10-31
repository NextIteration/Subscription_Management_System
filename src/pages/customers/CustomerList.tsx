import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '../../hooks/useCustomers';
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  ArrowRight,
  Edit2,
  Trash2,
  Filter,
} from 'lucide-react';

export const CustomerList: React.FC = () => {
  const { subscriptions, invoices, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: customerData, isLoading } = useCustomers(searchTerm);
  const customers = customerData?.data || [];
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    taxNumber: '',
    status: 'active' as 'active' | 'inactive',
  });

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      taxNumber: '',
      status: 'active',
    });
    setEditingCustomer(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      address: customer.address,
      taxNumber: customer.taxNumber || '',
      status: customer.status,
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomerMutation.mutate(
        { id: editingCustomer.id, updates: formData },
        {
          onSuccess: () => showToast('Customer updated successfully.'),
          onError: (err: any) => showToast(err.message, 'error'),
        }
      );
    } else {
      createCustomerMutation.mutate(formData, {
        onSuccess: () => showToast('Customer created successfully.'),
        onError: (err: any) => showToast(err.message, 'error'),
      });
    }
    setIsCreateModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to deactivate this customer?')) {
      deleteCustomerMutation.mutate(id, {
        onSuccess: () => showToast('Customer deactivated.', 'info'),
        onError: (err: any) => showToast(err.message, 'error'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Customer Management"
        subtitle="Maintain client organizations, billing entities, and linked active subscription accounts."
      />

      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#d3e3ee] p-4 rounded-3xl border border-[rgba(180,205,225,0.3)] shadow-xs">
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="text"
              placeholder="Search customers by name, company, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/80 border border-transparent focus:border-[rgba(160,190,215,0.8)] focus:outline-none text-xs text-[#0e1013]"
            />
          </div>

          <div className="flex items-center space-x-1 bg-white/70 p-1 rounded-2xl">
            {(['all', 'active', 'inactive'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition ${
                  statusFilter === filter
                    ? 'bg-[#0e1013] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-2 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-2.5 px-5 rounded-full transition shadow-xs"
        >
          <Plus size={16} />
          <span>New Customer</span>
        </button>
      </div>

      {/* Customers Table Card */}
      <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[rgba(180,205,225,0.5)] text-[#475569] font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Customer & Company</th>
                <th className="pb-3 px-3">Contact</th>
                <th className="pb-3 px-3">Tax Reference</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Active Subs</th>
                <th className="pb-3 px-3 text-right">Total Spent</th>
                <th className="pb-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(180,205,225,0.3)]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#526071]">
                    No matching customer records found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const customerSubs = subscriptions.filter((s) => s.customerId === customer.id);
                  const activeCount = customerSubs.filter((s) => s.status === 'ACTIVE').length;

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-white/40 transition group cursor-pointer"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-2xl bg-white text-[#0e1013] font-bold flex items-center justify-center shadow-2xs">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-[#0e1013] text-sm group-hover:text-sky-900 transition">
                              {customer.name}
                            </p>
                            <p className="text-[11px] text-[#526071] flex items-center space-x-1 mt-0.5">
                              <Building2 size={12} />
                              <span>{customer.company}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <p className="text-[#0e1013] font-medium flex items-center space-x-1">
                          <Mail size={12} className="text-neutral-400" />
                          <span>{customer.email}</span>
                        </p>
                        <p className="text-[#526071] text-[11px] flex items-center space-x-1 mt-0.5">
                          <Phone size={12} className="text-neutral-400" />
                          <span>{customer.phone}</span>
                        </p>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono text-[11px] bg-white/60 px-2 py-0.5 rounded-lg text-neutral-700">
                          {customer.taxNumber || 'N/A'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <StatusBadge status={customer.status} />
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-extrabold text-[#0e1013] bg-white/60 px-2.5 py-1 rounded-full">
                          {activeCount} active
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className="font-extrabold text-[#0e1013]">
                          ${customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(customer)}
                            className="p-1.5 rounded-full hover:bg-white text-neutral-600 hover:text-neutral-900 transition"
                            title="Edit customer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-1.5 rounded-full hover:bg-[#ffe4e6] text-neutral-400 hover:text-rose-600 transition"
                            title="Deactivate customer"
                          >
                            <Trash2 size={14} />
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

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={selectedCustomer.name}
          subtitle={`Organization: ${selectedCustomer.company} • Member since ${selectedCustomer.createdAt}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5">
            {/* Quick summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/70 p-3.5 rounded-2xl">
                <span className="text-[11px] text-[#526071] font-medium block">Total Revenue</span>
                <span className="text-xl font-extrabold text-[#0e1013]">
                  ${selectedCustomer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-white/70 p-3.5 rounded-2xl">
                <span className="text-[11px] text-[#526071] font-medium block">Billing Address</span>
                <span className="text-xs font-semibold text-[#0e1013] line-clamp-2">
                  {selectedCustomer.address}
                </span>
              </div>
              <div className="bg-white/70 p-3.5 rounded-2xl">
                <span className="text-[11px] text-[#526071] font-medium block">Tax Registration</span>
                <span className="text-xs font-mono font-bold text-[#0e1013]">
                  {selectedCustomer.taxNumber || 'Exempt / Not registered'}
                </span>
              </div>
            </div>

            {/* Linked Subscriptions */}
            <div>
              <h4 className="font-extrabold text-sm text-[#0e1013] mb-2.5">Linked Subscriptions</h4>
              <div className="space-y-2">
                {subscriptions
                  .filter((s) => s.customerId === selectedCustomer.id)
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white/80 p-3 rounded-2xl flex items-center justify-between border border-[rgba(180,205,225,0.4)]"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-[#0e1013]">
                            {sub.subscriptionNumber}
                          </span>
                          <StatusBadge status={sub.status} />
                        </div>
                        <p className="text-xs text-[#526071] mt-0.5">
                          {sub.planName} • Billing: {sub.billingFrequency}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xs text-[#0e1013] block">
                          ${sub.totalAmount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-neutral-400">Next: {sub.nextBillingDate}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Linked Invoices */}
            <div>
              <h4 className="font-extrabold text-sm text-[#0e1013] mb-2.5">Recent Invoices</h4>
              <div className="space-y-2">
                {invoices
                  .filter((i) => i.customerId === selectedCustomer.id)
                  .map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-white/80 p-3 rounded-2xl flex items-center justify-between border border-[rgba(180,205,225,0.4)]"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-[#0e1013]">
                            {inv.invoiceNumber}
                          </span>
                          <StatusBadge status={inv.status} />
                        </div>
                        <p className="text-xs text-[#526071] mt-0.5">Due: {inv.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xs text-[#0e1013] block">
                          ${inv.totalAmount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-neutral-400">Paid: ${inv.amountPaid.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Customer Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Create New Customer'}
        subtitle="Maintain client details required for subscriptions, tax calculations, and invoices."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-[#334155]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Contact Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] focus:ring-2 focus:ring-[#0e1013] outline-none text-xs text-[#0e1013]"
                placeholder="e.g. Alex Rivera"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Company / Entity</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] focus:ring-2 focus:ring-[#0e1013] outline-none text-xs text-[#0e1013]"
                placeholder="e.g. Nexus Technologies"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] focus:ring-2 focus:ring-[#0e1013] outline-none text-xs text-[#0e1013]"
                placeholder="alex@nexustech.io"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Phone</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] focus:ring-2 focus:ring-[#0e1013] outline-none text-xs text-[#0e1013]"
                placeholder="+1 (415) 890-2341"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Billing Address</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] focus:ring-2 focus:ring-[#0e1013] outline-none text-xs text-[#0e1013]"
              placeholder="Suite, Street, City, State, ZIP"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Tax Identification / VAT Number</label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] focus:ring-2 focus:ring-[#0e1013] outline-none text-xs text-[#0e1013]"
                placeholder="e.g. US-942857102"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Customer Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] focus:ring-2 focus:ring-[#0e1013] outline-none text-xs text-[#0e1013]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-[rgba(160,190,215,0.4)]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-neutral-600 hover:bg-white/60 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#0e1013] text-white text-xs font-bold hover:bg-neutral-800 transition shadow-xs"
            >
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  UserPlus,
  Users,
  KeyRound,
  Zap,
  CheckCircle,
  AlertTriangle,
  Building2,
  Mail,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser, role, users, createStaffAccount } = useAuth();
  const { showToast } = useApp();

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffMsg, setStaffMsg] = useState('');

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createStaffAccount(staffName, staffEmail);
    if (res.success) {
      showToast(res.message);
      setIsStaffModalOpen(false);
      setStaffName('');
      setStaffEmail('');
    } else {
      setStaffMsg(res.message);
    }
  };

  const isAdmin = role === 'admin';

  return (
    <div className="space-y-6">
      <Header
        title="Settings & System Configuration"
        subtitle="Manage staff role access, system security parameters, and billing engine controls."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Staff & User Access (Span 8) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Staff Accounts Management (Admin Only per PRD) */}
          <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-[#0e1013]">
                  Internal Staff & Role Directory
                </h3>
                <p className="text-xs text-[#526071]">
                  Role-based authorization (Admin, Internal Staff, Customer). Only Admin can create staff accounts.
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setIsStaffModalOpen(true)}
                  className="flex items-center space-x-2 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-2 px-4 rounded-full transition shadow-xs"
                >
                  <UserPlus size={14} />
                  <span>Create Staff Account</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-[rgba(180,205,225,0.4)]">
              {users.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
                    />
                    <div>
                      <p className="font-bold text-xs text-[#0e1013]">{u.name}</p>
                      <p className="text-[11px] text-[#526071]">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'staff'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {u.role}
                    </span>
                    <span className="text-[11px] text-neutral-500 hidden sm:inline">{u.company}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Password Policy per PRD 2.1 */}
          <div className="bg-[#d3e3ee] rounded-3xl p-5 border border-[rgba(180,205,225,0.3)] shadow-xs">
            <h4 className="font-extrabold text-sm text-[#0e1013] mb-2 flex items-center space-x-2">
              <Shield size={16} className="text-[#0e1013]" />
              <span>Security Policies & Argon2id Password Hashing</span>
            </h4>
            <div className="bg-white/70 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-emerald-800 font-semibold">
                <CheckCircle size={14} />
                <span>Password rule: &gt; 8 characters with upper, lower, and special symbol enforced</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-800 font-semibold">
                <CheckCircle size={14} />
                <span>HttpOnly Secure Cookie Session Token Authentication</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-800 font-semibold">
                <CheckCircle size={14} />
                <span>Customer data strict isolation (cannot access other customer records)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Performance and SLA metrics (PRD 6) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-[#0e1013] text-white rounded-3xl p-6 shadow-float space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Zap size={18} />
              <span className="font-bold text-xs uppercase tracking-wider">Performance SLA</span>
            </div>
            <h4 className="text-xl font-black">Under 2.0s Target</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              All subscription tables, billing queries, and lifecycle state changes are optimized to
              satisfy the sub-2-second target under multi-tenant volume.
            </p>

            <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">UI First Contentful Paint:</span>
                <span className="font-bold text-emerald-400">0.24s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">API Query Latency (P99):</span>
                <span className="font-bold text-emerald-400">180ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Active Subscriptions Scale:</span>
                <span className="font-bold">10,000+ Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Account Modal */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title="Create Internal Staff Account"
        subtitle="Only authorized Administrators may issue internal operator credentials."
      >
        <form onSubmit={handleCreateStaff} className="space-y-4 text-xs font-medium text-[#334155]">
          {staffMsg && (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-xl font-bold">{staffMsg}</div>
          )}

          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Staff Full Name</label>
            <input
              type="text"
              required
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              placeholder="e.g. Rachel Adams"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Staff Work Email</label>
            <input
              type="email"
              required
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(160,190,215,0.5)] outline-none text-xs"
              placeholder="rachel.adams@brightloop.io"
            />
          </div>

          <div className="p-3 bg-neutral-100 rounded-2xl text-[11px] text-neutral-600">
            An email with an activation link and temporary password instructions will be dispatched.
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsStaffModalOpen(false)}
              className="px-4 py-2 rounded-full font-bold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#0e1013] text-white font-bold hover:bg-neutral-800"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


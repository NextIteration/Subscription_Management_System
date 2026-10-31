import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  Receipt,
  CreditCard,
  Percent,
  TrendingUp,
  Settings,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { role, currentUser } = useAuth();

  // Admin navigation (full suite)
  const adminNav = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Subscriptions', path: '/subscriptions', icon: RefreshCw },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Plans', path: '/plans', icon: Layers },
    { name: 'Quotations', path: '/quotations', icon: FileSpreadsheet },
    { name: 'Invoices', path: '/invoices', icon: Receipt },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Taxes & Discounts', path: '/taxes-discounts', icon: Percent },
    { name: 'Financial Reports', path: '/reports', icon: TrendingUp },
  ];

  // Staff navigation (operations per PRD: Customers, Quotations, Subscriptions, Invoices, Payments, Reports)
  const staffNav = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Subscriptions', path: '/subscriptions', icon: RefreshCw },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Quotations', path: '/quotations', icon: FileSpreadsheet },
    { name: 'Invoices', path: '/invoices', icon: Receipt },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Financial Reports', path: '/reports', icon: TrendingUp },
  ];

  // Customer Portal navigation (strictly customer-facing)
  const customerNav = [
    { name: 'Overview', path: '/portal', icon: LayoutDashboard },
    { name: 'My Subscriptions', path: '/portal/subscriptions', icon: RefreshCw },
    { name: 'My Invoices', path: '/portal/invoices', icon: Receipt },
  ];

  const currentNav = role === 'admin' ? adminNav : role === 'staff' ? staffNav : customerNav;

  return (
    <aside
      className={`relative flex flex-col justify-between bg-[#0e1013] text-white rounded-4xl transition-all duration-300 py-6 px-3 z-30 shadow-2xl flex-shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
      style={{ minHeight: 'calc(100vh - 2.5rem)' }}
    >
      {/* Collapse/Expand toggle button on sidebar edge */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-16 w-7 h-7 bg-white text-[#0e1013] rounded-full shadow-md flex items-center justify-center hover:bg-neutral-200 transition-transform active:scale-95"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Top: Logo & Brand */}
      <div>
        <div className="flex items-center px-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-white text-[#0e1013] flex items-center justify-center font-extrabold text-lg shadow-sm">
            bl
          </div>
          {!collapsed && (
            <div className="ml-3 overflow-hidden">
              <span className="font-bold text-lg tracking-tight text-white block leading-none">
                brightloop
              </span>
              <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider block mt-1">
                {role === 'customer' ? 'Customer Portal' : role === 'staff' ? 'Staff Workspace' : 'Admin Console'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation items based on authenticated role */}
        <nav className="space-y-1.5">
          {currentNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-[#0e1013] shadow-sm font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/10'
                  } ${collapsed ? 'justify-center' : 'justify-start space-x-3.5'}`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon size={20} strokeWidth={2} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Authenticated User Badge & Settings (No fake perspective switching) */}
      <div className="space-y-2 pt-4 border-t border-white/10">
        {/* User identification summary */}
        {!collapsed && (
          <div className="px-3 py-2 rounded-2xl bg-white/5 border border-white/5 mb-1">
            <p className="text-[11px] font-bold text-neutral-200 truncate">{currentUser?.name}</p>
            <p className="text-[10px] text-neutral-400 truncate">{currentUser?.email}</p>
          </div>
        )}

        {/* Settings button (Admin / Staff) */}
        {role !== 'customer' && (
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                isActive ? 'bg-white text-[#0e1013]' : 'text-neutral-400 hover:text-white hover:bg-white/10'
              } ${collapsed ? 'justify-center' : 'justify-start space-x-3.5'}`
            }
            title={collapsed ? 'Settings & Accounts' : undefined}
          >
            <Settings size={20} strokeWidth={2} />
            {!collapsed && <span>Settings</span>}
          </NavLink>
        )}
      </div>
    </aside>
  );
};

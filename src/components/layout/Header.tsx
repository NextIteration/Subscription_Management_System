import React, { useState } from 'react';
import {
  Calendar,
  MessageSquare,
  Bell,
  ChevronDown,
  LogOut,
  UserCheck,
  Shield,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { currentUser, role, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const getGreeting = () => {
    if (title) return title;
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = currentUser?.name.split(' ')[0] || 'User';
    return `${timeOfDay}, ${firstName}!`;
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    navigate('/auth/login');
  };

  return (
    <header className="flex items-center justify-between pb-6 pt-2">
      {/* Left: Greeting / Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0e1013]">
          {getGreeting()}
        </h1>
        {subtitle && <p className="text-xs text-[#526071] mt-0.5">{subtitle}</p>}
      </div>

      {/* Right Controls: Navigation buttons, Icons, Actual Role Badge, Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Navigation chevrons (matching screenshot < >) */}
        <div className="hidden sm:flex items-center space-x-1 mr-2 text-[#475569]">
          <button
            onClick={() => window.history.back()}
            className="p-1 rounded-full hover:bg-white/60 transition"
            title="Go back"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => window.history.forward()}
            className="p-1 rounded-full hover:bg-white/60 transition"
            title="Go forward"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Current Authenticated Role Badge (Informational & Read-Only) */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#d3e3ee] border border-[rgba(160,190,215,0.4)] rounded-full text-xs font-semibold text-[#0e1013] shadow-2xs">
          {role === 'admin' ? (
            <Shield size={14} className="text-purple-600" />
          ) : role === 'staff' ? (
            <Briefcase size={14} className="text-blue-600" />
          ) : (
            <UserCheck size={14} className="text-emerald-600" />
          )}
          <span className="capitalize font-bold">
            {role === 'admin' ? 'Administrator' : role === 'staff' ? 'Internal Staff' : 'Customer'}
          </span>
        </div>

        {/* Outline Calendar Icon */}
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#334155] hover:bg-white/60 transition"
          title="Calendar schedule"
        >
          <Calendar size={18} strokeWidth={2} />
        </button>

        {/* Outline Chat / Messages Icon */}
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#334155] hover:bg-white/60 transition"
          title="Customer & Team communications"
        >
          <MessageSquare size={18} strokeWidth={2} />
        </button>

        {/* Outline Bell Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#334155] hover:bg-white/60 transition relative"
            title="System notifications"
          >
            <Bell size={18} strokeWidth={2} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#e4eff6]"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-float border border-neutral-100 p-4 z-50 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-3 border-b pb-2">
                <span className="font-bold text-neutral-800">Notifications</span>
                <span className="text-[11px] text-sky-600 font-semibold cursor-pointer">Mark all read</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                  <div>
                    <p className="text-neutral-800 font-medium">Invoice INV-0891 paid in full ($4,027.29)</p>
                    <span className="text-[10px] text-neutral-400">Aurora Financial • 15m ago</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
                  <div>
                    <p className="text-neutral-800 font-medium">Invoice INV-0914 overdue (Nexus Tech)</p>
                    <span className="text-[10px] text-neutral-400">Payment failure retry • 2h ago</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                  <div>
                    <p className="text-neutral-800 font-medium">Quotation QT-0042 accepted</p>
                    <span className="text-[10px] text-neutral-400">Ready for conversion • 5h ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar with standard profile & logout dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 pl-1 pr-1.5 py-1 rounded-full hover:bg-white/60 transition"
          >
            <img
              src={
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser?.name || 'User'}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-xs"
            />
            <ChevronDown size={14} className="text-[#475569]" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-float border border-neutral-100 py-2 z-50 text-xs animate-in fade-in duration-150">
              <div className="px-4 py-2 border-b border-neutral-100">
                <p className="font-bold text-neutral-800">{currentUser?.name}</p>
                <p className="text-[11px] text-neutral-400 truncate">{currentUser?.email}</p>
                <div className="mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 uppercase font-bold tracking-wide">
                    {role}
                  </span>
                </div>
              </div>

              {role !== 'customer' && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-4 py-2 text-neutral-700 hover:bg-neutral-50 font-medium flex items-center space-x-2"
                >
                  <UserIcon size={14} className="text-neutral-400" />
                  <span>Account & Settings</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium flex items-center space-x-2 border-t border-neutral-50"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

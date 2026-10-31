import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="min-h-screen bg-[#e5eff5] p-3 sm:p-5 lg:p-6 flex flex-col md:flex-row gap-5">
      {/* Floating Black Sidebar */}
      <Sidebar />

      {/* Main Large Rounded Light-Blue Surface */}
      <main className="flex-1 bg-[#dbe8f2] rounded-4xl p-5 sm:p-7 lg:p-8 shadow-xs border border-[rgba(175,200,220,0.35)] flex flex-col overflow-x-hidden min-w-0">
        <Outlet />
      </main>

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-2xl bg-[#0e1013] text-white shadow-float text-xs font-medium animate-in slide-in-from-bottom-3 duration-200"
          >
            {toast.type === 'success' && <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />}
            {toast.type === 'info' && <Info size={16} className="text-sky-400 flex-shrink-0" />}
            <span>{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-neutral-400 hover:text-white ml-2 transition"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};


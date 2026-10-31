import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const norm = status.toLowerCase();

  let styles = 'bg-slate-200 text-slate-700';

  if (['active', 'paid', 'completed', 'accepted'].includes(norm)) {
    styles = 'bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]';
  } else if (['confirmed', 'sent', 'issued', 'processing'].includes(norm)) {
    styles = 'bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]';
  } else if (['overdue', 'expired', 'failed', 'rejected'].includes(norm)) {
    styles = 'bg-[#ffe4e6] text-[#9f1239] border border-[#fecdd3]';
  } else if (['paused', 'pending', 'warning'].includes(norm)) {
    styles = 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]';
  } else if (['quotation'].includes(norm)) {
    styles = 'bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe]';
  } else if (['draft', 'inactive', 'archived', 'closed'].includes(norm)) {
    styles = 'bg-[#e2e8f0] text-[#475569] border border-[#cbd5e1]';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {status.toUpperCase()}
    </span>
  );
};


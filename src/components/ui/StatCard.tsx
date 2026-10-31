import React from 'react';
import { MoreVertical } from 'lucide-react';

interface MetricCardProps {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  badge?: {
    text: string;
    type?: 'positive' | 'negative' | 'neutral';
  };
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  value,
  label,
  badge,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#d3e3ee] hover:bg-[#c9dbe7] transition-all duration-200 rounded-3xl p-5 flex flex-col justify-between shadow-sm border border-[rgba(180,205,225,0.3)] ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        {icon && (
          <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-[#1e293b] shadow-xs">
            {icon}
          </div>
        )}
        {badge ? (
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              badge.type === 'negative'
                ? 'bg-[#ffe4e6] text-[#e11d48]'
                : badge.type === 'positive'
                ? 'bg-[#d1fae5] text-[#059669]'
                : 'bg-white/60 text-[#334155]'
            }`}
          >
            {badge.text}
          </span>
        ) : (
          <button className="text-[#64748b] hover:text-[#0f172a] p-1 rounded-full hover:bg-white/40 transition">
            <MoreVertical size={16} />
          </button>
        )}
      </div>

      <div>
        <div className="text-2xl lg:text-3xl font-extrabold text-[#0e1013] tracking-tight">
          {value}
        </div>
        <div className="text-xs font-medium text-[#475569] mt-1">
          {label}
        </div>
      </div>
    </div>
  );
};

interface DarkStatusCardProps {
  title: string;
  subtitle: string;
  progressPercent?: number;
  noteTitle?: string;
  noteValue?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  className?: string;
}

export const DarkStatusCard: React.FC<DarkStatusCardProps> = ({
  title,
  subtitle,
  progressPercent = 65,
  noteTitle = 'Estimated processing',
  noteValue = '4-5 business days',
  buttonText = 'View status',
  onButtonClick,
  className = '',
}) => {
  return (
    <div className={`bg-[#0e1013] text-white rounded-3xl p-6 shadow-float flex flex-col justify-between ${className}`}>
      <div>
        <h4 className="text-lg font-bold tracking-tight">{title}</h4>
        <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>

        {progressPercent !== undefined && (
          <div className="mt-5 mb-5">
            <div className="w-full bg-[#272a31] h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="text-center my-3">
          <div className="text-xs font-semibold text-neutral-200">{noteTitle}</div>
          <div className="text-xs text-neutral-400 mt-0.5">{noteValue}</div>
        </div>
      </div>

      {buttonText && (
        <button
          onClick={onButtonClick}
          className="w-full mt-4 bg-white text-[#0e1013] hover:bg-neutral-100 font-bold text-xs py-3 px-4 rounded-full transition duration-200 shadow-sm"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export const DarkEventCard: React.FC<{
  title: string;
  datetime: string;
  description: string;
  className?: string;
}> = ({ title, datetime, description, className = '' }) => {
  return (
    <div className={`bg-[#0e1013] text-white rounded-3xl p-5 shadow-float ${className}`}>
      <h5 className="font-bold text-sm text-neutral-100">{title}</h5>
      <div className="flex items-center text-xs text-neutral-400 mt-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
        {datetime}
      </div>
      <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
        {description}
      </p>
    </div>
  );
};


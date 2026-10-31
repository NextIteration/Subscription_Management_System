import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Check, AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'staff' | 'admin'>('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password rules validation
  const hasMinLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasMinLength || !hasUpper || !hasLower || !hasSpecial) {
      setError('Password must meet all PRD criteria: >8 chars, upper, lower, and special char.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(name, email, password, role, company);
      if (res.success) {
        navigate(role === 'customer' ? '/portal' : '/');
      } else {
        setError(res.error || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e5eff5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#d8e6f1] border border-[rgba(180,205,225,0.6)] rounded-4xl p-8 sm:p-10 shadow-float">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#0e1013] text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
            bl
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#0e1013] block">
              brightloop
            </span>
            <span className="text-[11px] text-[#526071] font-semibold">New Account Setup</span>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-[#0e1013] tracking-tight">Create account</h2>
        <p className="text-xs text-[#526071] mt-1 mb-6">
          Join Brightloop to manage subscriptions, licenses, and enterprise billing.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-[#ffe4e6] text-[#9f1239] text-xs font-semibold border border-[#fecdd3]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-medium text-[#334155]">
          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Full name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-[rgba(160,190,215,0.5)] focus:outline-none focus:ring-2 focus:ring-[#0e1013] text-sm text-[#0e1013]"
              placeholder="e.g. Marcus Vance"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Work email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-[rgba(160,190,215,0.5)] focus:outline-none focus:ring-2 focus:ring-[#0e1013] text-sm text-[#0e1013]"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Organization / Company</label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-[rgba(160,190,215,0.5)] focus:outline-none focus:ring-2 focus:ring-[#0e1013] text-sm text-[#0e1013]"
              placeholder="e.g. Solaris Data Labs"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Account Role</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition text-center ${
                  role === 'customer'
                    ? 'bg-[#0e1013] text-white border-[#0e1013]'
                    : 'bg-white/60 text-[#334155] border-transparent hover:bg-white'
                }`}
              >
                Customer Portal
              </button>
              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition text-center ${
                  role === 'staff'
                    ? 'bg-[#0e1013] text-white border-[#0e1013]'
                    : 'bg-white/60 text-[#334155] border-transparent hover:bg-white'
                }`}
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition text-center ${
                  role === 'admin'
                    ? 'bg-[#0e1013] text-white border-[#0e1013]'
                    : 'bg-white/60 text-[#334155] border-transparent hover:bg-white'
                }`}
              >
                Admin Workspace
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[#0e1013]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-[rgba(160,190,215,0.5)] focus:outline-none focus:ring-2 focus:ring-[#0e1013] text-sm text-[#0e1013]"
              placeholder="Create strong password"
            />

            {/* PRD requirement indicator checklist */}
            <div className="mt-2.5 p-3 rounded-2xl bg-white/40 space-y-1 text-[11px]">
              <p className="font-bold text-[#0e1013] text-[10px] uppercase">PRD Password Criteria:</p>
              <div className="flex items-center space-x-1.5">
                <span className={hasMinLength ? 'text-emerald-600 font-bold' : 'text-neutral-400'}>
                  {hasMinLength ? '✓' : '○'} Longer than 8 characters ({password.length}/9+)
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={hasUpper && hasLower ? 'text-emerald-600 font-bold' : 'text-neutral-400'}>
                  {hasUpper && hasLower ? '✓' : '○'} Uppercase & lowercase letters
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={hasSpecial ? 'text-emerald-600 font-bold' : 'text-neutral-400'}>
                  {hasSpecial ? '✓' : '○'} At least one special character (!@#$%^&*)
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-3 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-sm py-3 px-4 rounded-full transition flex items-center justify-center space-x-2 shadow-sm"
          >
            <UserPlus size={16} />
            <span>Complete Registration</span>
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-[rgba(160,190,215,0.4)] text-center text-xs text-[#526071]">
          <span>Already have an account? </span>
          <Link to="/auth/login" className="font-bold text-[#0e1013] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};


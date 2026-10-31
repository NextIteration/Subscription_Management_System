import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, KeyRound } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e5eff5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#d8e6f1] border border-[rgba(180,205,225,0.6)] rounded-4xl p-8 sm:p-10 shadow-float">
        {/* Brand */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#0e1013] text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
            bl
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#0e1013] block">
              brightloop
            </span>
            <span className="text-[11px] text-[#526071] font-semibold">Subscription Management</span>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-[#0e1013] tracking-tight">Sign in</h2>
        <p className="text-xs text-[#526071] mt-1 mb-6">
          Log in with your authenticated account credentials.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-[#ffe4e6] text-[#9f1239] text-xs font-semibold border border-[#fecdd3]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-[#334155]">
          <div>
            <label className="block mb-1.5 font-bold text-[#0e1013]">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/80 border border-[rgba(160,190,215,0.5)] focus:outline-none focus:ring-2 focus:ring-[#0e1013] text-sm text-[#0e1013]"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-[#0e1013]">Password</label>
              <Link to="/auth/forgot-password" className="text-sky-700 hover:underline text-[11px]">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/80 border border-[rgba(160,190,215,0.5)] focus:outline-none focus:ring-2 focus:ring-[#0e1013] text-sm text-[#0e1013]"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#0e1013] hover:bg-neutral-800 disabled:opacity-60 text-white font-bold text-sm py-3 px-4 rounded-full transition flex items-center justify-center space-x-2 shadow-sm"
          >
            <LogIn size={16} />
            <span>{loading ? 'Signing in...' : 'Sign in to Brightloop'}</span>
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[rgba(160,190,215,0.4)] text-center text-xs text-[#526071]">
          <span>Don't have an account? </span>
          <Link to="/auth/register" className="font-bold text-[#0e1013] hover:underline">
            Register here
          </Link>
        </div>

        {/* Development Test Accounts Reference (Informational text only, no UI switching) */}
        <div className="mt-5 p-3.5 rounded-2xl bg-white/50 border border-white/60 text-[11px] text-[#475569] space-y-2">
          <div className="flex items-center space-x-1.5 text-[#0e1013] font-bold">
            <KeyRound size={13} />
            <span>Development Test Accounts:</span>
          </div>
          <div className="space-y-1 font-mono text-[10.5px]">
            <div>
              <span className="font-sans font-bold text-neutral-800">Admin:</span>{' '}
              <span className="text-sky-900">admin@brightloop.io</span> /{' '}
              <span className="text-neutral-600">Admin#2026!</span>
            </div>
            <div>
              <span className="font-sans font-bold text-neutral-800">Staff:</span>{' '}
              <span className="text-sky-900">staff@brightloop.io</span> /{' '}
              <span className="text-neutral-600">Staff#2026!</span>
            </div>
            <div>
              <span className="font-sans font-bold text-neutral-800">Customer:</span>{' '}
              <span className="text-sky-900">alex@nexustech.io</span> /{' '}
              <span className="text-neutral-600">Customer#2026!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

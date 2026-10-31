import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, CheckCircle } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || 'simulated_token';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  // Password rules validation
  const hasMinLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!hasMinLength || !hasUpper || !hasLower || !hasSpecial) {
      setError('Password must be longer than 8 characters and contain uppercase, lowercase and a special character.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => navigate('/auth/login'), 2000);
      } else {
        setError(res.message);
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
            <span className="text-[11px] text-[#526071] font-semibold">Set New Password</span>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-[#0e1013] tracking-tight">Reset Password</h2>
        <p className="text-xs text-[#526071] mt-1 mb-6">
          Enter and verify your new credentials according to security policy.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-[#ffe4e6] text-[#9f1239] text-xs font-semibold border border-[#fecdd3]">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-4 rounded-2xl bg-[#d1fae5] border border-[#a7f3d0] text-xs text-[#065f46] space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <CheckCircle size={16} />
              <span>Password Successfully Changed!</span>
            </div>
            <p>Redirecting you to sign in screen...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-[#334155]">
            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-[rgba(160,190,215,0.5)] focus:outline-none focus:ring-2 focus:ring-[#0e1013] text-sm text-[#0e1013]"
                placeholder="New secure password"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[#0e1013]">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-[rgba(160,190,215,0.5)] focus:outline-none focus:ring-2 focus:ring-[#0e1013] text-sm text-[#0e1013]"
                placeholder="Repeat new password"
              />
            </div>

            <div className="p-3 rounded-2xl bg-white/40 space-y-1 text-[11px]">
              <p className="font-bold text-[#0e1013] text-[10px] uppercase">PRD Requirement Check:</p>
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
                  {hasSpecial ? '✓' : '○'} Special character included
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-3 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-sm py-3 px-4 rounded-full transition flex items-center justify-center space-x-2 shadow-sm"
            >
              <KeyRound size={16} />
              <span>Update Password</span>
            </button>

            <div className="text-center mt-3">
              <Link to="/auth/login" className="text-xs font-bold text-[#0e1013] hover:underline">
                Cancel and return to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      setMessage(res.message);
      setSubmitted(true);
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
            <span className="text-[11px] text-[#526071] font-semibold">Account Recovery</span>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-[#0e1013] tracking-tight">Forgot password?</h2>
        <p className="text-xs text-[#526071] mt-1 mb-6">
          Enter your registered email address to receive an account password reset link.
        </p>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#d1fae5] border border-[#a7f3d0] text-xs text-[#065f46]">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <CheckCircle size={16} />
                <span>Reset Link Sent</span>
              </div>
              <p>{message}</p>
            </div>

            <div className="p-3 rounded-2xl bg-white/50 text-xs text-neutral-600">
              <span className="font-bold">Simulated test link:</span>
              <p className="mt-1">
                <Link
                  to="/auth/reset-password?token=bl_simulated_token_xyz"
                  className="text-sky-700 underline font-semibold"
                >
                  Click here to proceed directly to Reset Password screen
                </Link>
              </p>
            </div>

            <Link
              to="/auth/login"
              className="w-full mt-4 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-xs py-3 px-4 rounded-full transition flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Sign in</span>
            </Link>
          </div>
        ) : (
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

            <button
              type="submit"
              className="w-full mt-2 bg-[#0e1013] hover:bg-neutral-800 text-white font-bold text-sm py-3 px-4 rounded-full transition flex items-center justify-center space-x-2 shadow-sm"
            >
              <Mail size={16} />
              <span>Send Recovery Link</span>
            </button>

            <div className="text-center mt-4">
              <Link to="/auth/login" className="text-xs font-bold text-[#0e1013] hover:underline">
                Back to Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


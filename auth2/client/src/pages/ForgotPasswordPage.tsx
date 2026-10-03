import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import PasswordInput from '../components/auth/PasswordInput';
import PasswordStrength from '../components/auth/PasswordStrength';

type Step = 'request' | 'reset';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // ─── Step 1: Request OTP ───────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Invalid email address' });
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('If that email is registered, a code has been sent.');
      setStep('reset');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: Verify OTP + Reset Password ──────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!otp.trim() || otp.length !== 6) newErrors.otp = 'Enter the 6-digit code';
    if (!newPassword) newErrors.newPassword = 'Password is required';
    else if (!PASSWORD_REGEX.test(newPassword))
      newErrors.newPassword = 'Password must have 8+ chars, 1 uppercase, 1 number, 1 special character';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/signin');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Reset failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'request' ? "Enter your email to receive a reset code" : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step === 'request' ? 'bg-indigo-500' : 'bg-green-500'}`} />
            <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step === 'reset' ? 'bg-indigo-500' : 'bg-gray-200'}`} />
          </div>

          {/* Step 1: Request OTP */}
          {step === 'request' && (
            <form onSubmit={handleRequestOtp} noValidate>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 ${
                    errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sending code...
                  </>
                ) : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* Step 2: Enter OTP + New Password */}
          {step === 'reset' && (
            <form onSubmit={handleReset} noValidate>
              {/* OTP Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setErrors({ ...errors, otp: '' }); }}
                  placeholder="123456"
                  className={`w-full px-4 py-3 border rounded-lg text-center text-2xl font-bold tracking-widest outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 ${
                    errors.otp ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.otp && <p className="mt-1 text-xs text-red-500">{errors.otp}</p>}
              </div>

              <PasswordInput
                label="New Password"
                name="newPassword"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setErrors({ ...errors, newPassword: '' }); }}
                placeholder="••••••••"
                error={errors.newPassword}
              />
              <PasswordStrength password={newPassword} />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Resetting...
                  </>
                ) : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-indigo-600 transition"
              >
                ← Back to email
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Remembered it?{' '}
            <Link to="/signin" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

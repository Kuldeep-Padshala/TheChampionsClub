import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { ROUTES } from '../constants/routes';
import { CLUB_INFO } from '../constants/club';
import { KeyRound, ShieldAlert, ArrowLeft, Mail, CheckCircle2, RotateCw } from 'lucide-react';
import { PasswordInput } from '../components/auth/PasswordInput';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import api from '../api/client';
import toast from 'react-hot-toast';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Step 1: request code, Step 2: enter code & reset password
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Step 1: Send OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.message || 'Verification code sent to your email');
      setStep(2);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send reset code. Please check your email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!email || isResending) return;
    setIsResending(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.message || 'Fresh verification code dispatched');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not resend code');
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      toast.error('Password must contain uppercase, lowercase, number, and special character');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email,
        otp: otp.trim(),
        newPassword,
      });
      toast.success(res.data.message || 'Password reset successfully!');
      setTimeout(() => navigate(ROUTES.LOGIN), 1200);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reset password. Please check your code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="min-h-[85vh] flex items-center justify-center pt-28 pb-16 px-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white/80 dark:bg-[#0A0A0D]/85 backdrop-blur-2xl rounded-3xl border border-black/10 dark:border-white/10 p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            
            {/* Crest Monogram */}
            <div className="text-center mb-8">
              <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-[#EAD29A] via-[#B89047] to-[#7D5A1E] mx-auto mb-4 shadow-lg shadow-[#B89047]/20">
                <div className="w-full h-full rounded-full bg-[#121214] flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-[#EAD29A]" />
                </div>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-white tracking-tight mb-2">
                {step === 1 ? 'Reset Security Key' : 'Create New Password'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {step === 1
                  ? `Enter the email associated with your ${CLUB_INFO.shortName} membership.`
                  : `Enter the 6-digit verification code sent to ${email}.`}
              </p>
            </div>

            {step === 1 ? (
              /* STEP 1: Request Code Form */
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold tracking-wider text-[#1D1D1F] dark:text-gray-200 font-display">
                    Member Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="member@thechampionsclub.in"
                      className="w-full px-4 py-3 pl-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#B89047] focus:ring-2 focus:ring-[#B89047]/20 outline-none text-sm transition-all shadow-sm"
                    />
                    <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] hover:opacity-95 shadow-md border border-[#B89047]/30 transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw size={16} className="animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: Reset Password Form */
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* OTP Field */}
                <div>
                  <label className="block text-xs uppercase font-semibold tracking-wider text-[#1D1D1F] dark:text-gray-200 mb-1.5 font-display">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 text-center tracking-[0.4em] font-mono font-bold text-lg rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white placeholder:text-gray-400 focus:border-[#B89047] focus:ring-2 focus:ring-[#B89047]/20 outline-none transition-all shadow-sm"
                  />
                  <div className="flex justify-between items-center mt-1.5 text-xs text-gray-500">
                    <span>Didn't receive it?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="text-[#B89047] hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isResending && <RotateCw size={11} className="animate-spin" />}
                      Resend Code
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <PasswordInput
                    label="New Password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                  />
                  <PasswordStrength password={newPassword} />
                </div>

                {/* Confirm Password */}
                <div>
                  <PasswordInput
                    label="Confirm New Password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] hover:opacity-95 shadow-md border border-[#B89047]/30 transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw size={16} className="animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Reset & Activate New Password</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center text-xs text-gray-400 hover:text-[#B89047] pt-2 transition-colors cursor-pointer"
                >
                  Change email address
                </button>
              </form>
            )}

            {/* Back to Login */}
            <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10 text-center">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-[#B89047] dark:hover:text-[#EAD29A] transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Return to Member Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ForgotPasswordPage;

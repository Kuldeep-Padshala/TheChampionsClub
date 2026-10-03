import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { ROUTES } from '../constants/routes';
import { CLUB_INFO } from '../constants/club';
import { Trophy, RotateCw, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/auth/PasswordInput';
import { GoogleButton } from '../components/auth/GoogleButton';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRoleDestination = (roles?: string[]) => {
    if (roles?.includes('OWNER')) return ROUTES.OWNER;
    if (roles?.includes('SYSTEM_ADMIN') || roles?.includes('ADMIN')) return ROUTES.ADMIN;
    if (roles?.includes('MANAGER')) return ROUTES.MANAGER;
    if (roles?.includes('ACCOUNTANT')) return ROUTES.ACCOUNTANT;
    if (roles?.includes('SHOP_STAFF') || roles?.includes('GEAR_BOX_STAFF')) return ROUTES.SHOP_STATION;
    if (roles?.includes('BAR_STAFF')) return ROUTES.BAR;
    if (roles?.includes('FRONT_DESK')) return ROUTES.RECEPTIONIST;
    return ROUTES.MEMBER_PORTAL;
  };

  // If already authenticated, redirect to respective role portal
  useEffect(() => {
    if (isAuthenticated && user) {
      const state = location.state as { from?: { pathname?: string } } | null;
      const destination = state?.from?.pathname || getRoleDestination(user.roles);
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  // Check for OAuth error query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get('error');
    if (err === 'google_not_configured') {
      toast.error('Google Sign-In is not configured on this server yet. Please use email and password.');
    } else if (err === 'google_failed') {
      toast.error('Google Sign-In failed or was cancelled. Please try again.');
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in both email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(email.trim(), password);
      toast.success(`Welcome back, ${loggedUser.name}!`);
      // Check if there was a redirected location state
      const state = location.state as { from?: { pathname?: string } } | null;
      const destination = state?.from?.pathname || getRoleDestination(loggedUser.roles);
      navigate(destination, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid email, phone, or password. Please verify your credentials.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="min-h-[85vh] flex items-center justify-center pt-28 pb-16 px-4">
        <div className="w-full max-w-md">
          {/* Bespoke Luxury Card */}
          <div className="bg-white/80 dark:bg-[#0A0A0D]/85 backdrop-blur-2xl rounded-3xl border border-black/10 dark:border-white/10 p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            
            {/* Crest Monogram */}
            <div className="text-center mb-8">
              <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-[#EAD29A] via-[#B89047] to-[#7D5A1E] mx-auto mb-4 shadow-lg shadow-[#B89047]/20">
                <div className="w-full h-full rounded-full bg-[#121214] flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-[#EAD29A]" />
                </div>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-white tracking-tight mb-1">
                Member Access
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Sign in to your private {CLUB_INFO.shortName} portal
              </p>
            </div>

            {/* Google OAuth Button */}
            <div className="mb-6">
              <GoogleButton />
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/10 dark:border-white/10" />
                </div>
                <span className="relative px-3 text-[11px] font-semibold tracking-wider text-gray-400 bg-white/80 dark:bg-[#0A0A0D] uppercase">
                  Or continue with password
                </span>
              </div>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Phone field */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold tracking-wider text-[#1D1D1F] dark:text-gray-200 font-display">
                  Email or Registered Phone
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com or +91 98..."
                    className="w-full px-4 py-3 pl-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#B89047] focus:ring-2 focus:ring-[#B89047]/20 outline-none text-sm transition-all shadow-sm"
                  />
                  <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="sr-only">Password</span>
                </div>
                <PasswordInput
                  label="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
                <div className="flex justify-end -mt-2">
                  <Link
                    to={ROUTES.FORGOT_PASSWORD}
                    className="text-xs font-semibold text-[#B89047] hover:text-[#A67C38] dark:hover:text-[#EAD29A] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] hover:opacity-95 shadow-md border border-[#B89047]/30 transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-4"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw size={16} className="animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>Access Private Portal</span>
                )}
              </button>
            </form>

            {/* Quick Demo Access Bar */}
            <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/10">
              <p className="text-[10px] uppercase tracking-wider text-center text-gray-400 font-semibold mb-3">
                Quick Demo Switcher
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('owner@championsclub.example');
                    setPassword('Password@123');
                  }}
                  className="px-2 py-2 rounded-xl text-[11px] font-semibold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all text-center cursor-pointer shadow-sm"
                  title="Rajesh Malhotra — Club Owner & Executive Suite"
                >
                  <span className="block font-bold">👑 Owner</span>
                  <span className="text-[9px] opacity-75">Rajesh Malhotra</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@championsclub.example');
                    setPassword('Password@123');
                  }}
                  className="px-2 py-2 rounded-xl text-[11px] font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all text-center cursor-pointer shadow-sm"
                  title="Vikram Batra — System Administrator & Security"
                >
                  <span className="block font-bold">⚙️ Admin</span>
                  <span className="text-[9px] opacity-75">Vikram Batra</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('sunita.rao@championsclub.example');
                    setPassword('Password@123');
                  }}
                  className="px-2 py-2 rounded-xl text-[11px] font-semibold text-[#B89047] bg-[#B89047]/10 hover:bg-[#B89047]/20 border border-[#B89047]/30 transition-all text-center cursor-pointer"
                  title="Sunita Rao — General Manager"
                >
                  <span className="block font-bold">Manager</span>
                  <span className="text-[9px] opacity-75">Sunita Rao</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('priya.nair@championsclub.example');
                    setPassword('Password@123');
                  }}
                  className="px-2 py-2 rounded-xl text-[11px] font-semibold text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all text-center cursor-pointer"
                  title="Priya Nair — Front Desk Lead"
                >
                  <span className="block font-bold">Front Desk</span>
                  <span className="text-[9px] opacity-75">Priya Nair</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('imran.shaikh@championsclub.example');
                    setPassword('Password@123');
                  }}
                  className="px-2 py-2 rounded-xl text-[11px] font-semibold text-amber-600 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 transition-all text-center cursor-pointer"
                  title="Imran Shaikh — Bar & Cafe"
                >
                  <span className="block font-bold">Bar & Cafe</span>
                  <span className="text-[9px] opacity-75">Imran Shaikh</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('neha.kulkarni@championsclub.example');
                    setPassword('Password@123');
                  }}
                  className="px-2 py-2 rounded-xl text-[11px] font-semibold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all text-center cursor-pointer"
                  title="Neha Kulkarni — Gear Shop Staff"
                >
                  <span className="block font-bold">Shop Staff</span>
                  <span className="text-[9px] opacity-75">Neha Kulkarni</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('meera.bhatt@bhattassociates.example');
                    setPassword('Password@123');
                  }}
                  className="px-2 py-2 rounded-xl text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all text-center cursor-pointer"
                  title="Meera Bhatt — Club Accountant"
                >
                  <span className="block font-bold">Accountant</span>
                  <span className="text-[9px] opacity-75">Meera Bhatt</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('ananya.singh@example.com');
                    setPassword('Password@123');
                  }}
                  className="px-2 py-2 rounded-xl text-[11px] font-semibold text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-all text-center cursor-pointer"
                  title="Ananya Singh — VIP Member"
                >
                  <span className="block font-bold">Member</span>
                  <span className="text-[9px] opacity-75">Ananya Singh</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('new.member@example.com');
                    setPassword('Password@123');
                  }}
                  className="px-2 py-2 rounded-xl text-[11px] font-semibold text-gray-500 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/30 transition-all text-center cursor-pointer"
                  title="New Member — No Pass"
                >
                  <span className="block font-bold">New Member</span>
                  <span className="text-[9px] opacity-75">No Pass</span>
                </button>
              </div>
            </div>

            {/* Sign up link */}
            <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/10 text-center text-xs text-gray-500 dark:text-gray-400">
              Not yet a member?{' '}
              <Link to={ROUTES.REGISTER} className="text-[#B89047] dark:text-[#EAD29A] font-bold hover:underline ml-1">
                Apply for Membership
              </Link>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-6">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-[#B89047] dark:hover:text-[#EAD29A] transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Back to Sanctuary Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default LoginPage;

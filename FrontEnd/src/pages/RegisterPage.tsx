import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { ROUTES } from '../constants/routes';
import { CLUB_INFO } from '../constants/club';
import { Trophy, RotateCw, ArrowLeft, Mail, User, ShieldCheck, Phone, Calendar, BadgeCheck, Briefcase, ShoppingBag, Coffee, DollarSign, Crown, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/auth/PasswordInput';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import { GoogleButton } from '../components/auth/GoogleButton';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

export type ClubRole =
  | 'MEMBER'
  | 'FRONT_DESK'
  | 'BAR_STAFF'
  | 'SHOP_STAFF'
  | 'ACCOUNTANT'
  | 'MANAGER'
  | 'OWNER'
  | 'SYSTEM_ADMIN';

export const RegisterPage: React.FC = () => {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [role, setRole] = useState<ClubRole>('MEMBER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to appropriate portal
  useEffect(() => {
    if (isAuthenticated && user) {
      const isStaff = user.roles?.some((r: string) => ['FRONT_DESK', 'MANAGER', 'OWNER'].includes(r));
      navigate(isStaff ? ROUTES.RECEPTIONIST : ROUTES.MEMBER_PORTAL, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      toast.error('Please enter your full name');
      return;
    }

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!phone.trim()) {
      toast.error('Please enter your contact phone number');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      toast.error('Password must contain an uppercase letter, lowercase letter, number, and special character');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!acceptTerms) {
      toast.error('Please agree to the Terms of Use and Privacy Policy');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await register(
        fullName,
        email.trim().toLowerCase(),
        password,
        role,
        phone.trim(),
        dateOfBirth || undefined
      );

      if (role === 'MEMBER') {
        toast.success(`Application submitted! Awaiting administrator approval to activate your membership pass.`, { duration: 6000 });
      } else {
        toast.success(`Welcome to ${CLUB_INFO.shortName}, ${firstName}! Account established.`);
      }

      const destinationMap: Record<ClubRole, string> = {
        OWNER: ROUTES.OWNER,
        SYSTEM_ADMIN: ROUTES.ADMIN,
        MANAGER: ROUTES.MANAGER,
        ACCOUNTANT: ROUTES.ACCOUNTANT,
        SHOP_STAFF: ROUTES.SHOP_STATION,
        BAR_STAFF: ROUTES.BAR,
        FRONT_DESK: ROUTES.RECEPTIONIST,
        MEMBER: ROUTES.MEMBER_PORTAL,
      };
      navigate(destinationMap[role] || ROUTES.MEMBER_PORTAL, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed. Email or phone may already be registered.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="min-h-[85vh] flex items-center justify-center pt-28 pb-16 px-4">
        <div className="w-full max-w-2xl">
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
                Establish Your Credentials
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Select your account tier to configure privileges, sanctuary access, and staff roles
              </p>
            </div>

            {/* Role Selection Switcher */}
            <div className="mb-6 space-y-2">
              <label className="block text-xs uppercase font-semibold tracking-wider text-[#1D1D1F] dark:text-gray-200 font-display">
                Account Type & Role Assignment
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'MEMBER' as ClubRole,
                    title: 'Club Member',
                    sub: 'Sanctuary Access',
                    desc: 'Digital VIP card, member rates, court reservations & invoices.',
                    icon: BadgeCheck,
                  },
                  {
                    id: 'FRONT_DESK' as ClubRole,
                    title: 'Front Desk Lead',
                    sub: 'Reception & Station',
                    desc: 'QR check-ins, court timeline scheduler, POS & lead enquiries.',
                    icon: Briefcase,
                  },
                  {
                    id: 'BAR_STAFF' as ClubRole,
                    title: 'Bar & Cafe Lounge',
                    sub: 'POS & KDS Kitchen',
                    desc: 'Table billing, kitchen order queue, stock status & cocktail bar.',
                    icon: Coffee,
                  },
                  {
                    id: 'SHOP_STAFF' as ClubRole,
                    title: 'Pro Shop Specialist',
                    sub: 'POS & Inventory',
                    desc: 'Barcode scanning, Click & Collect pickups, restocks & returns.',
                    icon: ShoppingBag,
                  },
                  {
                    id: 'ACCOUNTANT' as ClubRole,
                    title: 'Club Accountant',
                    sub: 'P&L & Compliance',
                    desc: 'General ledger, payroll disbursals, expense audits & GST tax.',
                    icon: DollarSign,
                  },
                  {
                    id: 'MANAGER' as ClubRole,
                    title: 'General Manager',
                    sub: 'Operations Console',
                    desc: 'Court tariff overrides, staff shifts, inventory audits & registers.',
                    icon: ShieldCheck,
                  },
                  {
                    id: 'OWNER' as ClubRole,
                    title: 'Club Owner',
                    sub: 'Executive Strategy',
                    desc: 'Clubwide financial telemetry, expense approvals & investor reports.',
                    icon: Crown,
                  },
                  {
                    id: 'SYSTEM_ADMIN' as ClubRole,
                    title: 'System Admin',
                    sub: 'Security & Access',
                    desc: 'User accounts, permissions matrix, tax rates & security audit.',
                    icon: Settings,
                  },
                ]?.map(({ id, title, sub, desc, icon: Icon }) => {
                  const isSelected = role === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setRole(id)}
                      className={cn(
                        'p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between group',
                        isSelected
                          ? 'border-[#B89047] bg-[#B89047]/10 shadow-[0_4px_20px_rgba(184,144,71,0.15)] ring-1 ring-[#B89047]'
                          : 'border-black/10 dark:border-white/10 hover:border-[#B89047]/40 bg-white/50 dark:bg-white/[0.02] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105',
                            isSelected ? 'bg-gradient-to-br from-[#EAD29A] to-[#B89047] text-[#121214] font-bold shadow-sm' : 'bg-black/5 dark:bg-white/10 text-gray-400'
                          )}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#1D1D1F] dark:text-white leading-snug">{title}</div>
                            <span className="text-[10px] text-[#B89047] font-semibold uppercase tracking-wider block mt-0.5">{sub}</span>
                          </div>
                        </div>
                        <div className={cn(
                          'w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                          isSelected ? 'border-[#B89047] bg-[#B89047]' : 'border-black/20 dark:border-white/20'
                        )}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Google OAuth Button */}
            <div className="mb-6">
              <GoogleButton />
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/10 dark:border-white/10" />
                </div>
                <span className="relative px-3 text-[11px] font-semibold tracking-wider text-gray-400 bg-white/80 dark:bg-[#0A0A0D] uppercase">
                  Or register with credentials
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold tracking-wider text-[#1D1D1F] dark:text-gray-200 font-display">
                    First Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Rohit"
                      className="w-full px-4 py-3 pl-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white placeholder:text-gray-400 focus:border-[#B89047] focus:ring-2 focus:ring-[#B89047]/20 outline-none text-sm transition-all shadow-sm"
                    />
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold tracking-wider text-[#1D1D1F] dark:text-gray-200 font-display">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white placeholder:text-gray-400 focus:border-[#B89047] focus:ring-2 focus:ring-[#B89047]/20 outline-none text-sm transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold tracking-wider text-[#1D1D1F] dark:text-gray-200 font-display">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rohit.sharma@example.com"
                      className="w-full px-4 py-3 pl-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white placeholder:text-gray-400 focus:border-[#B89047] focus:ring-2 focus:ring-[#B89047]/20 outline-none text-sm transition-all shadow-sm"
                    />
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold tracking-wider text-[#1D1D1F] dark:text-gray-200 font-display">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 pl-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white placeholder:text-gray-400 focus:border-[#B89047] focus:ring-2 focus:ring-[#B89047]/20 outline-none text-sm transition-all shadow-sm"
                    />
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold tracking-wider text-[#1D1D1F] dark:text-gray-200 font-display">
                  Date of Birth (Optional)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-3 pl-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white placeholder:text-gray-400 focus:border-[#B89047] focus:ring-2 focus:ring-[#B89047]/20 outline-none text-sm transition-all shadow-sm"
                  />
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Password */}
              <div>
                <PasswordInput
                  label="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
                <PasswordStrength password={password} />
              </div>

              {/* Confirm Password */}
              <div>
                <PasswordInput
                  label="Confirm Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#B89047] focus:ring-[#B89047] cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-gray-500 dark:text-gray-400 leading-snug cursor-pointer select-none">
                  I agree to the{' '}
                  <span className="text-[#B89047] hover:underline font-medium">Terms of Service</span>,{' '}
                  <span className="text-[#B89047] hover:underline font-medium">Code of Conduct</span>, and{' '}
                  <span className="text-[#B89047] hover:underline font-medium">Privacy Policy</span>.
                </label>
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
                    <span>Registering Account & Role...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Create {role === 'FRONT_DESK' ? 'Staff' : 'Member'} Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Existing user */}
            <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10 text-center text-xs text-gray-500 dark:text-gray-400">
              Already a distinguished member?{' '}
              <Link to={ROUTES.LOGIN} className="text-[#B89047] dark:text-[#EAD29A] font-bold hover:underline ml-1">
                Sign In
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

export default RegisterPage;

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Trophy, Sparkles, ChevronRight, Phone, ShieldCheck, User, Sun, Moon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '../../constants/routes';
import { CLUB_INFO } from '../../constants/club';
import { cn } from '../../utils/cn';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  name: string;
  path: string;
}

const PUBLIC_NAV_LINKS: NavItem[] = [
  { name: 'Courts',        path: ROUTES.COURTS      },
  { name: 'Pro Shop',      path: ROUTES.SHOP        },
  { name: 'Cafe & Lounge', path: ROUTES.CAFE        },
  { name: 'Memberships',   path: ROUTES.MEMBERSHIPS },
  { name: 'Sanctuary',     path: ROUTES.ABOUT       },
  { name: 'Concierge',     path: ROUTES.CONTACT     },
];

const MEMBER_NAV_LINKS: NavItem[] = [
  { name: 'Member Sanctuary', path: ROUTES.MEMBER_PORTAL },
  { name: 'Courts',           path: ROUTES.COURTS },
  { name: 'Pro Shop',         path: ROUTES.SHOP },
  { name: 'Cafe & Lounge',    path: ROUTES.CAFE },
  { name: 'Memberships',      path: ROUTES.MEMBERSHIPS },
];

const FRONT_DESK_NAV_LINKS: NavItem[] = [
  { name: 'Check-In Station',     path: `${ROUTES.RECEPTIONIST}?tab=checkin` },
  { name: 'Court Calendar',       path: `${ROUTES.RECEPTIONIST}?tab=calendar` },
  { name: 'Member Directory',     path: `${ROUTES.RECEPTIONIST}?tab=members` },
  { name: 'Billing & POS',        path: `${ROUTES.RECEPTIONIST}?tab=billing` },
  { name: 'Leads & Enquiries',    path: `${ROUTES.RECEPTIONIST}?tab=enquiries` },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout, isFrontDesk } = useAuth();
  const isNight = theme === 'night';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Dynamic Navigation according to Role
  const currentNavLinks: NavItem[] = isFrontDesk
    ? FRONT_DESK_NAV_LINKS
    : isAuthenticated
    ? MEMBER_NAV_LINKS
    : PUBLIC_NAV_LINKS;

  const brandHomeRoute = isFrontDesk ? ROUTES.RECEPTIONIST : ROUTES.HOME;
  const brandSubline = isFrontDesk
    ? 'Front Desk Operations • Live Station'
    : isAuthenticated
    ? 'Private Member Sanctuary • Est. 2018'
    : 'Private Athletic Haven • Est. 2018';

  const isLinkActive = (itemPath: string) => {
    const fullPath = location.pathname + location.search;
    if (itemPath.includes('?')) {
      return fullPath === itemPath || (location.pathname === ROUTES.RECEPTIONIST && itemPath.endsWith('checkin') && !location.search);
    }
    return location.pathname === itemPath;
  };

  // Close mobile drawer and reset scrolled state on route change
  useEffect(() => {
    setMobileOpen(false);
    setScrolled(false);
  }, [location.pathname, location.search]);

  // Zero-latency hardware-accelerated scroll measurement
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          BESPOKE ULTRA-LUXURY FLOATING GLASS CAPSULE
          Pure Obsidian (#000) Night & Champagne Pearl Day
          ══════════════════════════════════════════════════════ */}
      <header className="fixed top-3.5 sm:top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl" style={{ contain: 'layout style' }}>
        <nav
          className={cn(
            'flex items-center justify-between rounded-full transition-all duration-300 ease-out border backdrop-blur-md',
            isNight
              ? scrolled
                ? 'px-4 sm:px-6 py-2.5 bg-[#0A0A0D]/88 border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_0_1px_rgba(184,144,71,0.25),inset_0_1px_1px_rgba(255,255,255,0.1)]'
                : 'px-5 sm:px-7 py-3.5 bg-[#0A0A0D]/80 border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.7),0_0_0_1px_rgba(184,144,71,0.2),inset_0_1px_1px_rgba(255,255,255,0.08)]'
              : scrolled
                ? 'px-4 sm:px-6 py-2.5 bg-white/92 border-white/90 shadow-[0_16px_40px_-10px_rgba(15,20,35,0.1),0_0_0_1px_rgba(184,144,71,0.2),inset_0_1px_2px_0_rgba(255,255,255,1)]'
                : 'px-5 sm:px-7 py-3.5 bg-white/85 border-white/70 shadow-[0_10px_30px_-8px_rgba(15,20,35,0.06),0_0_0_1px_rgba(184,144,71,0.14),inset_0_1px_2px_0_rgba(255,255,255,0.9)]'
          )}
        >
          {/* ── Brand Monogram & Crest ── */}
          <Link to={brandHomeRoute} className="flex items-center gap-3 group select-none">
            {/* Multi-layered Champagne Gold & Obsidian Seal */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[1.5px] bg-gradient-to-br from-[#EAD29A] via-[#B89047] to-[#7D5A1E] shadow-sm transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-[#121214] flex items-center justify-center">
                {isFrontDesk ? (
                  <ShieldCheck size={16} className="text-[#EAD29A] transition-transform duration-300 group-hover:rotate-6" />
                ) : (
                  <Trophy size={16} className="text-[#EAD29A] transition-transform duration-300 group-hover:rotate-6" />
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#B89047] border-2 border-white dark:border-[#0A0A0D] flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-white" />
              </span>
            </div>

            {/* Prestige Club Title & Heritage Subline */}
            <div className="flex flex-col">
              <span className={cn(
                'text-[13px] sm:text-[15px] font-bold tracking-[0.14em] uppercase leading-none font-display transition-colors',
                isNight ? 'text-white' : 'text-[#121214]'
              )}>
                {CLUB_INFO.shortName}
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] font-semibold tracking-[0.24em] text-[#A67C38] dark:text-[#EAD29A] uppercase mt-1 hidden sm:inline leading-none">
                {brandSubline}
              </span>
            </div>
          </Link>

          {/* ── Center: Fluid Crystal Navigation ── */}
          <div className={cn(
            'hidden lg:flex items-center gap-1 px-2 py-1 rounded-full border transition-colors',
            isNight ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-black/[0.02] border-black/[0.04]'
          )}>
            {currentNavLinks.map((link) => {
              const isActive = isLinkActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'relative px-4 py-1.5 text-[13px] font-medium rounded-full transition-colors duration-200 select-none flex items-center gap-1.5',
                    isActive
                      ? isNight ? 'text-white font-semibold' : 'text-[#121214] font-semibold'
                      : isNight ? 'text-[#A1A1A6] hover:text-[#EAD29A]' : 'text-[#55555A] hover:text-[#B89047]'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="luxury-active-indicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className={cn(
                        'absolute inset-0 rounded-full border',
                        isNight
                          ? 'bg-gradient-to-b from-[#1E1E24] to-[#121216] border-[#B89047]/45 shadow-[0_0_20px_rgba(184,144,71,0.22)]'
                          : 'bg-gradient-to-b from-white to-[#FDFBF7] border-[#B89047]/30 shadow-[0_4px_16px_rgba(184,144,71,0.18),inset_0_1px_1px_rgba(255,255,255,1)]'
                      )}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B89047] inline-block shadow-[0_0_6px_rgba(184,144,71,0.8)]" />
                    )}
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* ── Right Section: Theme Toggle, Role-Based Access & CTA ── */}
          <div className="hidden md:flex items-center gap-3">
            {/* Luxury Night / Day Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                'relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border active:scale-90 cursor-pointer',
                isNight
                  ? 'bg-[#18181D] text-[#EAD29A] border-[#B89047]/40 hover:border-[#B89047] shadow-[0_0_12px_rgba(184,144,71,0.25)]'
                  : 'bg-[#F5F5F7] text-[#1D1D1F] border-black/10 hover:border-[#B89047]/40 shadow-sm'
              )}
              aria-label={isNight ? 'Switch to Day Mode' : 'Switch to Pure Obsidian Night Mode'}
              title={isNight ? 'Switch to Day Mode' : 'Switch to Pure Obsidian Night Mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isNight ? (
                  <motion.div
                    key="night"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon size={15} className="fill-[#EAD29A]/30 text-[#EAD29A]" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="day"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun size={16} className="text-[#B89047]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Authenticated State vs Public State */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {/* Role Badge */}
                {isFrontDesk ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-[#B89047]/15 text-[#B89047] border-[#B89047]/30 select-none">
                    <ShieldCheck size={13} className="text-[#B89047] flex-shrink-0" />
                    <span>Front Desk</span>
                  </div>
                ) : (
                  <Link
                    to={ROUTES.MEMBER_PORTAL}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-[#B89047]/15 text-[#B89047] border-[#B89047]/30 hover:bg-[#B89047]/25 transition-all select-none"
                    title="Open Member Sanctuary Portal"
                  >
                    <Trophy size={12} className="text-[#B89047] flex-shrink-0" />
                    <span>Member Pass</span>
                  </Link>
                )}

                {/* User Name Pill */}
                <Link
                  to={isFrontDesk ? ROUTES.RECEPTIONIST : ROUTES.MEMBER_PORTAL}
                  className={cn(
                    'inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors hover:border-[#B89047]/50',
                    isNight
                      ? 'bg-[#16161A] text-white border-white/10'
                      : 'bg-[#F7F5F0] text-[#121214] border-black/5'
                  )}
                  title="My Sanctuary Account"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#EAD29A] to-[#B89047] flex items-center justify-center text-[10px] font-bold text-[#121214]">
                    {user.name ? user.name.charAt(0).toUpperCase() : (isFrontDesk ? 'S' : 'M')}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name?.split(' ')[0] || 'User'}</span>
                </Link>

                {/* Exit / Logout */}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full border border-red-500/25 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={13} />
                  <span className="hidden xl:inline">Exit</span>
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className={cn(
                  'inline-flex items-center gap-1.5 text-[13px] font-medium tracking-wide px-3.5 py-2 rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 select-none',
                  isNight
                    ? 'text-white/85 hover:text-[#EAD29A] hover:bg-white/[0.06]'
                    : 'text-[#121214]/85 hover:text-[#B89047] hover:bg-black/[0.04]'
                )}
              >
                <User size={14} className="text-[#B89047] flex-shrink-0" />
                <span className="whitespace-nowrap leading-none">Sign In</span>
              </Link>
            )}

            {/* Public/Member Reserve CTA (Hidden for Front Desk Staff) */}
            {!isFrontDesk && (
              <Link
                to={ROUTES.COURTS}
                className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] hover:from-[#B89047] hover:via-[#A67C38] hover:to-[#8C6826] shadow-[0_8px_20px_-6px_rgba(20,20,24,0.3)] hover:shadow-[0_10px_24px_-4px_rgba(184,144,71,0.4)] transition-all duration-300 active:scale-95 border border-[#B89047]/40 hover:border-white/40 overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent ease-out" />
                <Sparkles size={13} className="text-[#EAD29A] group-hover:text-white transition-colors flex-shrink-0" />
                <span className="tracking-wide">Reserve Court</span>
                <ChevronRight size={13} className="text-white/60 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>

          {/* ── Mobile Trigger & Quick Controls ── */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border active:scale-90 transition-colors',
                isNight
                  ? 'bg-[#18181D] text-[#EAD29A] border-[#B89047]/40'
                  : 'bg-[#F5F5F7] text-[#1D1D1F] border-black/10'
              )}
              aria-label="Toggle Theme"
            >
              {isNight ? <Moon size={14} className="fill-[#EAD29A]/30 text-[#EAD29A]" /> : <Sun size={14} className="text-[#B89047]" />}
            </button>

            {/* Quick Mobile Sign In / Profile Indicator */}
            {!isAuthenticated ? (
              <Link
                to={ROUTES.LOGIN}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-colors shadow-sm whitespace-nowrap flex-shrink-0',
                  isNight
                    ? 'bg-white/5 border-white/10 text-white hover:text-[#EAD29A]'
                    : 'bg-[#F5F5F7] border-black/10 text-[#121214] hover:text-[#B89047]'
                )}
              >
                <User size={12} className="text-[#B89047] flex-shrink-0" />
                <span className="whitespace-nowrap leading-none">Sign In</span>
              </Link>
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#EAD29A] to-[#B89047] flex items-center justify-center text-[10px] font-bold text-[#121214] flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : (isFrontDesk ? 'S' : 'M')}
              </div>
            )}

            {!isFrontDesk && (
              <Link
                to={ROUTES.COURTS}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-semibold text-white bg-[#121214] border border-[#B89047]/40 shadow-sm"
              >
                <Sparkles size={11} className="text-[#EAD29A]" />
                <span className="hidden sm:inline">Book</span>
              </Link>
            )}

            <button
              className={cn(
                'p-2 rounded-full transition-colors',
                isNight ? 'text-white hover:bg-white/10' : 'text-[#121214] hover:bg-black/5'
              )}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile Overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile Bespoke Luxury Glass Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'fixed top-20 sm:top-24 left-4 right-4 z-40 backdrop-blur-3xl border shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] rounded-[32px] lg:hidden overflow-hidden p-6',
              isNight ? 'bg-[#0A0A0D]/96 border-white/15 text-white' : 'bg-white/96 border-[#B89047]/30 text-[#121214]'
            )}
          >
            {/* Header in Drawer */}
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#121214] border border-[#B89047]/40 flex items-center justify-center">
                  {isFrontDesk ? (
                    <ShieldCheck size={13} className="text-[#EAD29A]" />
                  ) : (
                    <Trophy size={13} className="text-[#EAD29A]" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-[0.16em] uppercase">
                    The Champions Club
                  </span>
                  <span className="text-[9px] text-[#B89047] font-medium tracking-wider">
                    {brandSubline}
                  </span>
                </div>
              </div>
            </div>

            {/* Role-Based Nav list */}
            <div className="space-y-1.5">
              {currentNavLinks.map((link) => {
                const isActive = isLinkActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-2xl text-[15px] font-medium transition-colors',
                      isActive
                        ? isNight ? 'bg-[#18181D] text-white shadow-md border border-[#B89047]/30' : 'bg-[#121214] text-white shadow-md'
                        : isNight ? 'text-[#D1D1D6] hover:bg-white/5' : 'text-[#121214] hover:bg-[#FAF8F5]'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#EAD29A]" />}
                      {link.name}
                    </span>
                    <ChevronRight size={16} className={isActive ? 'text-[#EAD29A]' : 'text-[#71717A]'} />
                  </Link>
                );
              })}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-black/5 dark:border-white/10 mt-4 space-y-2.5">
                {!isFrontDesk && (
                  <Link
                    to={ROUTES.COURTS}
                    className="flex items-center justify-center gap-2 w-full h-12 text-sm font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] rounded-full shadow-md border border-[#B89047]/40"
                  >
                    <Sparkles size={14} className="text-[#EAD29A]" />
                    <span>Reserve a Court Privilege</span>
                  </Link>
                )}

                {isAuthenticated && user ? (
                  <div className={cn(
                    'p-3.5 rounded-2xl border flex items-center justify-between',
                    isNight ? 'bg-[#18181D] border-white/10' : 'bg-[#F9F7F2] border-black/5'
                  )}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EAD29A] to-[#B89047] flex items-center justify-center font-bold text-xs text-[#121214] flex-shrink-0">
                        {user.name ? user.name.charAt(0).toUpperCase() : (isFrontDesk ? 'S' : 'M')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold truncate text-[#1D1D1F] dark:text-white">{user.name}</p>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#B89047]/20 text-[#B89047]">
                            {isFrontDesk ? 'Front Desk' : 'Member'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="px-3 py-1.5 rounded-full text-xs font-medium text-red-500 border border-red-500/25 hover:bg-red-500/10 transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={ROUTES.LOGIN}
                      className={cn(
                        'flex items-center justify-center gap-1.5 h-11 text-xs font-semibold rounded-full border transition-colors',
                        isNight ? 'bg-[#16161A] text-white border-white/10 hover:bg-[#202026]' : 'bg-[#F7F5F0] text-[#121214] border-black/5 hover:bg-[#EFECE3]'
                      )}
                    >
                      <User size={14} className="text-[#B89047]" />
                      <span>Sign In</span>
                    </Link>

                    <Link
                      to={ROUTES.REGISTER}
                      className={cn(
                        'flex items-center justify-center gap-1.5 h-11 text-xs font-semibold rounded-full border transition-colors',
                        isNight ? 'bg-[#1E190F] text-[#EAD29A] border-[#B89047]/30 hover:bg-[#2A2315]' : 'bg-[#FAF5EB] text-[#8C6826] border-[#B89047]/20 hover:bg-[#F5EDDC]'
                      )}
                    >
                      <Trophy size={13} className="text-[#B89047]" />
                      <span>Sign Up</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

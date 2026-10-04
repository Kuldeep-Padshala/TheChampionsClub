import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Trophy, Sparkles, ChevronRight, Phone, ShieldCheck, User, Sun, Moon, LogOut, Briefcase, Coffee, ShoppingBag, DollarSign, Crown, Settings, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '../../constants/routes';
import { CLUB_INFO } from '../../constants/club';
import { cn } from '../../utils/cn';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { memberService } from '../../services/memberService';

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
  { name: 'Front Desk Lead',      path: ROUTES.RECEPTIONIST },
  { name: 'Courts Calendar',      path: ROUTES.COURTS },
  { name: 'Cafe & Lounge',        path: ROUTES.CAFE },
  { name: 'Pro Shop',             path: ROUTES.SHOP },
];

const MANAGER_NAV_LINKS: NavItem[] = [
  { name: 'Manager Console',      path: ROUTES.MANAGER },
  { name: 'Front Desk Station',   path: ROUTES.RECEPTIONIST },
  { name: 'Courts',               path: ROUTES.COURTS },
  { name: 'Cafe & Lounge',        path: ROUTES.CAFE },
  { name: 'Pro Shop',             path: ROUTES.SHOP },
];

const BAR_NAV_LINKS: NavItem[] = [
  { name: 'Bar Station & POS',    path: ROUTES.BAR },
  { name: 'Clubhouse Menu',       path: ROUTES.CAFE },
  { name: 'Courts',               path: ROUTES.COURTS },
];

const SHOP_NAV_LINKS: NavItem[] = [
  { name: 'Pro Shop Terminal',    path: ROUTES.SHOP_STATION },
  { name: 'Club Catalog',         path: ROUTES.SHOP },
  { name: 'Courts',               path: ROUTES.COURTS },
];

const ACCOUNTANT_NAV_LINKS: NavItem[] = [
  { name: 'Finance & Ledger',     path: ROUTES.ACCOUNTANT },
  { name: 'Executive Overview',   path: ROUTES.OWNER },
  { name: 'Courts',               path: ROUTES.COURTS },
  { name: 'Pro Shop',             path: ROUTES.SHOP },
];

const OWNER_NAV_LINKS: NavItem[] = [
  { name: 'Executive Suite',      path: ROUTES.OWNER },
  { name: 'Operations Console',   path: ROUTES.MANAGER },
  { name: 'Finance & P&L',        path: ROUTES.ACCOUNTANT },
  { name: 'Courts',               path: ROUTES.COURTS },
  { name: 'Pro Shop',             path: ROUTES.SHOP },
  { name: 'Cafe & Bar',           path: ROUTES.CAFE },
];

const ADMIN_NAV_LINKS: NavItem[] = [
  { name: 'Admin Console',        path: ROUTES.ADMIN },
  { name: 'Front Desk Lead',      path: ROUTES.RECEPTIONIST },
  { name: 'Courts',               path: ROUTES.COURTS },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout, isFrontDesk, isManager, isBarStaff, isShopStaff, isAccountant, isOwner, isAdmin } = useAuth();
  const isNight = theme === 'night';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [memberPlan, setMemberPlan] = useState<{ planCode?: string; isExpiringSoon?: boolean } | null>(null);

  useEffect(() => {
    if (isAuthenticated && !isFrontDesk && !isManager && !isBarStaff && !isShopStaff && !isAccountant && !isOwner && !isAdmin) {
      memberService.getProfile().then((data) => {
        if (data?.active_membership) {
          const code = (data.active_membership.plan_code || data.active_membership.plan_name || '').toLowerCase();
          let isExpiringSoon = false;
          if (data.active_membership.end_date) {
            const expDate = new Date(data.active_membership.end_date).getTime();
            const daysLeft = Math.ceil((expDate - Date.now()) / (1000 * 60 * 60 * 24));
            isExpiringSoon = daysLeft >= 0 && daysLeft <= 5;
          }
          setMemberPlan({ planCode: code, isExpiringSoon });
        } else {
          setMemberPlan({ planCode: 'none', isExpiringSoon: false });
        }
      }).catch(() => {
        setMemberPlan(null);
      });
    } else {
      setMemberPlan(null);
    }
  }, [isAuthenticated, isFrontDesk, isManager, isBarStaff, isShopStaff, isAccountant, isOwner, isAdmin, user?.id]);

  // Dynamic Navigation according to Role & Membership Status
  // If member already has Gold and is not expiring in 1-5 days, hide Memberships link
  const filteredMemberLinks: NavItem[] = MEMBER_NAV_LINKS.filter((item) => {
    if (item.path === ROUTES.MEMBERSHIPS) {
      if (memberPlan?.planCode === 'gold' && !memberPlan?.isExpiringSoon) {
        return false; // Already has Gold; hide redundant membership link
      }
    }
    return true;
  }).map((item) => {
    if (item.path === ROUTES.MEMBERSHIPS && memberPlan?.isExpiringSoon) {
      return { ...item, name: 'Renew Pass' };
    }
    return item;
  });

  const currentNavLinks: NavItem[] = isOwner
    ? OWNER_NAV_LINKS
    : isAdmin
    ? ADMIN_NAV_LINKS
    : isShopStaff && !isManager
    ? SHOP_NAV_LINKS
    : isAccountant && !isManager
    ? ACCOUNTANT_NAV_LINKS
    : isBarStaff && !isManager
    ? BAR_NAV_LINKS
    : isManager
    ? MANAGER_NAV_LINKS
    : isFrontDesk
    ? FRONT_DESK_NAV_LINKS
    : isAuthenticated
    ? filteredMemberLinks
    : PUBLIC_NAV_LINKS;

  const brandHomeRoute = isOwner
    ? ROUTES.OWNER
    : isAdmin
    ? ROUTES.ADMIN
    : isShopStaff && !isManager
    ? ROUTES.SHOP_STATION
    : isAccountant && !isManager
    ? ROUTES.ACCOUNTANT
    : isBarStaff && !isManager
    ? ROUTES.BAR
    : isManager
    ? ROUTES.MANAGER
    : isFrontDesk
    ? ROUTES.RECEPTIONIST
    : isAuthenticated
    ? ROUTES.MEMBER_PORTAL
    : ROUTES.HOME;

  const brandSubline = isOwner
    ? 'Executive Owner & Strategy Suite'
    : isAdmin
    ? 'System Administration & Security Suite'
    : isShopStaff && !isManager
    ? 'The Champions Pro Shop • POS & Fulfillment'
    : isAccountant && !isManager
    ? 'Financial Audit & Accounting Suite'
    : isBarStaff && !isManager
    ? 'Champions Cafe & Bar Lounge • POS Station'
    : isManager
    ? 'Executive Operations • General Manager Suite'
    : isFrontDesk
    ? 'Front Desk Operations • Live Station'
    : isAuthenticated
    ? 'Private Member Sanctuary • Est. 2018'
    : 'Private Athletic Haven • Est. 2018';

  const isStaffStationRoute =
    location.pathname.startsWith(ROUTES.MANAGER) ||
    location.pathname.startsWith(ROUTES.BAR) ||
    location.pathname.startsWith(ROUTES.SHOP_STATION) ||
    location.pathname.startsWith(ROUTES.ACCOUNTANT) ||
    location.pathname.startsWith(ROUTES.OWNER) ||
    location.pathname.startsWith(ROUTES.ADMIN) ||
    location.pathname.startsWith(ROUTES.RECEPTIONIST);

  const isLinkActive = (itemPath: string) => {
    const fullPath = location.pathname + location.search;
    if (itemPath.includes('?')) {
      return fullPath === itemPath || 
        (location.pathname === ROUTES.RECEPTIONIST && itemPath.endsWith('checkin') && !location.search) ||
        (location.pathname === ROUTES.MANAGER && itemPath.endsWith('finance') && !location.search) ||
        (location.pathname === ROUTES.BAR && itemPath.endsWith('pos') && !location.search) ||
        (location.pathname === ROUTES.SHOP_STATION && itemPath.endsWith('pos') && !location.search) ||
        (location.pathname === ROUTES.ACCOUNTANT && itemPath.endsWith('pnl') && !location.search) ||
        (location.pathname === ROUTES.OWNER && itemPath.endsWith('overview') && !location.search) ||
        (location.pathname === ROUTES.ADMIN && itemPath.endsWith('users') && !location.search);
    }
    return location.pathname === itemPath;
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          BESPOKE ULTRA-LUXURY FLOATING GLASS CAPSULE
          Pure Obsidian (#000) Night & Champagne Pearl Day
          ══════════════════════════════════════════════════════ */}
      <header className="fixed top-3.5 sm:top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
        <nav
          className={cn(
            'flex items-center justify-between rounded-full px-5 sm:px-7 py-3 transition-colors duration-200 border shadow-lg select-none',
            isNight
              ? 'bg-[#0D0D12]/95 border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl'
              : 'bg-[#FCFBF9]/95 border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl'
          )}
        >
          {/* ── Brand Monogram & Crest ── */}
          <Link to={brandHomeRoute} className="flex items-center gap-2.5 sm:gap-3 group select-none flex-shrink-0 whitespace-nowrap">
            {/* Multi-layered Champagne Gold & Obsidian Seal */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[1.5px] bg-gradient-to-br from-[#EAD29A] via-[#B89047] to-[#7D5A1E] shadow-sm transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-[#121214] flex items-center justify-center">
                {isOwner ? (
                  <Crown size={16} className="text-[#EAD29A] transition-transform duration-300 group-hover:rotate-6" />
                ) : isAdmin ? (
                  <Settings size={16} className="text-[#38BDF8] transition-transform duration-300 group-hover:rotate-6" />
                ) : isBarStaff && !isManager ? (
                  <Coffee size={16} className="text-[#EAD29A] transition-transform duration-300 group-hover:rotate-6" />
                ) : isManager ? (
                  <Briefcase size={16} className="text-[#EAD29A] transition-transform duration-300 group-hover:rotate-6" />
                ) : isFrontDesk ? (
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
            <div className="flex flex-col whitespace-nowrap flex-shrink-0">
              <span className={cn(
                'text-[13px] sm:text-[15px] font-bold tracking-[0.14em] uppercase leading-none font-display transition-colors whitespace-nowrap',
                isNight ? 'text-white' : 'text-[#121214]'
              )}>
                {CLUB_INFO.shortName}
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] font-semibold tracking-[0.24em] text-[#A67C38] dark:text-[#EAD29A] uppercase mt-1 hidden sm:inline leading-none whitespace-nowrap">
                {brandSubline}
              </span>
            </div>
          </Link>

          {/* ── Center: Fluid Crystal Navigation or Operational Station Badge ── */}
          {isStaffStationRoute ? (
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] select-none shadow-sm flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse flex-shrink-0" />
              <span className="text-xs font-bold text-[#1D1D1F] dark:text-white font-display tracking-wide whitespace-nowrap">
                {brandSubline}
              </span>
              <span className="text-black/20 dark:text-white/20">•</span>
              <Link
                to={ROUTES.HOME}
                className="text-xs text-[#B89047] hover:text-[#997332] dark:hover:text-[#EAD29A] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>View Public Club</span>
                <ExternalLink size={11} />
              </Link>
            </div>
          ) : (
            <div className={cn(
              'hidden lg:flex items-center gap-0.5 xl:gap-1 px-1.5 xl:px-2 py-1 rounded-full border transition-colors whitespace-nowrap flex-shrink-0',
              isNight ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-black/[0.02] border-black/[0.04]'
            )}>
              {currentNavLinks.map((link) => {
                const isActive = isLinkActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'relative px-2.5 xl:px-3.5 py-1.5 text-xs xl:text-[13px] font-medium rounded-full transition-all duration-200 select-none flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 leading-none',
                      isActive
                        ? isNight ? 'text-white font-semibold' : 'text-[#121214] font-semibold'
                        : isNight ? 'text-[#A1A1A6] hover:text-[#EAD29A]' : 'text-[#55555A] hover:text-[#B89047]'
                    )}
                  >
                    {/* Active pill background — simple CSS, no cross-route layoutId animation */}
                    <span
                      className={cn(
                        'absolute inset-0 rounded-full border transition-opacity duration-200',
                        isNight
                          ? 'bg-gradient-to-b from-[#1E1E24] to-[#121216] border-[#B89047]/45 shadow-[0_0_20px_rgba(184,144,71,0.22)]'
                          : 'bg-gradient-to-b from-white to-[#FDFBF7] border-[#B89047]/30 shadow-[0_4px_16px_rgba(184,144,71,0.18),inset_0_1px_1px_rgba(255,255,255,1)]',
                        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      )}
                    />
                    <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap leading-none">
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full bg-[#B89047] inline-block shadow-[0_0_6px_rgba(184,144,71,0.8)] flex-shrink-0 transition-opacity duration-200',
                          isActive ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="whitespace-nowrap">{link.name}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── Right Section: Theme Toggle, Role-Based Access & CTA ── */}
          <div className="hidden md:flex items-center gap-2 xl:gap-3 flex-shrink-0 whitespace-nowrap">
            {/* Luxury Night / Day Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                'relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border active:scale-90 cursor-pointer flex-shrink-0',
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
              <div className="flex items-center gap-1.5 xl:gap-2 flex-shrink-0 whitespace-nowrap">
                {/* Role Badge */}
                {isOwner ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 xl:px-3 py-1.5 rounded-full border bg-amber-500/20 text-[#EAD29A] border-amber-500/40 select-none whitespace-nowrap flex-shrink-0 shadow-[0_0_12px_rgba(234,210,154,0.2)]">
                    <Crown size={13} className="text-[#EAD29A] flex-shrink-0" />
                    <span className="whitespace-nowrap">Club Owner</span>
                  </div>
                ) : isAdmin ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 xl:px-3 py-1.5 rounded-full border bg-sky-500/20 text-sky-300 border-sky-500/40 select-none whitespace-nowrap flex-shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                    <Settings size={13} className="text-sky-300 flex-shrink-0" />
                    <span className="whitespace-nowrap">System Admin</span>
                  </div>
                ) : isShopStaff && !isManager ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 xl:px-3 py-1.5 rounded-full border bg-purple-500/15 text-purple-400 border-purple-500/30 select-none whitespace-nowrap flex-shrink-0">
                    <ShoppingBag size={13} className="text-purple-400 flex-shrink-0" />
                    <span className="whitespace-nowrap">Shop Staff</span>
                  </div>
                ) : isAccountant && !isManager ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 xl:px-3 py-1.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 select-none whitespace-nowrap flex-shrink-0">
                    <DollarSign size={13} className="text-emerald-400 flex-shrink-0" />
                    <span className="whitespace-nowrap">Accountant</span>
                  </div>
                ) : isBarStaff && !isManager ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 xl:px-3 py-1.5 rounded-full border bg-amber-500/15 text-amber-500 border-amber-500/30 select-none whitespace-nowrap flex-shrink-0">
                    <Coffee size={13} className="text-amber-500 flex-shrink-0" />
                    <span className="whitespace-nowrap">Bar & Cafe</span>
                  </div>
                ) : isManager ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 xl:px-3 py-1.5 rounded-full border bg-amber-500/15 text-amber-500 border-amber-500/30 select-none whitespace-nowrap flex-shrink-0">
                    <Briefcase size={13} className="text-amber-500 flex-shrink-0" />
                    <span className="whitespace-nowrap">General Manager</span>
                  </div>
                ) : isFrontDesk ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 xl:px-3 py-1.5 rounded-full border bg-[#B89047]/15 text-[#B89047] border-[#B89047]/30 select-none whitespace-nowrap flex-shrink-0">
                    <ShieldCheck size={13} className="text-[#B89047] flex-shrink-0" />
                    <span className="whitespace-nowrap">Front Desk</span>
                  </div>
                ) : (
                  <Link
                    to={ROUTES.MEMBER_PORTAL}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-[#B89047]/15 text-[#B89047] border-[#B89047]/30 hover:bg-[#B89047]/25 transition-all select-none whitespace-nowrap flex-shrink-0"
                    title="Open Member Sanctuary Portal"
                  >
                    <Trophy size={12} className="text-[#B89047] flex-shrink-0" />
                    <span className="whitespace-nowrap">Member Pass</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className={cn(
                    'inline-flex items-center gap-1.5 xl:gap-2 text-xs font-semibold px-2.5 xl:px-3 py-1.5 rounded-full border transition-colors hover:border-[#B89047]/50 whitespace-nowrap flex-shrink-0 cursor-pointer active:scale-95',
                    isNight
                      ? 'bg-[#16161A] text-white border-white/10 hover:bg-[#202026]'
                      : 'bg-[#F7F5F0] text-[#121214] border-black/5 hover:bg-[#EFECE3]'
                  )}
                  title="View My Profile & Station Credentials"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#EAD29A] to-[#B89047] flex items-center justify-center text-[10px] font-bold text-[#121214] flex-shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : (isOwner ? 'O' : isAdmin ? 'A' : isBarStaff ? 'B' : isManager ? 'GM' : isFrontDesk ? 'S' : 'M')}
                  </div>
                  <span className="max-w-[90px] xl:max-w-[120px] truncate whitespace-nowrap">{user.name?.split(' ')[0] || 'User'}</span>
                </button>

                {/* Exit / Logout Button - Always visible with icon & label */}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-500/25 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 active:scale-95"
                  title="Sign Out of Club Account"
                >
                  <LogOut size={13} className="flex-shrink-0" />
                  <span className="whitespace-nowrap">Exit</span>
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className={cn(
                  'inline-flex items-center gap-1.5 text-[13px] font-medium tracking-wide px-3 xl:px-3.5 py-2 rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 select-none',
                  isNight
                    ? 'text-white/85 hover:text-[#EAD29A] hover:bg-white/[0.06]'
                    : 'text-[#121214]/85 hover:text-[#B89047] hover:bg-black/[0.04]'
                )}
              >
                <User size={14} className="text-[#B89047] flex-shrink-0" />
                <span className="whitespace-nowrap leading-none">Sign In</span>
              </Link>
            )}

            {/* Public Reserve CTA (Only shown for guest visitors who are not logged in) */}
            {!isAuthenticated && (
              <Link
                to={ROUTES.COURTS}
                className="group relative hidden xl:inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 xl:px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] hover:from-[#B89047] hover:via-[#A67C38] hover:to-[#8C6826] shadow-[0_8px_20px_-6px_rgba(20,20,24,0.3)] hover:shadow-[0_10px_24px_-4px_rgba(184,144,71,0.4)] transition-all duration-300 active:scale-95 border border-[#B89047]/40 hover:border-white/40 overflow-hidden whitespace-nowrap flex-shrink-0"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent ease-out" />
                <Sparkles size={13} className="text-[#EAD29A] group-hover:text-white transition-colors flex-shrink-0" />
                <span className="tracking-wide whitespace-nowrap">Reserve Court</span>
                <ChevronRight size={13} className="text-white/60 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
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
                {user?.name ? user.name.charAt(0).toUpperCase() : (isBarStaff ? 'B' : isManager ? 'GM' : isFrontDesk ? 'S' : 'M')}
              </div>
            )}

            {!isAuthenticated && (
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
                  {isOwner ? (
                    <Crown size={13} className="text-[#EAD29A]" />
                  ) : isAdmin ? (
                    <Settings size={13} className="text-[#38BDF8]" />
                  ) : isBarStaff && !isManager ? (
                    <Coffee size={13} className="text-[#EAD29A]" />
                  ) : isManager ? (
                    <Briefcase size={13} className="text-[#EAD29A]" />
                  ) : isFrontDesk ? (
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
                {!isAuthenticated && (
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
                        {user.name ? user.name.charAt(0).toUpperCase() : (isOwner ? 'O' : isAdmin ? 'A' : isBarStaff ? 'B' : isManager ? 'GM' : isFrontDesk ? 'S' : 'M')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold truncate text-[#1D1D1F] dark:text-white">{user.name}</p>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#B89047]/20 text-[#B89047]">
                            {isOwner ? 'Club Owner' : isAdmin ? 'System Admin' : isShopStaff ? 'Shop Staff' : isAccountant ? 'Accountant' : isBarStaff ? 'Bar & Cafe' : isManager ? 'Manager' : isFrontDesk ? 'Front Desk' : 'Member'}
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

      {/* ── User Profile & Station Credentials Modal ── */}
      {isProfileModalOpen && user &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
            data-lenis-prevent
            onClick={() => setIsProfileModalOpen(false)}
          >
            <div
              className={cn(
                'relative w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all',
                isNight
                  ? 'bg-[#121216] border-[#B89047]/40 text-white'
                  : 'bg-white border-black/10 text-[#1D1D1F]'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>

              {/* Profile Avatar Header */}
              <div className="flex flex-col items-center text-center pb-5 border-b border-black/5 dark:border-white/10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#EAD29A] via-[#B89047] to-[#7D5A1E] p-[2px] mb-3 shadow-lg shadow-[#B89047]/20">
                  <div className="w-full h-full rounded-full bg-[#121214] flex items-center justify-center text-xl font-bold text-[#EAD29A]">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl text-[#1D1D1F] dark:text-white">
                  {user.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                  {user.email}
                </p>
                <div className="mt-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#B89047]/15 text-[#B89047] border border-[#B89047]/30">
                    {isOwner ? '👑 Club Owner & Executive' :
                     isAdmin ? '⚙️ System Administrator' :
                     isManager ? '💼 General Manager' :
                     isAccountant ? '💰 Chartered Accountant' :
                     isShopStaff ? '🛍️ Pro Shop Specialist' :
                     isBarStaff ? '🍸 Bar & Hospitality' :
                     isFrontDesk ? '🛡️ Front Desk Concierge' :
                     '🎖️ Club Member'}
                  </span>
                </div>
              </div>

              {/* Identity & Session Metadata */}
              <div className="py-4 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                  <span className="text-gray-400">Account ID:</span>
                  <span className="font-mono font-semibold text-[#1D1D1F] dark:text-white">#{user.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                  <span className="text-gray-400">Assigned Station:</span>
                  <span className="font-semibold text-[#B89047]">{brandSubline}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                  <span className="text-gray-400">Session Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500">
                    Authenticated & Active
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 space-y-2.5">
                <Link
                  to={brandHomeRoute}
                  onClick={() => setIsProfileModalOpen(false)}
                  className="w-full h-11 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#B89047] via-[#D4AF37] to-[#A67C38] text-black shadow-md hover:brightness-105 flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <Briefcase size={14} />
                  <span>Launch My Assigned Console</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    logout();
                  }}
                  className="w-full h-11 rounded-xl text-xs font-semibold border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/15 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out / Exit Session</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Navbar;

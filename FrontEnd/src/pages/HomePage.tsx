import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { MembershipCard } from '../components/membership/MembershipCard';
import { CourtCard } from '../components/courts/CourtCard';
import { ROUTES } from '../constants/routes';
import { CLUB_INFO } from '../constants/club';
import { getCourts } from '../services/courtsService';
import { getPlans } from '../services/membershipService';
import { useLoginPrompt } from '../hooks/useLoginPrompt';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Court } from '../types/court.types';
import { MembershipPlan } from '../types/membership.types';
import {
  Trophy,
  ShoppingBag,
  Coffee,
  Users,
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Star,
  Sparkles,
  User,
  LogIn,
} from 'lucide-react';
import galleryData from '../data/gallery.json';
import { motion, Variants } from 'framer-motion';
import { ScrollExpand } from '../components/ui/ScrollExpand';
import { MaskedHeading } from '../components/ui/MaskedHeading';
import { MagneticButton } from '../components/ui/MagneticButton';
import { SpotlightCard } from '../components/ui/SpotlightCard';

const heroStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const heroFadeIn: Variants = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  }
};

export const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isFrontDesk } = useAuth();
  const { requireLogin } = useLoginPrompt();
  const [courts, setCourts] = useState<Court[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [stats, setStats] = useState({
    active_members: 35,
    total_courts: 9,
    total_bookings: 35,
  });
  const [gallery, setGallery] = useState(galleryData);

  // Automatically redirect staff to their operational workstation
  useEffect(() => {
    if (isAuthenticated && isFrontDesk) {
      navigate(ROUTES.RECEPTIONIST, { replace: true });
    }
  }, [isAuthenticated, isFrontDesk, navigate]);

  useEffect(() => {
    // Load the first 2 courts for the "Featured Courts" preview section
    getCourts().then(data => setCourts(data.slice(0, 2)));
    // Load all membership plans for the plan cards section
    getPlans().then(setPlans);
    // Load live club statistics from MySQL
    api.get('/public/stats').then(res => {
      if (res.data?.success && res.data.data) {
        setStats(res.data.data);
      }
    }).catch(err => console.warn('[HomePage] stats error:', err));
    // Load media gallery dynamically
    api.get('/public/gallery').then(res => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        setGallery(res.data.data);
      }
    }).catch(err => console.warn('[HomePage] gallery error:', err));
  }, []);

  // ── Feature cards — 4 main offerings of the club ──
  const features = [
    {
      icon: Trophy,
      title: 'Premium Courts',
      desc: 'World-class tennis, cricket, and multi-purpose courts with professional floodlights and equipment hire.',
      cta: 'View Courts',
      route: ROUTES.COURTS,
    },
    {
      icon: ShoppingBag,
      title: 'Pro Gear Shop',
      desc: 'Top brands — Wilson, Babolat, Nike, Adidas. Expert restringing and in-store or home delivery.',
      cta: 'Browse Shop',
      route: ROUTES.SHOP,
    },
    {
      icon: Coffee,
      title: 'Cafe & Bar',
      desc: 'Refuel with curated food, fresh juices, craft beer, and cocktails at The Clubhouse.',
      cta: 'See Menu',
      route: ROUTES.CAFE,
    },
    {
      icon: Star,
      title: 'Exclusive Memberships',
      desc: 'Gold, Silver, and Junior plans with priority booking, shop discounts, and tournament access.',
      cta: 'Explore Plans',
      route: ROUTES.MEMBERSHIPS,
    },
  ];

  // ── Opening hours table data ──
  const hours = [
    { day: 'Monday – Friday',  courts: '6:00 AM – 10:00 PM', shop: '9:00 AM – 8:00 PM',  cafe: '7:00 AM – 10:00 PM' },
    { day: 'Saturday',         courts: '6:00 AM – 11:00 PM', shop: '8:00 AM – 9:00 PM',  cafe: '7:00 AM – 11:00 PM' },
    { day: 'Sunday',           courts: '6:00 AM – 11:00 PM', shop: '9:00 AM – 7:00 PM',  cafe: '8:00 AM – 10:00 PM' },
    { day: 'Public Holidays',  courts: '8:00 AM – 9:00 PM',  shop: '10:00 AM – 6:00 PM', cafe: '9:00 AM – 9:00 PM'  },
  ];

  return (
    <PageLayout>

      {/* ══════════════════════════════════════════════════
          LUXURY HERO SECTION (Globetrotter + Apple Style)
          Smooth entrance animation, ambient floating orbs,
          and interactive MagneticButtons
      ══════════════════════════════════════════════════ */}
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 text-center overflow-hidden">

        <motion.div
          initial="hidden"
          animate="visible"
          variants={heroStagger}
          className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6"
        >
          {/* Eyebrow / Kicker */}
          <motion.div variants={heroFadeIn} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-white/80 shadow-sm backdrop-blur-md mb-6">
            <span className="w-2 h-2 rounded-full bg-[#B89047] animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#1D1D1F]">
              The Champions Club • Bengaluru
            </span>
          </motion.div>

          {/* Monolithic Apple-style Animated Headline */}
          <motion.h1
            variants={heroFadeIn}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-[#1D1D1F] leading-[1.05] mb-6"
          >
            Precision. Power. <br className="hidden sm:inline" />
            <span className="apple-gradient-text">Pure Athletics.</span>
          </motion.h1>

          {/* Refined Subhead */}
          <motion.p
            variants={heroFadeIn}
            className="text-lg sm:text-xl md:text-2xl text-[#86868B] font-normal max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Tournament-grade courts, a curated pro shop, and an elevated social lounge.
            Engineered without compromise for athletes who demand the best.
          </motion.p>

          {/* Dual Action Magnetic CTAs (Globetrotter style) */}
          <motion.div variants={heroFadeIn} className="flex flex-wrap items-center justify-center gap-5 mb-16">
            <MagneticButton
              onClick={() => navigate(ROUTES.COURTS)}
              className="group relative inline-flex items-center justify-center px-8 py-3.5 bg-[#121214] text-white rounded-full text-base font-semibold overflow-hidden shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-[#B89047]/40 hover:border-[#B89047]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#B89047] via-[#D4AF37] to-[#997332] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out rounded-full" />
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent ease-out" />
              <span className="relative z-10 flex items-center gap-2 group-hover:text-black transition-colors duration-300 font-display">
                <Sparkles size={16} className="text-[#EAD29A] group-hover:text-black transition-colors" />
                Explore Courts &amp; Book
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </MagneticButton>

            <MagneticButton
              onClick={() => navigate(ROUTES.MEMBERSHIPS)}
              className="group relative inline-flex items-center justify-center px-8 py-3.5 bg-white/80 dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-[#1D1D1F] dark:text-white backdrop-blur-md rounded-full text-base font-medium overflow-hidden shadow-md transition-all duration-300 hover:scale-105 active:scale-95 hover:border-[#B89047]/50"
            >
              <span className="relative z-10 font-display">
                View Membership Tiers
              </span>
            </MagneticButton>

            <MagneticButton
              onClick={() => {
                if ((window as any).openTrialModal) (window as any).openTrialModal();
                else window.dispatchEvent(new CustomEvent('open_trial_modal'));
              }}
              className="group relative inline-flex items-center justify-center px-7 py-3.5 bg-gradient-to-r from-amber-500/15 via-[#B89047]/20 to-amber-500/15 border border-[#B89047]/45 text-[#1D1D1F] dark:text-[#EAD29A] backdrop-blur-md rounded-full text-base font-semibold overflow-hidden shadow-md transition-all duration-300 hover:scale-105 active:scale-95 hover:border-[#B89047]"
            >
              <span className="relative z-10 font-display flex items-center gap-1.5">
                <Sparkles size={15} className="text-[#B89047]" />
                Book Free Trial
              </span>
            </MagneticButton>
          </motion.div>

          {/* Quick Sign In Prompt when not authenticated */}
          {!isAuthenticated ? (
            <motion.div
              variants={heroFadeIn}
              className="mb-14 flex flex-wrap items-center justify-center gap-2 text-sm text-[#86868B] dark:text-gray-400"
            >
              <span>Already a club member?</span>
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-1.5 font-semibold text-[#B89047] dark:text-[#EAD29A] hover:underline cursor-pointer group px-3 py-1 rounded-full hover:bg-[#B89047]/10 transition-colors"
              >
                <LogIn size={15} className="text-[#B89047]" />
                <span>Sign In to your account</span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          ) : (
            <motion.div
              variants={heroFadeIn}
              className="mb-14 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-400"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Welcome back, <strong className="font-semibold text-emerald-700 dark:text-emerald-300">{user?.name}</strong> • Active Member Access</span>
            </motion.div>
          )}

          {/* Cinematic Centerpiece Showcase (Apple style rounded container) */}
          <motion.div
            variants={heroFadeIn}
            className="relative mx-auto max-w-5xl rounded-[32px] md:rounded-[40px] overflow-hidden border border-white/80 shadow-[0_24px_60px_-15px_rgba(10,25,47,0.18)]"
          >
            <img
              src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2000&auto=format&fit=crop"
              alt="The Champions Club Center Court"
              className="w-full h-[360px] sm:h-[480px] md:h-[600px] object-cover"
            />
            {/* Luxury frosted glass caption overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 sm:p-10 md:p-12">
              <div className="text-left max-w-lg backdrop-blur-md bg-black/45 border border-white/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#B89047] animate-pulse" />
                  <span className="text-xs uppercase tracking-widest text-[#EAD29A] font-semibold">
                    Center Court • Championship Clay
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight leading-snug">
                  Tour-grade European red clay with natural slide &amp; championship lighting.
                </h3>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          SCROLL TO EXPAND SECTION (Globetrotter style)
      ══════════════════════════════════════════════════ */}
      <section className="w-full relative z-20 my-16 max-w-7xl mx-auto px-4 sm:px-6">
        <ScrollExpand
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop"
          alt="Center Arena"
          title="Step Into The Arena"
          scrollHint="Scroll down to expand"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">World-Class Surfaces</h2>
          <p className="text-lg md:text-xl text-white/80 max-w-lg mx-auto">Engineered to international tour specs. Play day or night under championship floodlights.</p>
        </ScrollExpand>
      </section>

      {/* ══════════════════════════════════════════════════
          APPLE HIGHLIGHT METRICS STRIP
          Clean, authoritative stat callouts on Apple gray
      ══════════════════════════════════════════════════ */}
      <section className="py-12 bg-[#F5F5F7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            <div className="space-y-1">
              <div className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F]">{stats.total_courts}</div>
              <div className="text-xs sm:text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider">Championship Courts</div>
              <div className="text-xs text-[#86868B]">Synthetic grass, hard court &amp; indoor</div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F]">100%</div>
              <div className="text-xs sm:text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider">Tour Standards</div>
              <div className="text-xs text-[#86868B]">Championship lighting &amp; certified surfaces</div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F]">7 Days</div>
              <div className="text-xs sm:text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider">Live Slot Access</div>
              <div className="text-xs text-[#86868B]">Instant booking with zero phone calls</div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F]">{stats.active_members}+</div>
              <div className="text-xs sm:text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider">Active Members</div>
              <div className="text-xs text-[#86868B]">Bengaluru's premier sporting community</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          MASKED HEADING (IMAGE BEHIND TEXT EFFECT - Globetrotter style)
      ══════════════════════════════════════════════════ */}
      <section className="relative z-10 w-full py-20 flex flex-col items-center justify-center gap-16 bg-white overflow-hidden">
        <div className="w-full max-w-5xl px-4">
          <MaskedHeading 
            text="WHERE CHAMPIONS PLAY" 
            src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=2000&auto=format&fit=crop" 
            weight={800}
            tracking={-0.04}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          LUXURY BENTO GRID — WHAT WE OFFER
          Frosted glassmorphic cards with subtle ambient glow
      ══════════════════════════════════════════════════ */}
      <section className="py-24 bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeader
            title="Engineered for every dimension of your game."
            subtitle="Four specialized facilities integrated into one seamless club experience."
            centered
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">

            {/* Bento Card 1: Large Featured Card (2 columns) */}
            <SpotlightCard
              onClick={() => navigate(ROUTES.COURTS)}
              className="md:col-span-2 p-7 sm:p-10 cursor-pointer group"
              enableTilt={true}
              tiltIntensity={2}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center h-full">
                {/* Text Column */}
                <div className="md:col-span-7 flex flex-col justify-between h-full z-10 space-y-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-[#B89047] tracking-[0.2em] font-display block mb-2">
                      Courts &amp; Arenas
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#1D1D1F] dark:text-white tracking-tight group-hover:text-[#B89047] transition-colors leading-tight">
                      Match-ready surfaces. Engineered for zero compromises.
                    </h3>
                    <p className="text-sm sm:text-base text-[#71717A] dark:text-[#A1A1A6] leading-relaxed mt-3 font-normal">
                      Experience true ball bounce and optimal joint protection on synthetic grass, tournament hard courts, and pro cricket nets.
                    </p>
                  </div>
                  <div className="pt-2">
                    <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B89047] group-hover:gap-2.5 transition-all">
                      Book a court slot <ChevronRight size={16} />
                    </div>
                  </div>
                </div>

                {/* Photo Column — Clean responsive container, ZERO text overlap */}
                <div className="md:col-span-5 h-56 sm:h-64 md:h-72 w-full rounded-2xl overflow-hidden shadow-xl border border-black/[0.08] dark:border-white/10 relative">
                  <img
                    src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=600&auto=format&fit=crop"
                    alt="Center Court"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase text-white/90 border border-white/20">
                    Center Court Spec
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Bento Card 2: Pro Gear Shop */}
            <SpotlightCard
              onClick={() => navigate(ROUTES.SHOP)}
              className="p-8 flex flex-col justify-between cursor-pointer min-h-[380px] group"
              enableTilt={true}
              tiltIntensity={2.5}
            >
              <div className="z-10">
                <span className="text-xs uppercase font-bold text-[#B89047] tracking-[0.2em] font-display">Pro Shop</span>
                <h3 className="text-2xl font-display font-bold text-[#1D1D1F] dark:text-white tracking-tight mt-2 mb-3 group-hover:text-[#B89047] transition-colors">
                  Wilson, Babolat, Nike.
                </h3>
                <p className="text-sm text-[#71717A] dark:text-[#A1A1A6] leading-relaxed font-normal">
                  Tour-grade rackets, fresh balls, shoes, and expert electronic restringing while you wait.
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between z-10 pt-4 border-t border-black/[0.05] dark:border-white/[0.06]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white">In-Store &amp; Pickup</span>
                <div className="w-10 h-10 rounded-full bg-[#121214] text-white flex items-center justify-center border border-[#B89047]/40 group-hover:bg-[#B89047] group-hover:text-black transition-all group-hover:scale-110 shadow-sm">
                  <ChevronRight size={18} />
                </div>
              </div>
            </SpotlightCard>

            {/* Bento Card 3: Cafe & Bar */}
            <SpotlightCard
              onClick={() => navigate(ROUTES.CAFE)}
              className="p-8 flex flex-col justify-between cursor-pointer min-h-[320px] group"
              enableTilt={true}
              tiltIntensity={2.5}
            >
              <div className="z-10">
                <span className="text-xs uppercase font-bold text-[#B89047] tracking-[0.2em] font-display">Social Lounge</span>
                <h3 className="text-2xl font-display font-bold text-[#1D1D1F] dark:text-white tracking-tight mt-2 mb-3 group-hover:text-[#B89047] transition-colors">
                  The Clubhouse Cafe &amp; Bar
                </h3>
                <p className="text-sm text-[#71717A] dark:text-[#A1A1A6] leading-relaxed font-normal">
                  Post-match recovery bowls, protein shakes, specialty single-origin coffees, and evening craft drinks.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between z-10 pt-4 border-t border-black/[0.05] dark:border-white/[0.06]">
                <span className="text-xs font-semibold text-[#86868B]">Open daily from 7:00 AM</span>
                <div className="w-10 h-10 rounded-full bg-[#121214] text-white flex items-center justify-center border border-[#B89047]/40 group-hover:bg-[#B89047] group-hover:text-black transition-all group-hover:scale-110 shadow-sm">
                  <ChevronRight size={18} />
                </div>
              </div>
            </SpotlightCard>

            {/* Bento Card 4: Exclusive Memberships (2 columns) */}
            <SpotlightCard
              onClick={() => navigate(ROUTES.MEMBERSHIPS)}
              className="md:col-span-2 p-7 sm:p-10 cursor-pointer group bg-gradient-to-br from-[#121214] via-[#1A1A22] to-[#121214] text-white border-[#B89047]/45 shadow-2xl hover:border-[#B89047] transition-all"
              enableTilt={true}
              tiltIntensity={2}
              spotlightColor="rgba(184, 144, 71, 0.22)"
              borderGlowColor="rgba(234, 210, 154, 0.6)"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 h-full">
                <div className="max-w-xl z-10 space-y-3">
                  <span className="text-xs uppercase font-bold text-[#B89047] tracking-[0.2em] font-display block">
                    Exclusive Access
                  </span>
                  <h3 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-white group-hover:text-[#EAD29A] transition-colors leading-tight">
                    Elevate your status. Gold, Silver, and Junior.
                  </h3>
                  <p className="text-sm md:text-base text-gray-300 leading-relaxed font-normal">
                    Priority 7-day court booking windows, pro shop discounts, locker access, and invitations to private club tournaments.
                  </p>
                  <div className="pt-2">
                    <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#EAD29A] group-hover:gap-2.5 transition-all">
                      Compare all membership plans <ChevronRight size={16} />
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 text-left md:text-right pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
                  <div className="text-3xl sm:text-4xl font-bold font-display text-[#EAD29A]">
                    From ₹2,499<span className="text-sm font-normal text-gray-400">/mo</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 font-mono">Cancel or upgrade anytime</div>
                </div>
              </div>
            </SpotlightCard>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 4 — FEATURED COURTS
          2-column preview of the first 2 courts
      ══════════════════════════════════════════════════ */}
      <section className="py-24 bg-bg-subtle">
        <div className="container mx-auto px-4 md:px-6">
          {/* Section header + "View All" button in same row */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <SectionHeader
              title="Our Courts"
              subtitle="Book a slot in seconds. Members get priority access and exclusive rates."
            />
            <Button variant="outline" onClick={() => navigate(ROUTES.COURTS)}>
              View All Courts
            </Button>
          </div>
          {/* Featured court cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {courts?.map(court => (
              <CourtCard
                key={court.id}
                court={court}
                onBook={() => navigate(ROUTES.COURTS)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 5 — MEMBERSHIP PLANS
          Side-by-side plan cards (Gold highlighted)
      ══════════════════════════════════════════════════ */}
      <section className="py-24 bg-bg-primary">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            title="Membership Plans"
            subtitle="Join our community. Your plan, your pace — upgrade or downgrade anytime."
            centered
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-14 items-start">
            {plans?.map((plan, index) => (
              <MembershipCard
                index={index}
                key={plan.id}
                plan={plan}
                onJoin={() => navigate(ROUTES.MEMBERSHIPS)}
              />
            ))}
          </div>
          {/* "Compare all benefits" ghost link */}
          <div className="text-center mt-10">
            <Button variant="ghost" onClick={() => navigate(ROUTES.MEMBERSHIPS)}>
              Compare all benefits →
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 6 — PHOTO GALLERY
          6-image grid — first image is large (spans 2 cols/rows)
      ══════════════════════════════════════════════════ */}
      <section className="py-24 bg-bg-subtle">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader title="Life at The Club" subtitle="A peek inside our world." centered />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12 max-w-5xl mx-auto">
            {gallery?.map((item, i) => (
              <div
                key={item.id}
                className={`relative overflow-hidden rounded-xl group cursor-pointer ${
                  i === 0 ? 'md:col-span-2 row-span-2' : ''
                }`}
              >
                <img
                  src={item.url}
                  alt={item.alt}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ height: i === 0 ? '340px' : '160px' }}
                />
                {/* Caption overlay on hover */}
                <div className="absolute inset-0 bg-navy-primary/0 group-hover:bg-navy-primary/40 transition-colors flex items-end">
                  <span className="text-cream text-sm font-medium px-3 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.caption}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          MEMBER PRIVILEGES & SIGN IN CALLOUT
          Prominently displayed on Homepage if user is not signed in
      ══════════════════════════════════════════════════ */}
      {!isAuthenticated && (
        <section className="py-14 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto rounded-3xl p-8 sm:p-12 relative overflow-hidden bg-gradient-to-br from-[#121216] via-[#1A1A22] to-[#0D0D11] border border-[#B89047]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white">
            {/* Ambient Gold Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#B89047]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 text-center lg:text-left max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B89047]/15 border border-[#B89047]/30 text-[11px] font-semibold tracking-wider text-[#EAD29A] uppercase">
                  <Sparkles size={12} className="text-[#EAD29A]" />
                  <span>Member Access &amp; Privileges</span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                  Already a Member? <br className="hidden sm:inline" />
                  <span className="text-[#EAD29A]">Sign In</span> for Instant Court Booking &amp; Perks
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Log in to reserve tour-grade courts, view your membership status, enjoy pro-shop perks, and participate in club tournaments.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full lg:w-auto flex-shrink-0">
                <Button
                  size="lg"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="w-full sm:w-auto h-12 px-7 text-sm font-semibold rounded-full bg-gradient-to-r from-[#B89047] via-[#D4AF37] to-[#A67C38] text-black shadow-lg hover:brightness-105 active:scale-95 transition-transform"
                >
                  <LogIn size={16} className="mr-2" />
                  Sign In to Account
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(ROUTES.REGISTER)}
                  className="w-full sm:w-auto h-12 px-7 text-sm font-semibold rounded-full text-white border-white/20 hover:border-[#B89047] hover:bg-white/10 active:scale-95 transition-all"
                >
                  Apply for Membership
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          SECTION 7 — OPENING HOURS TABLE
      ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-bg-primary">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <SectionHeader title="Opening Hours" subtitle="We're open 365 days a year." centered />
          <div className="mt-10 overflow-x-auto rounded-xl border border-border shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-navy-primary text-cream">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold font-display">Day</th>
                  <th className="text-left px-6 py-4 font-semibold">Courts</th>
                  <th className="text-left px-6 py-4 font-semibold">Pro Shop</th>
                  <th className="text-left px-6 py-4 font-semibold">Cafe &amp; Bar</th>
                </tr>
              </thead>
              <tbody>
                {hours?.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-t border-border ${i % 2 === 0 ? 'bg-bg-surface' : 'bg-bg-subtle'}`}
                  >
                    <td className="px-6 py-4 font-semibold text-navy-primary">{row.day}</td>
                    <td className="px-6 py-4 text-text-secondary">{row.courts}</td>
                    <td className="px-6 py-4 text-text-secondary">{row.shop}</td>
                    <td className="px-6 py-4 text-text-secondary">{row.cafe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 8 — FIND US
          Address + map embed side-by-side
      ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-bg-subtle">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto bg-bg-surface rounded-2xl border border-border shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
            {/* Contact info column */}
            <div className="p-10 space-y-6">
              <SectionHeader title="Find Us" subtitle="Come visit — we'd love to show you around." />
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gold-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-text-secondary">{CLUB_INFO.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gold-primary flex-shrink-0" />
                  <span className="text-sm text-text-secondary">{CLUB_INFO.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gold-primary flex-shrink-0" />
                  <span className="text-sm text-text-secondary">{CLUB_INFO.email}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-gold-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-text-secondary">{CLUB_INFO.hours}</span>
                </div>
              </div>
              <Button onClick={() => navigate(ROUTES.CONTACT)} variant="outline">
                Send an Enquiry
              </Button>
            </div>

            {/* Embedded Google Map */}
            <div className="bg-bg-subtle min-h-[240px]">
              <iframe
                src="https://maps.google.com/maps?q=Koramangala+Bengaluru&t=&z=14&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '240px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="The Champions Club location map"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 9 — FINAL CTA BANNER
          Navy background — prompts sign-up
      ══════════════════════════════════════════════════ */}
      <section className="py-24 bg-navy-primary text-center px-4">
        <div className="container mx-auto max-w-2xl">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gold-primary mb-4">
            Ready to Play?
          </h2>
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">
            Join hundreds of members who have made The Champions Club their second home. Create your
            account and book your first slot today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!isAuthenticated ? (
              <>
                <Button
                  size="lg"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="bg-gold-primary text-black font-semibold hover:bg-gold-light shadow-md"
                >
                  <LogIn size={18} className="mr-2" />
                  Sign In to Play
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-cream border-cream/30 hover:border-cream/60 hover:bg-cream/5"
                  onClick={() => navigate(ROUTES.REGISTER)}
                >
                  Apply for Membership
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-gray-300 hover:text-white"
                  onClick={() => navigate(ROUTES.COURTS)}
                >
                  Browse Courts
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate(ROUTES.COURTS)}>
                  Reserve a Court Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-cream border-cream/30 hover:border-cream/60 hover:bg-cream/5"
                  onClick={() => navigate(ROUTES.MEMBERSHIPS)}
                >
                  View Membership Tiers
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

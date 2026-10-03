import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import galleryData from '../data/gallery.json';

export const HomePage = () => {
  const navigate = useNavigate();
  const { requireLogin } = useLoginPrompt();
  const [courts, setCourts] = useState<Court[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  useEffect(() => {
    // Load the first 2 courts for the "Featured Courts" preview section
    getCourts().then(data => setCourts(data.slice(0, 2)));
    // Load all membership plans for the plan cards section
    getPlans().then(setPlans);
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
          SECTION 1 — HERO BANNER
          Full-width luxury light hero with court background,
          cream gradient overlay, club name in Playfair Display,
          and two CTA buttons
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1587280501635-a19f7eb0a4e4?q=80&w=2000&auto=format&fit=crop"
            alt="Premium tennis court at The Champions Club"
            className="w-full h-full object-cover transform scale-105"
          />
          {/* Luxury clean white gradient overlay — left heavy so text is readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/90 to-transparent" />
          {/* Soft gradient fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-bg-primary to-transparent" />
        </div>

        {/* Hero text content */}
        <div className="container mx-auto px-4 md:px-6 relative z-10 py-32">
          <div className="max-w-2xl animate-fade-in-up">
            {/* Premium badge pill */}
            <div className="inline-flex items-center gap-2 bg-gold-primary/10 border border-gold-primary/20 text-gold-dark rounded-full px-5 py-2 text-sm font-semibold tracking-wide uppercase mb-8">
              <Trophy size={14} className="text-gold-primary" />
              <span>Bengaluru's Premier Sports Club</span>
            </div>

            {/* Main headline — Playfair Display, large */}
            <h1 className="font-display text-6xl md:text-8xl font-bold text-navy-primary leading-[1.1] mb-8 tracking-tight">
              Where <br/>
              <span className="text-gold-primary italic font-light">Champions</span>
              <br />Are Made.
            </h1>

            {/* Sub-headline */}
            <p className="text-xl md:text-2xl text-text-secondary font-light leading-relaxed max-w-xl mb-12">
              Book premium courts, browse the pro shop, and enjoy The Clubhouse — all in one place.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-5">
              <Button size="lg" onClick={() => navigate(ROUTES.COURTS)}>
                View Courts &amp; Book
                <ChevronRight size={20} className="ml-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate(ROUTES.MEMBERSHIPS)}>
                Explore Memberships
              </Button>
            </div>

            {/* Trust indicators row */}
            <div className="flex flex-wrap gap-8 mt-14 text-sm text-text-secondary uppercase tracking-widest font-semibold">
              <span className="flex items-center gap-2">
                <Trophy size={16} className="text-gold-primary" /> 4 Premium Courts
              </span>
              <span className="flex items-center gap-2">
                <Users size={16} className="text-gold-primary" /> 500+ Members
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 2 — STATS STRIP
          Gold background bar with key club facts
      ══════════════════════════════════════════════════ */}
      <section className="bg-gold-primary">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-center font-display font-bold text-navy-primary tracking-wide">
            <span>🏟 4 Premium Courts</span>
            <span className="hidden md:inline text-gold-dark">•</span>
            <span>🛍 Pro Gear Shop</span>
            <span className="hidden md:inline text-gold-dark">•</span>
            <span>☕ Cafe &amp; Bar</span>
            <span className="hidden md:inline text-gold-dark">•</span>
            <span>🏆 3 Membership Tiers</span>
            <span className="hidden md:inline text-gold-dark">•</span>
            <span>⚡ Instant Online Booking</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 3 — WHAT WE OFFER
          4 clickable feature cards
      ══════════════════════════════════════════════════ */}
      <section className="py-24 bg-bg-primary">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            title="Everything You Need in One Place"
            subtitle="Designed for athletes and enthusiasts who refuse to compromise — on quality or convenience."
            centered
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="bg-bg-surface border border-border rounded-2xl p-7 group hover:-translate-y-2 hover:shadow-lg hover:border-gold-light transition-all cursor-pointer"
                  onClick={() => navigate(feature.route)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(feature.route)}
                >
                  {/* Icon container */}
                  <div className="w-14 h-14 bg-bg-subtle rounded-xl flex items-center justify-center mb-5 group-hover:bg-gold-primary/10 transition-colors">
                    <Icon className="w-7 h-7 text-gold-primary" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-navy-primary mb-2.5">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-5">{feature.desc}</p>
                  {/* Arrow link */}
                  <div className="flex items-center gap-1 text-gold-primary text-sm font-semibold group-hover:gap-2 transition-all">
                    {feature.cta} <ChevronRight size={16} />
                  </div>
                </div>
              );
            })}
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
            {courts.map(court => (
              <CourtCard
                key={court.id}
                court={court}
                onBook={() => requireLogin('book this court slot')}
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
            {plans.map(plan => (
              <MembershipCard
                key={plan.id}
                plan={plan}
                onJoin={() => requireLogin('choose a membership plan')}
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
            {galleryData.map((item, i) => (
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
                {hours.map((row, i) => (
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate(ROUTES.REGISTER)}>
              Create an Account
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-cream border-cream/30 hover:border-cream/60 hover:bg-cream/5"
              onClick={() => navigate(ROUTES.COURTS)}
            >
              Browse Courts First
            </Button>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

import React from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Trophy, Target, Heart, Users, Award, Zap } from 'lucide-react';
import galleryData from '../data/gallery.json';
import { ScrollExpand } from '../components/ui/ScrollExpand';
import { MaskedHeading } from '../components/ui/MaskedHeading';
import { SpotlightCard } from '../components/ui/SpotlightCard';

export const AboutPage = () => {
  // Club facilities list
  const facilities = [
    {
      icon: Trophy,
      title: '4 Premium Courts',
      desc: 'Two tennis courts (synthetic grass + hard court), professional cricket nets, and a multi-purpose indoor court.',
    },
    {
      icon: Target,
      title: 'Pro Gear Shop',
      desc: 'On-site shop stocking top brands. Expert racket restringing while you play. Click & collect available.',
    },
    {
      icon: Heart,
      title: 'Clubhouse Cafe & Bar',
      desc: 'Post-match food and drinks, crafted carefully. Fresh juices, protein shakes, cocktails, and craft beer.',
    },
    {
      icon: Users,
      title: 'Vibrant Community',
      desc: 'Regular social events, inter-club tournaments, junior coaching clinics, and annual championship series.',
    },
    {
      icon: Award,
      title: 'Coaching Programs',
      desc: 'Structured coaching for all levels — beginners, intermediate, and competitive — led by certified coaches.',
    },
    {
      icon: Zap,
      title: 'Smart Booking',
      desc: 'Real-time court availability, instant confirmation, and automated reminders. No more WhatsApp chaos.',
    },
  ];

  // Team members (placeholder)
  const team = [
    { name: 'Arjun Mehta', role: 'Founder & Director', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' },
    { name: 'Priya Sharma', role: 'Head of Operations', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop' },
    { name: 'Rohan Das', role: 'Head Tennis Coach', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop' },
    { name: 'Meera Nair', role: 'Cafe & Bar Manager', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop' },
  ];

  return (
    <PageLayout>

      {/* ── Apple-Grade Editorial Hero ── */}
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className="text-xs uppercase tracking-widest text-[#86868B] font-semibold mb-3 block">
            Our Mission &amp; Heritage
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-[#1D1D1F] leading-[1.08] mb-6">
            A sanctuary built for <br className="hidden sm:inline" />
            <span className="apple-gradient-text">athletic excellence.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#86868B] max-w-2xl mx-auto leading-relaxed">
            Founded in 2018, The Champions Club was conceived with a clear vision:
            to give players access to tour-grade sporting facilities, world-class equipment,
            and an authentic community — without the pretensions of old-world country clubs.
          </p>
        </div>
      </section>

      {/* ── Club Story Split ── */}
      <section className="py-16 md:py-24 bg-[#F5F5F7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Story text */}
            <div className="space-y-6 text-[#1D1D1F] leading-relaxed text-base md:text-lg">
              <span className="text-xs uppercase font-semibold text-[#86868B] tracking-wider">The Origin</span>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
                Closing the gap between amateur play and tour standards.
              </h2>
              <p className="text-[#86868B] text-base leading-relaxed">
                We observed a glaring divide: dedicated athletes were forced to choose between exorbitantly priced heritage clubs with multi-year waiting lists, or neglected public courts lacking basic lighting, coaching, and amenities.
              </p>
              <p className="text-[#86868B] text-base leading-relaxed">
                The Champions Club was engineered to be the definitive alternative. Today, our Koramangala facility proudly welcomes over 500 active members — ranging from junior competitors to ranked circuit players.
              </p>
            </div>

            {/* Feature Image Frame */}
            <div className="rounded-[32px] overflow-hidden border border-black/[0.08] shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1000&auto=format&fit=crop"
                alt="The Champions Club facility"
                className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Apple-Style Stat Highlights ── */}
      <section className="py-16 bg-white border-y border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            {[
              { number: '500+',  label: 'Active Members',         desc: 'Elite sporting community' },
              { number: '4',     label: 'Championship Courts',   desc: 'Synthetic grass, hard & indoor' },
              { number: '8 Yrs', label: 'Consistent Excellence',  desc: 'Established Bengaluru 2018' },
              { number: '1,200+',label: 'Monthly Matches',        desc: 'Played under pro floodlights' },
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F]">{stat.number}</div>
                <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#1D1D1F]">{stat.label}</div>
                <div className="text-xs text-[#86868B]">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ScrollExpand Section (Globetrotter style) ── */}
      <section className="w-full relative z-20 my-16 max-w-7xl mx-auto px-4 sm:px-6">
        <ScrollExpand
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop"
          alt="The Arena Sanctuary"
          title="The Sanctuary"
          scrollHint="Scroll down to expand"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">Built Without Compromise</h2>
          <p className="text-lg md:text-xl text-white/80 max-w-lg mx-auto">From sub-base drainage to electronic restringing, every detail is engineered for perfection.</p>
        </ScrollExpand>
      </section>

      {/* ── MaskedHeading Section (Image behind text effect) ── */}
      <section className="py-20 w-full flex flex-col items-center justify-center bg-white overflow-hidden">
        <div className="w-full max-w-5xl px-4">
          <MaskedHeading 
            text="DISCIPLINE CREATES MASTERY" 
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2000&auto=format&fit=crop"
            trigger="view"
            weight={800}
            tracking={-0.04}
          />
        </div>
      </section>

      {/* ── Facilities Bento Grid ── */}
      <section className="py-24 bg-[#F5F5F7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeader
            title="Every facility, elevated."
            subtitle="Designed for precision training, match play, and recovery."
            centered
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {facilities.map((fac, i) => {
              const Icon = fac.icon;
              return (
                <SpotlightCard
                  key={i}
                  className="p-8 group cursor-pointer"
                  enableTilt={true}
                  tiltIntensity={2.5}
                >
                  <div className="w-12 h-12 bg-[#FAF8F5] dark:bg-white/[0.06] rounded-2xl flex items-center justify-center mb-6 border border-black/[0.06] dark:border-white/10 group-hover:scale-105 transition-transform">
                    <Icon size={22} className="text-[#B89047]" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-[#1D1D1F] dark:text-white tracking-tight mb-2 group-hover:text-[#B89047] transition-colors">{fac.title}</h3>
                  <p className="text-sm text-[#71717A] dark:text-[#A1A1A6] leading-relaxed font-normal">{fac.desc}</p>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Photo gallery ── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeader
            title="Life inside The Club."
            subtitle="Explore our facilities, morning sessions, and evening matches."
            centered
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
            {galleryData.map(item => (
              <div key={item.id} className="overflow-hidden rounded-[28px] border border-black/[0.06] shadow-sm group">
                <img
                  src={item.url}
                  alt={item.alt}
                  className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Meet the team ── */}
      <section className="py-24 bg-[#F5F5F7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeader
            title="Leadership &amp; Coaching"
            subtitle="The directors, trainers, and hospitality leads dedicated to your experience."
            centered
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto mt-12">
            {team.map((member, i) => (
              <SpotlightCard
                key={i}
                className="text-center p-6 group cursor-pointer"
                enableTilt={true}
                tiltIntensity={3}
              >
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-[#B89047]/30 shadow-md group-hover:scale-105 group-hover:border-[#B89047] transition-all">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-display font-bold text-[#1D1D1F] dark:text-white text-base tracking-tight group-hover:text-[#B89047] transition-colors">{member.name}</h4>
                <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] mt-1 font-medium">{member.role}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

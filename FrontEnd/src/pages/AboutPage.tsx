import React from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Trophy, Target, Heart, Users, Award, Zap } from 'lucide-react';
import galleryData from '../data/gallery.json';

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

      {/* ── Hero ── */}
      <div className="bg-navy-primary text-cream py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gold-primary mb-4">
            Our Story
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Founded in 2018, The Champions Club was built on a simple belief: premium sports facilities should be accessible to the community — not just a lucky few.
          </p>
        </div>
      </div>

      {/* ── Club story ── */}
      <div className="py-20 bg-bg-primary">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Story text */}
            <div className="space-y-5 text-text-secondary leading-relaxed">
              <p>
                We noticed a gap in the market: serious players had to choose between impossibly expensive country clubs or under-maintained public courts with zero amenities. The Champions Club was built to bridge that gap.
              </p>
              <p>
                Today, we're proud to host over 500 active members across our three tiers — Gold, Silver, and Junior — ranging from weekend social players to ranked competitive athletes.
              </p>
              <p>
                Our flagship facility in Koramangala features world-class courts, a fully stocked pro shop, and The Clubhouse Cafe & Bar — which has become a social hub for the local sporting community.
              </p>
              <p>
                We believe sport builds character, community, and confidence. Everything we do — from our coaching programs to our bar menu — is designed to make The Champions Club your second home.
              </p>
            </div>
            {/* Feature image */}
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=700&auto=format&fit=crop"
                alt="The Champions Club main court"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="py-16 bg-gold-primary">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-navy-primary">
            {[
              { number: '500+', label: 'Active Members' },
              { number: '4',    label: 'Premium Courts' },
              { number: '8',    label: 'Years Running'  },
              { number: '1000+', label: 'Matches Played Monthly' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="font-display text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-sm font-semibold opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Facilities grid ── */}
      <div className="py-24 bg-bg-primary">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader title="Our Facilities" subtitle="Everything you need, under one roof." centered />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {facilities.map((fac, i) => {
              const Icon = fac.icon;
              return (
                <div key={i} className="bg-bg-surface border border-border rounded-2xl p-7 hover:shadow-md hover:border-gold-light transition-all">
                  <div className="w-12 h-12 bg-bg-subtle rounded-xl flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-gold-primary" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-navy-primary mb-2">{fac.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{fac.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Photo gallery ── */}
      <div className="py-20 bg-bg-subtle">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader title="Gallery" centered />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10 max-w-5xl mx-auto">
            {galleryData.map(item => (
              <div key={item.id} className="overflow-hidden rounded-xl group">
                <img
                  src={item.url}
                  alt={item.alt}
                  className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Meet the team ── */}
      <div className="py-20 bg-bg-primary">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader title="Meet the Team" centered />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-12">
            {team.map((member, i) => (
              <div key={i} className="text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-gold-light/40">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-display font-bold text-navy-primary text-sm">{member.name}</h4>
                <p className="text-xs text-text-secondary mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </PageLayout>
  );
};

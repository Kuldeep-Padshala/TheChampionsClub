import React, { useEffect, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { SectionHeader } from '../components/ui/SectionHeader';
import { MembershipCard } from '../components/membership/MembershipCard';
import { getPlans } from '../services/membershipService';
import { MembershipPlan } from '../types/membership.types';
import { useLoginPrompt } from '../hooks/useLoginPrompt';
import { Check, X } from 'lucide-react';

export const MembershipsPage = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const { requireLogin } = useLoginPrompt();

  useEffect(() => {
    getPlans().then(setPlans);
  }, []);

  // Comparison table rows — feature name + value per plan
  const comparisonRows = [
    { feature: 'Monthly Price', junior: '₹1,500', silver: '₹2,500', gold: '₹5,000' },
    { feature: 'Annual Price', junior: '₹16,000', silver: '₹27,000', gold: '₹54,000' },
    { feature: 'Court Rate / Hour', junior: '₹250 (off-peak)', silver: '₹350', gold: 'Free' },
    { feature: 'Advance Booking', junior: '3 days', silver: '7 days', gold: '14 days' },
    { feature: 'Gear Shop Discount', junior: '10%', silver: '10%', gold: '20%' },
    { feature: 'Cafe & Bar Discount', junior: '—', silver: '10%', gold: '15%' },
    { feature: 'Guest Passes / Month', junior: '1', silver: '2', gold: '4' },
    { feature: 'Equipment Hire', junior: false, silver: false, gold: true },
    { feature: 'Locker Room Access', junior: false, silver: true, gold: true },
    { feature: 'Coaching Clinics', junior: true, silver: false, gold: false },
    { feature: 'Member Events', junior: false, silver: true, gold: true },
    { feature: 'Monthly Tab at Bar', junior: false, silver: false, gold: true },
  ];

  // FAQ items
  const faqs = [
    {
      q: 'Can I upgrade or downgrade my plan later?',
      a: 'Yes, you can change your plan at the end of your current billing cycle (monthly or annually). Contact the front desk to arrange changes with no penalty.',
    },
    {
      q: 'How do guest passes work?',
      a: 'Each month your account is credited with the number of guest passes in your plan. Bring a non-member to play on your booked court at no extra charge. Unused passes do not roll over to the next month.',
    },
    {
      q: 'Are there initiation fees or hidden charges?',
      a: 'No. We believe in transparent pricing. The price you see is exactly what you pay — no joining fee, no annual admin charge.',
    },
    {
      q: 'Can juniors use the bar?',
      a: 'Junior members (under 18) have access to the cafe for food and non-alcoholic beverages. The bar area requires a Silver or Gold membership and valid age proof.',
    },
    {
      q: 'What happens if my membership lapses?',
      a: 'You will receive reminder emails 7 and 3 days before your membership expires. After lapse, you can still visit as a walk-in at standard rates, and renew anytime from your account.',
    },
  ];

  return (
    <PageLayout>

      {/* ── Hero ── */}
      <div className="bg-navy-primary text-cream pt-36 pb-20 md:pt-44 md:pb-28">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gold-primary mb-4">
            Membership Plans
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Join our community. Whether you're a casual weekend player or a daily regular,
            we have a plan designed perfectly for your lifestyle.
          </p>
        </div>
      </div>

      {/* ── Plan cards ── */}
      {/* Negative top margin pulls the cards up into the hero for a premium overlap effect */}
      <div className="container mx-auto px-4 md:px-6 relative z-20 -mt-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
          {plans.map((plan, index) => (
            <MembershipCard
              index={index}
              key={plan.id}
              plan={plan}
              onJoin={() => requireLogin('choose a membership plan')}
            />
          ))}
        </div>
      </div>

      {/* ── Full comparison table ── */}
      <div className="py-20 bg-bg-subtle">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <SectionHeader
            title="Compare All Benefits"
            subtitle="A full breakdown of what each plan includes."
            centered
          />
          <div className="mt-10 overflow-x-auto rounded-xl border border-border shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-navy-primary text-cream">
                <tr>
                  <th className="text-left px-6 py-4 font-display font-semibold">Feature</th>
                  <th className="text-center px-6 py-4 font-display font-semibold">Junior</th>
                  <th className="text-center px-6 py-4 font-display font-semibold">Silver</th>
                  <th className="text-center px-6 py-4 font-display font-semibold text-gold-light">
                    ⭐ Gold
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-t border-border ${i % 2 === 0 ? 'bg-bg-surface' : 'bg-white'}`}
                  >
                    <td className="px-6 py-4 font-medium text-navy-primary">{row.feature}</td>
                    {/* Render boolean values as check/cross icons, strings as text */}
                    {(['junior', 'silver', 'gold'] as const).map(planKey => (
                      <td key={planKey} className={`px-6 py-4 text-center ${planKey === 'gold' ? 'bg-gold-primary/5' : ''}`}>
                        {typeof row[planKey] === 'boolean' ? (
                          row[planKey] ? (
                            <Check size={18} className="text-green-600 mx-auto" />
                          ) : (
                            <X size={18} className="text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className={planKey === 'gold' ? 'font-semibold text-gold-primary' : 'text-text-secondary'}>
                            {row[planKey] as string}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── FAQ accordion ── */}
      <div className="py-20 bg-bg-primary">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <SectionHeader title="Frequently Asked Questions" centered />
          <div className="space-y-4 mt-10">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-bg-surface border border-border rounded-xl overflow-hidden cursor-pointer"
              >
                <summary className="flex items-center justify-between px-6 py-5 font-semibold text-navy-primary list-none select-none">
                  <span>{faq.q}</span>
                  {/* Chevron rotates when open */}
                  <span className="text-gold-primary ml-4 transition-transform group-open:rotate-45 text-xl font-light">+</span>
                </summary>
                <div className="px-6 pb-5 text-sm text-text-secondary leading-relaxed border-t border-border pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

    </PageLayout>
  );
};

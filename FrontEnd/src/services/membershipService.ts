import api from '../api/client';
import membershipData from '../data/memberships.json';
import { MembershipPlan } from '../types/membership.types';

export const getPlans = async (): Promise<MembershipPlan[]> => {
  try {
    const res = await api.get('/public/plans');
    if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
      return res.data.data?.map((p: any) => ({
        id: p.code || String(p.id),
        name: p.name,
        monthlyPrice: Math.round(Number(p.fee) / (Number(p.duration_months) || 12)) || Number(p.fee) || 2500,
        description: p.description || 'Exclusive club privilege and sanctuary access.',
        features: [
          `${p.duration_months || 12} Months Active Sanctuary Privileges`,
          p.can_join_social_play ? 'Complimentary Member Social Play' : 'Standard Court Access Rates',
          `${p.shop_discount_pct || 0}% Pro Shop Gear Discount`,
          `${p.bar_discount_pct || 0}% Lounge & Dining Privilege`,
          'VIP Optical Turnstile Access Card',
        ],
        popular: p.code === 'gold' || p.code === 'silver',
      }));
    }
  } catch (err) {
    console.warn('[getPlans] falling back to seed plans', err);
  }
  return Promise.resolve(membershipData as MembershipPlan[]);
};

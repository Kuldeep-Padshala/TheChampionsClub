import membershipData from '../data/memberships.json';
import { MembershipPlan } from '../types/membership.types';

export const getPlans = async (): Promise<MembershipPlan[]> => {
  return Promise.resolve(membershipData as MembershipPlan[]);
};


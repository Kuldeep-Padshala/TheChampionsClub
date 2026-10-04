export interface MembershipPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  highlighted?: boolean;
  benefits: string[];
  courtRate: number;
  shopDiscount: number;
  barDiscount: number;
}


import React from 'react';
import { MembershipPlan } from '../../types/membership.types';
import { formatPrice } from '../../utils/priceUtils';
import { Button } from '../ui/Button';
import { Check, Trophy, Star, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MembershipCardProps {
  plan: MembershipPlan;
  onJoin: () => void;
}

// Icon map — choose icon based on plan id
const PLAN_ICONS: Record<string, React.FC<{ className?: string; size?: number }>> = {
  gold:   Trophy,
  silver: Star,
  junior: Zap,
};

export const MembershipCard: React.FC<MembershipCardProps> = ({ plan, onJoin }) => {
  const PlanIcon = PLAN_ICONS[plan.id] || Star;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-3xl bg-bg-surface transition-all duration-500 hover:-translate-y-2',
        plan.highlighted
          ? 'border border-gold-primary/50 luxury-shadow-hover scale-[1.03] z-10'
          : 'border border-border/60 luxury-shadow'
      )}
    >
      {/* "Most Popular" ribbon — only shown on highlighted (Gold) plan */}
      {plan.highlighted && (
        <div className="absolute -top-4 inset-x-0 flex justify-center">
          <span className="bg-gold-primary text-white text-xs font-bold uppercase tracking-wider py-1.5 px-5 rounded-full shadow-sm">
            Most Popular
          </span>
        </div>
      )}

      {/* Plan header */}
      <div className={cn(
        'p-7 pb-6 text-center rounded-t-2xl',
        plan.highlighted ? 'bg-gold-primary/5' : 'bg-bg-subtle'
      )}>
        {/* Plan icon */}
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4',
          plan.highlighted ? 'bg-gold-primary/15' : 'bg-bg-surface border border-border'
        )}>
          <PlanIcon
            size={26}
            className={plan.highlighted ? 'text-gold-primary' : 'text-navy-mid'}
          />
        </div>

        {/* Plan name */}
        <h3 className="font-display text-2xl font-bold text-navy-primary mb-1">{plan.name}</h3>
        <p className="text-sm text-text-secondary">{plan.tagline}</p>
      </div>

      {/* Pricing */}
      <div className="px-7 pt-6 text-center">
        <div className="flex justify-center items-baseline gap-1 mb-2">
          <span className="text-4xl font-bold text-navy-primary">{formatPrice(plan.monthlyPrice)}</span>
          <span className="text-text-secondary text-sm">/month</span>
        </div>
        <div className="text-xs text-text-secondary bg-bg-subtle py-2 px-4 rounded-lg inline-block">
          Or {formatPrice(plan.annualPrice)} billed annually — save{' '}
          <span className="font-semibold text-gold-primary">
            {formatPrice(plan.monthlyPrice * 12 - plan.annualPrice)}
          </span>
        </div>
      </div>

      {/* Benefits list */}
      <ul className="flex-1 px-7 py-6 space-y-3">
        {plan.benefits.map((benefit, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-text-primary">
            <Check
              size={16}
              className={cn(
                'flex-shrink-0 mt-0.5',
                plan.highlighted ? 'text-gold-primary' : 'text-green-600'
              )}
            />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <div className="px-7 pb-7">
        <Button
          variant={plan.highlighted ? 'primary' : 'outline'}
          className="w-full h-12 text-base"
          onClick={onJoin}
        >
          Join {plan.name}
        </Button>
      </div>
    </div>
  );
};

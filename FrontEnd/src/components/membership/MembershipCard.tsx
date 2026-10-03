import React from 'react';
import { MembershipPlan } from '../../types/membership.types';
import { formatPrice } from '../../utils/priceUtils';
import { SpotlightCard } from '../ui/SpotlightCard';
import { useTheme } from '../../context/ThemeContext';
import { Check, Trophy, Star, Zap, Sparkles, ChevronRight, Crown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MembershipCardProps {
  plan: MembershipPlan;
  onJoin: () => void;
  index?: number;
}

// Bespoke icon mapping with luxury metadata
const PLAN_CONFIG: Record<
  string,
  {
    icon: React.FC<{ size?: number; className?: string }>;
    accentColor: string;
    kicker: string;
  }
> = {
  gold: {
    icon: Crown,
    accentColor: '#B89047',
    kicker: 'PREMIER CHAMPIONSHIP STATUS',
  },
  silver: {
    icon: Trophy,
    accentColor: '#8E8E93',
    kicker: 'ACTIVE CLUB PRIVILEGE',
  },
  junior: {
    icon: Zap,
    accentColor: '#C5A059',
    kicker: 'RISING TALENT UNDER 18',
  },
};

/**
 * MembershipCard — Haute Horlogerie Tiered Membership Dossier
 * Inspired by Aceternity UI, ReactBits.dev, and Kokonut UI.
 */
export const MembershipCard: React.FC<MembershipCardProps> = ({
  plan,
  onJoin,
  index = 0,
}) => {
  const { theme } = useTheme();
  const isNight = theme === 'night';
  const config = PLAN_CONFIG[plan.id] || {
    icon: Star,
    accentColor: '#B89047',
    kicker: 'EXCLUSIVE PRIVILEGE',
  };
  const PlanIcon = config.icon;
  const isGold = plan.id === 'gold' || plan.highlighted;

  return (
    <SpotlightCard
      className={cn(
        'group relative flex flex-col h-full select-none transition-all duration-500',
        isGold
          ? isNight
            ? 'border-[#B89047]/60 shadow-[0_24px_65px_-12px_rgba(184,144,71,0.28)] md:-translate-y-2'
            : 'border-[#B89047]/50 shadow-[0_24px_55px_-15px_rgba(184,144,71,0.22)] md:-translate-y-2 ring-1 ring-[#B89047]/30'
          : ''
      )}
      spotlightColor={
        isGold
          ? isNight
            ? 'rgba(184, 144, 71, 0.22)'
            : 'rgba(184, 144, 71, 0.14)'
          : undefined
      }
      borderGlowColor={
        isGold
          ? isNight
            ? 'rgba(234, 210, 154, 0.7)'
            : 'rgba(184, 144, 71, 0.6)'
          : undefined
      }
      enableTilt={true}
      tiltIntensity={isGold ? 4 : 3}
    >
      {/* ── Top Floating Luxury Badge (Gold Plan) ── */}
      {isGold && (
        <div className="absolute top-4 right-4 z-20">
          <div className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#B89047] via-[#EAD29A] to-[#B89047] text-[#0A0A0D] text-[10.5px] font-extrabold tracking-[0.16em] uppercase shadow-md flex items-center gap-1.5 border border-white/40">
            <Sparkles size={11} className="text-[#0A0A0D]" />
            <span>MOST COVETED</span>
          </div>
        </div>
      )}

      {/* ── Header & Heritage Kicker ── */}
      <div className="p-7 sm:p-8 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-sm',
              isGold
                ? 'bg-gradient-to-br from-[#EAD29A] via-[#B89047] to-[#7D5A1E] text-black'
                : isNight
                ? 'bg-[#18181D] border border-white/10 text-white'
                : 'bg-[#FAF8F5] border border-black/10 text-[#1D1D1F]'
            )}
          >
            <PlanIcon size={22} className={isGold ? 'text-black' : 'text-[#B89047]'} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.22em] text-[#B89047] block">
              {config.kicker}
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#1D1D1F] dark:text-white tracking-tight">
              {plan.name}
            </h3>
          </div>
        </div>

        <p className="text-sm text-[#71717A] dark:text-[#A1A1A6] leading-relaxed">
          {plan.tagline}
        </p>
      </div>

      {/* ── Pricing Matrix Block ── */}
      <div
        className={cn(
          'px-7 sm:px-8 py-5 border-y transition-colors',
          isGold
            ? isNight
              ? 'bg-[#161410] border-[#B89047]/30'
              : 'bg-[#FDFBF7] border-[#B89047]/25'
            : isNight
            ? 'bg-[#101014] border-white/[0.06]'
            : 'bg-[#FAF9F6] border-black/[0.05]'
        )}
      >
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-[#1D1D1F] dark:text-white">
            {formatPrice(plan.monthlyPrice)}
          </span>
          <span className="text-sm text-[#86868B] font-medium">/month</span>
        </div>

        <div className="text-xs text-[#86868B] mt-2 flex items-center gap-1.5 flex-wrap">
          <span>Or {formatPrice(plan.annualPrice)} billed annually</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10.5px] font-bold',
              isGold
                ? 'bg-[#B89047]/15 text-[#997332] dark:text-[#EAD29A]'
                : 'bg-black/5 dark:bg-white/10 text-[#1D1D1F] dark:text-white'
            )}
          >
            Save {formatPrice(plan.monthlyPrice * 12 - plan.annualPrice)}
          </span>
        </div>
      </div>

      {/* ── Bespoke Privileges List ── */}
      <div className="flex-1 p-7 sm:p-8 flex flex-col justify-between">
        <ul className="space-y-3.5 mb-8">
          {plan.benefits.map((benefit, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-[#2C2C2E] dark:text-[#E5E5EA] leading-snug"
            >
              <div
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm',
                  isGold
                    ? 'bg-[#B89047]/20 text-[#B89047] dark:text-[#EAD29A]'
                    : isNight
                    ? 'bg-white/10 text-white/80'
                    : 'bg-black/5 text-[#1D1D1F]'
                )}
              >
                <Check size={12} strokeWidth={2.5} />
              </div>
              <span className="font-normal">{benefit}</span>
            </li>
          ))}
        </ul>

        {/* ── Action Button ── */}
        <button
          onClick={onJoin}
          className={cn(
            'w-full h-12 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group/btn shadow-md active:scale-[0.98]',
            isGold
              ? isNight
                ? 'bg-gradient-to-r from-[#EAD29A] via-[#B89047] to-[#C99E52] text-[#0A0A0D] border border-[#EAD29A]/60 shadow-[0_8px_24px_rgba(184,144,71,0.35)] hover:shadow-[0_12px_32px_rgba(184,144,71,0.5)]'
                : 'bg-[#121214] text-white hover:bg-black border border-[#B89047]/45 shadow-[0_8px_20px_-6px_rgba(18,18,20,0.35)] hover:shadow-[0_12px_28px_-6px_rgba(184,144,71,0.4)]'
              : isNight
              ? 'bg-[#16161C] hover:bg-[#1E1E26] text-white border border-white/10 hover:border-white/20'
              : 'bg-white hover:bg-[#FAF8F5] text-[#1D1D1F] border border-black/15 hover:border-black/30'
          )}
        >
          {/* Shimmer sweep */}
          <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent ease-out pointer-events-none" />

          {isGold && (
            <Sparkles
              size={15}
              className={cn(
                'transition-transform duration-300 group-hover/btn:rotate-12 flex-shrink-0',
                isNight ? 'text-black' : 'text-[#EAD29A]'
              )}
            />
          )}

          <span className="relative z-10 font-display font-semibold">
            {isGold ? 'Apply for Gold Privilege' : `Select ${plan.name} Tier`}
          </span>

          <ChevronRight
            size={15}
            className="group-hover/btn:translate-x-1 transition-transform relative z-10"
          />
        </button>
      </div>
    </SpotlightCard>
  );
};

export default MembershipCard;

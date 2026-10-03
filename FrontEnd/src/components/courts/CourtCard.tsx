import React from 'react';
import { Court } from '../../types/court.types';
import { SpotlightCard } from '../ui/SpotlightCard';
import { formatPrice } from '../../utils/priceUtils';
import { useTheme } from '../../context/ThemeContext';
import {
  Zap,
  Droplets,
  Users,
  Wind,
  ShieldCheck,
  Trophy,
  CalendarCheck,
  ChevronRight,
  Sparkles,
  Activity,
  Award,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface CourtCardProps {
  court: Court;
  onBook: () => void;
}

// Sophisticated amenity icon mapping
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'Floodlights':            <Zap size={13} className="text-[#B89047]" />,
  'Spectator Seating':      <Users size={13} className="text-[#B89047]" />,
  'Water Station':          <Droplets size={13} className="text-[#B89047]" />,
  'Ball Hoppers':           <Activity size={13} className="text-[#B89047]" />,
  'Equipment Hire':         <Award size={13} className="text-[#B89047]" />,
  'Bowling Machine (hire)': <Zap size={13} className="text-[#B89047]" />,
  '4 Batting Lanes':        <Activity size={13} className="text-[#B89047]" />,
  'Seating':                <Users size={13} className="text-[#B89047]" />,
  'Equipment Store':        <Award size={13} className="text-[#B89047]" />,
  'Air Conditioned':        <Wind size={13} className="text-[#B89047]" />,
  'Shuttle Hire':           <Activity size={13} className="text-[#B89047]" />,
  'Changing Rooms':         <ShieldCheck size={13} className="text-[#B89047]" />,
};

// Specialized surface descriptor per court
const SURFACE_SPECS: Record<string, string> = {
  'court-1': 'Championship Synthetic Turf • 1000 Lux Floodlights',
  'court-2': 'ITF Certified Hard Court • Pro Cushion Acrylic',
  'court-3': 'Indoor Multi-Lane Turf • High-Speed Bowling Nets',
  'court-4': 'Olympic Spring Parquet • Climate Controlled',
};

/**
 * CourtCard — Haute Horlogerie & Private Club Grade Facility Showcase
 * Inspired by Aceternity UI, ReactBits.dev, and Kokonut UI.
 * 
 * Features:
 * - Dynamic Spotlight cursor tracking and micro-border illumination
 * - 3D weighted tilt interaction
 * - Vignetted cinematic photography with live status beacon
 * - Haute-horlogerie tiered privilege pricing matrix
 * - Bespoke satin obsidian & champagne gold reservation CTA
 */
export const CourtCard: React.FC<CourtCardProps> = ({ court, onBook }) => {
  const { theme } = useTheme();
  const isNight = theme === 'night';

  const surfaceSpec = SURFACE_SPECS[court.id] || 'Tour Specification • Precision Engineered';

  return (
    <SpotlightCard
      className="group h-full flex flex-col cursor-pointer select-none"
      enableTilt={true}
      tiltIntensity={3.5}
      onClick={onBook}
    >
      {/* ── Cinematic Photography Frame ── */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden">
        <img
          src={court.imageUrl}
          alt={court.name}
          className="object-cover w-full h-full transform group-hover:scale-108 transition-transform duration-700 ease-[0.16,1,0.3,1]"
        />

        {/* Ambient Dark-to-Champagne Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30 pointer-events-none" />

        {/* Top-Left: Sport Discipline Monogram Pill */}
        <div className="absolute top-4 left-4 z-20">
          <div className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EAD29A] shadow-[0_0_8px_#EAD29A]" />
            <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-white font-display">
              {court.sport} Arena
            </span>
          </div>
        </div>

        {/* Top-Right: Live Real-Time Availability Beacon */}
        <div className="absolute top-4 right-4 z-20">
          <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/35 shadow-lg flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-300">
              Live Slots
            </span>
          </div>
        </div>

        {/* Bottom Banner Inside Image: Surface Specification Ribbon */}
        <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent backdrop-blur-[2px] z-20 flex items-center justify-between text-white/90">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Sparkles size={13} className="text-[#EAD29A] flex-shrink-0" />
            <span className="tracking-tight text-white/95 line-clamp-1">{surfaceSpec}</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#EAD29A] flex-shrink-0 hidden sm:inline">
            SANCTIONED
          </span>
        </div>
      </div>

      {/* ── Editorial Facility Dossier ── */}
      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
        <div>
          {/* Eyebrow Kicker */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-[#B89047]">
              Facility Tier 01 • Prime Court
            </span>
          </div>

          {/* Headline Title */}
          <h3 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[#1D1D1F] dark:text-white group-hover:text-[#B89047] transition-colors duration-300 mb-2.5">
            {court.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-[#66666E] dark:text-[#A1A1A6] leading-relaxed line-clamp-2 mb-6 font-normal">
            {court.description}
          </p>

          {/* Jewel Amenity Chips */}
          <div className="flex flex-wrap gap-2 mb-7">
            {court.amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F8F7F4] dark:bg-white/[0.04] text-[#2C2C2E] dark:text-[#E5E5EA] border border-black/[0.05] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.02)] group-hover:border-[#B89047]/30 transition-colors"
              >
                {AMENITY_ICONS[amenity] || <Sparkles size={12} className="text-[#B89047]" />}
                <span>{amenity}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Haute-Horlogerie Tiered Privilege Rates ── */}
        <div>
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-b from-[#F9F8F5] to-[#F3F0E8] dark:from-[#131317] dark:to-[#0D0D11] border border-black/[0.06] dark:border-white/[0.08] mb-6 shadow-sm">
            {/* Standard Tier Row */}
            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <span className="text-[10.5px] uppercase tracking-wider text-[#86868B] font-semibold block mb-0.5">
                  Walk-in Guest
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-display">
                    {formatPrice(court.pricePerHour.walkin)}
                  </span>
                  <span className="text-xs text-[#86868B]">/hr</span>
                </div>
              </div>

              <div>
                <span className="text-[10.5px] uppercase tracking-wider text-[#86868B] font-semibold block mb-0.5">
                  Silver Privilege
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-display">
                    {formatPrice(court.pricePerHour.silver)}
                  </span>
                  <span className="text-xs text-[#86868B]">/hr</span>
                </div>
              </div>
            </div>

            {/* Gold Privilege Ribbon */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#EAD29A] via-[#B89047] to-[#7D5A1E] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                  <Trophy size={11} className="text-black" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                    Gold Member Privilege
                  </span>
                  <span className="text-[10px] text-[#86868B]">Full access anytime</span>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#B89047]/15 via-[#EAD29A]/25 to-[#B89047]/15 border border-[#B89047]/40 text-[#997332] dark:text-[#EAD29A] shadow-sm">
                COMPLIMENTARY
              </span>
            </div>
          </div>

          {/* ── Bespoke Luxury Reservation Button ── */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
            className={cn(
              'w-full h-12 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group/btn shadow-md active:scale-[0.98]',
              isNight
                ? 'bg-gradient-to-r from-[#EAD29A] via-[#B89047] to-[#C99E52] text-[#0A0A0D] border border-[#EAD29A]/60 shadow-[0_8px_24px_rgba(184,144,71,0.35)] hover:shadow-[0_12px_32px_rgba(184,144,71,0.5)]'
                : 'bg-[#121214] text-white hover:bg-black border border-[#B89047]/45 shadow-[0_8px_20px_-6px_rgba(18,18,20,0.35)] hover:shadow-[0_12px_28px_-6px_rgba(184,144,71,0.4)]'
            )}
          >
            {/* Shimmer Light Reflection Sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent ease-out pointer-events-none" />

            <CalendarCheck
              size={16}
              className={cn(
                'transition-transform duration-300 group-hover/btn:scale-110 flex-shrink-0',
                isNight ? 'text-black' : 'text-[#EAD29A]'
              )}
            />
            <span className="relative z-10 tracking-tight font-display">
              Reserve Court Slot
            </span>
            <ChevronRight
              size={15}
              className="group-hover/btn:translate-x-1 transition-transform relative z-10"
            />
          </button>
        </div>
      </div>
    </SpotlightCard>
  );
};

export default CourtCard;

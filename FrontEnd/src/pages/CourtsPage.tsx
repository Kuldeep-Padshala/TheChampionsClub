import React, { useEffect, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CourtCard } from '../components/courts/CourtCard';
import { SlotCalendar } from '../components/courts/SlotCalendar';
import { getCourts, getSlotsForWeek } from '../services/courtsService';
import { Court, TimeSlot } from '../types/court.types';
import { useLoginPrompt } from '../hooks/useLoginPrompt';
import { formatDate } from '../utils/dateUtils';
import { Trophy, Clock, Users, Shield } from 'lucide-react';
import { cn } from '../utils/cn';

export const CourtsPage = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  // Which court is currently selected in the slot calendar
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const { requireLogin } = useLoginPrompt();

  // Load courts on mount
  useEffect(() => {
    getCourts().then(data => {
      setCourts(data);
      // Auto-select the first court
      if (data.length > 0) setSelectedCourtId(data[0].id);
    });
  }, []);

  // Reload slots when selected court changes
  useEffect(() => {
    if (selectedCourtId) {
      getSlotsForWeek(selectedCourtId, formatDate(new Date('2026-10-05'))).then(setSlots);
    }
  }, [selectedCourtId]);

  // When user clicks "View Slots & Book" on a CourtCard:
  // - select that court in the calendar
  // - smooth-scroll to the calendar section with luxury momentum
  const handleBook = (courtId: string) => {
    setSelectedCourtId(courtId);
    const lenis = (window as any).lenis;
    if (lenis) {
      lenis.scrollTo('#slot-calendar', { offset: -90, duration: 1.2 });
    } else {
      document.getElementById('slot-calendar')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <PageLayout>

      {/* ── Page hero banner ── */}
      <div className="bg-navy-primary text-cream pt-36 pb-20 md:pt-44 md:pb-28 relative overflow-hidden">
        {/* Subtle pattern / background image */}
        <div className="absolute inset-0 z-0 opacity-10">
          <img
            src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=2000&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gold-primary/20 border border-gold-primary/30 text-gold-light rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Trophy size={14} />
            <span>4 Courts Available</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gold-primary mb-4">
            World-Class Courts
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Book your next game on our premium surfaces. Members enjoy exclusive rates,
            priority slots, and free equipment hire.
          </p>
        </div>
      </div>

      {/* ── Court cards grid ── */}
      <div className="container mx-auto px-4 md:px-6 py-16">
        <SectionHeader
          title="Our Facilities"
          subtitle="Select a court to view availability and pricing."
          centered
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-12">
          {courts.map(court => (
            <CourtCard key={court.id} court={court} onBook={() => handleBook(court.id)} />
          ))}
        </div>
      </div>

      {/* ── Slot Calendar section ── */}
      <div id="slot-calendar" className="scroll-mt-20 bg-bg-subtle py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">

          {/* Section header + court selector tabs in the same row */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <SectionHeader title="Check Availability" subtitle="Click any green slot to book." />
            <div className="flex overflow-x-auto pb-1 gap-2 w-full md:w-auto scrollbar-hide">
              {courts.map(court => (
                <button
                  key={court.id}
                  onClick={() => setSelectedCourtId(court.id)}
                  className={cn(
                    'px-5 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-all font-display tracking-wide flex-shrink-0 active:scale-95 shadow-sm',
                    selectedCourtId === court.id
                      ? 'bg-[#121214] text-white dark:bg-gradient-to-r dark:from-[#EAD29A] dark:via-[#B89047] dark:to-[#B89047] dark:text-black border border-[#B89047]/60 shadow-[0_4px_12px_rgba(184,144,71,0.25)]'
                      : 'bg-white/90 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/10 text-[#66666E] dark:text-[#A1A1A6] hover:border-[#B89047]/45 hover:text-[#1D1D1F] dark:hover:text-white backdrop-blur-md'
                  )}
                >
                  {court.name}
                </button>
              ))}
            </div>
          </div>

          {/* The interactive weekly slot calendar */}
          <SlotCalendar slots={slots} onWeekChange={() => {}} />

          {/* Booking rules info box */}
          <div className="mt-8 bg-white dark:bg-[#0A0A0D] border border-[#B89047]/30 rounded-[28px] p-7 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0 border border-black/[0.06] dark:border-white/10">
                <Clock className="text-[#B89047]" size={18} />
              </div>
              <div>
                <h4 className="font-display font-bold text-[#1D1D1F] dark:text-white text-sm mb-1">Advance Booking</h4>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1A6] leading-relaxed">
                  Members: up to 14 days ahead. Walk-ins: up to 3 days ahead.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0 border border-black/[0.06] dark:border-white/10">
                <Users className="text-[#B89047]" size={18} />
              </div>
              <div>
                <h4 className="font-display font-bold text-[#1D1D1F] dark:text-white text-sm mb-1">Daily Limit</h4>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1A6] leading-relaxed">
                  Maximum 2 bookings per member per day. Gold members enjoy unlimited access.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0 border border-black/[0.06] dark:border-white/10">
                <Shield className="text-[#B89047]" size={18} />
              </div>
              <div>
                <h4 className="font-display font-bold text-[#1D1D1F] dark:text-white text-sm mb-1">Cancellation</h4>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1A6] leading-relaxed">
                  Cancel up to 24 hours before for a full refund. Late cancellations non-refundable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </PageLayout>
  );
};

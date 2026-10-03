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
  // - smooth-scroll to the calendar section
  const handleBook = (courtId: string) => {
    setSelectedCourtId(courtId);
    document.getElementById('slot-calendar')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <PageLayout>

      {/* ── Page hero banner ── */}
      <div className="bg-navy-primary text-cream py-20 md:py-28 relative overflow-hidden">
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
            <div className="flex overflow-x-auto pb-1 gap-2 w-full md:w-auto">
              {courts.map(court => (
                <button
                  key={court.id}
                  onClick={() => setSelectedCourtId(court.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
                    selectedCourtId === court.id
                      ? 'bg-navy-primary text-white'
                      : 'bg-white border border-border text-navy-mid hover:bg-gold-primary/10 hover:border-gold-primary/30'
                  }`}
                >
                  {court.name}
                </button>
              ))}
            </div>
          </div>

          {/* The interactive weekly slot calendar */}
          <SlotCalendar slots={slots} onWeekChange={() => {}} />

          {/* Booking rules info box */}
          <div className="mt-8 bg-bg-surface border border-gold-light/40 rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Clock className="text-gold-primary flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-navy-primary text-sm mb-1">Advance Booking</h4>
                <p className="text-xs text-text-secondary">
                  Members: up to 14 days ahead. Walk-ins: up to 3 days ahead.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="text-gold-primary flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-navy-primary text-sm mb-1">Daily Limit</h4>
                <p className="text-xs text-text-secondary">
                  Maximum 2 bookings per member per day. Gold members have no limit.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="text-gold-primary flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-navy-primary text-sm mb-1">Cancellation</h4>
                <p className="text-xs text-text-secondary">
                  Cancel up to 24 hours before for a full refund. Late cancellations are non-refundable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </PageLayout>
  );
};

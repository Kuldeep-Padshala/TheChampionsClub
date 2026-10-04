import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { TimeSlot, Court } from '../../types/court.types';
import { generateWeekDays, formatDate } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import { useLoginPrompt } from '../../hooks/useLoginPrompt';
import { useTheme } from '../../context/ThemeContext';
import { CourtBookingModal } from './CourtBookingModal';
import { websocketService } from '../../services/websocketService';

interface SlotCalendarProps {
  slots: TimeSlot[];
  court?: Court | null;
  onWeekChange: (date: Date) => void;
  onSlotBooked?: (slotId: string) => void;
}

export const SlotCalendar: React.FC<SlotCalendarProps> = ({
  slots,
  court,
  onWeekChange,
  onSlotBooked,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { requireLogin } = useLoginPrompt();
  const { theme } = useTheme();
  const isNight = theme === 'night';
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Direct Booking Modal State
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<TimeSlot | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [localBookedSlotIds, setLocalBookedSlotIds] = useState<string[]>([]);

  // Enable mouse wheel scrolling directly inside the booking table
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent parent smooth-scroll from capturing mouse wheel
      e.stopPropagation();
      el.scrollTop += e.deltaY;
    };

    el.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Real-time synchronization via WebSocket & local events
  useEffect(() => {
    const unsub = websocketService.on('court_slot_change', (event: any) => {
      if (!court || String(event.courtId) === String(court.id) || !event.courtId) {
        if (event.type === 'COURT_SLOT_BOOKED' && event.startsAt) {
          const datePart = event.startsAt.split('T')[0].split(' ')[0];
          const timePart = event.startsAt.includes('T')
            ? event.startsAt.split('T')[1].slice(0, 5)
            : (event.startsAt.includes(' ') ? event.startsAt.split(' ')[1].slice(0, 5) : '');

          if (datePart && timePart) {
            const matchingSlot = slots.find((s) => s.date === datePart && s.startTime.startsWith(timePart));
            if (matchingSlot) {
              setLocalBookedSlotIds((prev) => Array.from(new Set([...prev, matchingSlot.id])));
            }
          }
        } else if (event.type === 'COURT_SLOT_CANCELLED' && event.startsAt) {
          const datePart = event.startsAt.split('T')[0].split(' ')[0];
          const timePart = event.startsAt.includes('T')
            ? event.startsAt.split('T')[1].slice(0, 5)
            : (event.startsAt.includes(' ') ? event.startsAt.split(' ')[1].slice(0, 5) : '');

          if (datePart && timePart) {
            const matchingSlot = slots.find((s) => s.date === datePart && s.startTime.startsWith(timePart));
            if (matchingSlot) {
              setLocalBookedSlotIds((prev) => prev.filter((id) => id !== matchingSlot.id));
            }
          }
        }
      }
    });

    const handleLocalBooking = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (!court || String(detail.courtId) === String(court.id) || !detail.courtId) {
        if (detail.startsAt) {
          const datePart = detail.startsAt.split('T')[0].split(' ')[0];
          const timePart = detail.startsAt.includes('T')
            ? detail.startsAt.split('T')[1].slice(0, 5)
            : (detail.startsAt.includes(' ') ? detail.startsAt.split(' ')[1].slice(0, 5) : '');

          if (datePart && timePart) {
            const matchingSlot = slots.find((s) => s.date === datePart && s.startTime.startsWith(timePart));
            if (matchingSlot) {
              if (detail.action === 'cancel') {
                setLocalBookedSlotIds((prev) => prev.filter((id) => id !== matchingSlot.id));
              } else {
                setLocalBookedSlotIds((prev) => Array.from(new Set([...prev, matchingSlot.id])));
              }
            }
          }
        }
      }
    };

    window.addEventListener('court_booking_success', handleLocalBooking);

    return () => {
      unsub();
      window.removeEventListener('court_booking_success', handleLocalBooking);
    };
  }, [court, slots]);

  const weekDays = generateWeekDays(currentDate);
  const timeHours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
    onWeekChange(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
    onWeekChange(prev);
  };

  const getSlot = (date: Date, hour: number) => {
    const dateStr = formatDate(date);
    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
    const slot = slots.find((s) => s.date === dateStr && s.startTime === hourStr);
    if (slot && localBookedSlotIds.includes(slot.id)) {
      return { ...slot, status: 'booked' as const };
    }
    return slot;
  };

  const handleSlotClick = (slot: TimeSlot | undefined) => {
    if (slot && slot.status === 'available') {
      requireLogin('book this court slot', () => {
        setSelectedSlotForBooking(slot);
        setIsBookingModalOpen(true);
      });
    }
  };

  return (
    <div className="bg-white dark:bg-[#0A0A0D] border border-black/[0.08] dark:border-white/[0.09] rounded-[28px] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
      {/* ── Console Header ── */}
      <div className="flex items-center justify-between p-5 sm:p-6 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#FAF9F6] dark:bg-[#121216]">
        <button
          onClick={prevWeek}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#1A1A22] border border-black/[0.08] dark:border-white/10 text-[#1D1D1F] dark:text-white hover:border-[#B89047] hover:text-[#B89047] transition-all active:scale-95 shadow-sm"
          aria-label="Previous Week"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-[#B89047] block mb-0.5">
            CONCIERGE SCHEDULER
          </span>
          <h3 className="font-display font-bold text-lg sm:text-xl text-[#1D1D1F] dark:text-white tracking-tight">
            Week of {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
        </div>

        <button
          onClick={nextWeek}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#1A1A22] border border-black/[0.08] dark:border-white/10 text-[#1D1D1F] dark:text-white hover:border-[#B89047] hover:text-[#B89047] transition-all active:scale-95 shadow-sm"
          aria-label="Next Week"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      
      {/* ── Calendar Matrix ── */}
      <div data-lenis-prevent className="overflow-x-auto overscroll-contain">
        <div className="min-w-[760px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#F5F4F0] dark:bg-[#101014] text-xs font-semibold">
            <div className="p-3.5 text-center text-[#86868B] border-r border-black/[0.06] dark:border-white/[0.08] uppercase tracking-wider font-display">
              Timeline
            </div>
            {weekDays?.map((d, i) => (
              <div
                key={i}
                className="p-3 text-center border-r border-black/[0.06] dark:border-white/[0.08] last:border-0 text-[#1D1D1F] dark:text-white"
              >
                <div className="font-bold tracking-tight">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="text-[11px] text-[#B89047] font-semibold mt-0.5">{d.getDate()}</div>
              </div>
            ))}
          </div>
          
          {/* Time Rows */}
          <div
            ref={scrollContainerRef}
            data-lenis-prevent
            className="max-h-[520px] overflow-y-auto overscroll-contain divide-y divide-black/[0.04] dark:divide-white/[0.05]"
          >
            {timeHours?.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-8 text-xs hover:bg-[#FAF9F6]/80 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="p-3 text-center text-[#86868B] border-r border-black/[0.06] dark:border-white/[0.08] font-mono font-medium flex items-center justify-center">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
                {weekDays?.map((d, i) => {
                  const slot = getSlot(d, hour);
                  return (
                    <div
                      key={i}
                      className="p-1 border-r border-black/[0.06] dark:border-white/[0.08] last:border-0"
                    >
                      {slot ? (
                        <button
                          onClick={() => handleSlotClick(slot)}
                          disabled={slot.status !== 'available'}
                          className={cn(
                            'w-full h-full min-h-[38px] rounded-lg flex items-center justify-center text-[11px] font-bold tracking-tight transition-all duration-200',
                            slot.status === 'available' &&
                              'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:scale-[1.02] cursor-pointer shadow-sm',
                            slot.status === 'booked' &&
                              'bg-neutral-100 dark:bg-white/[0.03] text-neutral-400 dark:text-neutral-500 cursor-not-allowed border border-transparent',
                            slot.status === 'social' &&
                              'bg-[#B89047]/15 text-[#997332] dark:text-[#EAD29A] border border-[#B89047]/30 cursor-not-allowed'
                          )}
                        >
                          {slot.status === 'available' ? 'Book' : slot.status === 'booked' ? 'Booked' : 'Social Play'}
                        </button>
                      ) : (
                        <div className="w-full h-full min-h-[38px] rounded-lg bg-black/[0.01] dark:bg-white/[0.01] border border-dashed border-black/[0.04] dark:border-white/[0.04] flex items-center justify-center text-[11px] text-[#A1A1A6]">
                          —
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* ── Console Footer Legend ── */}
      <div className="p-4 sm:p-5 bg-[#FAF9F6] dark:bg-[#121216] border-t border-black/[0.06] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <span className="font-medium text-[#1D1D1F] dark:text-white">Live Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            <span className="font-medium text-[#86868B]">Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B89047]" />
            <span className="font-medium text-[#B89047]">Member Social Play</span>
          </div>
        </div>

        <div className="text-[11px] text-[#86868B] font-medium flex items-center gap-1">
          <Sparkles size={12} className="text-[#B89047]" />
          Instant reservation confirmed to your member profile
        </div>
      </div>

      {/* Luxury Court Booking Confirmation Modal */}
      <CourtBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        slot={selectedSlotForBooking}
        court={court}
        onConfirmSuccess={(slotId) => {
          setLocalBookedSlotIds((prev) => [...prev, slotId]);
          onSlotBooked?.(slotId);
        }}
      />
    </div>
  );
};

export default SlotCalendar;

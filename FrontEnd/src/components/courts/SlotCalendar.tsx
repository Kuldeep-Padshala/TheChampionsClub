import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TimeSlot } from '../../types/court.types';
import { generateWeekDays, formatDate } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import { useLoginPrompt } from '../../hooks/useLoginPrompt';

interface SlotCalendarProps {
  slots: TimeSlot[];
  onWeekChange: (date: Date) => void;
}

export const SlotCalendar: React.FC<SlotCalendarProps> = ({ slots, onWeekChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date('2026-10-05'));
  const { requireLogin } = useLoginPrompt();
  
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
    return slots.find(s => s.date === dateStr && s.startTime === hourStr);
  };

  const handleSlotClick = (slot: TimeSlot | undefined) => {
    if (slot && slot.status === 'available') {
      requireLogin('book this court slot');
    }
  };

  return (
    <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-bg-subtle">
        <button onClick={prevWeek} className="p-2 rounded-md hover:bg-white text-navy-primary transition-colors"><ChevronLeft size={20} /></button>
        <h3 className="font-semibold text-navy-primary">
          Week of {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </h3>
        <button onClick={nextWeek} className="p-2 rounded-md hover:bg-white text-navy-primary transition-colors"><ChevronRight size={20} /></button>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-8 border-b border-border bg-gray-50/50 text-sm font-medium">
            <div className="p-3 text-center text-text-secondary border-r border-border">Time</div>
            {weekDays.map((d, i) => (
              <div key={i} className="p-3 text-center border-r border-border last:border-0 text-navy-primary">
                <div>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="text-xs text-text-secondary mt-1">{d.getDate()}</div>
              </div>
            ))}
          </div>
          
          <div className="max-h-[500px] overflow-y-auto">
            {timeHours.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b border-border last:border-0 text-sm hover:bg-gray-50/30">
                <div className="p-3 text-center text-text-secondary border-r border-border font-medium">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour-12} PM` : `${hour} AM`}
                </div>
                {weekDays.map((d, i) => {
                  const slot = getSlot(d, hour);
                  return (
                    <div key={i} className="p-1 border-r border-border last:border-0">
                      {slot ? (
                        <button
                          onClick={() => handleSlotClick(slot)}
                          disabled={slot.status !== 'available'}
                          className={cn(
                            "w-full h-full min-h-[40px] rounded flex items-center justify-center text-xs font-medium transition-colors",
                            slot.status === 'available' ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer" :
                            slot.status === 'booked' ? "bg-red-50 text-red-400 cursor-not-allowed" :
                            "bg-amber-100 text-amber-700 cursor-not-allowed"
                          )}
                        >
                          {slot.status === 'available' ? 'Book' : slot.status === 'booked' ? 'Booked' : 'Social Play'}
                        </button>
                      ) : (
                        <div className="w-full h-full min-h-[40px] rounded bg-gray-50/50 border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
                          -
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
      
      <div className="p-4 bg-bg-subtle border-t border-border flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-400"></div> <span>Available</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400 opacity-50"></div> <span>Booked</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400"></div> <span>Social Play</span></div>
      </div>
    </div>
  );
};


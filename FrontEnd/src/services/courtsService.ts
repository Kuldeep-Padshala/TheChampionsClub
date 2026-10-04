import api from '../api/client';
import courtsData from '../data/courts.json';
import { Court, TimeSlot } from '../types/court.types';

export const getCourts = async (): Promise<Court[]> => {
  try {
    const res = await api.get('/public/courts');
    if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
      return res.data.data?.map((c: any) => {
        const sportLower = (c.sport_name || '').toLowerCase();
        const sportType = sportLower.includes('cricket')
          ? 'cricket'
          : sportLower.includes('badminton')
          ? 'badminton'
          : sportLower.includes('padel')
          ? 'multi'
          : 'tennis';

        const walkinRate = Math.round(Number(c.base_price) || 800);
        const silverRate = Math.round(Number(c.silver_price) || walkinRate * 0.7);
        const goldRate = Math.round(Number(c.gold_price) || 0);

        const img = c.name.toLowerCase().includes('padel')
          ? 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800&auto=format&fit=crop'
          : c.name.toLowerCase().includes('cricket')
          ? 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop'
          : c.name.toLowerCase().includes('badminton')
          ? 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop'
          : 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=800&auto=format&fit=crop';

        return {
          id: String(c.id),
          name: c.name,
          sport: sportType as any,
          surface: c.surface || 'Pro Hardcourt (Cushioned Acrylic)',
          isIndoor: Boolean(c.is_indoor),
          imageUrl: img,
          image: img,
          description: `Official tournament regulation ${c.surface || 'surface'} with LED broadcast lighting.`,
          amenities: ['Floodlights', 'Spectator Seating', 'Water Station', 'Equipment Hire'],
          features: ['LED Broadcast Lighting', 'Pro Tournament Net', 'Spectator Seating', 'Climate Controlled'],
          hourlyRate: walkinRate,
          memberRate: silverRate,
          pricePerHour: {
            walkin: walkinRate,
            silver: silverRate,
            gold: goldRate,
          },
        };
      });
    }
  } catch (err) {
    console.warn('[getCourts] falling back to seed courts', err);
  }
  return Promise.resolve(courtsData as Court[]);
};

export const getSlotsForWeek = async (courtId: string, weekStart: string): Promise<TimeSlot[]> => {
  try {
    const res = await api.get('/public/slots', {
      params: { courtId, startDate: weekStart, days: 7 },
    });
    if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('[getSlotsForWeek] error fetching live slots, generating dynamic fallback', err);
  }

  // Dynamic fallback for offline/disconnected scenario
  const baseDate = new Date(weekStart + 'T00:00:00');
  const fallbackSlots: TimeSlot[] = [];
  for (let d = 0; d < 7; d++) {
    const day = new Date(baseDate);
    day.setDate(day.getDate() + d);
    const dateStr = day.toISOString().split('T')[0];

    for (let h = 6; h <= 22; h++) {
      const startH = String(h).padStart(2, '0') + ':00';
      const endH = String(h + 1).padStart(2, '0') + ':00';
      fallbackSlots.push({
        id: `slot-${courtId}-${dateStr}-${startH}`,
        courtId: String(courtId),
        date: dateStr,
        startTime: startH,
        endTime: endH,
        status: 'available',
      });
    }
  }
  return fallbackSlots;
};

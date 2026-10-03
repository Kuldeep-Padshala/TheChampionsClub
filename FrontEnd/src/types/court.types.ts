export interface Court {
  id: string;
  name: string;
  sport: 'tennis' | 'cricket' | 'badminton' | 'multi';
  imageUrl: string;
  description?: string;
  amenities: string[];
  pricePerHour: {
    walkin: number;
    silver: number;
    gold: number;
  };
}

export interface TimeSlot {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'social';
}


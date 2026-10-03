import courtsData from '../data/courts.json';
import slotsData from '../data/slots.json';
import { Court, TimeSlot } from '../types/court.types';

export const getCourts = async (): Promise<Court[]> => {
  return Promise.resolve(courtsData as Court[]);
};

export const getSlotsForWeek = async (courtId: string, weekStart: string): Promise<TimeSlot[]> => {
  return Promise.resolve(
    (slotsData as TimeSlot[]).filter(s => s.courtId === courtId)
  );
};


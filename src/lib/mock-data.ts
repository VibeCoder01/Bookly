
import type { Room, Booking, TimeSlot } from '@/types';

export const mockRooms: Room[] = [
  { id: 'room-1', name: 'Conference Room Alpha', capacity: 10 },
  { id: 'room-2', name: 'Meeting Room Bravo', capacity: 4 },
  { id: 'room-3', name: 'Quiet Pod Charlie', capacity: 1 },
  { id: 'room-4', name: 'Workshop Delta', capacity: 20 },
];

// Ensure date strings are in YYYY-MM-DD format for consistency
const today = new Date();
const tomorrowDate = new Date(today);
tomorrowDate.setDate(today.getDate() + 1);
const dayAfterTomorrowDate = new Date(today);
dayAfterTomorrowDate.setDate(today.getDate() + 2);

const formatDateToYYYYMMDD = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    roomId: 'room-1',
    roomName: 'Conference Room Alpha',
    date: formatDateToYYYYMMDD(tomorrowDate), 
    time: '10:00 - 11:00', // Assumes 60-min slots initially
    userName: 'Alice Wonderland',
    userEmail: 'alice@example.com',
  },
  {
    id: 'booking-2',
    roomId: 'room-2',
    roomName: 'Meeting Room Bravo',
    date: formatDateToYYYYMMDD(tomorrowDate), 
    time: '14:00 - 15:00', // Assumes 60-min slots initially
    userName: 'Bob The Builder',
    userEmail: 'bob@example.com',
  },
  {
    id: 'booking-3',
    roomId: 'room-1',
    roomName: 'Conference Room Alpha',
    date: formatDateToYYYYMMDD(dayAfterTomorrowDate),
    time: '09:00 - 10:00', // Assumes 60-min slots initially
    userName: 'Carol Danvers',
    userEmail: 'carol@example.com',
  },
   {
    id: 'booking-4',
    roomId: 'room-1',
    roomName: 'Conference Room Alpha',
    date: formatDateToYYYYMMDD(tomorrowDate),
    time: '11:00 - 12:00', // Another booking for tomorrow
    userName: 'David Copperfield',
    userEmail: 'david@example.com',
  },
];

// This is no longer the primary source for getAvailableTimeSlots but can be kept for reference
// or other utilities if needed.
export const allPossibleTimeSlotsLEGACY: TimeSlot[] = [
  { startTime: '09:00', endTime: '10:00', display: '09:00 - 10:00' },
  { startTime: '10:00', endTime: '11:00', display: '10:00 - 11:00' },
  { startTime: '11:00', endTime: '12:00', display: '11:00 - 12:00' },
  { startTime: '12:00', endTime: '13:00', display: '12:00 - 13:00' },
  { startTime: '13:00', endTime: '14:00', display: '13:00 - 14:00' },
  { startTime: '14:00', endTime: '15:00', display: '14:00 - 15:00' },
  { startTime: '15:00', endTime: '16:00', display: '15:00 - 16:00' },
  { startTime: '16:00', endTime: '17:00', display: '16:00 - 17:00' },
];

// Function to add a booking to the mock data (simulates DB write)
export const addMockBooking = (newBooking: Booking): void => {
  // Check if booking already exists (simple check by ID or more complex logic)
  const existingIndex = mockBookings.findIndex(b => b.id === newBooking.id);
  if (existingIndex > -1) {
      // Potentially update existing booking if needed, or handle as error
      console.warn(`[Bookly Debug] Booking with id ${newBooking.id} already exists. Overwriting.`);
      mockBookings[existingIndex] = newBooking;
  } else {
      mockBookings.push(newBooking);
  }
  console.log(`[Bookly Debug] addMockBooking executed. Current mockBookings count: ${mockBookings.length}. Last added ID: ${newBooking.id}, Time: ${newBooking.time}`);
};

    
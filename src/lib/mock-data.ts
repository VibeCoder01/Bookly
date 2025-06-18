import type { Room, Booking, TimeSlot } from '@/types';

export const mockRooms: Room[] = [
  { id: 'room-1', name: 'Conference Room Alpha', capacity: 10 },
  { id: 'room-2', name: 'Meeting Room Bravo', capacity: 4 },
  { id: 'room-3', name: 'Quiet Pod Charlie', capacity: 1 },
  { id: 'room-4', name: 'Workshop Delta', capacity: 20 },
];

export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    roomId: 'room-1',
    roomName: 'Conference Room Alpha',
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // Tomorrow
    time: '10:00 - 11:00',
    userName: 'Alice Wonderland',
    userEmail: 'alice@example.com',
  },
  {
    id: 'booking-2',
    roomId: 'room-2',
    roomName: 'Meeting Room Bravo',
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // Tomorrow
    time: '14:00 - 15:00',
    userName: 'Bob The Builder',
    userEmail: 'bob@example.com',
  },
  {
    id: 'booking-3',
    roomId: 'room-1',
    roomName: 'Conference Room Alpha',
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0], // Day after tomorrow
    time: '09:00 - 10:00',
    userName: 'Carol Danvers',
    userEmail: 'carol@example.com',
  },
];

export const allPossibleTimeSlots: TimeSlot[] = [
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
  mockBookings.push(newBooking);
};


'use server';

import type { Booking, Room, TimeSlot, AIResponse, AISuggestion } from '@/types';
import { mockRooms, mockBookings, addMockBooking } from './mock-data';
import { z } from 'zod';
import { format, parse, setHours, setMinutes, isBefore, isEqual } from 'date-fns';

// --- Configuration Store (Mock) ---
let currentSystemSlotDurationMinutes = 60; // Default to 60 minutes
let currentSystemStartOfDay = '09:00'; // Default start time HH:MM
let currentSystemEndOfDay = '17:00';   // Default end time HH:MM

const MIN_SLOT_DURATION = 15;
const MAX_SLOT_DURATION = 120;
// --- End Configuration Store ---

export async function updateSlotDuration(
  newDurationMinutes: number
): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 200)); 
  if (newDurationMinutes < MIN_SLOT_DURATION || newDurationMinutes > MAX_SLOT_DURATION) {
    return { success: false, error: `Duration must be between ${MIN_SLOT_DURATION} and ${MAX_SLOT_DURATION} minutes.` };
  }
  if (newDurationMinutes % 15 !== 0) { 
      return { success: false, error: 'Duration must be in multiples of 15 minutes.'}
  }
  currentSystemSlotDurationMinutes = newDurationMinutes;
  console.log(`System slot duration updated to: ${currentSystemSlotDurationMinutes} minutes.`);
  return { success: true };
}

const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:MM.");

export async function updateWorkdayHours(
  startTime: string,
  endTime: string
): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const startTimeValidation = timeStringSchema.safeParse(startTime);
  if (!startTimeValidation.success) {
    return { success: false, error: `Invalid Start Time: ${startTimeValidation.error.issues[0].message}` };
  }
  const endTimeValidation = timeStringSchema.safeParse(endTime);
  if (!endTimeValidation.success) {
    return { success: false, error: `Invalid End Time: ${endTimeValidation.error.issues[0].message}` };
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const tempDate = new Date();
  const startDateObj = setMinutes(setHours(tempDate, startH), startM);
  const endDateObj = setMinutes(setHours(tempDate, endH), endM);

  if (isEqual(startDateObj, endDateObj) || isBefore(endDateObj, startDateObj)) {
    return { success: false, error: 'End of day must be after start of day.' };
  }

  currentSystemStartOfDay = startTime;
  currentSystemEndOfDay = endTime;
  console.log(`System workday hours updated to: ${currentSystemStartOfDay} - ${currentSystemEndOfDay}.`);
  return { success: true };
}


// Placeholder for the actual AI flow function
async function callAIFlow(
  bookingDetails: { roomId: string; roomName: string; date: string; time: string; userName: string; userEmail: string },
  allRooms: Room[],
  existingBookings: Booking[],
  availableSlotsForSuggestion: TimeSlot[]
): Promise<AIResponse> {
  console.log('AI Flow called with:', bookingDetails, allRooms.length, existingBookings.length);

  const summary = `Successfully processed booking for ${bookingDetails.roomName} on ${bookingDetails.date} at ${bookingDetails.time} for ${bookingDetails.userName}.`;
  
  const suggestions: AISuggestion[] = [];

  const alternativeSlotInSameRoom = availableSlotsForSuggestion.find(
    slot => slot.startTime !== bookingDetails.time.split(' - ')[0] 
  );
  if (alternativeSlotInSameRoom) {
    suggestions.push({
      roomName: bookingDetails.roomName,
      roomId: bookingDetails.roomId,
      date: bookingDetails.date,
      time: alternativeSlotInSameRoom.display,
      reason: 'Alternative time in the same room.',
    });
  }

  const alternativeRoom = allRooms.find(r => r.id !== bookingDetails.roomId);
  if (alternativeRoom) {
    const isOriginalTimeBookedInAlternativeRoom = existingBookings.find(
        b => b.roomId === alternativeRoom.id && b.date === bookingDetails.date && b.time === bookingDetails.time
    );
    if (!isOriginalTimeBookedInAlternativeRoom) {
         suggestions.push({
            roomName: alternativeRoom.name,
            roomId: alternativeRoom.id,
            date: bookingDetails.date,
            time: bookingDetails.time, 
            reason: 'Same time, different room.',
        });
    }
  }
  
  return { summary, suggestions: suggestions.slice(0,2) };
}

function parseBookingTime(timeStr: string, date: string): { start: Date; end: Date } | null {
  const parts = timeStr.split(' - ');
  if (parts.length !== 2) return null;
  try {
    const startDate = parse(`${date} ${parts[0]}`, 'yyyy-MM-dd HH:mm', new Date());
    const endDate = parse(`${date} ${parts[1]}`, 'yyyy-MM-dd HH:mm', new Date());
    return { start: startDate, end: endDate };
  } catch (e) {
    console.error("Error parsing booking time string:", timeStr, e);
    return null;
  }
}


export async function getAvailableTimeSlots(
  roomId: string,
  date: string // YYYY-MM-DD format
): Promise<{ slots: TimeSlot[]; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 300)); 

  if (!roomId || !date) {
    return { slots: [], error: 'Room and date are required.' };
  }

  const baseDate = parse(date, 'yyyy-MM-dd', new Date());
  if (isNaN(baseDate.getTime())) {
    return { slots: [], error: 'Invalid date format provided.' };
  }

  const [startHour, startMinute] = currentSystemStartOfDay.split(':').map(Number);
  const [endHour, endMinute] = currentSystemEndOfDay.split(':').map(Number);
  
  const generatedSlots: TimeSlot[] = [];
  
  let currentTime = new Date(baseDate);
  currentTime = setHours(setMinutes(currentTime, startMinute), startHour);

  const dayEndTime = setHours(setMinutes(new Date(baseDate), endMinute), endHour);

  while (isBefore(currentTime, dayEndTime)) {
    const slotStart = new Date(currentTime);
    const slotEnd = new Date(slotStart.getTime() + currentSystemSlotDurationMinutes * 60000);

    if (isBefore(dayEndTime, slotEnd) || isEqual(dayEndTime, slotStart)) { // Ensure slot doesn't exceed or start at end time
        break; 
    }

    const formatTime = (d: Date) => format(d, 'HH:mm');
    const startTimeStr = formatTime(slotStart);
    const endTimeStr = formatTime(slotEnd);
    
    generatedSlots.push({
      startTime: startTimeStr,
      endTime: endTimeStr,
      display: `${startTimeStr} - ${endTimeStr}`,
    });

    currentTime = slotEnd;
  }
  
  const existingBookingsForRoomAndDate = mockBookings.filter(
    (booking) => booking.roomId === roomId && booking.date === date
  );

  const availableSlots = generatedSlots.filter((slot) => {
    const slotStartDateTime = parse(`${date} ${slot.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const slotEndDateTime = parse(`${date} ${slot.endTime}`, 'yyyy-MM-dd HH:mm', new Date());

    return !existingBookingsForRoomAndDate.some((booking) => {
      const existingBookingTimes = parseBookingTime(booking.time, booking.date);
      if (!existingBookingTimes) return false; 

      return slotStartDateTime < existingBookingTimes.end && slotEndDateTime > existingBookingTimes.start;
    });
  });

  return { slots: availableSlots };
}

const bookingFormSchema = z.object({
  roomId: z.string().min(1, 'Room selection is required.'),
  date: z.string().min(1, 'Date is required.'), 
  time: z.string().min(1, 'Time slot is required.'), 
  userName: z.string().min(2, 'Name must be at least 2 characters.'),
  userEmail: z.string().email('Invalid email address.'),
});

export async function submitBooking(
  formData: { roomId: string; date: string; time: string; userName: string; userEmail: string }
): Promise<{ booking?: Booking; aiResponse?: AIResponse; error?: string; fieldErrors?: Record<string, string[]> }> {
  
  const validationResult = bookingFormSchema.safeParse(formData);
  if (!validationResult.success) {
    return { error: "Validation failed", fieldErrors: validationResult.error.flatten().fieldErrors };
  }
  
  const { roomId, date, time, userName, userEmail } = validationResult.data;
  
  await new Promise(resolve => setTimeout(resolve, 700)); 

  const currentAvailability = await getAvailableTimeSlots(roomId, date);
  if (currentAvailability.error || !currentAvailability.slots.find(s => s.display === time)) {
      const room = mockRooms.find(r => r.id === roomId);
      let aiResponseForFailure: AIResponse | undefined;
      if (room) {
          try {
              aiResponseForFailure = await callAIFlow(
                  { roomId, roomName: room.name, date, time, userName, userEmail },
                  mockRooms,
                  mockBookings,
                  currentAvailability.slots || [] 
              );
          } catch (aiError) { console.error("AI flow error on booking failure:", aiError); }
      }
    return { error: 'Sorry, this time slot is no longer available or invalid. Please refresh and try again.', aiResponse: aiResponseForFailure };
  }


  const room = mockRooms.find(r => r.id === roomId);
  if (!room) {
    return { error: 'Selected room not found.' };
  }

  const newBooking: Booking = {
    id: `booking-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    roomId,
    roomName: room.name,
    date, 
    time, 
    userName,
    userEmail,
  };

  addMockBooking(newBooking);

  let aiResponse: AIResponse | undefined;
  const slotsAfterBooking = await getAvailableTimeSlots(roomId, date);

  try {
     aiResponse = await callAIFlow(
      { ...newBooking }, 
      mockRooms,
      mockBookings, 
      slotsAfterBooking.slots || [] 
    );
  } catch (aiError) {
    console.error("AI flow error:", aiError);
    aiResponse = { summary: "Booking successful! Could not generate AI summary at this time.", suggestions: [] };
  }
  
  return { booking: newBooking, aiResponse };
}

export async function getBookingsForRoomAndDate(
  roomId: string,
  date: string 
): Promise<{ bookings: Booking[]; roomName?: string; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500)); 

  if (!roomId || !date) {
    return { bookings: [], error: 'Room and date are required.' };
  }

  const room = mockRooms.find(r => r.id === roomId);
  if (!room) {
    return { bookings: [], error: 'Room not found.' };
  }

  const bookingsForRoomAndDate = mockBookings.filter(
    (booking) => booking.roomId === roomId && booking.date === date
  ).sort((a,b) => {
      const aStartTime = a.time.split(' - ')[0];
      const bStartTime = b.time.split(' - ')[0];
      return aStartTime.localeCompare(bStartTime);
  });

  return { bookings: bookingsForRoomAndDate, roomName: room.name };
}

export async function getAllBookings(): Promise<{ bookings: Booking[]; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 600)); 
  
  const sortedBookings = [...mockBookings].sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) {
      return dateComparison;
    }
    const aStartTime = a.time.split(' - ')[0];
    const bStartTime = b.time.split(' - ')[0];
    return aStartTime.localeCompare(bStartTime);
  });

  return { bookings: sortedBookings };
}

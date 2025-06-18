
'use server';

import type { Booking, Room, TimeSlot, AIResponse, AISuggestion } from '@/types';
import { mockRooms, mockBookings, addMockBooking } from './mock-data'; // allPossibleTimeSlots removed
import { z } from 'zod';
import { format, parse } from 'date-fns';

// Hypothetical AI flow import - replace with actual flow if available
// import { bookingSuggestionsFlow } from '@/ai/flows/bookingSuggestions';

// --- Configuration Store (Mock) ---
let currentSystemSlotDurationMinutes = 60; // Default to 60 minutes
const MIN_SLOT_DURATION = 15;
const MAX_SLOT_DURATION = 120; // Example max
// --- End Configuration Store ---

export async function updateSlotDuration(
  newDurationMinutes: number
): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
  if (newDurationMinutes < MIN_SLOT_DURATION || newDurationMinutes > MAX_SLOT_DURATION) {
    return { success: false, error: `Duration must be between ${MIN_SLOT_DURATION} and ${MAX_SLOT_DURATION} minutes.` };
  }
  if (newDurationMinutes % 15 !== 0) { // Example: only allow multiples of 15
      return { success: false, error: 'Duration must be in multiples of 15 minutes.'}
  }
  currentSystemSlotDurationMinutes = newDurationMinutes;
  console.log(`System slot duration updated to: ${currentSystemSlotDurationMinutes} minutes.`);
  return { success: true };
}


// Placeholder for the actual AI flow function
async function callAIFlow(
  bookingDetails: { roomId: string; roomName: string; date: string; time: string; userName: string; userEmail: string },
  allRooms: Room[],
  existingBookings: Booking[],
  availableSlotsForSuggestion: TimeSlot[] // Pass generated slots for better suggestions
): Promise<AIResponse> {
  console.log('AI Flow called with:', bookingDetails, allRooms.length, existingBookings.length);

  const summary = `Successfully processed booking for ${bookingDetails.roomName} on ${bookingDetails.date} at ${bookingDetails.time} for ${bookingDetails.userName}.`;
  
  const suggestions: AISuggestion[] = [];

  // Suggest an alternative time in the same room from the available slots
  const alternativeSlotInSameRoom = availableSlotsForSuggestion.find(
    slot => slot.startTime !== bookingDetails.time.split(' - ')[0] // A simple way to find a *different* slot
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

  // Suggest a different room at the same time (if that time is generally valid)
  const alternativeRoom = allRooms.find(r => r.id !== bookingDetails.roomId);
  if (alternativeRoom) {
    // Check if the *original* time slot is available in the alternative room
    // This requires checking existingBookings for the alternativeRoom at the original time
    const isOriginalTimeBookedInAlternativeRoom = existingBookings.find(
        b => b.roomId === alternativeRoom.id && b.date === bookingDetails.date && b.time === bookingDetails.time
    );
    if (!isOriginalTimeBookedInAlternativeRoom) {
         suggestions.push({
            roomName: alternativeRoom.name,
            roomId: alternativeRoom.id,
            date: bookingDetails.date,
            time: bookingDetails.time, // original time
            reason: 'Same time, different room.',
        });
    }
  }
  
  return { summary, suggestions: suggestions.slice(0,2) };
}

// Helper to parse "HH:mm - HH:mm" booking time string
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
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

  if (!roomId || !date) {
    return { slots: [], error: 'Room and date are required.' };
  }

  const dayStartHour = 9;
  const dayEndHour = 17; // 5 PM (exclusive for slot end)
  const generatedSlots: TimeSlot[] = [];
  
  // Parse the input date string to ensure it's a valid date object for manipulation
  const baseDate = parse(date, 'yyyy-MM-dd', new Date());
  if (isNaN(baseDate.getTime())) {
    return { slots: [], error: 'Invalid date format provided.' };
  }

  let currentTime = new Date(baseDate);
  currentTime.setHours(dayStartHour, 0, 0, 0);

  const dayEndTime = new Date(baseDate);
  dayEndTime.setHours(dayEndHour, 0, 0, 0);

  while (currentTime.getTime() < dayEndTime.getTime()) {
    const slotStart = new Date(currentTime);
    const slotEnd = new Date(slotStart.getTime() + currentSystemSlotDurationMinutes * 60000);

    if (slotEnd.getTime() > dayEndTime.getTime()) {
        break; 
    }

    const formatTime = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).replace(':',':'); // HH:MM
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
      if (!existingBookingTimes) return false; // Skip if parsing failed

      // Check for overlap: (StartA < EndB) and (EndA > StartB)
      return slotStartDateTime < existingBookingTimes.end && slotEndDateTime > existingBookingTimes.start;
    });
  });

  return { slots: availableSlots };
}

const bookingFormSchema = z.object({
  roomId: z.string().min(1, 'Room selection is required.'),
  date: z.string().min(1, 'Date is required.'), // Expecting YYYY-MM-DD string
  time: z.string().min(1, 'Time slot is required.'), // This is the display string "HH:mm - HH:mm"
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
  
  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

  // Double check availability (mitigate race conditions)
  // Re-fetch available slots for the given room and date to ensure the selected slot is still valid
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
                  currentAvailability.slots || [] // Pass current slots for suggestions
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
    date, // YYYY-MM-DD
    time, // "HH:mm - HH:mm"
    userName,
    userEmail,
  };

  addMockBooking(newBooking);

  let aiResponse: AIResponse | undefined;
  // Get fresh slots again for AI suggestions *after* booking is made
  const slotsAfterBooking = await getAvailableTimeSlots(roomId, date);

  try {
     aiResponse = await callAIFlow(
      { ...newBooking }, 
      mockRooms,
      mockBookings, // Pass current state of bookings *after* adding the new one
      slotsAfterBooking.slots || [] // Pass available slots for suggestion
    );
  } catch (aiError) {
    console.error("AI flow error:", aiError);
    aiResponse = { summary: "Booking successful! Could not generate AI summary at this time.", suggestions: [] };
  }
  
  return { booking: newBooking, aiResponse };
}

export async function getBookingsForRoomAndDate(
  roomId: string,
  date: string // YYYY-MM-DD format
): Promise<{ bookings: Booking[]; roomName?: string; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

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
  await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay
  
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


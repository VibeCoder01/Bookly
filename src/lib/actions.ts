
'use server';

import type { Booking, Room, TimeSlot, AIResponse, AISuggestion } from '@/types';
import { mockRooms, mockBookings, allPossibleTimeSlots, addMockBooking } from './mock-data';
import { z } from 'zod';
import { format } from 'date-fns';

// Hypothetical AI flow import - replace with actual flow if available
// import { bookingSuggestionsFlow } from '@/ai/flows/bookingSuggestions';

// Placeholder for the actual AI flow function
async function callAIFlow(
  bookingDetails: { roomId: string; roomName: string; date: string; time: string; userName: string; userEmail: string },
  allRooms: Room[],
  existingBookings: Booking[]
): Promise<AIResponse> {
  // This is a mock implementation of the AI flow call.
  // In a real scenario, you would call your Genkit flow here.
  // e.g., const result = await bookingSuggestionsFlow.run({ currentBookingAttempt: bookingDetails, allRooms, existingBookings });
  console.log('AI Flow called with:', bookingDetails, allRooms.length, existingBookings.length);

  // Mocked AI Response
  const summary = `Successfully processed booking for ${bookingDetails.roomName} on ${bookingDetails.date} at ${bookingDetails.time} for ${bookingDetails.userName}.`;
  
  const suggestions: AISuggestion[] = [];
  // Suggest an alternative time in the same room
  const currentSlotIndex = allPossibleTimeSlots.findIndex(s => s.display === bookingDetails.time);
  if (currentSlotIndex !== -1) {
    const nextSlot = allPossibleTimeSlots[currentSlotIndex + 1] || allPossibleTimeSlots[currentSlotIndex -1];
    if (nextSlot && !existingBookings.find(b => b.roomId === bookingDetails.roomId && b.date === bookingDetails.date && b.time === nextSlot.display)) {
      suggestions.push({
        roomName: bookingDetails.roomName,
        roomId: bookingDetails.roomId,
        date: bookingDetails.date,
        time: nextSlot.display,
        reason: 'Alternative time in the same room.',
      });
    }
  }

  // Suggest a different room at the same time
  const alternativeRoom = allRooms.find(r => r.id !== bookingDetails.roomId);
  if (alternativeRoom && !existingBookings.find(b => b.roomId === alternativeRoom.id && b.date === bookingDetails.date && b.time === bookingDetails.time)) {
    suggestions.push({
      roomName: alternativeRoom.name,
      roomId: alternativeRoom.id,
      date: bookingDetails.date,
      time: bookingDetails.time,
      reason: 'Same time, different room.',
    });
  }
  
  return { summary, suggestions: suggestions.slice(0,2) }; // Limit to 2 suggestions
}


export async function getAvailableTimeSlots(
  roomId: string,
  date: string // YYYY-MM-DD format
): Promise<{ slots: TimeSlot[]; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

  if (!roomId || !date) {
    return { slots: [], error: 'Room and date are required.' };
  }

  const existingBookingsForRoomAndDate = mockBookings.filter(
    (booking) => booking.roomId === roomId && booking.date === date
  );

  const availableSlots = allPossibleTimeSlots.filter((slot) => {
    return !existingBookingsForRoomAndDate.some((booking) => booking.time === slot.display);
  });

  return { slots: availableSlots };
}

const bookingFormSchema = z.object({
  roomId: z.string().min(1, 'Room selection is required.'),
  date: z.string().min(1, 'Date is required.'), // Expecting YYYY-MM-DD string
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
  
  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

  // Double check availability (mitigate race conditions)
  const todaysBookings = mockBookings.filter(
    (b) => b.roomId === roomId && b.date === date && b.time === time
  );

  if (todaysBookings.length > 0) {
    // Attempt to get AI suggestions even if booking fails
    const room = mockRooms.find(r => r.id === roomId);
    let aiResponse: AIResponse | undefined;
    if (room) {
      try {
        aiResponse = await callAIFlow(
        { roomId, roomName: room.name, date, time, userName, userEmail },
        mockRooms,
        mockBookings
      );
      } catch (aiError) {
        console.error("AI flow error:", aiError);
        // Don't let AI error block the process, provide a default or empty response
         aiResponse = { summary: "Could not generate AI suggestions at this time.", suggestions: [] };
      }
    }
    return { error: 'Sorry, this time slot was just booked. Please try another.', aiResponse };
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
  try {
     aiResponse = await callAIFlow(
      { ...newBooking }, // Pass all newBooking details
      mockRooms,
      mockBookings // Pass current state of bookings *after* adding the new one
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
  ).sort((a,b) => a.time.localeCompare(b.time)); // Sort by time

  return { bookings: bookingsForRoomAndDate, roomName: room.name };
}

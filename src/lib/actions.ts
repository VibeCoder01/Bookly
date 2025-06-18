
'use server';

import type { Booking, Room, TimeSlot, AIResponse, AISuggestion } from '@/types';
import { mockRooms, mockBookings, addMockBooking } from './mock-data';
import { z } from 'zod';
import { format, parse, setHours, setMinutes, isBefore, isEqual, addMinutes, startOfDay } from 'date-fns';

// --- Configuration Store (Mock) ---
// These values are updated by admin actions and used by getAvailableTimeSlots
// to dynamically generate booking slots according to administrative settings.
let currentSystemSlotDurationMinutes = 60; // Default: 60 minutes. Defines the length of each booking slot.
let currentSystemStartOfDay = '09:00'; // Default: 09:00 (HH:MM). Defines the earliest time for slot generation.
let currentSystemEndOfDay = '17:00';   // Default: 17:00 (HH:MM). Defines the latest time for slot generation.

const MIN_SLOT_DURATION = 15;
const MAX_SLOT_DURATION = 120; // Example max, can be adjusted
// --- End Configuration Store ---


export async function updateSlotDuration(
  newDurationMinutes: number
): Promise<{ success: boolean; error?: string }> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 200)); 
  if (newDurationMinutes < MIN_SLOT_DURATION || newDurationMinutes > MAX_SLOT_DURATION) {
    return { success: false, error: `Duration must be between ${MIN_SLOT_DURATION} and ${MAX_SLOT_DURATION} minutes.` };
  }
  if (newDurationMinutes % 15 !== 0) { // Example: enforce multiples of 15
      return { success: false, error: 'Duration must be in multiples of 15 minutes.'}
  }
  currentSystemSlotDurationMinutes = newDurationMinutes;
  console.log(`System slot duration updated to: ${currentSystemSlotDurationMinutes} minutes.`);
  return { success: true };
}

// Zod schema for HH:MM time string validation
const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:MM.");

export async function updateWorkdayHours(
  startTime: string,
  endTime: string
): Promise<{ success: boolean; error?: string }> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 200));

  const startTimeValidation = timeStringSchema.safeParse(startTime);
  if (!startTimeValidation.success) {
    return { success: false, error: `Invalid Start Time: ${startTimeValidation.error.issues[0].message}` };
  }
  const endTimeValidation = timeStringSchema.safeParse(endTime);
  if (!endTimeValidation.success) {
    return { success: false, error: `Invalid End Time: ${endTimeValidation.error.issues[0].message}` };
  }

  // Convert HH:MM to Date objects for comparison (using a common arbitrary date)
  const tempDate = new Date();
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

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
  availableSlotsForSuggestion: TimeSlot[] // These are individual slots
): Promise<AIResponse> {
  console.log('AI Flow called with:', bookingDetails, allRooms.length, existingBookings.length);
  // The 'time' in bookingDetails is now a range like "09:00 - 11:00"
  const summary = `Successfully processed booking for ${bookingDetails.roomName} on ${bookingDetails.date} for the period ${bookingDetails.time} for ${bookingDetails.userName}.`;
  
  const suggestions: AISuggestion[] = [];

  // Suggest an alternative single slot in the same room (basic suggestion)
  const alternativeSlotInSameRoom = availableSlotsForSuggestion.find(
    // Ensure the suggestion doesn't overlap with the time just booked.
    // This simple check might not be perfect if the booking was a range.
    // For now, it suggests any other available *individual* slot.
    slot => slot.display !== bookingDetails.time // This check needs to be smarter for ranges.
  );

  if (alternativeSlotInSameRoom) {
    suggestions.push({
      roomName: bookingDetails.roomName,
      roomId: bookingDetails.roomId,
      date: bookingDetails.date,
      time: alternativeSlotInSameRoom.display, // This is an individual slot display
      reason: 'Alternative time in the same room.',
    });
  }

  // Suggest an alternative room for the *start time* of the booked range (basic suggestion)
  const alternativeRoom = allRooms.find(r => r.id !== bookingDetails.roomId);
  if (alternativeRoom) {
    const bookedRangeStart = bookingDetails.time.split(' - ')[0];
    // Check if the first slot of the booked range is available in the alternative room
    const isOriginalStartTimeBookedInAlternativeRoom = existingBookings.some(
        b => {
            if (b.roomId === alternativeRoom.id && b.date === bookingDetails.date) {
                const existingBookingTimes = parseBookingTime(b.time, b.date);
                const requestedSlotTime = parse(`${bookingDetails.date} ${bookedRangeStart}`, 'yyyy-MM-dd HH:mm', new Date());
                 if(existingBookingTimes && requestedSlotTime) {
                    return requestedSlotTime >= existingBookingTimes.start && requestedSlotTime < existingBookingTimes.end;
                 }
            }
            return false;
        }
    );
    if (!isOriginalStartTimeBookedInAlternativeRoom) {
         suggestions.push({
            roomName: alternativeRoom.name,
            roomId: alternativeRoom.id,
            date: bookingDetails.date,
            time: `${bookedRangeStart} - ${format(addMinutes(parse(bookedRangeStart, 'HH:mm', new Date()), currentSystemSlotDurationMinutes), 'HH:mm')}`, // Suggests a single slot duration
            reason: 'Similar start time, different room.',
        });
    }
  }
  
  return { summary, suggestions: suggestions.slice(0,2) };
}

// Parses a time string like "HH:MM - HH:MM" for a given date
function parseBookingTime(timeStr: string, date: string): { start: Date; end: Date } | null {
  const parts = timeStr.split(' - ');
  if (parts.length !== 2) return null; // Expects "StartTime - EndTime"
  try {
    // Ensure date part is from the booking, time from the string
    const startDate = parse(`${date} ${parts[0]}`, 'yyyy-MM-dd HH:mm', new Date());
    const endDate = parse(`${date} ${parts[1]}`, 'yyyy-MM-dd HH:mm', new Date());
    return { start: startDate, end: endDate };
  } catch (e) {
    console.error("Error parsing booking time string:", timeStr, e);
    return null;
  }
}


// This function now generates individual time slots based on system configuration.
export async function getAvailableTimeSlots(
  roomId: string,
  date: string // YYYY-MM-DD format
): Promise<{ slots: TimeSlot[]; error?: string }> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 300)); 

  if (!roomId || !date) {
    return { slots: [], error: 'Room and date are required.' };
  }

  // Ensure the date is valid before proceeding
  const baseDate = parse(date, 'yyyy-MM-dd', new Date());
  if (isNaN(baseDate.getTime())) {
    return { slots: [], error: 'Invalid date format provided.' };
  }

  // Use administratively configured start/end of day and slot duration
  const [startHour, startMinute] = currentSystemStartOfDay.split(':').map(Number);
  const [endHour, endMinute] = currentSystemEndOfDay.split(':').map(Number);
  const configuredSlotDuration = currentSystemSlotDurationMinutes;
  
  const generatedSlots: TimeSlot[] = [];
  
  let currentTime = new Date(baseDate);
  // Set to configured start of day for the given date
  currentTime = setHours(setMinutes(currentTime, startMinute), startHour); 

  // Set to configured end of day for the given date
  const dayEndTime = setHours(setMinutes(new Date(baseDate), endMinute), endHour); 

  // Generate all possible slots for the day based on configuration
  while (isBefore(currentTime, dayEndTime)) {
    const slotStart = new Date(currentTime);
    const slotEnd = addMinutes(slotStart, configuredSlotDuration);

    // Stop if the generated slot would end after or at the day's end time
    if (isBefore(dayEndTime, slotEnd) || isEqual(dayEndTime, slotStart)) { 
        break; 
    }

    const formatTime = (d: Date) => format(d, 'HH:mm');
    const startTimeStr = formatTime(slotStart);
    const endTimeStr = formatTime(slotEnd);
    
    generatedSlots.push({
      startTime: startTimeStr,
      endTime: endTimeStr,
      display: `${startTimeStr} - ${endTimeStr}`, // This represents an individual slot
    });

    currentTime = slotEnd; // Move to the end of the current slot for the next iteration
  }
  
  // Filter out slots that are already booked
  const existingBookingsForRoomAndDate = mockBookings.filter(
    (booking) => booking.roomId === roomId && booking.date === date
  );

  const availableSlots = generatedSlots.filter((slot) => {
    // Convert current slot's start/end times to Date objects for comparison
    const slotStartDateTime = parse(`${date} ${slot.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const slotEndDateTime = parse(`${date} ${slot.endTime}`, 'yyyy-MM-dd HH:mm', new Date());

    // Check for overlap with any existing booking
    return !existingBookingsForRoomAndDate.some((booking) => {
      const existingBookingTimes = parseBookingTime(booking.time, booking.date);
      if (!existingBookingTimes) return false; // Should not happen with valid data

      // Overlap condition: (SlotStart < BookingEnd) and (SlotEnd > BookingStart)
      return slotStartDateTime < existingBookingTimes.end && slotEndDateTime > existingBookingTimes.start;
    });
  });

  return { slots: availableSlots };
}

// Zod schema for validating the booking form data on the server
const bookingSubmissionSchema = z.object({
  roomId: z.string().min(1, 'Room selection is required.'),
  date: z.string().min(1, 'Date is required.'), // Date is already formatted as YYYY-MM-DD
  startTime: timeStringSchema, // Use HH:MM schema
  endTime: timeStringSchema,   // Use HH:MM schema
  userName: z.string().min(2, 'Name must be at least 2 characters.'),
  userEmail: z.string().email('Invalid email address.'),
}).refine(data => {
    // Ensure startTime is before endTime
    // This basic string comparison works for HH:MM format if both are on the same day.
    // For more robust comparison, parse to Date objects if necessary.
    return data.startTime < data.endTime;
}, {
    message: "End time must be after start time.",
    path: ["endTime"], // Attach error to endTime field in case of failure
});


export async function submitBooking(
  formData: { roomId: string; date: string; startTime: string; endTime: string; userName: string; userEmail: string }
): Promise<{ booking?: Booking; aiResponse?: AIResponse; error?: string; fieldErrors?: Record<string, string[]> }> {
  
  const validationResult = bookingSubmissionSchema.safeParse(formData);
  if (!validationResult.success) {
    return { error: "Validation failed. Check your inputs.", fieldErrors: validationResult.error.flatten().fieldErrors };
  }
  
  const { roomId, date, startTime, endTime, userName, userEmail } = validationResult.data;
  
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 700)); 

  // --- Crucial: Re-validate the entire requested range against current availability ---
  const { slots: currentIndividualSlots, error: availabilityError } = await getAvailableTimeSlots(roomId, date);
  if (availabilityError) {
    return { error: `Could not verify slot availability: ${availabilityError}` };
  }

  // Check if all slots in the requested range [startTime, endTime) are available and contiguous
  let isRangeValid = true;
  let expectedCurrentSlotStartTime = startTime;
  const tempDateForParsing = parse(date, "yyyy-MM-dd", new Date());

  while (isBefore(parse(expectedCurrentSlotStartTime, "HH:mm", tempDateForParsing), parse(endTime, "HH:mm", tempDateForParsing))) {
    const foundSlot = currentIndividualSlots.find(s => s.startTime === expectedCurrentSlotStartTime);
    if (!foundSlot) {
      isRangeValid = false;
      break;
    }
    // Check if the found slot ends before or at the desired overall booking end time
    if (!isBefore(parse(foundSlot.endTime, "HH:mm", tempDateForParsing), parse(endTime, "HH:mm", tempDateForParsing)) && foundSlot.endTime !== endTime) {
       // This can happen if a slot ends after the desired endTime, meaning the endTime isn't a valid slot boundary
       // or the chain is broken.
       if(expectedCurrentSlotStartTime === startTime && foundSlot.endTime !== endTime){
            // If it's the first slot and its end time isn't the requested end time,
            // and we expect more slots, then we move to its end.
            // But if its end time is beyond the requested end time, it's an issue.
            // This complex case should ideally be caught by UI, but good to double check.
       }
    }
    expectedCurrentSlotStartTime = foundSlot.endTime; // Move to the end of this slot for the next check
  }
   // After the loop, if expectedCurrentSlotStartTime is not equal to endTime, it means the range was not perfectly covered.
  if (expectedCurrentSlotStartTime !== endTime) {
    isRangeValid = false;
  }


  if (!isRangeValid) {
    const roomForFailure = mockRooms.find(r => r.id === roomId);
    let aiResponseForFailure: AIResponse | undefined;
     if (roomForFailure) {
        try {
            aiResponseForFailure = await callAIFlow(
                { roomId, roomName: roomForFailure.name, date, time: `${startTime} - ${endTime}`, userName, userEmail },
                mockRooms,
                mockBookings,
                currentIndividualSlots || [] 
            );
        } catch (aiError) { console.error("AI flow error on booking failure:", aiError); }
    }
    return { error: 'Sorry, one or more time slots in the selected range are no longer available or the range is invalid. Please refresh and try again.', aiResponse: aiResponseForFailure };
  }
  // --- End of range validation ---


  const room = mockRooms.find(r => r.id === roomId);
  if (!room) {
    // This should ideally not happen if roomId is validated from a list
    return { error: 'Selected room not found.' };
  }

  const bookingTimeRangeString = `${startTime} - ${endTime}`;

  const newBooking: Booking = {
    id: `booking-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    roomId,
    roomName: room.name,
    date, 
    time: bookingTimeRangeString, // Store the combined time range
    userName,
    userEmail,
  };

  addMockBooking(newBooking);

  let aiResponse: AIResponse | undefined;
  // Get available slots *after* this booking for AI suggestions
  const slotsAfterBooking = await getAvailableTimeSlots(roomId, date);

  try {
     aiResponse = await callAIFlow(
      { ...newBooking }, // newBooking already has time as "startTime - endTime"
      mockRooms,
      mockBookings, 
      slotsAfterBooking.slots || [] 
    );
  } catch (aiError) {
    console.error("AI flow error:", aiError);
    // Fallback AI response
    aiResponse = { summary: `Booking successful for ${room.name} from ${startTime} to ${endTime}! Could not generate AI summary at this time.`, suggestions: [] };
  }
  
  return { booking: newBooking, aiResponse };
}

export async function getBookingsForRoomAndDate(
  roomId: string,
  date: string // YYYY-MM-DD
): Promise<{ bookings: Booking[]; roomName?: string; error?: string }> {
  // Simulate async operation
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
      // Sort by the start time of the booking range
      const aStartTime = a.time.split(' - ')[0];
      const bStartTime = b.time.split(' - ')[0];
      return aStartTime.localeCompare(bStartTime);
  });

  return { bookings: bookingsForRoomAndDate, roomName: room.name };
}

export async function getAllBookings(): Promise<{ bookings: Booking[]; error?: string }> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 600)); 
  
  // Sort all bookings primarily by date, then by the start time of the booking range
  const sortedBookings = [...mockBookings].sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) {
      return dateComparison;
    }
    // If dates are the same, sort by start time
    const aStartTime = a.time.split(' - ')[0];
    const bStartTime = b.time.split(' - ')[0];
    return aStartTime.localeCompare(bStartTime);
  });

  return { bookings: sortedBookings };
}

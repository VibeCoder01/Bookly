
'use server';

import type { Booking, Room, TimeSlot, AIResponse, AISuggestion, AppConfiguration } from '@/types';
import { mockRooms } from './room-data'; // Import static room data
import { getPersistedBookings, addMockBooking } from './mock-data'; // Import functions for dynamic booking data
import { readConfigurationFromFile, writeConfigurationToFile } from './config-store';
import { z } from 'zod';
import { format, parse, setHours, setMinutes, isBefore, isEqual, addMinutes } from 'date-fns';

const MIN_SLOT_DURATION = 15;
const MAX_SLOT_DURATION = 120; // Example max, can be adjusted

export async function updateSlotDuration(
  newDurationMinutes: number
): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));
  if (newDurationMinutes < MIN_SLOT_DURATION || newDurationMinutes > MAX_SLOT_DURATION) {
    return { success: false, error: `Duration must be between ${MIN_SLOT_DURATION} and ${MAX_SLOT_DURATION} minutes.` };
  }
  if (newDurationMinutes % 15 !== 0) {
    return { success: false, error: 'Duration must be in multiples of 15 minutes.' };
  }
  
  try {
    const config = await readConfigurationFromFile();
    config.slotDurationMinutes = newDurationMinutes;
    await writeConfigurationToFile(config);
    console.log(`[Bookly Config] System slot duration updated to: ${newDurationMinutes} minutes and persisted.`);
    return { success: true };
  } catch (error) {
    console.error("[Bookly Config] Error persisting slot duration:", error);
    return { success: false, error: "Failed to save slot duration." };
  }
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

  const tempDate = new Date();
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const startDateObj = setMinutes(setHours(tempDate, startH), startM);
  const endDateObj = setMinutes(setHours(tempDate, endH), endM);

  if (isEqual(startDateObj, endDateObj) || isBefore(endDateObj, startDateObj)) {
    return { success: false, error: 'End of day must be after start of day.' };
  }

  try {
    const config = await readConfigurationFromFile();
    config.startOfDay = startTime;
    config.endOfDay = endTime;
    await writeConfigurationToFile(config);
    console.log(`[Bookly Config] System workday hours updated to: ${startTime} - ${endTime} and persisted.`);
    return { success: true };
  } catch (error) {
    console.error("[Bookly Config] Error persisting workday hours:", error);
    return { success: false, error: "Failed to save workday hours." };
  }
}

export async function getCurrentConfiguration(): Promise<AppConfiguration> {
  await new Promise(resolve => setTimeout(resolve, 100));
  // This function reads the latest configuration from the config file.
  return await readConfigurationFromFile();
}

// Placeholder for the actual AI flow function
async function callAIFlow(
  bookingDetails: { roomId: string; roomName: string; date: string; time: string; userName: string; userEmail: string },
  allRooms: Room[],
  existingBookings: Booking[],
  availableSlotsForSuggestion: TimeSlot[],
  slotDurationMinutes: number
): Promise<AIResponse> {
  console.log('[Bookly AI] AI Flow called with:', bookingDetails, allRooms.length, existingBookings.length);
  const summary = `Successfully processed booking for ${bookingDetails.roomName} on ${bookingDetails.date} for the period ${bookingDetails.time} for ${bookingDetails.userName}.`;
  
  const suggestions: AISuggestion[] = [];

  const alternativeSlotInSameRoom = availableSlotsForSuggestion.find(
    slot => slot.display !== bookingDetails.time // This comparison might be tricky if bookingDetails.time is a range.
  );

  if (alternativeSlotInSameRoom) {
    suggestions.push({
      roomName: bookingDetails.roomName,
      roomId: bookingDetails.roomId,
      date: bookingDetails.date,
      time: alternativeSlotInSameRoom.display, // This is a single slot display
      reason: 'Alternative time in the same room.',
    });
  }

  const alternativeRoom = allRooms.find(r => r.id !== bookingDetails.roomId);
  if (alternativeRoom) {
    const bookedRangeStart = bookingDetails.time.split(' - ')[0]; // Assumes bookingDetails.time is "HH:MM - HH:MM"
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
            time: `${bookedRangeStart} - ${format(addMinutes(parse(bookedRangeStart, 'HH:mm', new Date()), slotDurationMinutes), 'HH:mm')}`,
            reason: 'Similar start time, different room.',
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
    console.error("[Bookly Error] Error parsing booking time string:", timeStr, e);
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
  
  // Reads the current system configuration for slot duration, start/end of day.
  const appConfig = await readConfigurationFromFile();
  const { slotDurationMinutes: configuredSlotDuration, startOfDay: currentSystemStartOfDay, endOfDay: currentSystemEndOfDay } = appConfig;

  const [startHour, startMinute] = currentSystemStartOfDay.split(':').map(Number);
  const [endHour, endMinute] = currentSystemEndOfDay.split(':').map(Number);
  
  const generatedSlots: TimeSlot[] = [];
  
  let currentTime = new Date(baseDate);
  currentTime = setHours(setMinutes(currentTime, startMinute), startHour);
  const dayEndTime = setHours(setMinutes(new Date(baseDate), endMinute), endHour);

  // Dynamically generates slots based on current configuration.
  while (isBefore(currentTime, dayEndTime)) {
    const slotStart = new Date(currentTime);
    const slotEnd = addMinutes(slotStart, configuredSlotDuration);

    if (isBefore(dayEndTime, slotEnd) || isEqual(dayEndTime, slotStart)) {
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
  
  const currentBookings = await getPersistedBookings();
  const existingBookingsForRoomAndDate = currentBookings.filter(
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

const bookingSubmissionSchema = z.object({
  roomId: z.string().min(1, 'Room selection is required.'),
  date: z.string().min(1, 'Date is required.'),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  userName: z.string().min(2, 'Name must be at least 2 characters.'),
  userEmail: z.string().email('Invalid email address.'),
}).refine(data => {
    return data.startTime < data.endTime;
}, {
    message: "End time must be after start time.",
    path: ["endTime"],
});


export async function submitBooking(
  formData: { roomId: string; date: string; startTime: string; endTime: string; userName: string; userEmail: string }
): Promise<{ booking?: Booking; aiResponse?: AIResponse; error?: string; fieldErrors?: Record<string, string[]> }> {
  
  const validationResult = bookingSubmissionSchema.safeParse(formData);
  if (!validationResult.success) {
    return { error: "Validation failed. Check your inputs.", fieldErrors: validationResult.error.flatten().fieldErrors };
  }
  
  const { roomId, date, startTime, endTime, userName, userEmail } = validationResult.data;
  
  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

  const { slots: currentIndividualSlots, error: availabilityError } = await getAvailableTimeSlots(roomId, date);
  if (availabilityError) {
    return { error: `Could not verify slot availability: ${availabilityError}` };
  }

  let isRangeValid = true;
  let expectedCurrentSlotStartTime = startTime;
  const tempDateForParsing = parse(date, "yyyy-MM-dd", new Date()); 

  while (isBefore(parse(expectedCurrentSlotStartTime, "HH:mm", tempDateForParsing), parse(endTime, "HH:mm", tempDateForParsing))) {
    const foundSlot = currentIndividualSlots.find(s => s.startTime === expectedCurrentSlotStartTime);
    if (!foundSlot) {
      isRangeValid = false;
      break;
    }
    expectedCurrentSlotStartTime = foundSlot.endTime; 
  }
  if (expectedCurrentSlotStartTime !== endTime) {
    isRangeValid = false;
  }
  
  const appConfigForAISummary = await readConfigurationFromFile();
  const allCurrentBookingsForAI = await getPersistedBookings(); // For AI flow

  if (!isRangeValid) {
    const roomForFailure = mockRooms.find(r => r.id === roomId);
    let aiResponseForFailure: AIResponse | undefined;
     if (roomForFailure) {
        try {
            aiResponseForFailure = await callAIFlow(
                { roomId, roomName: roomForFailure.name, date, time: `${startTime} - ${endTime}`, userName, userEmail },
                mockRooms,
                allCurrentBookingsForAI,
                currentIndividualSlots || [],
                appConfigForAISummary.slotDurationMinutes
            );
        } catch (aiError) { console.error("[Bookly Error] AI flow error on booking failure:", aiError); }
    }
    return { error: 'Sorry, one or more time slots in the selected range are no longer available or the range is invalid. Please refresh and try again.', aiResponse: aiResponseForFailure };
  }

  const room = mockRooms.find(r => r.id === roomId);
  if (!room) {
    return { error: 'Selected room not found.' };
  }

  const bookingTimeRangeString = `${startTime} - ${endTime}`;

  const newBooking: Booking = {
    id: `booking-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    roomId,
    roomName: room.name,
    date,
    time: bookingTimeRangeString,
    userName,
    userEmail,
  };

  await addMockBooking(newBooking); 

  let aiResponse: AIResponse | undefined;
  const slotsAfterBooking = await getAvailableTimeSlots(roomId, date); // Re-fetch for AI suggestions
  const bookingsAfterAdditionForAI = await getPersistedBookings();

  try {
     aiResponse = await callAIFlow(
      { ...newBooking }, 
      mockRooms,
      bookingsAfterAdditionForAI,
      slotsAfterBooking.slots || [],
      appConfigForAISummary.slotDurationMinutes
    );
  } catch (aiError) {
    console.error("[Bookly Error] AI flow error:", aiError);
    aiResponse = { summary: `Booking successful for ${room.name} from ${startTime} to ${endTime}! Could not generate AI summary at this time.`, suggestions: [] };
  }
  
  return { booking: newBooking, aiResponse };
}

export async function getBookingsForRoomAndDate(
  roomId: string,
  date: string // YYYY-MM-DD
): Promise<{ bookings: Booking[]; roomName?: string; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!roomId || !date) {
    return { bookings: [], error: 'Room and date are required.' };
  }

  const room = mockRooms.find(r => r.id === roomId);
  if (!room) {
    return { bookings: [], error: 'Room not found.' };
  }

  const allBookings = await getPersistedBookings();
  const bookingsForRoomAndDate = allBookings.filter(
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
  
  const allBookings = await getPersistedBookings();
  const sortedBookings = [...allBookings].sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) {
      return dateComparison;
    }
    const aStartTime = a.time.split(' - ')[0];
    const bStartTime = b.time.split(' - ')[0];
    return aStartTime.localeCompare(bStartTime);
  });
  console.log(`[Bookly Debug] getAllBookings executed. Returning ${sortedBookings.length} bookings from in-memory (file-synced) store.`);
  return { bookings: sortedBookings };
}

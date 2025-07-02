
'use server';

import type { Booking, Room, TimeSlot, AppConfiguration, RoomFormData, ExportedSettings, RoomWithDailyUsage, SlotStatus } from '@/types';
import { readConfigurationFromFile, writeConfigurationToFile } from './config-store';
import { z } from 'zod';
import { format, parse, setHours, setMinutes, isBefore, isEqual, addMinutes, isWeekend, addDays } from 'date-fns';
import fs from 'fs';
import path from 'path';
import { getPersistedBookings, addMockBooking, writeAllBookings } from './mock-data';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAME } from '@/middleware';


// --- Auth Actions ---

export async function verifyAdminPassword(password: string): Promise<{ success: boolean; error?: string }> {
  const config = await readConfigurationFromFile();
  if (password === config.adminPassword) {
    cookies().set(AUTH_COOKIE_NAME, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
    });
    return { success: true };
  } else {
    return { success: false, error: 'The password you entered is incorrect.' };
  }
}

export async function logoutAdmin() {
  cookies().delete(AUTH_COOKIE_NAME);
  redirect('/admin/login');
}


// --- Room Data Persistence ---
const ROOMS_FILE_PATH = path.join(process.cwd(), 'data', 'rooms.json');

const readRoomsFromFile = async (): Promise<Room[]> => {
  try {
    if (fs.existsSync(ROOMS_FILE_PATH)) {
      const fileContent = await fs.promises.readFile(ROOMS_FILE_PATH, 'utf-8');
      if (fileContent && fileContent.trim().length > 0) {
        return JSON.parse(fileContent) as Room[];
      }
    }
  } catch (error) {
    console.error(`[Bookly Rooms] Error reading or parsing ${ROOMS_FILE_PATH}:`, error);
  }
  // Fallback to empty array if file doesn't exist or is invalid
  return [];
};

const writeRoomsToFile = async (rooms: Room[]): Promise<void> => {
  try {
    const dataDirectory = path.dirname(ROOMS_FILE_PATH);
    if (!fs.existsSync(dataDirectory)) {
      await fs.promises.mkdir(dataDirectory, { recursive: true });
    }
    await fs.promises.writeFile(ROOMS_FILE_PATH, JSON.stringify(rooms, null, 2));
  } catch (error) {
    console.error(`[Bookly Rooms] Error writing to ${ROOMS_FILE_PATH}:`, error);
    throw new Error('Failed to write rooms to file.');
  }
};


// --- Room CRUD Actions ---
export async function getRooms(): Promise<{ rooms: Room[] }> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
    const rooms = await readRoomsFromFile();
    return { rooms };
}

const roomFormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, 'Room name must be at least 3 characters.'),
    capacity: z.coerce.number().int().positive('Capacity must be a positive number.'),
});

type RoomActionResponse = {
    success: boolean;
    error?: string;
    fieldErrors?: Record<string, string[] | undefined>;
};

export async function addRoom(formData: RoomFormData): Promise<RoomActionResponse> {
    const validation = roomFormSchema.safeParse(formData);
    if (!validation.success) {
        return { success: false, error: 'Invalid data provided.', fieldErrors: validation.error.flatten().fieldErrors };
    }
    const { name, capacity } = validation.data;
    const rooms = await readRoomsFromFile();
    const newRoom: Room = {
        id: `room-${Date.now()}`,
        name,
        capacity
    };
    rooms.push(newRoom);
    await writeRoomsToFile(rooms);
    return { success: true };
}

export async function updateRoom(formData: RoomFormData): Promise<RoomActionResponse> {
    const validation = roomFormSchema.safeParse(formData);
    if (!validation.success) {
        return { success: false, error: 'Invalid data provided.', fieldErrors: validation.error.flatten().fieldErrors };
    }
    const { id, name, capacity } = validation.data;
    if (!id) {
        return { success: false, error: 'Room ID is missing for update.' };
    }
    const rooms = await readRoomsFromFile();
    const roomIndex = rooms.findIndex(r => r.id === id);
    if (roomIndex === -1) {
        return { success: false, error: 'Room not found.' };
    }
    rooms[roomIndex] = { ...rooms[roomIndex], name, capacity };
    await writeRoomsToFile(rooms);
    return { success: true };
}

export async function deleteRoom(roomId: string): Promise<{ success: boolean; error?: string }> {
    let rooms = await readRoomsFromFile();
    const filteredRooms = rooms.filter(r => r.id !== roomId);
    if (filteredRooms.length === rooms.length) {
        return { success: false, error: 'Room not found.' };
    }

    try {
        const allBookings = await getPersistedBookings();
        const updatedBookings = allBookings.filter(booking => booking.roomId !== roomId);
        
        // Using Promise.all to run file writes concurrently. If one fails, the catch block will be triggered.
        await Promise.all([
            writeRoomsToFile(filteredRooms),
            writeAllBookings(updatedBookings)
        ]);

        return { success: true };
    } catch (error) {
        console.error(`[Delete Room Error] Failed to delete room and/or bookings for room ID ${roomId}:`, error);
        return { success: false, error: 'An error occurred while deleting the room data.' };
    }
}


// --- Configuration Actions ---
const MIN_SLOT_DURATION = 15;
const MAX_SLOT_DURATION = 120;
const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:MM.");
const DEFAULT_APP_NAME = 'Bookly';
const DEFAULT_APP_SUBTITLE = 'Room booking system';

const appConfigurationObjectSchema = z.object({
  appName: z.string().min(1, "App Name cannot be empty."),
  appSubtitle: z.string().min(1, "App Subtitle cannot be empty."),
  appLogo: z.string().optional(),
  adminPassword: z.string().min(1, "Admin password cannot be empty."),
  slotDurationMinutes: z.number()
    .min(MIN_SLOT_DURATION, `Duration must be at least ${MIN_SLOT_DURATION} minutes.`)
    .max(MAX_SLOT_DURATION, `Duration must be at most ${MAX_SLOT_DURATION} minutes.`)
    .refine(val => val % 15 === 0, 'Duration must be in multiples of 15 minutes.'),
  startOfDay: timeStringSchema,
  endOfDay: timeStringSchema,
});

const appConfigurationSchema = appConfigurationObjectSchema.refine(data => {
    const tempDate = new Date();
    const [startH, startM] = data.startOfDay.split(':').map(Number);
    const [endH, endM] = data.endOfDay.split(':').map(Number);
    const startDateObj = setMinutes(setHours(tempDate, startH), startM);
    const endDateObj = setMinutes(setHours(tempDate, endH), endM);
    return isBefore(startDateObj, endDateObj);
}, {
    message: 'End of day must be after start of day.',
    path: ['endOfDay'],
});

const appConfigurationUpdateSchema = appConfigurationObjectSchema.partial();


export async function updateAppConfiguration(
  updates: Partial<AppConfiguration>
): Promise<{ success: boolean; error?: string; fieldErrors?: Record<string, string[] | undefined> }> {
    await new Promise(resolve => setTimeout(resolve, 200));

    // If a blank password is submitted, ignore it to keep the current one.
    if (updates.adminPassword === '') {
        delete updates.adminPassword;
    }

    const currentConfig = await readConfigurationFromFile();
    
    let processedUpdates = { ...updates };
    if (processedUpdates.appName !== undefined && !processedUpdates.appName.trim()) {
      processedUpdates.appName = DEFAULT_APP_NAME;
    }
    if (processedUpdates.appSubtitle !== undefined && !processedUpdates.appSubtitle.trim()) {
      processedUpdates.appSubtitle = DEFAULT_APP_SUBTITLE;
    }
    
    const validation = appConfigurationUpdateSchema.safeParse(processedUpdates);
    if (!validation.success) {
        return { success: false, error: 'Invalid configuration data provided.', fieldErrors: validation.error.flatten().fieldErrors };
    }

    const newConfig = { ...currentConfig, ...validation.data };

    const finalValidation = appConfigurationSchema.safeParse(newConfig);
    if (!finalValidation.success) {
        return { success: false, error: 'Validation failed on merged configuration.', fieldErrors: finalValidation.error.flatten().fieldErrors };
    }

    try {
        await writeConfigurationToFile(finalValidation.data as AppConfiguration);
        console.log(`[Bookly Config] System configuration updated and persisted.`);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error("[Bookly Config] Error persisting configuration:", error);
        return { success: false, error: "Failed to save configuration." };
    }
}

export async function updateAppLogo(
  formData: FormData
): Promise<{ success: boolean; error?: string; logoPath?: string }> {
  const file = formData.get('logo') as File | null;

  if (!file || file.size === 0) {
    return { success: false, error: 'No file was selected or the file is empty.' };
  }
  
  if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload a PNG, JPG, SVG or WEBP.'}
  }

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const logoFileName = `app-logo-${Date.now()}${path.extname(file.name)}`;
    const publicDirectory = path.join(process.cwd(), 'public');

    if (!fs.existsSync(publicDirectory)) {
        await fs.promises.mkdir(publicDirectory, { recursive: true });
    }
    
    const logoPath = path.join(publicDirectory, logoFileName);
    
    const config = await readConfigurationFromFile();
    const oldLogoPath = config.appLogo; // Get old logo path before updating

    await fs.promises.writeFile(logoPath, fileBuffer);

    const newLogoPublicPath = `/${logoFileName}`;
    config.appLogo = newLogoPublicPath;
    await writeConfigurationToFile(config);
    
    // Clean up the old logo file if it exists and is one of our managed logos
    if (oldLogoPath && oldLogoPath.startsWith('/app-logo-')) {
        const oldLogoFilePath = path.join(publicDirectory, oldLogoPath.substring(1));
        try {
            if (fs.existsSync(oldLogoFilePath)) {
                await fs.promises.unlink(oldLogoFilePath);
                console.log(`[Logo Cleanup] Deleted old logo: ${oldLogoPath}`);
            }
        } catch (cleanupError) {
            // Log error but don't fail the whole operation
            console.error(`[Logo Cleanup] Failed to delete old logo file ${oldLogoPath}:`, cleanupError);
        }
    }
    
    revalidatePath('/', 'layout');

    return { success: true, logoPath: newLogoPublicPath };
  } catch (error) {
    console.error('[Logo Upload Error]', error);
    return { success: false, error: 'Failed to save the new logo.' };
  }
}

export async function revertToDefaultLogo(): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await readConfigurationFromFile();
    const oldLogoPath = config.appLogo;

    if (!oldLogoPath) {
      // No custom logo to remove, just return success.
      return { success: true };
    }

    // Update config in memory first
    config.appLogo = undefined;
    
    // Write new config to file
    await writeConfigurationToFile(config);

    // After successfully updating the config, try to delete the old file
    if (oldLogoPath.startsWith('/app-logo-')) {
        const publicDirectory = path.join(process.cwd(), 'public');
        const oldLogoFilePath = path.join(publicDirectory, oldLogoPath.substring(1));
        try {
            if (fs.existsSync(oldLogoFilePath)) {
                await fs.promises.unlink(oldLogoFilePath);
                console.log(`[Logo Cleanup] Deleted old logo: ${oldLogoPath}`);
            }
        } catch (cleanupError) {
            // This is not a critical failure, the main goal was to update the config.
            // Log it for maintenance purposes.
            console.error(`[Logo Cleanup] Non-critical error: Failed to delete old logo file ${oldLogoPath}:`, cleanupError);
        }
    }

    revalidatePath('/', 'layout'); // Revalidate all pages using the layout
    return { success: true };
  } catch (error) {
    console.error('[Revert Logo Error]', error);
    return { success: false, error: 'Failed to revert to the default logo.' };
  }
}

export async function getCurrentConfiguration(): Promise<AppConfiguration> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return await readConfigurationFromFile();
}

// --- Booking Actions ---

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
  date: string
): Promise<{ slots: TimeSlot[]; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 300));

  if (!roomId || !date) {
    return { slots: [], error: 'Room and date are required.' };
  }

  const baseDate = parse(date, 'yyyy-MM-dd', new Date());
  if (isNaN(baseDate.getTime())) {
    return { slots: [], error: 'Invalid date format provided.' };
  }
  
  const appConfig = await readConfigurationFromFile();
  const { slotDurationMinutes: configuredSlotDuration, startOfDay: currentSystemStartOfDay, endOfDay: currentSystemEndOfDay } = appConfig;

  const [startHour, startMinute] = currentSystemStartOfDay.split(':').map(Number);
  const [endHour, endMinute] = currentSystemEndOfDay.split(':').map(Number);
  
  const generatedSlots: TimeSlot[] = [];
  
  let currentTime = new Date(baseDate);
  currentTime = setHours(setMinutes(currentTime, startMinute), startHour);
  const dayEndTime = setHours(setMinutes(new Date(baseDate), endMinute), endHour);

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
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  title: z.string().min(3, 'Title must be at least 3 characters.').max(100, 'Title must be 100 characters or less.'),
  userName: z.string().min(2, 'Name must be at least 2 characters.'),
  userEmail: z.string().email('Invalid email address.'),
}).refine(data => {
    return data.startTime < data.endTime;
}, {
    message: "End time must be after start time.",
    path: ["endTime"],
});


export async function submitBooking(
  formData: { roomId: string; date: string; startTime: string; endTime: string; title: string; userName: string; userEmail: string }
): Promise<{ booking?: Booking; error?: string; fieldErrors?: Record<string, string[] | undefined> }> {
  
  const validationResult = bookingSubmissionSchema.safeParse(formData);
  if (!validationResult.success) {
    return { error: "Validation failed. Check your inputs.", fieldErrors: validationResult.error.flatten().fieldErrors };
  }
  
  const { roomId, date, startTime, endTime, title, userName, userEmail } = validationResult.data;
  
  await new Promise(resolve => setTimeout(resolve, 700));

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
  
  if (!isRangeValid) {
    return { error: 'Sorry, one or more time slots in the selected range are no longer available or the range is invalid. Please refresh and try again.' };
  }

  const { rooms } = await getRooms();
  const room = rooms.find(r => r.id === roomId);
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
    title,
    userName,
    userEmail,
  };

  await addMockBooking(newBooking); 
  
  return { booking: newBooking };
}

export async function getBookingsForRoomAndDate(
  roomId: string,
  date: string
): Promise<{ bookings: Booking[]; roomName?: string; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!roomId || !date) {
    return { bookings: [], error: 'Room and date are required.' };
  }

  const { rooms } = await getRooms();
  const room = rooms.find(r => r.id === roomId);
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

// --- Data Management Actions ---

const exportedSettingsSchema = z.object({
  appConfig: z.object({
    appName: z.string(),
    appSubtitle: z.string(),
    appLogo: z.string().optional(),
    adminPassword: z.string().optional(),
    slotDurationMinutes: z.number(),
    startOfDay: z.string(),
    endOfDay: z.string(),
  }),
  rooms: z.array(z.object({
    id: z.string(),
    name: z.string(),
    capacity: z.number(),
  })),
  bookings: z.array(z.object({
    id: z.string(),
    roomId: z.string(),
    roomName: z.string().optional(),
    title: z.string(),
    date: z.string(),
    time: z.string(),
    userName: z.string(),
    userEmail: z.string(),
  })),
});

export async function exportAllSettings(): Promise<{ success: boolean; data?: string; error?: string; }> {
  try {
    const appConfig = await readConfigurationFromFile();
    const rooms = await readRoomsFromFile();
    const allBookings = await getPersistedBookings();

    const existingRoomIds = new Set(rooms.map(room => room.id));
    const validBookings = allBookings.filter(booking => existingRoomIds.has(booking.roomId));

    const exportedData: ExportedSettings = { appConfig, rooms, bookings: validBookings };
    
    return { success: true, data: JSON.stringify(exportedData, null, 2) };
  } catch (error) {
    console.error('[Export Error]', error);
    return { success: false, error: 'Failed to export settings.' };
  }
}

export async function importAllSettings(jsonContent: string): Promise<{ success: boolean; error?: string }> {
  try {
    const parsedData = JSON.parse(jsonContent);
    const validation = exportedSettingsSchema.safeParse(parsedData);

    if (!validation.success) {
      console.error('[Import Validation Error]', validation.error.flatten());
      return { success: false, error: `Invalid file format: ${validation.error.issues[0].message}` };
    }

    const { appConfig, rooms, bookings } = validation.data;

    await Promise.all([
      writeConfigurationToFile(appConfig),
      writeRoomsToFile(rooms),
      writeAllBookings(bookings)
    ]);

    return { success: true };
  } catch (error) {
    console.error('[Import Error]', error);
    if (error instanceof SyntaxError) {
        return { success: false, error: 'Invalid JSON file. Could not parse content.' };
    }
    return { success: false, error: 'An unexpected error occurred during import.' };
  }
}

// --- Usage Calculation Action ---
export async function getRoomsWithDailyUsage(): Promise<RoomWithDailyUsage[]> {
    // 1. Fetch all data concurrently
    const [
        { rooms }, 
        allBookings, 
        appConfig
    ] = await Promise.all([
        getRooms(),
        getPersistedBookings(),
        getCurrentConfiguration()
    ]);

    // 2. Pre-calculate the next five working days
    const nextFiveWorkingDays: string[] = [];
    let currentDate = new Date(new Date().setHours(0, 0, 0, 0));
    while (nextFiveWorkingDays.length < 5) {
        if (!isWeekend(currentDate)) {
            nextFiveWorkingDays.push(format(currentDate, 'yyyy-MM-dd'));
        }
        currentDate = addDays(currentDate, 1);
    }
    
    // 3. Generate all possible time slots for a generic day once
    const generateDaySlots = () => {
        const [startHour, startMinute] = appConfig.startOfDay.split(':').map(Number);
        const [endHour, endMinute] = appConfig.endOfDay.split(':').map(Number);
        
        const slots: { startTime: string; endTime: string }[] = [];
        let slotTime = setHours(setMinutes(new Date(), startMinute), startHour);
        const dayEndTime = setHours(setMinutes(new Date(), endMinute), endHour);

        while (isBefore(slotTime, dayEndTime)) {
            const slotStart = new Date(slotTime);
            const slotEnd = addMinutes(slotStart, appConfig.slotDurationMinutes);
            if (isBefore(dayEndTime, slotEnd) || isEqual(dayEndTime, slotStart)) {
                break;
            }
            slots.push({
                startTime: format(slotStart, 'HH:mm'),
                endTime: format(slotEnd, 'HH:mm'),
            });
            slotTime = slotEnd;
        }
        return slots;
    };
    const allDaySlots = generateDaySlots();

    // 4. Pre-process bookings into a more efficient structure for lookups
    const bookingsByRoomThenDay = allBookings.reduce((acc, booking) => {
        if (!acc[booking.roomId]) {
            acc[booking.roomId] = {};
        }
        if (!acc[booking.roomId][booking.date]) {
            acc[booking.roomId][booking.date] = [];
        }
        acc[booking.roomId][booking.date].push(booking);
        return acc;
    }, {} as Record<string, Record<string, Booking[]>>);

    // 5. Main logic to build the final data structure
    const roomsWithUsage = rooms.map(room => {
        const roomBookingsByDay = bookingsByRoomThenDay[room.id] || {};
        
        const dailyUsage = nextFiveWorkingDays.map(day => {
            const bookingsForThisDay = roomBookingsByDay[day] || [];
            
            // Create a map of slots for the day, initialized as available
            const slotStatusMap: Record<string, SlotStatus> = {};
            for (const slot of allDaySlots) {
                slotStatusMap[slot.startTime] = { ...slot, isBooked: false };
            }

            // Mark slots as booked based on the day's bookings
            for (const booking of bookingsForThisDay) {
                const bookingTimes = parseBookingTime(booking.time, booking.date);
                if (!bookingTimes) continue;

                let currentSlotTime = bookingTimes.start;
                // Iterate from the booking's start time until its end time, marking each covered slot.
                while (isBefore(currentSlotTime, bookingTimes.end)) {
                    const startTimeStr = format(currentSlotTime, 'HH:mm');
                    
                    if (slotStatusMap[startTimeStr]) {
                        slotStatusMap[startTimeStr].isBooked = true;
                        slotStatusMap[startTimeStr].title = booking.title;
                        slotStatusMap[startTimeStr].userName = booking.userName;
                    }
                    
                    currentSlotTime = addMinutes(currentSlotTime, appConfig.slotDurationMinutes);
                }
            }
            
            return {
                date: day,
                slots: Object.values(slotStatusMap), // Convert map back to array
            };
        });

        return {
            ...room,
            dailyUsage
        };
    });

    return roomsWithUsage;
}

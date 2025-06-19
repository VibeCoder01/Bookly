
'use server';

import type { Booking } from '@/types';
import fs from 'fs';
import path from 'path';

// Define the path to the data directory and the bookings JSON file
const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE_PATH = path.join(DATA_DIR, 'bookings.json');

// Ensure the data directory exists
const ensureDataDirectoryExists = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const formatDateToYYYYMMDD = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const today = new Date();
const tomorrowDate = new Date(today);
tomorrowDate.setDate(today.getDate() + 1);

// Initial default bookings if the JSON file is not found or is empty
const initialBookingsData: Booking[] = [
  {
    id: 'booking-1',
    roomId: 'room-1',
    roomName: 'Conference Room Alpha',
    date: formatDateToYYYYMMDD(tomorrowDate),
    time: '10:00 - 11:00',
    userName: 'Alice Wonderland',
    userEmail: 'alice@example.com',
  },
  {
    id: 'booking-2',
    roomId: 'room-2',
    roomName: 'Meeting Room Bravo',
    date: formatDateToYYYYMMDD(tomorrowDate),
    time: '14:00 - 15:00',
    userName: 'Bob The Builder',
    userEmail: 'bob@example.com',
  },
];

// Function to load bookings from the JSON file
const loadBookings = (): Booking[] => {
  ensureDataDirectoryExists();
  try {
    if (fs.existsSync(BOOKINGS_FILE_PATH)) {
      const fileContent = fs.readFileSync(BOOKINGS_FILE_PATH, 'utf-8');
      const bookings = JSON.parse(fileContent) as Booking[];
      // Basic validation: ensure it's an array
      if (Array.isArray(bookings)) {
        console.log(`[Bookly Data] Loaded ${bookings.length} bookings from ${BOOKINGS_FILE_PATH}`);
        return bookings;
      }
      console.warn(`[Bookly Data] Invalid content in ${BOOKINGS_FILE_PATH}. Using initial data.`);
    }
  } catch (error) {
    console.error(`[Bookly Data] Error reading or parsing ${BOOKINGS_FILE_PATH}:`, error);
  }
  // If file doesn't exist, is empty, or parsing failed, save and return initial data
  console.log(`[Bookly Data] ${BOOKINGS_FILE_PATH} not found or invalid. Initializing with default bookings and creating file.`);
  fs.writeFileSync(BOOKINGS_FILE_PATH, JSON.stringify(initialBookingsData, null, 2));
  return [...initialBookingsData]; // Return a copy
};

// Function to save bookings to the JSON file
const saveBookings = async (bookings: Booking[]): Promise<void> => {
  ensureDataDirectoryExists();
  try {
    await fs.promises.writeFile(BOOKINGS_FILE_PATH, JSON.stringify(bookings, null, 2));
    console.log(`[Bookly Data] Saved ${bookings.length} bookings to ${BOOKINGS_FILE_PATH}`);
  } catch (error) {
    console.error(`[Bookly Data] Error writing to ${BOOKINGS_FILE_PATH}:`, error);
  }
};

// `mockBookings` is now initialized from the file and acts as the in-memory store,
// which is kept in sync with the file.
let mockBookings: Booking[] = loadBookings();

// Exported async function to get current bookings
export async function getPersistedBookings(): Promise<Booking[]> {
  // In a more complex scenario, this might re-read from file or a database
  // For this setup, returning the module-scoped variable is sufficient as it's updated.
  return mockBookings;
}

// Function to add a booking to the mock data and save to file
export async function addMockBooking(newBooking: Booking): Promise<void> {
  const existingIndex = mockBookings.findIndex(b => b.id === newBooking.id);
  if (existingIndex > -1) {
    mockBookings[existingIndex] = newBooking;
    console.log(`[Bookly Data] Booking with id ${newBooking.id} updated.`);
  } else {
    mockBookings.push(newBooking);
    console.log(`[Bookly Data] Booking with id ${newBooking.id} added.`);
  }
  await saveBookings(mockBookings); // Persist changes to the file
  console.log(`[Bookly Data] addMockBooking executed. Current mockBookings count: ${mockBookings.length}. Last added ID: ${newBooking.id}, Time: ${newBooking.time}`);
};

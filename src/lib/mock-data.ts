
'use server';

import type { Booking } from '@/types';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE_PATH = path.join(DATA_DIR, 'bookings.json');

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

const saveBookings = async (bookings: Booking[]): Promise<void> => {
  ensureDataDirectoryExists();
  try {
    await fs.promises.writeFile(BOOKINGS_FILE_PATH, JSON.stringify(bookings, null, 2));
    console.log(`[Bookly Data] Saved ${bookings.length} bookings to ${BOOKINGS_FILE_PATH}`);
  } catch (error) {
    console.error(`[Bookly Data] Error writing to ${BOOKINGS_FILE_PATH}:`, error);
  }
};

const loadBookings = async (): Promise<Booking[]> => {
  ensureDataDirectoryExists();
  try {
    if (fs.existsSync(BOOKINGS_FILE_PATH)) {
      const fileContent = await fs.promises.readFile(BOOKINGS_FILE_PATH, 'utf-8');
      const bookings = JSON.parse(fileContent) as Booking[];
      if (Array.isArray(bookings)) {
        console.log(`[Bookly Data] Loaded ${bookings.length} bookings from ${BOOKINGS_FILE_PATH}`);
        return bookings;
      }
      console.warn(`[Bookly Data] Invalid content in ${BOOKINGS_FILE_PATH}. Using initial data.`);
    }
  } catch (error) {
    console.error(`[Bookly Data] Error reading or parsing ${BOOKINGS_FILE_PATH}:`, error);
  }
  await saveBookings(initialBookingsData);
  return [...initialBookingsData];
};

export async function getPersistedBookings(): Promise<Booking[]> {
  return await loadBookings();
}

export async function addMockBooking(newBooking: Booking): Promise<void> {
  const currentBookings = await loadBookings();
  const existingIndex = currentBookings.findIndex(b => b.id === newBooking.id);
  if (existingIndex > -1) {
    currentBookings[existingIndex] = newBooking;
    console.log(`[Bookly Data] Booking with id ${newBooking.id} updated.`);
  } else {
    currentBookings.push(newBooking);
    console.log(`[Bookly Data] Booking with id ${newBooking.id} added.`);
  }
  await saveBookings(currentBookings);
  console.log(`[Bookly Data] addMockBooking executed. Current bookings count: ${currentBookings.length}. Last added ID: ${newBooking.id}, Time: ${newBooking.time}`);
};

export async function writeAllBookings(bookings: Booking[]): Promise<void> {
    await saveBookings(bookings);
}

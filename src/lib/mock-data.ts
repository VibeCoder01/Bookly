'use server';

import type { Booking } from '@/types';
import { readBookingsFromDb, addBookingToDb, writeAllBookingsToDb } from './sqlite-db';

export async function getPersistedBookings(): Promise<Booking[]> {
  return await readBookingsFromDb();
}

export async function addMockBooking(newBooking: Booking): Promise<void> {
  await addBookingToDb(newBooking);
}

export async function writeAllBookings(bookings: Booking[]): Promise<void> {
  await writeAllBookingsToDb(bookings);
}

'use server';

import type { AppConfiguration } from '@/types';
import { hashPassword } from './crypto';
import { readConfigFromDb, writeConfigToDb } from './sqlite-db';

const { hash: defaultHash, salt: defaultSalt } = hashPassword('password');

const DEFAULT_CONFIG: AppConfiguration = {
  appName: 'Bookly',
  appSubtitle: 'Room booking system',
  appLogo: undefined,
  adminPasswordHash: defaultHash,
  adminPasswordSalt: defaultSalt,
  slotDurationMinutes: 60,
  startOfDay: '09:00',
  endOfDay: '17:00',
  homePageScale: 'sm',
  weekStartsOnMonday: false,
  includeWeekends: false,
  showHomePageKey: true,
  showSlotStrike: true,
  allowAnonymousUsers: true,
  allowAnonymousBookingDeletion: true,
  allowAnonymousBookingEditing: true,
  allowPastBookings: true,
};

export const readConfigurationFromFile = async (): Promise<AppConfiguration> => {
  const cfg = await readConfigFromDb(DEFAULT_CONFIG);
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(cfg)) {
    sanitized[key] = value === null ? undefined : value;
  }
  if (sanitized.allowAnonymousUsers === undefined) {
    sanitized.allowAnonymousUsers = true;
  }
  if (sanitized.allowAnonymousBookingDeletion === undefined) {
    sanitized.allowAnonymousBookingDeletion = true;
  }
  if (sanitized.allowAnonymousBookingEditing === undefined) {
    sanitized.allowAnonymousBookingEditing = true;
  }
  if (sanitized.allowPastBookings === undefined) {
    sanitized.allowPastBookings = true;
  }
  return sanitized as AppConfiguration;
};

export const writeConfigurationToFile = async (config: AppConfiguration): Promise<void> => {
  const configToWrite = { ...config };
  delete configToWrite.adminPassword;
  await writeConfigToDb(configToWrite as AppConfiguration);
};

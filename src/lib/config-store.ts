'use server';

import fs from 'fs';
import path from 'path';

import type { AppConfiguration } from '@/types';
import { PANEL_COLOR_DEFAULT_VALUE, PANEL_COLOR_VALUE_SET } from './panel-colors';
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
  panelColorOverrideEnabled: false,
};

const PUBLIC_DIRECTORY = path.join(process.cwd(), 'public');
const APP_LOGO_FILE_NAME = 'app-logo.png';

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
  if (sanitized.panelColorOverrideEnabled === undefined) {
    sanitized.panelColorOverrideEnabled = false;
  }
  if (sanitized.panelColorOverride && !PANEL_COLOR_VALUE_SET.has(sanitized.panelColorOverride)) {
    sanitized.panelColorOverride = PANEL_COLOR_DEFAULT_VALUE;
  }
  return await ensureAppLogoAvailability(sanitized as AppConfiguration);
};

export const writeConfigurationToFile = async (config: AppConfiguration): Promise<void> => {
  const configToWrite = { ...config };
  delete configToWrite.adminPassword;
  await writeConfigToDb(configToWrite as AppConfiguration);
};

async function ensureAppLogoAvailability(config: AppConfiguration): Promise<AppConfiguration> {
  const logoPath = config.appLogo;

  if (!logoPath) {
    return config;
  }

  const relativeLogoPath = logoPath.startsWith('/') ? logoPath.slice(1) : logoPath;
  if (!relativeLogoPath) {
    return config;
  }

  const [relativeLogoFile] = relativeLogoPath.split('?');

  if (!relativeLogoFile) {
    return config;
  }

  const expectedFilePath = path.join(PUBLIC_DIRECTORY, relativeLogoFile);
  const logoExists = fs.existsSync(expectedFilePath);

  if (logoExists) {
    return config;
  }

  if (
    relativeLogoFile !== APP_LOGO_FILE_NAME &&
    !relativeLogoFile.startsWith('app-logo-')
  ) {
    return config;
  }

  const updatedConfig = { ...config, appLogo: undefined };

  try {
    await writeConfigurationToFile(updatedConfig);
  } catch (error) {
    console.error('[Config Store] Failed to clear missing logo reference:', error);
  }

  return updatedConfig;
}

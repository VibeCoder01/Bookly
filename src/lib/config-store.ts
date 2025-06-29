
'use server';

import fs from 'fs';
import path from 'path';
import type { AppConfiguration } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'app-config.json');

const DEFAULT_CONFIG: AppConfiguration = {
  appName: 'Bookly',
  appSubtitle: 'Room booking system',
  appLogo: undefined,
  slotDurationMinutes: 60, // Default: 60 minutes
  startOfDay: '09:00',     // Default: 09:00 (HH:MM)
  endOfDay: '17:00',       // Default: 17:00 (HH:MM)
};

// Ensure the data directory exists
const ensureDataDirectoryExists = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

export const readConfigurationFromFile = async (): Promise<AppConfiguration> => {
  ensureDataDirectoryExists();
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const fileContent = await fs.promises.readFile(CONFIG_FILE_PATH, 'utf-8');
      const config = JSON.parse(fileContent) as AppConfiguration;
      // Basic validation or merging with defaults if some keys are missing
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (error) {
    console.error(`[Bookly Config] Error reading or parsing ${CONFIG_FILE_PATH}:`, error);
  }
  // If file doesn't exist, is empty, or parsing failed, save and return default config
  console.log(`[Bookly Config] ${CONFIG_FILE_PATH} not found or invalid. Initializing with default config and creating file.`);
  await fs.promises.writeFile(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
  return { ...DEFAULT_CONFIG }; // Return a copy
};

export const writeConfigurationToFile = async (config: AppConfiguration): Promise<void> => {
  ensureDataDirectoryExists();
  try {
    await fs.promises.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
    console.log(`[Bookly Config] Configuration saved to ${CONFIG_FILE_PATH}`);
  } catch (error) {
    console.error(`[Bookly Config] Error writing to ${CONFIG_FILE_PATH}:`, error);
    throw new Error('Failed to write configuration to file.'); // Propagate error if needed
  }
};


'use server';

import fs from 'fs';
import path from 'path';
import type { AppConfiguration } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'app-config.json');

const DEFAULT_CONFIG: AppConfiguration = {
  slotDurationMinutes: 60, // Default: 60 minutes
  startOfDay: '09:00',     // Default: 09:00 (HH:MM)
  endOfDay: '17:00',       // Default: 17:00 (HH:MM)
};

// Ensure the data directory exists
const ensureDataDirectoryExists = async () => {
    try {
        await fs.promises.access(DATA_DIR);
    } catch {
        await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
};

export const readConfigurationFromFile = async (): Promise<AppConfiguration> => {
  await ensureDataDirectoryExists();
  try {
    // Attempt to read and parse the configuration file.
    const fileContent = await fs.promises.readFile(CONFIG_FILE_PATH, 'utf-8');
    const config = JSON.parse(fileContent) as AppConfiguration;
    // Merge with defaults to ensure all required keys are present.
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    // If reading or parsing fails for any reason (e.g., file not found, corrupt JSON),
    // log the issue and fall back to the default configuration.
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[Bookly Config] Could not read or parse config file. Reason: ${errorMessage}. Re-initializing with defaults.`);
    
    try {
      // Attempt to write the default configuration to fix the issue for subsequent loads.
      await fs.promises.writeFile(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
      console.log(`[Bookly Config] Default configuration has been written to ${CONFIG_FILE_PATH}.`);
    } catch (writeError) {
      // If writing the default config fails, log a more severe error.
      const writeErrorMessage = writeError instanceof Error ? writeError.message : String(writeError);
      console.error(`[Bookly Config] FATAL: Could not write default config file. Reason: ${writeErrorMessage}`);
    }
    
    // Return a copy of the default configuration for the current request.
    return { ...DEFAULT_CONFIG };
  }
};


export const writeConfigurationToFile = async (config: AppConfiguration): Promise<void> => {
  await ensureDataDirectoryExists();
  try {
    await fs.promises.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
    console.log(`[Bookly Config] Configuration saved to ${CONFIG_FILE_PATH}`);
  } catch (error) {
    console.error(`[Bookly Config] Error writing to ${CONFIG_FILE_PATH}:`, error);
    throw new Error('Failed to write configuration to file.'); // Propagate error if needed
  }
};

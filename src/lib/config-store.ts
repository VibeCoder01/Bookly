
'use server';

import fs from 'fs';
import path from 'path';
import type { AppConfiguration } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'app-config.json');

const DEFAULT_CONFIG: AppConfiguration = {
  slotDurationMinutes: 60,
  startOfDay: '09:00',
  endOfDay: '17:00',
};

// Ensure the data directory exists
const ensureDataDirectoryExists = async () => {
    try {
        await fs.promises.access(DATA_DIR);
    } catch {
        await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
};

const writeDefaultConfigFile = async (): Promise<void> => {
    try {
      await fs.promises.writeFile(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
      console.log(`[Bookly Config] Default configuration has been written to ${CONFIG_FILE_PATH}.`);
    } catch (writeError) {
      const writeErrorMessage = writeError instanceof Error ? writeError.message : String(writeError);
      console.error(`[Bookly Config] FATAL: Could not write default config file. Reason: ${writeErrorMessage}`);
    }
}

export const readConfigurationFromFile = async (): Promise<AppConfiguration> => {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.promises.readFile(CONFIG_FILE_PATH, 'utf-8');
    const parsedConfig = JSON.parse(fileContent);
    // Return the parsed config merged with defaults to ensure all keys exist.
    return { ...DEFAULT_CONFIG, ...parsedConfig };
  } catch (error) {
    // If any error occurs during read/parse, create the default file and return defaults.
    console.warn(`[Bookly Config] Could not read or parse config file. Re-initializing with defaults.`, error);
    await writeDefaultConfigFile();
    return DEFAULT_CONFIG;
  }
};


export const writeConfigurationToFile = async (config: AppConfiguration): Promise<void> => {
  await ensureDataDirectoryExists();
  try {
    await fs.promises.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
    console.log(`[Bookly Config] Configuration saved to ${CONFIG_FILE_PATH}`);
  } catch (error) {
    console.error(`[Bookly Config] Error writing to ${CONFIG_FILE_PATH}:`, error);
    throw new Error('Failed to write configuration to file.');
  }
};

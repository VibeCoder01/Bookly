
'use server';

import fs from 'fs';
import path from 'path';
import type { AppConfiguration } from '@/types';
import { hashPassword } from './crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'app-config.json');

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
};

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
      let loadedConfig = JSON.parse(fileContent) as Partial<AppConfiguration>;
      
      let needsWrite = false;

      // One-time Migration from plaintext password to hash
      if (loadedConfig.adminPassword && !loadedConfig.adminPasswordHash) {
        console.log('[Bookly Config] Migrating plaintext password to hash.');
        const { hash, salt } = hashPassword(loadedConfig.adminPassword);
        loadedConfig.adminPasswordHash = hash;
        loadedConfig.adminPasswordSalt = salt;
        delete loadedConfig.adminPassword;
        needsWrite = true;
      }

      const config: AppConfiguration = { ...DEFAULT_CONFIG, ...loadedConfig };
      
      if (!config.appName?.trim()) {
        config.appName = DEFAULT_CONFIG.appName;
      }
      if (!config.appSubtitle?.trim()) {
        config.appSubtitle = DEFAULT_CONFIG.appSubtitle;
      }

      if (needsWrite) {
        await fs.promises.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
      }

      return config;
    }
  } catch (error) {
    console.error(`[Bookly Config] Error reading or parsing ${CONFIG_FILE_PATH}:`, error);
  }

  await fs.promises.writeFile(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
  return { ...DEFAULT_CONFIG };
};

export const writeConfigurationToFile = async (config: AppConfiguration): Promise<void> => {
  ensureDataDirectoryExists();
  try {
    const configToWrite = { ...config };
    delete configToWrite.adminPassword;

    await fs.promises.writeFile(CONFIG_FILE_PATH, JSON.stringify(configToWrite, null, 2));
  } catch (error) {
    console.error(`[Bookly Config] Error writing to ${CONFIG_FILE_PATH}:`, error);
    throw new Error('Failed to write configuration to file.');
  }
};

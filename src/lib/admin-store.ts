'use server';

import fs from 'fs';
import path from 'path';
import type { AdminAccount } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const ADMINS_FILE_PATH = path.join(DATA_DIR, 'admins.json');

const DEFAULT_ADMINS: AdminAccount[] = [
  {
    username: 'sysadmin',
    password: 'password',
    permissions: ['*'],
    requirePasswordChange: true,
  },
];

const ensureDataDirectoryExists = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

export const readAdminsFromFile = async (): Promise<AdminAccount[]> => {
  ensureDataDirectoryExists();
  try {
    if (fs.existsSync(ADMINS_FILE_PATH)) {
      const fileContent = await fs.promises.readFile(ADMINS_FILE_PATH, 'utf-8');
      if (fileContent && fileContent.trim().length > 0) {
        return JSON.parse(fileContent) as AdminAccount[];
      }
    }
  } catch (error) {
    console.error(`[Bookly Admins] Error reading or parsing ${ADMINS_FILE_PATH}:`, error);
  }
  await fs.promises.writeFile(ADMINS_FILE_PATH, JSON.stringify(DEFAULT_ADMINS, null, 2));
  return [...DEFAULT_ADMINS];
};

export const writeAdminsToFile = async (admins: AdminAccount[]): Promise<void> => {
  ensureDataDirectoryExists();
  await fs.promises.writeFile(ADMINS_FILE_PATH, JSON.stringify(admins, null, 2));
};

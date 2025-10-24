'use server';

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { Room, Booking, AppConfiguration } from '@/types';

let SQLITE_CMD = 'sqlite3';
export async function setSqliteCliPath(path: string): Promise<void> {
  SQLITE_CMD = path || 'sqlite3';
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'bookly.sqlite');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  try {
    execFileSync(SQLITE_CMD, [DB_PATH, `
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      roomName TEXT,
      title TEXT,
      date TEXT,
      time TEXT,
      userName TEXT,
      userEmail TEXT
    );
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS admins (
      username TEXT PRIMARY KEY,
      passwordHash TEXT NOT NULL,
      passwordSalt TEXT NOT NULL,
      isPrimary INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      passwordHash TEXT NOT NULL,
      passwordSalt TEXT NOT NULL
    );
  `]);
  } catch (err) {
    console.error('[SQLite] Failed to initialize database using command', SQLITE_CMD, err);
    throw new Error('SQLite CLI not found or failed to run. Please install sqlite3 and ensure it is in your PATH.');
  }
}

function run(sql: string) {
  ensureDb();
  try {
    execFileSync(SQLITE_CMD, [DB_PATH, sql]);
  } catch (err) {
    console.error('[SQLite] Error executing SQL', err);
    throw new Error('Failed to execute sqlite3 command. Make sure the sqlite3 CLI is installed and accessible.');
  }
}

function query(sql: string) {
  ensureDb();
  try {
    const result = execFileSync(SQLITE_CMD, ['-json', DB_PATH, sql], { encoding: 'utf8' }).trim();
    return result ? JSON.parse(result) : [];
  } catch (err) {
    console.error('[SQLite] Error querying database', err);
    throw new Error('Failed to query sqlite database. Ensure sqlite3 CLI is installed.');
  }
}

const esc = (v: any) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return v.toString();
  return `'${String(v).replace(/'/g, "''")}'`;
};

export async function readRoomsFromDb(): Promise<Room[]> {
  return query('SELECT id, name, capacity FROM rooms;');
}

export async function writeRoomsToDb(rooms: Room[]): Promise<void> {
  const stmts = ['BEGIN;', 'DELETE FROM rooms;'];
  for (const r of rooms) {
    stmts.push(`INSERT INTO rooms (id,name,capacity) VALUES (${esc(r.id)}, ${esc(r.name)}, ${r.capacity});`);
  }
  stmts.push('COMMIT;');
  run(stmts.join(' '));
}

export async function readBookingsFromDb(): Promise<Booking[]> {
  return query('SELECT id, roomId, roomName, title, date, time, userName, userEmail FROM bookings;');
}

export async function addBookingToDb(b: Booking): Promise<void> {
  run(`INSERT OR REPLACE INTO bookings (id, roomId, roomName, title, date, time, userName, userEmail) VALUES (${esc(b.id)}, ${esc(b.roomId)}, ${esc(b.roomName)}, ${esc(b.title)}, ${esc(b.date)}, ${esc(b.time)}, ${esc(b.userName)}, ${esc(b.userEmail)});`);
}

export async function writeAllBookingsToDb(bookings: Booking[]): Promise<void> {
  const stmts = ['BEGIN;', 'DELETE FROM bookings;'];
  for (const b of bookings) {
    stmts.push(`INSERT INTO bookings (id, roomId, roomName, title, date, time, userName, userEmail) VALUES (${esc(b.id)}, ${esc(b.roomId)}, ${esc(b.roomName)}, ${esc(b.title)}, ${esc(b.date)}, ${esc(b.time)}, ${esc(b.userName)}, ${esc(b.userEmail)});`);
  }
  stmts.push('COMMIT;');
  run(stmts.join(' '));
}

export async function readConfigFromDb(defaults: AppConfiguration): Promise<AppConfiguration> {
  const rows = query('SELECT key, value FROM app_config;');
  const cfg: any = { ...defaults };
  for (const r of rows) {
    try {
      cfg[r.key] = JSON.parse(r.value);
    } catch {
      cfg[r.key] = r.value;
    }
  }
  return cfg as AppConfiguration;
}

export async function writeConfigToDb(cfg: AppConfiguration): Promise<void> {
  const stmts = ['BEGIN;'];
  for (const [k,v] of Object.entries(cfg)) {
    stmts.push(`INSERT OR REPLACE INTO app_config (key, value) VALUES (${esc(k)}, ${esc(JSON.stringify(v))});`);
  }
  stmts.push('COMMIT;');
  run(stmts.join(' '));
}

// --- Admin Users ---
import type { AdminUser, AppUser } from '@/types';

export async function readAdminUsersFromDb(): Promise<AdminUser[]> {
  return query('SELECT username, passwordHash, passwordSalt, isPrimary FROM admins;');
}

export async function getAdminUser(username: string): Promise<AdminUser | undefined> {
  const rows = query(`SELECT username, passwordHash, passwordSalt, isPrimary FROM admins WHERE username = ${esc(username)} LIMIT 1;`);
  return rows[0] as AdminUser | undefined;
}

export async function addAdminUserToDb(user: AdminUser): Promise<void> {
  run(`INSERT OR REPLACE INTO admins (username, passwordHash, passwordSalt, isPrimary) VALUES (${esc(user.username)}, ${esc(user.passwordHash)}, ${esc(user.passwordSalt)}, ${user.isPrimary ? 1 : 0});`);
}

export async function deleteAdminUser(username: string): Promise<void> {
  run(`DELETE FROM admins WHERE username = ${esc(username)};`);
}

export async function renameAdminUser(oldUsername: string, newUsername: string): Promise<void> {
  run(`UPDATE admins SET username = ${esc(newUsername)} WHERE username = ${esc(oldUsername)};`);
}

// --- App Users ---

export async function readAppUsersFromDb(): Promise<AppUser[]> {
  return query('SELECT username, passwordHash, passwordSalt FROM users;');
}

export async function getAppUser(username: string): Promise<AppUser | undefined> {
  const rows = query(`SELECT username, passwordHash, passwordSalt FROM users WHERE username = ${esc(username)} LIMIT 1;`);
  return rows[0] as AppUser | undefined;
}

export async function addAppUserToDb(user: AppUser): Promise<void> {
  run(`INSERT OR REPLACE INTO users (username, passwordHash, passwordSalt) VALUES (${esc(user.username)}, ${esc(user.passwordHash)}, ${esc(user.passwordSalt)});`);
}

export async function deleteAppUser(username: string): Promise<void> {
  run(`DELETE FROM users WHERE username = ${esc(username)};`);
}

export async function renameAppUser(oldUsername: string, newUsername: string): Promise<void> {
  run(`UPDATE users SET username = ${esc(newUsername)} WHERE username = ${esc(oldUsername)};`);
}

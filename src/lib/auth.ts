'use server';

import type { User, UserFormData } from '@/types';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_FILE_PATH = path.join(process.cwd(), 'data', 'users.json');

// --- Password Utilities ---
export async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, 10);
  return hash;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
      return false;
  }
  const isMatch = await bcrypt.compare(password, hash);
  return isMatch;
}

// --- User Data Persistence ---
const ensureDataDirectoryExists = async () => {
    const dataDir = path.dirname(USERS_FILE_PATH);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
};

async function createDefaultMasterAdmin(): Promise<User> {
    const masterAdmin: User = {
        id: 'user-master-001',
        username: 'admin',
        passwordHash: '', // No password hash on initial creation to trigger setup flow
        role: 'master',
        permissions: {
            canManageRooms: true,
            canManageConfig: true,
            canManageData: true,
        },
    };
    return masterAdmin;
}

export async function readUsersFromFile(): Promise<User[]> {
    await ensureDataDirectoryExists();
    try {
        const fileContent = await fs.readFile(USERS_FILE_PATH, 'utf-8');
        const users = JSON.parse(fileContent) as User[];
        // Handle case where file exists but is empty
        if (users.length === 0) {
             throw new Error("User file is empty, will re-initialize.");
        }
        return users;
    } catch (error: any) {
        // If file doesn't exist or is empty/corrupt, create it with the default admin
        if (error.code === 'ENOENT' || error instanceof SyntaxError || error.message.includes("User file is empty")) {
            console.log(`[Bookly Auth] users.json not found or is invalid. Creating with default master admin.`);
            const masterAdmin = await createDefaultMasterAdmin();
            const users = [masterAdmin];
            await writeUsersToFile(users);
            return users;
        }
        console.error(`[Bookly Auth] Error reading or parsing ${USERS_FILE_PATH}:`, error);
        return [];
    }
}

async function writeUsersToFile(users: User[]): Promise<void> {
    await ensureDataDirectoryExists();
    try {
        await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error(`[Bookly Auth] Error writing to ${USERS_FILE_PATH}:`, error);
        throw new Error('Failed to save user data.');
    }
}

// --- User CRUD Operations ---
export async function getUserByUsername(username: string): Promise<User | undefined> {
  const users = await readUsersFromFile();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export async function getUserById(userId: string): Promise<User | undefined> {
    const users = await readUsersFromFile();
    return users.find(u => u.id === userId);
}

export async function addUser(userData: Omit<UserFormData, 'id'>): Promise<{ success: boolean; error?: string }> {
    const users = await readUsersFromFile();
    
    if (await getUserByUsername(userData.username)) {
        return { success: false, error: 'Username already exists.' };
    }
    if (!userData.password) {
        return { success: false, error: 'Password is required for a new user.' };
    }

    const newUser: User = {
        id: `user-${Date.now()}`,
        username: userData.username,
        passwordHash: await hashPassword(userData.password),
        role: 'admin', // Only 'admin' role can be created
        permissions: userData.permissions,
    };

    users.push(newUser);
    await writeUsersToFile(users);
    return { success: true };
}

export async function updateUser(userId: string, userData: UserFormData): Promise<{ success: boolean; error?: string }> {
    const users = await readUsersFromFile();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { success: false, error: 'User not found.' };
    }
    
    const existingUser = users[userIndex];

    // Check for username conflict if it's being changed
    if (userData.username.toLowerCase() !== existingUser.username.toLowerCase()) {
        if (await getUserByUsername(userData.username)) {
            return { success: false, error: 'Username already exists.' };
        }
    }

    // Update fields
    users[userIndex].username = userData.username;
    users[userIndex].permissions = userData.permissions;
    
    if (userData.password) {
        users[userIndex].passwordHash = await hashPassword(userData.password);
    }

    await writeUsersToFile(users);
    return { success: true };
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<{ success: boolean, error?: string }> {
    if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
    }
    const users = await readUsersFromFile();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, error: 'User not found.' };
    }
    users[userIndex].passwordHash = await hashPassword(newPassword);
    await writeUsersToFile(users);
    return { success: true };
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    let users = await readUsersFromFile();
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
        return { success: false, error: 'User not found.' };
    }
    if (userToDelete.role === 'master') {
        return { success: false, error: 'The Master Admin account cannot be deleted.' };
    }

    const filteredUsers = users.filter(u => u.id !== userId);
    await writeUsersToFile(filteredUsers);
    return { success: true };
}

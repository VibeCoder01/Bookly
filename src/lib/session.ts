'use server';

import type { SessionPayload, User } from '@/types';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { redirect } from 'next/navigation';

// In a real application, this secret MUST be stored in environment variables.
// e.g., process.env.SESSION_SECRET
// For this project, we'll hardcode it but strongly advise against it for production.
const SESSION_SECRET = 'your-super-secret-key-that-is-at-least-32-characters-long';
const key = new TextEncoder().encode(SESSION_SECRET);

const SESSION_COOKIE_NAME = 'bookly_session';
const SESSION_DURATION_HOURS = 8;

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_HOURS}h`)
    .sign(key);
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    console.error('Failed to verify session:', error);
    return null;
  }
}

export async function createSession(user: User) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  const sessionPayload: SessionPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    permissions: user.permissions,
    expiresAt,
  };

  const session = await encrypt(sessionPayload);

  cookies().set(SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = await decrypt(cookie);
  return session;
}

export async function deleteSession() {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect('/login');
}


import crypto from 'crypto';

const HASH_ALGORITHM = 'sha256';
const HASH_ITERATIONS = 100000;
const HASH_KEYLEN = 64;
const SALT_BYTES = 16;

type PasswordHashResult = {
  hash: string;
  salt: string;
};

/**
 * Hashes a password using PBKDF2.
 * @param password The plaintext password to hash.
 * @returns An object containing the generated hash and salt.
 */
export function hashPassword(password: string): PasswordHashResult {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_ALGORITHM).toString('hex');
  return { hash, salt };
}

/**
 * Verifies a plaintext password against a stored hash and salt.
 * @param password The plaintext password to verify.
 * @param hash The stored password hash.
 * @param salt The stored salt.
 * @returns True if the password is correct, false otherwise.
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const hashToCompare = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_ALGORITHM).toString('hex');
    // Use timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashToCompare));
  } catch (error) {
    console.error("Error during password verification:", error);
    return false;
  }
}

/**
 * SHA256 Hashing Utilities
 * Uses Web Crypto API for client-side hashing
 * 
 * This module provides secure hashing functions that work
 * in both browser and Node.js environments
 */

/**
 * Convert ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * SHA256 hash using Web Crypto API (browser-compatible)
 * @param input - The string to hash
 * @returns Promise<string> - The hex-encoded hash
 */
export async function sha256(input: string): Promise<string> {
  // Use Web Crypto API (works in browser and modern Node.js)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return arrayBufferToHex(hashBuffer);
  }
  
  // Fallback for Node.js environments without Web Crypto
  if (typeof require !== 'undefined') {
    // Dynamic import to avoid bundling issues
    const nodeCrypto = await import('crypto');
    return nodeCrypto.createHash('sha256').update(input).digest('hex');
  }
  
  throw new Error('No crypto implementation available');
}

/**
 * SHA256 hash (synchronous version for server-side only)
 * @param input - The string to hash
 * @returns string - The hex-encoded hash
 */
export function sha256Sync(input: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require('crypto');
  return nodeCrypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Hash with salt (for additional security)
 * @param input - The string to hash
 * @param salt - The salt to add
 * @returns Promise<string> - The hex-encoded hash
 */
export async function sha256WithSalt(input: string, salt: string): Promise<string> {
  return sha256(salt + input);
}

/**
 * Verify a hash matches an input
 * @param input - The original input
 * @param expectedHash - The hash to compare against
 * @returns Promise<boolean> - Whether the hashes match
 */
export async function verifyHash(input: string, expectedHash: string): Promise<boolean> {
  const actualHash = await sha256(input);
  return actualHash === expectedHash;
}

export default sha256;

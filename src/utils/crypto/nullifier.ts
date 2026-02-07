/**
 * Nullifier Hash Generation
 * 
 * Implements the User_Nullifier = SHA256(email + secret_phrase) formula
 * This is the core identity mechanism for the Citadel of Truth
 * 
 * Key Properties:
 * - Same email + same phrase = same hash (deterministic)
 * - Hash is irreversible (can't recover email or phrase)
 * - Works client-side only (server never sees credentials)
 */

import { sha256 } from './hash';

/**
 * Generate a nullifier hash from email and secret phrase
 * This is the primary identity mechanism
 * 
 * @param email - User's .edu email address
 * @param secretPhrase - User's secret phrase (brain wallet)
 * @returns Promise<string> - The nullifier hash
 */
export async function generateNullifier(
  email: string,
  secretPhrase: string
): Promise<string> {
  // Normalize inputs for consistency
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhrase = secretPhrase.trim();
  
  // Combine with a separator to prevent collision attacks
  // e.g., "test@edu" + "phrase" vs "test@e" + "duphrase"
  const combined = `${normalizedEmail}||${normalizedPhrase}`;
  
  // Generate SHA256 hash
  return sha256(combined);
}

/**
 * Generate a vote nullifier to prevent double voting
 * Combines user nullifier with rumor ID
 * 
 * @param userNullifier - The user's nullifier hash
 * @param rumorId - The rumor being voted on
 * @returns Promise<string> - The vote nullifier hash
 */
export async function generateVoteNullifier(
  userNullifier: string,
  rumorId: string
): Promise<string> {
  const combined = `vote:${userNullifier}:${rumorId}`;
  return sha256(combined);
}

/**
 * Verify that a nullifier matches given credentials
 * Used for client-side verification during login
 * 
 * @param email - User's email
 * @param secretPhrase - User's secret phrase
 * @param expectedNullifier - The expected nullifier hash
 * @returns Promise<boolean> - Whether the nullifier matches
 */
export async function verifyNullifier(
  email: string,
  secretPhrase: string,
  expectedNullifier: string
): Promise<boolean> {
  const generatedNullifier = await generateNullifier(email, secretPhrase);
  return generatedNullifier === expectedNullifier;
}

/**
 * Generate a partial hash for OTP verification
 * This is used to link OTP verification to future nullifier creation
 * without revealing the full email
 * 
 * @param email - User's email
 * @returns Promise<string> - A partial hash of the email
 */
export async function generateEmailHash(email: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  return sha256(`email:${normalizedEmail}`);
}

export default generateNullifier;

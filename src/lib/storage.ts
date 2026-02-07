// Client-side storage utility for managing nullifier hash
// Handles localStorage operations with type safety

const STORAGE_KEY = 'citadel_nullifier_hash';
const SESSION_KEY = 'citadel_session';

export interface SessionData {
  nullifierHash: string;
  reputationScore?: number;
  lastActive?: string;
  loggedInAt?: string;
}

/**
 * Store the nullifier hash in localStorage
 */
export function setNullifierHash(hash: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, hash);
}

/**
 * Store the nullifier hash in localStorage (alias)
 */
export function storeNullifierHash(hash: string): void {
  setNullifierHash(hash);
}

/**
 * Retrieve the nullifier hash from localStorage
 */
export function getNullifierHash(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Remove the nullifier hash from localStorage
 */
export function clearNullifierHash(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if user is logged in (has stored nullifier)
 */
export function isLoggedIn(): boolean {
  return getNullifierHash() !== null;
}

/**
 * Store session data
 */
export function setSession(data: SessionData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

/**
 * Store session data (alias)
 */
export function storeSession(data: SessionData): void {
  setSession(data);
}

/**
 * Get session data
 */
export function getSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Clear all session data
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Update session with new reputation score
 */
export function updateReputationScore(score: number): void {
  const session = getSession();
  if (session) {
    storeSession({
      ...session,
      reputationScore: score,
      lastActive: new Date().toISOString(),
    });
  }
}

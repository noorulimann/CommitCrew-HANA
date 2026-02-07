/**
 * Server-side initialization module
 * This handles startup tasks like initializing the state commitment cron job
 */

import { initializeStateCommitmentCron } from '@/services/integrity/cron';

let initialized = false;

/**
 * Initialize all server-side services
 * Should be called once when the server starts
 */
export function initializeServer(): void {
  if (initialized) {
    console.log('Server already initialized');
    return;
  }

  try {
    // Initialize state commitment cron job
    initializeStateCommitmentCron();

    initialized = true;
    console.log('✅ Server initialization complete');
  } catch (error) {
    console.error('❌ Server initialization error:', error);
  }
}

export function isServerInitialized(): boolean {
  return initialized;
}

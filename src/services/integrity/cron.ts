import cron, { ScheduledTask } from 'node-cron';
import { StateCommitmentService } from './state-commitment';

/**
 * State Commitment Cron Job
 * Runs every hour to create a state commitment
 */

let cronJob: ScheduledTask | null = null;

/**
 * Initialize the state commitment cron job
 * Schedule: Every hour at minute 0
 * Format: 0 * * * * (0 seconds, every hour, every day)
 */
export function initializeStateCommitmentCron(): void {
  // Only initialize in production or if explicitly enabled
  if (process.env.NODE_ENV === 'development' && !process.env.ENABLE_CRON) {
    console.log('⏭️  State commitment cron disabled in development');
    return;
  }

  cronJob = cron.schedule('0 * * * *', async () => {
    console.log(
      '⏰ Running state commitment job at',
      new Date().toISOString()
    );

    try {
      const commitment = await StateCommitmentService.createHourlyCommitment();

      if (commitment) {
        console.log(
          `✅ State commitment successful: ${commitment.rootHash}`
        );
      } else {
        console.warn('⚠️  State commitment returned null');
      }
    } catch (error) {
      console.error('❌ State commitment job failed:', error);
    }
  });

  console.log('✅ State commitment cron job initialized');
}

/**
 * Stop the state commitment cron job
 */
export function stopStateCommitmentCron(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob.destroy();
    cronJob = null;
    console.log('🛑 State commitment cron job stopped');
  }
}

/**
 * Get current cron job status
 */
export function getStateCommitmentCronStatus(): {
  isRunning: boolean;
  nextRun?: Date;
} {
  if (!cronJob) {
    return { isRunning: false };
  }

  // Calculate next run time (every hour at :00)
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1);
  nextHour.setMinutes(0);
  nextHour.setSeconds(0);
  nextHour.setMilliseconds(0);

  return {
    isRunning: true,
    nextRun: nextHour,
  };
}

/**
 * Trigger state commitment immediately (for testing/manual triggers)
 */
export async function triggerStateCommitmentNow(): Promise<any> {
  console.log('🚀 Manually triggering state commitment');
  return await StateCommitmentService.createHourlyCommitment();
}

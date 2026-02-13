/**
 * Stale Lock Cleanup Job
 * Periodically checks for and releases stale locks
 */

import LockService from '../services/LockService.js';

/**
 * Stale Lock Cleanup Job
 * Periodically checks for and releases stale locks
 */
class StaleLockCleanupJob {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the background job
   * @param {number} intervalMinutes - Interval in minutes between cleanup runs (default 60)
   * @param {number} timeoutHours - Lock timeout duration in hours (default 24)
   */
  start(intervalMinutes: number = 60, timeoutHours: number = 24): void {
    if (this.isRunning) {
      console.warn('Stale lock cleanup job is already running');
      return;
    }

    this.isRunning = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(
      `Starting stale lock cleanup job (interval: ${intervalMinutes} minutes, timeout: ${timeoutHours} hours)`
    );

    // Run immediately on start
    this.runCleanup(timeoutHours);

    // Schedule periodic runs
    this.intervalId = setInterval(() => {
      this.runCleanup(timeoutHours);
    }, intervalMs);
  }

  /**
   * Stop the background job
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('Stale lock cleanup job is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('Stale lock cleanup job stopped');
  }

  /**
   * Run the cleanup operation
   * @param {number} timeoutHours - Lock timeout duration in hours
   */
  private async runCleanup(timeoutHours: number): Promise<void> {
    try {
      const startTime = Date.now();
      const releasedCount = await LockService.releaseStaleLocks(timeoutHours);
      const duration = Date.now() - startTime;

      console.log(
        `Stale lock cleanup completed: ${releasedCount} locks released (${duration}ms)`
      );
    } catch (error) {
      console.error('Error during stale lock cleanup:', error);
    }
  }
}

export default new StaleLockCleanupJob();

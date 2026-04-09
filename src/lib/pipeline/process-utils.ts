import { execSync } from 'child_process';

/**
 * Check if a process is still alive by PID.
 */
export function isProcessAlive(pid: number): boolean {
  try {
    execSync(`ps -p ${pid} -o pid= 2>/dev/null`, { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Gracefully kill a process: SIGTERM first, wait up to 5 seconds, then SIGKILL.
 * Returns a human-readable status string.
 */
export function gracefulKill(pid: number, label: string): string {
  if (!isProcessAlive(pid)) return `${label} (PID ${pid}) already dead`;

  // SIGTERM first — gives the process a chance to clean up
  try { process.kill(pid, 'SIGTERM'); } catch { /* ignore */ }

  // Wait up to 5 seconds for graceful exit
  for (let i = 0; i < 10; i++) {
    execSync('sleep 0.5');
    if (!isProcessAlive(pid)) return `${label} (PID ${pid}) exited gracefully`;
  }

  // Still alive — force kill
  try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ }
  return `${label} (PID ${pid}) force-killed after 5s timeout`;
}

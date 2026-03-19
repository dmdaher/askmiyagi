import { NextRequest } from 'next/server';
import fs from 'fs';
import { getLogPath, getStatePath, readState } from '@/lib/pipeline/state-machine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const logPath = getLogPath(deviceId);
  const statePath = getStatePath(deviceId);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send current state
      const state = readState(deviceId);
      if (state) {
        controller.enqueue(encoder.encode(`event: state\ndata: ${JSON.stringify(state)}\n\n`));
      }

      // Send last 100 log lines
      try {
        const logContent = fs.readFileSync(logPath, 'utf-8');
        const lines = logContent.trim().split('\n').slice(-100);
        for (const line of lines) {
          controller.enqueue(encoder.encode(`event: log\ndata: ${line}\n\n`));
        }
      } catch { /* No log file yet */ }

      // Track file position for incremental reads
      let logOffset = 0;
      try {
        logOffset = fs.statSync(logPath).size;
      } catch { /* File doesn't exist yet */ }

      let logWatcher: fs.FSWatcher | null = null;
      let stateWatcher: fs.FSWatcher | null = null;

      try {
        const logDir = logPath.substring(0, logPath.lastIndexOf('/'));
        if (fs.existsSync(logDir)) {
          logWatcher = fs.watch(logPath, () => {
            try {
              const stat = fs.statSync(logPath);
              if (stat.size > logOffset) {
                const fd = fs.openSync(logPath, 'r');
                const buffer = Buffer.alloc(stat.size - logOffset);
                fs.readSync(fd, buffer, 0, buffer.length, logOffset);
                fs.closeSync(fd);
                logOffset = stat.size;
                const newLines = buffer.toString().trim().split('\n');
                for (const line of newLines) {
                  if (line) controller.enqueue(encoder.encode(`event: log\ndata: ${line}\n\n`));
                }
              }
            } catch { /* File temporarily unavailable */ }
          });

          stateWatcher = fs.watch(statePath, () => {
            try {
              const state = readState(deviceId);
              if (state) controller.enqueue(encoder.encode(`event: state\ndata: ${JSON.stringify(state)}\n\n`));
            } catch { /* Temporarily unavailable during atomic write */ }
          });
        }
      } catch { /* Directory doesn't exist yet */ }

      // Poll every 2s as a fallback — fs.watch on macOS can miss events
      const pollInterval = setInterval(() => {
        try {
          const stat = fs.statSync(logPath);
          if (stat.size > logOffset) {
            const fd = fs.openSync(logPath, 'r');
            const buffer = Buffer.alloc(stat.size - logOffset);
            fs.readSync(fd, buffer, 0, buffer.length, logOffset);
            fs.closeSync(fd);
            logOffset = stat.size;
            const newLines = buffer.toString().trim().split('\n');
            for (const line of newLines) {
              if (line) controller.enqueue(encoder.encode(`event: log\ndata: ${line}\n\n`));
            }
          }
        } catch { /* file not ready */ }

        // Also push state updates
        try {
          const state = readState(deviceId);
          if (state) controller.enqueue(encoder.encode(`event: state\ndata: ${JSON.stringify(state)}\n\n`));
        } catch { /* state not ready */ }
      }, 2_000);

      const keepalive = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: keepalive\n\n`)); }
        catch { clearInterval(keepalive); clearInterval(pollInterval); }
      }, 30_000);

      request.signal.addEventListener('abort', () => {
        clearInterval(keepalive);
        clearInterval(pollInterval);
        logWatcher?.close();
        stateWatcher?.close();
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

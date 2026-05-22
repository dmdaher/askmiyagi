/**
 * GET /api/pipeline/[deviceId]/review-tutorials/mtime
 *
 * Tiny endpoint for the canvas's live-refresh poll. Returns mtimes of
 * `qa-report.json` and `tutorials.json` so the client can detect when
 * an upstream change (editor save, Fix apply, pull-from-hosted) has
 * regenerated them and call `router.refresh()`.
 *
 * Designed to be cheap: filesystem stat() only, no JSON parsing.
 * 30-byte response when files are present.
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const dir = path.join(process.cwd(), '.pipeline', deviceId, 'agents', 'tutorial-review');
  const qa = path.join(dir, 'qa-report.json');
  const tutorials = path.join(dir, 'tutorials.json');

  const safeStat = (p: string): number | null => {
    try { return fs.existsSync(p) ? fs.statSync(p).mtimeMs : null; }
    catch { return null; }
  };

  const res = NextResponse.json({
    qaReportMtime: safeStat(qa),
    tutorialsMtime: safeStat(tutorials),
  });
  // Never cache; this is a freshness probe
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

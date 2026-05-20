/**
 * POST /api/pipeline/[deviceId]/qa-assess-coherence — PR-K Phase 1.
 *
 * Spawns tutorial-fixer in `assess-coherence` mode for one tutorial.
 * Returns the coherence score + verdict + per-step findings + suggested
 * fixes. DOES NOT mutate tutorials.json.
 *
 * Caching: 10-minute TTL keyed by tutorialId + tutorials.json mtime.
 * Cache file lives at .pipeline/<id>/agents/tutorial-review/coherence-cache.json.
 *
 * Server-side per-tutorial semaphore: parallel "Assess" clicks for the
 * same tutorial wait on the in-flight call.
 *
 * Body: { tutorialId: string, force?: boolean }
 *   - force=true bypasses cache (re-assess button).
 */
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { readState } from '@/lib/pipeline/state-machine';
import {
  runAssessCoherence,
  type AssessCoherenceResult,
} from '@/lib/pipeline/agent-fix-runner';

const CACHE_TTL_MS = 10 * 60 * 1000;

interface CacheEntry {
  tutorialId: string;
  tutorialsMtime: number;
  cachedAt: number;
  result: AssessCoherenceResult;
}

const inFlight = new Map<string, Promise<{
  ok: boolean;
  result?: AssessCoherenceResult;
  cannotFix?: boolean;
  question?: string;
  error?: string;
}>>();

function readCache(deviceId: string, repoRoot: string): Record<string, CacheEntry> {
  const p = path.join(repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review', 'coherence-cache.json');
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as Record<string, CacheEntry>; }
  catch { return {}; }
}

function writeCache(deviceId: string, repoRoot: string, cache: Record<string, CacheEntry>): void {
  const dir = path.join(repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'coherence-cache.json'), JSON.stringify(cache, null, 2));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const state = readState(deviceId);
  if (!state) {
    return NextResponse.json({ error: `No pipeline for ${deviceId}` }, { status: 404 });
  }

  const body = await request.json().catch(() => null) as { tutorialId?: string; force?: boolean } | null;
  if (!body?.tutorialId) {
    return NextResponse.json({ error: 'Body must include { tutorialId }' }, { status: 400 });
  }
  const tutorialId = body.tutorialId;
  const force = body.force === true;
  const repoRoot = process.cwd();

  // Cache lookup (cache key includes tutorials.json mtime; if the file
  // changed since the cached assessment, the cache is treated as stale).
  const tutorialsPath = path.join(repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review', 'tutorials.json');
  if (!fs.existsSync(tutorialsPath)) {
    return NextResponse.json({ error: 'tutorials.json not found' }, { status: 404 });
  }
  const tutorialsMtime = fs.statSync(tutorialsPath).mtime.getTime();
  const cache = readCache(deviceId, repoRoot);
  const cached = cache[tutorialId];
  if (
    !force &&
    cached &&
    cached.tutorialsMtime === tutorialsMtime &&
    Date.now() - cached.cachedAt < CACHE_TTL_MS
  ) {
    return NextResponse.json({ ok: true, result: cached.result, cached: true });
  }

  const key = `${deviceId}:${tutorialId}`;
  const existing = inFlight.get(key);
  if (existing) {
    const r = await existing;
    return NextResponse.json(r);
  }

  const promise = (async () => {
    const agentResult = await runAssessCoherence({ deviceId, repoRoot, tutorialId });
    if (agentResult.ok) {
      cache[tutorialId] = {
        tutorialId,
        tutorialsMtime,
        cachedAt: Date.now(),
        result: agentResult.result,
      };
      writeCache(deviceId, repoRoot, cache);
      return { ok: true, result: agentResult.result };
    }
    if ('cannotFix' in agentResult && agentResult.cannotFix) {
      return { ok: false, cannotFix: true, question: agentResult.question, error: agentResult.error };
    }
    return { ok: false, error: agentResult.error };
  })();
  inFlight.set(key, promise);
  try {
    const result = await promise;
    return NextResponse.json(result);
  } finally {
    inFlight.delete(key);
  }
}

/**
 * GET — return the cached entry for a tutorial without re-running the
 * agent. Used by the canvas to render the "current score" badge.
 *
 * Query: ?tutorialId=<id>
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const url = new URL(request.url);
  const tutorialId = url.searchParams.get('tutorialId');
  if (!tutorialId) {
    return NextResponse.json({ error: 'tutorialId query param required' }, { status: 400 });
  }
  const repoRoot = process.cwd();
  const cache = readCache(deviceId, repoRoot);
  const cached = cache[tutorialId];
  if (!cached) {
    return NextResponse.json({ ok: false, cached: false });
  }
  const tutorialsPath = path.join(repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review', 'tutorials.json');
  const fresh = fs.existsSync(tutorialsPath) && fs.statSync(tutorialsPath).mtime.getTime() === cached.tutorialsMtime;
  return NextResponse.json({
    ok: true, cached: true, fresh, cachedAt: cached.cachedAt, result: cached.result,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadAttentionItems, countBySeverity } from '@/lib/pipeline/attention-inventory';

const REVIEWED_FILE = path.join('.pipeline', 'attention-reviewed.json');

export const dynamic = 'force-dynamic';

/**
 * GET — returns the aggregated attention inventory across all pipelines.
 * Response: { items, counts, total, unreviewed }
 */
export async function GET() {
  try {
    const items = loadAttentionItems();
    const unreviewedItems = items.filter((i) => !i.reviewed);
    return NextResponse.json({
      items,
      counts: countBySeverity(items),
      total: items.length,
      unreviewed: unreviewedItems.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to load attention inventory: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

/**
 * POST — mark items reviewed (or un-reviewed).
 * Body: { itemId: string, reviewed: boolean }
 * Persists to .pipeline/attention-reviewed.json.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, reviewed } = body as { itemId?: unknown; reviewed?: unknown };
    if (typeof itemId !== 'string' || typeof reviewed !== 'boolean') {
      return NextResponse.json(
        { error: 'Body must be { itemId: string, reviewed: boolean }' },
        { status: 400 },
      );
    }

    // Load existing reviewed state
    let store: Record<string, { reviewedAt: string }> = {};
    if (fs.existsSync(REVIEWED_FILE)) {
      try {
        store = JSON.parse(fs.readFileSync(REVIEWED_FILE, 'utf-8'));
      } catch { /* corrupt file — start fresh */ }
    }

    if (reviewed) {
      store[itemId] = { reviewedAt: new Date().toISOString() };
    } else {
      delete store[itemId];
    }

    // Atomic write
    const tmp = `${REVIEWED_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
    fs.renameSync(tmp, REVIEWED_FILE);

    return NextResponse.json({ ok: true, itemId, reviewed });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to update reviewed status: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

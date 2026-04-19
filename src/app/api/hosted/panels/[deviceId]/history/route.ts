import { NextRequest, NextResponse } from 'next/server';
import { listManifestHistory, restoreFromHistory } from '@/lib/hosted-storage';

/** GET /api/hosted/panels/{deviceId}/history — list manifest backups */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const history = await listManifestHistory(deviceId);
  return NextResponse.json(history);
}

/** POST /api/hosted/panels/{deviceId}/history — restore a backup */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const { url } = await request.json();
  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }
  const ok = await restoreFromHistory(deviceId, url);
  if (!ok) {
    return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, message: 'Manifest restored from backup' });
}

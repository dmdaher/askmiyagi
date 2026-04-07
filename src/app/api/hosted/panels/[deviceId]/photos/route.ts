import { NextRequest, NextResponse } from 'next/server';
import { listPhotos } from '@/lib/hosted-storage';

/** GET /api/hosted/panels/{deviceId}/photos — list photo URLs from Blob */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const photos = await listPhotos(deviceId);
  return NextResponse.json({ photos });
}

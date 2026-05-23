import { NextRequest, NextResponse } from 'next/server';
import { listDevices } from '@/lib/hosted-storage';

/** GET /api/hosted/panels — list devices. ?sandbox=true for practice instruments only. */
export async function GET(request: NextRequest) {
  try {
    const sandbox = request.nextUrl.searchParams.get('sandbox') === 'true';
    const devices = await listDevices({ sandbox });
    return NextResponse.json(devices);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to list devices', details: (err as Error).message },
      { status: 500 },
    );
  }
}

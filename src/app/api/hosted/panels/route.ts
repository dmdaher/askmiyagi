import { NextResponse } from 'next/server';
import { listDevices } from '@/lib/hosted-storage';

/** GET /api/hosted/panels — list all devices with statuses */
export async function GET() {
  try {
    const devices = await listDevices();
    return NextResponse.json(devices);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to list devices', details: (err as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const templatesPath = path.join('.pipeline', deviceId, 'templates.json');

  try {
    const data = fs.readFileSync(templatesPath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json(
      { error: 'Templates not found. Layout Engine has not run yet.' },
      { status: 404 }
    );
  }
}

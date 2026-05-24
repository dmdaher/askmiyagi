import { NextRequest, NextResponse } from 'next/server';
import { exportManifest } from '@/lib/pipeline/exportManifest';

/**
 * POST /api/pipeline/{deviceId}/force-export
 *
 * Admin-only escape hatch when the auto-export's downgrade detector
 * (src/lib/pipeline/exportManifest.ts) is aborting legitimate changes.
 * Bypasses the downgrade check and writes whatever the fallback chain
 * produces. Use ONLY after manually reviewing what would be written.
 *
 * Typical scenarios where this is needed:
 *   - A device's metadata source (.pipeline/<d>/manifest.json or
 *     src/data/devices.ts) was intentionally renamed and the admin
 *     wants the production manifest to follow
 *   - A device's prior production manifest is corrupted and the admin
 *     wants to overwrite it with the current (correct) fallback chain
 *     output
 *
 * Surface the abort reason from a previous save's response (in the
 * editor warning banner) BEFORE calling this — that text tells you
 * exactly what would change.
 *
 * Sibling routes:
 *   - POST /api/pipeline/{deviceId}/export-manifest — manual export
 *     WITH detector protection (use this first; only escalate here)
 *   - PUT /api/pipeline/{deviceId}/manifest — auto-export on save
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const result = exportManifest(deviceId, { bypassDowngradeCheck: true });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, details: result.output },
      { status: result.error === 'No editor manifest found' ? 404 : 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    output: result.output,
    bypassedDowngradeCheck: true,
  });
}

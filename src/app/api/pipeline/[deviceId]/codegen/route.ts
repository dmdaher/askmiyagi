import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { SectionDef, ControlDef } from '@/components/panel-editor/store/manifestSlice';
import { computeLabelPosition } from '@/lib/label-position';

/**
 * POST /api/pipeline/{deviceId}/codegen
 *
 * Before running codegen:
 * 1. Read manifest-editor.json (contractor's positions, already cleaned by editor on Approve)
 * 2. Update section bounding boxes in manifest.json from editor positions
 * 3. Merge editor overrides (shape, color, label, etc.) into manifest controls
 * 4. Write editorPosition percentages on each control
 * 5. Backup manifest.json, then write updated version
 * 6. Run codegen
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const pipelineDir = path.join(process.cwd(), '.pipeline', deviceId);

  try {
    const editorPath = path.join(pipelineDir, 'manifest-editor.json');
    const manifestPath = path.join(pipelineDir, 'manifest.json');

    if (fs.existsSync(editorPath) && fs.existsSync(manifestPath)) {
      const editorData = JSON.parse(fs.readFileSync(editorPath, 'utf-8'));
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      if (editorData.sections && editorData.controls) {
        const editorSections = editorData.sections as Record<string, SectionDef>;
        const editorControls = editorData.controls as Record<string, ControlDef>;

        // Determine canvas dimensions — use editor's saved canvas size if available.
        // The editor saves canvasWidth/canvasHeight alongside positions; positions were
        // created for THAT canvas size. Recomputing from deviceDimensions would mismatch
        // (e.g., CDJ-3000 editor used 1650 but deviceDimensions gives 1470).
        let canvasW = (editorData.canvasWidth as number) || 1200;
        let canvasH = (editorData.canvasHeight as number) || 1650;

        // ── Step 1: Use editor positions directly (cleanup already ran in the editor) ──
        // The editor applies geometry cleanup on Approve & Build, then auto-saves
        // the cleaned positions to manifest-editor.json. No need to run cleanup again.

        // Update section bounding boxes — convert gatekeeper percentages to pixels
        for (const section of manifest.sections) {
          const editorSection = editorSections[section.id];
          if (editorSection) {
            section.panelBoundingBox = {
              x: Math.round(editorSection.x),
              y: Math.round(editorSection.y),
              w: Math.round(editorSection.w),
              h: Math.round(editorSection.h),
            };
          }
        }

        // ── Step 2: Merge editor overrides + positions into controls ──
        for (const control of manifest.controls) {
          const editorControl = editorControls[control.id];
          if (editorControl) {
            // Merge editor overrides back into manifest control
            if (editorControl.shape) control.shape = editorControl.shape;
            if (editorControl.surfaceColor !== undefined) control.surfaceColor = editorControl.surfaceColor;
            if (editorControl.buttonStyle) control.buttonStyle = editorControl.buttonStyle;
            if (editorControl.labelDisplay) control.labelDisplay = editorControl.labelDisplay;
            // Map editor's labelPosition to codegen's labelDisplay if not already set
            if (editorControl.labelPosition && !editorControl.labelDisplay) {
              const posMap: Record<string, string> = {
                'above': 'above', 'below': 'below', 'left': 'left', 'right': 'right',
                'on-button': 'on-button', 'hidden': 'hidden',
              };
              if (posMap[editorControl.labelPosition]) {
                control.labelDisplay = posMap[editorControl.labelPosition];
              }
            }
            if (editorControl.icon !== undefined) control.icon = editorControl.icon;
            if (editorControl.label) control.verbatimLabel = editorControl.label;
            if (editorControl.secondaryLabel !== undefined) control.secondaryLabel = editorControl.secondaryLabel;
            if (editorControl.ledVariant) control.ledVariant = editorControl.ledVariant;
            if (editorControl.ledColor !== undefined) control.ledColor = editorControl.ledColor;
            if (editorControl.hasLed !== undefined) control.hasLed = editorControl.hasLed;
            if (editorControl.type) control.type = editorControl.type;
          }

          // Pass pixel positions. Sizes scaled by controlScale so the
          // generated panel matches what the editor shows (container = visual).
          if (editorControl) {
            const scale = (editorData.controlScale as number) ?? 1;
            const visW = Math.round(editorControl.w * scale);
            const visH = Math.round(editorControl.h * scale);
            (control as any).editorPosition = {
              x: Math.round(editorControl.x),
              y: Math.round(editorControl.y),
              w: visW,
              h: visH,
            };

            // Compute label position using shared function (same as editor)
            const labelPosDir = control.labelDisplay ?? editorControl.labelPosition ?? 'below';
            const label = control.verbatimLabel ?? editorControl.label ?? '';
            // Use editor's custom labelFontSize when set, same as ControlNode's labelFontSize()
            const fontSize = (editorControl as any).labelFontSize
              ?? ({ xs: 7, sm: 7, md: 8, lg: 10, xl: 11 }[control.sizeClass as string] ?? 8);
            const lp = computeLabelPosition(
              Math.round(editorControl.x), Math.round(editorControl.y),
              visW, visH, labelPosDir, label, fontSize, control.secondaryLabel,
            );
            if (lp) {
              (control as any)._labelPos = lp;
            }
          } else {
            // Control not in editor manifest — clear any stale editorPosition
            // from a previous build (which may have been percentage-based)
            delete (control as any).editorPosition;
          }
        }

        // NOTE: De-overlap pass DISABLED. The user's editor positions are
        // authoritative. The alignment/distribute tools (planned) handle spacing.
        // Codegen should faithfully reproduce editor positions, not transform them.

        // ── Step 4: Backup manifest.json before overwriting ──
        const backupDir = path.join(pipelineDir, 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        fs.copyFileSync(manifestPath, path.join(backupDir, `manifest-pre-codegen-${timestamp}.json`));

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`Merged cleaned editor positions into manifest.json`);
      }
    }

    // ── Step 5: Run codegen ──
    // Apply panelScale if set — multiplies panel dimensions for proportional scaling
    // Pass editor canvas dimensions to codegen so PanelShell matches
    const editorDataForDims = fs.existsSync(path.join(pipelineDir, 'manifest-editor.json'))
      ? JSON.parse(fs.readFileSync(path.join(pipelineDir, 'manifest-editor.json'), 'utf-8'))
      : {};
    const edCanvasW = (editorDataForDims.canvasWidth as number) || 0;
    const edCanvasH = (editorDataForDims.canvasHeight as number) || 0;
    const dimArgs = edCanvasW && edCanvasH
      ? ` --panel-width ${edCanvasW} --panel-height ${edCanvasH}`
      : '';

    const codegenOutput = execSync(
      `npx tsx scripts/panel-codegen.ts ${deviceId}${dimArgs}`,
      {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 60_000,
      }
    );

    // Mark codegen as completed in pipeline state (for nav gating)
    try {
      const { readState: rs, writeState: ws } = await import('@/lib/pipeline/state-machine');
      const pState = rs(deviceId);
      if (pState) {
        (pState as any).codegenCompleted = true;
        ws(deviceId, pState);
      }
    } catch { /* best effort */ }

    return NextResponse.json({
      ok: true,
      output: codegenOutput.toString(),
      note: 'Codegen complete. If running dev server, components hot-reload automatically. If running production server, restart with: npm run build && npx next start -p 3000',
    });
  } catch (err) {
    const error = err as Error & { stdout?: Buffer; stderr?: Buffer };
    const stdout = error.stdout?.toString() ?? '';
    const stderr = error.stderr?.toString() ?? '';

    return NextResponse.json(
      {
        error: 'Codegen failed',
        details: error.message,
        stdout,
        stderr,
      },
      { status: 500 }
    );
  }
}

// ─── De-overlap ─────────────────────────────────────────────────────────────

const ROW_TOLERANCE = 15; // px — controls within 15px Y center are same row
const MIN_DEOVERLAP_GAP = 2; // px — minimum gap between containers after de-overlap

/**
 * Push overlapping control containers apart while preserving their centers
 * as much as possible. Groups controls into rows by Y center, then within
 * each row, redistributes X positions to eliminate overlaps.
 *
 * Operates on editorPosition (percentages) and the control's pixel w/h
 * derived from those percentages × canvas size.
 */
function deOverlapControls(
  controls: Array<{ id: string; editorPosition?: { x: number; y: number; w: number; h: number }; [k: string]: unknown }>,
  canvasW: number,
  canvasH: number,
) {
  // Convert percentage positions to pixels for overlap math
  const withPx = controls
    .filter(c => (c as any).editorPosition)
    .map(c => {
      const ep = (c as any).editorPosition as { x: number; y: number; w: number; h: number };
      return {
        control: c,
        x: (ep.x / 100) * canvasW,
        y: (ep.y / 100) * canvasH,
        w: (ep.w / 100) * canvasW,
        h: (ep.h / 100) * canvasH,
        centerY: ((ep.y + ep.h / 2) / 100) * canvasH,
      };
    });

  if (withPx.length < 2) return;

  // Group into rows by Y center
  const assigned = new Set<string>();
  const rows: typeof withPx[] = [];

  for (const item of withPx) {
    if (assigned.has(item.control.id)) continue;
    const row = [item];
    assigned.add(item.control.id);

    for (const other of withPx) {
      if (assigned.has(other.control.id)) continue;
      if (Math.abs(other.centerY - item.centerY) <= ROW_TOLERANCE) {
        row.push(other);
        assigned.add(other.control.id);
      }
    }
    if (row.length >= 2) rows.push(row);
  }

  // For each row, sort by X and fix overlaps
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);

    let changed = false;
    for (let i = 1; i < row.length; i++) {
      const prev = row[i - 1];
      const curr = row[i];
      const prevEnd = prev.x + prev.w;
      const overlap = prevEnd + MIN_DEOVERLAP_GAP - curr.x;

      if (overlap > 0) {
        // Push current control rightward to eliminate overlap
        curr.x += overlap;
        changed = true;
      }
    }

    // Write adjusted positions back as percentages
    if (changed) {
      for (const item of row) {
        const ep = (item.control as any).editorPosition;
        ep.x = Math.round((item.x / canvasW) * 1000) / 10;
        // y, w, h unchanged
      }
    }
  }
}

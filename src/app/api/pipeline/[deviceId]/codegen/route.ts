import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { cleanupGeometry } from '@/lib/layout-inference';
import type { SectionDef, ControlDef } from '@/components/panel-editor/store/manifestSlice';

/**
 * POST /api/pipeline/{deviceId}/codegen
 *
 * Before running codegen:
 * 1. Read manifest-editor.json (the contractor's pixel positions)
 * 2. Run cleanupGeometry() on the positions (snap alignment, normalize sizes)
 * 3. Write cleaned positions as editorPosition percentages on each control in manifest.json
 * 4. Write cleaned geometry to .pipeline/{deviceId}/cleaned-geometry.json for reference
 * 5. Run codegen
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

        // Determine canvas dimensions
        let canvasW = 1200; // CANVAS_BASE_W
        let canvasH = 1650; // CANVAS_BASE_H
        if (manifest.deviceDimensions) {
          const { widthMm, depthMm } = manifest.deviceDimensions;
          if (widthMm > 0 && depthMm > 0) {
            canvasH = Math.round(canvasW / (widthMm / depthMm));
          }
        }

        // ── Step 1: Run geometry cleanup on the editor's pixel positions ──
        const cleanupResult = cleanupGeometry(
          editorSections,
          editorControls,
          canvasW,
          canvasH,
        );

        // Write cleaned geometry for reference (NEVER overwrite manifest-editor.json)
        const cleanedGeometryPath = path.join(pipelineDir, 'cleaned-geometry.json');
        fs.writeFileSync(cleanedGeometryPath, JSON.stringify(cleanupResult, null, 2));
        console.log(`Wrote cleaned geometry to ${cleanedGeometryPath}`);

        // Build lookup from cleaned sections/controls
        const cleanedSectionMap = new Map<string, typeof cleanupResult.sections[number]>();
        const cleanedControlMap = new Map<string, { x: number; y: number; w: number; h: number }>();
        for (const cs of cleanupResult.sections) {
          cleanedSectionMap.set(cs.id, cs);
          for (const cc of cs.controls) {
            cleanedControlMap.set(cc.id, { x: cc.x, y: cc.y, w: cc.w, h: cc.h });
          }
        }

        // ── Step 2: Update section bounding boxes from cleaned positions ──
        for (const section of manifest.sections) {
          const cleaned = cleanedSectionMap.get(section.id);
          if (cleaned) {
            section.panelBoundingBox = {
              x: Math.round((cleaned.x / canvasW) * 100 * 10) / 10,
              y: Math.round((cleaned.y / canvasH) * 100 * 10) / 10,
              w: Math.round((cleaned.w / canvasW) * 100 * 10) / 10,
              h: Math.round((cleaned.h / canvasH) * 100 * 10) / 10,
            };
          }
        }

        // ── Step 3: Merge editor overrides + cleaned positions into controls ──
        for (const control of manifest.controls) {
          const editorControl = editorControls[control.id];
          if (editorControl) {
            // Merge editor overrides back into manifest control
            if (editorControl.shape) control.shape = editorControl.shape;
            if (editorControl.surfaceColor !== undefined) control.surfaceColor = editorControl.surfaceColor;
            if (editorControl.buttonStyle) control.buttonStyle = editorControl.buttonStyle;
            if (editorControl.labelDisplay) control.labelDisplay = editorControl.labelDisplay;
            if (editorControl.icon !== undefined) control.icon = editorControl.icon;
            if (editorControl.label) control.verbatimLabel = editorControl.label;
            if (editorControl.secondaryLabel !== undefined) control.secondaryLabel = editorControl.secondaryLabel;
            if (editorControl.ledVariant) control.ledVariant = editorControl.ledVariant;
            if (editorControl.ledColor !== undefined) control.ledColor = editorControl.ledColor;
            if (editorControl.hasLed !== undefined) control.hasLed = editorControl.hasLed;
            if (editorControl.type) control.type = editorControl.type;
          }

          // Use CLEANED positions (snapped/normalized) instead of raw editor positions
          const cleanedPos = cleanedControlMap.get(control.id);
          if (cleanedPos) {
            (control as any).editorPosition = {
              x: Math.round((cleanedPos.x / canvasW) * 1000) / 10,
              y: Math.round((cleanedPos.y / canvasH) * 1000) / 10,
              w: Math.round((cleanedPos.w / canvasW) * 1000) / 10,
              h: Math.round((cleanedPos.h / canvasH) * 1000) / 10,
            };
          }
        }

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
    const codegenOutput = execSync(
      `npx tsx scripts/panel-codegen.ts ${deviceId}`,
      {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 60_000,
      }
    );

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

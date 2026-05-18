/**
 * `exportManifest(deviceId)` — reads `.pipeline/<deviceId>/manifest-editor.json`
 * (contractor's saved editor state) and writes a production-ready
 * `PanelManifest` JSON to `src/data/manifests/<deviceId>.json` (statically
 * imported by `src/lib/deviceRegistry.ts` for production rendering).
 *
 * Shared between:
 *   - `/api/pipeline/[deviceId]/manifest` PUT handler — auto-export on
 *     every save (eliminates the "I forgot to click Export" workflow gap)
 *   - `/api/pipeline/[deviceId]/export-manifest` POST handler — manual
 *     override / admin-triggered (kept as a fallback + diagnostics tool)
 *   - `/api/pipeline/[deviceId]/pull-from-hosted` — runs after pulling
 *     Blob → local (was previously an HTTP self-fetch to the route; now
 *     a direct import for cleaner semantics)
 *
 * The production allowlist (controls.map below) is the production
 * schema's source of truth — anything not in the list is editor-only and
 * stripped. See `src/__tests__/manifest-field-completeness.test.ts` for
 * the runtime check that catches drift between editor field additions
 * and this list.
 */
import fs from 'fs';
import path from 'path';

export interface ExportManifestResult {
  ok: boolean;
  output?: string;
  error?: string;
  controls?: number;
  sections?: number;
  labels?: number;
}

const PIPELINE_DIR_NAME = '.pipeline';
const OUTPUT_DIR = path.join('src', 'data', 'manifests');

export function exportManifest(deviceId: string): ExportManifestResult {
  const pipelineDir = path.join(process.cwd(), PIPELINE_DIR_NAME, deviceId);
  const editorPath = path.join(pipelineDir, 'manifest-editor.json');
  const mainManifestPath = path.join(pipelineDir, 'manifest.json');

  if (!fs.existsSync(editorPath)) {
    return { ok: false, error: 'No editor manifest found' };
  }

  try {
    const editorData = JSON.parse(fs.readFileSync(editorPath, 'utf-8'));
    const mainManifest = fs.existsSync(mainManifestPath)
      ? JSON.parse(fs.readFileSync(mainManifestPath, 'utf-8'))
      : {};

    const sections = editorData.sections ?? {};
    const controls = editorData.controls ?? {};
    const scale = editorData.controlScale ?? 1;

    const sectionList =
      typeof sections === 'object' && !Array.isArray(sections)
        ? Object.values(sections)
        : sections;
    const controlList =
      typeof controls === 'object' && !Array.isArray(controls)
        ? Object.values(controls)
        : controls;

    const manifest = {
      deviceId: editorData.deviceId ?? mainManifest.deviceId ?? deviceId,
      deviceName: editorData.deviceName ?? mainManifest.deviceName ?? deviceId,
      manufacturer: editorData.manufacturer ?? mainManifest.manufacturer ?? '',
      panelWidth: editorData.canvasWidth ?? 1200,
      panelHeight: editorData.canvasHeight ?? 1650,
      controlScale: scale,
      keyboard: editorData.keyboard ?? mainManifest.keyboard ?? null,
      editorSections: (sectionList as any[]).map((s: any) => ({
        id: s.id,
        headerLabel: s.headerLabel ?? undefined,
        frameMode: s.frameMode,
        hidden: s.hidden,
        x: s.x,
        y: s.y,
        w: s.w,
        h: s.h,
      })),
      controls: (controlList as any[]).map((c: any) => {
        const ctrl: Record<string, any> = {
          id: c.id,
          type: c.type,
          label: c.label ?? '',
          editorPosition: { x: c.x, y: c.y, w: c.w, h: c.h },
        };
        // Production allowlist. Editor-only fields (locked, resizeLocked,
        // ledOn, etc.) intentionally omitted — `ledOn` specifically is
        // editor design-time only because tutorials drive runtime LED
        // state via panelStateChanges (see feedback_ledOn_is_intentional_
        // editor_only memory). Anything not in this list is stripped.
        for (const field of [
          'shape',
          'surfaceColor',
          'buttonStyle',
          'labelPosition',
          'labelDisplay',
          'icon',
          'secondaryLabel',
          'ledVariant',
          'ledColor',
          'hasLed',
          'ledPosition',
          'nestedIn',
          'encoderHasPush',
          'positions',
          'positionLabels',
          'rotation',
          'ledStyle',
          'labelFontSize',
          'zOrder',
          'ledBehavior',
          'labelAlign',
          'labelColor',
        ]) {
          if (c[field] != null) ctrl[field] = c[field];
        }
        return ctrl;
      }),
      editorLabels: (editorData.editorLabels ?? []).map((l: any) => ({
        id: l.id,
        text: l.text,
        icon: l.icon ?? undefined,
        x: l.x,
        y: l.y,
        w: l.w,
        fontSize: l.fontSize,
        align: l.align ?? 'center',
        hidden: l.hidden ?? false,
        lineHeight: (l.fontSize ?? 8) + 2,
        // Thread controlId per PR-2.6 — preview z-index relies on it.
        controlId: l.controlId,
      })),
      groupLabels: mainManifest.groupLabels ?? [],
      controlContainers: editorData.controlContainers ?? [],
    };

    const outputDir = path.join(process.cwd(), OUTPUT_DIR);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${deviceId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

    return {
      ok: true,
      output: `Exported manifest to ${OUTPUT_DIR}/${deviceId}.json (${(controlList as any[]).length} controls, ${(sectionList as any[]).length} sections, ${manifest.editorLabels.length} labels)`,
      controls: (controlList as any[]).length,
      sections: (sectionList as any[]).length,
      labels: manifest.editorLabels.length,
    };
  } catch (err) {
    return {
      ok: false,
      error: 'Export failed',
      output: (err as Error).message,
    };
  }
}

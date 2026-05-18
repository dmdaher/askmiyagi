/**
 * `storeToManifest` — converts the editor's Zustand store state into the
 * `PanelManifest` shape that PanelRenderer (preview) consumes.
 *
 * Extracted from `PanCanvas.tsx` so the manifest-field-completeness test
 * (`src/__tests__/manifest-field-completeness.test.ts`) can import and
 * exercise it directly without pulling in PanCanvas's React tree of
 * Rnd / overlays / etc.
 *
 * The output schema is the contract between the editor and the
 * production-rendered panel. Adding a field to `ControlDef` (in the
 * editor's `manifestSlice.ts`) without threading it here means the
 * field is silently stripped on every save — the bug class that hit
 * `zOrder` (months unfixed before PR #138) and `controlId` (caught in
 * PR-2.6) and `ledOn` (still unfixed at time of writing; see TODO in
 * the manifest-field-completeness test allowlist).
 *
 * Edit history:
 *   - Originally inline in PanCanvas.tsx (since 2026-03-?? era)
 *   - Extracted to this file in [A1 PR-4] to enable the
 *     manifest-field-completeness test
 *
 * IMPORTANT: when adding a field to `ControlDef` or `EditorLabel`, add
 * it BOTH to the manifest interface (`ManifestControl` / `ManifestLabel`
 * in `src/components/controls/PanelRenderer.tsx`) AND to the mapping
 * below. The test catches violations.
 */
import { useEditorStore } from './store';
import type { PanelManifest } from '@/components/controls/PanelRenderer';

export function storeToManifest(
  state: ReturnType<typeof useEditorStore.getState>,
): PanelManifest {
  const controls = Object.values(state.controls).sort(
    (a, b) => (a.zOrder ?? 0) - (b.zOrder ?? 0),
  );
  const sections = Object.values(state.sections);
  const scale = state.controlScale ?? 1;

  return {
    deviceId: state.deviceId ?? 'unknown',
    deviceName: state.deviceName ?? 'Unknown',
    manufacturer: state.manufacturer ?? '',
    panelWidth: state.canvasWidth,
    panelHeight: state.canvasHeight,
    controlScale: scale,
    keyboard: state.keyboard ?? null,
    editorSections: sections.map((s) => ({
      id: s.id,
      headerLabel: s.headerLabel ?? undefined,
      hidden: s.hidden,
      frameMode: s.frameMode,
      showTitleBanner: s.showTitleBanner,
      x: s.x,
      y: s.y,
      w: s.w,
      h: s.h,
    })),
    controls: controls.map((c) => ({
      id: c.id,
      type: c.type,
      label: c.label,
      shape: c.shape as string | undefined,
      surfaceColor: c.surfaceColor ?? undefined,
      buttonStyle: c.buttonStyle as string | undefined,
      labelPosition: c.labelPosition as string | undefined,
      labelDisplay: c.labelDisplay as string | undefined,
      icon: c.icon ?? undefined,
      secondaryLabel: c.secondaryLabel ?? undefined,
      ledVariant: c.ledVariant as string | undefined,
      ledColor: c.ledColor ?? undefined,
      hasLed: c.hasLed,
      ledPosition: c.ledPosition as string | undefined,
      nestedIn: c.nestedIn ?? undefined,
      encoderHasPush: c.encoderHasPush,
      positions: c.positions,
      positionLabels: c.positionLabels,
      rotation: c.rotation,
      labelFontSize: c.labelFontSize,
      ledStyle: c.ledStyle,
      labelAlign: c.labelAlign,
      labelColor: c.labelColor,
      zOrder: c.zOrder,
      editorPosition: { x: c.x, y: c.y, w: c.w, h: c.h },
    })),
    editorLabels: (state.editorLabels ?? []).map((l: any) => ({
      id: l.id,
      text: l.text,
      icon: l.icon,
      x: l.x,
      y: l.y,
      w: l.w,
      fontSize: l.fontSize,
      align: l.align,
      hidden: l.hidden,
      lineHeight: l.fontSize + 2,
      // Thread controlId so PanelRenderer (preview) can compute per-label
      // zIndex relative to the linked control's zOrder. Without this, all
      // labels are stuck at z=150 and any overlapping control hides them.
      controlId: l.controlId,
    })),
    groupLabels: state.groupLabels ?? [],
    controlContainers: (state.controlContainers ?? []).map((c) => ({
      id: c.id,
      style: c.style,
      x: c.x,
      y: c.y,
      w: c.w,
      h: c.h,
      borderRadius: c.borderRadius,
      label: c.label,
    })),
    polishBanners: (state.polishBanners ?? []).map(
      (b: import('./store/historySlice').PolishBanner) => ({ ...b }),
    ),
  };
}

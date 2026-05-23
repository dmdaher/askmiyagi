'use client';

import { useMemo } from 'react';
import { useEditorStore } from './store';
import SectionFrame from './SectionFrame';
import ControlLayer from './ControlLayer';
import PolishBannerLayer from './PolishBannerLayer';
import GroupLabelNode from './GroupLabelNode';
import LabelLayer from './LabelLayer';
import GroupOverlay from './GroupOverlay';
import GridOverlay from './GridOverlay';
import PhotoOverlay from './PhotoOverlay';
import DragSelectRect from './DragSelectRect';
import KeyboardSection from './KeyboardSection';
import ContainerNode from './ContainerNode';
import GuideLayer from './GuideLayer';
import PanelRenderer from '@/components/controls/PanelRenderer';
import { storeToManifest } from './storeToManifest';

export default function PanCanvas() {
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const sections = useEditorStore((s) => s.sections);
  const groupLabels = useEditorStore((s) => s.groupLabels);
  const controlContainers = useEditorStore((s) => s.controlContainers);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const previewMode = useEditorStore((s) => s.previewMode);
  const showHiddenSections = useEditorStore((s) => s.showHiddenSections);
  const testLedsActive = useEditorStore((s) => s.testLedsActive);
  const controls = useEditorStore((s) => s.controls);

  // Sort sections by area: largest first (rendered at bottom), smallest last (on top).
  const sectionEntries = Object.values(sections).sort(
    (a, b) => (b.w * b.h) - (a.w * a.h)
  );

  // Build manifest for PanelRenderer in preview mode. When Test LEDs is on,
  // forge LED fields on every LED-capable control so the renderer's gate
  // `if (!hasLed || !ledColor) return empty` doesn't skip rendering.
  // Default ledColor when not set: green (#22c55e) — common LED indicator color.
  const manifest = useMemo(() => {
    if (!previewMode) return null;
    const base = storeToManifest(useEditorStore.getState());
    if (!testLedsActive) return base;

    const isLedCapable = (c: { hasLed?: boolean; type?: string; ledColor?: string; ledStyle?: string; ledVariant?: string }) =>
      c.hasLed === true
      || c.type === 'led'
      || c.type === 'indicator'
      || c.type === 'pad'
      || !!c.ledColor
      || !!c.ledStyle
      || !!c.ledVariant;

    // Force hasLed=true + a default ledColor on every LED-capable control
    // so the production rendering paths actually fire. Manifest is locally
    // synthesized for preview only — never written to disk.
    const forgedControls = (base.controls ?? []).map((c: any) => {
      if (!isLedCapable(c)) return c;
      return {
        ...c,
        hasLed: true,
        ledColor: c.ledColor ?? '#22c55e',
      };
    });
    return { ...base, controls: forgedControls };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewMode, testLedsActive, sections]);

  // EP3b: when Test LEDs is on in preview mode, build a synthetic panelState
  // that flips ledOn=true for every LED-capable control. "LED-capable" is
  // inferred from ANY of these signals (real manifests are inconsistent —
  // some controls have ledColor/ledVariant set without hasLed=true, but
  // they still render LEDs):
  //
  //   - `hasLed: true`             — explicit declaration
  //   - `type: 'led' | 'indicator'` — the LED IS the control (synth LFO LEDs,
  //                                   voice LEDs, octave LEDs — 31 on deepmind-12)
  //   - `ledColor` is set          — implies LED hardware (e.g., cdj-3000
  //                                   BEAT_SYNC, KEY_SYNC, MASTER all have
  //                                   ledColor but no explicit hasLed)
  //   - `ledStyle` or `ledVariant` is set — same reasoning
  //   - `type: 'pad'`              — performance pads almost always have
  //                                   RGB-pad LEDs even when hasLed is omitted
  //
  // PanelRenderer consumes panelState exactly as it would a tutorial-driven
  // state, so the rendering goes through the production code path — what
  // you see is truly production-real.
  const testLedsPanelState = useMemo(() => {
    if (!previewMode || !testLedsActive) return undefined;
    const state: Record<string, { active: boolean; ledOn: boolean; ledColor?: string }> = {};
    for (const c of Object.values(controls)) {
      if (!c) continue;
      const isLedCapable =
        c.hasLed === true
        || c.type === 'led'
        || c.type === 'indicator'
        || c.type === 'pad'
        || !!c.ledColor
        || !!c.ledStyle
        || !!c.ledVariant;
      if (isLedCapable) {
        // Pads render their LIT state via `active: true` (the face becomes
        // colored with the pad's `color`); the button-LED rendering paths
        // use `ledOn: true`. Indicators/LEDs use ledOn too. To light EVERY
        // LED-capable control regardless of type, set BOTH.
        state[c.id] = {
          active: c.type === 'pad',
          ledOn: true,
          ledColor: c.ledColor ?? undefined,
        };
      }
    }
    return state;
  }, [previewMode, testLedsActive, controls]);

  return (
    <div
      style={{
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        transformOrigin: '0 0',
        width: canvasWidth,
        height: canvasHeight,
        position: 'relative',
      }}
      onClick={() => setSelectedIds([])}
      onContextMenu={(e) => {
        // Only fire for canvas background clicks (not bubbled from controls)
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.control-node, [data-section-id]') === null) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('editor-context-menu', {
            detail: { controlId: '__canvas__', clientX: e.clientX, clientY: e.clientY },
          }));
        }
      }}
    >
      {previewMode && manifest ? (
        /* Preview mode — PanelRenderer shows exact production output.
           When Test LEDs is on, panelState forces ledOn=true on hasLed controls. */
        <PanelRenderer manifest={manifest} panelState={testLedsPanelState} />
      ) : (
        <>
          {/* Canvas background */}
          <div
            className="absolute inset-0 rounded border border-gray-800"
            style={{ backgroundColor: '#111122' }}
          />

          {/* Photo overlay (behind everything) */}
          <PhotoOverlay />

          {/* Grid overlay */}
          <GridOverlay />

          {/* Drag-select rubber band (behind sections, above grid) */}
          <DragSelectRect />

          {/* Section frames — visual boxes + banners only (no child controls).
              Hidden sections render as a faint ghost outline by default so
              contractor can re-select them. When showHiddenSections is OFF
              (toolbar toggle), they're fully suppressed from the editor —
              contractor must use the Layers panel to reach them.
              PREVIEW always omits hidden sections regardless. */}
          {sectionEntries
            .filter((section) => {
              if (showHiddenSections) return true;
              const mode = section.frameMode ?? (section.hidden ? 'hidden' : 'full');
              return mode !== 'hidden';
            })
            .map((section, index) => (
              <SectionFrame key={section.id} sectionId={section.id} zIndex={index + 1} />
            ))}

          {/* Visual containers — between sections and controls (z=2-4) */}
          {controlContainers.map((c) => (
            <ContainerNode key={c.id} container={c} />
          ))}

          {/* Polish banners — decorative overlay (z=5, above sections + containers, below controls) */}
          <PolishBannerLayer />

          {/* All controls — flat layer above sections, never blocked by overlap */}
          <ControlLayer />

          {/* Group bounding-box overlays (hovered / selected) */}
          <GroupOverlay />

          {/* Group labels (spanning across controls) */}
          {groupLabels.map((gl) => (
            <GroupLabelNode key={gl.id} groupLabel={gl} />
          ))}

          {/* Guide lines — between controls and labels */}
          <GuideLayer />

          {/* Floating labels — rendered above controls */}
          <LabelLayer />

          {/* Keyboard section — draggable/resizable */}
          <KeyboardSection />
        </>
      )}
    </div>
  );
}

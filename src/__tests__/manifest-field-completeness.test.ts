/**
 * Manifest-field-completeness test.
 *
 * Catches the entire bug class of "added a field to ControlDef (or
 * EditorLabel) in the editor's manifestSlice / historySlice, but forgot
 * to thread it through storeToManifest — so it's silently stripped on
 * save and never reaches the preview / production manifest."
 *
 * Real bugs this would have caught:
 *   - `zOrder` (un-threaded for months until PR #138 in 2026-05-17)
 *   - `controlId` on labels (un-threaded for years until PR-2.6 in 2026-05-18)
 *   - `ledOn` on controls (STILL un-threaded as of 2026-05-18 — see
 *     CONTROL_EDITOR_ONLY allowlist entry for TODO)
 *
 * How it works:
 *   1. Build a SENTINEL `ControlDef` and a SENTINEL `EditorLabel` with
 *      every TypeScript-declared field set to a non-undefined value.
 *      `Object.keys()` then gives us the full set of editor-side fields.
 *   2. Run `storeToManifest` with a minimal state containing the sentinels.
 *   3. For each editor-side field, assert it appears in the manifest
 *      output OR is in an explicit allowlist.
 *
 * The allowlists are documented with WHY each entry is excluded:
 *   - 🟢 intentional editor-only (lock state, derivable fields, etc.)
 *   - 🔴 KNOWN BUG with a TODO marker for follow-up
 *
 * Failure mode:
 *   Adding a new field to ControlDef without threading it → test fails
 *   with a clear message naming the missing field. Either thread it
 *   through storeToManifest OR add it to the allowlist with a comment
 *   explaining why it's editor-only.
 */
import { describe, it, expect } from 'vitest';
import { storeToManifest } from '@/components/panel-editor/storeToManifest';
import type { ControlDef } from '@/components/panel-editor/store/manifestSlice';
import type { EditorLabel } from '@/components/panel-editor/store/historySlice';

// ─── Allowlists ─────────────────────────────────────────────────────────────

/**
 * ControlDef fields that are intentionally NOT threaded to the manifest.
 * Each entry MUST have a comment explaining WHY.
 */
const CONTROL_EDITOR_ONLY = new Set<string>([
  // 🟢 Editor-only Rnd lock state — contractor uses lock as a workflow
  // affordance during design; preview doesn't have draggable controls so
  // lock state is meaningless there.
  'locked',
  'resizeLocked',

  // 🟢 Derivable per-mode. Editor tracks section membership for the Layers
  // panel tree + section-frame rendering; preview doesn't need it because
  // controls render at their absolute editorPosition, sections are just
  // visual frames. (Section frames in preview iterate editorSections
  // independently.)
  'sectionId',

  // 🟢 Pipeline-set enriched fields that the contractor doesn't modify in
  // the editor. They're read at panel-build time (Layout Engine etc.)
  // but don't affect rendering. Stripping them from contractor saves
  // would slightly bloat manifest history but no functional impact.
  'spatialNeighbors',
  'functionalGroup',
  'containerAssignment',
  'heightSplits',
  'gridCols',
  'gridRows',
  'widthPercent',
  'complexity',
  'sizeClass',
  'primaryLabel',
  'ledBehavior',
  'interactionType',
  'secondaryFunction',
  'orientation',
  'pairedWith',
  'sharedLabel',
  'groupId',

  // 🟢 INTENTIONAL — `ledOn` is the editor's design-time visualization
  // field, NOT a runtime state default. The intended design is:
  //   - Tutorials are the SOURCE OF TRUTH for runtime LED state via
  //     panelStateChanges. Every step explicitly sets `ledOn` for every
  //     LED it cares about; unmentioned LEDs default to off.
  //   - PanelRenderer uses `state.ledOn ?? false` — no manifest fallback
  //     by design.
  //   - The editor's Properties-panel "LED on" toggle
  //     (`PropertiesPanel/index.tsx:567`) and ControlNode dot rendering
  //     (`ledIsOn = control.ledOn === true`) are editor-only visualization
  //     — contractor toggles to PREVIEW what the LED looks like when lit,
  //     not to set a persistent default state.
  //   - Therefore storeToManifest INTENTIONALLY strips ledOn (preview
  //     mode shows what production will show — tutorial state only).
  //     export-manifest INTENTIONALLY strips it (production manifests
  //     don't carry runtime state).
  //
  // Verified by reading fantom-08 tutorials: every step has explicit
  // ledOn in panelStateChanges; relying on a manifest default would
  // break the explicit-set contract.
  //
  // (Earlier session attempt to "fix" this as a threading bug was a
  // misreading of design intent — see git log around 2026-05-18.)
  'ledOn',
]);

/**
 * EditorLabel fields that are intentionally NOT threaded to the manifest.
 */
const LABEL_EDITOR_ONLY = new Set<string>([
  // 🟢 Editor-only Layers-panel grouping. For STANDALONE labels (no
  // controlId), sectionId tracks which section owns the label in the
  // Layers tree. For LINKED labels (controlId set), preview doesn't need
  // this — the linked control's sectionId is authoritative.
  'sectionId',

  // 🟢 Editor color override applied at render time. The manifest
  // currently doesn't have a per-label color field; if it ever needs one,
  // add a comment here and thread it.
  //
  // TODO(post-A1): verify whether `color` should thread (Properties panel
  // exposes it via the label color picker).
  'color',
]);

/**
 * Manifest field name overrides: cases where an editor field is threaded
 * to the manifest under a DIFFERENT key (or as part of a nested object).
 * For each editor field listed here, assert the manifest contains the
 * named alternative instead.
 */
const CONTROL_REMAPPED: Record<string, string[]> = {
  // x/y/w/h are flattened into manifest.controls[].editorPosition.{x,y,w,h}
  x: ['editorPosition'],
  y: ['editorPosition'],
  w: ['editorPosition'],
  h: ['editorPosition'],
};

// ─── Sentinel builders ──────────────────────────────────────────────────────

function sentinelControl(): Required<ControlDef> {
  // Every field present at a non-undefined sentinel value. TypeScript's
  // `Required` removes optional markers; each field still needs the right
  // type. Build by hand — any new ControlDef field must be added here too
  // (which is the test's own forcing function — if a new field is added
  // and you don't update this sentinel, tsc breaks here, prompting both
  // the sentinel update AND the EDITOR_ONLY / threading decision).
  return {
    id: '__sentinel__',
    label: 'L',
    type: 'button',
    x: 1,
    y: 2,
    w: 3,
    h: 4,
    sectionId: 'sec-1',
    labelPosition: 'on-button',
    locked: false,
    resizeLocked: false,
    rotation: 0,
    secondaryLabel: 'S',
    spatialNeighbors: { above: null, below: null, left: null, right: null },
    functionalGroup: 'g',
    containerAssignment: {},
    heightSplits: {},
    gridCols: 1,
    gridRows: 1,
    widthPercent: 50,
    complexity: 'simple',
    shape: 'circle',
    sizeClass: 'medium' as any,
    surfaceColor: '#ffffff',
    buttonStyle: 'standard' as any,
    labelDisplay: 'text-only' as any,
    icon: 'play',
    primaryLabel: 'P',
    hasLed: true,
    ledColor: '#22c55e',
    ledOn: true,
    ledBehavior: 'momentary' as any,
    ledPosition: 'above' as any,
    ledVariant: 'dot' as any,
    ledStyle: 'dot',
    interactionType: 'press' as any,
    secondaryFunction: 'sec-fn',
    positions: 2,
    positionLabels: ['a', 'b'],
    encoderHasPush: true,
    orientation: 'vertical',
    zOrder: 5,
    pairedWith: 'pair-1',
    sharedLabel: 'shared',
    groupId: 'grp-1',
    nestedIn: 'nest-1',
    labelFontSize: 10,
    labelAlign: 'center',
    labelColor: '#000000',
  };
}

function sentinelLabel(): Required<EditorLabel> {
  return {
    id: '__label-sentinel__',
    controlId: 'c-1',
    sectionId: 'sec-1',
    text: 'TXT',
    icon: 'ic',
    x: 5,
    y: 6,
    w: 7,
    fontSize: 8,
    align: 'center',
    hidden: false,
    color: '#abcdef',
  };
}

/**
 * Build a minimal editor-store state that storeToManifest accepts. Only
 * `controls` and `editorLabels` need our sentinels; the other fields are
 * just defaults to satisfy the function's destructuring.
 */
function buildStateWithSentinels(): any {
  return {
    deviceId: 'test',
    deviceName: 'Test',
    manufacturer: 'Test',
    canvasWidth: 100,
    canvasHeight: 100,
    controlScale: 1,
    keyboard: null,
    sections: {},
    controls: { __sentinel__: sentinelControl() },
    editorLabels: [sentinelLabel()],
    groupLabels: [],
    controlContainers: [],
    polishBanners: [],
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('manifest-field-completeness — ControlDef', () => {
  it('every ControlDef field is threaded to manifest OR in EDITOR_ONLY allowlist', () => {
    const state = buildStateWithSentinels();
    const manifest = storeToManifest(state);
    const manifestCtrl = manifest.controls[0] as any;
    const sentinel = sentinelControl();

    const editorKeys = Object.keys(sentinel);
    const manifestKeys = new Set(Object.keys(manifestCtrl));

    const violations: string[] = [];
    for (const key of editorKeys) {
      if (manifestKeys.has(key)) continue;          // threaded ✓
      if (CONTROL_EDITOR_ONLY.has(key)) continue;   // allowlisted ✓
      if (CONTROL_REMAPPED[key]) {
        // Remapped: check the remapped key exists in the manifest
        const ok = CONTROL_REMAPPED[key].some((alt) => manifestKeys.has(alt));
        if (ok) continue;
      }
      violations.push(key);
    }

    if (violations.length > 0) {
      throw new Error(
        `ControlDef fields NOT threaded to manifest AND not in CONTROL_EDITOR_ONLY allowlist:\n` +
          violations.map((v) => `  - ${v}`).join('\n') +
          `\n\nFix options:\n` +
          `  1. Thread the field through storeToManifest + add to ManifestControl interface\n` +
          `  2. Or add to CONTROL_EDITOR_ONLY allowlist with a comment explaining WHY\n` +
          `See src/__tests__/manifest-field-completeness.test.ts for the existing allowlist.`,
      );
    }
  });

  it('CONTROL_EDITOR_ONLY entries are all real ControlDef fields (no dead entries)', () => {
    // Catches the inverse: a field is in the allowlist but not actually on
    // ControlDef anymore (renamed / removed). Prevents allowlist rot.
    const editorKeys = new Set(Object.keys(sentinelControl()));
    const dead: string[] = [];
    for (const k of CONTROL_EDITOR_ONLY) {
      if (!editorKeys.has(k)) dead.push(k);
    }
    expect(dead).toEqual([]);
  });
});

describe('manifest-field-completeness — EditorLabel', () => {
  it('every EditorLabel field is threaded to manifest OR in LABEL_EDITOR_ONLY allowlist', () => {
    const state = buildStateWithSentinels();
    const manifest = storeToManifest(state);
    const manifestLabel = (manifest.editorLabels as any[])[0];
    const sentinel = sentinelLabel();

    const editorKeys = Object.keys(sentinel);
    const manifestKeys = new Set(Object.keys(manifestLabel));

    const violations: string[] = [];
    for (const key of editorKeys) {
      if (manifestKeys.has(key)) continue;
      if (LABEL_EDITOR_ONLY.has(key)) continue;
      violations.push(key);
    }

    if (violations.length > 0) {
      throw new Error(
        `EditorLabel fields NOT threaded to manifest AND not in LABEL_EDITOR_ONLY allowlist:\n` +
          violations.map((v) => `  - ${v}`).join('\n') +
          `\n\nFix options:\n` +
          `  1. Thread the field through storeToManifest + add to ManifestLabel interface\n` +
          `  2. Or add to LABEL_EDITOR_ONLY allowlist with a comment explaining WHY\n` +
          `See src/__tests__/manifest-field-completeness.test.ts for the existing allowlist.`,
      );
    }
  });

  it('LABEL_EDITOR_ONLY entries are all real EditorLabel fields (no dead entries)', () => {
    const editorKeys = new Set(Object.keys(sentinelLabel()));
    const dead: string[] = [];
    for (const k of LABEL_EDITOR_ONLY) {
      if (!editorKeys.has(k)) dead.push(k);
    }
    expect(dead).toEqual([]);
  });
});

describe('manifest-field-completeness — known threading regressions are caught', () => {
  /**
   * Sanity check: the tests above would have CAUGHT each of the historical
   * bug fixes. Document them here so future maintainers see the value.
   */
  it('would have caught the controlId-on-labels bug (fixed in PR-2.6)', () => {
    // Pre-PR-2.6, `controlId` was on EditorLabel but storeToManifest didn't
    // thread it. Asserting controlId IS now in the manifest output proves
    // the fix landed AND that the test would catch a regression.
    const state = buildStateWithSentinels();
    const manifest = storeToManifest(state);
    const lbl = (manifest.editorLabels as any[])[0];
    expect(lbl.controlId).toBe('c-1');
  });

  it('would have caught the zOrder-on-controls bug (fixed in PR #138)', () => {
    // Same idea for zOrder. Threaded since PR #138.
    const state = buildStateWithSentinels();
    const manifest = storeToManifest(state);
    const ctrl = manifest.controls[0] as any;
    expect(ctrl.zOrder).toBe(5);
  });

  it('correctly strips ledOn from manifest (INTENTIONAL — tutorials control LED state)', () => {
    // ledOn is editor design-config only; production tutorials drive all
    // LED state via panelStateChanges. Stripping it from storeToManifest
    // (and export-manifest) is by design. See CONTROL_EDITOR_ONLY comment
    // for ledOn for the full reasoning. If anyone "fixes" this by adding
    // ledOn to the manifest output, this test will fail and prompt them
    // to read the design intent.
    const state = buildStateWithSentinels();
    const manifest = storeToManifest(state);
    const ctrl = manifest.controls[0] as any;
    expect(ctrl.ledOn).toBeUndefined();
    expect(CONTROL_EDITOR_ONLY.has('ledOn')).toBe(true);
  });
});

import { PipelinePhase } from './types';

/**
 * Canonical pipeline phase order. Used by:
 * - PipelineDashboard's phase-progress bar
 * - Admin page's "Ready for Editor" filter
 * - Anywhere else that needs to reason about phase progression
 *
 * `panel-pr` is a legacy phase (replaced by PanelRenderer); kept in the array
 * so older pipelines paused there still resolve to a valid index and are
 * included in `getPhaseIndex(...) >= layoutEngineIndex` checks.
 *
 * Phases 1-3 (Section Loop / Global Assembly / Harmonic Polish) are archived —
 * the contractor editor IS the quality gate. The state-machine PHASE_ORDER
 * already skips them (state-machine.ts:135-139). They remain in the
 * `PipelinePhase` type union (types.ts) for backward compat with legacy state
 * files, and the agent SOUL files (.claude/agents/) are preserved for
 * re-enablement, but they're not part of the canonical active pipeline.
 */
export const PIPELINE_PHASES: PipelinePhase[] = [
  'pending',
  'phase-preflight',
  'phase-0-diagram-parser',
  'phase-0-gatekeeper',
  'phase-0-layout-engine',
  'phase-0-post-editor-check',
  'panel-pr',
  'phase-4-extraction',
  'phase-4-audit',
  'phase-5-display-build',
  'phase-5-tutorial-build',
  'tutorial-review',
  'tutorial-pr',
  'completed',
];

/**
 * Returns the position of `phase` in the canonical order.
 * Returns 0 (treated as "earliest") for unknown phase strings.
 */
export function getPhaseIndex(phase: PipelinePhase): number {
  const idx = PIPELINE_PHASES.indexOf(phase);
  return idx === -1 ? 0 : idx;
}

/**
 * Index of the layout-engine phase. Anything at or past this index
 * has a usable `manifest-editor.json` and should be considered
 * "Ready for Editor" by the admin dashboard filter.
 */
export const LAYOUT_ENGINE_INDEX = getPhaseIndex('phase-0-layout-engine');

/** True when the instrument is past the gatekeeper and has a manifest-editor.json. */
export function isEditorReady(phase: PipelinePhase): boolean {
  return getPhaseIndex(phase) >= LAYOUT_ENGINE_INDEX;
}

/** Index of the gatekeeper phase. Phases ≥ this index imply a usable
 *  manifest exists on disk, regardless of what `phases[]` history says. */
export const GATEKEEPER_INDEX = getPhaseIndex('phase-0-gatekeeper');

/**
 * True when the pipeline has produced a manifest the editor + manifest +
 * layout tabs can render. Checks BOTH phase history AND current-phase
 * position — the position fallback catches the case where Restart has
 * wiped phase history but the manifest is still on disk.
 *
 * Used by:
 * - PipelineDetail (Manifest / Layout tab gating)
 * - DeviceNav (Editor button gating)
 */
export function hasUsableManifest(
  currentPhase: PipelinePhase,
  phases: { phase: string; status: string }[] | undefined,
): boolean {
  if (phases?.some((p) => p.phase === 'phase-0-gatekeeper' && p.status === 'passed')) {
    return true;
  }
  return getPhaseIndex(currentPhase) >= GATEKEEPER_INDEX;
}

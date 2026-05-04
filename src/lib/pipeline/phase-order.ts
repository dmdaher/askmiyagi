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
 */
export const PIPELINE_PHASES: PipelinePhase[] = [
  'pending',
  'phase-preflight',
  'phase-0-diagram-parser',
  'phase-0-gatekeeper',
  'phase-0-layout-engine',
  'panel-pr',
  'phase-1-section-loop',
  'phase-2-global-assembly',
  'phase-3-harmonic-polish',
  'phase-4-extraction',
  'phase-4-audit',
  'phase-5-display-build',
  'phase-5-tutorial-build',
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

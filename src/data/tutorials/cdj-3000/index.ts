/**
 * CDJ-3000 tutorials.
 *
 * Batch A — Foundation & First Branch (T01, T02, T15, T21).
 * Batch B — Core Navigation & Configuration (T03, T19, T22, T23).
 * Batch C — Playing Techniques & Organization (T04, T05, T06, T07, T20).
 * Batch D — Intermediate Techniques (T08, T09, T11, T16, T18).
 * Batch E — Advanced Compound Techniques (T10, T12, T13, T14, T17).
 *
 * Tutorials author against the handcrafted `CDJ3000Panel.tsx` and the committed
 * manifest at `src/data/manifests/cdj-3000.json`. Control IDs are validated by
 * `src/__tests__/tutorials/tutorialControlRefs.test.ts`.
 *
 * Note: `displayState` is intentionally omitted on every step in this batch.
 * The CDJ-3000 panel does not yet wire its `display/DisplayScreen.tsx` dispatcher
 * into the `TOUCH_DISPLAY` slot (tracked as a pre-tutorial blocker in MEMORY.md).
 * Once that wiring lands, future batches — and a follow-up pass on these — can
 * set `displayState` for live screen rendering.
 */

import { Tutorial } from '@/types/tutorial';
import { mediaAndCompatibility } from './media-and-compatibility';
import { sourceSelectionAndLoading } from './source-selection-and-loading';
import { proDjLinkSetup } from './pro-dj-link-setup';
import { utilitySettings } from './utility-settings';
import { basicPlaybackAndTransport } from './basic-playback-and-transport';
import { advancedBrowsing } from './advanced-browsing';
import { shortcutAndMySettings } from './shortcut-and-my-settings';
import { midiHidDjAppControl } from './midi-hid-dj-app-control';
import { waveformAndJogDisplays } from './waveform-and-jog-displays';
import { tempoControl } from './tempo-control';
import { jogWheelTechniques } from './jog-wheel-techniques';
import { cuePoints } from './cue-points';
import { tagListAndOrganization } from './tag-list-and-organization';
import { savingAndRecallingCuePoints } from './saving-and-recalling-cue-points';
import { loopFundamentals } from './loop-fundamentals';
import { hotCues } from './hot-cues';
import { beatSyncAndInstantDoubles } from './beat-sync-and-instant-doubles';
import { beatgridAdjustment } from './beatgrid-adjustment';
// Batch E — Advanced Compound Techniques (PR #182)
import { advancedLoopTechniques } from './advanced-loop-techniques';
import { hotCueAdvanced } from './hot-cue-advanced';
import { quantizeAndBeatJump } from './quantize-and-beat-jump';
import { slipMode } from './slip-mode';
import { keySyncAndKeyShift } from './key-sync-and-key-shift';
// Integration — closing audit-identified workflow gaps (PR-X2)
import { troubleshootingProDjLink } from './troubleshooting-pro-dj-link';
import { liveSetWorkflow } from './live-set-workflow';
import { phaseMeterAndVisualDiagnostics } from './phase-meter-and-visual-diagnostics';
import { multiPlayerBoothSetup } from './multi-player-booth-setup';
import { harmonicMixingStrategy } from './harmonic-mixing-strategy';

export const cdj3000Tutorials: Tutorial[] = [
  mediaAndCompatibility,
  sourceSelectionAndLoading,
  proDjLinkSetup,
  utilitySettings,
  basicPlaybackAndTransport,
  advancedBrowsing,
  shortcutAndMySettings,
  midiHidDjAppControl,
  waveformAndJogDisplays,
  tempoControl,
  jogWheelTechniques,
  cuePoints,
  tagListAndOrganization,
  savingAndRecallingCuePoints,
  loopFundamentals,
  hotCues,
  beatSyncAndInstantDoubles,
  beatgridAdjustment,
  // Batch E
  advancedLoopTechniques,
  hotCueAdvanced,
  quantizeAndBeatJump,
  slipMode,
  keySyncAndKeyShift,
  // Integration
  troubleshootingProDjLink,
  liveSetWorkflow,
  phaseMeterAndVisualDiagnostics,
  multiPlayerBoothSetup,
  harmonicMixingStrategy,
];

export {
  mediaAndCompatibility,
  sourceSelectionAndLoading,
  proDjLinkSetup,
  utilitySettings,
  basicPlaybackAndTransport,
  advancedBrowsing,
  shortcutAndMySettings,
  midiHidDjAppControl,
  waveformAndJogDisplays,
  tempoControl,
  jogWheelTechniques,
  cuePoints,
  tagListAndOrganization,
  savingAndRecallingCuePoints,
  loopFundamentals,
  hotCues,
  beatSyncAndInstantDoubles,
  beatgridAdjustment,
  advancedLoopTechniques,
  hotCueAdvanced,
  quantizeAndBeatJump,
  slipMode,
  keySyncAndKeyShift,
  troubleshootingProDjLink,
  liveSetWorkflow,
  phaseMeterAndVisualDiagnostics,
  multiPlayerBoothSetup,
  harmonicMixingStrategy,
};

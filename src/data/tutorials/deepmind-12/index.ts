/**
 * DeepMind-12 tutorials.
 *
 * NOTE (2026-05-10): Empty placeholder pending tutorial regeneration.
 * The previous 27 tutorial files referenced control IDs from an earlier
 * manifest version (before OSC was split into osc1-/osc2-, before menu
 * prefixes were dropped, etc.) and accumulated ~80% drift against the
 * current `src/data/manifests/deepmind-12.json`. They have been backed
 * up at `.pipeline/deepmind-12/tutorials-backup-pre-migration/` for
 * reference and removed from production until regenerated against the
 * current manifest.
 *
 * To regenerate: run the tutorial-build phase via the admin pipeline
 * dashboard. Once tutorials are committed, remove `'deepmind-12'` from
 * `SKIP_DEVICES` in `src/__tests__/tutorials/tutorialControlRefs.test.ts`
 * so the validator guards future drift.
 */

import { Tutorial } from '@/types/tutorial';

export const deepmind12Tutorials: Tutorial[] = [];

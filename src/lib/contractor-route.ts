'use client';

import { usePathname } from 'next/navigation';

/**
 * useIsContractorRoute — true when the page is rendered under the
 * contractor-facing editor route (`/editor/<id>` or `/editor/practice/<id>`),
 * false for admin (`/admin/<id>/editor`) or anywhere else.
 *
 * Used to decide which data source the panel editor reads from:
 *   - Contractor route → Vercel Blob (live, authoritative for contractor edits)
 *   - Admin route     → local `.pipeline/<id>/manifest-editor.json`
 *
 * Replaces the previous env-based `isHosted` flag (from `src/lib/env.ts`)
 * that conflated both routes into one data source. With the env-based flag,
 * an admin running local dev with NEXT_PUBLIC_EDITOR_MODE=hosted would have
 * their /admin editor silently read Blob instead of their local file —
 * direct local-file edits would stay invisible until pushed.
 *
 * See memory: `project_admin_vs_contractor_route_data_source`.
 *
 * SSR safety: `usePathname()` returns null during server render. We default
 * to false (local-file behavior). On admin route: correct. On contractor
 * route: a single render uses local file before client hydration switches
 * to Blob. Consumers (PanelEditor, useAutoSave) capture this value into
 * dependency arrays so a switch triggers a re-fetch with the correct URL.
 *
 * Note: `isHosted` (env-based) remains useful for non-routing concerns —
 * e.g., `AUTO_SAVE_DEBOUNCE_MS` in useAutoSave.ts uses it to set a longer
 * debounce when running against Blob (higher latency).
 */
export function useIsContractorRoute(): boolean {
  const pathname = usePathname();
  return pathname?.startsWith('/editor/') ?? false;
}

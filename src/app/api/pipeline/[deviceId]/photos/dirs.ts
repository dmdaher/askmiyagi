import path from 'path';

/**
 * Build the ordered list of directories to search for a device's reference
 * photos. Order matters — earlier entries take precedence when multiple
 * exist for the same device.
 *
 * The .pipeline/<deviceId>/input/photos/ fallback is last so admin-curated
 * docs/ copies win, but any device whose photos haven't been manually
 * promoted to docs/ yet still surfaces them automatically via the pipeline's
 * preflight output. Without this fallback, brand-new devices show no photos
 * in the editor until someone manually copies them (dj-ddj-rev1 incident,
 * 2026-05-28).
 *
 * Lives outside route.ts because Next.js's typed-routes validator rejects
 * any non-handler exports from a `route.ts` file.
 */
export function buildPhotoSearchDirs(
  deviceId: string,
  manufacturer: string,
  deviceName: string,
): string[] {
  const dirs = [
    path.join('docs', manufacturer, deviceId, 'photos'),
    path.join('docs', manufacturer, deviceName, 'photos'),
    path.join('.worktrees', deviceId, 'docs', manufacturer, deviceId, 'photos'),
  ];
  const mfr = manufacturer.replace(/ /g, '');
  dirs.push(path.join('docs', mfr, deviceId, 'photos'));
  dirs.push(path.join('.pipeline', deviceId, 'input', 'photos'));
  return dirs;
}

/**
 * Computes a structural hash of a manifest for staleness detection.
 *
 * Includes fields that the editor should NOT override (structural/visual properties).
 * Excludes fields that the editor SHOULD override (positions: x, y, w, h).
 *
 * When the hash changes, the editor manifest is stale and should be discarded.
 * When the hash is the same, the editor's positioning edits are still valid.
 */

interface ManifestControl {
  id: string;
  type?: string;
  section?: string;
  shape?: string;
  sizeClass?: string;
  archetype?: string;
}

interface ManifestSection {
  id: string;
  archetype?: string;
}

interface ManifestLike {
  controls?: ManifestControl[] | Record<string, ManifestControl>;
  sections?: ManifestSection[] | Record<string, ManifestSection>;
}

export function computeManifestVersion(manifest: ManifestLike): string {
  // Normalize controls to array
  const controls = Array.isArray(manifest.controls)
    ? manifest.controls
    : manifest.controls
      ? Object.values(manifest.controls)
      : [];

  // Normalize sections to array
  const sections = Array.isArray(manifest.sections)
    ? manifest.sections
    : manifest.sections
      ? Object.values(manifest.sections)
      : [];

  // Build structural fingerprint — sorted for determinism
  const controlFingerprints = controls
    .map(c => `${c.id}:${c.type ?? ''}:${c.section ?? ''}:${c.shape ?? ''}:${c.sizeClass ?? ''}`)
    .sort();

  const sectionFingerprints = sections
    .map(s => `${s.id}:${s.archetype ?? ''}`)
    .sort();

  const payload = JSON.stringify({
    controls: controlFingerprints,
    sections: sectionFingerprints,
  });

  // Simple hash — djb2 algorithm, produces a hex string
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = ((hash << 5) + hash + payload.charCodeAt(i)) & 0xffffffff;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

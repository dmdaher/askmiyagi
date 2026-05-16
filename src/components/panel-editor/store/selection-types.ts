/**
 * Unified selection types for Figma-style multi-select.
 *
 * Today the editor stores selection across multiple fields:
 *   - selectedIds: string[]       (controls + sections, mixed)
 *   - selectedLabelId: string|null (single label)
 *   - selectedContainerId: string|null
 *   - selectedBannerId: string|null
 *
 * These cannot represent "3 controls + 2 labels + 1 section selected at
 * once" — mixed selection is impossible by construction.
 *
 * MS1 (this file) adds a single unified array `selection: SelectableId[]`
 * to the store. Each entry is a `${type}:${id}` string (e.g.
 * `'control:cutoff'`, `'label:lbl-12'`). Subsequent commits will wire
 * actions (toggleSelection, moveSelection, deleteSelection) and switch
 * consumers (DragSelectRect, ControlNode click, LabelLayer click,
 * useEditorKeyboard, PropertiesPanel) to use it.
 *
 * Back-compat: existing selectedIds / selectedLabelId / etc. remain in
 * the store and continue to drive every consumer unchanged. Once MS1 is
 * stable in `test`, MS2 introduces sync between the two; MS3+ migrate
 * call-sites; final removal of the old fields is the LAST commit.
 *
 * Why prefixed strings instead of `{ type, id }` tuples:
 *   - Compatible with existing array helpers (Set, includes, filter)
 *   - Cheap structural equality (no shallow-compare gotchas)
 *   - Figma, Sketch, Penpot all use this internally for the same reason
 */

export type SelectableType =
  | 'control'
  | 'label'
  | 'section'
  | 'container'
  | 'banner'
  | 'groupLabel';

/**
 * Prefixed-ID representation of an item in the unified selection set.
 * Format: `${SelectableType}:${id}`. Use parseSelectableId/formatSelectableId
 * to convert to/from `{ type, id }` form.
 */
export type SelectableId = `${SelectableType}:${string}`;

const SELECTABLE_TYPES: ReadonlyArray<SelectableType> = [
  'control', 'label', 'section', 'container', 'banner', 'groupLabel',
];

/** Build a SelectableId from a (type, id) pair. */
export function formatSelectableId(type: SelectableType, id: string): SelectableId {
  return `${type}:${id}` as SelectableId;
}

/**
 * Parse a SelectableId. Returns null when the input doesn't match the
 * `${type}:${id}` format with a known type — callers should treat this as
 * "not in our selection model" and ignore rather than throw, since
 * selection arrays may contain stale prefixes after a typo or refactor.
 */
export function parseSelectableId(sid: string): { type: SelectableType; id: string } | null {
  const colon = sid.indexOf(':');
  if (colon <= 0 || colon === sid.length - 1) return null;
  const type = sid.slice(0, colon);
  if (!(SELECTABLE_TYPES as ReadonlyArray<string>).includes(type)) return null;
  return { type: type as SelectableType, id: sid.slice(colon + 1) };
}

/** Filter a selection array down to a single type, returning the raw ids. */
export function selectionOfType(
  selection: ReadonlyArray<SelectableId>,
  type: SelectableType,
): string[] {
  const prefix = `${type}:`;
  const result: string[] = [];
  for (const sid of selection) {
    if (sid.startsWith(prefix)) result.push(sid.slice(prefix.length));
  }
  return result;
}

/** True when the array contains at least one entry of the given type. */
export function hasSelectionOfType(
  selection: ReadonlyArray<SelectableId>,
  type: SelectableType,
): boolean {
  const prefix = `${type}:`;
  return selection.some((sid) => sid.startsWith(prefix));
}

/** Set of unique entity types present in the selection. */
export function selectionTypes(selection: ReadonlyArray<SelectableId>): Set<SelectableType> {
  const out = new Set<SelectableType>();
  for (const sid of selection) {
    const parsed = parseSelectableId(sid);
    if (parsed) out.add(parsed.type);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Phase 6a — typed selector helpers that mirror the legacy single-slot
// fields' semantics exactly. Each one derives its value from the unified
// `selection` array. Callers that previously read `selectedIds` /
// `selectedLabelId` / `selectedBannerId` can migrate to these helpers and
// get identical behavior, even before the legacy fields are deleted.
//
// Critical: each helper preserves the EXACT contract of its legacy field.
//   - selectedControlIds = selectedIds (controls + sections, "mixed bag")
//   - selectedLabelIdFromSelection = selectedLabelId (single label id OR null)
//   - selectedBannerIdFromSelection = selectedBannerId (single banner id OR null)
//
// The legacy fields' tricky parts:
//   - selectedIds includes BOTH controls and sections (per setSelectedIds
//     mirror logic in manifestSlice — sections present as 'section:' prefix
//     in unified). So selectedControlIds returns control AND section ids.
//   - selectedLabelId is null when 0 OR 2+ labels are in selection (multi-
//     label is not representable in the single-slot field). We mirror that.
//   - selectedBannerId is null when 0 OR 2+ banners are in selection.
// ---------------------------------------------------------------------------

/**
 * Derive `selectedIds` (controls + sections) from the unified selection.
 * Matches the legacy `selectedIds` field's "mixed bag" contract exactly.
 */
export function selectedControlIds(selection: ReadonlyArray<SelectableId>): string[] {
  const out: string[] = [];
  for (const sid of selection) {
    if (sid.startsWith('control:')) out.push(sid.slice('control:'.length));
    else if (sid.startsWith('section:')) out.push(sid.slice('section:'.length));
  }
  return out;
}

/**
 * Derive `selectedLabelId` from the unified selection.
 * Returns the label id only when EXACTLY one label is selected — matches
 * the legacy single-slot semantics. Multi-label selection returns null,
 * just like the legacy field would.
 */
export function selectedLabelIdFromSelection(
  selection: ReadonlyArray<SelectableId>,
): string | null {
  const labelIds = selectionOfType(selection, 'label');
  return labelIds.length === 1 ? labelIds[0] : null;
}

/**
 * Derive `selectedBannerId` from the unified selection.
 * Returns the banner id only when EXACTLY one banner is selected.
 */
export function selectedBannerIdFromSelection(
  selection: ReadonlyArray<SelectableId>,
): string | null {
  const bannerIds = selectionOfType(selection, 'banner');
  return bannerIds.length === 1 ? bannerIds[0] : null;
}

/**
 * Derive a single selected section id from the unified selection.
 * Returns null when 0 or 2+ sections are selected.
 */
export function selectedSectionIdFromSelection(
  selection: ReadonlyArray<SelectableId>,
): string | null {
  const sectionIds = selectionOfType(selection, 'section');
  return sectionIds.length === 1 ? sectionIds[0] : null;
}

/**
 * Quick "is this entity selected?" check by raw id. Convenience over
 * `selection.includes(\`control:${id}\`)` because most consumers know
 * which type they're asking about.
 */
export function isControlSelected(
  selection: ReadonlyArray<SelectableId>,
  controlId: string,
): boolean {
  return selection.includes(`control:${controlId}` as SelectableId);
}

export function isLabelSelected(
  selection: ReadonlyArray<SelectableId>,
  labelId: string,
): boolean {
  return selection.includes(`label:${labelId}` as SelectableId);
}

export function isSectionSelected(
  selection: ReadonlyArray<SelectableId>,
  sectionId: string,
): boolean {
  return selection.includes(`section:${sectionId}` as SelectableId);
}

export function isBannerSelected(
  selection: ReadonlyArray<SelectableId>,
  bannerId: string,
): boolean {
  return selection.includes(`banner:${bannerId}` as SelectableId);
}

/**
 * Selection size counted per type. Useful for the routing logic in
 * PropertiesPanel and any consumer that needs a "what's selected?"
 * summary without the full breakdown.
 */
export function selectionCounts(
  selection: ReadonlyArray<SelectableId>,
): { control: number; label: number; section: number; banner: number; container: number; groupLabel: number; total: number } {
  const counts = { control: 0, label: 0, section: 0, banner: 0, container: 0, groupLabel: 0, total: selection.length };
  for (const sid of selection) {
    const parsed = parseSelectableId(sid);
    if (parsed) counts[parsed.type]++;
  }
  return counts;
}

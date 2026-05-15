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

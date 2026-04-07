# Missing Common Section Controls Bug

**Problem:** 22 of 23 controls in the common section are missing from manifest-editor.json. Only `display` exists. Write, Master FX, Motional Pad, DAW Ctrl, Menu, E1-E6, Tempo, Value Dial, Dec, Inc, cursor controls, Shift, Exit, Enter — all missing.

**Impact:** These controls don't appear in the editor or the generated panel.

**Data:**
- Pipeline manifest.json: all 23 controls present ✓
- manifest-editor.json: only `display` has control data, other 22 IDs listed in section childIds but no matching control entries

**Likely causes:**
1. `loadFromManifest` in manifestSlice.ts failed to create ControlDef entries for these controls (maybe they lacked bounding box data from the gatekeeper)
2. A save cycle wrote only the controls that had been loaded, losing the unloaded ones
3. The gatekeeper manifest may have had these controls in a different format that loadFromManifest didn't handle

**To fix:**
1. Check if these controls have `panelBoundingBox` or position data in the pipeline manifest
2. If they do, the loadFromManifest function has a bug that drops them
3. If they don't, the gatekeeper/diagram parser failed to extract their positions
4. Either way: re-run loadFromManifest from the pipeline manifest to recover the controls, or manually add them in the editor

**Priority:** HIGH — 22 missing controls means the panel is incomplete

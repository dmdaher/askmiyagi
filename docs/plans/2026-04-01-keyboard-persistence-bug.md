# Keyboard Persistence Bug

**Problem:** Keyboard width/position revert to defaults after Approve & Build or page navigation. The contractor sets leftPercent, widthPercent, and panelHeightPercent but they don't stick.

**Symptoms:**
- Set keyboard width to 93%, left offset to 5%
- Click Approve & Build → view live panel → go back to editor
- Keyboard has reverted to default width/position

**Likely causes to investigate:**
1. `handleApproveAndBuild` force-save may not include keyboard field
2. The codegen API may overwrite keyboard data in manifest.json
3. The editor restore path may reload keyboard from pipeline manifest instead of editor manifest
4. The "skip if loaded" guard may not preserve keyboard changes made after initial load
5. Auto-save PUT body may not include keyboard field

**Files to check:**
- `src/components/panel-editor/PanelEditor.tsx` — handleApproveAndBuild PUT body, restore path
- `src/components/panel-editor/hooks/useAutoSave.ts` — does PUT body include keyboard?
- `src/app/api/pipeline/[deviceId]/manifest/route.ts` — does GET carry over keyboard?
- `src/app/api/pipeline/[deviceId]/codegen/route.ts` — does codegen overwrite keyboard?
- `src/components/panel-editor/store/historySlice.ts` — keyboard in snapshots (already added)

**Priority:** HIGH — affects every instrument with a keyboard

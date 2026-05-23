import { useEditorStore } from '../store';

/**
 * Mark the editor as having received a genuine user interaction.
 * Call this from UI event handlers (drag start, resize start, property change, keyboard shortcut).
 * Do NOT call from programmatic state changes (loadFromManifest, restore).
 *
 * This gates auto-save: the editor won't save to manifest-editor.json until
 * the user has actually interacted, preventing stale state from clobbering
 * fresh pipeline data.
 */
export function markEdited() {
  if (!useEditorStore.getState().hasUserEdited) {
    useEditorStore.setState({ hasUserEdited: true });
  }
}

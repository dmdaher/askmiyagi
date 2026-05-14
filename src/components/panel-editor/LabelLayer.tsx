'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from './store';
import type { EditorLabel } from './store';
import SharedLabel from '@/components/panel/SharedLabel';

/**
 * Renders all editorLabels as a flat overlay on the editor canvas.
 * Labels are absolutely positioned, draggable, and editable.
 */
export default function LabelLayer() {
  const editorLabels = useEditorStore((s) => s.editorLabels) as EditorLabel[];
  const controls = useEditorStore((s) => s.controls);
  const controlScale = useEditorStore((s) => s.controlScale);
  const showLabels = useEditorStore((s) => s.showLabels);
  const moveLabel = useEditorStore((s) => s.moveLabel);
  const updateLabel = useEditorStore((s) => s.updateLabel);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const deleteLabel = useEditorStore((s) => s.deleteLabel);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const zoom = useEditorStore((s) => s.zoom);
  const selectedLabel = useEditorStore((s) => s.selectedLabelId);
  const setSelectedLabel = useEditorStore((s) => s.setSelectedLabel);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  // Set by flashLabelCreated for ~2.5s after a new label is added; drives
  // the "flash" outline below so the contractor can see where it landed.
  const recentlyCreatedLabelId = useEditorStore((s) => s.recentlyCreatedLabelId);

  const [dragging, setDragging] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const dragStart = useRef<{ x: number; y: number; labelX: number; labelY: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Center a label horizontally on its linked control (Figma-style: align center points)
  const centerOnControl = useCallback((labelId: string) => {
    const label = editorLabels.find(l => l.id === labelId);
    if (!label || !label.controlId) return;
    const ctrl = controls[label.controlId];
    if (!ctrl) return;

    // Figma-style: align label center X to control center X.
    // Give label a generous width and use textAlign:center so
    // text naturally centers regardless of text length.
    const ctrlVisW = ctrl.w * controlScale;
    const ctrlCenterX = ctrl.x + ctrlVisW / 2;
    const labelW = Math.max(ctrlVisW, 60); // just wide enough to center on control
    pushSnapshot();
    updateLabel(labelId, {
      x: Math.round(ctrlCenterX - labelW / 2),
      w: Math.round(labelW),
      align: 'center',
    });
  }, [editorLabels, controls, controlScale, pushSnapshot, updateLabel]);

  // Keyboard: Delete, Escape, C (center on control)
  useEffect(() => {
    if (!selectedLabel || editing) return;
    const handler = (e: KeyboardEvent) => {
      // Don't intercept keys when focus is inside an input/textarea (e.g., Properties panel)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        pushSnapshot();
        deleteLabel(selectedLabel);
        setSelectedLabel(null);
      } else if (e.key === 'Escape') {
        setSelectedLabel(null);
      } else if (e.key === 'c' || e.key === 'C') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          centerOnControl(selectedLabel);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedLabel, editing, pushSnapshot, deleteLabel, centerOnControl]);

  const handleMouseDown = useCallback((e: React.MouseEvent, label: EditorLabel) => {
    if (editing === label.id) return;
    e.stopPropagation();
    e.preventDefault();
    // Option/Alt+click drills down through the label to the underlying
    // control — mirrors the cycle-to-background behavior on ControlNode.
    // Without this, labels swallow alt-clicks and the user can't reach
    // the control beneath. setSelectedIds clears selectedLabelId, so the
    // visual selection moves cleanly from the label to the control.
    if (e.altKey && label.controlId) {
      setSelectedIds([label.controlId]);
      return;
    }
    setSelectedLabel(label.id);
    setDragging(label.id);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      labelX: label.x,
      labelY: label.y,
    };

    const handleMouseMove = (me: MouseEvent) => {
      if (!dragStart.current) return;
      const rawDx = (me.clientX - dragStart.current.x) / zoom;
      const rawDy = (me.clientY - dragStart.current.y) / zoom;
      // Snap to grid — same grid as controls
      const snap = snapGrid ?? 1;
      const dx = Math.round(rawDx / snap) * snap;
      const dy = Math.round(rawDy / snap) * snap;
      if (dx === 0 && dy === 0) return;
      moveLabel(label.id, dx, dy);
      dragStart.current.x += dx * zoom;
      dragStart.current.y += dy * zoom;
    };

    const handleMouseUp = () => {
      setDragging(null);
      dragStart.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    pushSnapshot();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [editing, zoom, moveLabel, pushSnapshot]);

  const handleDoubleClick = useCallback((label: EditorLabel) => {
    setEditing(label.id);
    setEditText(label.text);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const commitEdit = useCallback((labelId: string) => {
    pushSnapshot();
    updateLabel(labelId, { text: editText });
    setEditing(null);
  }, [editText, pushSnapshot, updateLabel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, labelId: string) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitEdit(labelId);
    } else if (e.key === 'Escape') {
      setEditing(null);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      // Don't delete the label when editing — let textarea handle it
      e.stopPropagation();
    }
  }, [commitEdit]);

  // Early return AFTER all hooks — React's Rules of Hooks require consistent
  // hook counts across renders. Toggling showLabels can't change hook count.
  if (!showLabels) return null;

  return (
    <div className="absolute inset-0" style={{ zIndex: 150, pointerEvents: 'none' }}>
      {editorLabels.map((label) => (
        <div key={label.id}>
          {/* Label text — hidden labels render at low opacity so they're
              still findable and clickable in the editor (codegen skips them
              entirely in the generated panel). */}
          {editing !== label.id && (
            <SharedLabel
              label={{
                id: label.id,
                text: label.text,
                icon: label.icon,
                x: label.x,
                y: label.y,
                w: label.w,
                fontSize: label.fontSize,
                align: label.align,
                color: label.color,
                hidden: label.hidden,
              }}
              opacity={label.hidden ? 0.25 : (dragging === label.id ? 0.7 : 1)}
              outline={
                selectedLabel === label.id
                  ? '1px solid rgba(59,130,246,0.8)'
                  : label.hidden
                    ? '1px dashed rgba(251,191,36,0.4)'
                    : 'none'
              }
              zIndex={dragging === label.id ? 200 : selectedLabel === label.id ? 100 : 60}
              outerClassName={recentlyCreatedLabelId === label.id ? 'label-flash-new' : undefined}
              innerSpanProps={{
                'data-label-id': label.id,
                className: 'pointer-events-auto cursor-move',
                onMouseDown: (e) => handleMouseDown(e, label),
                onDoubleClick: () => handleDoubleClick(label),
                onContextMenu: (e) => {
                  // Right-click on a canvas label opens the same label menu
                  // as right-click in the Layers panel sidebar tree.
                  e.preventDefault();
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('editor-context-menu-label', {
                    detail: {
                      labelId: label.id,
                      controlId: label.controlId,
                      hasSectionId: !!label.sectionId,
                      clientX: e.clientX,
                      clientY: e.clientY,
                    },
                  }));
                },
              }}
            />
          )}

          {/* Inline editor */}
          {editing === label.id && (
            <div
              className="absolute"
              style={{
                left: label.x,
                top: label.y,
                zIndex: 60,
              }}
            >
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => commitEdit(label.id)}
                onKeyDown={(e) => handleKeyDown(e, label.id)}
                rows={Math.max(1, editText.split('\n').length)}
                className="bg-gray-900 border border-blue-500 text-[10px] text-white px-1 py-0.5 rounded text-center outline-none resize-none"
                style={{ minWidth: 60, fontSize: label.fontSize }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

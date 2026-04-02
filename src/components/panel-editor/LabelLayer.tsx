'use client';

import { useCallback, useRef, useState } from 'react';
import { useEditorStore } from './store';
import type { EditorLabel } from './store';

/**
 * Renders all editorLabels as a flat overlay on the editor canvas.
 * Labels are absolutely positioned, draggable, and editable.
 */
export default function LabelLayer() {
  const editorLabels = useEditorStore((s) => s.editorLabels) as EditorLabel[];
  const showLabels = useEditorStore((s) => s.showLabels);
  const moveLabel = useEditorStore((s) => s.moveLabel);
  const updateLabel = useEditorStore((s) => s.updateLabel);
  const deleteLabel = useEditorStore((s) => s.deleteLabel);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const zoom = useEditorStore((s) => s.zoom);

  const [dragging, setDragging] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const dragStart = useRef<{ x: number; y: number; labelX: number; labelY: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!showLabels) return null;

  const handleMouseDown = useCallback((e: React.MouseEvent, label: EditorLabel) => {
    if (editing === label.id) return; // Don't drag while editing
    e.stopPropagation();
    e.preventDefault();
    setDragging(label.id);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      labelX: label.x,
      labelY: label.y,
    };

    const handleMouseMove = (me: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = (me.clientX - dragStart.current.x) / zoom;
      const dy = (me.clientY - dragStart.current.y) / zoom;
      // Live preview — update position directly
      moveLabel(label.id, dx, dy);
      dragStart.current.x = me.clientX;
      dragStart.current.y = me.clientY;
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

  return (
    <>
      {editorLabels.map((label) => (
        <div key={label.id}>
          {/* Label text */}
          {editing !== label.id && (
            <div
              className="absolute pointer-events-auto cursor-move select-none"
              style={{
                left: label.x,
                top: label.y,
                fontSize: label.fontSize,
                textAlign: label.align,
                zIndex: dragging === label.id ? 50 : 5,
                opacity: dragging === label.id ? 0.7 : 1,
              }}
              onMouseDown={(e) => handleMouseDown(e, label)}
              onDoubleClick={() => handleDoubleClick(label)}
            >
              <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                {label.text.split('\n').map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </span>
            </div>
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
    </>
  );
}

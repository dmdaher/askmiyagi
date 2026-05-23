'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * "More ▾" dropdown — toolbar overflow menu for less-frequently-used
 * actions that don't deserve a top-level toolbar slot but still need
 * to be one click away. Keeps the toolbar single-line on narrow
 * viewports.
 *
 * Currently houses: Report Issue, Reset Sizes (local-mode only).
 *
 * Items are passed in as `items` so the parent (EditorToolbar) controls
 * which appear based on environment (isHosted / isSandbox / previewMode).
 */
export interface MoreDropdownItem {
  /** Visible label (left-aligned) */
  label: string;
  /** Optional left-side icon (emoji or short string) */
  icon?: string;
  /** Optional disabled state. Disabled items render greyed out + unclickable */
  disabled?: boolean;
  /** Optional title attribute / hover tooltip */
  title?: string;
  /** Optional intent — 'danger' renders in red on hover */
  danger?: boolean;
  /** Action handler */
  onClick: () => void;
}

interface MoreDropdownProps {
  items: MoreDropdownItem[];
  /** Disable the dropdown trigger itself (e.g., in preview mode) */
  disabled?: boolean;
}

export default function MoreDropdown({ items, disabled }: MoreDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Outside-click close
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`flex h-6 items-center rounded px-2 text-[10px] font-medium whitespace-nowrap transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
          open
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'
        }`}
        title="More actions"
      >
        More ▾
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-full mt-1 z-[1000] min-w-[180px] rounded border border-gray-700 bg-[#15151f] shadow-lg py-1">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                if (item.disabled) return;
                item.onClick();
                setOpen(false);
              }}
              disabled={item.disabled}
              title={item.title}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] disabled:opacity-30 disabled:cursor-not-allowed ${
                item.danger
                  ? 'text-gray-300 hover:bg-red-500/10 hover:text-red-200'
                  : 'text-gray-300 hover:bg-blue-500/10 hover:text-blue-200'
              }`}
            >
              {item.icon && <span className="text-xs flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

/**
 * DisplayContent — polymorphic renderer for tutorial-driven display state.
 *
 * Pipeline-built instruments (DeepMind-12, xdj-rx3, Fantom-06, etc.) emit
 * `displayState` from their tutorial steps. Before this component, PanelRenderer
 * ignored displayState and rendered hardcoded mock content — so users saw an
 * empty waveform pattern even when the tutorial author had specified a status
 * message, menu, or page title.
 *
 * Approach: polymorphic rendering driven by which fields are present, not by
 * `screenType`. This naturally covers DeepMind's 5 screen types (home / menu /
 * write / chord-memory / pattern) which boil down to 3 visual shapes:
 *   - Status line  (statusText + selectedIndex)        → home, chord-memory, pattern
 *   - Titled list  (title + menuItems + selectedIndex) → menu
 *   - Header + status (title + statusText + selectedIndex) → write
 *
 * Unknown / unmapped fields are rendered generically — better than the
 * silently-ignored mock content. When displayState is undefined entirely,
 * PanelRenderer falls back to the existing `showMockContent` behavior so
 * editor preview and non-tutorial views are unchanged.
 *
 * Per-instrument styled screens (e.g., a bespoke CDJ track-loaded screen
 * with album art + waveform) can be added later as separate components.
 * This file covers the common case for synth/DJ panels whose displays are
 * compact text-centric LCDs.
 *
 * Origin: 2026-05-10 (R1 — tutorial renderer parity).
 */

import type { DisplayState } from '@/types/display';

interface DisplayContentProps {
  displayState: DisplayState;
  width: number;
  height: number;
}

/**
 * Generic primitive fields we'll render automatically when present.
 * Skipped from this list: title, statusText, menuItems, selectedIndex
 * (handled explicitly), and complex nested fields (zones[], toneEditData,
 * sequencerData, etc.) which need bespoke renderers per screen type.
 */
const GENERIC_PRIMITIVE_FIELDS: ReadonlyArray<keyof DisplayState> = [
  'parameterName',
  'parameterValue',
  'confirmText',
  'sceneName',
  'sceneNumber',
  'tempo',
  'beatSignature',
] as const;

export default function DisplayContent({ displayState, width, height }: DisplayContentProps) {
  const { title, statusText, menuItems, selectedIndex } = displayState;

  // Tiny screens get tiny fonts — proportional, with a sensible floor
  const baseFontPx = Math.max(8, Math.round(height * 0.085));
  const titleFontPx = Math.max(9, Math.round(height * 0.1));

  // Generic primitive fields present (rendered as labeled rows)
  const primitives = GENERIC_PRIMITIVE_FIELDS
    .map((key) => ({ key, value: displayState[key] }))
    .filter((p): p is { key: keyof DisplayState; value: string | number } =>
      p.value !== undefined && p.value !== null && (typeof p.value === 'string' || typeof p.value === 'number'),
    );

  const hasMenu = Array.isArray(menuItems) && menuItems.length > 0;
  const hasMain = Boolean(statusText) || hasMenu || primitives.length > 0;

  return (
    <div
      className="absolute inset-0 flex flex-col font-mono leading-tight"
      style={{
        color: '#9bcfff',
        padding: Math.max(2, Math.round(height * 0.04)),
        fontSize: baseFontPx,
        // Pixelated feel matches the LCD aesthetic
        textShadow: '0 0 1px rgba(155,207,255,0.4)',
      }}
      data-display-content
    >
      {title && (
        <div
          className="uppercase text-center font-semibold tracking-wide truncate"
          style={{
            color: '#bfdfff',
            fontSize: titleFontPx,
            borderBottom: '1px solid #2a4a6a',
            paddingBottom: Math.max(1, Math.round(height * 0.02)),
            marginBottom: Math.max(2, Math.round(height * 0.04)),
          }}
        >
          {title}
        </div>
      )}

      {/* Status text — main content for home/chord-memory/pattern/write screens */}
      {statusText && (
        <div className="text-center px-1" style={{ marginBottom: Math.max(2, Math.round(height * 0.04)) }}>
          {statusText}
        </div>
      )}

      {/* Menu items — for 'menu' screen type */}
      {hasMenu && (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ gap: Math.max(0, Math.round(height * 0.01)) }}>
          {menuItems!.map((item, i) => {
            const isSelected = selectedIndex === i;
            const label = typeof item === 'string' ? item : item?.label ?? '';
            return (
              <div
                key={i}
                className="flex items-center truncate"
                style={{
                  paddingLeft: Math.max(2, Math.round(width * 0.01)),
                  paddingRight: Math.max(2, Math.round(width * 0.01)),
                  backgroundColor: isSelected ? '#2a4a6a' : 'transparent',
                  color: isSelected ? '#ffffff' : '#9bcfff',
                }}
              >
                <span style={{ width: baseFontPx, flexShrink: 0 }}>{isSelected ? '▶' : ''}</span>
                <span className="truncate">{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Generic primitive fields — fallback for unmapped screen types */}
      {primitives.length > 0 && (
        <div className="flex-1 flex flex-col" style={{ gap: 1 }}>
          {primitives.map(({ key, value }) => (
            <div key={key} className="flex justify-between truncate">
              <span className="text-[#7ba8d4] uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className="ml-1 truncate">{String(value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Truly empty state — show the screenType so author sees what's wired */}
      {!title && !hasMain && (
        <div className="flex-1 flex items-center justify-center opacity-40 italic">
          {displayState.screenType ?? '—'}
        </div>
      )}

      {/* Bottom-right cursor dot if selectedIndex set but no menu/title to anchor to */}
      {!hasMenu && selectedIndex != null && (statusText || primitives.length > 0) && (
        <div className="absolute" style={{ right: 4, bottom: 2, fontSize: baseFontPx, opacity: 0.6 }}>
          [{selectedIndex}]
        </div>
      )}
    </div>
  );
}

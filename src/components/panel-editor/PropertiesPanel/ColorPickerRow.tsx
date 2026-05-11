'use client';

/**
 * Single source of truth for the label-color picker UX. Used by both the
 * LabelEditor (for control labels) and LabelProperties (for standalone
 * labels). The caller decides where to write the value — this component
 * only owns the visual.
 *
 * Selection model:
 *   - One preset gets the blue ring if `value` matches it exactly
 *   - If `value` is empty/undefined, the "default" button gets the ring
 *   - If `mixed` is true, NOTHING gets the ring + a "(mixed)" caption shows
 *   - Picking any preset always calls `onChange` — even in mixed state
 *     (which is the unifying action)
 *
 * Preset palette is shared via COLOR_PRESETS constant. `#d1d5db` is
 * always first and matches the default `text-gray-300` baseline so admin
 * can one-click reset to "what every other label looks like".
 */
export const COLOR_PRESETS = [
  '#d1d5db', // default grey (text-gray-300 baseline — leftmost)
  '#e5e5e5', // white
  '#f59e0b', // amber
  '#22d3ee', // cyan
  '#22c55e', // green
  '#ef4444', // red
];

interface Props {
  /** Current value. Empty/undefined renders the "default" button as selected. */
  value?: string;
  /** Multi-select with differing values across the selection. */
  mixed?: boolean;
  /** Called on any preset click, default-button click, or hex input change.
   *  Empty string means "clear the override → use default grey". */
  onChange: (color: string) => void;
}

export default function ColorPickerRow({ value, mixed, onChange }: Props) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-gray-500">Text Color</label>
        {mixed && (
          <span className="text-[9px] italic text-amber-500/80">(mixed)</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {COLOR_PRESETS.map((color, idx) => {
          const isSelected = !mixed && value === color;
          const isDefault = idx === 0;
          return (
            <button
              key={color}
              onClick={() => onChange(color)}
              className={`w-4 h-4 rounded-sm border transition-colors ${
                isSelected
                  ? 'border-blue-500 ring-1 ring-blue-500/30'
                  : 'border-gray-600 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              title={isDefault ? `${color} — Match other labels (default)` : color}
            />
          );
        })}
        <button
          onClick={() => onChange('')}
          className={`px-1.5 h-4 rounded-sm border text-[8px] transition-colors ${
            !mixed && !value
              ? 'border-blue-500 ring-1 ring-blue-500/30 text-blue-400'
              : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200'
          }`}
          title="Reset to default — clears any color override"
        >
          default
        </button>
        <input
          type="text"
          value={mixed ? '' : (value ?? '')}
          placeholder={mixed ? 'mixed' : '#hex'}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === '') onChange(v || '');
          }}
          onBlur={(e) => {
            const v = e.target.value;
            if (v && !/^#[0-9a-fA-F]{6}$/.test(v)) onChange('');
          }}
          className="w-16 h-5 rounded border border-gray-700 bg-gray-900 px-1 text-[9px] text-gray-300 outline-none focus:border-blue-500 font-mono"
        />
      </div>
    </div>
  );
}

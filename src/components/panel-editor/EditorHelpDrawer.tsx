'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type HelpTab = 'guide' | 'shortcuts' | 'workflow';

interface EditorHelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onReplayTour: () => void;
}

function CollapsibleSection({ title, children, defaultOpen = false }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3 text-left text-sm font-medium text-white/90 hover:bg-white/5 transition-colors"
      >
        {title}
        <span className={`text-white/30 transition-transform text-xs ${open ? 'rotate-90' : ''}`}>
          &#9654;
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-[13px] leading-relaxed text-gray-400 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

function ShortcutRow({ action, keys }: { action: string; keys: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-gray-400 text-[13px]">{action}</span>
      <kbd className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-mono text-gray-300">{keys}</kbd>
    </div>
  );
}

function GuideTab() {
  return (
    <div>
      <CollapsibleSection title="Canvas" defaultOpen>
        <p><strong className="text-white/80">Move controls</strong> &mdash; Click and drag any control to reposition it. Controls snap to your grid setting.</p>
        <p><strong className="text-white/80">Resize</strong> &mdash; Drag the corner or edge handles that appear when a control is selected.</p>
        <p><strong className="text-white/80">Select multiple</strong> &mdash; Click and drag on empty canvas space to draw a selection box around multiple controls. Hold Shift to add to selection, Cmd/Ctrl to toggle.</p>
        <p><strong className="text-white/80">Multi-select across types (NEW)</strong> &mdash; Shift-click works across ALL entity types: controls, labels (linked AND standalone), sections, containers, banners. Click a control then Shift+click a label &rarr; both selected. Click a label, then Shift+click another label &rarr; both selected. Plain click on any entity REPLACES the selection (deselects everything else); Shift/Cmd/Ctrl adds or removes.</p>
        <p><strong className="text-white/80">Right-click menu</strong> &mdash; Right-click any control for quick access to align, distribute, group, delete, and lock/unlock.</p>
        <p><strong className="text-white/80">Double-click a label</strong> &mdash; Edit the label text inline. Press Escape or click away to save.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Canvas Size vs Scale (important!)">
        <p>The toolbar has two side-by-side clusters that look similar but do different things. Pick the right one based on what you want:</p>
        <p><strong className="text-white/80">Canvas (W × H inputs)</strong> &mdash; Resizes the canvas only. Controls keep their position. Type a bigger W → empty space appears on the right. Type a smaller W → controls past the edge stay where they are (still selectable from the Layers panel; drag back into bounds anytime). <em>Use this when you want more room to add controls, or to trim unused space.</em></p>
        <p><strong className="text-white/80">Scale (− / + / ⤢ Scale…)</strong> &mdash; Scales every control, section, label, container, ruler guide, and the canvas itself relative to the original layout. <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">−</kbd> shrinks to 80%, <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">+</kbd> grows to 125%. Click <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">⤢ Scale…</kbd> to pick any target percentage in a modal. <em>Use this when the whole panel needs to be bigger or smaller (e.g., adapting to a different aspect ratio).</em></p>
        <p><strong className="text-white/80">Drift-free (NEW)</strong> &mdash; The Scale modal shows &ldquo;Currently at <em>N%</em> of original&rdquo;. Repeated scaling at messy percentages (70%, 145%, 50%, etc.) used to leave controls and labels slowly drifting out of alignment. Now: 100% always returns to the EXACT original layout. The new <strong className="text-white/80">Reset to original</strong> button snaps everything back to base in one click.</p>
        <p><strong className="text-white/80">Quick rule:</strong> If you want to <em>add empty space</em>, use Canvas. If you want everything to <em>grow or shrink together</em>, use Scale. Cmd+Z reverts either.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Toolbar">
        <p><strong className="text-white/80">Undo / Redo</strong> &mdash; Every action is reversible. Use Cmd+Z / Cmd+Shift+Z or the toolbar buttons.</p>
        <p><strong className="text-white/80">Snap Grid</strong> &mdash; Controls the pixel grid that controls snap to when dragged. Smaller values (1-2px) for precision, larger (8-16px) for fast rough positioning.</p>
        <p><strong className="text-white/80">Zoom</strong> &mdash; Changes your view magnification. Does not affect the actual panel size &mdash; purely for comfort while editing.</p>
        <p><strong className="text-white/80">Grid overlay</strong> &mdash; Shows thin guidelines at the snap interval. Helps you see alignment at a glance. Toggle with <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">G</kbd>.</p>
        <p><strong className="text-white/80">Labels</strong> &mdash; Show/hide text labels on all controls. Toggle with <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">T</kbd>.</p>
        <p><strong className="text-white/80">Canvas Size (W &times; H)</strong> &mdash; Set exact pixel dimensions for the panel canvas. Match these to the reference photo proportions.</p>
        <p><strong className="text-white/80">Preview</strong> &mdash; Shows the panel as end users will see it. Use this to check your work before submitting.</p>
        <p><strong className="text-white/80">Submit for Review</strong> &mdash; Sends your work to the admin for review. You can add an optional note. The editor locks until the admin responds.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Photo Overlay">
        <p>The photo overlay lets you see the real hardware underneath your controls so you can match positions exactly.</p>
        <p><strong className="text-white/80">Side-by-side mode</strong> &mdash; Shows the photo next to the canvas with a draggable divider. Good for comparing layout at a glance.</p>
        <p><strong className="text-white/80">Overlay mode</strong> &mdash; Places the photo directly under your controls with adjustable opacity. Set opacity to 40-50% so you can see both layers.</p>
        <p><strong className="text-white/80">Offset (X/Y)</strong> &mdash; Shift the photo position to align it precisely with your canvas. Use Reset to zero out.</p>
        <p>Toggle with <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">P</kbd>.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Selecting Controls">
        <p><strong className="text-white/80">Click</strong> &mdash; selects a single control (replaces any prior selection).</p>
        <p><strong className="text-white/80">Shift+Click</strong> &mdash; adds to / removes from the selection. Works for controls AND labels (mixed selection supported).</p>
        <p><strong className="text-white/80">Cmd+Click</strong> &mdash; toggles a control in/out of the selection.</p>
        <p><strong className="text-white/80">Option+Click (Alt+Click)</strong> &mdash; cycles through overlapping controls under the cursor (e.g., a control nested visually behind another). Falls back to selecting the container behind a control if no overlap.</p>
        <p><strong className="text-white/80">Rubber-band</strong> &mdash; click on empty canvas and drag. A dashed selection rectangle appears; everything inside it on release becomes the selection. Works correctly with rotated controls (uses each control&rsquo;s rotated bounding box).</p>
        <p><strong className="text-white/80">Select Controls ▾ dropdown (NEW)</strong> &mdash; toolbar button. Three regions in the dropdown:</p>
        <p>&bull; <strong className="text-white/80">All controls</strong> &mdash; one-click select every control on the device (same as <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">Cmd+A</kbd>). Closes the dropdown.</p>
        <p>&bull; <strong className="text-white/80">By type</strong> &mdash; checkbox rows for each category (Pads / Buttons / Knobs / Sliders+Faders / Encoders / Wheels / LEDs / Screens / Switches / Ports). Each row shows the live count. Click a row to <em>toggle</em> that type in/out of the selection &mdash; the dropdown <strong>stays open</strong> so you can layer multiple types (e.g., select all Knobs, then click Pads to add). The checkbox shows fully-checked when every control of that type is selected, half-checked when some are. Zero-count rows are greyed out.</p>
        <p>&bull; <strong className="text-white/80">Clear selection</strong> &mdash; empties the selection (same as <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">Esc</kbd>). Closes the dropdown.</p>
        <p>Pairs with the upcoming Scale Selected ▾ dropdown so &ldquo;all pads 25% too big&rdquo; becomes two clicks.</p>
        <p><strong className="text-white/80">Cmd+A</strong> &mdash; selects every control (same as Select Controls ▾ → All).</p>
        <p><strong className="text-white/80">Escape</strong> &mdash; clears the current selection.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Scaling Selected Controls">
        <p><strong className="text-white/80">Scale Selected ▾ dropdown (NEW)</strong> &mdash; toolbar button beside Select Controls ▾. Disabled until you have at least one control selected.</p>
        <p><strong className="text-white/80">Presets</strong> &mdash; one-click factor scaling: <em>Shrink to 50% / 75% / 90%</em>, <em>Grow to 110% / 125%</em>. Each preset applies the factor to W and H of every selected control. Positions shift so each control stays centered on its original midpoint.</p>
        <p><strong className="text-white/80">Custom %</strong> &mdash; type any percentage between 10 and 500 (e.g., <code>72</code>) and hit Enter or click Apply. Out-of-range or non-numeric input is rejected with a toast.</p>
        <p><strong className="text-white/80">What also scales</strong> &mdash; <em>labelFontSize</em> scales by the same factor (clamped to 6px minimum so labels don&rsquo;t disappear).</p>
        <p><strong className="text-white/80">What&rsquo;s skipped</strong> &mdash; <em>locked</em> + <em>resize-locked</em> controls (per the Lock pill), and <em>screens / displays</em> (their content has fixed aspect for tutorial rendering). A toast reports how many were skipped vs scaled.</p>
        <p><strong className="text-white/80">Undo</strong> &mdash; one undo step restores every scaled control&rsquo;s prior W / H / x / y / labelFontSize together. Chain multiple scales (e.g., 90% then 90% again = 81%) and undo unwinds them one step at a time.</p>
        <p><strong className="text-white/80">Canvas size unchanged</strong> &mdash; only individual control W/H change. The overall canvas + section frames stay the same. (To rescale the WHOLE panel, use the toolbar&rsquo;s ⤢ Scale Contents modal instead.)</p>
        <p><strong className="text-white/80">Typical workflow</strong>: open Select Controls ▾, check &ldquo;Pads&rdquo; (or &ldquo;All controls&rdquo; for the whole panel), close the dropdown; then click Scale Selected ▾ → &ldquo;Shrink to 75%&rdquo;. Two clicks to resize 80 controls.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Layers Panel">
        <p>Press <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">L</kbd> to open. Shows all sections, controls, containers, and labels in a tree view.</p>
        <p><strong className="text-white/80">Sections</strong> &mdash; Logical groups like &ldquo;MIXER&rdquo;, &ldquo;TRANSPORT&rdquo;, &ldquo;EFFECTS&rdquo;. Click the arrow to expand and see child controls.</p>
        <p><strong className="text-white/80">Click-to-find (NEW)</strong> &mdash; Click any control, container, or section row → the canvas auto-pans to bring it into view AND selects it. Works for items outside the current viewport too &mdash; even controls placed past the canvas edge.</p>
        <p><strong className="text-white/80">Out-of-bounds badge (NEW)</strong> &mdash; A small red dot appears next to any control or section whose bounds extend outside the canvas (negative coordinates or past the right/bottom edge). Click the row to pan to it &mdash; great for finding stray controls placed in the grey area. Hover the badge for the tooltip &ldquo;Outside canvas bounds&rdquo;.</p>
        <p><strong className="text-white/80">Shift+click to add to selection</strong> &mdash; Multi-select rows in the tree the same way you do on the canvas.</p>
        <p><strong className="text-white/80">Groups</strong> &mdash; Shown with a violet dashed border. Expand to see members. Selecting a group member auto-expands its group.</p>
        <p><strong className="text-white/80">Linked + standalone labels</strong> &mdash; Linked labels (icons + captions) appear nested under their control. Standalone labels with a section appear nested under the section. Labels with no section appear in the &ldquo;Unassigned Labels&rdquo; block at the bottom (capped at ~33% of panel height so the section list always stays visible).</p>
      </CollapsibleSection>

      <CollapsibleSection title="Properties Panel">
        <p>Appears on the right when you select a control. Shows and lets you edit all properties.</p>
        <p><strong className="text-white/80">Type</strong> &mdash; Change what kind of control this is (button, knob, slider, pad, etc.).</p>
        <p><strong className="text-white/80">Shape</strong> &mdash; For buttons only: rectangle or circle.</p>
        <p><strong className="text-white/80">✨ Test LEDs toolbar toggle (NEW)</strong> &mdash; In the toolbar there&rsquo;s a <em>Test LEDs</em> button. Click it ON to force every LED-capable control to render as if <code>ledOn: true</code> &mdash; useful for visually verifying that <em>label-backlit</em> labels glow correctly in your chosen ledColor, and that <em>edge-glow</em> borders are visible against your background. Toggle OFF to return to the design-time view (label-backlit shows 60%-alpha label text as a hint). Session-only &mdash; never written to the manifest. Disabled while in Preview mode.</p>
        <p><strong className="text-white/80">LED</strong> &mdash; All buttons and pads have a <strong>5-pill</strong> LED selector: <em>None</em> (no LED), <em>Dot</em> (separate small LED indicator near the button &mdash; e.g., synth LFO waveform LEDs), <em>Face</em> (whole button face glows uniformly &mdash; e.g., PLAY / CUE / HOT CUE on Pioneer DJ gear; alias of legacy <code>integrated</code>), <em>Label</em> (label/icon glows through cutouts while the face stays dark &mdash; Pioneer DJM mixers, NI Maschine transport), <em>Edge</em> (border/ring glows; on circle buttons automatically renders as a ring). When any LED style is selected, a LED Color picker appears with 9 presets (white, gray, amber, cyan, green, red, blue, pink, custom hex). The OFF state always renders an LED-capable baseline (dark face + subtle colored border) so contractors can tell at a glance which buttons have LEDs.</p>
        <p><strong className="text-white/80">LED default state (NEW)</strong> &mdash; For LED and indicator controls, the Properties panel has an Off / On toggle that sets how the LED appears at rest. <em>Off</em> renders dim/inactive; <em>On</em> renders fully lit in the chosen LED color. Use this to mark which LEDs are normally illuminated on the hardware (e.g., POWER LED = On).</p>
        <p><strong className="text-white/80">LED Variant (led/indicator type only)</strong> &mdash; When a control&rsquo;s type is set to &ldquo;led&rdquo; or &ldquo;indicator&rdquo;, a variant selector appears: <em>Dot</em> (single LED circle), <em>Dual</em> (two-row indicator like VINYL/CDJ with separate top and bottom labels).</p>
        <p><strong className="text-white/80">Dual Label</strong> &mdash; When a control has the Dual LED variant, two separate text inputs appear for the top and bottom rows (e.g., &ldquo;VINYL&rdquo; on top, &ldquo;CDJ&rdquo; on bottom).</p>
        <p><strong className="text-white/80">Sections</strong> &mdash; Click a section in the Layers panel to edit it. Frame mode controls visibility: <em>Full</em> (visible border + header), <em>Title Only</em> (floating title, no border), <em>Body Only</em> (border + body, no title strip), <em>Hidden</em> (invisible). The <strong>Section Title Banner</strong> checkbox under the frame-mode pills toggles the dark strip background behind the title independently of frame mode &mdash; useful for cleaner-looking sections where the title floats over the panel background. The <strong>Hide Section</strong> toggle in the toolbar controls whether hidden-mode sections render as faint ghost frames in the editor (so contractor can still find + change them) or are fully suppressed from the canvas (use the Layers panel to reach them).</p>
        <p><strong className="text-white/80">Label</strong> &mdash; Edit label text and choose position: above, below, left, right, on the button, or hidden. Secondary label adds a second line (e.g., &ldquo;PLAY/CUE&rdquo;). Font size slider adjusts label size for all positions.</p>
        <p><strong className="text-white/80">Label Alignment</strong> &mdash; When label is set to &ldquo;on-button&rdquo;, a 3&times;3 dot grid appears. Click any dot to position text within the button face: top-left, center, bottom-right, etc. Default is center for buttons, bottom-right for pads.</p>
        <p><strong className="text-white/80">Label Color</strong> &mdash; Pick from 6 preset colors (white, gray, amber, cyan, green, red) or enter a custom hex value. Changes the on-button text color to match the hardware&rsquo;s silk-screen printing.</p>
        <p><strong className="text-white/80">Rotation</strong> &mdash; Quick buttons for 0&deg;, 90&deg;, 180&deg;, 270&deg;, plus a <strong>Custom</strong> angle input for any value (e.g., 33&deg;, 45&deg;, -15&deg;). Works on multi-select &mdash; applies the same angle to all selected controls. For non-fader controls (knobs, buttons, pads), rotation applies a CSS transform &mdash; the visual rotates while the bounding box stays put.</p>
        <p><strong className="text-white/80">Rotation &mdash; Faders / sliders (auto-swap)</strong> &mdash; Faders rotate as a full unit: clicking 90&deg; or 270&deg; swaps the bounding box width &harr; height AND re-lays out the track horizontally in one motion (so a vertical fader becomes a clean horizontal fader). Going back to 0&deg; or 180&deg; swaps the bbox back. The auto-swap only fires on cross-cardinal transitions (0/180 &harr; 90/270); free-angle values like 45&deg; render as a rotated vertical fader. Note: sliders already at 90&deg; from earlier sessions may need a one-time &ldquo;0&deg; then 90&deg;&rdquo; click to trigger the swap on their stored bbox.</p>
        <p><strong className="text-white/80">X, Y, W, H</strong> &mdash; Set exact pixel position and size. Good for fine-tuning after dragging.</p>
        <p><strong className="text-white/80">Lock</strong> &mdash; Three modes: <em>Unlocked</em> (free move &amp; resize), <em>Size</em> (can move but can&rsquo;t resize), <em>Full</em> (frozen &mdash; can&rsquo;t move, resize, or delete). Use to protect controls you&rsquo;re happy with.</p>
        <p><strong className="text-white/80">Layer</strong> &mdash; Shows the control&rsquo;s z-order position. Use the up/down arrows to move controls forward or backward in the stack. Higher numbers render on top.</p>
        <p><strong className="text-white/80">Match Sizes</strong> &mdash; Select 2+ controls, click Match Sizes to make them all the same width and height as the first one selected.</p>
        <p><strong className="text-white/80">Align tools</strong> &mdash; Select 2+ controls, then align them: left edges, centers, or right edges (horizontal); top, middle, or bottom (vertical). &ldquo;Align&rdquo; means &ldquo;straighten into a line.&rdquo;</p>
        <p><strong className="text-white/80">Distribute</strong> &mdash; Select 3+ controls to space them equally. Horizontal distribute makes even gaps left-to-right; vertical does top-to-bottom.</p>
        <p><strong className="text-white/80">Gap</strong> &mdash; Set an exact pixel distance between selected controls. Type a number, hit enter. Supports negative values for overlapping.</p>
        <p><strong className="text-white/80">Align Columns / Align Rows</strong> &mdash; Advanced: when you have 2+ rows of controls, Align Columns snaps them to the topmost row&rsquo;s column positions. Align Rows does the same vertically. Great for making a grid perfectly even.</p>
        <p><strong className="text-white/80">Normalize Label Spacing</strong> &mdash; Select 2+ controls with labels. Snaps all labels to the tightest distance from their controls, grouped by position (above/below) and line count.</p>
        <p><strong className="text-white/80">Floating-label Properties (NEW)</strong> &mdash; Click any free-floating (standalone) label and the Properties panel shows: text textarea, full categorized icon picker, font size slider, alignment toggle (left / center / right), editable X / Y / W numeric inputs, and an Auto-width checkbox. Resize floating labels by typing a width. Previously these inputs were missing &mdash; on devices without a keyboard, the panel didn&rsquo;t even open for floating labels.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Labels">
        <p><strong className="text-white/80">Label positions</strong> &mdash; Each control&rsquo;s label can be above, below, left, right, on the button, or hidden. Change in the Properties panel.</p>
        <p><strong className="text-white/80">Center on control</strong> &mdash; Select a label, press <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">C</kbd> to center it horizontally on its control. Figma-style center alignment.</p>
        <p><strong className="text-white/80">Inline editing</strong> &mdash; Double-click any label to edit its text directly. Press Escape or click away to save.</p>
        <p><strong className="text-white/80">Standalone labels</strong> &mdash; Click <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">+L</kbd> in the toolbar to add a free-floating text label. Not linked to any control.</p>
        <p><strong className="text-white/80">Floating label Properties (NEW)</strong> &mdash; Click any floating (standalone) label and the Properties panel now shows everything you need to edit it: text, full categorized icon picker, font size, alignment toggle (left / center / right), editable X / Y / W numeric inputs, and an &ldquo;Auto width&rdquo; checkbox that toggles between explicit width and sizing-to-text. Resize a label by typing a new W value or by toggling Auto off and entering an exact pixel width.</p>
        <p><strong className="text-white/80">Font size</strong> &mdash; Use the Sz dropdown in the toolbar to set font size for all labels, or set individually in the Properties panel.</p>
        <p><strong className="text-white/80">Labels nest under their control in Layers panel</strong> &mdash; A control&rsquo;s caption, icon, and any other linked labels appear indented under the control row in the Layers panel. No more hunting in a separate block at the bottom.</p>
        <p><strong className="text-white/80">Standalone labels nest under their section</strong> &mdash; Free-floating labels you place inside a section&rsquo;s area auto-assign to that section and appear nested under it in the Layers panel.</p>
        <p><strong className="text-white/80">Unassigned Labels bucket</strong> &mdash; Labels not yet placed in any section appear in an &ldquo;Unassigned Labels&rdquo; block at the bottom of the Layers panel. Drag them onto a section&rsquo;s area to auto-assign.</p>
        <p><strong className="text-white/80">Right-click standalone label</strong> &mdash; Works on the canvas label or the Layers panel row. Choose &ldquo;Assign to nearest section&rdquo; (or &ldquo;Re-assign to nearest section&rdquo; if already assigned) to organize without dragging.</p>
        <p><strong className="text-white/80">Right-click linked label</strong> &mdash; Choose &ldquo;Select linked control&rdquo; as a navigation shortcut to jump to the control that owns the label.</p>
        <p><strong className="text-white/80">Snap-to-grid for label drag (FIXED)</strong> &mdash; Labels snap to the same grid as controls when dragged. Switch grid size in the toolbar at any time &mdash; drags read the current setting fresh (no more stale-snap behavior). Linked labels also snap to grid when their parent control moves, so visuals stay aligned across control drags.</p>
        <p><strong className="text-white/80">Labels follow section moves</strong> &mdash; When you drag a section across the canvas, every label assigned to it (linked or standalone) moves with it. No more orphaned labels left behind.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Icons">
        <p><strong className="text-white/80">Icons are labels</strong> &mdash; Add an icon to any button, LED, or pad through the Properties panel&rsquo;s icon picker. Icons appear as draggable labels with optional text &mdash; same system as text labels.</p>
        <p><strong className="text-white/80">Icon picker</strong> &mdash; Open the Properties panel for a control (or floating label), choose an icon from the visual grid. Categories: <em>Waveforms</em> (sine, square, triangle, sawtooth, ramp-up, ramp-down, pulse, sample-hold, sample-glide, noise), <em>Curves</em> (exp / lin / log envelope curves), <em>DJ</em> (cue, vinyl-mode, loop-in / loop-out, beat-sync, slip, quantize), <em>Transport</em> (play, pause, stop, record, FF/RW, eject), <em>Arrows</em>, <em>Other</em> (plus, minus, search-skip, loop-redo, sync-lock, settings-gear).</p>
        <p><strong className="text-white/80">Curves category (NEW)</strong> &mdash; Three envelope-curve shapes for synth panels: <em>curve-exp</em> (rounded bell, exponential), <em>curve-lin</em> (sharp triangle peak, linear), <em>curve-log</em> (asymmetric bell, logarithmic). Use these for envelope curve LEDs and similar.</p>
        <p><strong className="text-white/80">Icon + text together</strong> &mdash; A linked label can show an icon, text, or both. Set both in the Properties panel and they render side-by-side on the same label.</p>
        <p><strong className="text-white/80">Icons in Layers panel</strong> &mdash; Icon labels appear under their control just like text labels &mdash; click to select.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Grouping Controls">
        <p>Select 2+ controls and press <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">Cmd+G</kbd> to group them. Groups:</p>
        <p>&bull; Move together when you drag any member</p>
        <p>&bull; Align as a unit with the alignment tools</p>
        <p>&bull; Show as a unit in the Layers panel with a violet border</p>
        <p>&bull; Auto-dissolve if a group drops below 2 members</p>
        <p>Press <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">Cmd+Shift+G</kbd> to ungroup.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Rulers">
        <p>Pixel rulers along the top and left edges of the canvas. Press <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">R</kbd> to toggle.</p>
        <p><strong className="text-white/80">Reading positions</strong> &mdash; Numbers show canvas coordinates in pixels. Use rulers to verify exact control positions and check alignment across rows and columns.</p>
        <p><strong className="text-white/80">Selection markers</strong> &mdash; When you select a control, blue lines appear on both rulers showing the control&rsquo;s position and extent (width/height).</p>
        <p><strong className="text-white/80">Zoom-adaptive</strong> &mdash; Tick mark density adjusts automatically as you zoom in and out. More detail at higher zoom levels.</p>
        <p><strong className="text-white/80">Guide lines</strong> &mdash; Click and drag from the ruler onto the canvas to create a red reference line. Guide lines snap to the grid interval. Use them to check if controls across different sections are aligned. Drag a guide to reposition it. To delete: drag it back onto the ruler, or right-click it.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Keyboard (synth panels)">
        <p>For instruments that have a piano keyboard (DeepMind-12, Fantom-08, etc.), the keyboard renders as a separate band at the bottom of the canvas with its own behavior.</p>
        <p><strong className="text-white/80">Aspect-locked keys</strong> &mdash; White keys auto-resize to keep the correct piano-key proportions (~6.6× longer than wide). Adjust the keyboard width and the height follows automatically. No more stubby keys.</p>
        <p><strong className="text-white/80">Free-form positioning</strong> &mdash; Drag the keyboard horizontally and resize its width via side handles. Vertical position auto-anchors to the canvas bottom; vertical drag is intentionally locked (keys don&rsquo;t float in the middle).</p>
        <p><strong className="text-white/80">Smart layout banner</strong> &mdash; If the canvas is too short for proper key proportions, a warning banner appears above the keyboard showing &ldquo;Keyboard cropped&rdquo; with current vs. target dimensions. The banner also flags any controls overlapping the keyboard (with X+Y rectangle intersection &mdash; not just &ldquo;below the top edge&rdquo;). Move overlapping controls above the keyboard or click the banner&rsquo;s buttons:</p>
        <p>&bull; <strong className="text-white/80">Auto-fit Canvas</strong> &mdash; grows the canvas height just enough to give the keyboard correct proportions while preserving your current controls area</p>
        <p>&bull; <strong className="text-white/80">Dismiss</strong> &mdash; hides the banner for the session. The aspect chip becomes clickable to bring it back if needed.</p>
        <p><strong className="text-white/80">Black-key positioning</strong> &mdash; Black keys auto-position with correct gap-aligned offsets (centered between white keys, matching real piano geometry).</p>
        <p><strong className="text-white/80">Properties</strong> &mdash; If the device has a keyboard, the Properties panel shows keyboard offset / width / panel-height inputs even when nothing is selected, so you can tune the keyboard layout independently of any control selection.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Save & Reliability">
        <p>The editor auto-saves your work every 1.5 seconds while you&rsquo;re editing, plus there are several safeguards to prevent data loss:</p>
        <p><strong className="text-white/80">&ldquo;Last saved&rdquo; indicator</strong> &mdash; The toolbar always shows when your last save completed (e.g., &ldquo;Saved 5 seconds ago&rdquo;) with a color state: green = saved, amber = saving, red = save failed. Watch this if you&rsquo;re unsure whether changes have been persisted.</p>
        <p><strong className="text-white/80">&ldquo;Leave site?&rdquo; warning</strong> &mdash; If you have unsaved changes and try to close the tab, refresh, or navigate away, the browser will prompt to confirm. Prevents accidental loss of recent edits.</p>
        <p><strong className="text-white/80">Conflict detection</strong> &mdash; If admin sends you an updated manifest while you&rsquo;re editing, the next save will detect the conflict and warn you instead of overwriting their changes silently.</p>
        <p><strong className="text-white/80">Confirmation prompts on destructive actions</strong> &mdash; Dismissing an issue, deleting a section, and similar irreversible actions ask &ldquo;Are you sure?&rdquo; first.</p>
        <p><strong className="text-white/80">Submit for Review</strong> &mdash; Always saves before submitting. The submit button works reliably even from a clean state (no need to type something first).</p>
      </CollapsibleSection>

      <CollapsibleSection title="Containers">
        <p>Visual boxes that group related controls, like the recessed rectangles on real hardware that hold button clusters (e.g., BEAT SYNC / MASTER / KEY SYNC on CDJ-3000).</p>
        <p><strong className="text-white/80">Creating from controls</strong> &mdash; Select 2+ controls, right-click &rarr; &ldquo;Wrap in Container&rdquo;. A box appears wrapping the selected controls.</p>
        <p><strong className="text-white/80">Creating empty</strong> &mdash; Right-click on empty canvas &rarr; &ldquo;Add Container&rdquo;. A default-sized box appears at the click position. The new container <strong className="text-white/80">flashes bright green for ~2.5 seconds</strong> so you can see exactly where it landed, and the canvas auto-scrolls to bring it into view. Spawn position is also clamped above the keyboard so it never lands hidden behind it. (NEW)</p>
        <p><strong className="text-white/80">Container styles</strong> &mdash; Four presets in the Properties panel: <em>Recessed</em> (dark inset, most common on DJ hardware), <em>Raised</em> (slight elevation), <em>Outlined</em> (thin border only), <em>Filled</em> (flat colored background).</p>
        <p><strong className="text-white/80">Editing</strong> &mdash; Click a container to select it. If controls are covering the container, hold <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">Alt</kbd> and click any control inside &mdash; this selects the container underneath. Properties panel shows style selector, optional label, and border radius. Drag to reposition, drag corners to resize.</p>
        <p><strong className="text-white/80">Click-to-find from Layers panel (NEW)</strong> &mdash; Containers appear in the Layers panel like sections. Click a container row → canvas auto-scrolls to bring it into view AND it gets selected. Same as click-to-find for controls.</p>
        <p><strong className="text-white/80">Deleting</strong> &mdash; Right-click the container &rarr; &ldquo;Delete Container&rdquo;, or use the Delete button in the Properties panel. Deleting a container does NOT delete the controls inside.</p>
        <p><strong className="text-white/80">Containers vs Groups</strong> &mdash; Groups (<kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">Cmd+G</kbd>) make controls move together. Containers add a visual box. They are independent &mdash; you can have a group without a container, a container without a group, or both.</p>
        <p><strong className="text-white/80">Containers scale with everything</strong> &mdash; When you scale the panel, containers grow/shrink proportionally with the controls inside (NEW &mdash; previously containers stayed at original size while controls scaled).</p>
      </CollapsibleSection>
    </div>
  );
}

function ShortcutsTab() {
  return (
    <div className="px-5 py-4 space-y-4">
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">General</h4>
        <ShortcutRow action="Undo" keys="Cmd+Z" />
        <ShortcutRow action="Redo" keys="Cmd+Shift+Z" />
        <ShortcutRow action="Delete selection" keys="Backspace / Delete" />
        <ShortcutRow action="Clear selection" keys="Escape" />
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">Selection</h4>
        <ShortcutRow action="Select all controls" keys="Cmd+A" />
        <ShortcutRow action="Select by type (Pads, Knobs, Faders…)" keys="Select Controls ▾ (toolbar) — click rows to toggle" />
        <ShortcutRow action="Add to selection" keys="Shift+Click" />
        <ShortcutRow action="Toggle in selection" keys="Cmd+Click" />
        <ShortcutRow action="Rubber-band (drag rectangle)" keys="Click empty canvas + drag" />
        <ShortcutRow action="Cycle overlapping controls" keys="Option+Click (Alt+Click)" />
        <ShortcutRow action="Clear selection" keys="Escape" />
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">View Toggles</h4>
        <ShortcutRow action="Rulers" keys="R" />
        <ShortcutRow action="Grid overlay" keys="G" />
        <ShortcutRow action="Photo overlay" keys="P" />
        <ShortcutRow action="Layers panel" keys="L" />
        <ShortcutRow action="Labels" keys="T" />
        <ShortcutRow action="Test LEDs (force ledOn=true on all LEDs)" keys="✨ Test LEDs (toolbar)" />
        <ShortcutRow action="Zoom in" keys="Cmd+=" />
        <ShortcutRow action="Zoom out" keys="Cmd+-" />
        <ShortcutRow action="Open help" keys="?" />
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">Alignment</h4>
        <ShortcutRow action="Align centers horizontally" keys="Shift+H" />
        <ShortcutRow action="Align centers vertically" keys="Shift+V" />
        <ShortcutRow action="Distribute horizontal" keys="Cmd+Shift+H" />
        <ShortcutRow action="Distribute vertical" keys="Cmd+Shift+V" />
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">Labels</h4>
        <ShortcutRow action="Center label on control" keys="C" />
        <ShortcutRow action="Double-click to edit label" keys="Dbl-click" />
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">Layer Order</h4>
        <ShortcutRow action="Bring to Front" keys="Cmd+]" />
        <ShortcutRow action="Bring Forward" keys="Cmd+Alt+]" />
        <ShortcutRow action="Send Backward" keys="Cmd+Alt+[" />
        <ShortcutRow action="Send to Back" keys="Cmd+[" />
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">Grouping</h4>
        <ShortcutRow action="Group selected" keys="Cmd+G" />
        <ShortcutRow action="Ungroup" keys="Cmd+Shift+G" />
        <ShortcutRow action="Select container behind control" keys="Option+Click (Alt+Click)" />
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">Rotation</h4>
        <ShortcutRow action="Rotate selection 90° clockwise" keys="Shift+Alt+R" />
        <ShortcutRow action="Quick rotation buttons (0/90/180/270)" keys="Properties panel" />
        <ShortcutRow action="Free-angle (any value)" keys="Properties → Custom °" />
      </div>
    </div>
  );
}

function WorkflowTab() {
  const steps = [
    { title: 'Open the photo overlay', desc: 'Press P or click the Photo button. Switch to Overlay mode and set opacity to around 40-50% so you can see the real hardware under your controls.' },
    { title: 'Adjust canvas size', desc: 'Set the W and H values in the toolbar to match the photo proportions. This ensures controls are positioned at the right scale.' },
    { title: 'Position controls on the photo', desc: 'Drag each control to match its real position on the hardware. Start with the big, obvious ones (knobs, sliders, screens) then refine smaller controls.' },
    { title: 'Bulk-select by type', desc: 'Use the Select Controls ▾ dropdown in the toolbar to select all controls of one kind (Pads, Knobs, Sliders, etc.) in one click. Click multiple type rows to layer the selection — the dropdown stays open and shows a checkbox per type. Cmd+A selects every control. Counts are live.' },
    { title: 'Bulk-scale the selection', desc: 'With one or more controls selected, open Scale Selected ▾ in the toolbar and pick a preset (50/75/90% to shrink, 110/125% to grow) or type a Custom %. Every selected control scales by that factor — W, H, and labelFontSize together — staying centered on its original midpoint. Locked controls and screens are skipped. One undo restores everything.' },
    { title: 'Rotate controls (any angle)', desc: 'In the Properties panel, use the quick buttons (0°/90°/180°/270°) or type a Custom angle (45°, 33°, -15°). Shift+Alt+R rotates the selection 90° clockwise. For faders/sliders, rotating to 90° or 270° also flips the bbox so the full component rotates as a unit.' },
    { title: 'Align rows and columns', desc: 'Select a row of controls, press Shift+H to align their centers. Select a column, press Shift+V. This straightens everything into clean lines.' },
    { title: 'Distribute for even spacing', desc: 'Select 3+ controls in a row/column, then Cmd+Shift+H (horizontal) or Cmd+Shift+V (vertical) to space them equally.' },
    { title: 'Fine-tune with Gap inputs', desc: 'In the Properties panel, use the Gap (H/V) inputs to set exact pixel spacing between controls. Good for knob rows that need uniform gaps.' },
    { title: 'Fix labels', desc: 'Click a label and press C to center it on its control. Double-click to edit text. Use Normalize Label Spacing in Properties panel (2+ selected) to make label distances consistent.' },
    { title: 'Group related controls', desc: 'Select controls that belong together (e.g., a row of channel faders) and press Cmd+G. Groups move together and won\'t accidentally get misaligned.' },
    { title: 'Add visual containers', desc: 'If the reference photo shows controls inside a recessed or beveled rectangle, select those controls and right-click \u2192 "Wrap in Container". Choose Recessed for dark inset boxes (most common on DJ hardware) or Raised for elevated sections.' },
    { title: 'Lock finished controls', desc: 'Once you\'re happy with a control\'s position and size, set it to Size Lock (can still move, can\'t resize) or Full Lock (frozen). Use the Lock pills in the Properties panel or right-click menu.' },
    { title: 'Fix layer ordering', desc: 'If a control appears behind another (e.g., a jog display behind its wheel), select it and press Cmd+] to bring it to front. Use right-click > Bring to Front/Send to Back for precise control.' },
    { title: 'Preview your work', desc: 'Click Preview in the toolbar to see the panel as the end user will see it. Check that labels are readable and nothing overlaps.' },
    { title: 'Submit for review', desc: 'Click Submit for Review. Add an optional note about any tricky areas. The editor locks while the admin reviews. You\'ll see feedback on the instrument list if changes are needed.' },
    { title: 'Confirmation prompts protect your work', desc: 'Dismissing an issue asks for confirmation first — prevents accidental clicks losing the report. Same for any other destructive action.' },
    { title: 'Watch the "Saved" indicator', desc: 'The toolbar shows when your last auto-save completed (e.g., "Saved 5 seconds ago"). Color state: green = saved, amber = saving, red = save failed. If you close the tab with unsaved changes, the browser warns you.' },
    { title: 'Use Scale or Reset confidently', desc: 'The Scale modal now shows "Currently at N% of original". Type any percentage and it scales from the original — repeated cycles never accumulate drift. Click "Reset to original" to snap back to base. Containers, ruler guides, and the canvas all scale together with the controls.' },
  ];

  return (
    <div className="px-5 py-4 space-y-1">
      <p className="text-[13px] text-gray-500 mb-4">A typical editing session, start to finish:</p>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 py-2.5 border-b border-white/5 last:border-0">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-[11px] font-bold text-blue-400">
            {i + 1}
          </span>
          <div>
            <p className="text-[13px] font-medium text-white/85">{step.title}</p>
            <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const TAB_LABELS: Record<HelpTab, string> = {
  guide: 'Guide',
  shortcuts: 'Shortcuts',
  workflow: 'Workflow',
};

export default function EditorHelpDrawer({ isOpen, onClose, onReplayTour }: EditorHelpDrawerProps) {
  const [activeTab, setActiveTab] = useState<HelpTab>('guide');
  // Reset tab when drawer closes
  useEffect(() => {
    if (!isOpen) setActiveTab('guide');
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          {/* Drawer */}
          <motion.div
            className="relative w-full max-w-sm h-full bg-[#0f0f1a] border-l border-white/10 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-white">Editor Guide</h2>
                <p className="text-[11px] text-white/30 mt-0.5">Reference &middot; always available with ?</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 py-2.5 border-b border-white/5 flex-shrink-0">
              {(Object.keys(TAB_LABELS) as HelpTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'guide' && <GuideTab />}
              {activeTab === 'shortcuts' && <ShortcutsTab />}
              {activeTab === 'workflow' && <WorkflowTab />}
            </div>

            {/* Replay tour button hidden — tutorial disabled */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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
        <p><strong className="text-white/80">Right-click menu</strong> &mdash; Right-click any control for quick access to align, distribute, group, duplicate, delete, and lock/unlock.</p>
        <p><strong className="text-white/80">Double-click a label</strong> &mdash; Edit the label text inline. Press Escape or click away to save.</p>
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

      <CollapsibleSection title="Layers Panel">
        <p>Press <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">L</kbd> to open. Shows all sections and their controls in a tree view.</p>
        <p><strong className="text-white/80">Sections</strong> &mdash; Logical groups like &ldquo;MIXER&rdquo;, &ldquo;TRANSPORT&rdquo;, &ldquo;EFFECTS&rdquo;. Click the arrow to expand and see child controls.</p>
        <p><strong className="text-white/80">Click a control</strong> &mdash; Selects it on the canvas and scrolls to it. Shift-click to add to selection.</p>
        <p><strong className="text-white/80">Groups</strong> &mdash; Shown with a violet dashed border. Expand to see members. Selecting a group member auto-expands its group.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Properties Panel">
        <p>Appears on the right when you select a control. Shows and lets you edit all properties.</p>
        <p><strong className="text-white/80">Type</strong> &mdash; Change what kind of control this is (button, knob, slider, pad, etc.).</p>
        <p><strong className="text-white/80">Shape</strong> &mdash; For buttons only: rectangle or circle.</p>
        <p><strong className="text-white/80">LED</strong> &mdash; All buttons and pads have a 3-option LED selector: <em>None</em> (no LED), <em>Dot</em> (separate LED dot above the button), <em>Glow</em> (button face illuminates in LED color, like PLAY/CUE on a CDJ). When Dot or Glow is selected, a LED Color picker appears with 6 presets (green, amber, blue, red, pink, white).</p>
        <p><strong className="text-white/80">LED Variant (led/indicator type only)</strong> &mdash; When a control&rsquo;s type is set to &ldquo;led&rdquo; or &ldquo;indicator&rdquo;, a variant selector appears: <em>Dot</em> (single LED circle), <em>Dual</em> (two-row indicator like VINYL/CDJ with separate top and bottom labels).</p>
        <p><strong className="text-white/80">Dual Label</strong> &mdash; When a control has the Dual LED variant, two separate text inputs appear for the top and bottom rows (e.g., &ldquo;VINYL&rdquo; on top, &ldquo;CDJ&rdquo; on bottom).</p>
        <p><strong className="text-white/80">Sections</strong> &mdash; Click a section in the Layers panel to edit it. Frame mode controls visibility: <em>Full</em> (visible border + header), <em>Title Only</em> (floating title, no border), <em>Hidden</em> (invisible). Cycle with the eye icon in the Layers panel.</p>
        <p><strong className="text-white/80">Label</strong> &mdash; Edit label text and choose position: above, below, left, right, on the button, or hidden. Secondary label adds a second line (e.g., &ldquo;PLAY/CUE&rdquo;). Font size slider adjusts label size for all positions.</p>
        <p><strong className="text-white/80">Label Alignment</strong> &mdash; When label is set to &ldquo;on-button&rdquo;, a 3&times;3 dot grid appears. Click any dot to position text within the button face: top-left, center, bottom-right, etc. Default is center for buttons, bottom-right for pads.</p>
        <p><strong className="text-white/80">Label Color</strong> &mdash; Pick from 6 preset colors (white, gray, amber, cyan, green, red) or enter a custom hex value. Changes the on-button text color to match the hardware&rsquo;s silk-screen printing.</p>
        <p><strong className="text-white/80">Rotation</strong> &mdash; Rotate a control: 0&deg;, 90&deg;, 180&deg;, or 270&deg;.</p>
        <p><strong className="text-white/80">X, Y, W, H</strong> &mdash; Set exact pixel position and size. Good for fine-tuning after dragging.</p>
        <p><strong className="text-white/80">Lock</strong> &mdash; Three modes: <em>Unlocked</em> (free move &amp; resize), <em>Size</em> (can move but can&rsquo;t resize), <em>Full</em> (frozen &mdash; can&rsquo;t move, resize, or delete). Use to protect controls you&rsquo;re happy with.</p>
        <p><strong className="text-white/80">Layer</strong> &mdash; Shows the control&rsquo;s z-order position. Use the up/down arrows to move controls forward or backward in the stack. Higher numbers render on top.</p>
        <p><strong className="text-white/80">Match Sizes</strong> &mdash; Select 2+ controls, click Match Sizes to make them all the same width and height as the first one selected.</p>
        <p><strong className="text-white/80">Align tools</strong> &mdash; Select 2+ controls, then align them: left edges, centers, or right edges (horizontal); top, middle, or bottom (vertical). &ldquo;Align&rdquo; means &ldquo;straighten into a line.&rdquo;</p>
        <p><strong className="text-white/80">Distribute</strong> &mdash; Select 3+ controls to space them equally. Horizontal distribute makes even gaps left-to-right; vertical does top-to-bottom.</p>
        <p><strong className="text-white/80">Gap</strong> &mdash; Set an exact pixel distance between selected controls. Type a number, hit enter. Supports negative values for overlapping.</p>
        <p><strong className="text-white/80">Align Columns / Align Rows</strong> &mdash; Advanced: when you have 2+ rows of controls, Align Columns snaps them to the topmost row&rsquo;s column positions. Align Rows does the same vertically. Great for making a grid perfectly even.</p>
        <p><strong className="text-white/80">Normalize Label Spacing</strong> &mdash; Select 2+ controls with labels. Snaps all labels to the tightest distance from their controls, grouped by position (above/below) and line count.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Labels">
        <p><strong className="text-white/80">Label positions</strong> &mdash; Each control&rsquo;s label can be above, below, left, right, on the button, or hidden. Change in the Properties panel.</p>
        <p><strong className="text-white/80">Center on control</strong> &mdash; Select a label, press <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">C</kbd> to center it horizontally on its control. Figma-style center alignment.</p>
        <p><strong className="text-white/80">Inline editing</strong> &mdash; Double-click any label to edit its text directly. Press Escape or click away to save.</p>
        <p><strong className="text-white/80">Standalone labels</strong> &mdash; Click <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">+L</kbd> in the toolbar to add a free-floating text label. Not linked to any control.</p>
        <p><strong className="text-white/80">Font size</strong> &mdash; Use the Sz dropdown in the toolbar to set font size for all labels, or set individually in the Properties panel.</p>
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

      <CollapsibleSection title="Containers">
        <p>Visual boxes that group related controls, like the recessed rectangles on real hardware that hold button clusters (e.g., BEAT SYNC / MASTER / KEY SYNC on CDJ-3000).</p>
        <p><strong className="text-white/80">Creating from controls</strong> &mdash; Select 2+ controls, right-click &rarr; &ldquo;Wrap in Container&rdquo;. A box appears wrapping the selected controls.</p>
        <p><strong className="text-white/80">Creating empty</strong> &mdash; Right-click on empty canvas &rarr; &ldquo;Add Container&rdquo;. A default-sized box appears at the click position. Resize and position it manually.</p>
        <p><strong className="text-white/80">Container styles</strong> &mdash; Four presets in the Properties panel: <em>Recessed</em> (dark inset, most common on DJ hardware), <em>Raised</em> (slight elevation), <em>Outlined</em> (thin border only), <em>Filled</em> (flat colored background).</p>
        <p><strong className="text-white/80">Editing</strong> &mdash; Click a container to select it. If controls are covering the container, hold <kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">Alt</kbd> and click any control inside &mdash; this selects the container underneath. Properties panel shows style selector, optional label, and border radius. Drag to reposition, drag corners to resize.</p>
        <p><strong className="text-white/80">Deleting</strong> &mdash; Right-click the container &rarr; &ldquo;Delete Container&rdquo;, or use the Delete button in the Properties panel. Deleting a container does NOT delete the controls inside.</p>
        <p><strong className="text-white/80">Containers vs Groups</strong> &mdash; Groups (<kbd className="rounded bg-white/10 px-1 text-[11px] font-mono">Cmd+G</kbd>) make controls move together. Containers add a visual box. They are independent &mdash; you can have a group without a container, a container without a group, or both.</p>
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
        <ShortcutRow action="Delete selection" keys="Backspace" />
        <ShortcutRow action="Duplicate" keys="Cmd+D" />
        <ShortcutRow action="Clear selection" keys="Escape" />
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">View Toggles</h4>
        <ShortcutRow action="Rulers" keys="R" />
        <ShortcutRow action="Grid overlay" keys="G" />
        <ShortcutRow action="Photo overlay" keys="P" />
        <ShortcutRow action="Layers panel" keys="L" />
        <ShortcutRow action="Labels" keys="T" />
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
    </div>
  );
}

function WorkflowTab() {
  const steps = [
    { title: 'Open the photo overlay', desc: 'Press P or click the Photo button. Switch to Overlay mode and set opacity to around 40-50% so you can see the real hardware under your controls.' },
    { title: 'Adjust canvas size', desc: 'Set the W and H values in the toolbar to match the photo proportions. This ensures controls are positioned at the right scale.' },
    { title: 'Position controls on the photo', desc: 'Drag each control to match its real position on the hardware. Start with the big, obvious ones (knobs, sliders, screens) then refine smaller controls.' },
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

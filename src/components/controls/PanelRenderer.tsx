'use client';

import PanelShell from './PanelShell';
import SectionContainer from './SectionContainer';
import PanelButton from './PanelButton';
import Knob from './Knob';
import Slider from './Slider';
import Wheel from './Wheel';
import PadButton from './PadButton';
import ValueDial from './ValueDial';
import Lever from './Lever';
import Port from './Port';
import TouchDisplay from './TouchDisplay';
import JogWheelAssembly from './JogWheelAssembly';
import DirectionSwitch from './DirectionSwitch';
import JogDisplay from './JogDisplay';
import SharedCircleButton from '@/components/panel/SharedCircleButton';
import SharedLed from '@/components/panel/SharedLed';
import SharedLedDot from '@/components/panel/SharedLedDot';
import { panelButtonHasLed } from '@/lib/led-gate';
import {
  renderLabelText,
  inferPortVariant,
  mapButtonLabelPosition,
} from '@/lib/render-helpers';
import SharedLabel from '@/components/panel/SharedLabel';
import { computeLabelZ } from '@/lib/label-zorder';
import { computeBannerBoxStyle, computeBannerTextStyle } from '@/lib/banner-style';
import type { PolishBanner } from '@/components/panel-editor/store/historySlice';
import { PanelState } from '@/types/panel';
import type { GroupLabel } from '@/types/manifest';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ManifestControl {
  id: string;
  type: string;
  label: string;
  shape?: string;
  surfaceColor?: string;
  buttonStyle?: string;
  labelPosition?: string;
  labelDisplay?: string;
  icon?: string;
  secondaryLabel?: string;
  ledVariant?: string;
  ledColor?: string;
  hasLed?: boolean;
  ledPosition?: string;
  nestedIn?: string;
  encoderHasPush?: boolean;
  positions?: number;
  positionLabels?: string[];
  rotation?: number;
  labelFontSize?: number;
  ledStyle?: 'dot' | 'face' | 'integrated' | 'label-backlit' | 'edge-glow';
  labelAlign?: string;
  labelColor?: string;
  zOrder?: number;
  editorPosition?: { x: number; y: number; w: number; h: number };
}

interface ManifestLabel {
  id: string;
  text: string;
  icon?: string;
  x: number;
  y: number;
  w?: number;
  fontSize: number;
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
  lineHeight?: number;
  /**
   * If set, this label is linked to a control — it inherits the control's
   * z-order so a "Bring to Front" gesture on the control brings the label
   * with it (otherwise labels are stuck at z=150 and any overlapping
   * control hides them regardless of zOrder).
   */
  controlId?: string;
}

interface ManifestSection {
  id: string;
  headerLabel?: string;
  hidden?: boolean;
  frameMode?: 'full' | 'header-only' | 'body-only' | 'hidden';
  showTitleBanner?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PanelManifest {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  controls: ManifestControl[];
  editorSections?: ManifestSection[];
  editorLabels?: ManifestLabel[];
  groupLabels?: GroupLabel[];
  controlContainers?: {
    id: string;
    style: string;
    x: number; y: number; w: number; h: number;
    borderRadius?: number;
    label?: string;
  }[];
  polishBanners?: PolishBanner[];
  keyboard?: {
    keys: number;
    startNote: string;
    panelHeightPercent: number;
    leftPercent?: number;
    widthPercent?: number;
  } | null;
  panelWidth: number;
  panelHeight: number;
  controlScale?: number;
}

export interface PanelRendererProps {
  manifest: PanelManifest;
  panelState?: PanelState;
  displayState?: import('@/types/display').DisplayState;
  highlightedControls?: string[];
  zones?: { zoneNumber: number; color: string; lowNote: number; highNote: number; label: string }[];
  onButtonClick?: (id: string) => void;
}

// ─── Control Renderer ───────────────────────────────────────────────────────

function renderControl(
  control: ManifestControl,
  allControls: ManifestControl[],
  w: number,
  h: number,
  highlighted: boolean,
  active: boolean,
  ledOn: boolean,
  onClick?: () => void,
  displayState?: import('@/types/display').DisplayState,
): React.ReactNode {
  switch (control.type) {
    case 'button': {
      // Dual-label buttons render as LED indicator regardless of type.
      // Preview is tutorial-time — pass `ledOn` so SharedLed's dual-label
      // active-row logic (ledOn !== false → top active) matches the
      // pre-PR-3 inline render exactly.
      if (control.ledVariant === 'dual-label') {
        return (
          <SharedLed
            width={w}
            height={h}
            variant="dual-label"
            label={control.label}
            secondaryLabel={control.secondaryLabel}
            ledColor={control.ledColor}
            ledOn={ledOn}
          />
        );
      }
      if (control.shape === 'circle') {
        const diameter = Math.min(w, h);
        return (
          <div className="relative" data-control-id={control.id}>
            {control.hasLed && control.ledPosition !== 'inside' && (control.ledStyle ?? 'dot') === 'dot' && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ zIndex: 1 }}>
                <SharedLedDot color={control.ledColor ?? '#22c55e'} ledOn={ledOn} />
              </div>
            )}
            <SharedCircleButton
              diameter={diameter}
              label={control.label}
              icon={control.icon}
              labelPosition={control.labelPosition}
              labelDisplay={control.labelDisplay}
              labelFontSize={control.labelFontSize}
              labelColor={control.labelColor}
              surfaceColor={control.surfaceColor}
              hasLed={control.hasLed}
              ledStyle={control.ledStyle}
              ledColor={control.ledColor}
              ledOn={ledOn}
              active={active}
              onClick={onClick}
              highlighted={highlighted}
            />
          </div>
        );
      }

      const rawStyle = control.buttonStyle;
      const variant = (rawStyle === 'raised' ? 'standard' : (rawStyle ?? 'standard')) as any;
      // Icons are rendered by the editorLabels section below — not inline here.
      return (
        <div className="relative">
          {control.hasLed && control.ledPosition !== 'inside' && (control.ledStyle ?? 'dot') === 'dot' && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ zIndex: 1 }}>
              <SharedLedDot color={control.ledColor ?? '#22c55e'} ledOn={ledOn} />
            </div>
          )}
          <PanelButton
            id={control.id}
            label={control.labelPosition === 'on-button' ? control.label : ''}
            highlighted={highlighted}
            active={active}
            width={w}
            height={h}
            variant={variant}
            surfaceColor={control.surfaceColor ?? undefined}
            // Gate logic lives in panelButtonHasLed() — see src/lib/led-gate.ts.
            // Both PanelRenderer (preview) and ControlNode (editor) consume the
            // same helper so the editor↔preview parity gate cannot drift.
            hasLed={panelButtonHasLed(control)}
            ledOn={ledOn}
            ledColor={control.ledColor ?? undefined}
            labelPosition={mapButtonLabelPosition(control.labelPosition)}
            labelFontSize={control.labelFontSize}
            ledStyle={control.ledStyle}
            labelAlign={control.labelAlign}
            labelColor={control.labelColor}
            onClick={onClick}
          />
        </div>
      );
    }
    case 'knob': {
      const knobSize = Math.max(Math.min(w, h) - 4, 12);
      return (
        <Knob id={control.id} label="" highlighted={highlighted}
          outerSize={knobSize} innerSize={knobSize * 0.7}
          hasLed={control.hasLed} ledColor={control.ledColor ?? undefined} ledOn={ledOn} />
      );
    }
    case 'fader':
    case 'slider':
      return (
        <Slider id={control.id} label="" highlighted={highlighted}
          trackHeight={Math.max(h - 10, 20)} trackWidth={Math.max(w - 4, 8)}
          rotation={control.rotation} />
      );
    case 'led':
    case 'indicator': {
      // Preview is tutorial-time. SharedLed dispatches on `variant`:
      //   - dual-label: ledOn !== false → top row active (mode-toggle)
      //   - bar: ledOn !== false → lit; ledOn === false → dim
      //   - dot: ledOn === true → lit; anything else → dim
      // PanelRenderer's renderControl signature has ledOn: boolean (always
      // boolean, defaulting to false from `state.ledOn ?? false`). Pass it
      // through — SharedLed handles the per-variant interpretation.
      const variant: 'dot' | 'dual-label' | 'bar' =
        control.ledVariant === 'dual-label' ? 'dual-label'
        : control.ledVariant === 'bar' ? 'bar'
        : 'dot';
      return (
        <SharedLed
          width={w}
          height={h}
          variant={variant}
          label={control.label}
          secondaryLabel={control.secondaryLabel}
          ledColor={control.ledColor}
          ledOn={ledOn}
          dataControlId={control.id}
          highlighted={highlighted}
        />
      );
    }
    case 'wheel': {
      const nestedIds = allControls.filter(c => c.nestedIn === control.id);
      const nestedDisplay = nestedIds.find(c => c.type === 'screen' || c.type === 'display');
      const nestedRing = nestedIds.find(c => c.type === 'led' && c.ledPosition === 'ring');
      if (nestedDisplay || nestedRing) {
        return (
          <JogWheelAssembly id={control.id} label="" highlighted={highlighted}
            wheelSize={Math.min(w, h)}
            displaySize={nestedDisplay ? Math.min(nestedDisplay.editorPosition?.w ?? 60, nestedDisplay.editorPosition?.h ?? 60, 60) : 60}
            ringColor={nestedRing?.ledColor ?? undefined}
            ledOn={ledOn} />
        );
      }
      return <Wheel id={control.id} label="" highlighted={highlighted} width={w} height={h} />;
    }
    case 'pad':
      return (
        <div className="relative">
          {control.hasLed && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ zIndex: 1 }}>
              <SharedLedDot color={control.ledColor ?? '#22c55e'} ledOn={ledOn} />
            </div>
          )}
          <PadButton id={control.id}
            label={control.labelPosition === 'on-button' ? control.label : ''}
            highlighted={highlighted} active={active}
            width={w} height={h} onClick={onClick}
            labelFontSize={control.labelFontSize}
            labelAlign={control.labelAlign}
            labelColor={control.labelColor} />
        </div>
      );
    case 'encoder':
      return (
        <ValueDial id={control.id} label="" highlighted={highlighted}
          outerSize={Math.min(w, h)} hasPush={control.encoderHasPush} />
      );
    case 'switch':
    case 'lever': {
      if (control.positions && control.positions > 2) {
        return (
          <DirectionSwitch id={control.id} label=""
            positions={control.positionLabels ?? Array.from({ length: control.positions }, (_, i) => `${i + 1}`)}
            highlighted={highlighted} ledColor={control.ledColor ?? undefined}
            width={w} height={Math.min(h, 16)} />
        );
      }
      return (
        <Lever id={control.id} label="" highlighted={highlighted}
          scale={h / 62} positions={control.positions}
          positionLabels={control.positionLabels} />
      );
    }
    case 'port':
      return <Port id={control.id} label="" variant={inferPortVariant(control.label) as any}
        highlighted={highlighted} width={w} height={h}
        hasLed={control.hasLed} ledColor={control.ledColor ?? undefined} ledOn={ledOn} />;
    case 'slot':
      return <Port id={control.id} label="" variant="sd-card"
        highlighted={highlighted} width={w} height={h}
        hasLed={control.hasLed} ledColor={control.ledColor ?? undefined} ledOn={ledOn} />;
    case 'screen':
    case 'display': {
      const isJog = control.shape === 'circle'
        || control.label.toLowerCase().includes('jog')
        || control.nestedIn != null;
      if (isJog) {
        return <JogDisplay id={control.id} size={Math.min(w, h)}
          highlighted={highlighted} showMockContent displayState={displayState} />;
      }
      // displayState (when set by tutorial step) takes precedence over mock content.
      // When undefined, TouchDisplay falls back to showMockContent for editor preview.
      return <TouchDisplay id={control.id} highlighted={highlighted}
        width={w} height={h} showMockContent displayState={displayState} />;
    }
    default:
      return <div className="text-xs text-red-400">Unknown: {control.type}</div>;
  }
}

// ─── PanelRenderer ──────────────────────────────────────────────────────────

export default function PanelRenderer({
  manifest,
  panelState = {},
  displayState,
  highlightedControls = [],
  zones,
  onButtonClick,
}: PanelRendererProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };
  const scale = manifest.controlScale ?? 1;
  const topLevelControls = manifest.controls.filter(c => !c.nestedIn);

  return (
    <PanelShell
      manufacturer={manifest.manufacturer}
      deviceName={manifest.deviceName}
      width={manifest.panelWidth}
      height={manifest.panelHeight}
      keyboard={manifest.keyboard}
      zones={zones}
    >
      {/* Section backgrounds */}
      {(manifest.editorSections ?? []).map((s) => {
        const mode = s.frameMode ?? (s.hidden ? 'hidden' : 'full');
        if (mode === 'hidden') return null;
        // Whether to render the dark banner backdrop behind the title.
        // Defaults to true (current behavior); contractor can switch
        // off via Properties Panel for a cleaner look.
        const showBanner = s.showTitleBanner !== false;
        if (mode === 'header-only') {
          // Floating title only — no container body. Optional banner
          // backdrop sits behind the text when showBanner is true,
          // matching the Full-mode header strip's background.
          return s.headerLabel ? (
            <div
              key={s.id}
              data-section-id={s.id}
              style={{
                position: 'absolute',
                left: s.x,
                top: s.y,
                width: s.w,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 8,
                pointerEvents: 'none',
                zIndex: 0,
                backgroundColor: showBanner ? 'rgba(0,0,0,0.15)' : 'transparent',
                borderRadius: showBanner ? 4 : undefined,
              }}
            >
              <span style={{
                fontSize: 8,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#666',
              }}>
                {s.headerLabel}
              </span>
            </div>
          ) : null;
        }
        // body-only: render the SectionContainer frame but pass no
        // headerLabel — frame body visible, title strip hidden. Editor
        // and preview must render this identically; SectionContainer's
        // own logic handles a missing headerLabel.
        if (mode === 'body-only') {
          return (
            <SectionContainer key={s.id} id={s.id}
              x={s.x} y={s.y} w={s.w} h={s.h} />
          );
        }
        // Full mode — render SectionContainer with header.
        // showTitleBanner controls the banner backdrop behind the title.
        return (
          <SectionContainer key={s.id} id={s.id}
            x={s.x} y={s.y} w={s.w} h={s.h}
            headerLabel={s.headerLabel}
            showTitleBanner={showBanner} />
        );
      })}

      {/* Polish banners — purely decorative overlay (z=5, above sections + containers,
          below controls). `pointer-events: none` so clicks pass through to controls
          underneath. Uses the SAME computeBannerBoxStyle as the editor's
          PolishBannerLayer — guaranteed editor/preview parity by construction. */}
      {(manifest.polishBanners ?? []).map((banner) => (
        <div
          key={banner.id}
          data-banner-id={banner.id}
          style={{
            ...computeBannerBoxStyle(banner),
            pointerEvents: 'none',
          }}
        >
          {banner.text && <div style={computeBannerTextStyle(banner)}>{banner.text}</div>}
        </div>
      ))}

      {/* Containers (visual grouping boxes) */}
      {(manifest.controlContainers ?? []).map((c) => {
        const containerStyles: Record<string, React.CSSProperties> = {
          recessed: { background: 'rgba(0,0,0,0.15)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' },
          raised: { background: 'rgba(255,255,255,0.03)', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' },
          outlined: { background: 'transparent', border: '1px solid rgba(255,255,255,0.12)' },
          filled: { background: 'rgba(0,0,0,0.1)', border: 'none' },
        };
        return (
          <div
            key={c.id}
            className="absolute"
            style={{
              left: c.x, top: c.y, width: c.w, height: c.h,
              borderRadius: c.borderRadius ?? 4,
              zIndex: 2,
              ...containerStyles[c.style] ?? containerStyles.recessed,
            }}
          >
            {c.label && (
              <span className="absolute -top-3.5 left-1 text-[7px] font-medium text-gray-500 uppercase tracking-wider pointer-events-none">
                {c.label}
              </span>
            )}
          </div>
        );
      })}

      {/* Controls */}
      {topLevelControls.map((ctrl) => {
        const ep = ctrl.editorPosition;
        if (!ep) return null;
        const w = Math.round(ep.w * scale);
        const h = Math.round(ep.h * scale);
        const state = getState(ctrl.id);
        const inner = renderControl(
          ctrl, manifest.controls, w, h,
          isHighlighted(ctrl.id),
          state.active ?? false,
          state.ledOn ?? false,
          onButtonClick ? () => onButtonClick(ctrl.id) : undefined,
          // Pass tutorial-driven displayState through to screen/display controls.
          // Only meaningful for screen/display types; ignored by other controls.
          displayState,
        );
        const rotation = ctrl.rotation;
        // Faders re-lay-out natively for 90/270; skip the CSS rotation
        // wrapper so the slider's own horizontal layout isn't double-rotated.
        const isFader = ctrl.type === 'fader' || ctrl.type === 'slider';
        const skipRotation = isFader && (rotation === 90 || rotation === 270);
        return (
          <div
            key={ctrl.id}
            className="absolute"
            style={{
              left: ep.x, top: ep.y, width: w, height: h,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              // Match editor's ControlNode `overflow-visible` — without this,
              // LED box-shadow glows are clipped by PanelShell's `overflow:
              // hidden`, leaving the editor and preview visually different.
              overflow: 'visible',
              // zIndex matches the editor's ControlLayer (z=200) so controls
              // sit above floating labels (z=150) and the keyboard (z=50).
              // Individual `zOrder` (contractor's "Bring to front" gesture)
              // is added on top so controls within the layer can be re-stacked
              // exactly as in the editor.
              zIndex: 200 + (ctrl.zOrder ?? 0),
            }}
          >
            {rotation && !skipRotation ? (
              <div style={{ transform: `rotate(${rotation}deg)`, width: w, height: h,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {inner}
              </div>
            ) : inner}
          </div>
        );
      })}

      {/* Group labels */}
      {(manifest.groupLabels ?? []).map((gl) => {
        const memberControls = manifest.controls.filter(c => gl.controlIds.includes(c.id));
        const eps = memberControls.map(c => c.editorPosition).filter(Boolean) as Array<{ x: number; y: number; w: number; h: number }>;
        if (eps.length === 0) return null;
        const minX = Math.min(...eps.map(e => e.x));
        const maxX = Math.max(...eps.map(e => e.x + e.w * scale));
        const minY = Math.min(...eps.map(e => e.y));
        const maxY = Math.max(...eps.map(e => e.y + e.h * scale));
        const labelY = gl.position === 'above' ? minY - 14 : maxY + 2;
        return (
          <span key={gl.id} className="absolute text-[8px] font-semibold text-gray-500 uppercase tracking-widest text-center pointer-events-none"
            style={{ left: minX, width: maxX - minX, top: labelY }}>
            {gl.text}
          </span>
        );
      })}

      {/* Floating labels — shared with editor's LabelLayer via SharedLabel
          so pixel positioning is identical between modes. Contractor sees
          exact preview match for label drift. */}
      {(manifest.editorLabels ?? []).filter(l => !l.hidden).map((label) => (
        <SharedLabel
          key={label.id}
          label={{
            id: label.id,
            text: label.text,
            icon: label.icon,
            x: label.x,
            y: label.y,
            w: label.w,
            fontSize: label.fontSize,
            align: label.align as 'left' | 'center' | 'right' | undefined,
            lineHeight: label.lineHeight,
            color: (label as { color?: string }).color,
          }}
          // Per-label z: linked labels ride with their control's zOrder so
          // they stay visible above overlapping controls; standalone labels
          // stay at the historical z=150. Without per-label z, labels are
          // stuck at 150 and any control (z=200+) hides them — the issue
          // PR #140 inadvertently introduced by locking labels at a fixed z.
          // See src/lib/label-zorder.ts for the formula.
          zIndex={computeLabelZ({
            controlId: label.controlId,
            // Treat existing control with no zOrder as 0; null only when the
            // control no longer exists (orphan label).
            controlZOrder: (id) => {
              const c = manifest.controls.find((c) => c.id === id);
              return c ? (c.zOrder ?? 0) : null;
            },
          })}
          innerSpanProps={{ 'data-label-id': label.id }}
        />
      ))}
    </PanelShell>
  );
}

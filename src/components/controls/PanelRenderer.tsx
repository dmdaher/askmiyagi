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
import { HARDWARE_ICONS, HARDWARE_ICON_SVGS } from '@/lib/hardware-icons';
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
  ledStyle?: 'integrated' | 'dot';
  labelAlign?: string;
  labelColor?: string;
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
}

interface ManifestSection {
  id: string;
  headerLabel?: string;
  hidden?: boolean;
  frameMode?: 'full' | 'header-only' | 'hidden';
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
  displayState?: any;
  highlightedControls?: string[];
  zones?: { zoneNumber: number; color: string; lowNote: number; highNote: number; label: string }[];
  onButtonClick?: (id: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function renderLabelText(text: string): React.ReactNode {
  if (!text.includes('\n')) return text;
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {line}
    </span>
  ));
}

function inferPortVariant(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('usb')) return 'usb-a';
  if (l.includes('sd') || l.includes('card')) return 'sd-card';
  if (l.includes('ethernet') || l.includes('lan')) return 'ethernet';
  if (l.includes('rca') || l.includes('phono')) return 'rca';
  return 'usb-a';
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
): React.ReactNode {
  switch (control.type) {
    case 'button': {
      // Dual-label buttons render as LED indicator regardless of type
      if (control.ledVariant === 'dual-label') {
        const ledColor = control.ledColor ?? '#22c55e';
        const parts = control.label.split(/[\/\n]/).map(s => s.trim()).filter(Boolean);
        const topActive = ledOn !== false;
        return (
          <div className="flex flex-col rounded overflow-hidden"
            style={{ width: w, height: h, border: '1px solid #333' }}>
            <div className="flex flex-1 items-center justify-center py-0.5 px-1"
              style={{ backgroundColor: topActive ? '#0a2e1a' : '#1a1a2a', borderBottom: '1px solid #333' }}>
              <span className="text-[7px] font-medium uppercase truncate" style={{ color: topActive ? '#4ade80' : `${ledColor}88` }}>{parts[0] || 'MODE A'}</span>
            </div>
            <div className="flex flex-1 items-center justify-center py-0.5 px-1"
              style={{ backgroundColor: !topActive ? '#0a2e1a' : '#1a1a2a' }}>
              <span className="text-[7px] font-medium uppercase truncate" style={{ color: !topActive ? '#4ade80' : `${ledColor}88` }}>{parts[1] || 'MODE B'}</span>
            </div>
          </div>
        );
      }
      if (control.shape === 'circle') {
        const diameter = Math.min(w, h);
        const iconKey = control.icon;
        const iconContent = iconKey ? (HARDWARE_ICONS[iconKey] ?? iconKey) : undefined;
        const showInside = control.labelPosition === 'on-button' || control.labelDisplay === 'icon-only';
        const displayText = iconContent ?? control.label;
        const isIcon = !!iconContent;
        const isIntegrated = control.ledStyle === 'integrated' && control.hasLed;
        const intColor = control.ledColor ?? '#22c55e';
        return (
          <div className="relative" data-control-id={control.id}>
            {control.hasLed && control.ledPosition !== 'inside' && control.ledStyle !== 'integrated' && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ zIndex: 1 }}>
                <div className="rounded-full" style={{
                  width: 6, height: 6,
                  backgroundColor: ledOn ? (control.ledColor ?? '#22c55e') : '#333',
                  boxShadow: ledOn ? `0 0 4px 1px ${control.ledColor ?? '#22c55e'}` : 'none',
                }} />
              </div>
            )}
            <div
              className="rounded-full flex items-center justify-center cursor-pointer"
              style={{
                width: diameter, height: diameter,
                backgroundColor: isIntegrated
                  ? (ledOn === true ? undefined : (ledOn === false ? '#2a2a2a' : `${intColor}10`))
                  : (active ? '#3a3a3a' : '#2a2a2a'),
                background: isIntegrated && ledOn === true
                  ? `radial-gradient(ellipse at 50% 40%, ${intColor}50 0%, ${intColor}25 50%, transparent 80%)`
                  : undefined,
                border: isIntegrated
                  ? (ledOn === true ? `1px solid ${intColor}` : ledOn === false ? `3px solid ${control.surfaceColor ?? '#444'}` : `1px solid ${intColor}25`)
                  : `3px solid ${control.surfaceColor ?? '#444'}`,
                boxShadow: isIntegrated && ledOn === true
                  ? `0 0 12px ${intColor}80, 0 0 4px ${intColor}60, inset 0 0 8px ${intColor}30`
                  : (control.surfaceColor
                    ? `inset 0 2px 4px rgba(0,0,0,0.4), 0 0 8px ${control.surfaceColor}40`
                    : 'inset 0 2px 4px rgba(0,0,0,0.4)'),
              }}
              onClick={onClick}
            >
              {showInside && (
                <span className={`font-medium uppercase text-center leading-tight ${isIcon ? 'whitespace-nowrap' : 'w-full px-1'}`}
                  style={{
                    fontSize: control.labelFontSize ?? (isIcon ? Math.max(Math.round(diameter * 0.35), 8) : 8),
                    color: control.labelColor ?? '#d1d5db',
                    overflowWrap: isIcon ? undefined : 'break-word',
                  }}>
                  {displayText}
                </span>
              )}
            </div>
          </div>
        );
      }

      const rawStyle = control.buttonStyle;
      const variant = (rawStyle === 'raised' ? 'standard' : (rawStyle ?? 'standard')) as any;
      const hasIcon = !!control.icon && !!control.labelDisplay && control.labelDisplay !== 'on-button';
      const svgContent = hasIcon ? HARDWARE_ICON_SVGS[control.icon!] : undefined;
      const iconContent = (hasIcon && !svgContent)
        ? (HARDWARE_ICONS[control.icon!] ?? control.icon) : undefined;

      const iconOnButton = hasIcon && control.labelDisplay !== 'above' && control.labelDisplay !== 'below';
      const iconAbove = hasIcon && control.labelDisplay === 'above';
      const iconBelow = hasIcon && control.labelDisplay === 'below';
      const iconSize = Math.round(Math.min(w, h) * 0.5);

      return (
        <div className="relative">
          {control.hasLed && control.ledPosition !== 'inside' && control.ledStyle !== 'integrated' && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ zIndex: 1 }}>
              <div className="rounded-full" style={{
                width: 6, height: 6,
                backgroundColor: ledOn ? (control.ledColor ?? '#22c55e') : '#333',
                boxShadow: ledOn ? `0 0 4px 1px ${control.ledColor ?? '#22c55e'}` : 'none',
              }} />
            </div>
          )}
          {/* Icon above — floats independently */}
          {iconAbove && (
            <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none text-gray-300"
              style={{ bottom: '100%', marginBottom: 2, width: iconSize, height: iconSize }}>
              {svgContent ?? <span className="block text-center" style={{ fontSize: iconSize * 0.8 }}>{iconContent}</span>}
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
            iconContent={iconOnButton ? iconContent : undefined}
            svgIcon={iconOnButton ? svgContent : undefined}
            hasLed={control.hasLed && control.ledPosition === 'inside'}
            ledOn={ledOn}
            ledColor={control.ledColor ?? undefined}
            labelFontSize={control.labelFontSize}
            ledStyle={control.ledStyle}
            labelAlign={control.labelAlign}
            labelColor={control.labelColor}
            onClick={onClick}
          />
          {/* Icon below — floats independently */}
          {iconBelow && (
            <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none text-gray-300"
              style={{ top: '100%', marginTop: 2, width: iconSize, height: iconSize }}>
              {svgContent ?? <span className="block text-center" style={{ fontSize: iconSize * 0.8 }}>{iconContent}</span>}
            </div>
          )}
        </div>
      );
    }
    case 'knob': {
      const knobSize = Math.max(Math.min(w, h) - 4, 12);
      return (
        <Knob id={control.id} label="" highlighted={highlighted}
          outerSize={knobSize} innerSize={knobSize * 0.7} />
      );
    }
    case 'fader':
    case 'slider':
      return (
        <Slider id={control.id} label="" highlighted={highlighted}
          trackHeight={Math.max(h - 10, 20)} trackWidth={Math.max(w - 4, 8)} />
      );
    case 'led':
    case 'indicator': {
      const ledColor = control.ledColor ?? '#22c55e';
      if (control.ledVariant === 'dual-label') {
        const parts = control.label.split(/[\/\n]/).map(s => s.trim()).filter(Boolean);
        // ledOn=true → top row lit; ledOn=false → bottom row lit (mode toggle)
        const topActive = ledOn !== false;
        return (
          <div className="flex flex-col rounded overflow-hidden"
            style={{ width: w, height: h, border: '1px solid #333' }}>
            <div className="flex flex-1 items-center justify-center py-0.5 px-1"
              style={{ backgroundColor: topActive ? '#0a2e1a' : '#1a1a2a', borderBottom: '1px solid #333' }}>
              <span className="text-[7px] font-medium uppercase truncate" style={{
                color: topActive ? '#4ade80' : `${ledColor}88`,
              }}>{parts[0] || 'MODE A'}</span>
            </div>
            <div className="flex flex-1 items-center justify-center py-0.5 px-1"
              style={{ backgroundColor: !topActive ? '#0a2e1a' : '#1a1a2a' }}>
              <span className="text-[7px] font-medium uppercase truncate" style={{
                color: !topActive ? '#4ade80' : `${ledColor}88`,
              }}>{parts[1] || 'MODE B'}</span>
            </div>
          </div>
        );
      }
      if (control.ledVariant === 'bar') {
        return (
          <div className="flex flex-col items-center justify-center gap-1 rounded"
            style={{ backgroundColor: '#1a1a2a', padding: 4 }}>
            <div className="rounded-sm" style={{
              width: Math.max(w - 8, 16), height: 6,
              backgroundColor: ledOn ? ledColor : '#333',
              boxShadow: ledOn ? `0 0 6px ${ledColor}` : 'none',
            }} />
            <span className="text-[7px] text-gray-400 uppercase break-words w-full text-center leading-tight">
              {renderLabelText(control.label)}
            </span>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center gap-1 rounded"
          style={{ backgroundColor: '#1a1a2a', padding: 4 }}>
          <div className="rounded-full" style={{
            width: 20, height: 20,
            backgroundColor: ledOn ? ledColor : '#333',
            border: `3px solid ${ledOn ? `${ledColor}44` : '#222'}`,
            boxShadow: ledOn
              ? 'inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)'
              : 'inset 0 1px 3px rgba(0,0,0,0.5)',
          }} />
          <span className="text-[7px] text-gray-400 uppercase break-words w-full text-center leading-tight">
            {renderLabelText(control.label)}
          </span>
        </div>
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
            ringColor={nestedRing?.ledColor ?? undefined} />
        );
      }
      return <Wheel id={control.id} label="" highlighted={highlighted} width={w} height={h} />;
    }
    case 'pad':
      return (
        <div className="relative">
          {control.hasLed && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ zIndex: 1 }}>
              <div className="rounded-full" style={{
                width: 6, height: 6,
                backgroundColor: ledOn ? (control.ledColor ?? '#22c55e') : '#333',
                boxShadow: ledOn ? `0 0 4px 1px ${control.ledColor ?? '#22c55e'}` : 'none',
              }} />
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
        highlighted={highlighted} width={w} height={h} />;
    case 'slot':
      return <Port id={control.id} label="" variant="sd-card"
        highlighted={highlighted} width={w} height={h} />;
    case 'screen':
    case 'display': {
      const isJog = control.shape === 'circle'
        || control.label.toLowerCase().includes('jog')
        || control.nestedIn != null;
      if (isJog) {
        return <JogDisplay id={control.id} size={Math.min(w, h)}
          highlighted={highlighted} showMockContent />;
      }
      return <TouchDisplay id={control.id} highlighted={highlighted}
        width={w} height={h} showMockContent />;
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
        if (mode === 'header-only') {
          // Floating title only — no container background
          // Section coords are in pixels (same as SectionContainer), no scale needed
          return s.headerLabel ? (
            <div
              key={s.id}
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
        // Full mode — render SectionContainer
        return (
          <SectionContainer key={s.id} id={s.id}
            x={s.x} y={s.y} w={s.w} h={s.h}
            headerLabel={s.headerLabel} />
        );
      })}

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
        );
        const rotation = ctrl.rotation;
        return (
          <div
            key={ctrl.id}
            className="absolute"
            style={{
              left: ep.x, top: ep.y, width: w, height: h,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {rotation ? (
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

      {/* Floating labels */}
      {(manifest.editorLabels ?? []).filter(l => !l.hidden).map((label) => (
        <div key={label.id} className="absolute pointer-events-none"
          style={{
            left: label.x, top: label.y,
            width: label.w ?? 'auto',
            textAlign: (label.align ?? 'center') as any,
            fontSize: label.fontSize,
            lineHeight: `${label.lineHeight ?? label.fontSize + 2}px`,
          }}>
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            {label.icon && HARDWARE_ICONS[label.icon] && (
              <span style={{ marginRight: label.text ? 3 : 0 }}>{HARDWARE_ICONS[label.icon]}</span>
            )}
            {label.text && renderLabelText(label.text)}
          </span>
        </div>
      ))}
    </PanelShell>
  );
}

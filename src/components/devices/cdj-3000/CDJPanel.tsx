'use client';

import { PanelState } from '@/types/panel';
import { DisplayState } from '@/types/display';
import PanelButton from '@/components/controls/PanelButton';
import Knob from '@/components/controls/Knob';
import Slider from '@/components/controls/Slider';
import LEDIndicator from '@/components/controls/LEDIndicator';
import {
  CDJ_PANEL_WIDTH,
  CDJ_PANEL_HEIGHT,
  CDJ_COLORS,
  CDJ_CONTROL_IDS,
  SECTION_WIDTH_PCT,
  TEMPO_SLIDER_HEIGHT,
  TEMPO_SLIDER_WIDTH,
  TEMPO_SLIDER_THUMB_HEIGHT,
} from '@/lib/devices/cdj-3000-constants';

interface CDJPanelProps {
  panelState: PanelState;
  displayState: DisplayState;
  highlightedControls: string[];
  onControlClick?: (id: string) => void;
  /** Render only this section in isolation (for Phase 1 validation) */
  isolateSection?: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getButtonState(
  panelState: PanelState,
  id: string
): { active: boolean; ledOn: boolean } {
  const state = panelState[id];
  return {
    active: state?.active ?? false,
    ledOn: state?.ledOn ?? false,
  };
}

// ─── RIGHT-TEMPO Section ──────────────────────────────────────────────────────
//
// Physical order (top-to-bottom, manual items 38-48, p.14-16):
//   38. JOG MODE button
//   39. VINYL/CDJ indicator
//   40. JOG ADJUST knob
//   41. MASTER button (with LED)
//   42. KEY SYNC button (with LED)
//   43. BEAT SYNC/INST.DOUBLES button (with LED)
//   44. TEMPO ±6/±10/±16/WIDE button
//   45. MASTER TEMPO button (with LED)
//   46. TEMPO slider  ← tall vertical fader, runs alongside 41-48 on the right
//   47. TEMPO RESET indicator
//   48. TEMPO RESET button
//
// Layout: The tempo slider (46) runs along the RIGHT edge, alongside buttons 41-48.
// Buttons are in a left sub-column; the slider occupies the right sub-column.
// JOG MODE (38), VINYL/CDJ indicator (39), and JOG ADJUST (40) sit above the
// slider/button split zone and span the full section width.

interface RightTempoSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onControlClick?: (id: string) => void;
}

function RightTempoSection({
  panelState,
  highlightedControls,
  onControlClick,
}: RightTempoSectionProps) {
  const ids = CDJ_CONTROL_IDS;

  const jogMode = getButtonState(panelState, ids.jogModeBtn);
  const master = getButtonState(panelState, ids.masterBtn);
  const keySync = getButtonState(panelState, ids.keySyncBtn);
  const beatSync = getButtonState(panelState, ids.beatSyncInstDoublesBtn);
  const masterTempo = getButtonState(panelState, ids.masterTempoBtn);
  const vinylCdjLed = panelState[ids.vinylCdjIndicator]?.ledOn ?? false;
  const tempoResetLed = panelState[ids.tempoResetIndicator]?.ledOn ?? false;
  const tempoValue = panelState[ids.tempoSlider]?.value ?? 64;

  const isHighlighted = (id: string) => highlightedControls.includes(id);

  return (
    <div
      data-section-id="right-tempo"
      style={{
        width: `${SECTION_WIDTH_PCT.rightTempo}%`,
        minHeight: CDJ_PANEL_HEIGHT,
        backgroundColor: CDJ_COLORS.sectionBg,
        borderLeft: `1px solid ${CDJ_COLORS.sectionBorder}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: '8px 4px',
        gap: 6,
        boxSizing: 'border-box',
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: CDJ_COLORS.mutedText,
          textAlign: 'center',
          paddingBottom: 4,
          borderBottom: `1px solid ${CDJ_COLORS.sectionBorder}`,
        }}
      >
        Tempo / Sync
      </div>

      {/* Item 38 — JOG MODE button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <PanelButton
          id={ids.jogModeBtn}
          label="JOG MODE"
          size="sm"
          variant="standard"
          active={jogMode.active}
          highlighted={isHighlighted(ids.jogModeBtn)}
          onClick={() => onControlClick?.(ids.jogModeBtn)}
        />
      </div>

      {/* Item 39 — VINYL/CDJ indicator (dual LED) */}
      <div
        data-control-id={ids.vinylCdjIndicator}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* VINYL indicator */}
          <LEDIndicator
            id={ids.vinylCdjIndicator + '-vinyl'}
            on={vinylCdjLed}
            color={CDJ_COLORS.ledGreen}
            highlighted={isHighlighted(ids.vinylCdjIndicator)}
            size={7}
          />
          {/* CDJ indicator */}
          <LEDIndicator
            id={ids.vinylCdjIndicator + '-cdj'}
            on={!vinylCdjLed && (panelState[ids.vinylCdjIndicator]?.active ?? false)}
            color={CDJ_COLORS.ledBlue}
            highlighted={isHighlighted(ids.vinylCdjIndicator)}
            size={7}
          />
        </div>
        <span
          style={{
            fontSize: 7,
            color: CDJ_COLORS.labelText,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textAlign: 'center',
          }}
        >
          VINYL / CDJ
        </span>
      </div>

      {/* Item 40 — JOG ADJUST knob */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Knob
          id={ids.jogAdjustKnob}
          label="JOG ADJ"
          size="sm"
          value={panelState[ids.jogAdjustKnob]?.value ?? 64}
          highlighted={isHighlighted(ids.jogAdjustKnob)}
        />
      </div>

      {/* Divider before sync/tempo zone */}
      <div
        style={{
          height: 1,
          backgroundColor: CDJ_COLORS.sectionBorder,
          margin: '2px 0',
        }}
      />

      {/* Items 41-48 + tempo slider — split layout:
           Left sub-column: MASTER, KEY SYNC, BEAT SYNC, TEMPO RANGE, MASTER TEMPO
           Right sub-column: TEMPO slider (tall, spans buttons 41-45)
           Bottom row: TEMPO RESET indicator + TEMPO RESET button (spans full width)
      */}
      <div style={{ display: 'flex', flex: 1, gap: 4, alignItems: 'stretch' }}>
        {/* Left sub-column: sync + tempo buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            flex: 1,
            alignItems: 'center',
          }}
        >
          {/* Item 41 — MASTER button */}
          <PanelButton
            id={ids.masterBtn}
            label="MASTER"
            size="sm"
            variant="standard"
            active={master.active}
            hasLed
            ledOn={master.ledOn}
            ledColor={CDJ_COLORS.ledBlue}
            highlighted={isHighlighted(ids.masterBtn)}
            onClick={() => onControlClick?.(ids.masterBtn)}
          />

          {/* Item 42 — KEY SYNC button */}
          <PanelButton
            id={ids.keySyncBtn}
            label="KEY SYNC"
            size="sm"
            variant="standard"
            active={keySync.active}
            hasLed
            ledOn={keySync.ledOn}
            ledColor={CDJ_COLORS.ledBlue}
            highlighted={isHighlighted(ids.keySyncBtn)}
            onClick={() => onControlClick?.(ids.keySyncBtn)}
          />

          {/* Item 43 — BEAT SYNC/INST.DOUBLES button */}
          <PanelButton
            id={ids.beatSyncInstDoublesBtn}
            label="BEAT SYNC"
            size="sm"
            variant="standard"
            active={beatSync.active}
            hasLed
            ledOn={beatSync.ledOn}
            ledColor={CDJ_COLORS.ledBlue}
            highlighted={isHighlighted(ids.beatSyncInstDoublesBtn)}
            onClick={() => onControlClick?.(ids.beatSyncInstDoublesBtn)}
          />

          {/* Item 44 — TEMPO ±6/±10/±16/WIDE button */}
          <PanelButton
            id={ids.tempoRangeBtn}
            label="RANGE"
            size="sm"
            variant="function"
            active={getButtonState(panelState, ids.tempoRangeBtn).active}
            highlighted={isHighlighted(ids.tempoRangeBtn)}
            onClick={() => onControlClick?.(ids.tempoRangeBtn)}
          />

          {/* Item 45 — MASTER TEMPO button */}
          <PanelButton
            id={ids.masterTempoBtn}
            label="M.TEMPO"
            size="sm"
            variant="standard"
            active={masterTempo.active}
            hasLed
            ledOn={masterTempo.ledOn}
            ledColor={CDJ_COLORS.ledGreen}
            highlighted={isHighlighted(ids.masterTempoBtn)}
            onClick={() => onControlClick?.(ids.masterTempoBtn)}
          />

          {/* Spacer to push bottom pair to align with slider base */}
          <div style={{ flex: 1 }} />

          {/* Item 47 — TEMPO RESET indicator */}
          <div
            data-control-id={ids.tempoResetIndicator}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <LEDIndicator
              id={ids.tempoResetIndicator}
              on={tempoResetLed}
              color={CDJ_COLORS.ledRed}
              highlighted={isHighlighted(ids.tempoResetIndicator)}
              size={6}
            />
            <span
              style={{
                fontSize: 6,
                color: CDJ_COLORS.labelText,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                textAlign: 'center',
                lineHeight: 1,
              }}
            >
              RESET
            </span>
          </div>

          {/* Item 48 — TEMPO RESET button */}
          <PanelButton
            id={ids.tempoResetBtn}
            label="RESET"
            size="sm"
            variant="function"
            active={getButtonState(panelState, ids.tempoResetBtn).active}
            highlighted={isHighlighted(ids.tempoResetBtn)}
            onClick={() => onControlClick?.(ids.tempoResetBtn)}
          />
        </div>

        {/* Right sub-column: TEMPO slider (item 46) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 4,
            paddingBottom: 4,
          }}
        >
          <Slider
            id={ids.tempoSlider}
            label="TEMPO"
            value={tempoValue}
            highlighted={isHighlighted(ids.tempoSlider)}
            trackHeight={TEMPO_SLIDER_HEIGHT}
            trackWidth={TEMPO_SLIDER_WIDTH}
            thumbHeight={TEMPO_SLIDER_THUMB_HEIGHT}
            labelPosition="below"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Placeholder Sections ─────────────────────────────────────────────────────

function PlaceholderSection({
  label,
  widthPct,
}: {
  label: string;
  widthPct: number;
}) {
  return (
    <div
      style={{
        width: `${widthPct}%`,
        minHeight: CDJ_PANEL_HEIGHT,
        backgroundColor: CDJ_COLORS.sectionBg,
        borderLeft: `1px solid ${CDJ_COLORS.sectionBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          fontSize: 9,
          color: CDJ_COLORS.mutedText,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: 'monospace',
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
        }}
      >
        {label} — placeholder
      </span>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function CDJPanel({
  panelState,
  displayState,
  highlightedControls,
  onControlClick,
  isolateSection,
}: CDJPanelProps) {
  // Isolation mode — render only the requested section
  if (isolateSection === 'right-tempo') {
    return (
      <div
        style={{
          display: 'inline-flex',
          backgroundColor: CDJ_COLORS.panelBg,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <RightTempoSection
          panelState={panelState}
          highlightedControls={highlightedControls}
          onControlClick={onControlClick}
        />
      </div>
    );
  }

  return (
    <div
      data-device-id="cdj-3000"
      style={{
        width: CDJ_PANEL_WIDTH,
        height: CDJ_PANEL_HEIGHT,
        backgroundColor: CDJ_COLORS.panelBg,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)',
      }}
    >
      {/* LEFT column (transport + performance) — 20% */}
      <PlaceholderSection
        label="Left Transport + Performance"
        widthPct={SECTION_WIDTH_PCT.leftCol}
      />

      {/* CENTER (touchscreen + jog) — 47% */}
      <PlaceholderSection
        label="Center — Display + Jog"
        widthPct={SECTION_WIDTH_PCT.center}
      />

      {/* RIGHT-NAV — 14% */}
      <PlaceholderSection
        label="Right Nav"
        widthPct={SECTION_WIDTH_PCT.rightNav}
      />

      {/* RIGHT-TEMPO — 13% — FULLY BUILT */}
      <RightTempoSection
        panelState={panelState}
        highlightedControls={highlightedControls}
        onControlClick={onControlClick}
      />
    </div>
  );
}

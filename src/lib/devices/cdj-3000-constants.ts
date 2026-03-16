// Pioneer DJ CDJ-3000 — panel constants
// Derived from the official manual (329mm × 453mm physical dimensions, portrait orientation)
// Panel target: 900px wide × 1240px tall (preserves 329:453 = 0.727 hardware ratio)

export const CDJ_PANEL_WIDTH = 900;
export const CDJ_PANEL_HEIGHT = 1240;

// Section width percentages — derived from p.14 diagram proportions
// LEFT-COL (transport + performance): 20%  (~180px)
// CENTER (touchscreen + jog):         47%  (~423px)
// RIGHT-NAV:                          14%  (~126px)
// RIGHT-TEMPO:                        13%  (~117px)
// gaps/padding:                        6%  (~54px)
export const SECTION_WIDTH_PCT = {
  leftCol: 20,
  center: 47,
  rightNav: 14,
  rightTempo: 13,
} as const;

// Color palette — matches CDJ-3000 hardware aesthetic
export const CDJ_COLORS = {
  // Body / structure
  panelBg: '#1a1a1a',
  sectionBg: '#202020',
  sectionBorder: '#2a2a2a',
  sectionShadow: 'rgba(0,0,0,0.7)',

  // Text
  labelText: '#999999',
  headerText: '#e0e0e0',
  mutedText: '#666666',

  // Pioneer brand
  pioneerBlue: '#0088ff',
  pioneerBlueGlow: 'rgba(0,136,255,0.6)',

  // Jog ring illumination (red on CDJ-3000)
  jogRing: '#ff0000',
  jogRingGlow: 'rgba(255,0,0,0.6)',
  jogRingOff: '#330000',

  // LED colors
  ledGreen: '#00ff44',
  ledBlue: '#0088ff',
  ledRed: '#ff2222',
  ledOrange: '#ff8800',
  ledWhite: '#ffffff',
  ledOff: '#1a1a1a',

  // Jog wheel
  jogWheelBg: '#111111',
  jogWheelOuter: '#2a2a2a',
  jogDisplayBg: '#000000',
  jogDisplayText: '#ffffff',

  // Touch display
  displayBg: '#000000',
  displayBorder: '#333333',
  waveformBlue: '#0066ff',
  waveformGreen: '#00cc44',

  // Button styles
  buttonBase: '#2e2e2e',
  buttonActive: '#4a4a4a',
  buttonBorder: '#1a1a1a',

  // Slider
  sliderTrack: '#111111',
  sliderThumb: '#888888',
  sliderMarkings: '#444444',

  // Tempo section accent
  tempoAccent: '#0088ff',
} as const;

// Control ID constants — all RIGHT-TEMPO section controls
// (manual items 38-48, p.14-16)
export const CDJ_CONTROL_IDS = {
  // RIGHT-TEMPO section (items 38-48)
  jogModeBtn: 'jog-mode-btn',
  vinylCdjIndicator: 'vinyl-cdj-indicator',
  jogAdjustKnob: 'jog-adjust-knob',
  masterBtn: 'master-btn',
  keySyncBtn: 'key-sync-btn',
  beatSyncInstDoublesBtn: 'beat-sync-inst-doubles-btn',
  tempoRangeBtn: 'tempo-range-btn',
  masterTempoBtn: 'master-tempo-btn',
  tempoSlider: 'tempo-slider',
  tempoResetIndicator: 'tempo-reset-indicator',
  tempoResetBtn: 'tempo-reset-btn',

  // RIGHT-NAV section (items 29-37)
  backBtn: 'back-btn',
  tagTrackRemoveBtn: 'tag-track-remove-btn',
  rotarySelector: 'rotary-selector',
  trackFilterEditBtn: 'track-filter-edit-btn',
  shortcutBtn: 'shortcut-btn',
  vinylSpeedAdjKnob: 'vinyl-speed-adj-knob',
  cueLoopCallBackBtn: 'cue-loop-call-back-btn',
  cueLoopCallFwdBtn: 'cue-loop-call-fwd-btn',
  deleteBtn: 'delete-btn',
  memoryBtn: 'memory-btn',

  // CENTER section
  touchDisplay: 'touch-display',
  sourceBtn: 'source-btn',
  browseBtn: 'browse-btn',
  tagListBtn: 'tag-list-btn',
  sourceIndicator: 'source-indicator',
  playlistBtn: 'playlist-btn',
  searchBtn: 'search-btn',
  menuUtilityBtn: 'menu-utility-btn',
  jogWheel: 'jog-wheel',
  jogDisplay: 'jog-display',

  // LEFT-TRANSPORT section (items 1-11 + storage strip)
  playPauseBtn: 'play-pause-btn',
  cueBtn: 'cue-btn',
  searchBackBtn: 'search-back-btn',
  searchFwdBtn: 'search-fwd-btn',
  trackSearchBackBtn: 'track-search-back-btn',
  trackSearchFwdBtn: 'track-search-fwd-btn',
  directionLever: 'direction-lever',
  beatJumpBackBtn: 'beat-jump-back-btn',
  beatJumpFwdBtn: 'beat-jump-fwd-btn',
  fourBeatLoopBtn: 'four-beat-loop-btn',
  eightBeatLoopBtn: 'eight-beat-loop-btn',
  loopInBtn: 'loop-in-btn',
  loopOutBtn: 'loop-out-btn',
  loopReloopExitBtn: 'loop-reloop-exit-btn',
  sdCardIndicator: 'sd-card-indicator',
  sdCardSlot: 'sd-card-slot',
  usbStopBtn: 'usb-stop-btn',
  usbPortTop: 'usb-port-top',
  usbIndicator: 'usb-indicator',

  // LEFT-PERFORMANCE section (items 12-15)
  hotCueABtn: 'hot-cue-a-btn',
  hotCueBBtn: 'hot-cue-b-btn',
  hotCueCBtn: 'hot-cue-c-btn',
  hotCueDBtn: 'hot-cue-d-btn',
  hotCueEBtn: 'hot-cue-e-btn',
  hotCueFBtn: 'hot-cue-f-btn',
  hotCueGBtn: 'hot-cue-g-btn',
  hotCueHBtn: 'hot-cue-h-btn',
  callDeleteBtn: 'call-delete-btn',
  slipBtn: 'slip-btn',
  quantizeBtn: 'quantize-btn',
  timeModAutoCueBtn: 'time-mode-auto-cue-btn',
} as const;

// RIGHT-TEMPO section layout dimensions
// Tempo slider: tall vertical fader, ~60% of section height (~744px)
// Per gatekeeper: 5:1 height-to-width ratio → 600px height / 24px width
export const TEMPO_SLIDER_HEIGHT = 744;
export const TEMPO_SLIDER_WIDTH = 24;
export const TEMPO_SLIDER_THUMB_HEIGHT = 20;

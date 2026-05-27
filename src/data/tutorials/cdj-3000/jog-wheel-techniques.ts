import { Tutorial } from '@/types/tutorial';

export const jogWheelTechniques: Tutorial = {
  id: 'jog-wheel-techniques',
  deviceId: 'cdj-3000',
  title: 'Jog Wheel Techniques',
  description:
    'Toggle Vinyl / CDJ mode, pitch-bend with the outer ring, scratch on the jog top, dial the jog weight with JOG ADJUST, and shape the start / brake feel via VINYL SPEED ADJ. and Touch Cue preview.',
  category: 'playback',
  difficulty: 'intermediate',
  estimatedTime: '7 min',
  tags: [
    'jog-wheel',
    'jog-mode',
    'vinyl',
    'cdj-mode',
    'pitch-bend',
    'scratch',
    'jog-adjust',
    'vinyl-speed-adjust',
    'touch-cue',
    'intermediate',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Pick a Jog Mode',
      instruction:
        'Press the JOG MODE button. Each press toggles between Vinyl and CDJ modes. The VINYL / CDJ indicator on the deck shows the current mode — VINYL lights when Vinyl mode is on; the jog display also lights its VINYL badge.',
      details:
        'Vinyl mode: pressing the top of the jog stops playback, and turning the top while pressed scratches the track. CDJ mode: jog motion never stops or scratches playback — useful when you want a pure controller without the turntable feel.',
      highlightControls: ['JOG_MODE'],
      panelStateChanges: {
        JOG_MODE: { active: true },
        VINYL_CDJ_INDICATOR: { active: true, ledOn: true },
      },
    },
    {
      id: 'step-2',
      title: 'Pitch Bend with the Outer Ring',
      instruction:
        'During playback, turn the OUTER edge of the jog wheel — not the top. Clockwise nudges the tempo up momentarily; counter-clockwise nudges it down. Stop turning and the deck snaps back to the slider-set tempo.',
      details:
        'In CDJ mode the same momentary pitch-bend behaviour is also available by turning the jog top — there is no separate "scratch" gesture in CDJ mode, so all motion bends pitch.',
      highlightControls: ['JOG_WHEEL'],
      panelStateChanges: {
        JOG_WHEEL: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Scratch the Jog Top (Vinyl Mode)',
      instruction:
        'Make sure VINYL is lit. During playback, press the top of the jog wheel and turn — the track scratches under your hand like vinyl. Release the top and normal playback resumes from where you left off.',
      details:
        'Scratch is only available in Vinyl mode. The weight of the jog (next step) and the VINYL SPEED ADJ. settings tune how the wheel feels under your fingertips.',
      highlightControls: ['JOG_WHEEL'],
      panelStateChanges: {},
    },
    {
      id: 'step-4',
      title: 'Adjust the Jog Weight',
      instruction:
        'Turn the JOG ADJUST knob just above the jog wheel. Clockwise increases the rotational weight — the jog feels heavier and slower to spin. Counter-clockwise decreases the weight for a lighter, quicker response.',
      details:
        'A heavier jog suits long, controlled scratches; a lighter jog suits flick-style cuts and rapid pitch-bends. Find the weight your wrist prefers — there is no "right" setting.',
      highlightControls: ['JOG_ADJUST'],
      panelStateChanges: {
        JOG_WHEEL: { active: false },
        JOG_ADJUST: { active: true },
      },
    },
    {
      id: 'step-5',
      title: 'Open VINYL SPEED ADJ. Settings',
      instruction:
        'Press and hold MENU / UTILITY to open the UTILITY screen. Under DJ SETTING, select VINYL SPEED ADJUST and pick one of: TOUCH & RELEASE (default — both stopping and restarting curves are dialled by the knob), TOUCH (stop curve only), or RELEASE (restart curve only).',
      details:
        'TOUCH controls how quickly playback decelerates when you grab the jog top or press PLAY/PAUSE to stop. RELEASE controls how quickly it accelerates back to normal speed when you let go.',
      highlightControls: ['MENU_UTILITY'],
      panelStateChanges: {
        JOG_ADJUST: { active: false },
        MENU_UTILITY: { active: true },
      },
    },
    {
      id: 'step-6',
      title: 'Dial the Brake / Start Speed',
      instruction:
        'Turn the VINYL SPEED ADJ. TOUCH / BRAKE knob (front edge, left of the jog) to set the actual speed. Clockwise = faster (snappier brake / start); counter-clockwise = slower (longer, more vinyl-like brake).',
      details:
        'A slow brake combined with PLAY/PAUSE gives that classic "turning the power off" record-stop effect. A fast brake plus fast release feels more like a CDJ — pick the response that fits the track and the mix.',
      highlightControls: ['VINYL_SPEED_ADJ'],
      panelStateChanges: {
        MENU_UTILITY: { active: false },
        VINYL_SPEED_ADJ: { active: true },
      },
    },
    {
      id: 'step-7',
      title: 'Touch Cue — Preview in Headphones',
      instruction:
        'Connect a Touch Cue–compatible DJ mixer over PRO DJ LINK and plug headphones into the mixer. Press LINK CUE on the mixer, then touch the overall waveform on the CDJ during playback — that section plays in your headphones without affecting the main output.',
      details:
        'Keep touching the waveform to keep monitoring; lift to drop the preview. The enlarged waveform also re-targets to the touched point so you can both see and hear what is coming.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {
        VINYL_SPEED_ADJ: { active: false },
      },
    },
    {
      id: 'step-8',
      title: 'The Jog Wheel Is Yours',
      instruction:
        'You can switch modes, pitch-bend, scratch, tune the jog feel, and preview tracks before they touch the master. Next, the Cue Points tutorial uses these jog skills to fine-adjust where each cue lands.',
      details:
        'Slip Mode (later batch) layers on top of scratch and loop — every gesture here becomes a Slip gesture when SLIP is armed, so the muscle memory you build now pays off twice.',
      highlightControls: [],
      panelStateChanges: {
        JOG_MODE: { active: false },
        VINYL_CDJ_INDICATOR: { active: false, ledOn: false },
      },
    },
  ],
};

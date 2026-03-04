import { Tutorial } from '@/types/tutorial';

export const samplingBasics: Tutorial = {
  id: 'sampling-basics',
  deviceId: 'fantom-08',
  title: 'Sampling Basics — Record and Assign to Pad',
  description:
    'Learn the fundamentals of sampling on the Fantom 08: record an audio source, preview your sample, and assign it to a pad for instant playback.',
  category: 'sampling',
  difficulty: 'beginner',
  estimatedTime: '8 min',
  tags: ['sampling', 'pads', 'recording', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to Sampling',
      instruction:
        'The Fantom 08 has a built-in sampler that lets you record audio from a microphone, line input, or the internal sound engine, and then play it back from the keyboard or pads.',
      details:
        "In this tutorial, you'll learn how to access the Sampling screen, set your input source and gain, record a sample, and assign it to a pad for instant triggering.",
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Homecoming',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Open the Sampling Screen',
      instruction:
        'Press the Sampling button (in the Pad section) to open the Sampling Menu. Touch "To Pad" to open the Sampling Standby screen.',
      details:
        'The Sampling button opens the Sampling Menu with three destinations: To Pad (record to a pad), To Keyboard (record to the keyboard), and To Storage (record directly to USB). Touch "To Pad" to enter the Sampling Standby screen, which shows input parameters, a time counter, and a level meter.',
      highlightControls: ['sampling'],
      panelStateChanges: {
        sampling: { active: true },
      },
      displayState: {
        screenType: 'sampling',
        title: 'SAMPLING STANDBY',
        statusText: 'STANDBY',
        menuItems: [
          { label: 'Sampling Mode: MONO', selected: true },
          { label: 'Format: WAV 44.1kHz' },
          { label: 'AUDIO IN: ON' },
          { label: 'Click: OFF' },
        ],
        selectedIndex: 0,
      },
      tipText:
        'The Sampling button is located in the Pad section of the panel, near the 16 performance pads.',
    },
    {
      id: 'step-3',
      title: 'Configure Input Mode',
      instruction:
        'Turn the E1 knob to switch to IN mode. This lets you configure the audio input for recording from an external source.',
      details:
        'E1 toggles between TRIG mode (auto-trigger recording when input exceeds a threshold) and IN mode (manual recording with audio input configuration). In IN mode, the other E-knobs let you select input source and adjust recording level.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'sampling',
        title: 'SAMPLING STANDBY',
        statusText: 'STANDBY',
        menuItems: [
          { label: 'Sampling Mode: MONO' },
          { label: 'Format: WAV 44.1kHz' },
          { label: 'AUDIO IN: ON', selected: true },
          { label: 'Click: OFF' },
        ],
        selectedIndex: 2,
      },
      tipText:
        'If you do not have a mic, you can sample the internal sound engine by setting AUDIO IN to OFF and playing the keyboard while recording.',
    },
    {
      id: 'step-4',
      title: 'Select Input Source and Level',
      instruction:
        'Turn E2 to select your input source — choose MIC for a connected microphone or LINE for a line-level input. Turn E4 to adjust the recording level. Watch the level meter and aim for a strong signal that does not clip.',
      details:
        'In IN mode, E2 selects the input source (MIC or LINE), E3 toggles AUDIO IN on/off, and E4 adjusts the recording level. The level meter shows real-time input levels. Keep the signal in the yellow zone — too low and the sample will be noisy, too high and it will distort.',
      highlightControls: ['function-e2', 'function-e4'],
      panelStateChanges: {},
      displayState: {
        screenType: 'sampling',
        title: 'SAMPLING STANDBY',
        statusText: 'STANDBY',
        menuItems: [
          { label: 'Sampling Mode: MONO' },
          { label: 'Format: WAV 44.1kHz' },
          { label: 'AUDIO IN: ON' },
          { label: 'Input Gain: 75%', selected: true },
        ],
        selectedIndex: 3,
      },
      tipText:
        'Speak or play into the mic while adjusting E4. The meter responds in real time so you can dial in the right level before recording.',
    },
    {
      id: 'step-5',
      title: 'Start Recording',
      instruction:
        'Touch <START> on the display to begin recording. The screen changes to NOW SAMPLING and the time counter starts.',
      details:
        'Touching <START> immediately begins recording audio from your configured input. The time counter advances in real time. You can also use TRIG mode (E1) to enable auto-trigger, which starts recording automatically when the input level exceeds a threshold.',
      highlightControls: ['display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'sampling',
        title: 'NOW SAMPLING',
        statusText: 'NOW SAMPLING',
        menuItems: [
          { label: 'Sampling Mode: MONO' },
          { label: 'Format: WAV 44.1kHz' },
          { label: 'AUDIO IN: ON' },
          { label: 'Input Gain: 75%' },
        ],
        selectedIndex: 0,
      },
      tipText:
        'Enable AUTO TRIGGER via TRIG mode (E1) for hands-free recording — the Fantom starts recording automatically when it detects audio above the threshold.',
    },
    {
      id: 'step-6',
      title: 'Stop Recording',
      instruction:
        'When you have captured your audio, touch <STOP> on the display. The time counter stops and a preview dialog appears showing your recorded waveform.',
      details:
        'The Fantom can record up to several minutes depending on available sample memory. Touch <STOP> whenever you are done. The recorded audio is held in temporary memory until you accept or discard it in the preview dialog.',
      highlightControls: ['display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'sampling',
        title: 'SAMPLING COMPLETE',
        statusText: 'Recording stopped',
        menuItems: [
          { label: 'Time: 000:03:42' },
          { label: 'Format: WAV 44.1kHz' },
          { label: 'AUDIO IN: ON' },
          { label: 'Level: ||||||||' },
        ],
        selectedIndex: 0,
      },
      tipText:
        'Keep an eye on the level meter while recording. If it clips into the red, re-record with a lower level (E4).',
    },
    {
      id: 'step-7',
      title: 'Preview the Captured Sample',
      instruction:
        'After stopping, a "Use new sample?" dialog appears with a waveform preview. Press E1 (PREVIEW) to listen to your recording. Press E6 (OK) to accept the sample.',
      details:
        'The preview dialog shows the waveform of your recorded audio. Use PREVIEW to audition it. If you are not satisfied, press E4 (RETRY) to record again, or E5 (CANCEL) to discard. Pressing OK saves the sample and proceeds to pad assignment.',
      highlightControls: ['function-e1', 'function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'sampling',
        title: 'SAMPLING COMPLETE',
        statusText: 'Use new sample?',
        menuItems: [
          { label: '[E1] PREVIEW' },
          { label: '[E4] RETRY' },
          { label: '[E5] CANCEL' },
          { label: '[E6] OK', selected: true },
        ],
        selectedIndex: 3,
      },
      tipText:
        'Always preview your sample before accepting. You can retry as many times as needed to get a clean recording.',
    },
    {
      id: 'step-8',
      title: 'Assign Sample to a Pad',
      instruction:
        'The Sample Pad screen now shows the 4x4 pad grid. Your new sample has been assigned to Pad 1. Press Pad 1 to trigger and play back the sample.',
      details:
        'The Sample Pad screen displays all 16 pads in a grid. Each pad shows the name of its assigned sample and a level bar. You can assign samples to any empty pad. Pressing a pad triggers instant playback of its sample.',
      highlightControls: ['pad-1'],
      panelStateChanges: {
        stop: { active: false },
        sampling: { active: false },
        'pad-1': { active: true, ledOn: true, ledColor: '#00ff44' },
      },
      displayState: {
        screenType: 'sample-pad',
        title: 'SAMPLE PAD',
        menuItems: [
          { label: 'Pad 1: smpl0001', selected: true },
          { label: 'Pad 2: ---' },
          { label: 'Pad 3: ---' },
          { label: 'Pad 4: ---' },
        ],
        selectedIndex: 0,
      },
      tipText:
        'You can assign up to 16 samples across the pad bank. Each pad can hold a different sample for building drum kits or sound effects.',
    },
    {
      id: 'step-9',
      title: 'Sampling Complete!',
      instruction:
        'Press Exit to return to the home screen. Your sample is saved and ready to use. You can access it anytime from the Sampling button or by pressing the pad.',
      details:
        'Congratulations! You have recorded your first sample on the Fantom 08. From here, you can record more samples to fill out the pad bank, edit the sample waveform, or assign samples to the keyboard for melodic playback. Explore the SAMPLE PAD QUICK EDIT and WAVE EDIT screens to trim and fine-tune your samples.',
      highlightControls: ['exit'],
      panelStateChanges: {
        'pad-1': { active: false, ledOn: false },
        exit: { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Homecoming',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Sample saved to Pad 1',
      },
      tipText:
        'Your samples persist in the Fantom memory until you delete them. Use Write to save the scene if you want to keep pad assignments across power cycles.',
    },
  ],
};

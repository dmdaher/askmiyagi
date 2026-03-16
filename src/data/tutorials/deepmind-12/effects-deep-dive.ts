import { Tutorial } from '@/types/tutorial';

export const effectsDeepDive: Tutorial = {
  id: 'effects-deep-dive',
  deviceId: 'deepmind-12',
  title: 'Reverb, Delay & Chorus In-Depth',
  description:
    'Explore the most-used effects algorithms in detail. Learn the key parameters of the AmbVerb and Hall Rev reverbs, the stereo Delay with its Ping-Pong mode, and the Chorus and Flanger modulation effects. Includes how to use asterisked parameters as Mod Matrix destinations.',
  category: 'effects',
  difficulty: 'intermediate',
  estimatedTime: '12 min',
  tags: ['effects', 'reverb', 'delay', 'chorus', 'flanger', 'ping-pong', 'mod-matrix', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'AmbVerb — Ambient Reverb Deep Parameters',
      instruction:
        'Press FX and load AmbVerb into Slot 1. Press FX again to enter the FX-1 parameter page. The AmbVerb (Ambient Reverb) has 10 parameters. PreDelay (PD, 0–200 ms): the time before the reverb is heard after the source signal — increase it for a "far away" sense of distance. Decay (DCY, 0.2–7.3 s): how long the reverb tail rings. Size (SIZ, 2–100): the perceived size of the space. Damping (DMP, 1kHz–20kHz): attenuates high frequencies within the reverb tail — lower values make the tail warmer and darker. Diffusion (DIF, 1–30): controls the initial reflection density.',
      details:
        'AmbVerb is the most flexible general-purpose reverb on the DeepMind 12. Its 10 parameters include Mod (MOD, 0–100%), which modulates the reverb tail for a subtle animated shimmer, and TailGain (TGN, 0–100%), which adjusts the volume of the reverb tail independently of the Mix. LoCut (LC) and HiCut (HC) are low and high shelving filters on the wet reverb signal — roll off the low end to keep reverb from muddying bass sounds, and roll off the high end for a darker, more vintage quality. Parameters marked with * (Decay, Mix, LoCut, HiCut, TailGain) are modulation destinations in the Mod Matrix — you can automate them in real time.',
      highlightControls: ['prog-menu-fx', 'prog-bank-up', 'prog-bank-down', 'prog-rotary', 'display'],
      panelStateChanges: {
        'prog-menu-fx': { active: true },
        'prog-rotary': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'FX-1  AmbVerb',
        menuItems: [
          { label: 'PD    PreDelay     16.0ms' },
          { label: 'DCY   Decay         0.4 s' },
          { label: 'SIZ   Size            58' },
          { label: 'DMP   Damping       3.4kHz' },
          { label: 'DIF   Diffusion       86' },
          { label: 'MIX   Mix           100%' },
        ],
        selectedIndex: 1,
        statusText: 'Decay 0.4s',
      },
    },
    {
      id: 'step-2',
      title: 'Hall Rev — Hall Reverb with Stereo Spread',
      instruction:
        'Return to the FX OVERVIEW and change Slot 1 from AmbVerb to Hall Rev. Enter the FX-1 parameter page. Hall Rev models a large concert hall. Its key parameters beyond PreDelay, Decay, and Damping are: Spread (SPR, 0–50): emphasises the stereo width of the reverb; Shape (SHP, 0–250): adjusts the contour of the reverberation envelope — low values give a fast-building dense reverb, high values create a slower, more diffuse bloom; ModSpeed (MOD, 0–100): controls the rate of internal reverb tail modulation. Compare Hall Rev to AmbVerb: AmbVerb is smooth and ambient, Hall Rev has more audible early reflections and a more spacious, defined stereo image.',
      details:
        'The DeepMind 12 carries 13 reverb algorithms across four acoustic environments. The most versatile are: AmbVerb (smooth ambient diffusion), Room Rev (RoomRev — smaller, more reflective space with BassMult control), Hall Rev (large hall with stereo spread and shape control), Chamber Rev (ChamberRev — medium-sized chamber with spin modulation), Plate Rev (PlateRev — metallic plate reverb with crossover control), and Rich Plate (RichPltRev — dense stereo plate with Attack parameter). For quick preset-based reverb, TC-DeepVRB offers ten factory presets (Ambience, Church, Gate, Hall, Lo Fi, Modulated, Plate, Room, Spring, Tile) accessible via the PST parameter.',
      highlightControls: ['prog-menu-fx', 'prog-bank-up', 'prog-bank-down', 'prog-rotary', 'display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'FX-1  HallRev',
        menuItems: [
          { label: 'PD    PreDelay     20.0ms' },
          { label: 'DCY   Decay         0.9 s' },
          { label: 'SIZ   Size            82' },
          { label: 'DMP   Damping       3.4kHz' },
          { label: 'SPR   Spread          25' },
          { label: 'MIX   Mix           100%' },
        ],
        selectedIndex: 2,
        statusText: 'Size 82',
      },
    },
    {
      id: 'step-3',
      title: 'Delay — Stereo, Mono, Cross-Feed & Ping-Pong',
      instruction:
        'Load the Delay algorithm into Slot 2. Enter the FX-2 page. The Delay has 12 parameters. Time (TIM, 1–1500 ms): the master delay time for the left channel. The Time field also shows clock-division options (1/4, 3/8, 1/2, 2/3, 1, 5/3, 3/2, 2, 3) for sync to the master BPM. Mode (MOD): sets the feedback routing between channels. There are four modes: ST (Stereo — normal stereo feedback, independent L and R), X (Cross-feed — feedback crosses between channels, creating a wide stereo echo), M (Mono mix — both channels share the same feedback path), and P-P (Ping Pong — audio bounces left to right on each echo repeat). Try P-P first.',
      details:
        'In P-P (Ping Pong) mode, the FEED R (FBR) control is disabled because both channels share a single feedback path that alternates left-right. For Ping Pong, set Time to a musically relevant value (try 375ms for 80 BPM at dotted-eighth note), set FeedL to 50–60%, and MIX to 40–60%. In ST mode, FactorL (FCL) and FactorR (FCR) set the delay time for the right channel relative to the master Time (fractions: 1/4, 3/8, 1/2, 2/3, 1, 5/3, 3/2, 2, 3). Setting FactorR to 3/4 of FactorL creates a classic wide stereo delay. Offset (OFS, -100 to +100 ms) adds a fixed time difference between left and right for subtle stereo widening.',
      highlightControls: ['prog-menu-fx', 'prog-bank-up', 'prog-bank-down', 'prog-rotary', 'display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'FX-2  Delay',
        menuItems: [
          { label: 'MIX   Mix          100.0%' },
          { label: 'TIM   Time          375ms' },
          { label: 'MOD   Mode            P-P' },
          { label: 'FCL   FactorL         1/2' },
          { label: 'FCR   FactorR           1' },
          { label: 'FBL   FeedL          50.0%' },
        ],
        selectedIndex: 2,
        statusText: 'Mode P-P',
      },
    },
    {
      id: 'step-4',
      title: 'Delay — Tempo Sync & Filtering the Feedback',
      instruction:
        'Navigate to the Time (TIM) parameter in the Delay. Turn the rotary to the right past 1500ms and the display switches from milliseconds to clock divisions: the values cycle through 1/4, 3/8, 1/2, 2/3, 1, 5/3, 3/2, 2, and 3 (measured in bars at the master BPM). Select "1/4" for a quarter-note delay that locks to the ARP rate. Now navigate to FeedHC (FHC, 200 Hz–20 kHz): this is a high-cut filter in the feedback path — rolling it down to 4–6 kHz makes each echo repeat progressively darker, simulating the natural tape-echo decay that made vintage units so musical. FeedLC (FLC, 10–500 Hz) is the matching low-cut in the feedback path.',
      details:
        'Filtering the feedback path is one of the most powerful delay techniques. Without feedback filtering, repeated echoes are tonally identical to the original signal — clean but often sterile. Reducing FeedHC to 3–5 kHz creates natural "tape echo" character where each repeat loses high-frequency content. Raising FeedLC to 80–150 Hz removes bass accumulation in the feedback loop, preventing a low-end build-up at high feedback settings. The LC and HC parameters (without "Feed") filter the overall delay output, not the feedback path. Use LC to prevent delay from muddying bass frequencies and HC to brighten or darken the entire wet signal.',
      highlightControls: ['prog-menu-fx', 'prog-bank-up', 'prog-bank-down', 'prog-rotary', 'display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'FX-2  Delay',
        menuItems: [
          { label: 'MIX   Mix          100.0%' },
          { label: 'TIM   Time             1/4' },
          { label: 'MOD   Mode            P-P' },
          { label: 'FBL   FeedL          50.0%' },
          { label: 'FHC   FeedHC        5000Hz' },
          { label: 'FLC   FeedLC          20Hz' },
        ],
        selectedIndex: 1,
        statusText: 'Time 1/4',
      },
    },
    {
      id: 'step-5',
      title: 'Chorus — Width, Wave & Spread',
      instruction:
        'Load Chorus into Slot 3. Enter the FX-3 page. Chorus (Stereo Chorus) has 11 parameters. Speed (SPD, 0–5 Hz): the LFO rate of the modulation — slow speeds (0.2–0.5 Hz) give a gentle ensemble sound; faster speeds (1–3 Hz) produce vibrato. WidthL and WidthR (WDL/WDR, 0–100%): the modulation depth for the left and right channels. DelayL and DelayR (DLL/DLR, 0.5–50 ms): the total delay time added to each channel. Wave (WAV, 0–100%): blends the digital triangular chorus waveform (0%) with the classic analogue sine wave (100%) — the sine wave gives a more organic, less mechanical sound. Spread (SPR, 0–100%): mixes left channel into right and vice versa for stereo width.',
      details:
        'A subtle chorus is one of the most useful effects for synthesizer pads and strings: set SPD to 0.3 Hz, WidthL/R to 30%, and MIX to 50% for a gentle ensemble thickening that does not obviously modulate. For a more dramatic chorus, increase WidthL/R to 80% and MIX to 70%. The Phase (PHS) parameter offsets the LFO phase between left and right channels — setting it to 90° creates the widest stereo image. LoCut (LC) and HiCut (HC) filter the chorus signal to prevent low-end muddiness. Speed is a mod matrix destination (marked *), so you can modulate the chorus rate with an LFO for evolving textures.',
      highlightControls: ['prog-menu-fx', 'prog-bank-up', 'prog-bank-down', 'prog-rotary', 'display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'FX-3  Chorus',
        menuItems: [
          { label: 'SPD   Speed          0.3Hz' },
          { label: 'WDL   WidthL          30.0%' },
          { label: 'WDR   WidthR          30.0%' },
          { label: 'DLL   DelayL          7.9ms' },
          { label: 'DLR   DelayR          6.5ms' },
          { label: 'MIX   Mix            50.0%' },
        ],
        selectedIndex: 0,
        statusText: 'Speed 0.3Hz',
      },
    },
    {
      id: 'step-6',
      title: 'Flanger — Comb Filter with Feedback',
      instruction:
        'Change Slot 3 from Chorus to Flanger. The Flanger (Stereo Flanger) has nearly identical parameters to Chorus, but adds a Feedback (FD, -90% to +90%) parameter that is absent in Chorus. Feedback controls positive or negative feedback in the comb-filter circuit. At 0% the Flanger sounds like a wide chorus. Increase FD to +50%: the metallic, resonant "jet plane" flange sound emerges. Set FD to -50%: the phase is inverted, creating a hollow, "notch" quality. FeedLC (FLC) and FeedHC (FHC) band-limit the feedback path — reducing FeedHC softens the metallic resonance for a smoother flange character. Feedback is the defining difference between a Chorus and a Flanger.',
      details:
        'Flanger was originally created by playing two identical tape recordings simultaneously and pressing gently on the flange (edge) of one reel to slow it down, creating a phase-shifting comb effect as the tapes drifted in and out of sync. The DeepMind 12\'s Flanger models this by modulating very short delay times (0.5–20 ms) and feeding the output back into the input. The Phase (PHS) parameter sets the LFO phase difference between left and right channels — at 180° the flanging on the left channel is at its peak exactly when the right channel is at its trough, creating a dramatic stereo sweep. The Flanger\'s Speed (SPD) is a mod matrix destination, enabling tempo-synced or envelope-controlled flange sweeps.',
      highlightControls: ['prog-menu-fx', 'prog-bank-up', 'prog-bank-down', 'prog-rotary', 'display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'FX-3  Flanger',
        menuItems: [
          { label: 'SPD   Speed          0.5Hz' },
          { label: 'WDL   WidthL          75.0%' },
          { label: 'WDR   WidthR          75.0%' },
          { label: 'PHS   Phase           125' },
          { label: 'FD    Feed            55.0%' },
          { label: 'MIX   Mix           100.0%' },
        ],
        selectedIndex: 4,
        statusText: 'Feed 55.0%',
      },
    },
    {
      id: 'step-7',
      title: 'Mod Matrix Destinations — Live FX Automation',
      instruction:
        'Many effect parameters are available as Mod Matrix destinations — these are marked with an asterisk (*) in Chapter 9 of the manual. Press PROG switch to exit the FX menu. Press the MOD switch to open the Mod Matrix. Set Source 1 to LFO1, Depth to +64, and use the EDIT switch to navigate the destination list to an effects parameter such as "FX1 Decay" (AmbVerb Decay) or "FX2 Mix" (Delay Mix). Now move LFO 1 RATE fader and hear the reverb decay or delay wet level pulse in time with the LFO. This connects the analogue modulation engine directly to the digital FX rack.',
      details:
        'Every effect parameter with an asterisk (*) in the Chapter 9 parameter tables is a mod matrix destination. Examples include: AmbVerb Decay* (FX1 Decay), AmbVerb Mix* (FX1 Mix), Delay Mix* (FX2 Mix), Chorus Speed* (FX3 Speed), Flanger Feed (there is no asterisk on FD itself but Speed* is available), RotarySpkr LoSpeed* and HiSpeed*, Phaser Speed*, Midas EQ LoShelfGain*. Routing an envelope or LFO to the reverb decay creates a dynamic reverb that shortens on percussive sounds and blooms on sustained ones. Routing velocity to the delay Mix makes echoes appear only when you play loudly. The possibilities are vast — over 22,880 modulation combinations as stated in the manual.',
      highlightControls: ['prog-menu-mod', 'prog-rotary', 'prog-nav-yes', 'prog-nav-no', 'lfo1-rate', 'display'],
      panelStateChanges: {
        'prog-menu-fx': { active: false },
        'prog-menu-mod': { active: true },
        'lfo1-rate': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'MOD MATRIX',
        menuItems: [
          { label: 'BUS 1: LFO1  > FX1 Decay' },
          { label: 'DEPTH: +64' },
          { label: 'BUS 2: Off' },
          { label: 'BUS 3: Off' },
        ],
        selectedIndex: 0,
        statusText: 'LFO1 -> FX1 Decay',
      },
      tipText:
        'Tip: Route the Mod Envelope to the Delay Mix (FX2 Mix*) with a fast attack and slow decay. When you strike a key hard the delay mix swells in behind the note, then fades — creating a dramatic, responsive echo effect that reacts to your playing dynamics.',
    },
  ],
};

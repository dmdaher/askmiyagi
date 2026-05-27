import { Tutorial } from '@/types/tutorial';

export const tagListAndOrganization: Tutorial = {
  id: 'tag-list-and-organization',
  deviceId: 'cdj-3000',
  title: 'Tag List & Track Organization',
  description:
    'Tag candidate tracks with TAG TRACK / REMOVE, review them in the TAG LIST, convert the list into a real playlist, set a History name, and pull the master player BPM / key into a filter — all without leaving the deck.',
  category: 'browsing',
  difficulty: 'intermediate',
  estimatedTime: '6 min',
  tags: [
    'tag-list',
    'tag-track',
    'create-playlist',
    'history',
    'history-name',
    'master-player',
    'organization',
    'intermediate',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Tag a Track from Browse',
      instruction:
        'In the BROWSE, PLAYLIST, or SEARCH screen, highlight a track with the rotary selector. Press TAG TRACK / REMOVE — a check mark appears beside the track to confirm it is now in the Tag List. Keep highlighting and pressing as you build a candidate set for the next 20 minutes of your performance.',
      details:
        'One Tag List is kept per storage device (SD or USB). Up to 100 tracks fit in a single list, and a track can only be tagged once. The list is visible from any CDJ on the same PRO DJ LINK network.',
      highlightControls: ['ROTARY_SELECTOR', 'TAG_TRACK_REMOVE'],
      panelStateChanges: {
        ROTARY_SELECTOR: { active: true },
        TAG_TRACK_REMOVE: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Tag the Loaded Track from the Waveform Screen',
      instruction:
        'You do not have to be in a list view to tag. While the Waveform screen is showing the currently loaded track, press TAG TRACK / REMOVE — the loaded track is added to the Tag List. Press it again to remove that same track.',
      details:
        'This is the fastest way to bookmark a track that is already working in the set: hear it, tag it, move on. The tag-on-Waveform-screen toggle removes the track without needing to navigate back to a browse list.',
      highlightControls: ['TOUCH_DISPLAY', 'TAG_TRACK_REMOVE'],
      panelStateChanges: {},
    },
    {
      id: 'step-3',
      title: 'Open the Tag List',
      instruction:
        'Press the TAG LIST button. The TAG LIST screen replaces the browse view and shows every track you have tagged. Use the rotary selector to highlight a candidate; press the rotary to load it, exactly like any browse list.',
      details:
        'TAG LIST is its own screen, distinct from BROWSE. SEARCH and TRACK FILTER are intentionally unavailable here — the list is meant to be small enough to scan with your eyes.',
      highlightControls: ['TAG_LIST'],
      panelStateChanges: {
        TAG_TRACK_REMOVE: { active: false },
        TAG_LIST: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Remove or Clear the Tag List',
      instruction:
        'On the TAG LIST screen, highlight a track and press-and-HOLD TAG TRACK / REMOVE to delete that one entry. To wipe the entire list, press MENU / UTILITY to open the TAG LIST MENU, then select REMOVE ALL TRACKS.',
      details:
        'Removing a track that is currently playing does not stop playback — the deck finishes the current track and simply will not auto-advance to it. Use REMOVE ALL TRACKS at the start of a new set to reset the workspace.',
      highlightControls: ['TAG_TRACK_REMOVE', 'MENU_UTILITY'],
      panelStateChanges: {
        TAG_LIST: { active: false },
        MENU_UTILITY: { active: true },
      },
    },
    {
      id: 'step-5',
      title: 'Convert the Tag List into a Playlist',
      instruction:
        'On the TAG LIST screen, press MENU / UTILITY to open the TAG LIST MENU and select CREATE PLAYLIST. The Tag List is saved as a permanent playlist named TAG LIST XXX in the PLAYLIST category on the storage device.',
      details:
        'Only tracks managed by rekordbox are converted — folder-only tracks are skipped. The rekordbox library must be present on the device for CREATE PLAYLIST to be available. The original Tag List is left in place.',
      highlightControls: ['MENU_UTILITY', 'PLAYLIST'],
      panelStateChanges: {
        MENU_UTILITY: { active: false },
        PLAYLIST: { active: true },
      },
    },
    {
      id: 'step-6',
      title: 'Recall Recently Played from History',
      instruction:
        'Any track that plays for about a minute is written to History on the source device. Open BROWSE, scroll to the HISTORY category, and press the rotary selector to view every track you have played from that storage device.',
      details:
        'You can rename the active History under UTILITY → SYSTEM → HISTORY NAME (up to 32 characters) — useful for separating sets by date or venue. Tracks already in History show green in the PLAYLIST category so you can spot what you have already played.',
      highlightControls: ['BROWSE_BTN', 'ROTARY_SELECTOR'],
      panelStateChanges: {
        PLAYLIST: { active: false },
        BROWSE_BTN: { active: true },
      },
    },
    {
      id: 'step-7',
      title: 'Pull MASTER PLAYER BPM & Key into a Filter',
      instruction:
        'Press and hold TRACK FILTER / EDIT to open the editing screen, then touch MASTER PLAYER at the top of the BPM / KEY tab. The currently playing deck\'s BPM and key are pulled into the filter conditions. Touch out and press TRACK FILTER / EDIT to apply — the browse list now shows only matching tracks.',
      details:
        'Use this whenever you want the next track to sit in the same tempo and key family as the deck currently dropping. Combine MASTER PLAYER with a Tag List for laser-focused candidates.',
      highlightControls: ['TRACK_FILTER_EDIT', 'TOUCH_DISPLAY'],
      panelStateChanges: {
        BROWSE_BTN: { active: false },
        TRACK_FILTER_EDIT: { active: true },
      },
    },
    {
      id: 'step-8',
      title: 'You Can Curate on the Fly',
      instruction:
        'Tag List, History, and MASTER PLAYER filtering together replace the need to pre-build every playlist in advance. You can now react to the room, tag what works, save it as a playlist, and pull harmonic matches without leaving the deck.',
      details:
        'This closes the browsing branch (T19 → T20). Next batches dive into Loops, Hot Cues, Beat Sync, and Slip Mode — the performance techniques that ride on top of the organisation you just learned.',
      highlightControls: [],
      panelStateChanges: {
        TRACK_FILTER_EDIT: { active: false },
        ROTARY_SELECTOR: { active: false },
      },
    },
  ],
};

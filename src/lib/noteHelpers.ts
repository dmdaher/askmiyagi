import { MIDI_NOTE_NAMES } from './constants';
import { NoteInfo } from '@/types/keyboard';

export function midiNoteToName(note: number): string {
  const name = MIDI_NOTE_NAMES[note % 12];
  const octave = Math.floor(note / 12) - 1;
  return `${name}${octave}`;
}

export function nameToMidiNote(name: string): number {
  const match = name.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return -1;
  const noteName = match[1];
  const octave = parseInt(match[2]);
  const noteIndex = MIDI_NOTE_NAMES.indexOf(noteName as typeof MIDI_NOTE_NAMES[number]);
  if (noteIndex === -1) return -1;
  return (octave + 1) * 12 + noteIndex;
}

export function isBlackKey(note: number): boolean {
  const n = note % 12;
  return [1, 3, 6, 8, 10].includes(n);
}

export function generateKeyboardNotes(lowestNote = 21, highestNote = 108): NoteInfo[] {
  const notes: NoteInfo[] = [];
  for (let midi = lowestNote; midi <= highestNote; midi++) {
    notes.push({
      midiNote: midi,
      name: MIDI_NOTE_NAMES[midi % 12],
      octave: Math.floor(midi / 12) - 1,
      isBlack: isBlackKey(midi),
    });
  }
  return notes;
}

export function noteInZone(note: number, lowNote: number, highNote: number): boolean {
  return note >= lowNote && note <= highNote;
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToNoteName(midiNote: number): string {
  const clamped = Math.max(0, Math.min(127, Math.round(midiNote)));
  const note = NOTE_NAMES[clamped % 12];
  const octave = Math.floor(clamped / 12) - 1;
  return `${note}${octave}`;
}

export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60;
  const noteIndex = NOTE_NAMES.indexOf(match[1]);
  if (noteIndex === -1) return 60;
  const octave = parseInt(match[2], 10);
  return (octave + 1) * 12 + noteIndex;
}

export const SCALES: Record<string, number[]> = {
  Chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  PentatonicMinor: [0, 3, 5, 7, 10],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

export function quantizeToScale(midiNote: number, scaleName: string = 'Minor', rootNote: number = 0): number {
  const scale = SCALES[scaleName] || SCALES.Minor;
  const octave = Math.floor(midiNote / 12);
  const noteInOctave = (midiNote % 12 - rootNote + 12) % 12;

  // Find nearest note in scale
  let closest = scale[0];
  let minDiff = Math.abs(noteInOctave - closest);

  for (const degree of scale) {
    const diff = Math.abs(noteInOctave - degree);
    if (diff < minDiff) {
      minDiff = diff;
      closest = degree;
    }
  }

  return octave * 12 + ((closest + rootNote) % 12);
}

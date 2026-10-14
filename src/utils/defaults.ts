import { TrackData } from '../types/sequencer';

export function createDefaultTracks(): TrackData[] {
  return [
    {
      id: 0,
      name: '808 Kick',
      type: 'drum',
      colorHex: '#ff3344',
      colorDimHex: '#3a1117',
      paletteIndex: 5, // Red in Novation standard palette
      defaultPitch: 36, // C1
      length: 16,
      mute: false,
      solo: false,
      channel: 9, // Standard MIDI Channel 10 (0-indexed = 9)
      euclideanHits: 4,
      euclideanRotation: 0,
      steps: [
        { active: true, pitch: 36, velocity: 120, gate: 0.8, probability: 1.0 },
        { active: false, pitch: 36, velocity: 90, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 36, velocity: 90, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 36, velocity: 90, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 36, velocity: 110, gate: 0.8, probability: 1.0 },
        { active: false, pitch: 36, velocity: 90, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 36, velocity: 90, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 36, velocity: 95, gate: 0.5, probability: 0.8 },
        { active: true, pitch: 36, velocity: 118, gate: 0.8, probability: 1.0 },
        { active: false, pitch: 36, velocity: 90, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 36, velocity: 90, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 36, velocity: 90, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 36, velocity: 112, gate: 0.8, probability: 1.0 },
        { active: false, pitch: 36, velocity: 90, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 36, velocity: 90, gate: 0.5, probability: 0.9 },
        { active: false, pitch: 36, velocity: 90, gate: 0.5, probability: 1.0 },
      ],
    },
    {
      id: 1,
      name: 'Snare Drum',
      type: 'drum',
      colorHex: '#ff9100',
      colorDimHex: '#3a2307',
      paletteIndex: 9, // Amber
      defaultPitch: 38, // D1
      length: 16,
      mute: false,
      solo: false,
      channel: 9,
      euclideanHits: 2,
      euclideanRotation: 4,
      steps: [
        { active: false, pitch: 38, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 38, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 38, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 38, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 38, velocity: 115, gate: 0.6, probability: 1.0 },
        { active: false, pitch: 38, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 38, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 38, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 38, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 38, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 38, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 38, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 38, velocity: 120, gate: 0.6, probability: 1.0 },
        { active: false, pitch: 38, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 38, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 38, velocity: 70, gate: 0.3, probability: 0.5 },
      ],
    },
    {
      id: 2,
      name: 'Closed Hat',
      type: 'drum',
      colorHex: '#ffd000',
      colorDimHex: '#383009',
      paletteIndex: 13, // Yellow
      defaultPitch: 42, // F#1
      length: 16,
      mute: false,
      solo: false,
      channel: 9,
      euclideanHits: 8,
      euclideanRotation: 0,
      steps: [
        { active: true, pitch: 42, velocity: 100, gate: 0.3, probability: 1.0 },
        { active: false, pitch: 42, velocity: 70, gate: 0.3, probability: 1.0 },
        { active: true, pitch: 42, velocity: 90, gate: 0.3, probability: 1.0 },
        { active: false, pitch: 42, velocity: 70, gate: 0.3, probability: 1.0 },
        { active: true, pitch: 42, velocity: 105, gate: 0.3, probability: 1.0 },
        { active: false, pitch: 42, velocity: 70, gate: 0.3, probability: 1.0 },
        { active: true, pitch: 42, velocity: 90, gate: 0.3, probability: 1.0 },
        { active: false, pitch: 42, velocity: 70, gate: 0.3, probability: 1.0 },
        { active: true, pitch: 42, velocity: 100, gate: 0.3, probability: 1.0 },
        { active: false, pitch: 42, velocity: 70, gate: 0.3, probability: 1.0 },
        { active: true, pitch: 42, velocity: 90, gate: 0.3, probability: 1.0 },
        { active: false, pitch: 42, velocity: 70, gate: 0.3, probability: 1.0 },
        { active: true, pitch: 42, velocity: 105, gate: 0.3, probability: 1.0 },
        { active: false, pitch: 42, velocity: 70, gate: 0.3, probability: 1.0 },
        { active: true, pitch: 42, velocity: 95, gate: 0.3, probability: 1.0 },
        { active: true, pitch: 42, velocity: 85, gate: 0.3, probability: 0.8 },
      ],
    },
    {
      id: 3,
      name: 'Open Hat',
      type: 'drum',
      colorHex: '#76ff03',
      colorDimHex: '#1e3806',
      paletteIndex: 17, // Lime
      defaultPitch: 46, // A#1
      length: 16,
      mute: false,
      solo: false,
      channel: 9,
      euclideanHits: 4,
      euclideanRotation: 2,
      steps: [
        { active: false, pitch: 46, velocity: 90, gate: 0.7, probability: 1.0 },
        { active: false, pitch: 46, velocity: 90, gate: 0.7, probability: 1.0 },
        { active: true, pitch: 46, velocity: 95, gate: 0.8, probability: 1.0 },
        { active: false, pitch: 46, velocity: 90, gate: 0.7, probability: 1.0 },
        { active: false, pitch: 46, velocity: 90, gate: 0.7, probability: 1.0 },
        { active: false, pitch: 46, velocity: 90, gate: 0.7, probability: 1.0 },
        { active: true, pitch: 46, velocity: 95, gate: 0.8, probability: 1.0 },
        { active: false, pitch: 46, velocity: 90, gate: 0.7, probability: 1.0 },
        { active: false, pitch: 46, velocity: 90, gate: 0.7, probability: 1.0 },
        { active: false, pitch: 46, velocity: 90, gate: 0.7, probability: 1.0 },
        { active: true, pitch: 46, velocity: 95, gate: 0.8, probability: 1.0 },
        { active: false, pitch: 46, velocity: 90, gate: 0.7, probability: 1.0 },
        { active: false, pitch: 46, velocity: 90, gate: 0.7, probability: 1.0 },
        { active: false, pitch: 46, velocity: 90, gate: 0.7, probability: 1.0 },
        { active: true, pitch: 46, velocity: 95, gate: 0.8, probability: 1.0 },
        { active: false, pitch: 46, velocity: 90, gate: 0.7, probability: 1.0 },
      ],
    },
    {
      id: 4,
      name: 'Clap / Perc',
      type: 'drum',
      colorHex: '#00e676',
      colorDimHex: '#09361e',
      paletteIndex: 21, // Green
      defaultPitch: 39, // D#1
      length: 16,
      mute: false,
      solo: false,
      channel: 9,
      euclideanHits: 3,
      euclideanRotation: 4,
      steps: [
        { active: false, pitch: 39, velocity: 95, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 39, velocity: 95, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 39, velocity: 95, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 39, velocity: 95, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 39, velocity: 105, gate: 0.6, probability: 1.0 },
        { active: false, pitch: 39, velocity: 95, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 39, velocity: 95, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 39, velocity: 95, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 39, velocity: 95, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 39, velocity: 95, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 39, velocity: 95, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 39, velocity: 90, gate: 0.4, probability: 0.7 },
        { active: true, pitch: 39, velocity: 110, gate: 0.6, probability: 1.0 },
        { active: false, pitch: 39, velocity: 95, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 39, velocity: 95, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 39, velocity: 95, gate: 0.5, probability: 1.0 },
      ],
    },
    {
      id: 5,
      name: 'Acid Bass',
      type: 'bass',
      colorHex: '#00e5ff',
      colorDimHex: '#073238',
      paletteIndex: 37, // Cyan
      defaultPitch: 36, // C2
      length: 16,
      mute: false,
      solo: false,
      channel: 0, // MIDI Channel 1
      euclideanHits: 7,
      euclideanRotation: 1,
      steps: [
        { active: true, pitch: 36, velocity: 115, gate: 0.7, probability: 1.0 }, // C2
        { active: false, pitch: 36, velocity: 85, gate: 0.4, probability: 1.0 },
        { active: true, pitch: 36, velocity: 95, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 39, velocity: 100, gate: 0.6, probability: 1.0 }, // D#2
        { active: false, pitch: 36, velocity: 85, gate: 0.4, probability: 1.0 },
        { active: true, pitch: 41, velocity: 105, gate: 0.6, probability: 1.0 }, // F2
        { active: false, pitch: 36, velocity: 85, gate: 0.4, probability: 1.0 },
        { active: true, pitch: 43, velocity: 110, gate: 0.5, probability: 0.8 }, // G2
        { active: true, pitch: 36, velocity: 115, gate: 0.7, probability: 1.0 }, // C2
        { active: false, pitch: 36, velocity: 85, gate: 0.4, probability: 1.0 },
        { active: true, pitch: 36, velocity: 90, gate: 0.4, probability: 1.0 },
        { active: true, pitch: 46, velocity: 100, gate: 0.6, probability: 1.0 }, // A#2
        { active: false, pitch: 36, velocity: 85, gate: 0.4, probability: 1.0 },
        { active: true, pitch: 48, velocity: 120, gate: 0.8, probability: 1.0 }, // C3 Accent
        { active: false, pitch: 36, velocity: 85, gate: 0.4, probability: 1.0 },
        { active: true, pitch: 43, velocity: 90, gate: 0.5, probability: 0.8 }, // G2
      ],
    },
    {
      id: 6,
      name: 'Synth Lead',
      type: 'lead',
      colorHex: '#2979ff',
      colorDimHex: '#0c1f44',
      paletteIndex: 45, // Blue
      defaultPitch: 60, // C4
      length: 16,
      mute: false,
      solo: false,
      channel: 1, // MIDI Channel 2
      euclideanHits: 5,
      euclideanRotation: 2,
      steps: [
        { active: true, pitch: 60, velocity: 100, gate: 0.5, probability: 1.0 }, // C4
        { active: false, pitch: 60, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 60, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 63, velocity: 105, gate: 0.6, probability: 1.0 }, // D#4
        { active: false, pitch: 60, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 60, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 67, velocity: 110, gate: 0.8, probability: 1.0 }, // G4
        { active: false, pitch: 60, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 60, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 65, velocity: 95, gate: 0.4, probability: 1.0 },  // F4
        { active: false, pitch: 60, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: false, pitch: 60, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 63, velocity: 100, gate: 0.6, probability: 1.0 }, // D#4
        { active: false, pitch: 60, velocity: 80, gate: 0.5, probability: 1.0 },
        { active: true, pitch: 58, velocity: 90, gate: 0.5, probability: 0.75 }, // A#3
        { active: false, pitch: 60, velocity: 80, gate: 0.5, probability: 1.0 },
      ],
    },
    {
      id: 7,
      name: 'Chord Stab',
      type: 'chord',
      colorHex: '#d500f9',
      colorDimHex: '#350a3d',
      paletteIndex: 49, // Purple/Magenta
      defaultPitch: 63, // D#4 (Cm7 root)
      length: 16,
      mute: false,
      solo: false,
      channel: 2, // MIDI Channel 3
      euclideanHits: 3,
      euclideanRotation: 3,
      steps: [
        { active: false, pitch: 63, velocity: 85, gate: 0.6, probability: 1.0 },
        { active: false, pitch: 63, velocity: 85, gate: 0.6, probability: 1.0 },
        { active: true, pitch: 60, velocity: 105, gate: 0.8, probability: 1.0 }, // Cm
        { active: false, pitch: 63, velocity: 85, gate: 0.6, probability: 1.0 },
        { active: false, pitch: 63, velocity: 85, gate: 0.6, probability: 1.0 },
        { active: false, pitch: 63, velocity: 85, gate: 0.6, probability: 1.0 },
        { active: false, pitch: 63, velocity: 85, gate: 0.6, probability: 1.0 },
        { active: true, pitch: 63, velocity: 100, gate: 0.6, probability: 0.9 }, // Eb
        { active: false, pitch: 63, velocity: 85, gate: 0.6, probability: 1.0 },
        { active: false, pitch: 63, velocity: 85, gate: 0.6, probability: 1.0 },
        { active: true, pitch: 58, velocity: 110, gate: 0.8, probability: 1.0 }, // Bb
        { active: false, pitch: 63, velocity: 85, gate: 0.6, probability: 1.0 },
        { active: false, pitch: 63, velocity: 85, gate: 0.6, probability: 1.0 },
        { active: false, pitch: 63, velocity: 85, gate: 0.6, probability: 1.0 },
        { active: false, pitch: 63, velocity: 85, gate: 0.6, probability: 1.0 },
        { active: false, pitch: 63, velocity: 85, gate: 0.6, probability: 1.0 },
      ],
    },
  ];
}

export interface StepData {
  active: boolean;
  pitch: number;       // MIDI Note number 0-127
  velocity: number;    // 1-127
  gate: number;        // 0.1 to 1.0 (fraction of 16th note)
  probability: number; // 0.0 to 1.0 (trigger probability)
}

export type TrackType = 'drum' | 'bass' | 'lead' | 'chord';

export interface TrackData {
  id: number;
  name: string;
  type: TrackType;
  colorHex: string;       // Primary bright LED color
  colorDimHex: string;    // Idle/dim background color
  paletteIndex: number;   // Novation Launchpad X palette color byte
  defaultPitch: number;   // MIDI note default (e.g. 36 for kick)
  length: number;         // 1-16 (or up to 64 steps)
  mute: boolean;
  solo: boolean;
  channel: number;        // MIDI Channel 0-15 (1-16)
  steps: StepData[];
  // Euclidean parameters
  euclideanHits: number;
  euclideanRotation: number;
}

export type InactivePadStyle = 'off' | 'faded';

export type ViewMode = 'multitrack' | 'singletrack' | 'euclidean';

export interface LinkState {
  enabled: boolean;
  peers: number;
  quantum: number;
  tempo: number;
  phase: number;        // 0.0 to 4.0
  startStopSync: boolean;
}

export interface SequencerState {
  bpm: number;
  swing: number;          // 0 to 50%
  running: boolean;
  currentStep: number;    // Current global step (0-15)
  activeTrackId: number;  // Currently selected track for inspection (0-7)
  selectedStepIdx: number | null; // Currently inspected step
  activePage: number;     // 0 = steps 0-7, 1 = steps 8-15
  viewMode: ViewMode;
  tracks: TrackData[];
  link: LinkState;
}

export interface MidiDeviceOption {
  id: string;
  name: string;
  manufacturer?: string;
}

export interface PiConfigFile {
  version: string;
  bpm: number;
  tracks: {
    id: number;
    name: string;
    channel: number;
    default_pitch: number;
    length: number;
    mute: boolean;
    steps: {
      active: boolean;
      pitch: number;
      velocity: number;
      gate: number;
      probability: number;
    }[];
  }[];
}

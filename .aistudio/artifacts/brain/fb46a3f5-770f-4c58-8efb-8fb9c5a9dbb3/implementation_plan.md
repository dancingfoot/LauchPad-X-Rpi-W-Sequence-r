# Novation Launchpad X MIDI Sequencer & Web Management Interface

An authentic, hardware-faithful Web UI and embedded management console for the Novation Launchpad X and Raspberry Pi Zero W step sequencer, featuring real-time pad illumination, polyphonic Web Audio playback, hardware Web MIDI routing, and modular sequencing engines.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions have been synthesized from your answers and embedded specifications:

- **Confirmed Decision 1 (Audio & MIDI Engine)**: Built-in multi-voice Web Audio synthesizer (8 distinct drum & synth sound engines) coupled with bidirectional Web MIDI API output, enabling immediate in-browser audible playback while routing real-time MIDI to physical hardware or host DAWs.
- **Confirmed Decision 2 (Primary Sequencing Workflow)**: 8-track polyphonic step sequencer with per-step pitch, velocity, gate length, probability, and loop lengths as the primary interface, while modularly architecting 64-step single-track melodic view, session clip launcher, and Euclidean rhythm generators.
- **Confirmed Decision 3 (Aesthetic Direction)**: Authentic Novation Launchpad X industrial design—matte obsidian chassis, beveled silicone frosted pads with true-to-life RGB LED glow, top rounded pill function buttons, circular scene launch buttons, and high-contrast hardware HUD.
- **Confirmed Decision 4 (Remote Config & Embedded Bridge)**: Full JSON configuration export/import compatible with the Raspberry Pi Zero W `engine.py` daemon, plus mock/live WebSocket status monitoring.

---

## 1. Overview & Core Concept

- **What It Does**: Provides an interactive browser-based digital twin and configuration workstation for the Raspberry Pi Zero W + Novation Launchpad X MIDI Sequencer. Users can compose, trigger, and parameter-tune 8-track patterns directly on the virtual 8x8 silicone pad grid, audition sounds through an internal synthesizer, output MIDI notes via Web MIDI, and deploy patterns to the Raspberry Pi Zero W.
- **Target Audience / Persona**: Hardware electronic musicians, modular synth enthusiasts, and embedded audio hackers seeking a low-latency, stand-alone, tactile MIDI sequencer with effortless visual configuration.
- **Key Value**: Eliminates headless Raspberry Pi friction by marrying the tactile Launchpad X hardware experience with a responsive, browser-accessible visual studio that needs no external DAW to audition or configure.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Zero-State to Playback**:
   - The user loads the application into an authentic Launchpad X console with default preset patterns (Kick, Snare, Hi-Hats, Bass, Lead, Chords).
   - Pressing the **Play/Stop** button (or Launchpad X Record CC 98) starts the high-precision 16th-note clock.
   - An active playhead sweeps across columns 1–8 with white/pulsing highlight, triggering audible Web Audio synthesis and flashing LEDs in sync.
2. **Step Editing & Tactile Sequencing**:
   - Clicking any pad toggles its active state; active steps glow in that track's designated signature color (Red for Kick, Amber for Snare, Cyan for Bass, etc.).
   - Clicking a step opens the **Step Inspector drawer** to fine-tune MIDI Pitch, Velocity (1–127), Gate Length (10%–100%), and Trigger Probability (10%–100%).
3. **Hardware & Mode Navigation**:
   - **Session / Grid Mode (CC 95)**: 8-track overview across 8 or 16 steps using Scene buttons 1–2 for page flipping.
   - **Note / Pitch Mode (CC 96)**: Chromatic and in-scale keyboard view mapped over the 8x8 grid for melodic input.
   - **Euclidean / Generative Mode (CC 97)**: Algorithmic Euclidean rhythm generator (hits over steps) with rotation sliders.
   - **Web MIDI Connect**: One-click pairing with physical USB Launchpad X and system MIDI ports.
4. **Pattern & Pi Zero W Management**:
   - Save/Load patterns to browser local storage.
   - "Download Pi Config" downloads a `patterns.json` file structured for direct consumption by the Pi Zero W `engine.py` script.

### Visual Identity & Theme

- **Aesthetic Direction**: Authentic Novation Launchpad X industrial chassis. Dark matte polyurethane body (`#121316`), raised beveled perimeter bezel (`#0b0c0e`), recessed silicone pad wells, and diffused RGB backlight illumination.
- **Color Palette & Mood**:
  - Canvas / Background: Deep studio slate `#08090b` with subtle acoustic workbench texture.
  - Chassis Surface: Precision dark composite `#141519` with soft inner shadow.
  - Inactive Pads: Frosted smoked silicone `#21242c` with tactile drop shadows.
  - Active LED Colors (matching Novation palette indexes):
    - Track 1 (Kick): `#ff2233` (Red)
    - Track 2 (Snare): `#ff8800` (Amber)
    - Track 3 (Closed Hat): `#ffd000` (Yellow)
    - Track 4 (Open Hat): `#aaff00` (Lime)
    - Track 5 (Clap/Perc): `#00e676` (Green)
    - Track 6 (Bass): `#00e5ff` (Cyan)
    - Track 7 (Lead): `#2979ff` (Electric Blue)
    - Track 8 (Chords): `#d500f9` (Magenta/Purple)
    - Playhead Scanner: `#ffffff` with high-intensity halo.
- **Typography & Hierarchy**:
  - Display / Wordmark: `Plus Jakarta Sans`, 700 weight, crisp tracking.
  - HUD / Metrics / Clock: `JetBrains Mono` or tabular monospace figures (`font-mono tabular-nums`).
  - Micro-Labels & Pad Numbers: 10px uppercase tactile silk-screen gray `#6b7280`.
- **Zero-Pill Restraint**: Metadata (tempo, current bar, active voices, MIDI status) rendered cleanly with typographic separators (`·` and `/`), avoiding decorative capsule chips.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Audio Path (Web Audio + Web MIDI)**
  - *Chosen Approach*: Implement a zero-dependency Web Audio polyphonic synthesizer (synthesized kick drum, noise-burst snare, dual-band hi-hats, Moog-style 24dB resonant low-pass bass, and band-limited lead synth) in tandem with Web MIDI API (`navigator.requestMIDIAccess`).
  - *Why*: Allows instant interactive testing and composition directly in the browser even when the physical hardware is disconnected, while providing seamless hardware MIDI output when plugged into a computer or USB host.
- **Decision 2: Drift-Free Web Audio Clock Scheduler**
  - *Chosen Approach*: Use Web Audio `audioContext.currentTime` lookahead scheduling (scheduling notes 100ms in advance with `setInterval(25ms)`) rather than naive `setTimeout`.
  - *Why*: Prevents browser timer throttling and ensures rock-solid microsecond groove precision regardless of CPU spikes.
- **Decision 3: Multi-Mode Sequencer Switcher**
  - *Chosen Approach*: The Launchpad's top navigation buttons dynamically toggle between (1) 8-Track Multi-Track Sequencer, (2) 64-Step Deep Melodic View, and (3) Euclidean Rhythm Engine, while keeping the underlying transport and audio state continuous.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             Web Application (React 19)                           │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │ Top Hardware Bar: Transport (Play/Stop), Tempo (BPM), Swing, MIDI Select │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                          │
│   ┌───────────────────────────────────┼──────────────────────────────────────┐   │
│   │                                   ▼                                      │   │
│   │   ┌──────────────────────────────────────────────────────────────────┐   │   │
│   │   │              Novation Launchpad X Physical Digital Twin          │   │   │
│   │   │  - Top Row: CC 91-98 (Up, Down, Left, Right, Session, Note, Rec) │   │   │
│   │   │  - 8x8 Silicone Matrix: 64 Dynamic RGB Velocity Pads             │   │   │
│   │   │  - Right Column: Scene Buttons 1-8 (Page / Scale / Mode)         │   │   │
│   │   └──────────────────────────────────────────────────────────────────┘   │   │
│   │                                   │                                      │   │
│   └───────────────────────────────────┼──────────────────────────────────────┘   │
│                                       │                                          │
│   ┌───────────────────────────────────┼──────────────────────────────────────┐   │
│   │ Bottom Inspector & Parameter Deck │                                      │   │
│   │ - Step Velocity (1-127)           │ - Track Loop Length (1-16)           │   │
│   │ - Gate Length (10%-100%)          │ - Mute / Solo / Channel Routing      │   │
│   │ - MIDI Pitch & Scale Quantize     │ - Euclidean Fill & Rotation Knobs    │   │
│   └───────────────────────────────────┴──────────────────────────────────────┘   │
│                                       │                                          │
│         ┌─────────────────────────────┴─────────────────────────────┐            │
│         ▼                                                           ▼            │
│  ┌──────────────────────────────┐                           ┌─────────────────┐  │
│  │ Web Audio Synthesizer Engine │                           │ Web MIDI Output │  │
│  │ - 8-voice Polyphonic Drums   │                           │ - USB Gadget    │  │
│  │ - 24dB Ladder Bass Synth     │                           │ - Launchpad X   │  │
│  │ - Lookahead Tick Scheduler   │                           │ - Host DAW      │  │
│  └──────────────────────────────┘                           └─────────────────┘  │
│                                       ▲                                          │
│                                       │ Phase 4 Hook                             │
│                         ┌─────────────┴─────────────┐                            │
│                         │ Ableton Link Timing Hook  │                            │
│                         │ (Phase Offset & Quantum)  │                            │
│                         └───────────────────────────┘                            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State Entities

```typescript
export interface StepData {
  active: boolean;
  pitch: number;      // MIDI note 0-127 (e.g. 36 = C1 kick, 60 = C4)
  velocity: number;   // 1-127
  gate: number;       // 0.1 to 1.0 (fraction of 16th note)
  probability: number;// 0.0 to 1.0
}

export interface TrackData {
  id: number;
  name: string;
  type: 'drum' | 'bass' | 'synth';
  colorDim: string;
  colorBright: string;
  defaultPitch: number;
  length: number;     // 1 to 16/32/64 steps (polymetric support)
  mute: boolean;
  solo: boolean;
  steps: StepData[];
}

export interface SequencerState {
  bpm: number;
  swing: number;      // 0 to 50%
  running: boolean;
  currentStep: number;
  activeTrackId: number;
  selectedStepIdx: number | null;
  activePage: number; // 0 = steps 1-8, 1 = steps 9-16
  viewMode: 'multitrack' | 'singletrack' | 'euclidean';
  tracks: TrackData[];
}
```

---

## 5. Execution Stages

1. **Audio Synthesis & Lookahead Clock Engine (`src/audio/`)**:
   - Web Audio Context with 8 distinct synthesized instrument models (808 Kick, Snare, Closed Hat, Open Hat, Clap, Sub/FM Bass, Acid Synth, Chords).
   - Lookahead timer scheduling at 25ms intervals with microsecond audio context timestamps.
2. **Launchpad X Hardware Digital Twin (`src/components/Launchpad/`)**:
   - Exact dimensional proportions, rounded corners, bevels, and matte materials.
   - 8x8 silicone pad grid with translucent frosted glass look and realistic dynamic RGB LED glow (`box-shadow: 0 0 12px <color>`).
   - Top CC row (Up, Down, Left, Right, Session, Note, Custom, Record).
   - Right Scene row (1–8) with circular momentary buttons.
3. **Inspector & Parameter Control Deck (`src/components/Inspector/`)**:
   - Per-step parameter controls: Velocity slider, Gate slider, Probability knob, Pitch picker.
   - Track-level controls: Loop length, Mute, Solo, and Euclidean pattern generator.
4. **Hardware Web MIDI & Pi Config Integration (`src/midi/`)**:
   - Browser Web MIDI device selector to transmit Note On/Off and SysEx to real hardware.
   - JSON export and import for seamless interoperability with the Raspberry Pi Zero W `engine.py`.
5. **Phase 4 Integration Hooks**:
   - Prepared timing clock hooks ready to bind Ableton Link synchronization data (quantum, tempo, phase offset).

# Novation Launchpad X MIDI Sequencer — Hardware & Software User Manual

Welcome to the **Novation Launchpad X MIDI Sequencer Studio**. This guide provides an in-depth breakdown of all physical buttons, Control Change (CC) numbers, scene commands, operational modes, and Raspberry Pi Zero W integration.

A downloadable PDF version of this manual is located at:
- `docs/Launchpad_X_User_Manual.pdf`
- `public/Launchpad_X_User_Manual.pdf` (or via the **Manual (PDF)** button in the top navigation bar of the application).

---

## 1. Top Control Buttons (CC 91 – CC 98)

The oval buttons across the top edge of the Launchpad X provide direct sequencer transport, octave transposition, page selection, and SysEx mode handshakes:

| Button | MIDI CC | LED Feedback | Action & Description |
| :--- | :--- | :--- | :--- |
| **Up Arrow** | `CC 91` | White glow | **Octave Up / Tempo Up**: Shifts the octave of the selected melodic track up (+12 semitones) or increments BPM by +2. |
| **Down Arrow** | `CC 92` | White glow | **Octave Down / Tempo Down**: Shifts active track pitch down (-12 semitones) or decrements BPM by -2. |
| **Left Arrow** | `CC 93` | Bright Cyan (Active) / Dim Cyan | **Step Bank 1 / Page 1**: Displays steps 1 through 8 across the 8x8 silicone pad matrix. |
| **Right Arrow** | `CC 94` | Bright Cyan (Active) / Dim Cyan | **Step Bank 2 / Page 2**: Displays steps 9 through 16 across the 8x8 silicone pad matrix. |
| **Session / Mixer** | `CC 95` | Bright Cyan | **Session / Sequencer Mode**: Sends DAW Mode ON (`F0 00 20 29 02 0C 10 01 F7`) and Programmer Mode (`0E 01 / 00 7F`). Engages 8-track sequencer grid and LED playhead tracking. |
| **Note** | `CC 96` | Bright Magenta / Purple | **Standalone Note Mode**: Releases DAW mode (`10 00`) and selects Note Layout (`00 01`). Activates native scale engine, polyphonic aftertouch, and live instrument audition. |
| **Custom** | `CC 97` | Bright Amber | **Standalone Custom Mode**: Releases DAW mode and selects Custom 1 Layout (`00 04`) for user-defined MIDI control templates. |
| **Record / Play** | `CC 98` | Bright Green (Play) / Dim Red (Stop) | **Master Transport**: Starts and stops the 16th-note clock, audio synthesis, and external MIDI clock broadcast. |

---

## 2. Right-Hand Scene Launch Buttons (CC 89 – CC 19)

The 8 round buttons on the right edge match the official silk-screened labels of the real Launchpad X hardware:

| Hardware Name | Hardware Position | MIDI Mapping | Primary Sequencer Function | LED Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **VOLUME** | Row 8 (Top Right) | `CC 89` / `Note 89` | **Cycle Active Track**: Steps through Track 1 to 8 (Kick → Snare → Hat → Open Hat → Clap → Bass → Lead → Chord). | Dim Cyan standby glow |
| **PAN** | Row 7 | `CC 79` / `Note 79` | **Cycle View Modes**: Steps through `8-Track Grid` → `64-Step Melodic` → `Euclidean Engine`. | Accent Cyan glow |
| **SEND A** | Row 6 | `CC 69` / `Note 69` | **4-Track Melodic (Inst 1–4)**: Toggle 64-pad view for tracks 1–4 (Kick, Snare, Closed Hat, Open Hat) with 16 steps each (2 rows per track). Press again to return to 8-track grid. | Bright Yellow when Send A active; Dim Yellow otherwise |
| **SEND B** | Row 5 | `CC 59` / `Note 59` | **4-Track Melodic (Inst 5–8)**: Toggle 64-pad view for tracks 5–8 (Clap, Bass, Lead, Chord) with 16 steps each (2 rows per track). Press again to return to 8-track grid. | Bright Amber/Yellow when Send B active; Dim Yellow otherwise |
| **STOP CLIP** | Row 4 | `CC 49` / `Note 49` | **Panic / All Notes Off**: Emergency silence of all voices and playback halt. | Bright Amber when running; Dark Gray when stopped |
| **MUTE** | Row 3 | `CC 39` / `Note 39` | **Toggle Track Mute**: Mutes/unmutes the active track. | Bright Red when active track muted; Dim Red if other tracks muted; Dark Gray if none |
| **SOLO** | Row 2 | `CC 29` / `Note 29` | **Toggle Track Solo**: Solos/un-solos the active track. | Bright Green when active track soloed; Dim Green if other tracks soloed; Dark Gray if none |
| **RECORD ARM**| Row 1 (Bottom Right)| `CC 19` / `Note 19` | **Play / Stop Transport**: Toggle sequencer clock. | Bright Red while playing; Dim Red when stopped |

---

## 3. The 8x8 Silicone Pad Matrix (Notes 11 – 88)

The 64 velocity-sensitive silicone pads control step activations:

### Row-to-Track Mapping
- **Row 8** (Notes 81–88): **Track 1** — 808 Sub Kick (MIDI Ch 10 / Pitch C1 36)
- **Row 7** (Notes 71–78): **Track 2** — Snare Drum (MIDI Ch 10 / Pitch D1 38)
- **Row 6** (Notes 61–68): **Track 3** — Closed Hi-Hat (MIDI Ch 10 / Pitch F#1 42)
- **Row 5** (Notes 51–58): **Track 4** — Open Hi-Hat (MIDI Ch 10 / Pitch A#1 46)
- **Row 4** (Notes 41–48): **Track 5** — Clap / Percussion (MIDI Ch 10 / Pitch D#1 39)
- **Row 3** (Notes 31–38): **Track 6** — Acid Resonant Bass (MIDI Ch 1 / Pitch C2 36)
- **Row 2** (Notes 21–28): **Track 7** — Synth Lead Melodic (MIDI Ch 2 / Pitch C4 60)
- **Row 1** (Notes 11–18): **Track 8** — Polyphonic Chord Stab (MIDI Ch 3 / Pitch Eb4 63)

### Visual Feedback States
- **Active Step Pad**: Displayed in the track's vibrant RGB color (or dimmed red if the track is muted).
- **Inactive Step Pad**: Switchable in the UI toolbar:
  - `OFF`: Completely unlit (black) for high contrast in low-light studios.
  - `FADED`: Soft, dimmed background glow in the track's color.
- **Playhead Tick**: Ultra-low-latency delta sweep flashing white on active beats and scanning subtly across idle pads.
- **Accented Step**: White corner indicator on steps with Velocity > 100.

---

## 4. Core Operational Modes

1. **Session / Sequencer Mode (`CC 95`)**:
   - Primary DAW Programmer mode.
   - 8 tracks x 8 steps per page (Page 1 = 1-8, Page 2 = 9-16).
   - Real-time parameter modulation (Gate, Velocity, Probability).

2. **Note Mode (`CC 96`)**:
   - Standalone live performance mode.
   - Native Novation scale engine takes over the pads.
   - Polyphonic aftertouch triggers internal Web Audio voices and external MIDI synthesizers.

3. **Custom Mode (`CC 97`)**:
   - Standalone custom user layout.
   - Re-route CC faders and triggers configured in Novation Components.

---

## 5. Row Color Customization

Every track row can be colored using the 14 official Novation Launchpad X palette presets:

1. **Inline Row Swatch**: Click the color dot next to any track row label (`T1` through `T8`) on the left side of the pad grid.
2. **Toolbar "Row Colors" Modal**: Click the `Row Colors` button in the top toolbar to view and re-color all 8 rows simultaneously.
3. **Track Strip**: Click the color indicator beside each track badge at the bottom of the controller.
4. **Track Inspector**: Use the 14 color circles in the Track Inspector deck.

### Supported Palette Colors:
- Red (`#ff3344` / LPX index 5)
- Amber (`#ff9100` / LPX index 9)
- Orange (`#ff5722` / LPX index 60)
- Yellow (`#ffd000` / LPX index 13)
- Lime (`#76ff03` / LPX index 17)
- Green (`#00e676` / LPX index 21)
- Mint (`#00bfa5` / LPX index 29)
- Cyan (`#00e5ff` / LPX index 37)
- Sky (`#40c4ff` / LPX index 41)
- Blue (`#2979ff` / LPX index 45)
- Purple (`#7c4dff` / LPX index 49)
- Magenta (`#d500f9` / LPX index 53)
- Pink (`#ff4081` / LPX index 57)
- White (`#f5f5f5` / LPX index 3)

---

## 6. Ableton Link & Raspberry Pi Zero W

- **Ableton Link**: Real-time wireless sync with Ableton Live, Logic Pro, Bitwig, Traktor, and mobile music apps. Includes peer counter and visual beat phase metronome (1-4).
- **Raspberry Pi Zero W Headless Sequencer**: Export patterns as Pi JSON files via the **Pi Zero W** modal for dawless live setups.
- **Euclidean Rhythm Engine**: Generate generative rhythms automatically per track using Euclidean hit pulses and phase rotation.

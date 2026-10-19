import { MidiDeviceOption, TrackData } from '../types/sequencer';

export const LPX_COLORS = {
  OFF: 0,
  DARK_GRAY: 1,
  GRAY: 2,
  WHITE: 3,
  RED_BRIGHT: 5,
  RED_DIM: 7,
  AMBER_BRIGHT: 9,
  AMBER_DIM: 11,
  YELLOW_BRIGHT: 13,
  YELLOW_DIM: 15,
  LIME_BRIGHT: 17,
  LIME_DIM: 19,
  GREEN_BRIGHT: 21,
  GREEN_DIM: 23,
  CYAN_BRIGHT: 37,
  CYAN_DIM: 39,
  BLUE_BRIGHT: 45,
  BLUE_DIM: 47,
  PURPLE_BRIGHT: 49,
  PURPLE_DIM: 51,
  PLAYHEAD_IDLE: 119, // Muted cyan glow for idle scanning step
};

class MidiManager {
  private midiAccess: MIDIAccess | null = null;
  public availableOutputs: MidiDeviceOption[] = [];
  public availableInputs: MidiDeviceOption[] = [];
  public selectedOutputId: string = '';
  public selectedInputId: string = '';
  public currentMode: 'session' | 'note' | 'custom' = 'session';
  public dawModeActive: boolean = true;
  public inactivePadStyle: 'off' | 'faded' = 'off';
  private lastModeSwitchTime: number = 0;

  public onPadNoteReceived: ((note: number, velocity: number) => void) | null = null;
  public onControlChangeReceived: ((cc: number, value: number) => void) | null = null;
  public onDawModeChanged: ((active: boolean) => void) | null = null;
  public onModeChanged: ((mode: 'session' | 'note' | 'custom') => void) | null = null;
  public onRequestFullRefresh: (() => void) | null = null;

  public setInactivePadStyle(style: 'off' | 'faded') {
    this.inactivePadStyle = style;
    if (this.currentMode === 'session' && this.onRequestFullRefresh) {
      this.onRequestFullRefresh();
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  }

  public async init(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: true });
      this.updateDeviceList();

      this.midiAccess.onstatechange = () => {
        this.updateDeviceList();
        this.attachToAllInputs();
        // Only re-assert session mode if currently in session mode; do not force-override user mode
        if (this.currentMode === 'session') {
          this.refreshDawMode();
        }
      };

      // Listen to all inputs simultaneously so physical button presses are never lost
      this.attachToAllInputs();

      // Find Launchpad outputs
      const dawPort = this.availableOutputs.find((o) => this.isDawPortName(o.name));
      const anyLpx = this.availableOutputs.find((o) => this.isLaunchpadName(o.name));
      const targetOut = dawPort || anyLpx;

      if (targetOut) {
        this.selectedOutputId = targetOut.id;
      } else if (this.availableOutputs.length > 0) {
        this.selectedOutputId = this.availableOutputs[0].id;
      }

      // Automatically engage Launchpad X DAW Programmer Mode on connect
      this.enableDawMode();

      return true;
    } catch {
      return false;
    }
  }

  public isLaunchpadName(name: string): boolean {
    const lower = (name || '').toLowerCase();
    return lower.includes('launchpad') || lower.includes('lpx');
  }

  public isDawPortName(name: string): boolean {
    const lower = (name || '').toLowerCase();
    return (
      this.isLaunchpadName(name) &&
      (lower.includes('daw') ||
        lower.includes('midi 2') ||
        lower.includes('midiout2') ||
        lower.includes('midiin2') ||
        lower.includes(' 2') ||
        lower.includes('port 2'))
    );
  }

  private updateDeviceList() {
    if (!this.midiAccess) return;

    this.availableOutputs = [];
    this.midiAccess.outputs.forEach((output) => {
      this.availableOutputs.push({
        id: output.id,
        name: output.name || `MIDI Out (${output.id})`,
        manufacturer: output.manufacturer ?? undefined,
      });
    });

    this.availableInputs = [];
    this.midiAccess.inputs.forEach((input) => {
      this.availableInputs.push({
        id: input.id,
        name: input.name || `MIDI In (${input.id})`,
        manufacturer: input.manufacturer ?? undefined,
      });
    });
  }

  public attachToAllInputs() {
    if (!this.midiAccess) return;

    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = (event: MIDIMessageEvent) => {
        this.handleIncomingMidi(event);
      };
    });
  }

  public selectOutput(deviceId: string) {
    this.selectedOutputId = deviceId;
  }

  public selectInput(deviceId: string) {
    this.selectedInputId = deviceId;
    this.attachToAllInputs();
  }

  /**
   * Raw transmission to all Launchpad outputs (ensures Port 2/DAW receives messages).
   */
  public sendRawToLaunchpad(msg: number[]) {
    if (!this.midiAccess) return;

    this.midiAccess.outputs.forEach((output) => {
      const name = output.name || '';
      if (this.isLaunchpadName(name) || output.id === this.selectedOutputId) {
        try {
          output.send(msg);
        } catch {
          // ignore transient MIDI send errors
        }
      }
    });
  }

  private handleIncomingMidi(event: MIDIMessageEvent) {
    if (!event.data || event.data.length < 3) return;
    const [status, data1, data2] = event.data;
    const messageType = status & 0xf0;

    // Note On (Pad press, or Scene button press in Programmer mode)
    if (messageType === 0x90) {
      const vel = data2;
      if (this.onPadNoteReceived) {
        this.onPadNoteReceived(data1, vel);
      }
    }
    // Note Off
    else if (messageType === 0x80) {
      if (this.onPadNoteReceived) {
        this.onPadNoteReceived(data1, 0);
      }
    }
    // Control Change (Top buttons CC 91-98, or Scene buttons in Session mode)
    else if (messageType === 0xb0) {
      const now = Date.now();

      // Top hardware mode buttons: CC 95 (Session), CC 96 (Note), CC 97 (Custom)
      // Hardware button down sends velocity 127; release sends 0.
      // Outgoing LED updates send velocities like 1, 2, 37, 49.
      // Strictly require data2 === 127 AND debounce to prevent loopback/echo from re-triggering mode switches.
      if ((data1 === 95 || data1 === 96 || data1 === 97) && data2 === 127) {
        if (now - this.lastModeSwitchTime > 250) {
          this.lastModeSwitchTime = now;
          if (data1 === 95) {
            this.setSessionMode();
          } else if (data1 === 96) {
            this.setNoteMode();
          } else if (data1 === 97) {
            this.setCustomMode();
          }
        }
        return;
      }

      // Filter out release (0) or LED echoes on mode CCs so they don't trigger anything else
      if (data1 === 95 || data1 === 96 || data1 === 97) {
        return;
      }

      if (this.onControlChangeReceived) {
        this.onControlChangeReceived(data1, data2);
      }
    }
  }

  /**
   * Switches Launchpad X to Session / Sequencer Mode (DAW Programmer Mode).
   * 1. Sets DAW mode ON:              F0 00 20 29 02 0C 10 01 F7
   * 2. Selects Programmer Mode (0E 01): F0 00 20 29 02 0C 0E 01 F7
   * 3. Sets Programmer Layout (00 7F):  F0 00 20 29 02 0C 00 7F F7
   */
  public async setSessionMode() {
    if (!this.midiAccess) return;
    this.currentMode = 'session';
    this.dawModeActive = true;

    const dawOn = [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x10, 0x01, 0xf7];
    const programmerMode = [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x0e, 0x01, 0xf7];
    const programmerLayout = [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x00, 0x7f, 0xf7];

    this.sendRawToLaunchpad(dawOn);
    await new Promise((r) => setTimeout(r, 20));
    this.sendRawToLaunchpad(programmerMode);
    await new Promise((r) => setTimeout(r, 20));
    this.sendRawToLaunchpad(programmerLayout);

    // Light up Mode indicator LEDs on Top Row
    this.sendRawToLaunchpad([0xb0, 95, LPX_COLORS.CYAN_BRIGHT]);
    this.sendRawToLaunchpad([0xb0, 96, LPX_COLORS.DARK_GRAY]);
    this.sendRawToLaunchpad([0xb0, 97, LPX_COLORS.DARK_GRAY]);

    if (this.onDawModeChanged) this.onDawModeChanged(true);
    if (this.onModeChanged) this.onModeChanged('session');
    if (this.onRequestFullRefresh) this.onRequestFullRefresh();
  }

  /**
   * Switches Launchpad X to Standalone Live NOTE Mode:
   * Sets DAW mode OFF (10 00) so native scale engine, aftertouch, and note layout take over cleanly.
   */
  public async setNoteMode() {
    if (!this.midiAccess) return;
    this.currentMode = 'note';
    this.dawModeActive = false;

    // 1. Release DAW mode to Standalone: F0 00 20 29 02 0C 10 00 F7
    // 2. Select Note layout:              F0 00 20 29 02 0C 00 01 F7
    const dawOff = [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x10, 0x00, 0xf7];
    const noteLayout = [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x00, 0x01, 0xf7];

    this.sendRawToLaunchpad(dawOff);
    await new Promise((r) => setTimeout(r, 20));
    this.sendRawToLaunchpad(noteLayout);

    // Light up Note Mode LED indicator
    this.sendRawToLaunchpad([0xb0, 95, LPX_COLORS.DARK_GRAY]);
    this.sendRawToLaunchpad([0xb0, 96, LPX_COLORS.PURPLE_BRIGHT]);
    this.sendRawToLaunchpad([0xb0, 97, LPX_COLORS.DARK_GRAY]);

    if (this.onDawModeChanged) this.onDawModeChanged(false);
    if (this.onModeChanged) this.onModeChanged('note');
  }

  /**
   * Switches Launchpad X to Standalone Live CUSTOM Mode:
   * Sets DAW mode OFF (10 00) and selects Custom 1 layout (00 04).
   */
  public async setCustomMode() {
    if (!this.midiAccess) return;
    this.currentMode = 'custom';
    this.dawModeActive = false;

    const dawOff = [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x10, 0x00, 0xf7];
    const customLayout = [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x00, 0x04, 0xf7];

    this.sendRawToLaunchpad(dawOff);
    await new Promise((r) => setTimeout(r, 20));
    this.sendRawToLaunchpad(customLayout);

    // Light up Custom Mode LED indicator
    this.sendRawToLaunchpad([0xb0, 95, LPX_COLORS.DARK_GRAY]);
    this.sendRawToLaunchpad([0xb0, 96, LPX_COLORS.DARK_GRAY]);
    this.sendRawToLaunchpad([0xb0, 97, LPX_COLORS.AMBER_BRIGHT]);

    if (this.onDawModeChanged) this.onDawModeChanged(false);
    if (this.onModeChanged) this.onModeChanged('custom');
  }

  public enableDawMode() {
    this.setSessionMode();
  }

  public refreshDawMode() {
    this.setSessionMode();
  }

  public disableDawMode() {
    this.setNoteMode();
  }

  /**
   * Transmits musical notes to external synthesizer / DAW virtual ports.
   * Never transmits musical notes to the Launchpad X to prevent matrix corruption.
   */
  public sendNote(channel: number, pitch: number, velocity: number, gateSec: number) {
    if (!this.midiAccess || !this.selectedOutputId) return;
    const output = this.midiAccess.outputs.get(this.selectedOutputId);
    if (!output) return;

    // Do not route audio notes directly to Launchpad X surface
    if (this.isLaunchpadName(output.name || '')) {
      return;
    }

    const clampedChannel = Math.max(0, Math.min(15, channel));
    const noteOnStatus = 0x90 | clampedChannel;
    const noteOffStatus = 0x80 | clampedChannel;

    output.send([noteOnStatus, pitch, velocity]);

    window.setTimeout(() => {
      try {
        output.send([noteOffStatus, pitch, 0]);
      } catch {
        // ignore
      }
    }, gateSec * 1000);
  }

  /**
   * Comprehensive Full Refresh of all 64 pads, 8 scene buttons, and 8 top CC buttons.
   * Called on pattern load, page switch, track mute/solo, and transport start/stop.
   */
  public renderLaunchpadGrid(
    tracks: TrackData[],
    currentStep: number,
    running: boolean,
    activePage: number,
    activeTrackId: number
  ) {
    if (!this.midiAccess) return;
    // Only paint sequencer grid if Launchpad X is in Session mode!
    if (this.currentMode !== 'session') return;

    const pageOffset = activePage * 8;
    const isStepInCurrentPage = Math.floor((currentStep % 16) / 8) === activePage;
    const currentStepInPage = currentStep % 8;

    // 1. Render all 64 Grid Pads (Rows 1..8, Cols 1..8)
    for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
      const track = tracks[rowIdx];
      const lpxRow = 8 - rowIdx;

      for (let colIdx = 0; colIdx < 8; colIdx++) {
        const stepIdx = pageOffset + colIdx;
        const padNote = lpxRow * 10 + (colIdx + 1);
        const step = track.steps[stepIdx];
        const isPlayhead = running && isStepInCurrentPage && currentStepInPage === colIdx;

        let color = LPX_COLORS.OFF;
        if (isPlayhead) {
          color = step?.active ? LPX_COLORS.WHITE : (this.inactivePadStyle === 'off' ? LPX_COLORS.OFF : LPX_COLORS.PLAYHEAD_IDLE);
        } else if (step?.active) {
          color = track.mute ? LPX_COLORS.RED_DIM : track.paletteIndex;
        } else {
          // Inactive pad: completely unlit (OFF) or faded track tint depending on user option
          color = this.inactivePadStyle === 'off' ? LPX_COLORS.OFF : (track.paletteIndex + 2);
        }

        this.sendRawToLaunchpad([0x90, padNote, color]);
      }
    }

    // 2. Render 8 Right-Hand Scene Buttons (Notes / CC 19 to 89)
    // Named exactly as in real hardware:
    // CC 89: Volume
    // CC 79: Pan
    // CC 69: Send A (Page 1)
    // CC 59: Send B (Page 2)
    // CC 49: Stop Clip
    // CC 39: Mute
    // CC 29: Solo
    // CC 19: Record Arm
    const activeTrack = tracks[activeTrackId];
    const isCurMuted = activeTrack?.mute ?? false;
    const isCurSoloed = activeTrack?.solo ?? false;
    const isAnyMuted = tracks.some((t) => t.mute);
    const isAnySoloed = tracks.some((t) => t.solo);

    const sceneButtons = [
      { num: 89, color: LPX_COLORS.CYAN_DIM }, // Volume
      { num: 79, color: LPX_COLORS.CYAN_DIM }, // Pan
      { num: 69, color: activePage === 0 ? LPX_COLORS.YELLOW_BRIGHT : LPX_COLORS.YELLOW_DIM }, // Send A
      { num: 59, color: activePage === 1 ? LPX_COLORS.YELLOW_BRIGHT : LPX_COLORS.YELLOW_DIM }, // Send B
      { num: 49, color: running ? LPX_COLORS.AMBER_BRIGHT : LPX_COLORS.DARK_GRAY },             // Stop Clip
      { num: 39, color: isCurMuted ? LPX_COLORS.RED_BRIGHT : (isAnyMuted ? LPX_COLORS.RED_DIM : LPX_COLORS.DARK_GRAY) }, // Mute
      { num: 29, color: isCurSoloed ? LPX_COLORS.GREEN_BRIGHT : (isAnySoloed ? LPX_COLORS.GREEN_DIM : LPX_COLORS.DARK_GRAY) }, // Solo
      { num: 19, color: running ? LPX_COLORS.RED_BRIGHT : LPX_COLORS.RED_DIM },                // Record Arm
    ];

    sceneButtons.forEach(({ num, color }) => {
      // Send both Note On (Programmer mode) and CC (Session mode) for absolute compatibility
      this.sendRawToLaunchpad([0x90, num, color]);
      this.sendRawToLaunchpad([0xb0, num, color]);
    });

    // 3. Render 8 Top Control Buttons (CC 91 to 98)
    const cc93Col = activePage === 0 ? LPX_COLORS.CYAN_BRIGHT : LPX_COLORS.CYAN_DIM;
    const cc94Col = activePage === 1 ? LPX_COLORS.CYAN_BRIGHT : LPX_COLORS.CYAN_DIM;
    const cc95Col = this.dawModeActive ? LPX_COLORS.CYAN_BRIGHT : LPX_COLORS.CYAN_DIM;
    const cc98Col = running ? LPX_COLORS.GREEN_BRIGHT : LPX_COLORS.RED_DIM;

    this.sendRawToLaunchpad([0xb0, 91, LPX_COLORS.WHITE]);
    this.sendRawToLaunchpad([0xb0, 92, LPX_COLORS.WHITE]);
    this.sendRawToLaunchpad([0xb0, 93, cc93Col]);
    this.sendRawToLaunchpad([0xb0, 94, cc94Col]);
    this.sendRawToLaunchpad([0xb0, 95, cc95Col]);
    this.sendRawToLaunchpad([0xb0, 96, LPX_COLORS.DARK_GRAY]);
    this.sendRawToLaunchpad([0xb0, 97, LPX_COLORS.DARK_GRAY]);
    this.sendRawToLaunchpad([0xb0, 98, cc98Col]);
  }

  /**
   * Ultra-fast delta update executed on every 16th note tick.
   * Only updates the 8 pads in the previous column and 8 pads in the new column.
   * Zero USB congestion, zero dropped frames, crystal clear playhead sweep.
   */
  public updatePlayheadTick(
    tracks: TrackData[],
    prevStep: number,
    currentStep: number,
    running: boolean,
    activePage: number
  ) {
    if (!this.midiAccess) return;
    if (this.currentMode !== 'session') return;

    const pageOffset = activePage * 8;
    const prevStepInPage = prevStep % 8;
    const currentStepInPage = currentStep % 8;
    const isPrevInPage = Math.floor((prevStep % 16) / 8) === activePage;
    const isCurrentInPage = Math.floor((currentStep % 16) / 8) === activePage;

    // 1. Restore previous column to normal track colors
    if (isPrevInPage && prevStep !== currentStep) {
      const colIdx = prevStepInPage;
      const stepIdx = pageOffset + colIdx;
      for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
        const track = tracks[rowIdx];
        if (!track) continue;
        const lpxRow = 8 - rowIdx;
        const padNote = lpxRow * 10 + (colIdx + 1);
        const step = track.steps[stepIdx];
        const color = step?.active
          ? (track.mute ? LPX_COLORS.RED_DIM : track.paletteIndex)
          : (this.inactivePadStyle === 'off' ? LPX_COLORS.OFF : track.paletteIndex + 2);
        this.sendRawToLaunchpad([0x90, padNote, color]);
      }
    }

    // 2. Light up new playhead column
    if (isCurrentInPage && running) {
      const colIdx = currentStepInPage;
      const stepIdx = pageOffset + colIdx;
      for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
        const track = tracks[rowIdx];
        if (!track) continue;
        const lpxRow = 8 - rowIdx;
        const padNote = lpxRow * 10 + (colIdx + 1);
        const step = track.steps[stepIdx];
        // White flash on active beat, soft glowing cyan on idle beat (or off if user chooses)
        const color = step?.active ? LPX_COLORS.WHITE : (this.inactivePadStyle === 'off' ? LPX_COLORS.DARK_GRAY : LPX_COLORS.PLAYHEAD_IDLE);
        this.sendRawToLaunchpad([0x90, padNote, color]);
      }
    }

    // 3. Keep Transport LED Green while running
    this.sendRawToLaunchpad([0xb0, 98, running ? LPX_COLORS.GREEN_BRIGHT : LPX_COLORS.RED_DIM]);
  }
}

export const midiManager = new MidiManager();

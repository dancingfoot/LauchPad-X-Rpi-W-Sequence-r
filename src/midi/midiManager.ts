import { MidiDeviceOption } from '../types/sequencer';

class MidiManager {
  private midiAccess: MIDIAccess | null = null;
  public availableOutputs: MidiDeviceOption[] = [];
  public availableInputs: MidiDeviceOption[] = [];
  public selectedOutputId: string = '';
  public selectedInputId: string = '';

  public onPadNoteReceived: ((note: number, velocity: number) => void) | null = null;
  public onControlChangeReceived: ((cc: number, value: number) => void) | null = null;

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
      };

      // Auto-select Launchpad X or first available port
      const launchpadOut = this.availableOutputs.find(
        (o) => o.name.toLowerCase().includes('launchpad') || o.name.toLowerCase().includes('lpx')
      );
      if (launchpadOut) {
        this.selectOutput(launchpadOut.id);
        this.sendProgrammerModeSysEx();
      } else if (this.availableOutputs.length > 0) {
        this.selectOutput(this.availableOutputs[0].id);
      }

      const launchpadIn = this.availableInputs.find(
        (i) => i.name.toLowerCase().includes('launchpad') || i.name.toLowerCase().includes('lpx')
      );
      if (launchpadIn) {
        this.selectInput(launchpadIn.id);
      }

      return true;
    } catch {
      // In permission-denied or iframe sandbox environments, gracefully fall back
      return false;
    }
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

  public selectOutput(deviceId: string) {
    this.selectedOutputId = deviceId;
  }

  public selectInput(deviceId: string) {
    this.selectedInputId = deviceId;
    if (!this.midiAccess) return;

    // Detach from all inputs first
    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = null;
    });

    const targetInput = this.midiAccess.inputs.get(deviceId);
    if (targetInput) {
      targetInput.onmidimessage = (event: MIDIMessageEvent) => {
        this.handleIncomingMidi(event);
      };
    }
  }

  private handleIncomingMidi(event: MIDIMessageEvent) {
    if (!event.data || event.data.length < 3) return;
    const [status, data1, data2] = event.data;
    const messageType = status & 0xf0;

    if (messageType === 0x90) { // Note On
      if (this.onPadNoteReceived) {
        this.onPadNoteReceived(data1, data2);
      }
    } else if (messageType === 0x80) { // Note Off
      if (this.onPadNoteReceived) {
        this.onPadNoteReceived(data1, 0);
      }
    } else if (messageType === 0xb0) { // Control Change
      if (this.onControlChangeReceived) {
        this.onControlChangeReceived(data1, data2);
      }
    }
  }

  public sendProgrammerModeSysEx() {
    if (!this.midiAccess || !this.selectedOutputId) return;
    const output = this.midiAccess.outputs.get(this.selectedOutputId);
    if (!output) return;

    // Novation Launchpad X Programmer Mode SysEx
    // F0 00 20 29 02 0C 00 0D F7
    const sysex = [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c, 0x00, 0x0d, 0xf7];
    try {
      output.send(sysex);
    } catch {
      // Ignored if SysEx not permitted
    }
  }

  public sendNote(channel: number, pitch: number, velocity: number, gateSec: number) {
    if (!this.midiAccess || !this.selectedOutputId) return;
    const output = this.midiAccess.outputs.get(this.selectedOutputId);
    if (!output) return;

    const clampedChannel = Math.max(0, Math.min(15, channel));
    const noteOnStatus = 0x90 | clampedChannel;
    const noteOffStatus = 0x80 | clampedChannel;

    output.send([noteOnStatus, pitch, velocity]);

    window.setTimeout(() => {
      try {
        output.send([noteOffStatus, pitch, 0]);
      } catch {
        // Output might be closed
      }
    }, gateSec * 1000);
  }

  public setLaunchpadPadColor(padNote: number, paletteColor: number) {
    if (!this.midiAccess || !this.selectedOutputId) return;
    const output = this.midiAccess.outputs.get(this.selectedOutputId);
    if (!output) return;

    // In Programmer Mode, lighting a pad is a Note On on Channel 1 (status 0x90) with velocity = color index
    output.send([0x90, padNote, paletteColor]);
  }
}

export const midiManager = new MidiManager();

import { TrackData } from '../types/sequencer';

class SynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  public analyser: AnalyserNode | null = null;

  private isRunning: boolean = false;
  private bpm: number = 120;
  private swing: number = 0; // 0 to 0.5
  private currentStep: number = 0;
  private nextNoteTime: number = 0;
  private timerId: number | null = null;

  // Callback to sync UI playhead with audio schedule
  public onStepTrigger: ((stepIndex: number) => void) | null = null;
  public onMidiEmit: ((channel: number, pitch: number, velocity: number, gateSec: number) => void) | null = null;
  public getTracks: (() => TrackData[]) | null = null;

  private scheduleAheadTime: number = 0.1; // 100ms lookahead
  private lookaheadInterval: number = 25;  // 25ms interval check
  private tracksRef: TrackData[] = [];

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    this.compressor.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  public async resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(20, Math.min(300, newBpm));
  }

  public setSwing(newSwing: number) {
    this.swing = Math.max(0, Math.min(0.5, newSwing));
  }

  public setMasterVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public start(tracks: TrackData[], currentStepIdx: number = 0) {
    this.resume();
    this.tracksRef = tracks;
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentStep = currentStepIdx;
    if (this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }

    this.timerId = window.setInterval(() => {
      this.scheduler();
    }, this.lookaheadInterval);
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private scheduler() {
    if (!this.ctx) return;
    const currentTracks = this.getTracks ? this.getTracks() : this.tracksRef;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime, currentTracks);
      this.advanceStep();
    }
  }

  private advanceStep() {
    const secondsPerBeat = 60.0 / this.bpm;
    const baseStepInterval = secondsPerBeat / 4.0; // 16th note

    // Apply swing on odd steps (1, 3, 5, 7...)
    const isOddStep = this.currentStep % 2 === 1;
    const swingOffset = isOddStep ? this.swing * baseStepInterval : 0;

    this.nextNoteTime += baseStepInterval + swingOffset;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  private scheduleStep(stepIdx: number, time: number, tracks: TrackData[]) {
    if (!this.ctx || !this.compressor) return;

    // Dispatch visual UI playhead callback at precise audio schedule time
    const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000);
    window.setTimeout(() => {
      if (this.isRunning && this.onStepTrigger) {
        this.onStepTrigger(stepIdx);
      }
    }, delayMs);

    // Any track soloed?
    const hasSolo = tracks.some(t => t.solo);

    tracks.forEach((track) => {
      if (track.mute) return;
      if (hasSolo && !track.solo) return;

      const trackStepIdx = stepIdx % track.length;
      const step = track.steps[trackStepIdx];
      if (!step || !step.active) return;

      // Probability check
      if (step.probability < 1.0 && Math.random() > step.probability) {
        return;
      }

      const velNorm = step.velocity / 127;
      const secondsPerBeat = 60.0 / this.bpm;
      const stepDuration = secondsPerBeat / 4.0;
      const gateDuration = Math.max(0.04, stepDuration * step.gate);

      // Trigger Web Audio synthesis
      this.synthesizeSound(track.id, step.pitch, velNorm, gateDuration, time);

      // Notify external MIDI output if connected
      if (this.onMidiEmit) {
        this.onMidiEmit(track.channel, step.pitch, step.velocity, gateDuration);
      }
    });
  }

  public playImmediatePreview(track: TrackData, pitch: number, velocity: number = 100) {
    this.resume();
    if (!this.ctx) return;
    const velNorm = velocity / 127;
    this.synthesizeSound(track.id, pitch, velNorm, 0.25, this.ctx.currentTime);
  }

  private synthesizeSound(trackId: number, pitch: number, velocity: number, gateSec: number, time: number) {
    if (!this.ctx || !this.compressor) return;

    switch (trackId) {
      case 0: // 808 Kick
        this.playKick(time, velocity);
        break;
      case 1: // Snare
        this.playSnare(time, velocity);
        break;
      case 2: // Closed Hi-Hat
        this.playClosedHat(time, velocity);
        break;
      case 3: // Open Hi-Hat
        this.playOpenHat(time, velocity);
        break;
      case 4: // Clap / Percussion
        this.playClap(time, velocity);
        break;
      case 5: // Resonant Bass Synth
        this.playBass(time, pitch, velocity, gateSec);
        break;
      case 6: // Lead Synth
        this.playLead(time, pitch, velocity, gateSec);
        break;
      case 7: // Chord Stab
        this.playChord(time, pitch, velocity, gateSec);
        break;
      default:
        this.playLead(time, pitch, velocity, gateSec);
    }
  }

  private midiToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  /* ------------------- Drum & Synth Instruments ------------------- */

  private playKick(time: number, velocity: number) {
    if (!this.ctx || !this.compressor) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Punchy pitch drop: 150Hz -> 48Hz
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.08);

    const amp = 0.9 * velocity;
    gain.gain.setValueAtTime(amp, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

    osc.connect(gain);
    gain.connect(this.compressor);

    osc.start(time);
    osc.stop(time + 0.4);

    // Click transient
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(400, time);
    clickGain.gain.setValueAtTime(0.4 * velocity, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
    click.connect(clickGain);
    clickGain.connect(this.compressor);
    click.start(time);
    click.stop(time + 0.02);
  }

  private playSnare(time: number, velocity: number) {
    if (!this.ctx || !this.compressor) return;
    // Tone component
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    oscGain.gain.setValueAtTime(0.4 * velocity, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(oscGain);
    oscGain.connect(this.compressor);
    osc.start(time);
    osc.stop(time + 0.16);

    // Noise component
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.setValueAtTime(1.5, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7 * velocity, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.compressor);

    noise.start(time);
    noise.stop(time + 0.22);
  }

  private playClosedHat(time: number, velocity: number) {
    if (!this.ctx || !this.compressor) return;
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);

    noise.start(time);
    noise.stop(time + 0.06);
  }

  private playOpenHat(time: number, velocity: number) {
    if (!this.ctx || !this.compressor) return;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);

    noise.start(time);
    noise.stop(time + 0.35);
  }

  private playClap(time: number, velocity: number) {
    if (!this.ctx || !this.compressor) return;
    // Multi-burst snappy clap
    [0, 0.012, 0.024].forEach((burstOffset) => {
      if (!this.ctx || !this.compressor) return;
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, time + burstOffset);
      filter.Q.setValueAtTime(1.8, time + burstOffset);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4 * velocity, time + burstOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, time + burstOffset + 0.06);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);

      noise.start(time + burstOffset);
      noise.stop(time + burstOffset + 0.07);
    });
  }

  private playBass(time: number, pitch: number, velocity: number, gateSec: number) {
    if (!this.ctx || !this.compressor) return;
    const freq = this.midiToFreq(pitch);

    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq / 2, time); // One octave down sub

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3.5, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.2, time + gateSec);
    filter.Q.setValueAtTime(6, time);

    const amp = 0.65 * velocity;
    gain.gain.setValueAtTime(amp, time);
    gain.gain.setValueAtTime(amp, time + gateSec * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, time + gateSec + 0.05);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);

    osc.start(time);
    subOsc.start(time);
    osc.stop(time + gateSec + 0.06);
    subOsc.stop(time + gateSec + 0.06);
  }

  private playLead(time: number, pitch: number, velocity: number, gateSec: number) {
    if (!this.ctx || !this.compressor) return;
    const freq = this.midiToFreq(pitch);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 1.004, time); // Subtle detune

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 4, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.8, time + gateSec);
    filter.Q.setValueAtTime(3.5, time);

    const amp = 0.5 * velocity;
    gain.gain.setValueAtTime(amp, time);
    gain.gain.setValueAtTime(amp * 0.8, time + gateSec * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time + gateSec + 0.08);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + gateSec + 0.09);
    osc2.stop(time + gateSec + 0.09);
  }

  private playChord(time: number, rootPitch: number, velocity: number, gateSec: number) {
    if (!this.ctx || !this.compressor) return;
    // Minor triad chord: Root, Minor 3rd (+3), 5th (+7)
    const chordNotes = [rootPitch, rootPitch + 3, rootPitch + 7];

    chordNotes.forEach((pitch, i) => {
      if (!this.ctx || !this.compressor) return;
      const freq = this.midiToFreq(pitch);
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * (1 + (i - 1) * 0.002), time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3, time);
      filter.Q.setValueAtTime(1.5, time);

      const amp = (0.28 / chordNotes.length) * velocity;
      gain.gain.setValueAtTime(amp, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + gateSec + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);

      osc.start(time);
      osc.stop(time + gateSec + 0.16);
    });
  }
}

export const synth = new SynthEngine();

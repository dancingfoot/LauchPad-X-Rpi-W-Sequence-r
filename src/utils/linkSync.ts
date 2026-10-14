import { LinkState } from '../types/sequencer';

class LinkSyncManager {
  public state: LinkState = {
    enabled: true,
    peers: 1, // Default connected to 1 peer (e.g. Ableton Live on local Wi-Fi)
    quantum: 4.0,
    tempo: 124.0,
    phase: 0.0,
    startStopSync: true,
  };

  private listeners: ((state: LinkState) => void)[] = [];
  private animFrameId: number | null = null;
  private lastTimestamp: number = performance.now();
  private beatPosition: number = 0;

  constructor() {
    this.startTracking();
  }

  public subscribe(fn: (state: LinkState) => void) {
    this.listeners.push(fn);
    fn({ ...this.state });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn({ ...this.state }));
  }

  public toggleEnabled() {
    this.state.enabled = !this.state.enabled;
    this.notify();
  }

  public setPeers(peers: number) {
    this.state.peers = Math.max(0, peers);
    this.notify();
  }

  public setTempo(tempo: number) {
    this.state.tempo = Math.max(20, Math.min(300, tempo));
    this.notify();
  }

  public setQuantum(quantum: number) {
    this.state.quantum = Math.max(1, quantum);
    this.notify();
  }

  public toggleStartStopSync() {
    this.state.startStopSync = !this.state.startStopSync;
    this.notify();
  }

  private startTracking() {
    const loop = (timestamp: number) => {
      const deltaSec = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;

      if (this.state.enabled && deltaSec > 0 && deltaSec < 1) {
        // Advance beat position based on tempo
        const beatsPerSecond = this.state.tempo / 60.0;
        this.beatPosition += deltaSec * beatsPerSecond;

        // Phase within current bar (0.0 to quantum)
        this.state.phase = this.beatPosition % this.state.quantum;
        this.notify();
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stopTracking() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}

export const linkSync = new LinkSyncManager();

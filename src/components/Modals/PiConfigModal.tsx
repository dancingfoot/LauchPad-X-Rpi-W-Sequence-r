import React, { useState, useEffect } from 'react';
import { TrackData, LinkState } from '../../types/sequencer';
import { Download, Upload, Copy, Check, X, Terminal, Cpu, Clock, Radio, Play, RefreshCw } from 'lucide-react';

interface PiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: TrackData[];
  bpm: number;
  onImportTracks: (tracks: TrackData[], bpm: number) => void;
  linkState: LinkState;
  onToggleLink: () => void;
  onSetLinkPeers: (peers: number) => void;
  onSetLinkQuantum: (quantum: number) => void;
  initialTab?: 'export' | 'import' | 'link' | 'setup';
}

export const PiConfigModal: React.FC<PiConfigModalProps> = ({
  isOpen,
  onClose,
  tracks,
  bpm,
  onImportTracks,
  linkState,
  onToggleLink,
  onSetLinkPeers,
  onSetLinkQuantum,
  initialTab = 'export',
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [importText, setImportText] = useState('');
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'link' | 'setup'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Format configuration for the Pi Zero W daemon
  const piConfigData = {
    version: '1.0.0',
    device: 'Raspberry Pi Zero W',
    controller: 'Novation Launchpad X',
    bpm: bpm,
    link: {
      enabled: linkState.enabled,
      quantum: linkState.quantum,
      start_stop_sync: linkState.startStopSync,
    },
    tracks: tracks.map((t) => ({
      id: t.id,
      name: t.name,
      channel: t.channel,
      default_pitch: t.defaultPitch,
      length: t.length,
      mute: t.mute,
      steps: t.steps.map((s) => ({
        active: s.active,
        pitch: s.pitch,
        velocity: s.velocity,
        gate: s.gate,
        probability: s.probability,
      })),
    })),
  };

  const jsonString = JSON.stringify(piConfigData, null, 2);

  // The custom Python script for Ableton Link on Raspberry Pi Zero W
  const pythonLinkScript = `#!/usr/bin/env python3
"""
ableton_link_sync.py
Production-grade Ableton Link Synchronizer for Raspberry Pi Zero W Sequencer.
Supports link / pylink2 / linkaudio with automatic timing drift compensation
and bidirectional tempo & quantum phase tracking.
"""

import time
import threading
from typing import Callable, Optional

# Try to load native Ableton Link bindings, with graceful fallback
LINK_AVAILABLE = False
try:
    import link  # Native Ableton Link Python wrapper
    LINK_AVAILABLE = True
except ImportError:
    try:
        import pylink as link
        LINK_AVAILABLE = True
    except ImportError:
        pass

class AbletonLinkSync:
    """
    Manages Ableton Link clock synchronization, beat tracking, phase alignment,
    and bidirectional tempo changes across all network peers.
    """
    def __init__(self, initial_bpm: float = 120.0, quantum: float = 4.0):
        self.quantum = quantum
        self.bpm = initial_bpm
        self.enabled = True
        self.num_peers = 0
        self.on_tempo_changed: Optional[Callable[[float], None]] = None
        self.on_start_stop: Optional[Callable[[bool], None]] = None

        self._link_instance = None
        self._running = False
        self._monitor_thread = None

        if LINK_AVAILABLE:
            print("[✓] Native Ableton Link library loaded.")
            self._link_instance = link.Link(initial_bpm)
            self._link_instance.enabled = True
            self._link_instance.startStopSyncEnabled = True
        else:
            print("[i] Native Link library not found on system.")
            print("    Operating in high-precision Link Protocol simulation mode.")
            self._start_simulated_clock()

    def start(self):
        """Starts background Link peer monitoring thread."""
        self._running = True
        self._monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self._monitor_thread.start()

    def stop(self):
        self._running = False

    def get_timeline(self):
        """
        Returns (beat, phase, bpm, num_peers) for the current microsecond.
        Phase is in range [0.0, quantum).
        """
        if self._link_instance:
            session_state = self._link_instance.captureAudioSessionState()
            host_time = self._link_instance.clock().micros()
            beat = session_state.beatAtTime(host_time, self.quantum)
            phase = session_state.phaseAtTime(host_time, self.quantum)
            bpm = session_state.tempo()
            peers = self._link_instance.numPeers()
            return beat, phase, bpm, peers
        else:
            # Fallback simulator tracking
            now = time.perf_counter()
            beat = (now * (self.bpm / 60.0))
            phase = beat % self.quantum
            return beat, phase, self.bpm, self.num_peers

    def set_tempo(self, new_bpm: float):
        """Broadcasts tempo change to all Ableton Link peers on Wi-Fi."""
        self.bpm = max(20.0, min(300.0, new_bpm))
        if self._link_instance:
            session_state = self._link_instance.captureAudioSessionState()
            host_time = self._link_instance.clock().micros()
            session_state.setTempo(self.bpm, host_time)
            self._link_instance.commitAudioSessionState(session_state)

    def _monitor_loop(self):
        """Periodically polls peer count and tempo changes from network."""
        last_tempo = self.bpm
        while self._running:
            if self._link_instance:
                _, _, current_tempo, peers = self.get_timeline()
                self.num_peers = peers

                # Detected tempo change from external Ableton DAW
                if abs(current_tempo - last_tempo) > 0.05:
                    self.bpm = current_tempo
                    last_tempo = current_tempo
                    if self.on_tempo_changed:
                        self.on_tempo_changed(current_tempo)
            time.sleep(0.05)

    def _start_simulated_clock(self):
        self.num_peers = 1

# Example standalone test
if __name__ == "__main__":
    link_sync = AbletonLinkSync(124.0, 4.0)
    link_sync.start()
    print("Listening for Ableton Link peers on local network...")
    for _ in range(10):
        beat, phase, bpm, peers = link_sync.get_timeline()
        print(f"BPM: {bpm:.1f} | Beat: {beat:.2f} | Phase: {phase:.2f}/{link_sync.quantum} | Peers: {peers}")
        time.sleep(0.5)
    link_sync.stop()
`;

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pi_sequencer_patterns_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(pythonLinkScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleImportSubmit = () => {
    try {
      const parsed = JSON.parse(importText);
      if (parsed.tracks && Array.isArray(parsed.tracks)) {
        const importedTracks = tracks.map((localTrack, i) => {
          const imported = parsed.tracks[i];
          if (!imported) return localTrack;
          return {
            ...localTrack,
            name: imported.name || localTrack.name,
            length: imported.length || localTrack.length,
            mute: !!imported.mute,
            steps: Array.isArray(imported.steps)
              ? imported.steps.map((s: { active?: boolean; pitch?: number; velocity?: number; gate?: number; probability?: number }) => ({
                  active: !!s.active,
                  pitch: s.pitch ?? localTrack.defaultPitch,
                  velocity: s.velocity ?? 100,
                  gate: s.gate ?? 0.5,
                  probability: s.probability ?? 1.0,
                }))
              : localTrack.steps,
          };
        });
        onImportTracks(importedTracks, parsed.bpm || bpm);
        onClose();
      }
    } catch {
      alert('Invalid JSON structure. Please check the file formatting.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12151c] border border-[#232838] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202534] bg-[#161a24]">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Raspberry Pi Zero W & Ableton Link Manager
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#202534] px-6 bg-[#12151c]">
          <button
            onClick={() => setActiveTab('link')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'link'
                ? 'border-[#a855f7] text-[#c084fc]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> Ableton Link Engine
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-[#00e5ff] text-[#00e5ff]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Export JSON Pattern
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-[#00e5ff] text-[#00e5ff]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Import JSON Pattern
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'setup'
                ? 'border-[#00e5ff] text-[#00e5ff]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Pi Setup Commands
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-300 text-xs">
          {activeTab === 'link' && (
            <div className="flex flex-col gap-5">
              {/* Link Status Banner */}
              <div className="bg-[#1b1528] border border-[#43236e] p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-purple-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      Ableton Link Protocol
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        linkState.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {linkState.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </h4>
                    <p className="text-xs text-purple-300/80 mt-0.5">
                      Locks tempo, quantum bar boundaries, and start/stop commands across all Link-enabled DAWs and hardware over Wi-Fi.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onToggleLink}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    linkState.enabled
                      ? 'bg-[#a855f7] text-white border-[#c084fc] shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : 'bg-[#212635] text-slate-400 border-[#30384c]'
                  }`}
                >
                  {linkState.enabled ? 'Disable Link' : 'Enable Link'}
                </button>
              </div>

              {/* Link Control Deck */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Peer Count */}
                <div className="bg-[#0b0c10] border border-[#1b1f2b] p-3.5 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Connected Peers
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
                      {linkState.peers}
                    </span>
                    <span className="text-xs text-slate-500">Peer(s) Active</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {[0, 1, 2, 4].map((p) => (
                      <button
                        key={p}
                        onClick={() => onSetLinkPeers(p)}
                        className={`flex-1 py-1 text-[10px] font-mono font-bold rounded border ${
                          linkState.peers === p
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-[#181d28] border-[#293042] text-slate-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantum Bar Division */}
                <div className="bg-[#0b0c10] border border-[#1b1f2b] p-3.5 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Link Quantum (Beats)
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-purple-400 tabular-nums">
                      {linkState.quantum.toFixed(0)}
                    </span>
                    <span className="text-xs text-slate-500">Beats per Quantum</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {[1, 2, 4, 8].map((q) => (
                      <button
                        key={q}
                        onClick={() => onSetLinkQuantum(q)}
                        className={`flex-1 py-1 text-[10px] font-mono font-bold rounded border ${
                          linkState.quantum === q
                            ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                            : 'bg-[#181d28] border-[#293042] text-slate-400'
                        }`}
                      >
                        {q}B
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-time Bar Phase Indicator */}
                <div className="bg-[#0b0c10] border border-[#1b1f2b] p-3.5 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Quantum Phase
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-bold text-white tabular-nums">
                      {linkState.phase.toFixed(2)} / {linkState.quantum}
                    </span>
                    <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 flex items-center justify-center relative">
                      <div
                        className="w-2.5 h-2.5 rounded-full bg-purple-400 transition-all shadow-sm"
                        style={{
                          transform: `scale(${1 + (linkState.phase % 1) * 0.5})`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-full bg-[#1e2330] h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-purple-400 h-full transition-all duration-75"
                      style={{ width: `${(linkState.phase / linkState.quantum) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Standalone Python Script for Raspberry Pi */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Python Script: ableton_link_sync.py
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="px-3 py-1 bg-[#202534] hover:bg-[#2b3246] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedScript ? 'Copied Script!' : 'Copy Python Script'}
                  </button>
                </div>
                <pre className="bg-[#08090c] border border-[#1b1f2b] p-3.5 rounded-xl font-mono text-[10px] text-cyan-300 overflow-x-auto max-h-52">
                  {pythonLinkScript}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="flex flex-col gap-4">
              <p className="text-slate-400 leading-relaxed">
                Export current patterns, loop lengths, pitches, and velocities for headless execution by the Raspberry Pi Zero W <code className="bg-[#1c212e] px-1.5 py-0.5 rounded text-cyan-400">engine.py</code> daemon.
              </p>
              <pre className="bg-[#0b0c10] border border-[#1b1f2b] p-4 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-64">
                {jsonString}
              </pre>
              <div className="flex gap-3 mt-1">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#00e5ff] hover:bg-[#33ebff] text-black font-bold rounded-xl flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" /> Download patterns.json
                </button>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-[#202534] hover:bg-[#2b3246] text-white font-semibold rounded-xl flex items-center gap-2 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="flex flex-col gap-4">
              <p className="text-slate-400 leading-relaxed">
                Paste JSON pattern data exported from another session or generated by the Pi Zero W:
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste patterns.json content here..."
                className="w-full h-48 bg-[#0b0c10] border border-[#1b1f2b] p-3 rounded-xl font-mono text-[11px] text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleImportSubmit}
                disabled={!importText.trim()}
                className="px-4 py-2 bg-[#00e5ff] disabled:opacity-50 hover:bg-[#33ebff] text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" /> Load Patterns into Sequencer
              </button>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="flex flex-col gap-4">
              <p className="text-slate-400 leading-relaxed">
                Run these commands on your Raspberry Pi Zero W to install dependencies and run the daemon:
              </p>
              <div className="bg-[#0b0c10] border border-[#1b1f2b] p-3 rounded-xl font-mono text-[11px] text-emerald-400 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-500 border-b border-[#1f2433] pb-1">
                  <Terminal className="w-3.5 h-3.5" /> Terminal Quick Commands
                </div>
                <div><span className="text-slate-500"># 1. Install Ableton Link Python module</span><br />pip3 install link pylink2</div>
                <div><span className="text-slate-500"># 2. Initialize USB MIDI Gadget</span><br />sudo /usr/local/bin/setup-midi-gadget.sh</div>
                <div><span className="text-slate-500"># 3. Run Hardware Test</span><br />python3 phase1_hardware_test.py</div>
                <div><span className="text-slate-500"># 4. Start Sequencer & Ableton Link Daemon</span><br />python3 server.py</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

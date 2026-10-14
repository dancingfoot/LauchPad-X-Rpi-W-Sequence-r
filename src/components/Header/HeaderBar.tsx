import React, { useState } from 'react';
import { Play, Square, Sliders, HardDrive, Usb, Volume2, Radio } from 'lucide-react';
import { MidiDeviceOption, LinkState } from '../../types/sequencer';

interface HeaderBarProps {
  running: boolean;
  onTogglePlay: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  swing: number;
  onSwingChange: (swing: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  midiSupported: boolean;
  midiOutputs: MidiDeviceOption[];
  selectedMidiOutputId: string;
  onSelectMidiOutput: (id: string) => void;
  onOpenPiModal: (tab?: 'export' | 'import' | 'link' | 'setup') => void;
  linkState: LinkState;
  onToggleLink: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  running,
  onTogglePlay,
  bpm,
  onBpmChange,
  swing,
  onSwingChange,
  volume,
  onVolumeChange,
  midiSupported,
  midiOutputs,
  selectedMidiOutputId,
  onSelectMidiOutput,
  onOpenPiModal,
  linkState,
  onToggleLink,
}) => {
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const handleTapTempo = () => {
    const now = performance.now();
    const newTimes = [...tapTimes.slice(-3), now];
    setTapTimes(newTimes);

    if (newTimes.length >= 2) {
      const diffs: number[] = [];
      for (let i = 1; i < newTimes.length; i++) {
        diffs.push(newTimes[i] - newTimes[i - 1]);
      }
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      if (avgDiff > 0) {
        const calculatedBpm = Math.round(60000 / avgDiff);
        if (calculatedBpm >= 30 && calculatedBpm <= 300) {
          onBpmChange(calculatedBpm);
        }
      }
    }
  };

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0e1015] border-b border-[#1b1e27] text-slate-200">
      {/* Zone 1: Wordmark & Core Identity */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2979ff] to-[#00e5ff] flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-1.5 h-1.5 bg-black rounded-sm" />
            <div className="w-1.5 h-1.5 bg-black rounded-sm" />
            <div className="w-1.5 h-1.5 bg-black rounded-sm" />
            <div className="w-1.5 h-1.5 bg-black rounded-sm" />
          </div>
        </div>
        <div>
          <span className="text-base font-extrabold tracking-tight text-white whitespace-nowrap block">
            LAUNCHPAD X
          </span>
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block -mt-1">
            MIDI SEQUENCER STUDIO
          </span>
        </div>
      </div>

      {/* Zone 2: Transport, Tempo, Swing, Volume Controls */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Play / Stop Master Transport */}
        <button
          onClick={onTogglePlay}
          className={`px-4 py-2 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 active:scale-95 shadow-md ${
            running
              ? 'bg-[#00e676] text-black shadow-emerald-500/25 ring-2 ring-emerald-400'
              : 'bg-[#2979ff] hover:bg-[#3d88ff] text-white shadow-blue-500/20'
          }`}
        >
          {running ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" /> STOP
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" /> START
            </>
          )}
        </button>

        {/* Ableton Link Sync Button */}
        <button
          onClick={() => onOpenPiModal('link')}
          title={`Ableton Link: ${linkState.enabled ? `${linkState.peers} peer(s) connected` : 'Disabled'}. Click for settings.`}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border active:scale-95 ${
            linkState.enabled
              ? 'bg-[#1e152d] border-[#a855f7] text-[#d8b4fe] shadow-[0_0_12px_rgba(168,85,247,0.35)]'
              : 'bg-[#141720] border-[#252b3c] text-slate-500 hover:text-slate-300'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${linkState.enabled ? 'text-[#c084fc] animate-pulse' : 'text-slate-500'}`} />
          <span className="font-mono tracking-tight">
            LINK {linkState.enabled ? `· ${linkState.peers} PEER${linkState.peers === 1 ? '' : 'S'}` : 'OFF'}
          </span>
          {/* Phase Beat Metronome Dots (1-4) */}
          {linkState.enabled && (
            <div className="flex gap-1 ml-0.5">
              {[0, 1, 2, 3].map((b) => {
                const isActive = Math.floor(linkState.phase) === b;
                return (
                  <div
                    key={b}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      isActive ? 'bg-[#c084fc] scale-125 shadow-sm' : 'bg-purple-950'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </button>

        {/* BPM Counter & Tap */}
        <div className="flex items-center gap-2 bg-[#141720] px-3 py-1.5 rounded-xl border border-[#222736]">
          <span className="text-[11px] font-bold uppercase text-slate-400">BPM</span>
          <input
            type="number"
            min="30"
            max="300"
            value={bpm}
            onChange={(e) => onBpmChange(Math.max(30, Math.min(300, parseInt(e.target.value, 10) || 120)))}
            className="w-14 bg-transparent text-sm font-mono font-bold text-cyan-400 text-center focus:outline-none tabular-nums"
          />
          <button
            onClick={handleTapTempo}
            className="px-2 py-0.5 bg-[#202534] hover:bg-[#2b3246] text-[10px] font-bold text-slate-300 rounded border border-[#2d354a] active:scale-95"
          >
            TAP
          </button>
        </div>

        {/* Swing Percentage */}
        <div className="hidden lg:flex items-center gap-2 bg-[#141720] px-3 py-1.5 rounded-xl border border-[#222736]">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold uppercase text-slate-400">SWING</span>
          <span className="text-xs font-mono font-bold text-amber-400 w-8 text-right tabular-nums">
            {Math.round(swing * 100)}%
          </span>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.05"
            value={swing}
            onChange={(e) => onSwingChange(parseFloat(e.target.value))}
            className="w-16 h-1 bg-[#252b3c] rounded appearance-none cursor-pointer accent-[#ff9100]"
          />
        </div>

        {/* Master Output Volume */}
        <div className="hidden xl:flex items-center gap-2 bg-[#141720] px-3 py-1.5 rounded-xl border border-[#222736]">
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1 bg-[#252b3c] rounded appearance-none cursor-pointer accent-[#00e5ff]"
          />
        </div>
      </div>

      {/* Zone 3: Hardware MIDI Routing & Pi Config */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Web MIDI Output Select */}
        <div className="flex items-center gap-2 bg-[#141720] px-3 py-1.5 rounded-xl border border-[#222736]">
          <Usb className="w-3.5 h-3.5 text-cyan-400" />
          {midiSupported && midiOutputs.length > 0 ? (
            <select
              value={selectedMidiOutputId}
              onChange={(e) => onSelectMidiOutput(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              {midiOutputs.map((out) => (
                <option key={out.id} value={out.id} className="bg-[#141720] text-slate-200">
                  {out.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[11px] font-medium text-slate-400">
              Web Audio Synthesizer
            </span>
          )}
        </div>

        {/* Raspberry Pi Zero W Config & Link Sync Button */}
        <button
          onClick={() => onOpenPiModal('export')}
          className="px-3 py-2 bg-[#1b1f2b] hover:bg-[#252b3c] text-slate-200 border border-[#2d3448] rounded-xl text-xs font-semibold transition-all flex items-center gap-2 active:scale-95"
        >
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pi Zero W / Config</span>
        </button>
      </div>
    </header>
  );
};

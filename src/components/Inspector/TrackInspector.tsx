import React from 'react';
import { TrackData } from '../../types/sequencer';
import { generateEuclideanRhythm } from '../../utils/euclidean';
import { Sparkles, Trash2, Shuffle, VolumeX, ShieldAlert, Cpu } from 'lucide-react';

interface TrackInspectorProps {
  tracks: TrackData[];
  activeTrackId: number;
  setActiveTrackId: (id: number) => void;
  onUpdateTrack: (trackId: number, updates: Partial<TrackData>) => void;
  onApplyEuclidean: (trackId: number, hits: number, rotation: number) => void;
  onClearTrack: (trackId: number) => void;
  onRandomizeTrack: (trackId: number) => void;
}

export const TrackInspector: React.FC<TrackInspectorProps> = ({
  tracks,
  activeTrackId,
  setActiveTrackId,
  onUpdateTrack,
  onApplyEuclidean,
  onClearTrack,
  onRandomizeTrack,
}) => {
  const currentTrack = tracks[activeTrackId] || tracks[0];

  return (
    <div className="bg-[#101217] border border-[#1e222d] rounded-2xl p-5 flex flex-col justify-between h-full">
      {/* Track Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-[#1e222d] no-scrollbar">
        {tracks.map((track) => {
          const isSelected = track.id === activeTrackId;
          return (
            <button
              key={track.id}
              onClick={() => setActiveTrackId(track.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-white/10 text-white border-white/40 shadow-sm'
                  : 'bg-[#151821] text-slate-400 border-[#222736] hover:text-slate-200'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: track.colorHex }}
              />
              <span>{track.name}</span>
              {track.mute && <span className="text-[10px] text-red-400 font-mono">M</span>}
              {track.solo && <span className="text-[10px] text-emerald-400 font-mono">S</span>}
            </button>
          );
        })}
      </div>

      {/* Main Track Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Track State & Mute/Solo */}
        <div className="bg-[#0b0c10] border border-[#1a1d26] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Track Routing & State
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              MIDI CH {currentTrack.channel + 1}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => onUpdateTrack(currentTrack.id, { mute: !currentTrack.mute })}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                currentTrack.mute
                  ? 'bg-[#ff3344] text-black border-[#ff3344] shadow-[0_0_8px_rgba(255,51,68,0.5)]'
                  : 'bg-[#1b1e28] text-slate-400 border-[#2b3040] hover:text-white'
              }`}
            >
              <VolumeX className="w-3.5 h-3.5" /> {currentTrack.mute ? 'MUTED' : 'MUTE'}
            </button>

            <button
              onClick={() => onUpdateTrack(currentTrack.id, { solo: !currentTrack.solo })}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                currentTrack.solo
                  ? 'bg-[#00e676] text-black border-[#00e676] shadow-[0_0_8px_rgba(0,230,118,0.5)]'
                  : 'bg-[#1b1e28] text-slate-400 border-[#2b3040] hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> {currentTrack.solo ? 'SOLOED' : 'SOLO'}
            </button>
          </div>

          {/* Loop Length (Polymetric) */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Loop Length (Polymetric)</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {currentTrack.length} Steps
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="16"
              value={currentTrack.length}
              onChange={(e) => onUpdateTrack(currentTrack.id, { length: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-pointer accent-[#2979ff]"
            />
          </div>
        </div>

        {/* Euclidean Rhythm Generator */}
        <div className="bg-[#0b0c10] border border-[#1a1d26] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Euclidean Engine
            </span>
            <span className="text-[11px] font-mono text-purple-400">
              E({currentTrack.euclideanHits}, {currentTrack.length})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2.5">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                <span>Pulses</span>
                <span className="font-mono text-white">{currentTrack.euclideanHits}</span>
              </div>
              <input
                type="range"
                min="0"
                max={currentTrack.length}
                value={currentTrack.euclideanHits}
                onChange={(e) => onUpdateTrack(currentTrack.id, { euclideanHits: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-pointer accent-[#d500f9]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                <span>Rotation</span>
                <span className="font-mono text-white">{currentTrack.euclideanRotation}</span>
              </div>
              <input
                type="range"
                min="0"
                max={currentTrack.length - 1}
                value={currentTrack.euclideanRotation}
                onChange={(e) => onUpdateTrack(currentTrack.id, { euclideanRotation: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-pointer accent-[#d500f9]"
              />
            </div>
          </div>

          <button
            onClick={() => onApplyEuclidean(currentTrack.id, currentTrack.euclideanHits, currentTrack.euclideanRotation)}
            className="w-full py-1.5 px-3 bg-[#d500f9]/20 hover:bg-[#d500f9]/30 text-[#d500f9] border border-[#d500f9]/50 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5" /> Apply Euclidean Rhythm
          </button>
        </div>

        {/* Pattern Quick Tools */}
        <div className="bg-[#0b0c10] border border-[#1a1d26] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Pattern Utilities
            </span>
            <span className="text-[11px] font-mono text-slate-500">QUICK TOOLS</span>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => onRandomizeTrack(currentTrack.id)}
              className="py-1.5 px-3 bg-[#1e2330] hover:bg-[#282f42] text-slate-200 border border-[#2e364c] rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Shuffle className="w-3.5 h-3.5 text-cyan-400" /> Randomize Groove
            </button>

            <button
              onClick={() => onClearTrack(currentTrack.id)}
              className="py-1.5 px-3 bg-[#241518] hover:bg-[#331c20] text-rose-300 border border-[#482027] rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Clear Track Steps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

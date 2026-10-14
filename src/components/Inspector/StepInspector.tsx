import React from 'react';
import { TrackData } from '../../types/sequencer';
import { midiToNoteName } from '../../utils/scales';
import { Volume2, Percent, Sliders, Music } from 'lucide-react';

interface StepInspectorProps {
  track: TrackData;
  stepIdx: number | null;
  onUpdateStep: (trackId: number, stepIdx: number, updates: Partial<{ pitch: number; velocity: number; gate: number; probability: number; active: boolean }>) => void;
  onAudition: (track: TrackData, pitch: number) => void;
}

export const StepInspector: React.FC<StepInspectorProps> = ({
  track,
  stepIdx,
  onUpdateStep,
  onAudition,
}) => {
  if (stepIdx === null || !track.steps[stepIdx]) {
    return (
      <div className="bg-[#101217] border border-[#1e222d] rounded-2xl p-5 flex flex-col items-center justify-center text-center text-slate-500 h-full min-h-[220px]">
        <Sliders className="w-8 h-8 mb-2 text-slate-600" />
        <p className="text-sm font-semibold text-slate-400">Step Parameter Inspector</p>
        <p className="text-xs text-slate-600 mt-1 max-w-xs">
          Click any pad on the Launchpad X grid to inspect and fine-tune velocity, pitch, gate length, and trigger probability.
        </p>
      </div>
    );
  }

  const step = track.steps[stepIdx];

  return (
    <div className="bg-[#101217] border border-[#1e222d] rounded-2xl p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e222d] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3.5 h-3.5 rounded-full shadow-sm"
            style={{ backgroundColor: track.colorHex }}
          />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              {track.name} · Step {stepIdx + 1}
            </span>
            <span className="block text-[11px] font-mono text-slate-500">
              {step.active ? 'ACTIVE' : 'INACTIVE'} · {midiToNoteName(step.pitch)} (MIDI {step.pitch})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAudition(track, step.pitch)}
            title="Audition Step Sound"
            className="px-2.5 py-1 text-xs font-semibold bg-[#1a1e28] hover:bg-[#252b3a] text-slate-200 border border-[#2b3142] rounded-lg transition-all flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5" /> Audition
          </button>
          <button
            onClick={() => onUpdateStep(track.id, stepIdx, { active: !step.active })}
            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
              step.active
                ? 'bg-[#00e676]/20 border-[#00e676] text-[#00e676]'
                : 'bg-[#2a1317] border-[#5e1f29] text-[#ff3344]'
            }`}
          >
            {step.active ? 'MUTE STEP' : 'ACTIVATE'}
          </button>
        </div>
      </div>

      {/* Parameter Sliders Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pitch Parameter */}
        <div className="bg-[#0b0c10] border border-[#1a1d26] rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold">
              <Music className="w-3.5 h-3.5 text-blue-400" /> Pitch
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {midiToNoteName(step.pitch)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={() => onUpdateStep(track.id, stepIdx, { pitch: Math.max(12, step.pitch - 1) })}
              className="px-2 py-1 bg-[#1a1e28] text-xs font-mono font-bold text-slate-300 rounded hover:bg-[#282e3e]"
            >
              -1
            </button>
            <button
              onClick={() => onUpdateStep(track.id, stepIdx, { pitch: Math.max(12, step.pitch - 12) })}
              className="px-2 py-1 bg-[#1a1e28] text-xs font-mono font-bold text-slate-300 rounded hover:bg-[#282e3e]"
            >
              -Oct
            </button>
            <button
              onClick={() => onUpdateStep(track.id, stepIdx, { pitch: Math.min(108, step.pitch + 12) })}
              className="px-2 py-1 bg-[#1a1e28] text-xs font-mono font-bold text-slate-300 rounded hover:bg-[#282e3e]"
            >
              +Oct
            </button>
            <button
              onClick={() => onUpdateStep(track.id, stepIdx, { pitch: Math.min(108, step.pitch + 1) })}
              className="px-2 py-1 bg-[#1a1e28] text-xs font-mono font-bold text-slate-300 rounded hover:bg-[#282e3e]"
            >
              +1
            </button>
          </div>
        </div>

        {/* Velocity Parameter */}
        <div className="bg-[#0b0c10] border border-[#1a1d26] rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Velocity</span>
            <span className="font-mono font-bold text-amber-400 tabular-nums">
              {step.velocity}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="127"
            value={step.velocity}
            onChange={(e) => onUpdateStep(track.id, stepIdx, { velocity: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-pointer accent-[#ff9100]"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>Soft (40)</span>
            <span>Acc (120)</span>
          </div>
        </div>

        {/* Gate Length Parameter */}
        <div className="bg-[#0b0c10] border border-[#1a1d26] rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Gate Length</span>
            <span className="font-mono font-bold text-emerald-400 tabular-nums">
              {Math.round(step.gate * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={step.gate}
            onChange={(e) => onUpdateStep(track.id, stepIdx, { gate: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-pointer accent-[#00e676]"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>Staccato</span>
            <span>Tie / Legato</span>
          </div>
        </div>

        {/* Trigger Probability Parameter */}
        <div className="bg-[#0b0c10] border border-[#1a1d26] rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold">
              <Percent className="w-3.5 h-3.5 text-purple-400" /> Probability
            </span>
            <span className="font-mono font-bold text-purple-400 tabular-nums">
              {Math.round(step.probability * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={step.probability}
            onChange={(e) => onUpdateStep(track.id, stepIdx, { probability: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-[#202430] rounded-lg appearance-none cursor-pointer accent-[#d500f9]"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>Random</span>
            <span>Always (100%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Play, Square, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Radio } from 'lucide-react';

interface TopControlsProps {
  running: boolean;
  onTogglePlay: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  activePage: number;
  setActivePage: (page: number) => void;
  currentMode: 'session' | 'note' | 'custom';
  onSelectMode: (mode: 'session' | 'note' | 'custom') => void;
  dawModeActive?: boolean;
  onToggleDawMode?: () => void;
  onOctaveShift?: (delta: number) => void;
}

export const TopControls: React.FC<TopControlsProps> = ({
  running,
  onTogglePlay,
  bpm,
  onBpmChange,
  activePage,
  setActivePage,
  currentMode,
  onSelectMode,
  onOctaveShift,
}) => {
  return (
    <div className="grid grid-cols-9 gap-2.5 items-center justify-items-center mb-3.5 px-1">
      {/* CC 91: Up (Octave Shift Up or Tempo Up) */}
      <button
        onClick={() => {
          if (onOctaveShift) onOctaveShift(1);
          else onBpmChange(Math.min(300, bpm + 2));
        }}
        title="Octave Up / Tempo Up"
        className="w-12 h-7 rounded-full bg-[#1b1e26] hover:bg-[#282d3a] border border-[#2e3342] active:scale-95 transition-all flex items-center justify-center text-slate-400 hover:text-white"
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      {/* CC 92: Down (Octave Shift Down or Tempo Down) */}
      <button
        onClick={() => {
          if (onOctaveShift) onOctaveShift(-1);
          else onBpmChange(Math.max(20, bpm - 2));
        }}
        title="Octave Down / Tempo Down"
        className="w-12 h-7 rounded-full bg-[#1b1e26] hover:bg-[#282d3a] border border-[#2e3342] active:scale-95 transition-all flex items-center justify-center text-slate-400 hover:text-white"
      >
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* CC 93: Left (Previous Page: Steps 1-8) */}
      <button
        onClick={() => setActivePage(0)}
        title="Page 1 (Steps 1-8)"
        className={`w-12 h-7 rounded-full border active:scale-95 transition-all flex items-center justify-center ${
          activePage === 0
            ? 'bg-[#2979ff]/20 border-[#2979ff] text-[#2979ff]'
            : 'bg-[#1b1e26] hover:bg-[#282d3a] border-[#2e3342] text-slate-400 hover:text-white'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* CC 94: Right (Next Page: Steps 9-16) */}
      <button
        onClick={() => setActivePage(1)}
        title="Page 2 (Steps 9-16)"
        className={`w-12 h-7 rounded-full border active:scale-95 transition-all flex items-center justify-center ${
          activePage === 1
            ? 'bg-[#2979ff]/20 border-[#2979ff] text-[#2979ff]'
            : 'bg-[#1b1e26] hover:bg-[#282d3a] border-[#2e3342] text-slate-400 hover:text-white'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* CC 95: Launchpad Hardware SESSION / MIXER Button */}
      <button
        onClick={() => onSelectMode('session')}
        title="SESSION / MIXER (Sequencer Mode): 8-Track step sequencer grid"
        className={`w-12 h-7 rounded-full border active:scale-95 transition-all flex flex-col items-center justify-center text-[8px] font-bold tracking-tight ${
          currentMode === 'session'
            ? 'bg-[#00e5ff] text-black border-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.7)]'
            : 'bg-[#18202c] hover:bg-[#222e40] border-[#2a3c56] text-[#00e5ff]'
        }`}
      >
        <span className="leading-none">SESSION</span>
        <span className="text-[6.5px] opacity-80 leading-none">DAW</span>
      </button>

      {/* CC 96: Launchpad Hardware NOTE Mode Button */}
      <button
        onClick={() => onSelectMode('note')}
        title="Hardware Note Mode: Play melodic notes and scales directly on pads"
        className={`w-12 h-7 rounded-full border active:scale-95 transition-all flex items-center justify-center text-[9px] font-bold tracking-tight ${
          currentMode === 'note'
            ? 'bg-[#d500f9] text-white border-[#d500f9] shadow-[0_0_12px_rgba(213,0,249,0.7)]'
            : 'bg-[#1b1726] hover:bg-[#261f36] border-[#372852] text-[#d500f9]'
        }`}
      >
        NOTE
      </button>

      {/* CC 97: Launchpad Hardware CUSTOM Mode Button */}
      <button
        onClick={() => onSelectMode('custom')}
        title="Hardware Custom Mode: Launchpad custom user layout mapping"
        className={`w-12 h-7 rounded-full border active:scale-95 transition-all flex items-center justify-center text-[9px] font-bold tracking-tight ${
          currentMode === 'custom'
            ? 'bg-[#ff9100] text-black border-[#ff9100] shadow-[0_0_12px_rgba(255,145,0,0.7)]'
            : 'bg-[#251d14] hover:bg-[#362718] border-[#4f361a] text-[#ff9100]'
        }`}
      >
        CUSTOM
      </button>

      {/* CC 98: Record / Capture MIDI Transport Button */}
      <button
        onClick={onTogglePlay}
        title={running ? 'Stop Sequencer' : 'Start Sequencer'}
        className={`w-12 h-7 rounded-full border active:scale-95 transition-all flex items-center justify-center text-[9px] font-bold ${
          running
            ? 'bg-[#00e676] text-black border-[#00e676] shadow-[0_0_12px_rgba(0,230,118,0.7)]'
            : 'bg-[#2a1317] hover:bg-[#3d181e] border-[#5e1f29] text-[#ff3344]'
        }`}
      >
        {running ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
      </button>

      {/* Current Page Well */}
      <div className="w-12 h-7 flex items-center justify-center text-[9px] uppercase font-mono tracking-wider text-slate-500 bg-[#0f1116] rounded-full border border-[#1b1e26]">
        P{activePage + 1}
      </div>
    </div>
  );
};

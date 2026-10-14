import React from 'react';
import { ViewMode } from '../../types/sequencer';
import { Play, Square, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Grid3X3, Music, Sparkles } from 'lucide-react';

interface TopControlsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  running: boolean;
  onTogglePlay: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  activePage: number;
  setActivePage: (page: number) => void;
}

export const TopControls: React.FC<TopControlsProps> = ({
  viewMode,
  setViewMode,
  running,
  onTogglePlay,
  bpm,
  onBpmChange,
  activePage,
  setActivePage,
}) => {
  return (
    <div className="grid grid-cols-9 gap-2.5 items-center justify-items-center mb-3.5 px-1">
      {/* CC 91: Up (Tempo +2) */}
      <button
        onClick={() => onBpmChange(Math.min(300, bpm + 2))}
        title="Tempo Up (+2 BPM)"
        className="w-12 h-7 rounded-full bg-[#1b1e26] hover:bg-[#282d3a] border border-[#2e3342] active:scale-95 transition-all flex items-center justify-center text-slate-400 hover:text-white"
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      {/* CC 92: Down (Tempo -2) */}
      <button
        onClick={() => onBpmChange(Math.max(20, bpm - 2))}
        title="Tempo Down (-2 BPM)"
        className="w-12 h-7 rounded-full bg-[#1b1e26] hover:bg-[#282d3a] border border-[#2e3342] active:scale-95 transition-all flex items-center justify-center text-slate-400 hover:text-white"
      >
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* CC 93: Left (Previous Page) */}
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

      {/* CC 94: Right (Next Page) */}
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

      {/* CC 95: Session (Multi-track Overview) */}
      <button
        onClick={() => setViewMode('multitrack')}
        title="Session / 8-Track Grid Mode"
        className={`w-12 h-7 rounded-full border active:scale-95 transition-all flex items-center justify-center text-[11px] font-bold ${
          viewMode === 'multitrack'
            ? 'bg-[#00e5ff] text-black border-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.6)]'
            : 'bg-[#1b1e26] hover:bg-[#282d3a] border-[#2e3342] text-slate-400 hover:text-white'
        }`}
      >
        <Grid3X3 className="w-3.5 h-3.5" />
      </button>

      {/* CC 96: Note (Single Track Deep Edit) */}
      <button
        onClick={() => setViewMode('singletrack')}
        title="Note / Single-Track Melodic Mode"
        className={`w-12 h-7 rounded-full border active:scale-95 transition-all flex items-center justify-center text-[11px] font-bold ${
          viewMode === 'singletrack'
            ? 'bg-[#ffd000] text-black border-[#ffd000] shadow-[0_0_10px_rgba(255,208,0,0.6)]'
            : 'bg-[#1b1e26] hover:bg-[#282d3a] border-[#2e3342] text-slate-400 hover:text-white'
        }`}
      >
        <Music className="w-3.5 h-3.5" />
      </button>

      {/* CC 97: Custom (Euclidean Rhythm Engine) */}
      <button
        onClick={() => setViewMode('euclidean')}
        title="Custom / Euclidean Algorithmic Mode"
        className={`w-12 h-7 rounded-full border active:scale-95 transition-all flex items-center justify-center text-[11px] font-bold ${
          viewMode === 'euclidean'
            ? 'bg-[#d500f9] text-white border-[#d500f9] shadow-[0_0_10px_rgba(213,0,249,0.6)]'
            : 'bg-[#1b1e26] hover:bg-[#282d3a] border-[#2e3342] text-slate-400 hover:text-white'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
      </button>

      {/* CC 98: Record / Play Button (Master Transport) */}
      <button
        onClick={onTogglePlay}
        title={running ? 'Stop Sequencer' : 'Start Sequencer'}
        className={`w-12 h-7 rounded-full border active:scale-95 transition-all flex items-center justify-center text-[10px] font-bold ${
          running
            ? 'bg-[#00e676] text-black border-[#00e676] shadow-[0_0_12px_rgba(0,230,118,0.7)] animate-pulse'
            : 'bg-[#2a1317] hover:bg-[#3d181e] border-[#5e1f29] text-[#ff3344]'
        }`}
      >
        {running ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
      </button>

      {/* Status indicator blank well */}
      <div className="w-12 h-7 flex items-center justify-center text-[9px] uppercase font-mono tracking-wider text-slate-500">
        PAGE {activePage + 1}
      </div>
    </div>
  );
};

import React from 'react';
import { TrackData, ViewMode, InactivePadStyle } from '../../types/sequencer';
import { TopControls } from './TopControls';
import { PadGrid } from './PadGrid';
import { SceneButtons } from './SceneButtons';
import { Grid3X3, Music, Sparkles } from 'lucide-react';

interface ChassisProps {
  tracks: TrackData[];
  currentStep: number;
  running: boolean;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  onTogglePlay: () => void;
  activePage: number;
  setActivePage: (page: number) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeTrackId: number;
  setActiveTrackId: (id: number) => void;
  selectedStepIdx: number | null;
  onToggleStep: (trackId: number, stepIdx: number) => void;
  onSelectStep: (trackId: number, stepIdx: number) => void;
  onAuditionTrack: (track: TrackData, pitch?: number) => void;
  onClearTrack: (id: number) => void;
  onToggleMuteAll: () => void;
  dawModeActive: boolean;
  onToggleDawMode: () => void;
  currentMode: 'session' | 'note' | 'custom';
  onSelectMode: (mode: 'session' | 'note' | 'custom') => void;
  inactivePadStyle: InactivePadStyle;
  onInactivePadStyleChange: (style: InactivePadStyle) => void;
  onSceneButtonAction?: (sceneIndex: number) => void;
}

export const Chassis: React.FC<ChassisProps> = ({
  tracks,
  currentStep,
  running,
  bpm,
  onBpmChange,
  onTogglePlay,
  activePage,
  setActivePage,
  viewMode,
  setViewMode,
  activeTrackId,
  setActiveTrackId,
  selectedStepIdx,
  onToggleStep,
  onSelectStep,
  onAuditionTrack,
  onClearTrack,
  onToggleMuteAll,
  dawModeActive,
  onToggleDawMode,
  currentMode,
  onSelectMode,
  inactivePadStyle,
  onInactivePadStyleChange,
  onSceneButtonAction,
}) => {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Sequencer Toolbar: View Mode & Inactive Pad Glow Switchers */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Sequencer View Mode Switcher (Independent of hardware mode buttons) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#12151d] rounded-xl border border-[#202534] shadow-md">
        <button
          onClick={() => setViewMode('multitrack')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            viewMode === 'multitrack'
              ? 'bg-[#00e5ff] text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          <span>8-Track Grid</span>
        </button>

        <button
          onClick={() => setViewMode('singletrack')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            viewMode === 'singletrack'
              ? 'bg-[#ffd000] text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>64-Step Melodic</span>
        </button>

        <button
          onClick={() => setViewMode('euclidean')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            viewMode === 'euclidean'
              ? 'bg-[#d500f9] text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Euclidean Engine</span>
        </button>
      </div>

      {/* Inactive Pad Style Toggle: OFF vs FADED */}
      <div className="flex items-center gap-1 p-1 bg-[#12151d] rounded-xl border border-[#202534] shadow-md">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
          Unused Pads:
        </span>
        <button
          onClick={() => onInactivePadStyleChange('off')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            inactivePadStyle === 'off'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Turn unused steps completely unlit/off"
        >
          OFF
        </button>
        <button
          onClick={() => onInactivePadStyleChange('faded')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            inactivePadStyle === 'faded'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Dim unused steps in row track color"
        >
          FADED
        </button>
      </div>
    </div>

      {/* Physical Launchpad X Chassis */}
      <div className="relative inline-block p-6 rounded-[28px] bg-[#12141a] border-4 border-[#0c0d12] chassis-bevel shadow-2xl select-none max-w-full">
        {/* Top Brand Debossing */}
        <div className="flex items-center justify-between px-2 mb-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-extrabold tracking-wider">NOVATION</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-medium">LAUNCHPAD X</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-tight">
            <span className={currentMode === 'session' ? 'text-cyan-400 font-bold' : currentMode === 'note' ? 'text-purple-400 font-bold' : 'text-amber-400 font-bold'}>
              {currentMode === 'session' ? '● SESSION / DAW MODE' : currentMode === 'note' ? '● NOTE MODE (SCALES)' : '● CUSTOM USER MODE'}
            </span>
            <button
              onClick={() => onSelectMode('session')}
              title="Force return to Session Mode and refresh all lights"
              className="px-2 py-0.5 bg-[#1f2533] hover:bg-[#2c3447] text-cyan-300 rounded text-[9px] font-bold border border-[#2d374d] active:scale-95 transition-all"
            >
              RESYNC LIGHTS
            </button>
          </div>
        </div>

        {/* Top Oval CC Controls */}
        <TopControls
          running={running}
          onTogglePlay={onTogglePlay}
          bpm={bpm}
          onBpmChange={onBpmChange}
          activePage={activePage}
          setActivePage={setActivePage}
          currentMode={currentMode}
          onSelectMode={onSelectMode}
          dawModeActive={dawModeActive}
          onToggleDawMode={onToggleDawMode}
        />

        {/* Main Surface: 8x8 Silicone Matrix + Right Scene Buttons */}
        <div className="flex gap-3 bg-[#0a0b0e] p-3 rounded-2xl border border-[#1e222d] shadow-inner">
          {/* 8x8 Pad Grid */}
          <div className="flex-1">
            <PadGrid
              tracks={tracks}
              currentStep={currentStep}
              running={running}
              activePage={activePage}
              viewMode={viewMode}
              activeTrackId={activeTrackId}
              selectedStepIdx={selectedStepIdx}
              onToggleStep={onToggleStep}
              onSelectStep={onSelectStep}
              onAuditionTrack={onAuditionTrack}
              inactivePadStyle={inactivePadStyle}
            />
          </div>

          {/* Right Scene Launch Column */}
          <SceneButtons
            activePage={activePage}
            setActivePage={setActivePage}
            activeTrackId={activeTrackId}
            setActiveTrackId={setActiveTrackId}
            onClearTrack={onClearTrack}
            onToggleMuteAll={onToggleMuteAll}
            onSceneButtonAction={onSceneButtonAction}
            running={running}
            isAnyMuted={tracks.some((t) => t.mute)}
            isAnySoloed={tracks.some((t) => t.solo)}
          />
        </div>

        {/* Bottom Track Indicator Strip */}
        <div className="grid grid-cols-8 gap-2 mt-3 px-3 text-center">
          {tracks.map((t, i) => (
            <div
              key={t.id}
              onClick={() => setActiveTrackId(t.id)}
              className={`cursor-pointer transition-all rounded py-1 px-0.5 text-[9px] font-bold uppercase truncate border ${
                activeTrackId === t.id
                  ? 'bg-white/10 border-white/40 text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <span style={{ color: t.colorHex }}>●</span> {i + 1}. {t.name.split(' ')[0]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

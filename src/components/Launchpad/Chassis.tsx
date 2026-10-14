import React from 'react';
import { TrackData, ViewMode } from '../../types/sequencer';
import { TopControls } from './TopControls';
import { PadGrid } from './PadGrid';
import { SceneButtons } from './SceneButtons';

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
}) => {
  return (
    <div className="relative inline-block p-6 rounded-[28px] bg-[#12141a] border-4 border-[#0c0d12] chassis-bevel shadow-2xl select-none max-w-full">
      {/* Top Brand Debossing */}
      <div className="flex items-center justify-between px-2 mb-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-extrabold tracking-wider">NOVATION</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-medium">LAUNCHPAD X</span>
        </div>
        <div className="text-[10px] font-mono text-slate-600 tracking-tight">
          PROGRAMMER MODE · USB MIDI
        </div>
      </div>

      {/* Top Oval CC Controls */}
      <TopControls
        viewMode={viewMode}
        setViewMode={setViewMode}
        running={running}
        onTogglePlay={onTogglePlay}
        bpm={bpm}
        onBpmChange={onBpmChange}
        activePage={activePage}
        setActivePage={setActivePage}
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
  );
};

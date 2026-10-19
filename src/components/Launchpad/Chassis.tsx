import React, { useState } from 'react';
import { TrackData, ViewMode, InactivePadStyle } from '../../types/sequencer';
import { TopControls } from './TopControls';
import { PadGrid } from './PadGrid';
import { SceneButtons } from './SceneButtons';
import { Grid3X3, Music, Sparkles, Palette, X } from 'lucide-react';
import { LPX_PALETTE_PRESETS } from '../../utils/colors';

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
  onUpdateTrack?: (trackId: number, updates: Partial<TrackData>) => void;
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
  onUpdateTrack,
}) => {
  const [colorPickerTrackId, setColorPickerTrackId] = useState<number | null>(null);
  const [isAllColorsModalOpen, setIsAllColorsModalOpen] = useState<boolean>(false);
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Sequencer Toolbar: View Mode, Inactive Pad Glow, and Row Colors */}
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

        {/* Quick Row Colors Customizer Modal Button */}
        <button
          onClick={() => setIsAllColorsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#12151d] hover:bg-[#1c212f] border border-[#202534] text-xs font-bold text-cyan-300 hover:text-white transition-all shadow-md active:scale-95"
          title="Customize the LED colors of each row"
        >
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          <span>Row Colors</span>
        </button>
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

        {/* Main Surface: Left Row Headers + 8x8 Silicone Matrix + Right Scene Buttons */}
        <div className="flex gap-3 bg-[#0a0b0e] p-3 rounded-2xl border border-[#1e222d] shadow-inner items-start relative">
          {/* Left Row Track Indicators & Quick Color Pickers */}
          <div className="flex flex-col gap-2 justify-between">
            {tracks.map((track) => {
              const isSelected = activeTrackId === track.id;
              const isPickerOpen = colorPickerTrackId === track.id;
              return (
                <div key={track.id} className="relative">
                  <div
                    onClick={() => setActiveTrackId(track.id)}
                    className={`w-16 h-12 rounded-lg border flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white/10 border-white/40 shadow-sm'
                        : 'bg-[#13161f] border-[#202534] hover:bg-[#1a1e2b]'
                    }`}
                    title={`${track.name} (Track ${track.id + 1}) - Click to select, click color dot to change row color`}
                  >
                    <div className="flex items-center gap-1 leading-none mb-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setColorPickerTrackId(isPickerOpen ? null : track.id);
                        }}
                        style={{ backgroundColor: track.colorHex }}
                        className="w-3 h-3 rounded-full hover:scale-125 transition-transform ring-1 ring-white/30 cursor-pointer"
                        title="Click to change this row's color"
                      />
                      <span className="text-[8px] font-mono font-bold text-slate-300">
                        T{track.id + 1}
                      </span>
                    </div>
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase truncate max-w-full">
                      {track.name.split(' ')[0]}
                    </span>
                  </div>

                  {/* Inline Color Palette Popover for this row */}
                  {isPickerOpen && (
                    <div className="absolute left-full top-0 ml-2 z-50 bg-[#161922] border border-[#2e3549] rounded-xl p-2.5 shadow-2xl flex flex-col gap-2 w-48">
                      <div className="flex items-center justify-between border-b border-[#242b3b] pb-1.5">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          Row {track.id + 1} Color
                        </span>
                        <button
                          onClick={() => setColorPickerTrackId(null)}
                          className="text-slate-400 hover:text-white p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {LPX_PALETTE_PRESETS.map((p) => (
                          <button
                            key={p.paletteIndex}
                            onClick={() => {
                              if (onUpdateTrack) {
                                onUpdateTrack(track.id, {
                                  colorHex: p.colorHex,
                                  colorDimHex: p.colorDimHex,
                                  paletteIndex: p.paletteIndex,
                                });
                              }
                              setColorPickerTrackId(null);
                            }}
                            title={`${p.name} (LPX #${p.paletteIndex})`}
                            style={{ backgroundColor: p.colorHex }}
                            className={`w-5 h-5 rounded-full hover:scale-110 active:scale-95 transition-all ring-1 ring-white/20 ${
                              track.paletteIndex === p.paletteIndex ? 'ring-2 ring-white scale-110' : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

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
            activeTrackMuted={tracks[activeTrackId]?.mute}
            activeTrackSoloed={tracks[activeTrackId]?.solo}
            viewMode={viewMode}
          />
        </div>

        {/* Bottom Track Indicator Strip */}
        <div className="grid grid-cols-8 gap-2 mt-3 px-3 text-center">
          {tracks.map((t, i) => (
            <div
              key={t.id}
              onClick={() => setActiveTrackId(t.id)}
              className={`cursor-pointer transition-all rounded py-1 px-0.5 text-[9px] font-bold uppercase truncate border flex items-center justify-center gap-1.5 ${
                activeTrackId === t.id
                  ? 'bg-white/10 border-white/40 text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setColorPickerTrackId(colorPickerTrackId === t.id ? null : t.id);
                }}
                style={{ backgroundColor: t.colorHex }}
                className="w-2.5 h-2.5 rounded-full ring-1 ring-white/30 hover:scale-125 transition-transform"
                title="Change row color"
              />
              <span>{i + 1}. {t.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All Row Colors Customizer Modal */}
      {isAllColorsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12151d] border border-[#23293a] rounded-2xl p-6 max-w-xl w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#202636] pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Customize Row Colors</h3>
              </div>
              <button
                onClick={() => setIsAllColorsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select any row below to change its physical Novation Launchpad X LED color and UI color theme:
            </p>

            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-[#0b0c10] border border-[#1b1f2b] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full ring-1 ring-white/40"
                      style={{ backgroundColor: track.colorHex }}
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Row {track.id + 1}: {track.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        MIDI CH {track.channel + 1} · Palette #{track.paletteIndex}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {LPX_PALETTE_PRESETS.map((p) => {
                      const isSelected = track.paletteIndex === p.paletteIndex;
                      return (
                        <button
                          key={p.paletteIndex}
                          onClick={() => {
                            if (onUpdateTrack) {
                              onUpdateTrack(track.id, {
                                colorHex: p.colorHex,
                                colorDimHex: p.colorDimHex,
                                paletteIndex: p.paletteIndex,
                              });
                            }
                          }}
                          title={`${p.name} (LPX #${p.paletteIndex})`}
                          style={{
                            backgroundColor: p.colorHex,
                            boxShadow: isSelected ? `0 0 8px ${p.colorHex}` : 'none',
                          }}
                          className={`w-5 h-5 rounded-full transition-transform active:scale-90 cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-white scale-110'
                              : 'opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#202636]">
              <button
                onClick={() => setIsAllColorsModalOpen(false)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

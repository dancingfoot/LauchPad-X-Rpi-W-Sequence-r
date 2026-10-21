import React from 'react';
import { TrackData, ViewMode, InactivePadStyle } from '../../types/sequencer';
import { midiToNoteName } from '../../utils/scales';

interface PadGridProps {
  tracks: TrackData[];
  currentStep: number;
  running: boolean;
  activePage: number;
  viewMode: ViewMode;
  activeTrackId: number;
  selectedStepIdx: number | null;
  onToggleStep: (trackId: number, stepIdx: number) => void;
  onSelectStep: (trackId: number, stepIdx: number) => void;
  onAuditionTrack: (track: TrackData, pitch?: number) => void;
  inactivePadStyle?: InactivePadStyle;
}

export const PadGrid: React.FC<PadGridProps> = ({
  tracks,
  currentStep,
  running,
  activePage,
  viewMode,
  activeTrackId,
  selectedStepIdx,
  onToggleStep,
  onSelectStep,
  onAuditionTrack,
  inactivePadStyle = 'off',
}) => {
  const pageOffset = activePage * 8;
  const currentStepInPage = currentStep % 8;
  const isPlayheadInCurrentPage = Math.floor((currentStep % 16) / 8) === activePage;

  if (viewMode === 'singletrack') {
    // 64-step Single Track Mode
    const track = tracks[activeTrackId] || tracks[0];
    return (
      <div className="grid grid-cols-8 grid-rows-8 gap-2 w-full h-full">
        {Array.from({ length: 64 }).map((_, padIdx) => {
          const isWithinLength = padIdx < track.length;
          const step = isWithinLength ? track.steps[padIdx] : undefined;
          const isPlayhead = running && (currentStep % track.length === padIdx);
          const isSelected = selectedStepIdx === padIdx;
          const isInactive = !step?.active;

          return (
            <button
              key={padIdx}
              disabled={!isWithinLength}
              onClick={() => {
                if (isWithinLength) {
                  onToggleStep(track.id, padIdx);
                  onSelectStep(track.id, padIdx);
                }
              }}
              style={{
                backgroundColor: step?.active
                  ? track.colorHex
                  : isWithinLength
                  ? (inactivePadStyle === 'off' ? '#12141c' : track.colorDimHex)
                  : '#0b0c10',
                boxShadow: step?.active
                  ? `0 0 14px ${track.colorHex}99, inset 0 2px 4px rgba(255,255,255,0.4)`
                  : 'inset 0 1px 2px rgba(255,255,255,0.03)',
                borderColor: isPlayhead
                  ? '#ffffff'
                  : isSelected
                  ? '#ffffff'
                  : '#20232d',
                opacity: isWithinLength ? 1 : 0.35,
              }}
              className={`w-12 h-12 rounded-lg border active:scale-95 transition-all flex flex-col items-center justify-center relative ${
                isWithinLength ? 'cursor-pointer' : 'cursor-not-allowed'
              } ${
                isPlayhead ? 'ring-2 ring-white ring-offset-1 ring-offset-black z-10' : ''
              } ${isSelected ? 'outline outline-2 outline-white' : ''}`}
            >
              <span className={`text-[9px] font-mono font-bold ${step?.active ? 'text-black' : isInactive && inactivePadStyle === 'off' ? 'text-slate-600' : 'text-slate-500'}`}>
                {padIdx + 1}
              </span>
              {step?.active && (
                <span className="text-[8px] font-bold text-black/80">
                  {midiToNoteName(step.pitch)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (viewMode === 'sendA' || viewMode === 'sendB') {
    // 4-Track 16-Step Expanded Melodic Mode (64 pads = 4 tracks x 16 steps)
    // sendA: tracks 0..3 (Instruments 1 to 4)
    // sendB: tracks 4..7 (Instruments 5 to 8)
    const trackOffset = viewMode === 'sendA' ? 0 : 4;
    const selectedTracks = tracks.slice(trackOffset, trackOffset + 4);

    return (
      <div className="grid grid-cols-8 grid-rows-8 gap-2 w-full h-full">
        {selectedTracks.map((track) => {
          // Each track occupies 2 rows of 8 pads = 16 steps total
          // Row A (rowPart = 0): steps 0..7
          // Row B (rowPart = 1): steps 8..15
          return [0, 1].map((rowPart) => {
            return Array.from({ length: 8 }).map((_, colIdx) => {
              const stepIdx = rowPart * 8 + colIdx;
              const step = track.steps[stepIdx];
              const isPlayhead = running && (currentStep % track.length === stepIdx);
              const isSelected = activeTrackId === track.id && selectedStepIdx === stepIdx;
              const isActive = step?.active;
              const isTrackMuted = track.mute;
              const velocityRatio = step ? step.velocity / 127 : 0.8;
              const dynamicOpacity = 0.5 + velocityRatio * 0.5;

              return (
                <button
                  key={`${track.id}-${stepIdx}`}
                  onClick={() => {
                    onToggleStep(track.id, stepIdx);
                    onSelectStep(track.id, stepIdx);
                    if (!isActive) {
                      onAuditionTrack(track, step?.pitch);
                    }
                  }}
                  title={`${track.name} - Step ${stepIdx + 1} (${isActive ? midiToNoteName(step.pitch) : 'Off'})`}
                  style={{
                    backgroundColor: isTrackMuted
                      ? '#1c1e26'
                      : isActive
                      ? track.colorHex
                      : (inactivePadStyle === 'off' ? '#12141c' : track.colorDimHex),
                    opacity: isTrackMuted ? 0.35 : dynamicOpacity,
                    boxShadow: isActive && !isTrackMuted
                      ? `0 0 16px ${track.colorHex}aa, inset 0 2px 4px rgba(255,255,255,0.4)`
                      : 'inset 0 1px 2px rgba(255,255,255,0.03)',
                    borderColor: isPlayhead
                      ? '#ffffff'
                      : isSelected
                      ? '#ffffff'
                      : '#20232d',
                  }}
                  className={`w-12 h-12 rounded-lg border active:scale-95 transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                    isPlayhead ? 'ring-2 ring-white ring-offset-1 ring-offset-black z-10 scale-105' : ''
                  } ${isSelected ? 'outline outline-2 outline-white' : ''}`}
                >
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <span
                      className={`text-[9px] font-mono font-bold leading-none ${
                        isActive
                          ? 'text-black font-extrabold'
                          : inactivePadStyle === 'off'
                          ? 'text-slate-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {stepIdx + 1}
                    </span>
                    {isActive && (
                      <span className="text-[8px] font-mono font-bold text-black/85 leading-tight mt-0.5">
                        {midiToNoteName(step.pitch)}
                      </span>
                    )}
                  </div>

                  {isActive && step.velocity > 100 && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                  )}
                </button>
              );
            });
          });
        })}
      </div>
    );
  }

  if (viewMode === 'euclidean') {
    // Euclidean Pattern Visualization Mode
    return (
      <div className="grid grid-cols-8 grid-rows-8 gap-2 w-full h-full">
        {tracks.map((track) => {
          return Array.from({ length: 8 }).map((_, colIdx) => {
            const stepIdx = pageOffset + colIdx;
            const step = track.steps[stepIdx];
            const isPlayhead = running && isPlayheadInCurrentPage && currentStepInPage === colIdx;
            const isHit = step?.active;

            return (
              <button
                key={`${track.id}-${colIdx}`}
                onClick={() => {
                  onToggleStep(track.id, stepIdx);
                  onSelectStep(track.id, stepIdx);
                }}
                style={{
                  backgroundColor: isHit
                    ? track.colorHex
                    : (inactivePadStyle === 'off' ? '#12141c' : track.colorDimHex),
                  boxShadow: isHit
                    ? `0 0 16px ${track.colorHex}aa, inset 0 2px 4px rgba(255,255,255,0.5)`
                    : 'inset 0 1px 2px rgba(255,255,255,0.03)',
                  borderColor: isPlayhead ? '#ffffff' : '#20232d',
                }}
                className={`w-12 h-12 rounded-lg border active:scale-95 transition-all flex flex-col items-center justify-center relative ${
                  isPlayhead ? 'ring-2 ring-white ring-offset-1 ring-offset-black z-10 scale-105' : ''
                }`}
              >
                <span className={`text-[9px] font-mono font-bold ${isHit ? 'text-black' : inactivePadStyle === 'off' ? 'text-slate-600' : 'text-slate-400'}`}>
                  {track.name.slice(0, 3)}
                </span>
                <span className={`text-[8px] font-mono ${isHit ? 'text-black/80' : inactivePadStyle === 'off' ? 'text-slate-700' : 'text-slate-600'}`}>
                  {stepIdx + 1}
                </span>
              </button>
            );
          });
        })}
      </div>
    );
  }

  // Standard Multi-Track 8x8 Mode (8 Tracks x 8 Steps on active page)
  return (
    <div className="grid grid-cols-8 grid-rows-8 gap-2 w-full h-full">
      {tracks.map((track) => {
        return Array.from({ length: 8 }).map((_, colIdx) => {
          const stepIdx = pageOffset + colIdx;
          const step = track.steps[stepIdx];
          const isPlayhead = running && isPlayheadInCurrentPage && currentStepInPage === colIdx;
          const isSelected = activeTrackId === track.id && selectedStepIdx === stepIdx;
          const isActive = step?.active;
          const isTrackMuted = track.mute;

          // Velocity modulates brightness
          const velocityRatio = step ? step.velocity / 127 : 0.8;
          const dynamicOpacity = 0.5 + velocityRatio * 0.5;

          return (
            <button
              key={`${track.id}-${colIdx}`}
              onClick={() => {
                onToggleStep(track.id, stepIdx);
                onSelectStep(track.id, stepIdx);
                if (!isActive) {
                  onAuditionTrack(track, step?.pitch);
                }
              }}
              title={`${track.name} - Step ${stepIdx + 1} (${isActive ? midiToNoteName(step.pitch) : 'Off'})`}
              style={{
                backgroundColor: isTrackMuted
                  ? '#1c1e26'
                  : isActive
                  ? track.colorHex
                  : (inactivePadStyle === 'off' ? '#12141c' : track.colorDimHex),
                opacity: isTrackMuted ? 0.35 : dynamicOpacity,
                boxShadow: isActive && !isTrackMuted
                  ? `0 0 16px ${track.colorHex}aa, inset 0 2px 4px rgba(255,255,255,0.4)`
                  : 'inset 0 1px 2px rgba(255,255,255,0.03)',
                borderColor: isPlayhead
                  ? '#ffffff'
                  : isSelected
                  ? '#ffffff'
                  : '#20232d',
              }}
              className={`w-12 h-12 rounded-lg border active:scale-95 transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                isPlayhead ? 'ring-2 ring-white ring-offset-1 ring-offset-black z-10 scale-105' : ''
              } ${isSelected ? 'outline outline-2 outline-white' : ''}`}
            >
              {/* Pad step number / pitch micro-tag */}
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <span
                  className={`text-[9px] font-mono font-bold leading-none ${
                    isActive
                      ? 'text-black font-extrabold'
                      : inactivePadStyle === 'off'
                      ? 'text-slate-600'
                      : 'text-slate-400'
                  }`}
                >
                  {colIdx + 1}
                </span>
                {isActive && (
                  <span className="text-[8px] font-mono font-bold text-black/85 leading-tight mt-0.5">
                    {midiToNoteName(step.pitch)}
                  </span>
                )}
              </div>

              {/* Accent dot if velocity > 100 */}
              {isActive && step.velocity > 100 && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
              )}
            </button>
          );
        });
      })}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TrackData, ViewMode, MidiDeviceOption, LinkState } from './types/sequencer';
import { createDefaultTracks } from './utils/defaults';
import { generateEuclideanRhythm } from './utils/euclidean';
import { synth } from './audio/synthEngine';
import { midiManager } from './midi/midiManager';
import { linkSync } from './utils/linkSync';
import { HeaderBar } from './components/Header/HeaderBar';
import { Chassis } from './components/Launchpad/Chassis';
import { StepInspector } from './components/Inspector/StepInspector';
import { TrackInspector } from './components/Inspector/TrackInspector';
import { PiConfigModal } from './components/Modals/PiConfigModal';

export default function App() {
  const [tracks, setTracks] = useState<TrackData[]>(() => createDefaultTracks());
  const [bpm, setBpm] = useState<number>(124);
  const [swing, setSwing] = useState<number>(0.1);
  const [volume, setVolume] = useState<number>(0.85);
  const [running, setRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [activeTrackId, setActiveTrackId] = useState<number>(0);
  const [selectedStepIdx, setSelectedStepIdx] = useState<number | null>(0);
  const [activePage, setActivePage] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('multitrack');
  const [isPiModalOpen, setIsPiModalOpen] = useState<boolean>(false);
  const [modalInitialTab, setModalInitialTab] = useState<'export' | 'import' | 'link' | 'setup'>('export');

  // Ableton Link State
  const [linkState, setLinkState] = useState<LinkState>(linkSync.state);

  // Web MIDI Devices
  const [midiSupported, setMidiSupported] = useState<boolean>(false);
  const [midiOutputs, setMidiOutputs] = useState<MidiDeviceOption[]>([]);
  const [selectedMidiOutputId, setSelectedMidiOutputId] = useState<string>('');

  // Ref to hold latest tracks for audio lookahead callback
  const tracksRef = useRef<TrackData[]>(tracks);
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  // Subscribe to Ableton Link real-time updates
  useEffect(() => {
    const unsubscribe = linkSync.subscribe((state) => {
      setLinkState({ ...state });
      if (Math.abs(state.tempo - bpm) > 0.05) {
        setBpm(state.tempo);
        synth.setBpm(state.tempo);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [bpm]);

  // Initialize Audio & MIDI
  useEffect(() => {
    synth.init();
    synth.setBpm(bpm);
    synth.setSwing(swing);
    synth.setMasterVolume(volume);

    // Audio clock step sync callback
    synth.onStepTrigger = (stepIndex: number) => {
      setCurrentStep(stepIndex);
    };

    // Forward synthesized triggers to Web MIDI if active
    synth.onMidiEmit = (channel, pitch, velocity, gateSec) => {
      midiManager.sendNote(channel, pitch, velocity, gateSec);
    };

    // Check & Initialize Web MIDI
    const setupMidi = async () => {
      const supported = await midiManager.init();
      setMidiSupported(supported);
      if (supported) {
        setMidiOutputs(midiManager.availableOutputs);
        setSelectedMidiOutputId(midiManager.selectedOutputId);

        // Listen for hardware Launchpad X pad presses
        midiManager.onPadNoteReceived = (note, velocity) => {
          if (velocity > 0) {
            const row = Math.floor(note / 10);
            const col = note % 10;
            if (row >= 1 && row <= 8 && col >= 1 && col <= 8) {
              const trackIdx = 8 - row;
              const stepIdx = activePage * 8 + (col - 1);
              toggleStep(trackIdx, stepIdx);
            }
          }
        };

        // Listen for Launchpad CC buttons (Record button CC 98 toggles transport)
        midiManager.onControlChangeReceived = (cc, val) => {
          if (cc === 98 && val > 0) {
            togglePlay();
          }
        };
      }
    };
    setupMidi();

    return () => {
      synth.stop();
    };
  }, []);

  // Update Synth BPM (also sync to Ableton Link)
  const handleBpmChange = useCallback((newBpm: number) => {
    setBpm(newBpm);
    synth.setBpm(newBpm);
    linkSync.setTempo(newBpm);
  }, []);

  // Update Swing
  const handleSwingChange = useCallback((newSwing: number) => {
    setSwing(newSwing);
    synth.setSwing(newSwing);
  }, []);

  // Update Volume
  const handleVolumeChange = useCallback((newVol: number) => {
    setVolume(newVol);
    synth.setMasterVolume(newVol);
  }, []);

  // Master Play / Stop
  const togglePlay = useCallback(() => {
    setRunning((prev) => {
      const nextRunning = !prev;
      if (nextRunning) {
        synth.start(tracksRef.current, currentStep);
      } else {
        synth.stop();
      }
      return nextRunning;
    });
  }, [currentStep]);

  // Toggle Step Active/Inactive
  const toggleStep = useCallback((trackId: number, stepIdx: number) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;
        const newSteps = [...track.steps];
        if (newSteps[stepIdx]) {
          newSteps[stepIdx] = {
            ...newSteps[stepIdx],
            active: !newSteps[stepIdx].active,
          };
        }
        return { ...track, steps: newSteps };
      })
    );
  }, []);

  // Select Step for Deep Inspection
  const selectStep = useCallback((trackId: number, stepIdx: number) => {
    setActiveTrackId(trackId);
    setSelectedStepIdx(stepIdx);
  }, []);

  // Update Parameters on a Specific Step
  const updateStep = useCallback(
    (
      trackId: number,
      stepIdx: number,
      updates: Partial<{
        pitch: number;
        velocity: number;
        gate: number;
        probability: number;
        active: boolean;
      }>
    ) => {
      setTracks((prev) =>
        prev.map((track) => {
          if (track.id !== trackId) return track;
          const newSteps = [...track.steps];
          if (newSteps[stepIdx]) {
            newSteps[stepIdx] = { ...newSteps[stepIdx], ...updates };
          }
          return { ...track, steps: newSteps };
        })
      );
    },
    []
  );

  // Update Track-Level Parameters
  const updateTrack = useCallback((trackId: number, updates: Partial<TrackData>) => {
    setTracks((prev) =>
      prev.map((track) => (track.id === trackId ? { ...track, ...updates } : track))
    );
  }, []);

  // Apply Euclidean Rhythm Algorithm
  const applyEuclidean = useCallback((trackId: number, hits: number, rotation: number) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;
        const pattern = generateEuclideanRhythm(track.length, hits, rotation);
        const newSteps = track.steps.map((step, i) => {
          if (i < track.length) {
            return { ...step, active: pattern[i] };
          }
          return step;
        });
        return {
          ...track,
          euclideanHits: hits,
          euclideanRotation: rotation,
          steps: newSteps,
        };
      })
    );
  }, []);

  // Clear Track Pattern
  const clearTrack = useCallback((trackId: number) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;
        const newSteps = track.steps.map((s) => ({ ...s, active: false }));
        return { ...track, steps: newSteps };
      })
    );
  }, []);

  // Randomize Track Pattern
  const randomizeTrack = useCallback((trackId: number) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;
        const newSteps = track.steps.map((s) => ({
          ...s,
          active: Math.random() < 0.45,
          velocity: 70 + Math.floor(Math.random() * 55),
        }));
        return { ...track, steps: newSteps };
      })
    );
  }, []);

  // Audition Track Sound
  const auditionTrack = useCallback((track: TrackData, pitch?: number) => {
    synth.playImmediatePreview(track, pitch ?? track.defaultPitch);
  }, []);

  // Mute All Toggle
  const toggleMuteAll = useCallback(() => {
    setTracks((prev) => {
      const allMuted = prev.every((t) => t.mute);
      return prev.map((t) => ({ ...t, mute: !allMuted }));
    });
  }, []);

  // Import Tracks from Pi JSON
  const handleImportTracks = useCallback((importedTracks: TrackData[], importedBpm: number) => {
    setTracks(importedTracks);
    handleBpmChange(importedBpm);
  }, [handleBpmChange]);

  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];

  return (
    <div className="min-h-screen bg-[#08090b] text-slate-200 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* 3-Zone Header Bar */}
      <HeaderBar
        running={running}
        onTogglePlay={togglePlay}
        bpm={bpm}
        onBpmChange={handleBpmChange}
        swing={swing}
        onSwingChange={handleSwingChange}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        midiSupported={midiSupported}
        midiOutputs={midiOutputs}
        selectedMidiOutputId={selectedMidiOutputId}
        onSelectMidiOutput={(id) => {
          setSelectedMidiOutputId(id);
          midiManager.selectOutput(id);
        }}
        onOpenPiModal={(tab) => {
          setModalInitialTab(tab || 'export');
          setIsPiModalOpen(true);
        }}
        linkState={linkState}
        onToggleLink={() => linkSync.toggleEnabled()}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 flex flex-col gap-6 items-center">
        {/* Hardware Status & Transport Sub-strip */}
        <div className="w-full flex items-center justify-between text-xs text-slate-500 border-b border-[#181a22] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">HARDWARE CONSOLE</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-400">
              STEP {currentStep + 1}/16
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-400">
              BAR {Math.floor(currentStep / 4) + 1}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-purple-400">
              LINK {linkState.enabled ? `${linkState.peers} PEERS` : 'OFF'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-slate-400">
              MODE:{' '}
              <span className="text-emerald-400 font-bold uppercase">
                {viewMode}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">
              ACTIVE TRACK:{' '}
              <span style={{ color: activeTrack.colorHex }} className="font-bold">
                {activeTrack.name}
              </span>
            </span>
          </div>
        </div>

        {/* Central Novation Launchpad X Physical Digital Twin */}
        <div className="flex justify-center items-center w-full py-2 overflow-x-auto">
          <Chassis
            tracks={tracks}
            currentStep={currentStep}
            running={running}
            bpm={bpm}
            onBpmChange={handleBpmChange}
            onTogglePlay={togglePlay}
            activePage={activePage}
            setActivePage={setActivePage}
            viewMode={viewMode}
            setViewMode={setViewMode}
            activeTrackId={activeTrackId}
            setActiveTrackId={setActiveTrackId}
            selectedStepIdx={selectedStepIdx}
            onToggleStep={toggleStep}
            onSelectStep={selectStep}
            onAuditionTrack={auditionTrack}
            onClearTrack={clearTrack}
            onToggleMuteAll={toggleMuteAll}
          />
        </div>

        {/* Dual Parameter Inspector Deck: Step & Track */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
          {/* Left Deck: Step Parameter Inspector */}
          <StepInspector
            track={activeTrack}
            stepIdx={selectedStepIdx}
            onUpdateStep={updateStep}
            onAudition={auditionTrack}
          />

          {/* Right Deck: Track-Level Routing, Polymetric Loop & Euclidean Engine */}
          <TrackInspector
            tracks={tracks}
            activeTrackId={activeTrackId}
            setActiveTrackId={setActiveTrackId}
            onUpdateTrack={updateTrack}
            onApplyEuclidean={applyEuclidean}
            onClearTrack={clearTrack}
            onRandomizeTrack={randomizeTrack}
          />
        </div>
      </main>

      {/* Raspberry Pi Zero W & Ableton Link Modal */}
      <PiConfigModal
        isOpen={isPiModalOpen}
        onClose={() => setIsPiModalOpen(false)}
        tracks={tracks}
        bpm={bpm}
        onImportTracks={handleImportTracks}
        linkState={linkState}
        onToggleLink={() => linkSync.toggleEnabled()}
        onSetLinkPeers={(p) => linkSync.setPeers(p)}
        onSetLinkQuantum={(q) => linkSync.setQuantum(q)}
        initialTab={modalInitialTab}
      />
    </div>
  );
}

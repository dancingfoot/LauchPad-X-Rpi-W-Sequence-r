/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TrackData, ViewMode, MidiDeviceOption, LinkState, InactivePadStyle } from './types/sequencer';
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
  const [dawModeActive, setDawModeActive] = useState<boolean>(true);
  const [currentMode, setCurrentMode] = useState<'session' | 'note' | 'custom'>('session');
  const [inactivePadStyle, setInactivePadStyle] = useState<InactivePadStyle>('off');

  // Ableton Link State
  const [linkState, setLinkState] = useState<LinkState>(linkSync.state);

  // Web MIDI Devices
  const [midiSupported, setMidiSupported] = useState<boolean>(false);
  const [midiOutputs, setMidiOutputs] = useState<MidiDeviceOption[]>([]);
  const [selectedMidiOutputId, setSelectedMidiOutputId] = useState<string>('');

  // Refs to hold latest state for MIDI and audio callbacks
  const tracksRef = useRef<TrackData[]>(tracks);
  const activePageRef = useRef<number>(activePage);
  const bpmRef = useRef<number>(bpm);
  const runningRef = useRef<boolean>(running);
  const activeTrackIdRef = useRef<number>(activeTrackId);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    activeTrackIdRef.current = activeTrackId;
  }, [activeTrackId]);

  const currentStepRef = useRef(0);
  const prevStepRef = useRef(0);
  const toggleStepRef = useRef<(trackId: number, stepIdx: number) => void>(() => {});
  const togglePlayRef = useRef<() => void>(() => {});
  const setActivePageRef = useRef<(page: number) => void>(() => {});
  const setActiveTrackIdRef = useRef<(id: number) => void>(() => {});
  const toggleMuteAllRef = useRef<() => void>(() => {});
  const handleBpmChangeRef = useRef<(bpm: number) => void>(() => {});
  const handleSelectModeRef = useRef<(mode: 'session' | 'note' | 'custom') => void>(() => {});

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

  // Synchronize Launchpad X Hardware LEDs on track edit, mute/solo, page change, or transport toggle
  useEffect(() => {
    if (midiSupported) {
      midiManager.renderLaunchpadGrid(
        tracks,
        currentStepRef.current,
        running,
        activePage,
        activeTrackId
      );
    }
  }, [tracks, running, activePage, activeTrackId, midiSupported, dawModeActive]);

  // Dedicated scene button dispatcher matching physical Launchpad X controls:
  // 0: Volume (Cycle active track selection 1..8)
  // 1: Pan (Cycle view mode: multitrack -> singletrack -> euclidean)
  // 2: Send A (Page 1: Steps 1-8)
  // 3: Send B (Page 2: Steps 9-16)
  // 4: Stop Clip (Silence all synth voices & stop playback)
  // 5: Mute (Toggle Mute on currently selected track)
  // 6: Solo (Toggle Solo on currently selected track)
  // 7: Record Arm (Play / Stop Transport)
  const handleSceneButtonAction = useCallback((sceneIndex: number) => {
    if (sceneIndex === 0) {
      setActiveTrackId((prev) => (prev + 1) % 8);
    } else if (sceneIndex === 1) {
      setViewMode((prev) =>
        prev === 'multitrack' ? 'singletrack' : prev === 'singletrack' ? 'euclidean' : 'multitrack'
      );
    } else if (sceneIndex === 2) {
      setActivePageRef.current(0);
      setActivePage(0);
    } else if (sceneIndex === 3) {
      setActivePageRef.current(1);
      setActivePage(1);
    } else if (sceneIndex === 4) {
      synth.stop();
      setRunning(false);
      runningRef.current = false;
      midiManager.renderLaunchpadGrid(
        tracksRef.current,
        0,
        false,
        activePageRef.current,
        activeTrackIdRef.current
      );
    } else if (sceneIndex === 5) {
      setTracks((prev) =>
        prev.map((t) => (t.id === activeTrackIdRef.current ? { ...t, mute: !t.mute } : t))
      );
    } else if (sceneIndex === 6) {
      setTracks((prev) =>
        prev.map((t) => (t.id === activeTrackIdRef.current ? { ...t, solo: !t.solo } : t))
      );
    } else if (sceneIndex === 7) {
      togglePlayRef.current();
    }
  }, []);

  // Toggle inactive pad style between 'off' (unlit) and 'faded' (dimmed)
  const handleInactivePadStyleChange = useCallback(
    (style: InactivePadStyle) => {
      setInactivePadStyle(style);
      midiManager.setInactivePadStyle(style);
      if (midiSupported) {
        midiManager.renderLaunchpadGrid(
          tracksRef.current,
          currentStepRef.current,
          runningRef.current,
          activePageRef.current,
          activeTrackIdRef.current
        );
      }
    },
    [midiSupported]
  );

  // Switch Modes: Session (Sequencer Grid), Note (Live Instrument), Custom (User Mapping)
  const handleSelectMode = useCallback((mode: 'session' | 'note' | 'custom') => {
    setCurrentMode(mode);
    if (mode === 'session') {
      midiManager.setSessionMode();
      setDawModeActive(true);
    } else if (mode === 'note') {
      midiManager.setNoteMode();
      setDawModeActive(false);
    } else if (mode === 'custom') {
      midiManager.setCustomMode();
      setDawModeActive(false);
    }
  }, []);

  // Re-assert DAW Session Mode and immediately refresh all pad lights
  const handleSessionModeReassert = useCallback(() => {
    handleSelectMode('session');
  }, [handleSelectMode]);

  // Initialize Audio & MIDI
  useEffect(() => {
    synth.init();
    synth.setBpm(bpm);
    synth.setSwing(swing);
    synth.setMasterVolume(volume);
    synth.getTracks = () => tracksRef.current;

    // High-resolution audio clock step trigger:
    // Uses ultra-fast delta playhead tick (only 16 pad updates, never locks USB buffers)
    synth.onStepTrigger = (stepIndex: number) => {
      const prev = currentStepRef.current;
      currentStepRef.current = stepIndex;
      prevStepRef.current = prev;
      setCurrentStep(stepIndex);

      midiManager.updatePlayheadTick(
        tracksRef.current,
        prev,
        stepIndex,
        runningRef.current,
        activePageRef.current
      );
    };

    // Forward synthesized triggers to Web MIDI (external synths / DAW)
    synth.onMidiEmit = (channel, pitch, velocity, gateSec) => {
      midiManager.sendNote(channel, pitch, velocity, gateSec);
    };

    // Check & Initialize Web MIDI
    const setupMidi = async () => {
      midiManager.onDawModeChanged = (active) => {
        setDawModeActive(active);
        if (active) {
          midiManager.renderLaunchpadGrid(
            tracksRef.current,
            currentStepRef.current,
            runningRef.current,
            activePageRef.current,
            activeTrackIdRef.current
          );
        }
      };

      midiManager.onModeChanged = (mode) => {
        setCurrentMode(mode);
        setDawModeActive(mode === 'session');
      };

      midiManager.onRequestFullRefresh = () => {
        midiManager.renderLaunchpadGrid(
          tracksRef.current,
          currentStepRef.current,
          runningRef.current,
          activePageRef.current,
          activeTrackIdRef.current
        );
      };

      const supported = await midiManager.init();
      setMidiSupported(supported);
      if (supported) {
        setMidiOutputs(midiManager.availableOutputs);
        setSelectedMidiOutputId(midiManager.selectedOutputId);
        setDawModeActive(true);

        // Render initial lights to physical Launchpad X
        midiManager.renderLaunchpadGrid(
          tracksRef.current,
          0,
          runningRef.current,
          activePageRef.current,
          activeTrackIdRef.current
        );

        // Listen for hardware Launchpad X pad presses & right scene buttons
        midiManager.onPadNoteReceived = (note, velocity) => {
          if (velocity > 0) {
            // In Note Mode: Play sound of active track live!
            if (midiManager.currentMode === 'note') {
              const activeTrk = tracksRef.current[activeTrackIdRef.current];
              if (activeTrk) {
                synth.playImmediatePreview(activeTrk, note, velocity);
                if (midiManager.selectedOutputId) {
                  midiManager.sendNote(activeTrk.channel, note, velocity, 0.3);
                }
              }
              return;
            }

            const row = Math.floor(note / 10);
            const col = note % 10;

            // 8x8 Grid Pads (Rows 1..8, Cols 1..8)
            if (row >= 1 && row <= 8 && col >= 1 && col <= 8) {
              const trackIdx = 8 - row;
              const stepIdx = activePageRef.current * 8 + (col - 1);
              toggleStepRef.current(trackIdx, stepIdx);
              return;
            }

            // Right-Hand Scene Buttons (Col 9 or Notes 89, 79, 69, 59, 49, 39, 29, 19)
            if (col === 9 && row >= 1 && row <= 8) {
              handleSceneButtonAction(8 - row);
              return;
            }

            if (note === 89) handleSceneButtonAction(0);
            else if (note === 79) handleSceneButtonAction(1);
            else if (note === 69) handleSceneButtonAction(2);
            else if (note === 59) handleSceneButtonAction(3);
            else if (note === 49) handleSceneButtonAction(4);
            else if (note === 39) handleSceneButtonAction(5);
            else if (note === 29) handleSceneButtonAction(6);
            else if (note === 19) handleSceneButtonAction(7);
          }
        };

        // Listen for Launchpad CC buttons (Top Row CC 91-98 and Scene CC buttons)
        midiManager.onControlChangeReceived = (cc, val) => {
          if (val > 0) {
            if (cc === 98) {
              // Record / Play transport button
              togglePlayRef.current();
            } else if (cc === 95) {
              // Physical SESSION / MIXER button pressed -> Session Mode
              handleSelectModeRef.current('session');
            } else if (cc === 96) {
              // Physical NOTE button pressed -> Note Mode
              handleSelectModeRef.current('note');
            } else if (cc === 97) {
              // Physical CUSTOM button pressed -> Custom Mode
              handleSelectModeRef.current('custom');
            } else if (cc === 93) {
              // Left arrow -> Page 1
              setActivePageRef.current(0);
            } else if (cc === 94) {
              // Right arrow -> Page 2
              setActivePageRef.current(1);
            } else if (cc === 91) {
              // Up arrow -> BPM +2
              handleBpmChangeRef.current(bpmRef.current + 2);
            } else if (cc === 92) {
              // Down arrow -> BPM -2
              handleBpmChangeRef.current(bpmRef.current - 2);
            }
            // Scene buttons transmitted as CCs (Session mode)
            else if (cc === 89) handleSceneButtonAction(0);
            else if (cc === 79) handleSceneButtonAction(1);
            else if (cc === 69) handleSceneButtonAction(2);
            else if (cc === 59) handleSceneButtonAction(3);
            else if (cc === 49) handleSceneButtonAction(4);
            else if (cc === 39) handleSceneButtonAction(5);
            else if (cc === 29) handleSceneButtonAction(6);
            else if (cc === 19) handleSceneButtonAction(7);
          }
        };
      }
    };
    setupMidi();

    return () => {
      synth.stop();
    };
  }, [handleSceneButtonAction, handleSessionModeReassert]);

  // Toggle Launchpad X DAW Mode Handshake
  const toggleDawMode = useCallback(() => {
    handleSelectMode(currentMode === 'session' ? 'note' : 'session');
  }, [currentMode, handleSelectMode]);

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
      runningRef.current = nextRunning;
      if (nextRunning) {
        synth.start(tracksRef.current, currentStepRef.current);
      } else {
        synth.stop();
        // Immediately restore all Launchpad LEDs back to pure track colors!
        // This guarantees no pads (such as row 8 pad 5) are ever left stuck on white!
        midiManager.renderLaunchpadGrid(
          tracksRef.current,
          0,
          false,
          activePageRef.current,
          activeTrackIdRef.current
        );
      }
      return nextRunning;
    });
  }, []);



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

  // Synchronize ref callbacks for hardware MIDI dispatch
  toggleStepRef.current = toggleStep;
  togglePlayRef.current = togglePlay;
  setActivePageRef.current = setActivePage;
  setActiveTrackIdRef.current = setActiveTrackId;
  toggleMuteAllRef.current = toggleMuteAll;
  handleBpmChangeRef.current = handleBpmChange;
  handleSelectModeRef.current = handleSelectMode;

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
            dawModeActive={dawModeActive}
            onToggleDawMode={toggleDawMode}
            currentMode={currentMode}
            onSelectMode={handleSelectMode}
            inactivePadStyle={inactivePadStyle}
            onInactivePadStyleChange={handleInactivePadStyleChange}
            onSceneButtonAction={handleSceneButtonAction}
            onUpdateTrack={updateTrack}
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

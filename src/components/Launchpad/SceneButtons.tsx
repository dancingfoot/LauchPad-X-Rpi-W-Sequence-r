import React from 'react';

interface SceneButtonsProps {
  activePage: number;
  setActivePage: (page: number) => void;
  activeTrackId: number;
  setActiveTrackId: (id: number) => void;
  onClearTrack: (id: number) => void;
  onToggleMuteAll: () => void;
  onSceneButtonAction?: (sceneIndex: number) => void;
  running?: boolean;
  isAnyMuted?: boolean;
  isAnySoloed?: boolean;
}

export const SceneButtons: React.FC<SceneButtonsProps> = ({
  activePage,
  setActivePage,
  activeTrackId,
  setActiveTrackId,
  onClearTrack,
  onToggleMuteAll,
  onSceneButtonAction,
  running = false,
  isAnyMuted = false,
  isAnySoloed = false,
}) => {
  // 8 circular scene buttons on the right edge of Novation Launchpad X
  // Labeled identically to the physical hardware (Row 8 down to Row 1 / CC 89 down to CC 19):
  // 1. Volume
  // 2. Pan
  // 3. Send A
  // 4. Send B
  // 5. Stop Clip
  // 6. Mute
  // 7. Solo
  // 8. Record Arm
  const sceneItems = [
    {
      index: 0,
      name: 'Volume',
      shortName: 'VOLUME',
      color: '#00e5ff',
      active: true,
      tooltip: 'Volume (Mixer mode)',
      action: () => {
        if (onSceneButtonAction) onSceneButtonAction(0);
      },
    },
    {
      index: 1,
      name: 'Pan',
      shortName: 'PAN',
      color: '#40c4ff',
      active: false,
      tooltip: 'Pan (Mixer mode)',
      action: () => {
        if (onSceneButtonAction) onSceneButtonAction(1);
      },
    },
    {
      index: 2,
      name: 'Send A',
      shortName: 'SEND A',
      color: '#ffd000',
      active: activePage === 0,
      tooltip: 'Send A (Steps 1-8 / Page 1)',
      action: () => {
        setActivePage(0);
        if (onSceneButtonAction) onSceneButtonAction(2);
      },
    },
    {
      index: 3,
      name: 'Send B',
      shortName: 'SEND B',
      color: '#ff9100',
      active: activePage === 1,
      tooltip: 'Send B (Steps 9-16 / Page 2)',
      action: () => {
        setActivePage(1);
        if (onSceneButtonAction) onSceneButtonAction(3);
      },
    },
    {
      index: 4,
      name: 'Stop Clip',
      shortName: 'STOP CLIP',
      color: '#ff3344',
      active: false,
      tooltip: 'Stop Clip (Silence current notes / Stop)',
      action: () => {
        if (onSceneButtonAction) onSceneButtonAction(4);
      },
    },
    {
      index: 5,
      name: 'Mute',
      shortName: 'MUTE',
      color: '#ff3344',
      active: isAnyMuted,
      tooltip: 'Mute (Toggle Mute on selected track or all)',
      action: () => {
        if (onSceneButtonAction) onSceneButtonAction(5);
        else onToggleMuteAll();
      },
    },
    {
      index: 6,
      name: 'Solo',
      shortName: 'SOLO',
      color: '#00e676',
      active: isAnySoloed,
      tooltip: 'Solo (Toggle Solo on selected track)',
      action: () => {
        if (onSceneButtonAction) onSceneButtonAction(6);
      },
    },
    {
      index: 7,
      name: 'Record Arm',
      shortName: 'REC ARM',
      color: '#ff1744',
      active: running,
      tooltip: 'Record Arm (Play / Stop Transport)',
      action: () => {
        if (onSceneButtonAction) onSceneButtonAction(7);
      },
    },
  ];

  return (
    <div className="flex flex-col gap-2 justify-between">
      {sceneItems.map((scene) => {
        const isSceneActive = scene.active;
        return (
          <button
            key={scene.index}
            onClick={scene.action}
            title={scene.tooltip}
            style={{
              borderColor: isSceneActive ? scene.color : '#252936',
              boxShadow: isSceneActive
                ? `0 0 12px ${scene.color}99, inset 0 1px 3px rgba(255,255,255,0.4)`
                : 'inset 0 1px 2px rgba(255,255,255,0.04)',
              backgroundColor: isSceneActive ? scene.color : '#161820',
              color: isSceneActive ? '#000000' : '#8891a5',
            }}
            className="w-12 h-12 rounded-full border active:scale-95 transition-all flex flex-col items-center justify-center text-center p-0.5 shadow-md hover:brightness-125 cursor-pointer"
          >
            {scene.name === 'Record Arm' ? (
              <div className="leading-tight">
                <span className="text-[7.5px] font-bold block uppercase tracking-tight">Record</span>
                <span className="text-[7px] font-bold block uppercase tracking-tight -mt-0.5">Arm</span>
              </div>
            ) : scene.name === 'Stop Clip' ? (
              <div className="leading-tight">
                <span className="text-[8px] font-bold block uppercase tracking-tight">Stop</span>
                <span className="text-[7.5px] font-bold block uppercase tracking-tight -mt-0.5">Clip</span>
              </div>
            ) : scene.name.startsWith('Send') ? (
              <div className="leading-tight">
                <span className="text-[8px] font-bold block uppercase tracking-tight">Send</span>
                <span className="text-[8px] font-bold block uppercase tracking-tight -mt-0.5">
                  {scene.name.split(' ')[1]}
                </span>
              </div>
            ) : (
              <span className="text-[9px] font-bold tracking-tight uppercase leading-none">
                {scene.name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

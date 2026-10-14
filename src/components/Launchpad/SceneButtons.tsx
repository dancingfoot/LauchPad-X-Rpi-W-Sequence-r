import React from 'react';

interface SceneButtonsProps {
  activePage: number;
  setActivePage: (page: number) => void;
  activeTrackId: number;
  setActiveTrackId: (id: number) => void;
  onClearTrack: (id: number) => void;
  onToggleMuteAll: () => void;
}

export const SceneButtons: React.FC<SceneButtonsProps> = ({
  activePage,
  setActivePage,
  activeTrackId,
  setActiveTrackId,
}) => {
  // 8 circular buttons arranged vertically
  const scenes = [
    { label: 'PG 1', type: 'page', pageIdx: 0, active: activePage === 0, color: '#00e5ff' },
    { label: 'PG 2', type: 'page', pageIdx: 1, active: activePage === 1, color: '#00e5ff' },
    { label: 'TK 1-4', type: 'select', trackIdx: 0, active: activeTrackId < 4, color: '#ffd000' },
    { label: 'TK 5-8', type: 'select', trackIdx: 4, active: activeTrackId >= 4, color: '#ffd000' },
    { label: 'SCN 5', type: 'scene', color: '#ff9100' },
    { label: 'SCN 6', type: 'scene', color: '#ff9100' },
    { label: 'MUTE', type: 'action', color: '#ff3344' },
    { label: 'SOLO', type: 'action', color: '#00e676' },
  ];

  return (
    <div className="flex flex-col gap-2 justify-between">
      {scenes.map((scene, idx) => {
        const isSceneActive = scene.active;
        return (
          <button
            key={idx}
            onClick={() => {
              if (scene.type === 'page' && scene.pageIdx !== undefined) {
                setActivePage(scene.pageIdx);
              } else if (scene.type === 'select' && scene.trackIdx !== undefined) {
                setActiveTrackId(scene.trackIdx);
              }
            }}
            title={`Scene Button ${8 - idx}`}
            style={{
              borderColor: isSceneActive ? scene.color : '#262935',
              boxShadow: isSceneActive ? `0 0 10px ${scene.color}80, inset 0 1px 3px rgba(255,255,255,0.4)` : 'none',
              backgroundColor: isSceneActive ? scene.color : '#1a1d24',
              color: isSceneActive ? '#000000' : '#8a90a0',
            }}
            className="w-12 h-12 rounded-full border active:scale-95 transition-all flex items-center justify-center text-[10px] font-bold tracking-tight shadow-md hover:brightness-125"
          >
            {scene.label}
          </button>
        );
      })}
    </div>
  );
};

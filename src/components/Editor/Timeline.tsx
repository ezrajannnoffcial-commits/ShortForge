import React from 'react';
import { Project, Scene } from '../../types.ts';
import { Video, Mic, Music, Subtitles, Clock } from 'lucide-react';

interface TimelineProps {
  project: Project;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  currentSceneIndex: number;
  onSelectScene: (index: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  project,
  currentTime,
  onTimeUpdate,
  currentSceneIndex,
  onSelectScene,
}) => {
  const totalDuration = project.scenes.reduce((acc, s) => acc + (s.duration || 4), 0);

  // Time markers (every 5 seconds)
  const markerCount = Math.ceil(totalDuration / 5);
  const timeMarkers = Array.from({ length: markerCount + 1 }, (_, i) => i * 5);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onTimeUpdate(pct * totalDuration);
  };

  // Playhead percentage position
  const playheadPct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-4 shadow-xl">
      {/* Timeline Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            Multi-Track Timeline
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
          <span>{project.scenes.length} Scenes</span>
          <span>·</span>
          <span>{totalDuration.toFixed(1)}s Total Duration</span>
        </div>
      </div>

      {/* Main Track Workspace */}
      <div className="mt-3 relative select-none">
        {/* Ruler Bar */}
        <div
          onClick={handleTimelineClick}
          className="relative h-6 w-full cursor-pointer border-b border-neutral-800 bg-neutral-950/70"
        >
          {timeMarkers.map((sec) => {
            const leftPct = (sec / totalDuration) * 100;
            if (leftPct > 100) return null;
            return (
              <div
                key={sec}
                style={{ left: `${leftPct}%` }}
                className="absolute top-0 bottom-0 flex flex-col items-center"
              >
                <div className="h-2 w-px bg-neutral-700" />
                <span className="text-[9px] font-mono text-neutral-500">{sec}s</span>
              </div>
            );
          })}
        </div>

        {/* Tracks Container */}
        <div onClick={handleTimelineClick} className="relative mt-2 space-y-2 cursor-pointer pb-2">
          {/* TRACK 1: VIDEO / SCENES */}
          <div className="flex items-center gap-2">
            <div className="flex w-24 shrink-0 items-center gap-1.5 text-[11px] font-medium text-neutral-400">
              <Video className="h-3.5 w-3.5 text-blue-400" />
              <span>Video</span>
            </div>
            <div className="relative flex h-14 flex-1 overflow-hidden rounded-lg bg-neutral-950 border border-neutral-800">
              {project.scenes.map((scene, idx) => {
                const widthPct = (scene.duration / totalDuration) * 100;
                const isSelected = idx === currentSceneIndex;
                return (
                  <div
                    key={scene.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectScene(idx);
                    }}
                    style={{ width: `${widthPct}%` }}
                    className={`relative h-full flex flex-col justify-between border-r border-neutral-900 p-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-t-2 border-t-amber-400 ring-1 ring-amber-500/50'
                        : 'bg-neutral-800/60 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-white">#{scene.number}</span>
                      <span className="font-mono text-neutral-400">{scene.duration}s</span>
                    </div>
                    <div className="truncate text-[10px] text-neutral-300">
                      {scene.visualPrompt || scene.narration}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TRACK 2: VOICE NARATION */}
          <div className="flex items-center gap-2">
            <div className="flex w-24 shrink-0 items-center gap-1.5 text-[11px] font-medium text-neutral-400">
              <Mic className="h-3.5 w-3.5 text-emerald-400" />
              <span>Voice</span>
            </div>
            <div className="relative flex h-8 flex-1 overflow-hidden rounded-lg bg-neutral-950 border border-neutral-800">
              {project.scenes.map((scene, idx) => {
                const widthPct = (scene.duration / totalDuration) * 100;
                const hasAudio = !!scene.audioUrl;
                return (
                  <div
                    key={`voice_${scene.id}`}
                    style={{ width: `${widthPct}%` }}
                    className={`relative h-full border-r border-neutral-900 px-2 flex items-center ${
                      hasAudio ? 'bg-emerald-950/40 text-emerald-300' : 'bg-neutral-900/30 text-neutral-600'
                    }`}
                  >
                    <span className="truncate text-[10px] font-mono">
                      {hasAudio ? `🎙 ${project.voiceName || 'Voice'}` : 'No audio'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TRACK 3: BACKGROUND MUSIC */}
          <div className="flex items-center gap-2">
            <div className="flex w-24 shrink-0 items-center gap-1.5 text-[11px] font-medium text-neutral-400">
              <Music className="h-3.5 w-3.5 text-purple-400" />
              <span>Music</span>
            </div>
            <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-neutral-950 border border-neutral-800">
              {project.musicTrack ? (
                <div className="flex h-full w-full items-center justify-between bg-purple-950/30 px-3 border border-purple-500/20 text-purple-300 text-[10px]">
                  <span className="truncate font-semibold">{project.musicTrack.title}</span>
                  <span className="font-mono text-purple-400">Ducked (-18dB)</span>
                </div>
              ) : (
                <div className="flex h-full items-center px-3 text-[10px] text-neutral-500">
                  No background music selected
                </div>
              )}
            </div>
          </div>

          {/* TRACK 4: CAPTIONS */}
          <div className="flex items-center gap-2">
            <div className="flex w-24 shrink-0 items-center gap-1.5 text-[11px] font-medium text-neutral-400">
              <Subtitles className="h-3.5 w-3.5 text-amber-400" />
              <span>Captions</span>
            </div>
            <div className="relative flex h-7 flex-1 overflow-hidden rounded-lg bg-neutral-950 border border-neutral-800">
              {project.scenes.map((scene) => {
                const widthPct = (scene.duration / totalDuration) * 100;
                const hasCaptions = scene.captions && scene.captions.length > 0;
                return (
                  <div
                    key={`cap_${scene.id}`}
                    style={{ width: `${widthPct}%` }}
                    className={`h-full border-r border-neutral-900 px-1.5 flex items-center truncate text-[10px] ${
                      hasCaptions ? 'bg-amber-950/30 text-amber-300 font-semibold' : 'text-neutral-500'
                    }`}
                  >
                    {hasCaptions ? `⚡ ${scene.captions?.length} words` : 'Syncing...'}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PLAYHEAD SCRUB LINE */}
          <div
            style={{ left: `calc(${playheadPct}% + 6rem)` }}
            className="pointer-events-none absolute top-0 bottom-0 z-30 w-0.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
          >
            <div className="absolute -top-1 -left-1.5 h-3 w-3 rounded-full bg-amber-400 shadow-md" />
          </div>
        </div>
      </div>
    </div>
  );
};

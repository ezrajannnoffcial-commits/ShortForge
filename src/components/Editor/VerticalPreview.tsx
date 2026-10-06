import React, { useRef, useEffect, useState } from 'react';
import { Project, Scene, CaptionStyle } from '../../types.ts';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, SkipBack, SkipForward } from 'lucide-react';

interface VerticalPreviewProps {
  project: Project;
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onPlayPause: () => void;
  currentSceneIndex: number;
  onSelectScene: (index: number) => void;
}

export const VerticalPreview: React.FC<VerticalPreviewProps> = ({
  project,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onPlayPause,
  currentSceneIndex,
  onSelectScene,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Total project duration
  const totalDuration = project.scenes.reduce((acc, s) => acc + (s.duration || 4), 0);

  // Find active scene and offset
  let activeScene = project.scenes[currentSceneIndex] || project.scenes[0];
  let accumulatedTime = 0;
  let sceneStartTime = 0;

  for (let i = 0; i < project.scenes.length; i++) {
    const s = project.scenes[i];
    const dur = s.duration || 4;
    if (currentTime >= accumulatedTime && currentTime < accumulatedTime + dur) {
      activeScene = s;
      sceneStartTime = accumulatedTime;
      break;
    }
    accumulatedTime += dur;
  }

  // Scene relative time
  const sceneRelativeTime = Math.max(0, currentTime - sceneStartTime);

  const currentVoiceSrcRef = useRef<string | null>(null);

  // Initialize and clean up audio instances once
  useEffect(() => {
    voiceAudioRef.current = new Audio();
    musicAudioRef.current = new Audio();

    return () => {
      voiceAudioRef.current?.pause();
      musicAudioRef.current?.pause();
      voiceAudioRef.current = null;
      musicAudioRef.current = null;
    };
  }, []);

  // Synchronize Audio Sources, Play/Pause state, and Volumes
  useEffect(() => {
    const voice = voiceAudioRef.current;
    const music = musicAudioRef.current;

    // 1. Voice track
    if (voice) {
      if (activeScene?.audioUrl) {
        const fullAudioUrl = activeScene.audioUrl.startsWith('http')
          ? activeScene.audioUrl
          : `${window.location.origin}${activeScene.audioUrl}`;

        if (currentVoiceSrcRef.current !== fullAudioUrl) {
          currentVoiceSrcRef.current = fullAudioUrl;
          voice.src = fullAudioUrl;
          voice.currentTime = Math.min(voice.duration || sceneRelativeTime, sceneRelativeTime);
        }

        voice.volume = isMuted ? 0 : Math.min(1.0, project.voiceVolume ?? 1.0);

        if (isPlaying) {
          voice.play().catch(() => {});
        } else {
          voice.pause();
        }
      } else {
        voice.pause();
        currentVoiceSrcRef.current = null;
      }
    }

    // 2. Background Music track
    if (music) {
      if (project.musicTrack?.url) {
        const fullMusicUrl = project.musicTrack.url.startsWith('http')
          ? project.musicTrack.url
          : `${window.location.origin}${project.musicTrack.url}`;

        if (!music.src.endsWith(project.musicTrack.url)) {
          music.src = fullMusicUrl;
          music.loop = true;
        }

        const hasVoice = !!activeScene?.audioUrl;
        const targetVol = isMuted ? 0 : (hasVoice ? 0.08 : 0.22);
        music.volume = targetVol;

        if (isPlaying) {
          music.play().catch(() => {});
        } else {
          music.pause();
        }
      } else {
        music.pause();
      }
    }
  }, [isPlaying, activeScene?.id, activeScene?.audioUrl, project.musicTrack?.url, isMuted, project.voiceVolume]);

  // Handle seeks when playhead jumps
  useEffect(() => {
    const voice = voiceAudioRef.current;
    if (voice && activeScene?.audioUrl) {
      if (Math.abs(voice.currentTime - sceneRelativeTime) > 0.6) {
        voice.currentTime = Math.min(voice.duration || sceneRelativeTime, sceneRelativeTime);
      }
    }
  }, [currentTime]);

  // Format time (00:00)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Find active caption segment for the current scene
  const captionStyle = project.captionStyle;
  let activeCaptionText = '';
  let activeHighlightedWords: { word: string; isHighlighted: boolean }[] = [];

  if (activeScene?.captions && activeScene.captions.length > 0) {
    const matchedSeg = activeScene.captions.find(
      (c) => sceneRelativeTime >= c.start && sceneRelativeTime <= c.end
    );
    if (matchedSeg) {
      activeCaptionText = matchedSeg.text;
      if (matchedSeg.words) {
        activeHighlightedWords = matchedSeg.words.map((w) => ({
          word: w.word,
          isHighlighted: sceneRelativeTime >= w.start && sceneRelativeTime <= w.end,
        }));
      }
    }
  } else if (activeScene?.narration) {
    activeCaptionText = activeScene.narration;
  }

  // Alignment classes
  const getPositionClasses = () => {
    if (captionStyle.position === 'top') return 'top-14 justify-start';
    if (captionStyle.position === 'middle') return 'top-1/2 -translate-y-1/2 justify-center';
    return 'bottom-24 justify-end';
  };

  return (
    <div className="flex flex-col items-center">
      {/* 9:16 Vertical Device / Frame */}
      <div
        ref={containerRef}
        className="relative aspect-[9/16] w-full max-w-[320px] sm:max-w-[340px] md:max-w-[380px] overflow-hidden rounded-2xl border-4 border-neutral-800 bg-black shadow-2xl transition-all"
      >
        {/* Visual Media Layer (Video / Image with Ken Burns animation) */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {activeScene?.assetUrl ? (
            activeScene.assetUrl.endsWith('.mp4') || activeScene.assetUrl.endsWith('.webm') ? (
              <video
                src={activeScene.assetUrl}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={activeScene.assetUrl}
                alt={activeScene.visualPrompt}
                className={`h-full w-full object-cover transition-transform duration-1000 ease-linear ${
                  isPlaying ? 'scale-115 -translate-y-2' : 'scale-105'
                }`}
              />
            )
          ) : (
            // Aesthetic Thematic Backdrop
            <div className="relative flex h-full w-full flex-col justify-between p-6 bg-gradient-to-br from-neutral-900 via-neutral-950 to-amber-950/40 text-center">
              <div className="mt-8 flex items-center justify-center">
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-[11px] font-semibold text-amber-400">
                  Scene {activeScene?.number || 1} of {project.scenes.length}
                </span>
              </div>
              <div className="my-auto px-4">
                <p className="text-xs uppercase tracking-widest text-neutral-400 font-mono">
                  Visual Prompt
                </p>
                <p className="mt-2 text-sm font-medium text-white italic line-clamp-4">
                  "{activeScene?.visualPrompt || project.topic}"
                </p>
              </div>
              <div className="text-[10px] text-neutral-500 pb-16">
                ShortForge 9:16 Ken Burns Rendering
              </div>
            </div>
          )}
        </div>

        {/* Ambient Vignette & Scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

        {/* Top Overlay Badge */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-white/80">
          <span className="rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-md">
            Scene {activeScene?.number} / {project.scenes.length}
          </span>
          <span className="rounded-md bg-black/60 px-2 py-0.5 font-mono text-[11px] text-amber-400 backdrop-blur-md">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>

        {/* Synchronized Animated Subtitles Overlay */}
        {activeCaptionText && (
          <div
            className={`pointer-events-none absolute inset-x-4 flex flex-col items-center px-2 text-center ${getPositionClasses()}`}
          >
            <div
              style={{
                fontFamily: captionStyle.fontFamily || 'Arial',
                fontSize: `${Math.max(18, Math.min(32, (captionStyle.fontSize || 54) * 0.45))}px`,
                color: captionStyle.textColor || '#FFFFFF',
                textShadow: `-2px -2px 0 ${captionStyle.outlineColor || '#000'}, 2px -2px 0 ${captionStyle.outlineColor || '#000'}, -2px 2px 0 ${captionStyle.outlineColor || '#000'}, 2px 2px 0 ${captionStyle.outlineColor || '#000'}, 0px 4px 10px rgba(0,0,0,0.8)`,
              }}
              className={`font-black leading-tight tracking-wide drop-shadow-md ${
                captionStyle.uppercase ? 'uppercase' : ''
              } ${captionStyle.boxBackground ? 'bg-black/75 px-3 py-1.5 rounded-lg' : ''}`}
            >
              {activeHighlightedWords.length > 0 ? (
                <span>
                  {activeHighlightedWords.map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        color: item.isHighlighted
                          ? captionStyle.highlightColor || '#FACC15'
                          : captionStyle.textColor || '#FFFFFF',
                      }}
                      className={item.isHighlighted ? 'scale-110 inline-block transition-transform font-extrabold' : ''}
                    >
                      {item.word}{' '}
                    </span>
                  ))}
                </span>
              ) : (
                <span>{activeCaptionText}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Playback Controls & Timeline Scrub */}
      <div className="mt-4 w-full max-w-[340px] sm:max-w-[380px] rounded-xl border border-neutral-800 bg-neutral-900/90 p-3 backdrop-blur-md">
        {/* Progress bar scrub */}
        <div className="relative mb-3 flex items-center">
          <input
            type="range"
            min={0}
            max={totalDuration || 1}
            step={0.1}
            value={currentTime}
            onChange={(e) => onTimeUpdate(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-neutral-700 accent-amber-500"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSelectScene(Math.max(0, currentSceneIndex - 1))}
              disabled={currentSceneIndex <= 0}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30"
              title="Previous Scene"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={onPlayPause}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-transform active:scale-95 font-bold"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-black" /> : <Play className="h-4 w-4 fill-black ml-0.5" />}
            </button>
            <button
              onClick={() => onSelectScene(Math.min(project.scenes.length - 1, currentSceneIndex + 1))}
              disabled={currentSceneIndex >= project.scenes.length - 1}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30"
              title="Next Scene"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              onClick={() => onTimeUpdate(0)}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              title="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-neutral-400">
              {formatTime(currentTime)} <span className="text-neutral-600">/</span> {formatTime(totalDuration)}
            </span>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

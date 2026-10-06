import React, { useState, useEffect } from 'react';
import { Project, Scene } from '../../types.ts';
import { updateProject } from '../../services/api.ts';
import { VerticalPreview } from './VerticalPreview.tsx';
import { Timeline } from './Timeline.tsx';
import { SceneList } from './SceneList.tsx';
import { CaptionEditor } from './CaptionEditor.tsx';
import { AudioMixer } from './AudioMixer.tsx';
import { RenderModal } from './RenderModal.tsx';
import {
  Film,
  Layers,
  Subtitles,
  Music,
  Save,
  PlaySquare,
  Download,
  Share2,
  Check,
  ChevronLeft,
} from 'lucide-react';

interface EditorPageProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onBackToDashboard: () => void;
}

export const EditorPage: React.FC<EditorPageProps> = ({
  project,
  onUpdateProject,
  onBackToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<'scenes' | 'captions' | 'audio'>('scenes');
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRenderModalOpen, setIsRenderModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const totalDuration = project.scenes.reduce((acc, s) => acc + (s.duration || 4), 0);

  // Playback timer loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + dt;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }

      if (isPlaying) {
        animId = requestAnimationFrame(loop);
      }
    };

    if (isPlaying) {
      lastTime = performance.now();
      animId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, totalDuration]);

  // Synchronize current scene index based on playhead position
  useEffect(() => {
    let acc = 0;
    for (let i = 0; i < project.scenes.length; i++) {
      const d = project.scenes[i].duration || 4;
      if (currentTime >= acc && currentTime < acc + d) {
        if (currentSceneIndex !== i) {
          setCurrentSceneIndex(i);
        }
        break;
      }
      acc += d;
    }
  }, [currentTime, project.scenes]);

  const handleSelectScene = (index: number) => {
    setCurrentSceneIndex(index);
    // calculate start time of scene
    let acc = 0;
    for (let i = 0; i < index; i++) {
      acc += project.scenes[i]?.duration || 4;
    }
    setCurrentTime(acc);
  };

  const handleSaveProject = async () => {
    setIsSaving(true);
    try {
      const saved = await updateProject(project.id, project);
      onUpdateProject(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-neutral-950 text-white">
      {/* Studio Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900/60 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1 rounded-lg p-1.5 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white"
            title="Back to Dashboard"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-left">
            <input
              type="text"
              value={project.title}
              onChange={(e) => onUpdateProject({ ...project, title: e.target.value })}
              className="bg-transparent font-['Cabinet_Grotesk'] text-base font-bold text-white hover:border-neutral-700 focus:border-amber-500 focus:outline-none truncate max-w-xs sm:max-w-md"
            />
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <span>{project.language}</span>
              <span>·</span>
              <span className="capitalize">{project.contentType}</span>
              <span>·</span>
              <span className="capitalize">{project.visualStyle}</span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveProject}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition-colors"
          >
            {saveSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Saved</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save</span>
              </>
            )}
          </button>

          {project.finalVideoUrl && (
            <a
              href={`/api/export/${project.id}/mp4`}
              download
              className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download MP4</span>
            </a>
          )}

          <button
            onClick={() => setIsRenderModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-1.5 text-xs font-bold text-black transition-all active:scale-95 shadow-sm"
          >
            <PlaySquare className="h-4 w-4 fill-black" />
            <span>Render Video</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: 2-Column Split (Preview & Inspector) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 overflow-y-auto">
        {/* Left Column: 9:16 Vertical Preview & Playback */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start">
          <VerticalPreview
            project={project}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onTimeUpdate={(t) => setCurrentTime(t)}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            currentSceneIndex={currentSceneIndex}
            onSelectScene={handleSelectScene}
          />
        </div>

        {/* Right Column: Tabbed Inspector (Scenes, Captions, Audio Mixer) */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-neutral-800 pb-3 mb-4">
            <button
              onClick={() => setActiveTab('scenes')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'scenes'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Scenes ({project.scenes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('captions')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'captions'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Subtitles className="h-4 w-4" />
              <span>Captions & Style</span>
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'audio'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Music className="h-4 w-4" />
              <span>Music & Mixer</span>
            </button>
          </div>

          {/* Active Inspector Tab Content */}
          <div className="flex-1 max-h-[580px] overflow-y-auto pr-1">
            {activeTab === 'scenes' && (
              <SceneList
                project={project}
                onUpdateProject={onUpdateProject}
                currentSceneIndex={currentSceneIndex}
                onSelectScene={handleSelectScene}
              />
            )}
            {activeTab === 'captions' && (
              <CaptionEditor project={project} onUpdateProject={onUpdateProject} />
            )}
            {activeTab === 'audio' && (
              <AudioMixer project={project} onUpdateProject={onUpdateProject} />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Multi-Track Timeline */}
      <div className="p-4 sm:px-6 pb-6">
        <Timeline
          project={project}
          currentTime={currentTime}
          onTimeUpdate={(t) => setCurrentTime(t)}
          currentSceneIndex={currentSceneIndex}
          onSelectScene={handleSelectScene}
        />
      </div>

      {/* Render Modal */}
      <RenderModal
        isOpen={isRenderModalOpen}
        onClose={() => setIsRenderModalOpen(false)}
        project={project}
        onProjectUpdated={onUpdateProject}
      />
    </div>
  );
};

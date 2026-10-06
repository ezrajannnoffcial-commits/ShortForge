import React, { useState } from 'react';
import { Project, Scene } from '../../types.ts';
import { generateSceneVisual, generateTTS, transcribeAudio } from '../../services/api.ts';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Plus,
  RefreshCw,
  Sparkles,
  Mic,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface SceneListProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  currentSceneIndex: number;
  onSelectScene: (index: number) => void;
}

export const SceneList: React.FC<SceneListProps> = ({
  project,
  onUpdateProject,
  currentSceneIndex,
  onSelectScene,
}) => {
  const [loadingSceneId, setLoadingSceneId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string>('');

  // 1. Move scene up or down
  const moveScene = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= project.scenes.length) return;

    const newScenes = [...project.scenes];
    const temp = newScenes[index];
    newScenes[index] = newScenes[targetIndex];
    newScenes[targetIndex] = temp;

    // renumber
    newScenes.forEach((s, idx) => {
      s.number = idx + 1;
    });

    onUpdateProject({ ...project, scenes: newScenes });
    onSelectScene(targetIndex);
  };

  // 2. Duplicate scene
  const duplicateScene = (index: number) => {
    const orig = project.scenes[index];
    const copy: Scene = {
      ...orig,
      id: `scene_${Date.now()}_copy`,
      number: index + 2,
    };

    const newScenes = [...project.scenes];
    newScenes.splice(index + 1, 0, copy);
    newScenes.forEach((s, idx) => {
      s.number = idx + 1;
    });

    onUpdateProject({ ...project, scenes: newScenes });
    onSelectScene(index + 1);
  };

  // 3. Delete scene
  const deleteScene = (index: number) => {
    if (project.scenes.length <= 1) {
      alert('A Short requires at least one scene.');
      return;
    }

    const newScenes = project.scenes.filter((_, idx) => idx !== index);
    newScenes.forEach((s, idx) => {
      s.number = idx + 1;
    });

    onUpdateProject({ ...project, scenes: newScenes });
    onSelectScene(Math.max(0, index - 1));
  };

  // 4. Add new scene
  const addNewScene = () => {
    const newSceneNumber = project.scenes.length + 1;
    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      number: newSceneNumber,
      narration: 'Enter compelling narration here...',
      visualPrompt: `Cinematic vertical shot for scene ${newSceneNumber}`,
      duration: 4.0,
      visualType: 'video',
      status: 'pending',
    };

    const newScenes = [...project.scenes, newScene];
    onUpdateProject({ ...project, scenes: newScenes });
    onSelectScene(newScenes.length - 1);
  };

  // 5. Update specific scene field
  const updateSceneField = (index: number, field: keyof Scene, value: any) => {
    const newScenes = [...project.scenes];
    newScenes[index] = { ...newScenes[index], [field]: value };
    onUpdateProject({ ...project, scenes: newScenes });
  };

  // 6. Regenerate Scene Visual (independent regeneration)
  const handleRegenerateVisual = async (scene: Scene, index: number) => {
    setLoadingSceneId(scene.id);
    setLoadingAction('Generating Visual...');

    try {
      const res = await generateSceneVisual({
        sceneNumber: scene.number,
        prompt: scene.visualPrompt,
        narration: scene.narration,
        topic: project.topic,
        duration: scene.duration,
        visualStyle: project.visualStyle,
      });

      const newScenes = [...project.scenes];
      newScenes[index] = {
        ...newScenes[index],
        assetId: res.asset.assetId,
        assetUrl: res.asset.url,
        status: 'ready',
        error: undefined,
      };

      onUpdateProject({ ...project, scenes: newScenes });
    } catch (err: any) {
      console.error('Failed to regenerate visual:', err);
      const newScenes = [...project.scenes];
      newScenes[index] = { ...newScenes[index], status: 'failed', error: err.message };
      onUpdateProject({ ...project, scenes: newScenes });
    } finally {
      setLoadingSceneId(null);
      setLoadingAction('');
    }
  };

  // 7. Regenerate Scene Voice & Captions
  const handleRegenerateVoice = async (scene: Scene, index: number) => {
    setLoadingSceneId(scene.id);
    setLoadingAction('Synthesizing Voice...');

    try {
      const ttsRes = await generateTTS({
        text: scene.narration,
        voiceGender: project.voiceGender,
        voiceName: project.voiceName,
        language: project.language,
      });

      let captions = scene.captions;
      try {
        setLoadingAction('Syncing Captions...');
        const transRes = await transcribeAudio({
          assetId: ttsRes.asset.assetId,
          promptText: scene.narration,
        });
        captions = transRes.segments;
      } catch (transErr) {
        console.warn('Caption sync failed:', transErr);
      }

      const newScenes = [...project.scenes];
      newScenes[index] = {
        ...newScenes[index],
        audioAssetId: ttsRes.asset.assetId,
        audioUrl: ttsRes.asset.url,
        captions,
      };

      onUpdateProject({ ...project, scenes: newScenes });
    } catch (err: any) {
      console.error('Failed to regenerate voice:', err);
    } finally {
      setLoadingSceneId(null);
      setLoadingAction('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Scene Editor ({project.scenes.length} Scenes)
          </h3>
          <p className="text-xs text-neutral-400">
            Edit text, prompts, and regenerate individual scenes independently
          </p>
        </div>
        <button
          onClick={addNewScene}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Scene</span>
        </button>
      </div>

      {/* Scenes List */}
      <div className="space-y-3">
        {project.scenes.map((scene, idx) => {
          const isSelected = idx === currentSceneIndex;
          const isLoading = loadingSceneId === scene.id;

          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(idx)}
              className={`rounded-xl border p-4 transition-all text-left ${
                isSelected
                  ? 'border-amber-500/70 bg-neutral-900 shadow-md ring-1 ring-amber-500/30'
                  : 'border-neutral-800 bg-neutral-950/80 hover:border-neutral-700'
              }`}
            >
              {/* Scene Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-xs font-bold text-amber-400">
                    {scene.number}
                  </span>
                  <span className="text-xs font-bold text-white">Scene {scene.number}</span>
                  {scene.status === 'ready' && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                    </span>
                  )}
                  {scene.status === 'failed' && (
                    <span className="flex items-center gap-1 text-[11px] text-red-400">
                      <AlertCircle className="h-3.5 w-3.5" /> Error
                    </span>
                  )}
                </div>

                {/* Card toolbar */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveScene(idx, 'up');
                    }}
                    disabled={idx === 0}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-20"
                    title="Move Up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveScene(idx, 'down');
                    }}
                    disabled={idx === project.scenes.length - 1}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-20"
                    title="Move Down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateScene(idx);
                    }}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    title="Duplicate Scene"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteScene(idx);
                    }}
                    className="rounded p-1 text-neutral-400 hover:bg-red-500/20 hover:text-red-400"
                    title="Delete Scene"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Editable Narration */}
              <div className="mt-3">
                <label className="flex items-center gap-1 text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  <Mic className="h-3 w-3 text-emerald-400" />
                  Spoken Narration (Voiceover)
                </label>
                <textarea
                  value={scene.narration}
                  onChange={(e) => updateSceneField(idx, 'narration', e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  placeholder="What is spoken during this scene..."
                />
              </div>

              {/* Editable Visual Prompt */}
              <div className="mt-2.5">
                <label className="flex items-center gap-1 text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  Visual Direction & Prompt
                </label>
                <textarea
                  value={scene.visualPrompt}
                  onChange={(e) => updateSceneField(idx, 'visualPrompt', e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  placeholder="Evocative 9:16 visual prompt..."
                />
              </div>

              {/* Duration Slider & Per-Scene Regenerate Actions */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800/60">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-neutral-400" />
                  <span className="text-[11px] font-mono text-neutral-300">
                    Duration: {scene.duration}s
                  </span>
                  <input
                    type="range"
                    min={2.0}
                    max={10.0}
                    step={0.5}
                    value={scene.duration}
                    onChange={(e) =>
                      updateSceneField(idx, 'duration', parseFloat(e.target.value))
                    }
                    className="h-1 w-20 appearance-none rounded-lg bg-neutral-700 accent-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRegenerateVoice(scene, idx)}
                    disabled={isLoading}
                    className="flex items-center gap-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1 text-[11px] font-medium text-white transition-colors"
                  >
                    {isLoading && loadingAction.includes('Voice') ? (
                      <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
                    ) : (
                      <Mic className="h-3 w-3 text-emerald-400" />
                    )}
                    <span>Voice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRegenerateVisual(scene, idx)}
                    disabled={isLoading}
                    className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-400 transition-colors"
                  >
                    {isLoading && loadingAction.includes('Visual') ? (
                      <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
                    ) : (
                      <RefreshCw className="h-3 w-3 text-amber-400" />
                    )}
                    <span>Regenerate Media</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

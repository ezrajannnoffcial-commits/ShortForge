import React, { useState } from 'react';
import { Project, ContentType, VisualStyle } from '../types.ts';
import {
  Sparkles,
  Play,
  Film,
  FolderOpen,
  Trash2,
  Copy,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onCreateClick: (topic?: string, template?: any) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (project: Project) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onOpenProject,
  onCreateClick,
  onDeleteProject,
  onDuplicateProject,
}) => {
  const [quickTopic, setQuickTopic] = useState('');

  const templates: {
    title: string;
    description: string;
    contentType: ContentType;
    visualStyle: VisualStyle;
    duration: number;
    sampleTopic: string;
  }[] = [
    {
      title: 'Mind-Blowing Geography',
      description: 'Hidden micro-nations, strange borders, and unmapped territories.',
      contentType: 'geography',
      visualStyle: 'documentary',
      duration: 30,
      sampleTopic: 'The world’s smallest country',
    },
    {
      title: 'Deep Ocean Mysteries',
      description: 'Bioluminescence, Mariana trench secrets, and leviathans.',
      contentType: 'science',
      visualStyle: 'cinematic',
      duration: 30,
      sampleTopic: 'Why deep ocean creatures glow in the dark',
    },
    {
      title: 'Ancient Roman Inventions',
      description: 'Engineering marvels and daily tech from 2,000 years ago.',
      contentType: 'history',
      visualStyle: 'realistic',
      duration: 45,
      sampleTopic: '5 ancient Roman inventions we still use today',
    },
    {
      title: 'Extreme Space Oddities',
      description: 'Planets of glass, burning ice, and diamond rain.',
      contentType: 'science',
      visualStyle: '3d-render',
      duration: 30,
      sampleTopic: 'The bizarre planet where it rains glass sideways',
    },
  ];

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTopic.trim()) {
      onCreateClick(quickTopic.trim());
    } else {
      onCreateClick();
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-10 text-left">
      {/* Hero Quick Creation Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI YouTube Shorts Studio</span>
          </div>
          <h1 className="font-['Cabinet_Grotesk'] text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Turn Any Idea Into a Viral Vertical Short
          </h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-400 max-w-2xl">
            Automated Gemini scriptwriting, AI voiceover narration, 9:16 Ken Burns visuals, animated captions, and native FFmpeg 1080×1920 MP4 rendering.
          </p>

          {/* Quick Input Bar */}
          <form onSubmit={handleQuickCreate} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <input
              type="text"
              value={quickTopic}
              onChange={(e) => setQuickTopic(e.target.value)}
              placeholder="Enter a topic (e.g. The world's smallest country)..."
              className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950/80 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black transition-all hover:bg-amber-400 active:scale-95 shadow-md"
            >
              <Sparkles className="h-4 w-4 fill-black" />
              <span>Create Short</span>
            </button>
          </form>

          {/* Clean Workflow Pipeline Indicators */}
          <div className="mt-8 pt-6 border-t border-neutral-800/80 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 font-mono">
            <span className="text-amber-400 font-semibold">Workflow:</span>
            <span>Idea</span>
            <span>→</span>
            <span>Gemini Script</span>
            <span>→</span>
            <span>Scenes</span>
            <span>→</span>
            <span>Voice & TTS</span>
            <span>→</span>
            <span>Captions</span>
            <span>→</span>
            <span>Timeline</span>
            <span>→</span>
            <span>FFmpeg Render</span>
            <span>→</span>
            <span className="text-emerald-400 font-bold">1080×1920 MP4</span>
          </div>
        </div>

        {/* Ambient subtle decorative blur */}
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      {/* Featured Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-['Cabinet_Grotesk']">
              High-Retention Templates
            </h2>
            <p className="text-xs text-neutral-400">
              Pre-tuned formats designed for maximum YouTube Shorts watch time
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.title}
              onClick={() => onCreateClick(tpl.sampleTopic, tpl)}
              className="group cursor-pointer rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 hover:border-amber-500/50 hover:bg-neutral-900 transition-all text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400 uppercase">
                    {tpl.duration}s Short
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold capitalize">
                    {tpl.contentType}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  {tpl.title}
                </h3>
                <p className="mt-1 text-xs text-neutral-400 line-clamp-2">
                  {tpl.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span>Use Template</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-['Cabinet_Grotesk']">
              Your Projects ({projects.length})
            </h2>
            <p className="text-xs text-neutral-400">
              Continue editing, regenerate scenes, or render final MP4 exports
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950 p-12 text-center">
            <Film className="mx-auto h-10 w-10 text-neutral-600 mb-3" />
            <h3 className="text-sm font-semibold text-white">No Shorts created yet</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
              Enter any idea above or click "Create Short" to generate your first complete vertical video with Gemini and FFmpeg.
            </p>
            <button
              onClick={() => onCreateClick()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400"
            >
              <Sparkles className="h-3.5 w-3.5 fill-black" />
              <span>Create Your First Short</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((proj) => {
              const totalSec = proj.scenes.reduce((acc, s) => acc + (s.duration || 4), 0);
              const isRendered = !!proj.finalVideoUrl;

              return (
                <div
                  key={proj.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 hover:border-neutral-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Status & Timing */}
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="flex items-center gap-1.5 font-mono text-neutral-400">
                        <Clock className="h-3.5 w-3.5 text-neutral-500" />
                        {totalSec.toFixed(0)}s ({proj.scenes.length} scenes)
                      </span>
                      {isRendered ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> MP4 Ready
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400 font-medium">
                          Draft / Ready to Render
                        </span>
                      )}
                    </div>

                    <h3 className="font-['Cabinet_Grotesk'] text-base font-bold text-white line-clamp-1">
                      {proj.title}
                    </h3>
                    <p className="mt-1 text-xs text-neutral-400 line-clamp-2">
                      {proj.hook || proj.topic}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                    <button
                      onClick={() => onOpenProject(proj)}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-400 transition-colors"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      <span>Open Studio</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDuplicateProject(proj)}
                        className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="rounded p-1.5 text-neutral-400 hover:bg-red-500/20 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

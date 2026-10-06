import React from 'react';
import { Project } from '../types.ts';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  FolderOpen,
  Copy,
  Trash2,
  Film,
  Sparkles,
} from 'lucide-react';

interface ProjectsPageProps {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (project: Project) => void;
  onCreateClick: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  onOpenProject,
  onDeleteProject,
  onDuplicateProject,
  onCreateClick,
}) => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8 text-left">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400 mb-3">
            <FolderKanban className="h-3.5 w-3.5" />
            <span>Workspace</span>
          </div>
          <h1 className="font-['Cabinet_Grotesk'] text-2xl sm:text-3xl font-extrabold text-white">
            All Projects ({projects.length})
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400">
            Saved projects persist across reloads with full scene breakdowns and audio timelines.
          </p>
        </div>

        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition-colors shadow-sm"
        >
          <Sparkles className="h-4 w-4 fill-black" />
          <span>New Short</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950 p-12 text-center">
          <Film className="mx-auto h-10 w-10 text-neutral-600 mb-3" />
          <h3 className="text-sm font-semibold text-white">No projects found</h3>
          <p className="text-xs text-neutral-500 mt-1 mb-4">
            Create your first Short using Gemini and FFmpeg.
          </p>
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400"
          >
            <span>Create Short</span>
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
                        Draft / Ready
                      </span>
                    )}
                  </div>

                  <h3 className="font-['Cabinet_Grotesk'] text-base font-bold text-white line-clamp-1">
                    {proj.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-400 line-clamp-2">
                    {proj.hook || proj.topic}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                    <span className="capitalize">{proj.language}</span>
                    <span>·</span>
                    <span className="capitalize">{proj.contentType}</span>
                    <span>·</span>
                    <span className="capitalize">{proj.visualStyle}</span>
                  </div>
                </div>

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
  );
};

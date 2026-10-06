import React, { useState, useEffect } from 'react';
import { Project, Job } from '../../types.ts';
import { startRender, getRenderStatus, cancelRender } from '../../services/api.ts';
import {
  X,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Video,
  FileText,
  Subtitles,
  Share2,
} from 'lucide-react';

interface RenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onProjectUpdated: (project: Project) => void;
}

export const RenderModal: React.FC<RenderModalProps> = ({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
}) => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !jobId && !project.finalVideoUrl) {
      handleStartRender();
    }
  }, [isOpen]);

  // Polling for real job progress
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const currentJob = await getRenderStatus(jobId);
        setJob(currentJob);

        if (currentJob.status === 'completed') {
          clearInterval(interval);
          if (currentJob.result?.videoUrl) {
            onProjectUpdated({
              ...project,
              finalVideoUrl: currentJob.result.videoUrl,
              finalVideoAssetId: currentJob.result.assetId,
              status: 'completed',
            });
          }
        } else if (currentJob.status === 'failed' || currentJob.status === 'cancelled') {
          clearInterval(interval);
          setError(currentJob.error || 'Rendering job terminated.');
        }
      } catch (err: any) {
        console.error('Polling render error:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jobId]);

  const handleStartRender = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const { jobId } = await startRender(project.id);
      setJobId(jobId);
    } catch (err: any) {
      setError(err.message || 'Failed to start render pipeline.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCancel = async () => {
    if (!jobId) return;
    try {
      await cancelRender(jobId);
      setJobId(null);
      setJob(null);
    } catch (err) {
      console.error('Cancel render error:', err);
    }
  };

  if (!isOpen) return null;

  const isCompleted = job?.status === 'completed' || !!project.finalVideoUrl;
  const isProcessing = job?.status === 'processing' || job?.status === 'queued' || isStarting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 shadow-2xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Cabinet_Grotesk']">
                FFmpeg Production Render
              </h2>
              <p className="text-xs text-neutral-400">
                1080×1920 9:16 Vertical Video · H.264 / AAC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="my-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
                <span className="absolute font-mono text-xs font-bold text-white">
                  {job?.progress || 5}%
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                {job?.stage || 'Preparing FFmpeg pipeline...'}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Normalizing scene frames, applying Ken Burns motion, and mixing audio
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div
                style={{ width: `${Math.max(5, job?.progress || 5)}%` }}
                className="bg-amber-500 h-full transition-all duration-500"
              />
            </div>

            <button
              onClick={handleCancel}
              className="text-xs text-neutral-400 hover:text-red-400 font-medium"
            >
              Cancel Render
            </button>
          </div>
        )}

        {/* Completed State */}
        {isCompleted && (
          <div className="my-6 space-y-6">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Video rendered and encoded successfully!</span>
            </div>

            {/* Rendered Video Player Preview */}
            <div className="flex justify-center">
              <div className="aspect-[9/16] w-52 overflow-hidden rounded-xl border border-neutral-700 bg-black shadow-lg">
                <video
                  src={project.finalVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Export and Download Actions */}
            <div className="space-y-2">
              <a
                href={`/api/export/${project.id}/mp4`}
                download
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-black transition-transform active:scale-98 hover:bg-amber-400 shadow-md"
              >
                <Download className="h-4 w-4" />
                <span>Download Final MP4 (1080×1920)</span>
              </a>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <a
                  href={`/api/export/${project.id}/srt`}
                  download
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white"
                >
                  <Subtitles className="h-3.5 w-3.5 text-amber-400" />
                  <span>SRT Captions</span>
                </a>
                <a
                  href={`/api/export/${project.id}/script`}
                  download
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-400" />
                  <span>Script MD</span>
                </a>
                <a
                  href={`/api/export/${project.id}/json`}
                  download
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white"
                >
                  <Share2 className="h-3.5 w-3.5 text-purple-400" />
                  <span>Project JSON</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex justify-end pt-3 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

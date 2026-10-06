import React, { useEffect, useState, useRef } from 'react';
import { Project, MusicTrack } from '../../types.ts';
import { fetchStockTracks, uploadMedia } from '../../services/api.ts';
import { Music, Upload, Volume2, ShieldCheck, Check } from 'lucide-react';

interface AudioMixerProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const AudioMixer: React.FC<AudioMixerProps> = ({ project, onUpdateProject }) => {
  const [stockTracks, setStockTracks] = useState<MusicTrack[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStockTracks()
      .then((tracks) => setStockTracks(tracks))
      .catch((err) => console.error('Failed to load stock tracks:', err));
  }, []);

  const selectTrack = (track: MusicTrack | undefined) => {
    onUpdateProject({
      ...project,
      musicTrack: track,
    });
  };

  const handleUploadMusic = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const asset = await uploadMedia(file);
      const customTrack: MusicTrack = {
        id: asset.id,
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: asset.url,
        duration: 60,
        volume: 0.15,
        ducking: true,
        fadeIn: 1.0,
        fadeOut: 2.0,
        loop: true,
      };

      setStockTracks((prev) => [customTrack, ...prev]);
      selectTrack(customTrack);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5 text-left">
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Audio Mixer & Ducking
        </h3>
        <p className="text-xs text-neutral-400">
          Professional auto-ducking beneath voice narration with royalty-free tracks
        </p>
      </div>

      {/* Volume Balancers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
        {/* Voice Volume */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
              Voiceover Volume
            </span>
            <span className="text-xs font-mono text-emerald-400">
              {Math.round((project.voiceVolume ?? 1.0) * 100)}% (0 dB)
            </span>
          </div>
          <input
            type="range"
            min={0.2}
            max={1.5}
            step={0.05}
            value={project.voiceVolume ?? 1.0}
            onChange={(e) =>
              onUpdateProject({ ...project, voiceVolume: parseFloat(e.target.value) })
            }
            className="w-full h-1.5 appearance-none rounded-lg bg-neutral-800 accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Music Volume */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-purple-400" />
              Music Ducked Bed
            </span>
            <span className="text-xs font-mono text-purple-400">
              {Math.round((project.musicVolume ?? 0.15) * 100)}% (-18 dB)
            </span>
          </div>
          <input
            type="range"
            min={0.05}
            max={0.5}
            step={0.02}
            value={project.musicVolume ?? 0.15}
            onChange={(e) =>
              onUpdateProject({ ...project, musicVolume: parseFloat(e.target.value) })
            }
            className="w-full h-1.5 appearance-none rounded-lg bg-neutral-800 accent-purple-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Background Track Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            Background Music Selection
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
          >
            <Upload className="h-3 w-3" />
            <span>Upload MP3</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleUploadMusic}
            className="hidden"
          />
        </div>

        <div className="space-y-2">
          {/* None Option */}
          <button
            type="button"
            onClick={() => selectTrack(undefined)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              !project.musicTrack
                ? 'border-amber-500 bg-amber-500/10 text-white'
                : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400">
                <Music className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">No Background Music</div>
                <div className="text-[10px] text-neutral-500">Narration only</div>
              </div>
            </div>
            {!project.musicTrack && <Check className="h-4 w-4 text-amber-400" />}
          </button>

          {/* Stock tracks */}
          {stockTracks.map((t) => {
            const isSelected = project.musicTrack?.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTrack(t)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                    <Music className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{t.title}</div>
                    <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ShieldCheck className="h-3 w-3" /> Royalty-Free
                      </span>
                      <span>·</span>
                      <span>Auto-Ducked Beneath Speech</span>
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="h-4 w-4 text-purple-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Asset } from '../types.ts';
import { fetchAssets, uploadMedia } from '../services/api.ts';
import {
  Layers,
  Upload,
  Video,
  Image as ImageIcon,
  Mic,
  Film,
  Loader2,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'final-video'>('all');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await fetchAssets();
      setAssets(data);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const newAsset = await uploadMedia(file);
      setAssets((prev) => [newAsset, ...prev]);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const filteredAssets = filter === 'all' ? assets : assets.filter((a) => a.type === filter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8 text-left">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400 mb-3">
            <Layers className="h-3.5 w-3.5" />
            <span>Project Asset Library</span>
          </div>
          <h1 className="font-['Cabinet_Grotesk'] text-2xl sm:text-3xl font-extrabold text-white">
            Media & Asset Vault
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400">
            All AI-generated scene visuals, voice tracks, rendered MP4s, and user uploads.
          </p>
        </div>

        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition-colors shadow-sm"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-black" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>Upload Media</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl w-fit">
        {(['all', 'image', 'video', 'audio', 'final-video'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize ${
              filter === type
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {type.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Asset Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950 p-12 text-center text-neutral-500 text-xs">
          No assets found in this category. Generate a Short or upload media to populate your library.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div className="aspect-square w-full rounded-lg bg-black overflow-hidden flex items-center justify-center mb-2.5">
                {asset.type === 'image' && (
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    className="h-full w-full object-cover"
                  />
                )}
                {(asset.type === 'video' || asset.type === 'final-video') && (
                  <video
                    src={asset.url}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                  />
                )}
                {asset.type === 'audio' && (
                  <div className="flex flex-col items-center justify-center text-emerald-400">
                    <Mic className="h-8 w-8 mb-1" />
                    <audio src={asset.url} controls className="w-full scale-75 mt-1" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                  <span className="uppercase font-mono font-semibold text-amber-400">
                    {asset.type}
                  </span>
                  <span>{asset.provider}</span>
                </div>
                <div className="truncate text-xs font-medium text-white" title={asset.filename}>
                  {asset.filename}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  <span>View</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

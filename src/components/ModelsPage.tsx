import React, { useState, useEffect } from 'react';
import { ProviderConfig, ProviderTestResult } from '../types.ts';
import { fetchProviders, updateProvider, testProvider } from '../services/api.ts';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';

export const ModelsPage: React.FC = () => {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, ProviderTestResult>>({});

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await fetchProviders();
      setProviders(data);
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (provider: ProviderConfig) => {
    try {
      const updated = await updateProvider(provider.id, { enabled: !provider.enabled });
      setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleUpdateField = async (providerId: string, field: keyof ProviderConfig, value: any) => {
    try {
      const updated = await updateProvider(providerId, { [field]: value });
      setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err: any) {
      console.error('Failed to update provider field:', err);
    }
  };

  const handleTest = async (providerId: string) => {
    setTestingId(providerId);
    try {
      const result = await testProvider(providerId);
      setTestResults((prev) => ({ ...prev, [providerId]: result }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          providerId,
          connected: false,
          message: err.message || 'Connection test failed',
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const categories = [
    { key: 'llm', label: 'Script & LLM Providers' },
    { key: 'tts', label: 'AI Voice & Speech (TTS)' },
    { key: 'transcription', label: 'Captions & Transcription' },
    { key: 'video', label: 'AI Video Providers' },
    { key: 'image', label: 'AI Image Providers' },
    { key: 'renderer', label: 'Video Rendering Engine' },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8 text-left">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400 mb-3">
          <Server className="h-3.5 w-3.5" />
          <span>Provider Abstraction Architecture</span>
        </div>
        <h1 className="font-['Cabinet_Grotesk'] text-2xl sm:text-3xl font-extrabold text-white">
          AI Providers & Model Endpoints
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-400">
          Configure server-side inference, local ComfyUI/Piper/Whisper services, and verify real live connectivity.
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((cat) => {
          const catProviders = providers.filter((p) => p.category === cat.key);
          if (catProviders.length === 0) return null;

          return (
            <div key={cat.key} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-2">
                {cat.label}
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {catProviders.map((p) => {
                  const testRes = testResults[p.id];
                  const isTesting = testingId === p.id;

                  return (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 text-amber-400">
                            <Cpu className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white">{p.name}</h3>
                              {p.isSystemProvider && (
                                <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                              Model / Engine: {p.modelId || 'Custom'}
                            </p>
                          </div>
                        </div>

                        {/* Enable switch & Test Button */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleTest(p.id)}
                            disabled={isTesting}
                            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition-colors"
                          >
                            {isTesting ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                                <span>Testing...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="h-3.5 w-3.5 text-amber-400" />
                                <span>Test Connection</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggle(p)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              p.enabled ? 'bg-amber-500' : 'bg-neutral-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                                p.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Connection Test Banner if tested */}
                      {testRes && (
                        <div
                          className={`flex items-start gap-2.5 rounded-xl p-3 text-xs ${
                            testRes.connected
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/10 border border-red-500/30 text-red-400'
                          }`}
                        >
                          {testRes.connected ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="font-bold">
                              {testRes.connected ? 'Connected' : 'Connection failed'}
                              {testRes.latencyMs !== undefined && (
                                <span className="font-mono font-normal ml-2 opacity-80">
                                  ({testRes.latencyMs}ms)
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] opacity-90">{testRes.message}</p>
                          </div>
                        </div>
                      )}

                      {/* Endpoint & Setting fields for non-default or configurable */}
                      {!p.isSystemProvider && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800/60">
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                              Endpoint URL
                            </label>
                            <input
                              type="text"
                              value={p.endpoint || ''}
                              onChange={(e) => handleUpdateField(p.id, 'endpoint', e.target.value)}
                              placeholder="http://localhost:8188 or https://..."
                              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:border-amber-500 focus:outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                              API Key / Secret Token
                            </label>
                            <input
                              type="password"
                              value={p.apiKey || ''}
                              onChange={(e) => handleUpdateField(p.id, 'apiKey', e.target.value)}
                              placeholder="Stored securely on server-side"
                              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:border-amber-500 focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

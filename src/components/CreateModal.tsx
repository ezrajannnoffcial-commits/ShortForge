import React, { useState } from 'react';
import { Project, ContentType, VisualStyle, VoiceGender } from '../types.ts';
import { generateScript, createProject, generateSceneVisual, generateTTS, transcribeAudio } from '../services/api.ts';
import { X, Sparkles, Loader2, Wand2, Clock, Globe, Film, Mic, BookOpen, Cpu } from 'lucide-react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
  initialTopic?: string;
  initialTemplate?: {
    contentType: ContentType;
    visualStyle: VisualStyle;
    duration: number;
  };
}

export const CreateModal: React.FC<CreateModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
  initialTopic = '',
  initialTemplate,
}) => {
  const [topic, setTopic] = useState(initialTopic || '');
  const [aiEngine, setAiEngine] = useState<'auto' | 'gemini-llm' | 'hf-llama-llm'>('auto');
  const [duration, setDuration] = useState<number>(initialTemplate?.duration || 30);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [language, setLanguage] = useState<string>('English');
  const [contentType, setContentType] = useState<ContentType>(initialTemplate?.contentType || 'geography');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(initialTemplate?.visualStyle || 'documentary');
  const [customStyle, setCustomStyle] = useState<string>('');
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female');
  const [voiceName, setVoiceName] = useState<string>('Kore');
  const [autoGenerateMedia, setAutoGenerateMedia] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever modal opens or initialTopic changes
  React.useEffect(() => {
    if (isOpen) {
      setTopic(initialTopic || '');
      if (initialTemplate) {
        setContentType(initialTemplate.contentType);
        setVisualStyle(initialTemplate.visualStyle);
        setDuration(initialTemplate.duration);
      }
      setError(null);
    }
  }, [isOpen, initialTopic, initialTemplate]);

  if (!isOpen) return null;

  const quickTopics = [
    'The world’s smallest country',
    'Why deep oceans glow in the dark',
    '5 Roman inventions we still use today',
    'The bizarre planet where it rains glass sideways',
    'How caffeine tricks your brain into staying awake',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please provide a topic or prompt.');
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage('Generating script and scene breakdown with Gemini...');

    try {
      const finalDuration = customDuration ? parseInt(customDuration, 10) || 30 : duration;

      // 1. Generate Structured Script with selected AI engine (Gemini or Open Source Llama 3)
      const scriptResult = await generateScript({
        topic: topic.trim(),
        duration: finalDuration,
        language,
        contentType,
        visualStyle,
        customStylePrompt: customStyle.trim() || undefined,
        providerId: aiEngine === 'auto' ? undefined : aiEngine,
      });

      // 2. Build initial project
      setStatusMessage('Creating project workspace...');
      const initialScenes = scriptResult.scenes.map((s: any, idx: number) => ({
        id: s.id || `scene_${idx + 1}`,
        number: s.number || idx + 1,
        narration: s.narration || '',
        visualPrompt: s.visualPrompt || '',
        duration: s.duration || 4,
        visualType: s.visualType || 'video',
        status: 'pending' as const,
      }));

      let project = await createProject({
        title: scriptResult.title || topic,
        topic,
        targetDuration: finalDuration,
        language,
        contentType,
        visualStyle,
        customStylePrompt: customStyle,
        voiceGender,
        voiceName,
        hook: scriptResult.hook || '',
        fullScript: scriptResult.script || '',
        scenes: initialScenes,
        status: 'scripted',
      });

      // 3. Optional immediate media generation for all scenes
      if (autoGenerateMedia && project.scenes.length > 0) {
        setStatusMessage('Generating voice narration & visuals for scenes...');
        const updatedScenes = [...project.scenes];

        for (let i = 0; i < updatedScenes.length; i++) {
          const sc = updatedScenes[i];
          setStatusMessage(`Synthesizing Scene ${i + 1} of ${updatedScenes.length}...`);

          try {
            // Generate Voice with Gemini Flash Lite TTS
            const ttsRes = await generateTTS({
              text: sc.narration,
              voiceGender,
              voiceName,
              language,
            });

            sc.audioAssetId = ttsRes.asset.assetId;
            sc.audioUrl = ttsRes.asset.url;

            // Generate timed captions
            try {
              const transRes = await transcribeAudio({
                assetId: ttsRes.asset.assetId,
                promptText: sc.narration,
              });
              sc.captions = transRes.segments;
            } catch (err) {
              console.warn('Transcription failed for scene', i + 1, err);
            }

            // Generate scene visual (real provider with fallback)
            const visualRes = await generateSceneVisual({
              sceneNumber: sc.number,
              prompt: sc.visualPrompt,
              narration: sc.narration,
              topic,
              duration: sc.duration,
              visualStyle,
            });

            sc.assetId = visualRes.asset.assetId;
            sc.assetUrl = visualRes.asset.url;
            sc.status = 'ready';
          } catch (sceneErr: any) {
            console.error(`Error in scene ${i + 1}:`, sceneErr);
            let cleanMsg = sceneErr?.message || 'Media synthesis issue';
            if (cleanMsg.includes('quota') || cleanMsg.includes('429') || cleanMsg.includes('RESOURCE_EXHAUSTED')) {
              cleanMsg = 'AI rate limit reached. Fallback voice will be used on retry.';
            }
            sc.status = 'failed';
            sc.error = cleanMsg;
          }
        }

        // Save updated project
        project = await createProject({
          ...project,
          scenes: updatedScenes,
          status: 'ready_to_render',
        });
      }

      onProjectCreated(project);
      onClose();
    } catch (err: any) {
      console.error('Project creation failed:', err);
      setError(err.message || 'Failed to generate Short. Please try again.');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 shadow-2xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white font-['Cabinet_Grotesk']">
                Create New YouTube Short
              </h2>
              <p className="text-xs text-neutral-400">
                Transform any topic into a complete 9:16 vertical video with AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="mt-6 space-y-5">
          {/* Topic Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Topic or Concept
            </label>
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. The world's smallest country"
                disabled={loading}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            {/* Quick Suggestions */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="text-[11px] text-neutral-500 py-0.5">Suggestions:</span>
              {quickTopics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className="rounded-md bg-neutral-800/80 px-2 py-0.5 text-[11px] text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors truncate max-w-xs"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* AI Model & Script Engine Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300">
                <Cpu className="h-3.5 w-3.5 text-amber-400" />
                Scriptwriting AI Model
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">
                Free Open Source & Gemini
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'auto', name: 'Auto-Hybrid (Recommended)', desc: 'Best available free model' },
                { id: 'gemini-llm', name: 'Gemini 3.8 Flash', desc: 'Google AI Cloud Engine' },
                { id: 'hf-llama-llm', name: 'Llama 3.3 70B', desc: 'Hugging Face Open Source' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAiEngine(m.id as any)}
                  className={`rounded-xl p-2.5 text-left border transition-all ${
                    aiEngine === m.id
                      ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{m.name}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Language Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Duration
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[15, 30, 45, 60].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDuration(d);
                      setCustomDuration('');
                    }}
                    className={`rounded-lg py-2 text-xs font-semibold border transition-all ${
                      duration === d && !customDuration
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                <Globe className="h-3.5 w-3.5 text-amber-400" />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs font-medium text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Khmer">Khmer (ភាសាខ្មែរ)</option>
                <option value="Korean">Korean (한국어)</option>
                <option value="Vietnamese">Vietnamese (Tiếng Việt)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Japanese">Japanese (日本語)</option>
              </select>
            </div>
          </div>

          {/* Content Type & Visual Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Content Type */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                Content Format
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs font-medium text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="facts">Mind-Blowing Facts</option>
                <option value="history">Historical Events</option>
                <option value="science">Scientific Mystery</option>
                <option value="geography">Geography & Places</option>
                <option value="technology">Cutting-Edge Tech</option>
                <option value="story">Engaging Micro-Story</option>
                <option value="education">Fast Educational Explainer</option>
                <option value="news">News-Style Breakdown</option>
                <option value="top5">Top 5 Countdown</option>
              </select>
            </div>

            {/* Visual Style */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                <Film className="h-3.5 w-3.5 text-amber-400" />
                Visual Style
              </label>
              <select
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value as VisualStyle)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs font-medium text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="cinematic">Cinematic 8K</option>
                <option value="documentary">National Geographic Documentary</option>
                <option value="realistic">Hyper-Realistic</option>
                <option value="anime">Anime / Manga Aesthetic</option>
                <option value="3d-render">Unreal Engine 5 3D</option>
                <option value="minimalist">Minimalist Modern</option>
                <option value="vintage">Vintage 1970s Film</option>
                <option value="cyberpunk">Cyberpunk Neon</option>
              </select>
            </div>
          </div>

          {/* Voice Profile */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              <Mic className="h-3.5 w-3.5 text-amber-400" />
              AI Voiceover Narrator
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Kore', gender: 'female' as const, label: 'Kore (Clear / Confident)' },
                { name: 'Zephyr', gender: 'female' as const, label: 'Zephyr (High Energy)' },
                { name: 'Fenrir', gender: 'male' as const, label: 'Fenrir (Deep / Cinematic)' },
                { name: 'Puck', gender: 'male' as const, label: 'Puck (Upbeat / Casual)' },
              ].map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => {
                    setVoiceName(v.name);
                    setVoiceGender(v.gender);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    voiceName === v.name
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold text-white">{v.name}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{v.gender} narrator</div>
                </button>
              ))}
            </div>
          </div>

          {/* Auto-generate media switch */}
          <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
            <div>
              <span className="text-xs font-semibold text-white block">Auto-Generate Scene Media</span>
              <span className="text-[11px] text-neutral-400">
                Synthesize FLUX.1 open source 9:16 vertical visuals, AI voiceover narration, and synchronized animated captions
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoGenerateMedia(!autoGenerateMedia)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoGenerateMedia ? 'bg-amber-500' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                  autoGenerateMedia ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-black transition-all hover:bg-amber-400 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  <span>{statusMessage || 'Processing...'}</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 fill-black" />
                  <span>Generate Short</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

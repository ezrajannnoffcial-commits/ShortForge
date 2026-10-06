import React from 'react';
import { ContentType, VisualStyle } from '../types.ts';
import { LayoutTemplate, Sparkles, ArrowRight, Clock, Film } from 'lucide-react';

interface TemplatesPageProps {
  onUseTemplate: (topic: string, template: any) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ onUseTemplate }) => {
  const templates = [
    {
      id: 'facts',
      title: 'Mind-Blowing Facts Countdown',
      category: 'Curiosity',
      description: 'Ultra-fast pacing, high-contrast visual transitions, punchy one-sentence reveals.',
      duration: 30,
      contentType: 'facts' as ContentType,
      visualStyle: 'cinematic' as VisualStyle,
      suggestedTopics: [
        'The world’s smallest country',
        '3 animals that can survive in outer space',
        'The deepest hole ever dug by humans',
      ],
    },
    {
      id: 'geography',
      title: 'Strange Geography & Borders',
      category: 'Geography',
      description: 'Micro-nations, enclaves, extreme climate anomalies, and contested frontiers.',
      duration: 30,
      contentType: 'geography' as ContentType,
      visualStyle: 'documentary' as VisualStyle,
      suggestedTopics: [
        'The world’s smallest country',
        'Why this town is half in Spain and half in France',
        'The desert where it never rained for 400 years',
      ],
    },
    {
      id: 'history',
      title: 'Ancient World Inventions',
      category: 'History',
      description: 'Lost civilizational engineering, ancient mystery weapons, and enduring marvels.',
      duration: 45,
      contentType: 'history' as ContentType,
      visualStyle: 'realistic' as VisualStyle,
      suggestedTopics: [
        '5 ancient Roman inventions we still use today',
        'The deadly Greek fire weapon lost to history',
        'How ancient Egyptians illuminated subterranean tombs',
      ],
    },
    {
      id: 'science',
      title: 'Deep Ocean & Space Anomalies',
      category: 'Science',
      description: 'Abyssal bioluminescence, deep cosmic structures, and mind-bending physics.',
      duration: 30,
      contentType: 'science' as ContentType,
      visualStyle: '3d-render' as VisualStyle,
      suggestedTopics: [
        'Why deep oceans glow in the dark',
        'The bizarre planet where it rains glass sideways',
        'What happens when a black hole swallows a neutron star',
      ],
    },
    {
      id: 'technology',
      title: 'Next-Gen AI & Robotics',
      category: 'Technology',
      description: 'Cutting-edge cybernetics, humanoid robotics, and quantum computing explainers.',
      duration: 30,
      contentType: 'technology' as ContentType,
      visualStyle: 'cyberpunk' as VisualStyle,
      suggestedTopics: [
        'How quantum computers factor encryption in seconds',
        'Humanoid robots working inside automobile factories',
        'Synthetic biology and programmable DNA chips',
      ],
    },
    {
      id: 'story',
      title: 'Intense 60-Second Micro-Story',
      category: 'Storytelling',
      description: 'Suspenseful narrative arc with a cliffhanger turning point in the final 5 seconds.',
      duration: 60,
      contentType: 'story' as ContentType,
      visualStyle: 'cinematic' as VisualStyle,
      suggestedTopics: [
        'The lone lighthouse keeper who vanished without a trace',
        'The submarine crew that survived at 800 feet depth',
        'The astronaut who dropped the space station wrench',
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8 text-left">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400 mb-3">
          <LayoutTemplate className="h-3.5 w-3.5" />
          <span>Proven YouTube Shorts Blueprints</span>
        </div>
        <h1 className="font-['Cabinet_Grotesk'] text-2xl sm:text-3xl font-extrabold text-white">
          Shorts Templates & Frameworks
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-400">
          Engineered script pacing, hook formulas, and visual styles optimized for algorithmic retention.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-[10px] text-neutral-400">
                  {tpl.duration}s Short
                </span>
                <span className="font-semibold text-amber-400">{tpl.category}</span>
              </div>

              <h3 className="font-['Cabinet_Grotesk'] text-base font-bold text-white">
                {tpl.title}
              </h3>
              <p className="mt-1.5 text-xs text-neutral-400">{tpl.description}</p>

              <div className="mt-4 pt-3 border-t border-neutral-800/80">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-2">
                  Suggested Hooks
                </span>
                <div className="space-y-1.5">
                  {tpl.suggestedTopics.map((top) => (
                    <button
                      key={top}
                      type="button"
                      onClick={() => onUseTemplate(top, tpl)}
                      className="w-full text-left rounded-lg bg-neutral-950/80 hover:bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white transition-colors flex items-center justify-between group"
                    >
                      <span className="truncate">{top}</span>
                      <ArrowRight className="h-3 w-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800/80">
              <button
                type="button"
                onClick={() => onUseTemplate(tpl.suggestedTopics[0], tpl)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 fill-black" />
                <span>Use This Template</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

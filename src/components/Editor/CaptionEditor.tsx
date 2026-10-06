import React from 'react';
import { Project, CaptionStyle } from '../../types.ts';
import { Type, Palette, AlignVerticalJustifyCenter, Sparkles } from 'lucide-react';

interface CaptionEditorProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({ project, onUpdateProject }) => {
  const style = project.captionStyle;

  const updateStyle = (key: keyof CaptionStyle, value: any) => {
    onUpdateProject({
      ...project,
      captionStyle: {
        ...style,
        [key]: value,
      },
    });
  };

  const fonts = [
    'Impact',
    'Arial Black',
    'Plus Jakarta Sans',
    'Cabinet Grotesk',
    'Trebuchet MS',
    'Verdana',
  ];

  const highlightColors = [
    { label: 'Viral Yellow', hex: '#FACC15' },
    { label: 'Neon Green', hex: '#22C55E' },
    { label: 'Electric Cyan', hex: '#06B6D4' },
    { label: 'Hot Pink', hex: '#F43F5E' },
    { label: 'Clean White', hex: '#FFFFFF' },
  ];

  return (
    <div className="space-y-5 text-left">
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Animated Caption Styler
        </h3>
        <p className="text-xs text-neutral-400">
          Customize viral animated subtitle styling burned into your final 9:16 Short
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Font Family */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
            <Type className="h-3.5 w-3.5 text-amber-400" />
            Font Family
          </label>
          <select
            value={style.fontFamily}
            onChange={(e) => updateStyle('fontFamily', e.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs font-medium text-white focus:border-amber-500 focus:outline-none"
          >
            {fonts.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Font Size ({style.fontSize}px)
            </label>
          </div>
          <input
            type="range"
            min={36}
            max={76}
            step={2}
            value={style.fontSize}
            onChange={(e) => updateStyle('fontSize', parseInt(e.target.value, 10))}
            className="w-full h-2 appearance-none rounded-lg bg-neutral-800 accent-amber-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Position Selection */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
          <AlignVerticalJustifyCenter className="h-3.5 w-3.5 text-amber-400" />
          Vertical Placement
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['top', 'middle', 'bottom'] as const).map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => updateStyle('position', pos)}
              className={`rounded-xl py-2.5 text-xs font-semibold uppercase border transition-all ${
                style.position === pos
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Highlight Color Picker */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
          <Palette className="h-3.5 w-3.5 text-amber-400" />
          Word Highlight Color
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {highlightColors.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => updateStyle('highlightColor', c.hex)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                style.highlightColor === c.hex
                  ? 'border-amber-500 bg-neutral-800 text-white'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.hex }} />
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Animation Style & Uppercase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Animation Effect
          </label>
          <select
            value={style.animation}
            onChange={(e) => updateStyle('animation', e.target.value as any)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs font-medium text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="word-highlight">Word-by-Word Highlight (TikTok/Shorts Style)</option>
            <option value="bounce">Bouncy Pop-in</option>
            <option value="none">Static Clean Subtitle</option>
          </select>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-3">
          <div>
            <span className="text-xs font-semibold text-white block">ALL CAPS</span>
            <span className="text-[10px] text-neutral-400">Uppercase for viral punchiness</span>
          </div>
          <button
            type="button"
            onClick={() => updateStyle('uppercase', !style.uppercase)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              style.uppercase ? 'bg-amber-500' : 'bg-neutral-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                style.uppercase ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

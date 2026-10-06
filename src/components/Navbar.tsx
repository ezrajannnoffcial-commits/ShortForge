import React from 'react';
import { ActiveTab } from '../types.ts';
import { Video, Sparkles, FolderKanban, Cpu, LayoutTemplate, Layers } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onCreateClick: () => void;
  hasActiveProject?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onCreateClick,
  hasActiveProject = false,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Brand Title (single text element) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-black font-extrabold shadow-sm">
              <Video className="h-5 w-5" />
            </div>
            <span className="font-['Cabinet_Grotesk'] text-xl font-black tracking-tight text-white">
              ShortForge<span className="text-amber-500">.AI</span>
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'dashboard' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          {hasActiveProject && (
            <button
              onClick={() => onTabChange('editor')}
              className={`transition-colors flex items-center gap-1.5 ${
                activeTab === 'editor' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Studio Editor
            </button>
          )}
          <button
            onClick={() => onTabChange('projects')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'projects' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FolderKanban className="h-4 w-4" />
            Projects
          </button>
          <button
            onClick={() => onTabChange('templates')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'templates' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </button>
          <button
            onClick={() => onTabChange('models')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'models' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu className="h-4 w-4" />
            Providers & Models
          </button>
          <button
            onClick={() => onTabChange('assets')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'assets' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            Assets
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-amber-400 active:scale-95 shadow-sm"
          >
            <Sparkles className="h-4 w-4 fill-black" />
            <span className="whitespace-nowrap">Create New Short</span>
          </button>
        </div>
      </div>
    </header>
  );
};

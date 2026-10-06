import React, { useState, useEffect } from 'react';
import { Project, ActiveTab } from './types.ts';
import { fetchProjects, deleteProject, createProject } from './services/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { EditorPage } from './components/Editor/EditorPage.tsx';
import { ModelsPage } from './components/ModelsPage.tsx';
import { TemplatesPage } from './components/TemplatesPage.tsx';
import { AssetsPage } from './components/AssetsPage.tsx';
import { ProjectsPage } from './components/ProjectsPage.tsx';
import { CreateModal } from './components/CreateModal.tsx';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialTopic, setCreateInitialTopic] = useState('');
  const [createInitialTemplate, setCreateInitialTemplate] = useState<any>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
      if (data.length > 0 && !activeProject) {
        setActiveProject(data[0]);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = (project: Project) => {
    setActiveProject(project);
    setActiveTab('editor');
  };

  const handleCreateClick = (topic?: string, template?: any) => {
    setCreateInitialTopic(topic || '');
    setCreateInitialTemplate(template || null);
    setIsCreateModalOpen(true);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveProject(newProject);
    setActiveTab('editor');
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProject?.id === id) {
        setActiveProject(null);
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleDuplicateProject = async (orig: Project) => {
    try {
      const copy = await createProject({
        ...orig,
        id: undefined,
        title: `${orig.title} (Copy)`,
        finalVideoUrl: undefined,
        finalVideoAssetId: undefined,
        status: 'draft',
      });
      setProjects((prev) => [copy, ...prev]);
      setActiveProject(copy);
      setActiveTab('editor');
    } catch (err: any) {
      alert(`Duplicate failed: ${err.message}`);
    }
  };

  const handleUpdateActiveProject = (updated: Project) => {
    setActiveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-500" />
          <p className="font-['Cabinet_Grotesk'] text-sm font-bold tracking-wider uppercase text-neutral-400">
            Loading ShortForge AI...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-amber-500 selection:text-black">
      {/* Top Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onCreateClick={() => handleCreateClick()}
        hasActiveProject={!!activeProject}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <Dashboard
            projects={projects}
            onOpenProject={handleOpenProject}
            onCreateClick={handleCreateClick}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
          />
        )}

        {activeTab === 'editor' && activeProject && (
          <EditorPage
            project={activeProject}
            onUpdateProject={handleUpdateActiveProject}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'editor' && !activeProject && (
          <div className="p-12 text-center">
            <p className="text-sm text-neutral-400">No project selected.</p>
            <button
              onClick={() => handleCreateClick()}
              className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black"
            >
              Create New Short
            </button>
          </div>
        )}

        {activeTab === 'projects' && (
          <ProjectsPage
            projects={projects}
            onOpenProject={handleOpenProject}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            onCreateClick={() => handleCreateClick()}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesPage
            onUseTemplate={(topic, template) => handleCreateClick(topic, template)}
          />
        )}

        {activeTab === 'models' && <ModelsPage />}

        {activeTab === 'assets' && <AssetsPage />}
      </main>

      {/* Creation Modal */}
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
        initialTopic={createInitialTopic}
        initialTemplate={createInitialTemplate}
      />
    </div>
  );
}

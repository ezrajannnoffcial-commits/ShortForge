import { Project, ProviderConfig, ProviderTestResult, MusicTrack, Asset } from '../types.ts';

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects');
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch projects');
  return data.projects;
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch project');
  return data.project;
}

export async function createProject(projectData: Partial<Project>): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Failed to create project');
  return data.project;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Failed to update project');
  return data.project;
}

export async function deleteProject(id: string): Promise<boolean> {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  const data = await res.json();
  return !!data.success;
}

export async function generateScript(params: {
  topic: string;
  duration: number;
  language: string;
  contentType: string;
  visualStyle: string;
  customStylePrompt?: string;
  providerId?: string;
}): Promise<any> {
  const res = await fetch('/api/generate/script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Failed to generate script');
  return data.result;
}

export async function generateSceneVisual(params: {
  sceneNumber: number;
  prompt: string;
  narration: string;
  topic: string;
  duration: number;
  visualStyle: string;
}): Promise<{ asset: any; fallbackUsed: boolean; fallbackReason?: string }> {
  const res = await fetch('/api/generate/scene-visual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Failed to generate visual');
  return data;
}

export async function generateTTS(params: {
  text: string;
  voiceGender?: string;
  voiceName?: string;
  language?: string;
}): Promise<{ asset: any }> {
  const res = await fetch('/api/generate/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Failed to generate speech');
  return data;
}

export async function transcribeAudio(params: {
  assetId: string;
  promptText?: string;
}): Promise<{ text: string; segments: any[] }> {
  const res = await fetch('/api/generate/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Failed to transcribe audio');
  return data.result;
}

export async function startRender(projectId: string): Promise<{ jobId: string }> {
  const res = await fetch('/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Failed to start render');
  return { jobId: data.jobId };
}

export async function getRenderStatus(jobId: string): Promise<any> {
  const res = await fetch(`/api/render/${jobId}/status`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Failed to get render status');
  return data.job;
}

export async function cancelRender(jobId: string): Promise<boolean> {
  const res = await fetch(`/api/render/${jobId}/cancel`, { method: 'POST' });
  const data = await res.json();
  return !!data.success;
}

export async function fetchProviders(): Promise<ProviderConfig[]> {
  const res = await fetch('/api/providers');
  const data = await res.json();
  return data.providers || [];
}

export async function updateProvider(id: string, updates: Partial<ProviderConfig>): Promise<ProviderConfig> {
  const res = await fetch(`/api/providers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  return data.provider;
}

export async function testProvider(providerId: string): Promise<ProviderTestResult> {
  const res = await fetch('/api/providers/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId }),
  });
  const data = await res.json();
  return data.result;
}

export async function fetchStockTracks(): Promise<MusicTrack[]> {
  const res = await fetch('/api/audio/tracks');
  const data = await res.json();
  return data.tracks || [];
}

export async function uploadMedia(file: File): Promise<Asset> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Upload failed');
  return data.asset;
}

export async function fetchAssets(): Promise<Asset[]> {
  const res = await fetch('/api/assets');
  const data = await res.json();
  return data.assets || [];
}

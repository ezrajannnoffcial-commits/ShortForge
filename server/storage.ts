import fs from 'fs';
import path from 'path';
import { Project, Asset, ProviderConfig } from '../shared/types.ts';

export const DATA_DIR = path.resolve(process.env.STORAGE_PATH || './data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');
const PROVIDERS_FILE = path.join(DATA_DIR, 'providers.json');

export const ASSETS_DIR = path.join(DATA_DIR, 'assets');
export const RENDERS_DIR = path.join(DATA_DIR, 'renders');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const TEMP_DIR = path.join(DATA_DIR, 'temp');

export function initStorage() {
  [DATA_DIR, ASSETS_DIR, RENDERS_DIR, UPLOADS_DIR, TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(ASSETS_FILE)) {
    fs.writeFileSync(ASSETS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(PROVIDERS_FILE)) {
    const defaultProviders = getDefaultProviders();
    fs.writeFileSync(PROVIDERS_FILE, JSON.stringify(defaultProviders, null, 2), 'utf-8');
  }
}

export function getDefaultProviders(): ProviderConfig[] {
  return [
    {
      id: 'gemini-llm',
      category: 'llm',
      name: 'Gemini 3.8 Flash (Server-Side)',
      enabled: true,
      priority: 1,
      modelId: 'gemini-3.8-flash',
      isSystemProvider: true,
    },
    {
      id: 'hf-llama-llm',
      category: 'llm',
      name: 'Llama 3.3 70B (Hugging Face / Open Source)',
      enabled: true,
      priority: 2,
      modelId: 'meta-llama/Llama-3.3-70B-Instruct',
      endpoint: 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.3-70B-Instruct',
    },
    {
      id: 'gemini-tts',
      category: 'tts',
      name: 'Gemini 3.8 Flash Lite TTS',
      enabled: true,
      priority: 1,
      modelId: 'gemini-3.8-flash-lite-tts',
      isSystemProvider: true,
    },
    {
      id: 'free-tts',
      category: 'tts',
      name: 'Free Multi-Lingual Speech Synthesizer',
      enabled: true,
      priority: 2,
      modelId: 'neural-tts-open',
      isSystemProvider: true,
    },
    {
      id: 'piper-tts',
      category: 'tts',
      name: 'Piper / Coqui Local TTS',
      enabled: false,
      priority: 3,
      endpoint: 'http://localhost:5000/api/tts',
      modelId: 'en_US-lessac-medium',
    },
    {
      id: 'gemini-transcribe',
      category: 'transcription',
      name: 'Gemini 3.5 Transcribe (Timestamped)',
      enabled: true,
      priority: 1,
      modelId: 'gemini-3.5-transcribe',
      isSystemProvider: true,
    },
    {
      id: 'whisper-local',
      category: 'transcription',
      name: 'Whisper Local / Remote Endpoint',
      enabled: false,
      priority: 2,
      endpoint: 'http://localhost:9000/asr',
    },
    {
      id: 'free-flux-image',
      category: 'image',
      name: 'FLUX.1 Open Source (Free / Serverless)',
      enabled: true,
      priority: 1,
      modelId: 'black-forest-labs/FLUX.1-schnell',
      endpoint: 'https://image.pollinations.ai/prompt',
      isSystemProvider: true,
    },
    {
      id: 'huggingface-image',
      category: 'image',
      name: 'Hugging Face FLUX.1 / SDXL',
      enabled: true,
      priority: 2,
      endpoint: 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
    },
    {
      id: 'gemini-image',
      category: 'image',
      name: 'Gemini Flash Image Generator',
      enabled: true,
      priority: 3,
      modelId: 'gemini-3.1-flash-lite-image',
      isSystemProvider: true,
    },
    {
      id: 'comfyui-image',
      category: 'image',
      name: 'ComfyUI Local Image Generator',
      enabled: false,
      priority: 4,
      endpoint: 'http://localhost:8188',
      modelId: 'sdxl_turbo',
    },
    {
      id: 'veo-video',
      category: 'video',
      name: 'Veo 3.1 Lite Video (Google GenAI)',
      enabled: false,
      priority: 1,
      modelId: 'veo-3.1-lite-generate-preview',
      isSystemProvider: true,
    },
    {
      id: 'comfyui-video',
      category: 'video',
      name: 'ComfyUI Local Video Generator',
      enabled: false,
      priority: 2,
      endpoint: 'http://localhost:8188',
      modelId: 'wan2.1-t2v',
    },
    {
      id: 'ffmpeg-renderer',
      category: 'renderer',
      name: 'Native System FFmpeg (Ken Burns & 1080x1920 MP4)',
      enabled: true,
      priority: 1,
      isSystemProvider: true,
      options: {
        binaryPath: '/usr/bin/ffmpeg',
        defaultFps: 30,
      }
    }
  ];
}

// Project storage operations
export function getProjects(): Project[] {
  initStorage();
  try {
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading projects:', err);
    return [];
  }
}

export function getProjectById(id: string): Project | null {
  const projects = getProjects();
  return projects.find((p) => p.id === id) || null;
}

export function saveProject(project: Project): Project {
  initStorage();
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  const now = new Date().toISOString();
  
  if (index >= 0) {
    projects[index] = { ...project, updatedAt: now };
  } else {
    projects.unshift({ ...project, createdAt: now, updatedAt: now });
  }
  
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  return index >= 0 ? projects[index] : projects[0];
}

export function deleteProject(id: string): boolean {
  initStorage();
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length !== projects.length) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }
  return false;
}

// Asset storage operations
export function getAssets(): Asset[] {
  initStorage();
  try {
    const raw = fs.readFileSync(ASSETS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading assets:', err);
    return [];
  }
}

export function getAssetById(id: string): Asset | null {
  const assets = getAssets();
  return assets.find((a) => a.id === id) || null;
}

export function saveAsset(asset: Asset): Asset {
  initStorage();
  const assets = getAssets();
  const index = assets.findIndex((a) => a.id === asset.id);
  if (index >= 0) {
    assets[index] = asset;
  } else {
    assets.unshift(asset);
  }
  fs.writeFileSync(ASSETS_FILE, JSON.stringify(assets, null, 2), 'utf-8');
  return asset;
}

// Provider storage operations
export function getProviderConfigs(): ProviderConfig[] {
  initStorage();
  try {
    const raw = fs.readFileSync(PROVIDERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading providers:', err);
    return getDefaultProviders();
  }
}

export function saveProviderConfigs(configs: ProviderConfig[]): ProviderConfig[] {
  initStorage();
  fs.writeFileSync(PROVIDERS_FILE, JSON.stringify(configs, null, 2), 'utf-8');
  return configs;
}

export function updateProviderConfig(id: string, updates: Partial<ProviderConfig>): ProviderConfig | null {
  const configs = getProviderConfigs();
  const idx = configs.findIndex(c => c.id === id);
  if (idx === -1) return null;
  configs[idx] = { ...configs[idx], ...updates };
  saveProviderConfigs(configs);
  return configs[idx];
}

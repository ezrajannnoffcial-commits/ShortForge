export type ShortDuration = 15 | 30 | 45 | 60 | number;

export type LanguageCode = 'en' | 'km' | 'ko' | 'vi' | 'es' | 'fr' | 'de' | 'ja' | 'other';

export type ContentType = 
  | 'facts' 
  | 'top5'
  | 'history' 
  | 'science' 
  | 'geography' 
  | 'technology' 
  | 'story' 
  | 'education' 
  | 'news' 
  | 'custom';

export type VisualStyle = 
  | 'cinematic' 
  | 'documentary' 
  | 'realistic' 
  | 'anime' 
  | '3d-render' 
  | 'minimalist' 
  | 'vintage' 
  | 'cyberpunk'
  | 'custom';

export type VoiceGender = 'male' | 'female' | 'custom';

export interface Scene {
  id: string;
  number: number;
  narration: string;
  visualPrompt: string;
  duration: number; // in seconds (e.g. 3.5, 5)
  visualType: 'video' | 'image';
  assetId?: string;
  assetUrl?: string;
  audioAssetId?: string;
  audioUrl?: string;
  captions?: CaptionSegment[];
  status: 'pending' | 'generating' | 'ready' | 'failed';
  error?: string;
}

export interface CaptionSegment {
  id: string;
  start: number; // seconds relative to scene or project
  end: number;
  text: string;
  words?: { word: string; start: number; end: number }[];
}

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number; // in pt/px
  textColor: string;
  highlightColor: string;
  outlineColor: string;
  outlineWidth: number;
  position: 'top' | 'middle' | 'bottom';
  yPercent: number; // 0-100%
  animation: 'none' | 'bounce' | 'word-highlight' | 'pop-in';
  uppercase: boolean;
  boxBackground: boolean;
  boxColor: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  url: string;
  duration: number;
  volume: number; // 0.0 - 1.0 (e.g. 0.15 for -16dB)
  ducking: boolean; // duck under speech
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
}

export interface RenderSettings {
  resolution: '1080x1920';
  fps: 30 | 60;
  videoCodec: 'libx264';
  audioCodec: 'aac';
  crf: number; // 18-28 (20 recommended)
  burnCaptions: boolean;
  transition: 'none' | 'fade' | 'dissolve' | 'wipeleft';
  transitionDuration: number;
}

export interface Project {
  id: string;
  title: string;
  topic: string;
  description?: string;
  targetDuration: ShortDuration;
  language: string;
  contentType: ContentType;
  visualStyle: VisualStyle;
  customStylePrompt?: string;
  voiceGender: VoiceGender;
  voiceName: string;
  hook: string;
  fullScript: string;
  scenes: Scene[];
  captionStyle: CaptionStyle;
  musicTrack?: MusicTrack;
  voiceVolume: number; // 1.0 = 0dB
  musicVolume: number; // 0.15 = -16dB
  renderSettings: RenderSettings;
  finalVideoUrl?: string;
  finalVideoAssetId?: string;
  status: 'draft' | 'scripted' | 'generating_media' | 'ready_to_render' | 'rendering' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  type: 'image' | 'video' | 'audio' | 'subtitle' | 'final-video';
  mimeType: string;
  url: string;
  filename: string;
  provider: string;
  status: 'ready' | 'processing' | 'failed';
  width?: number;
  height?: number;
  duration?: number;
  createdAt: string;
}

export interface Job {
  id: string;
  type: 'script' | 'scene_visual' | 'tts' | 'transcribe' | 'render';
  projectId: string;
  sceneId?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0 - 100
  stage: string;
  message?: string;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderConfig {
  id: string;
  category: 'llm' | 'video' | 'image' | 'tts' | 'transcription' | 'renderer';
  name: string;
  enabled: boolean;
  priority: number;
  endpoint?: string;
  apiKey?: string;
  modelId?: string;
  options?: Record<string, any>;
  isSystemProvider?: boolean;
}

export interface ProviderTestResult {
  providerId: string;
  connected: boolean;
  latencyMs?: number;
  message: string;
}

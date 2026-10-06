import { Scene, ShortDuration, ContentType, VisualStyle, CaptionSegment } from '../../shared/types.ts';

export interface ScriptRequest {
  topic: string;
  duration: ShortDuration;
  language: string;
  contentType: ContentType;
  visualStyle: VisualStyle;
  customStylePrompt?: string;
  targetSceneCount?: number;
}

export interface GeneratedScenePlan {
  id: string;
  number: number;
  narration: string;
  visualPrompt: string;
  duration: number; // in seconds
  visualType: 'video' | 'image';
}

export interface ScriptResult {
  title: string;
  hook: string;
  script: string;
  estimatedDuration: number;
  scenes: GeneratedScenePlan[];
}

export interface ImageGenerationRequest {
  prompt: string;
  visualStyle?: string;
  aspectRatio?: '9:16' | '1:1' | '16:9';
  sceneNumber?: number;
  topic?: string;
}

export interface GenerationResult {
  assetId: string;
  url: string;
  mimeType: string;
  provider: string;
  width?: number;
  height?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface VideoGenerationRequest {
  prompt: string;
  visualStyle?: string;
  durationSeconds?: number;
  aspectRatio?: '9:16' | '16:9';
  referenceImageUrl?: string;
}

export interface TTSRequest {
  text: string;
  voiceGender?: 'male' | 'female' | 'custom';
  voiceName?: string;
  language?: string;
  speed?: number;
}

export interface TranscriptionRequest {
  audioPath: string;
  language?: string;
  promptText?: string;
}

export interface TranscriptResult {
  text: string;
  segments: CaptionSegment[];
}

export interface LLMProvider {
  id: string;
  name: string;
  generateScript(input: ScriptRequest): Promise<ScriptResult>;
  testConnection(): Promise<boolean>;
}

export interface VideoProvider {
  id: string;
  name: string;
  generateVideo(input: VideoGenerationRequest): Promise<{ jobId?: string; result?: GenerationResult }>;
  getJobStatus(jobId: string): Promise<{ status: 'processing' | 'ready' | 'failed'; result?: GenerationResult; error?: string }>;
  testConnection(): Promise<boolean>;
}

export interface ImageProvider {
  id: string;
  name: string;
  generateImage(input: ImageGenerationRequest): Promise<GenerationResult>;
  testConnection(): Promise<boolean>;
}

export interface TTSProvider {
  id: string;
  name: string;
  generateSpeech(input: TTSRequest): Promise<GenerationResult>;
  testConnection(): Promise<boolean>;
}

export interface TranscriptionProvider {
  id: string;
  name: string;
  transcribe(input: TranscriptionRequest): Promise<TranscriptResult>;
  testConnection(): Promise<boolean>;
}

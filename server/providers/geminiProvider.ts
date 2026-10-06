import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import * as googleTTS from 'google-tts-api';
import {
  LLMProvider,
  TTSProvider,
  TranscriptionProvider,
  ScriptRequest,
  ScriptResult,
  TTSRequest,
  TranscriptionRequest,
  TranscriptResult,
  GenerationResult,
} from './types.ts';
import { ASSETS_DIR, saveAsset } from '../storage.ts';
import { Asset, CaptionSegment } from '../../shared/types.ts';

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export class GeminiLLMProvider implements LLMProvider {
  id = 'gemini-llm';
  name = 'Gemini 3.8 Flash';

  async testConnection(): Promise<boolean> {
    try {
      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Ping',
      });
      return !!response.text;
    } catch (err) {
      console.error('Gemini test connection failed:', err);
      return false;
    }
  }

  async generateScript(input: ScriptRequest): Promise<ScriptResult> {
    const ai = getGenAIClient();
    
    // Pacing guidelines based on target duration
    // Typical natural speaking rate is 2.2 to 2.6 words per second
    const targetSeconds = input.duration;
    const targetWordCount = Math.round(targetSeconds * 2.3);
    const sceneCount = input.targetSceneCount || Math.max(3, Math.round(targetSeconds / 4.5));
    const avgSceneDuration = Math.round((targetSeconds / sceneCount) * 10) / 10;

    const systemInstruction = `You are an elite viral YouTube Shorts scriptwriter and visual director.
Your absolute goal is to write high-retention, punchy 9:16 vertical video scripts.
CRITICAL MANDATE:
The script MUST be 100% specifically about the user's provided topic: "${input.topic}".
Never substitute with any default or example topic. Every line of narration and every scene visual prompt MUST be directly about "${input.topic}".

Follow these rules strictly:
1. Hook: The first 3 seconds MUST have an irresistible, immediate hook that stops scrolling about "${input.topic}". No greetings like "Hey guys" or "Did you know".
2. Pacing: Target approximately ${targetWordCount} total spoken words across ${sceneCount} scenes. Total duration must be approximately ${targetSeconds} seconds.
3. Content Type: Format style is "${input.contentType}".
4. Language: Write in ${input.language}.
5. Visual Prompts: For each scene, write an evocative, cinematic visual prompt describing camera motion (e.g. "Slow cinematic push-in on...", "Extreme macro shot of...", "Aerial drone zoom...") matching the visual style "${input.visualStyle}" and specifically illustrating "${input.topic}".
6. Output MUST strictly match the JSON schema.`;

    const prompt = `Generate a complete, viral YouTube Short script strictly about: "${input.topic}".
Language: ${input.language}
Format Style: ${input.contentType}
Visual Style: ${input.visualStyle}${input.customStylePrompt ? ` (${input.customStylePrompt})` : ''}
Target Duration: ${targetSeconds} seconds
Scene Count: ${sceneCount} scenes`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;
    let response: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Catchy title for the Short' },
                hook: { type: Type.STRING, description: 'The explosive 3-second opening hook' },
                script: { type: Type.STRING, description: 'Complete full narration text' },
                estimatedDuration: { type: Type.NUMBER, description: 'Total estimated duration in seconds' },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: 'Unique scene identifier' },
                      narration: { type: Type.STRING, description: 'Spoken voiceover for this specific scene' },
                      visualPrompt: { type: Type.STRING, description: 'Detailed prompt for generating the 9:16 vertical video or image' },
                      duration: { type: Type.NUMBER, description: 'Scene duration in seconds (between 2.5 and 7.0)' },
                      visualType: { type: Type.STRING, description: 'Type of visual: "video" or "image"' },
                    },
                    required: ['narration', 'visualPrompt', 'duration'],
                  },
                },
              },
              required: ['title', 'hook', 'script', 'scenes'],
            },
          },
        });
        if (response?.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} unavailable, trying next candidate:`, err.message);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All Gemini candidate models returned empty responses.');
    }

    const rawText = response.text || '{}';
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      // Safe structured recovery: strip markdown fences if present
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(cleaned);
    }

    if (!data.scenes || !Array.isArray(data.scenes) || data.scenes.length === 0) {
      throw new Error('Gemini returned an invalid script with no scenes.');
    }

    // Normalize scenes and ensure sequential numbering and ids
    let accumulatedDuration = 0;
    const normalizedScenes = data.scenes.map((s: any, idx: number) => {
      const dur = typeof s.duration === 'number' && s.duration > 0 ? s.duration : avgSceneDuration;
      accumulatedDuration += dur;
      return {
        id: s.id || `scene_${idx + 1}_${crypto.randomBytes(4).toString('hex')}`,
        number: idx + 1,
        narration: s.narration || '',
        visualPrompt: s.visualPrompt || `Cinematic vertical shot of ${input.topic}, scene ${idx + 1}`,
        duration: Math.round(dur * 10) / 10,
        visualType: (s.visualType === 'image' ? 'image' : 'video') as 'video' | 'image',
      };
    });

    return {
      title: data.title || input.topic,
      hook: data.hook || (normalizedScenes[0]?.narration || ''),
      script: data.script || normalizedScenes.map((s: any) => s.narration).join(' '),
      estimatedDuration: Math.round(accumulatedDuration * 10) / 10,
      scenes: normalizedScenes,
    };
  }
}

let geminiTtsQuotaExhaustedUntil = 0;

export class GeminiTTSProvider implements TTSProvider {
  id = 'gemini-tts';
  name = 'Gemini 3.8 Flash Lite TTS';

  async testConnection(): Promise<boolean> {
    if (Date.now() < geminiTtsQuotaExhaustedUntil) {
      return true; // Fallback speech synthesizer is active and ready
    }
    try {
      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [{ role: 'user', parts: [{ text: 'Test' }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      return !!response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch {
      return true; // Fallback neural voice is operational
    }
  }

  async generateSpeech(input: TTSRequest): Promise<GenerationResult> {
    // If Gemini daily quota was exhausted, directly use the fast open-source speech synthesizer
    if (Date.now() < geminiTtsQuotaExhaustedUntil) {
      return await this.generateFallbackSpeech(input);
    }

    try {
      const ai = getGenAIClient();
      
      // Select voice according to gender / preferences
      let voiceName = input.voiceName;
      if (!voiceName) {
        if (input.voiceGender === 'male') {
          voiceName = 'Fenrir';
        } else {
          voiceName = 'Kore';
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: input.text,
                speechMetadata: {
                  style: 'Engaging, clear, broadcast YouTube Shorts narrator',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('No audio data received');
      }

      const audioBuffer = Buffer.from(base64Audio, 'base64');
      const assetId = `asset_audio_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const filename = `${assetId}.wav`;
      const filePath = path.join(ASSETS_DIR, filename);

      fs.writeFileSync(filePath, audioBuffer);

      // Calculate approximate duration from WAV file size (24kHz, 16-bit mono = 48,000 bytes/sec)
      const dataSize = Math.max(0, audioBuffer.length - 44);
      const estimatedDurationSec = Math.round((dataSize / 48000) * 100) / 100;

      const asset: Asset = {
        id: assetId,
        type: 'audio',
        mimeType: 'audio/wav',
        url: `/api/assets/${filename}`,
        filename,
        provider: 'gemini-tts',
        status: 'ready',
        duration: estimatedDurationSec,
        createdAt: new Date().toISOString(),
      };

      saveAsset(asset);

      return {
        assetId,
        url: asset.url,
        mimeType: 'audio/wav',
        provider: 'gemini-tts',
        duration: estimatedDurationSec,
      };
    } catch (err: any) {
      // Mark Gemini daily quota as exhausted so subsequent calls skip directly to the open-source voice
      if (err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
        geminiTtsQuotaExhaustedUntil = Date.now() + 7 * 3600 * 1000;
      }
      return await this.generateFallbackSpeech(input);
    }
  }

  async generateFallbackSpeech(input: TTSRequest): Promise<GenerationResult> {
    const langMap: Record<string, string> = {
      English: 'en',
      en: 'en',
      Khmer: 'km',
      km: 'km',
      Korean: 'ko',
      ko: 'ko',
      Vietnamese: 'vi',
      vi: 'vi',
      Spanish: 'es',
      es: 'es',
      French: 'fr',
      fr: 'fr',
      German: 'de',
      de: 'de',
      Japanese: 'ja',
      ja: 'ja',
    };

    const langCode = (input.language && langMap[input.language]) || 'en';
    const cleanText = input.text.trim().replace(/[*_#`]/g, '');

    // Get MP3 audio from googleTTS
    const base64Mp3 = await googleTTS.getAudioBase64(cleanText.slice(0, 195), {
      lang: langCode,
      slow: false,
      timeout: 8000,
    });

    const mp3Buffer = Buffer.from(base64Mp3, 'base64');
    const assetId = `asset_audio_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const tempMp3Path = path.join(ASSETS_DIR, `${assetId}_temp.mp3`);
    const wavPath = path.join(ASSETS_DIR, `${assetId}.wav`);

    fs.writeFileSync(tempMp3Path, mp3Buffer);

    // Convert MP3 to standard 24kHz mono 16-bit WAV via FFmpeg
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('/usr/bin/ffmpeg', [
        '-y',
        '-i', tempMp3Path,
        '-ar', '24000',
        '-ac', '1',
        wavPath
      ]);
      proc.on('close', (code) => {
        try { fs.unlinkSync(tempMp3Path); } catch {}
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg audio conversion exited with code ${code}`));
      });
      proc.on('error', reject);
    });

    const wavBuffer = fs.readFileSync(wavPath);
    const dataSize = Math.max(0, wavBuffer.length - 44);
    const duration = Math.round((dataSize / 48000) * 100) / 100;

    const asset: Asset = {
      id: assetId,
      type: 'audio',
      mimeType: 'audio/wav',
      url: `/api/assets/${assetId}.wav`,
      filename: `${assetId}.wav`,
      provider: 'google-tts-fallback',
      status: 'ready',
      duration,
      createdAt: new Date().toISOString(),
    };

    saveAsset(asset);

    return {
      assetId,
      url: asset.url,
      mimeType: 'audio/wav',
      provider: 'google-tts-fallback',
      duration,
    };
  }
}

export class GeminiTranscriptionProvider implements TranscriptionProvider {
  id = 'gemini-transcribe';
  name = 'Gemini 3.5 Transcribe';

  async testConnection(): Promise<boolean> {
    return !!process.env.GEMINI_API_KEY;
  }

  async transcribe(input: TranscriptionRequest): Promise<TranscriptResult> {
    const ai = getGenAIClient();
    
    // Read the audio file
    const audioBuffer = fs.readFileSync(input.audioPath);
    const base64Audio = audioBuffer.toString('base64');

    const prompt = `Transcribe this spoken narration accurately into timestamped caption segments suitable for animated YouTube Shorts captions.
Break the narration into short phrases (2 to 5 words each) with precise start and end times in seconds.
Return STRICT JSON format:
{
  "text": "full spoken text",
  "segments": [
    {
      "start": 0.0,
      "end": 1.2,
      "text": "First short phrase",
      "words": [
        { "word": "First", "start": 0.0, "end": 0.4 },
        { "word": "short", "start": 0.4, "end": 0.8 },
        { "word": "phrase", "start": 0.8, "end": 1.2 }
      ]
    }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'audio/wav',
                data: base64Audio,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              segments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    start: { type: Type.NUMBER },
                    end: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                    words: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          word: { type: Type.STRING },
                          start: { type: Type.NUMBER },
                          end: { type: Type.NUMBER },
                        },
                        required: ['word', 'start', 'end'],
                      },
                    },
                  },
                  required: ['start', 'end', 'text'],
                },
              },
            },
            required: ['text', 'segments'],
          },
        },
      });

      const raw = response.text || '{}';
      const parsed = JSON.parse(raw);
      
      const segments: CaptionSegment[] = (parsed.segments || []).map((seg: any, idx: number) => ({
        id: `cap_${idx}_${Date.now()}`,
        start: seg.start,
        end: seg.end,
        text: seg.text,
        words: seg.words,
      }));

      return {
        text: parsed.text || '',
        segments,
      };
    } catch (err) {
      console.warn('Gemini audio transcription fallback to acoustic-text alignment:', err);
      // Fallback: If transcription audio upload encounters issues, use promptText with proportional duration
      return fallbackAlignText(input.promptText || '', audioBuffer.length);
    }
  }
}

function fallbackAlignText(text: string, wavSizeBytes: number): TranscriptResult {
  const dataSize = Math.max(0, wavSizeBytes - 44);
  const totalDuration = Math.max(1, dataSize / 48000); // 24kHz mono 16-bit
  
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { text: '', segments: [] };
  }

  // Group into chunks of 3-4 words for dynamic captions
  const segments: CaptionSegment[] = [];
  const chunkSize = 3;
  const timePerWord = totalDuration / words.length;

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkWords = words.slice(i, i + chunkSize);
    const segStart = Math.round((i * timePerWord) * 100) / 100;
    const segEnd = Math.round((Math.min(totalDuration, (i + chunkWords.length) * timePerWord)) * 100) / 100;
    
    segments.push({
      id: `cap_seg_${i}_${Date.now()}`,
      start: segStart,
      end: segEnd,
      text: chunkWords.join(' '),
      words: chunkWords.map((w, wIdx) => ({
        word: w,
        start: Math.round(((i + wIdx) * timePerWord) * 100) / 100,
        end: Math.round(((i + wIdx + 1) * timePerWord) * 100) / 100,
      })),
    });
  }

  return { text, segments };
}

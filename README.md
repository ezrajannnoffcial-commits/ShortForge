# ShortForge AI 🎬⚡

> **Production-grade AI YouTube Shorts Generator.** Turn any concept into a viral vertical 9:16 video with Gemini scripts, scene division, AI voice narration, synchronized animated subtitles, Ken Burns motion effects, and real native FFmpeg rendering.

---

## 🌟 Key Features

- **Gemini Script Engine**: Automatically generates punchy hooks, estimated durations, and scene-by-scene narration formatted for vertical retention.
- **Provider Abstraction Architecture**: Clean separation between AI models and application logic. Supports Gemini, ComfyUI, Hugging Face, Piper TTS, Whisper, and Custom HTTP endpoints.
- **Real Image-to-Motion Fallback**: If external GPU video models are offline, ShortForge automatically generates high-resolution cinematic slides and applies dynamic Ken Burns zoom/pan motion filters via FFmpeg to output real 9:16 scene video clips.
- **AI Voice Narration & Word-by-Word Subtitles**: Built-in speech synthesis with prebuilt male/female voices, real transcription, and animated word highlighting burned directly into the output MP4.
- **Multi-Track Timeline Editor**: Real 4-track timeline (Video, Voice, Music, Captions) with drag scrubbing, scene reordering, per-scene independent regeneration, and duration trimming.
- **Automatic Audio Ducking**: Blends spoken voiceover (-3 dB) with background music ducked underneath (-18 dB).
- **Native FFmpeg MP4 Rendering**: Compiles, normalizes, stitches, and encodes clean 1080×1920 (9:16) H.264/AAC videos.
- **Persistent Project Storage**: Projects, scenes, assets, and render states persist across browser reloads.

---

## 🛠️ Architecture Overview

```
User Topic Input
       ↓
Gemini 3.8 Flash (Structured Script + Scene Breakdown)
       ↓
Per-Scene Visual Generation (ComfyUI / Veo / Hugging Face / Image Motion Fallback)
       ↓
Gemini Flash Lite TTS (Voiceover Narration WAV)
       ↓
Gemini 3.5 Transcribe (Word & Phrase Timestamps)
       ↓
Studio Timeline Editor (Reorder, Trim, Custom Style, Audio Ducking)
       ↓
Native FFmpeg Pipeline (1080x1920 Scaling + Ken Burns + ASS Subtitles + AAC Mix)
       ↓
Production-Ready 9:16 MP4 Download
```

---

## 🚀 Quick Start

### 1. Requirements

- **Node.js**: v18+ or v20+
- **FFmpeg**: System binary (`/usr/bin/ffmpeg`) installed on the host
- **Gemini API Key**: Set via `GEMINI_API_KEY` in `.env`

### 2. Installation

```bash
# Clone the repository
git clone <repo-url>
cd shortforge-ai

# Install dependencies
npm install

# Start the full-stack server (runs Express API + Vite dev server on port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## ⚙️ Environment Variables

Create or update `.env`:

```env
# Required for Gemini scripts, voiceover narration, and transcription
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Server configuration
PORT=3000
STORAGE_PATH="./data"

# Optional external video providers (ComfyUI, Hugging Face, etc.)
VIDEO_PROVIDER_URL=""
VIDEO_PROVIDER_API_KEY=""

# Optional external image providers (ComfyUI, SDXL, FLUX)
IMAGE_PROVIDER_URL=""
IMAGE_PROVIDER_API_KEY=""

# Optional external TTS & STT providers (Piper, Coqui, Whisper)
TTS_PROVIDER_URL=""
TRANSCRIPTION_PROVIDER_URL=""
```

---

## 🔌 Connecting Local & External Models

Go to the **Providers & Models** page in the ShortForge UI to configure and test any provider:

### ComfyUI Local Inference
- Set Endpoint to `http://localhost:8188`
- Click **Test Connection** to verify live connectivity
- When offline, ShortForge automatically falls back to cinematic image-motion synthesis so your video generation never breaks.

### Piper / Coqui TTS
- Set Endpoint to your local HTTP TTS wrapper (e.g. `http://localhost:5000/api/tts`)
- Defaults to Google Gemini Flash Lite TTS for instant broadcast-quality speech.

---

## 📦 Production Build

```bash
# Build frontend bundle
npm run build

# Start production server
npm run start
```

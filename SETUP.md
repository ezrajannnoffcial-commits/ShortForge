# ShortForge AI - Setup & Deployment Guide

This guide details configuring server dependencies, external AI engines, and production containerization.

---

## 1. System Requirements

### FFmpeg Installation
ShortForge AI requires FFmpeg with `libx264`, `libmp3lame`, and `subtitles` filter support.

**Ubuntu / Debian:**
```bash
sudo apt update
sudo apt install -y ffmpeg libass-dev
```

**macOS (Homebrew):**
```bash
brew install ffmpeg libass
```

Verify installation:
```bash
ffmpeg -version
```

---

## 2. Gemini API Setup

1. Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. Add your key to `.env`:
   ```bash
   GEMINI_API_KEY="your-actual-api-key"
   ```
3. Test your connection from the **Providers & Models** page in the ShortForge UI.

---

## 3. Local ComfyUI Setup (Optional)

1. Launch your ComfyUI server with `--listen 0.0.0.0 --port 8188`:
   ```bash
   python main.py --listen 0.0.0.0 --port 8188
   ```
2. In ShortForge AI -> **Providers & Models** -> ComfyUI:
   - Endpoint: `http://localhost:8188`
   - Click **Test Connection**.

---

## 4. Docker Deployment

```dockerfile
FROM node:20-bullseye

RUN apt-get update && apt-get install -y ffmpeg libass-dev fonts-dejavu && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
```

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  getProjects,
  getProjectById,
  saveProject,
  deleteProject,
  getAssets,
  getAssetById,
  saveAsset,
  getProviderConfigs,
  updateProviderConfig,
  UPLOADS_DIR,
  ASSETS_DIR,
  RENDERS_DIR,
} from '../storage.ts';
import { registry } from '../providers/providerRegistry.ts';
import { createJob, getJob, updateJob, cancelJob } from '../jobs.ts';
import { initStockAudio } from '../audioTracks.ts';
import { Project, Scene } from '../../shared/types.ts';

const router = Router();

// Multer setup for user media uploads (MP4, WebM, PNG, JPG, MP3, WAV)
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `upload_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedMime = [
      'video/mp4', 'video/webm', 'video/quicktime',
      'image/jpeg', 'image/png', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'
    ];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

/* ============================================================
   PROJECTS CRUD
   ============================================================ */

router.get('/projects', (req, res) => {
  try {
    const projects = getProjects();
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/projects/:id', (req, res) => {
  try {
    const project = getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: { message: 'Project not found' } });
    }
    res.json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/projects', (req, res) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();
    const id = data.id || `proj_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const newProject: Project = {
      id,
      title: data.title || 'Untitled Short',
      topic: data.topic || '',
      description: data.description || '',
      targetDuration: data.targetDuration || 30,
      language: data.language || 'English',
      contentType: data.contentType || 'facts',
      visualStyle: data.visualStyle || 'cinematic',
      customStylePrompt: data.customStylePrompt || '',
      voiceGender: data.voiceGender || 'female',
      voiceName: data.voiceName || 'Kore',
      hook: data.hook || '',
      fullScript: data.fullScript || '',
      scenes: data.scenes || [],
      captionStyle: data.captionStyle || {
        fontFamily: 'Impact',
        fontSize: 54,
        textColor: '#FFFFFF',
        highlightColor: '#FACC15',
        outlineColor: '#000000',
        outlineWidth: 4,
        position: 'bottom',
        yPercent: 80,
        animation: 'word-highlight',
        uppercase: true,
        boxBackground: false,
        boxColor: '#000000',
      },
      musicTrack: data.musicTrack,
      voiceVolume: data.voiceVolume ?? 1.0,
      musicVolume: data.musicVolume ?? 0.15,
      renderSettings: data.renderSettings || {
        resolution: '1080x1920',
        fps: 30,
        videoCodec: 'libx264',
        audioCodec: 'aac',
        crf: 20,
        burnCaptions: true,
        transition: 'none',
        transitionDuration: 0.3,
      },
      status: data.status || 'draft',
      createdAt: now,
      updatedAt: now,
    };

    const saved = saveProject(newProject);
    res.status(201).json({ success: true, project: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.put('/projects/:id', (req, res) => {
  try {
    const existing = getProjectById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Project not found' } });
    }

    const updated = saveProject({
      ...existing,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, project: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.delete('/projects/:id', (req, res) => {
  try {
    const ok = deleteProject(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/* ============================================================
   AI GENERATION ENDPOINTS
   ============================================================ */

/**
 * 1. Generate Script with Gemini
 */
router.post('/generate/script', async (req, res) => {
  try {
    const { topic, duration, language, contentType, visualStyle, customStylePrompt, providerId } = req.body;

    if (!topic || topic.trim() === '') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Topic is required.' },
      });
    }

    const scriptResult = await registry.generateScript({
      topic,
      duration: duration || 30,
      language: language || 'English',
      contentType: contentType || 'facts',
      visualStyle: visualStyle || 'cinematic',
      customStylePrompt,
      providerId,
    });

    res.json({ success: true, result: scriptResult });
  } catch (err: any) {
    console.error('Error generating script:', err);
    res.status(500).json({
      success: false,
      error: { code: 'GEMINI_ERROR', message: err.message || 'Failed to generate script with Gemini.' },
    });
  }
});

/**
 * 2. Generate Scene Visual (with Fallback Pipeline)
 */
router.post('/generate/scene-visual', async (req, res) => {
  try {
    const { sceneNumber, prompt, narration, topic, duration, visualStyle } = req.body;

    const result = await registry.generateSceneVisual({
      sceneNumber: sceneNumber || 1,
      prompt: prompt || 'Cinematic vertical shot',
      narration: narration || '',
      topic: topic || 'YouTube Short',
      duration: duration || 4,
      visualStyle: visualStyle || 'cinematic',
    });

    res.json({
      success: true,
      asset: result.asset,
      fallbackUsed: result.fallbackUsed,
      fallbackReason: result.fallbackReason,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'VISUAL_GEN_ERROR', message: err.message },
    });
  }
});

/**
 * 3. Generate Speech / TTS
 */
router.post('/generate/tts', async (req, res) => {
  try {
    const { text, voiceGender, voiceName, language } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        error: { message: 'Text is required for TTS generation.' },
      });
    }

    const result = await registry.generateSpeech({
      text,
      voiceGender,
      voiceName,
      language,
    });

    res.json({ success: true, asset: result });
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'TTS_ERROR', message: err.message },
    });
  }
});

/**
 * 4. Transcribe Audio (Word/Phrase Timestamps)
 */
router.post('/generate/transcribe', async (req, res) => {
  try {
    const { assetId, promptText } = req.body;
    if (!assetId) {
      return res.status(400).json({ success: false, error: { message: 'assetId is required' } });
    }

    const audioPath = path.join(ASSETS_DIR, `${assetId}.wav`);
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ success: false, error: { message: 'Audio asset file not found' } });
    }

    const result = await registry.transcribeAudio({
      audioPath,
      promptText,
    });

    res.json({ success: true, result });
  } catch (err: any) {
    console.error('Transcription error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'TRANSCRIBE_ERROR', message: err.message },
    });
  }
});

/* ============================================================
   FFMPEG RENDER JOB SYSTEM
   ============================================================ */

router.post('/render', async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = getProjectById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, error: { message: 'Project not found' } });
    }

    if (!project.scenes || project.scenes.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'Project has no scenes to render.' } });
    }

    // Create asynchronous render job
    const job = createJob({
      type: 'render',
      projectId: project.id,
      stage: 'Queued for FFmpeg processing',
    });

    // Start rendering in background
    (async () => {
      try {
        updateJob(job.id, { status: 'processing', progress: 5, stage: 'Starting FFmpeg' });

        const renderer = registry.getRenderer();
        const renderResult = await renderer.renderProject(project, (pct, stage) => {
          updateJob(job.id, { progress: pct, stage });
        });

        // Update project with final video URL
        project.finalVideoUrl = renderResult.videoUrl;
        project.finalVideoAssetId = renderResult.assetId;
        project.status = 'completed';
        saveProject(project);

        updateJob(job.id, {
          status: 'completed',
          progress: 100,
          stage: 'Video ready',
          result: renderResult,
        });
      } catch (renderErr: any) {
        console.error('Render failed:', renderErr);
        updateJob(job.id, {
          status: 'failed',
          error: renderErr.message || 'Render failed',
          stage: 'Render failed',
        });
        project.status = 'failed';
        saveProject(project);
      }
    })();

    res.json({ success: true, jobId: job.id, job });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/render/:id/status', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: { message: 'Job not found' } });
  }
  res.json({ success: true, job });
});

router.post('/render/:id/cancel', (req, res) => {
  const ok = cancelJob(req.params.id);
  res.json({ success: ok });
});

/* ============================================================
   PROVIDERS & MODEL CONFIGURATION
   ============================================================ */

router.get('/providers', (req, res) => {
  try {
    const configs = getProviderConfigs();
    res.json({ success: true, providers: configs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.put('/providers/:id', (req, res) => {
  try {
    const updated = updateProviderConfig(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Provider not found' } });
    }
    registry.refreshProviders();
    res.json({ success: true, provider: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/providers/test', async (req, res) => {
  try {
    const { providerId } = req.body;
    if (!providerId) {
      return res.status(400).json({ success: false, error: { message: 'providerId is required' } });
    }
    const result = await registry.testProvider(providerId);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/* ============================================================
   ASSETS & UPLOADS
   ============================================================ */

router.get('/assets', (req, res) => {
  try {
    const assets = getAssets();
    res.json({ success: true, assets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    }

    let type: 'image' | 'video' | 'audio' = 'image';
    if (req.file.mimetype.startsWith('video/')) type = 'video';
    else if (req.file.mimetype.startsWith('audio/')) type = 'audio';

    const assetId = `upload_${Date.now()}`;
    const asset = {
      id: assetId,
      type,
      mimeType: req.file.mimetype,
      url: `/api/uploads/${req.file.filename}`,
      filename: req.file.filename,
      provider: 'user-upload',
      status: 'ready' as const,
      createdAt: new Date().toISOString(),
    };

    saveAsset(asset);
    res.json({ success: true, asset });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/* ============================================================
   STOCK AUDIO
   ============================================================ */

router.get('/audio/tracks', (req, res) => {
  try {
    const tracks = initStockAudio();
    res.json({ success: true, tracks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/* ============================================================
   EXPORTS (MP4, SRT, VTT, SCRIPT, JSON)
   ============================================================ */

router.get('/export/:id/mp4', (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project || !project.finalVideoUrl) {
    return res.status(404).json({ success: false, error: { message: 'Rendered video not found. Please render first.' } });
  }
  const filename = path.basename(project.finalVideoUrl);
  const filePath = path.join(RENDERS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: { message: 'Video file missing on disk.' } });
  }
  res.download(filePath, `${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_ShortForge.mp4`);
});

router.get('/export/:id/srt', (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) return res.status(404).send('Project not found');

  let srtContent = '';
  let counter = 1;
  let offset = 0;

  for (const scene of project.scenes) {
    if (scene.captions && scene.captions.length > 0) {
      for (const seg of scene.captions) {
        const start = formatSrtTime(offset + seg.start);
        const end = formatSrtTime(offset + seg.end);
        srtContent += `${counter}\n${start} --> ${end}\n${seg.text}\n\n`;
        counter++;
      }
    } else if (scene.narration) {
      const start = formatSrtTime(offset);
      const end = formatSrtTime(offset + scene.duration);
      srtContent += `${counter}\n${start} --> ${end}\n${scene.narration}\n\n`;
      counter++;
    }
    offset += scene.duration;
  }

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.srt"`);
  res.send(srtContent);
});

router.get('/export/:id/script', (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) return res.status(404).send('Project not found');

  let md = `# ${project.title}\n\n`;
  md += `**Topic:** ${project.topic}\n`;
  md += `**Target Duration:** ${project.targetDuration}s\n`;
  md += `**Hook:** ${project.hook}\n\n`;
  md += `## Scene Breakdown\n\n`;

  project.scenes.forEach((s) => {
    md += `### Scene ${s.number} (${s.duration}s)\n`;
    md += `**Visual Prompt:** ${s.visualPrompt}\n`;
    md += `**Narration:** ${s.narration}\n\n`;
  });

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_script.md"`);
  res.send(md);
});

router.get('/export/:id/json', (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) return res.status(404).send('Project not found');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_project.json"`);
  res.send(JSON.stringify(project, null, 2));
});

function formatSrtTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export default router;

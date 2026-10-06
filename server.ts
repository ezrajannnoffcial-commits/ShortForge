import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import apiRouter from './server/routes/api.ts';
import { initStorage, ASSETS_DIR, RENDERS_DIR, UPLOADS_DIR } from './server/storage.ts';
import { initStockAudio, STOCK_AUDIO_DIR } from './server/audioTracks.ts';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Initialize persistent directories and stock assets
initStorage();
initStockAudio();

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static asset delivery for generated videos, images, and audio
app.use('/api/assets', express.static(ASSETS_DIR));
app.use('/api/renders', express.static(RENDERS_DIR));
app.use('/api/uploads', express.static(UPLOADS_DIR));
app.use('/api/audio', express.static(STOCK_AUDIO_DIR));

// Dynamic file download endpoint for specific assets
app.get('/api/assets/:id/file', (req, res) => {
  const assetId = req.params.id;
  const files = fs.readdirSync(ASSETS_DIR);
  const matched = files.find(f => f.startsWith(assetId));
  if (matched) {
    return res.sendFile(path.join(ASSETS_DIR, matched));
  }
  res.status(404).json({ error: 'Asset file not found' });
});

// API Routes
app.use('/api', apiRouter);

// Frontend integration
async function startServer() {
  if (!isProd) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built dist folder
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ShortForge AI] Full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ShortForge AI] Failed to start server:', err);
  process.exit(1);
});

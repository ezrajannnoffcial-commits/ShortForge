import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Project, Scene } from '../../shared/types.ts';
import { DATA_DIR, ASSETS_DIR, RENDERS_DIR, TEMP_DIR, saveAsset } from '../storage.ts';

export interface RenderProgressCallback {
  (percentage: number, stage: string, log?: string): void;
}

export class FFmpegRenderer {
  private ffmpegBinary = '/usr/bin/ffmpeg';

  async testConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn(this.ffmpegBinary, ['-version']);
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });
  }

  /**
   * Generates a 9:16 Ken Burns motion video clip from a still image
   */
  async createImageMotionClip(
    imagePath: string,
    durationSeconds: number,
    outputPath: string,
    motionType: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' = 'zoom-in'
  ): Promise<void> {
    const fps = 30;
    const totalFrames = Math.max(30, Math.round(durationSeconds * fps));

    let zoompanFilter = '';
    switch (motionType) {
      case 'zoom-in':
        // Smoothly zoom in from 1.0 to 1.25
        zoompanFilter = `zoompan=z='min(zoom+0.0015,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=1080x1920:fps=${fps}`;
        break;
      case 'zoom-out':
        // Zoom out from 1.25 to 1.0
        zoompanFilter = `zoompan=z='if(lte(zoom,1.0),1.25,max(1.0,zoom-0.0015))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=1080x1920:fps=${fps}`;
        break;
      case 'pan-left':
        zoompanFilter = `zoompan=z=1.15:x='if(lte(on,-1),(iw-iw/zoom)/2,x+1)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=1080x1920:fps=${fps}`;
        break;
      case 'pan-right':
      default:
        zoompanFilter = `zoompan=z='min(zoom+0.0012,1.2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=1080x1920:fps=${fps}`;
        break;
    }

    const vf = [
      'scale=1080:1920:force_original_aspect_ratio=increase',
      'crop=1080:1920',
      zoompanFilter,
      'setsar=1',
      'format=yuv420p'
    ].join(',');

    const args = [
      '-y',
      '-loop', '1',
      '-i', imagePath,
      '-t', durationSeconds.toString(),
      '-vf', vf,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-pix_fmt', 'yuv420p',
      '-r', fps.toString(),
      outputPath
    ];

    await this.runFFmpeg(args);
  }

  /**
   * Formats timestamp in seconds to ASS format (H:MM:SS.CC)
   */
  private formatAssTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  /**
   * Generates ASS subtitle file with custom styling, colors, and positioning
   */
  generateAssSubtitles(project: Project, outputPath: string): void {
    const style = project.captionStyle;
    const font = style.fontFamily || 'Arial';
    const fontSize = style.fontSize || 54;
    const isUppercase = style.uppercase !== false;

    // Convert CSS hex color to ASS color (&HBBGGRR&)
    const hexToAss = (hex: string) => {
      const clean = hex.replace('#', '');
      if (clean.length === 6) {
        const r = clean.substring(0, 2);
        const g = clean.substring(2, 4);
        const b = clean.substring(4, 6);
        return `&H00${b}${g}${r}&`;
      }
      return '&H00FFFFFF&';
    };

    const primaryColor = hexToAss(style.textColor || '#FFFFFF');
    const outlineColor = hexToAss(style.outlineColor || '#000000');
    const highlightColor = hexToAss(style.highlightColor || '#FFCC00');
    const outlineWidth = style.outlineWidth || 4;
    
    // Vertical alignment: 2 = bottom center, 5 = middle center, 8 = top center
    let alignment = 2;
    let marginV = 280; // safe area for YouTube Shorts buttons/captions
    if (style.position === 'top') {
      alignment = 8;
      marginV = 200;
    } else if (style.position === 'middle') {
      alignment = 5;
      marginV = 0;
    }

    let assContent = `[Script Info]
Title: ShortForge Captions
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${font},${fontSize},${primaryColor},${highlightColor},${outlineColor},&H80000000,-1,0,0,0,100,100,1,0,1,${outlineWidth},2,${alignment},60,60,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    // Calculate project-wide timeline offsets
    let currentOffset = 0;
    for (const scene of project.scenes) {
      if (scene.captions && scene.captions.length > 0) {
        for (const seg of scene.captions) {
          const startTime = currentOffset + seg.start;
          const endTime = Math.max(startTime + 0.3, currentOffset + seg.end);
          let displayText = seg.text;
          if (isUppercase) displayText = displayText.toUpperCase();

          // Highlight effect if words are available
          if (style.animation === 'word-highlight' && seg.words && seg.words.length > 0) {
            // Render word-by-word highlights
            displayText = seg.words.map(w => {
              const wordText = isUppercase ? w.word.toUpperCase() : w.word;
              return `{\\c${highlightColor}}${wordText}{\\c${primaryColor}}`;
            }).join(' ');
          }

          assContent += `Dialogue: 0,${this.formatAssTime(startTime)},${this.formatAssTime(endTime)},Default,,0,0,0,,${displayText}\n`;
        }
      } else if (scene.narration) {
        // Fallback: show scene narration if explicit captions aren't broken down
        const startTime = currentOffset;
        const endTime = currentOffset + scene.duration;
        let text = scene.narration;
        if (isUppercase) text = text.toUpperCase();
        assContent += `Dialogue: 0,${this.formatAssTime(startTime)},${this.formatAssTime(endTime)},Default,,0,0,0,,${text}\n`;
      }
      currentOffset += scene.duration;
    }

    fs.writeFileSync(outputPath, assContent, 'utf-8');
  }

  /**
   * Main Render Pipeline: Normalizes scene visuals, binds narration,
   * adds ducked background music, burns captions, and encodes final 1080x1920 MP4
   */
  async renderProject(
    project: Project,
    onProgress?: RenderProgressCallback
  ): Promise<{ videoUrl: string; assetId: string; filePath: string }> {
    const renderId = `render_${project.id}_${Date.now()}`;
    const projectTemp = path.join(TEMP_DIR, renderId);
    fs.mkdirSync(projectTemp, { recursive: true });

    try {
      onProgress?.(5, 'Preparing scene clips and media assets');

      // 1. Process each scene into a normalized 1080x1920 video clip
      const sceneVideoPaths: string[] = [];
      const sceneAudioPaths: string[] = [];
      const motions: ('zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right')[] = [
        'zoom-in', 'zoom-out', 'pan-right', 'zoom-in', 'pan-left'
      ];

      for (let i = 0; i < project.scenes.length; i++) {
        const scene = project.scenes[i];
        const sceneClipOut = path.join(projectTemp, `scene_${i + 1}.mp4`);
        const scenePct = 5 + Math.round(((i + 1) / project.scenes.length) * 35);
        onProgress?.(scenePct, `Processing Scene ${i + 1}/${project.scenes.length}`);

        // Find visual source
        let visualSourcePath = '';
        if (scene.assetId) {
          // Check in assets
          const possible = path.join(ASSETS_DIR, `${scene.assetId}.png`);
          const possibleJpg = path.join(ASSETS_DIR, `${scene.assetId}.jpg`);
          const possibleMp4 = path.join(ASSETS_DIR, `${scene.assetId}.mp4`);
          if (fs.existsSync(possibleMp4)) visualSourcePath = possibleMp4;
          else if (fs.existsSync(possible)) visualSourcePath = possible;
          else if (fs.existsSync(possibleJpg)) visualSourcePath = possibleJpg;
        }

        // If no explicit file exists, generate a sleek high-res aesthetic graphic slide
        if (!visualSourcePath || !fs.existsSync(visualSourcePath)) {
          visualSourcePath = path.join(projectTemp, `scene_generated_${i + 1}.png`);
          await this.generateThematicSceneSlide(scene, project, visualSourcePath);
        }

        const isVideo = visualSourcePath.endsWith('.mp4') || visualSourcePath.endsWith('.webm');
        const duration = Math.max(1.5, scene.duration || 4);

        if (isVideo) {
          // Normalize video to 1080x1920 30fps
          const vf = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p';
          await this.runFFmpeg([
            '-y',
            '-i', visualSourcePath,
            '-t', duration.toString(),
            '-vf', vf,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-r', '30',
            '-an',
            sceneClipOut
          ]);
        } else {
          // Apply dynamic Ken Burns motion
          const motion = motions[i % motions.length];
          await this.createImageMotionClip(visualSourcePath, duration, sceneClipOut, motion);
        }

        sceneVideoPaths.push(sceneClipOut);

        // Process speech audio for this scene, locking audio duration exactly to scene.duration
        const sceneAudioOut = path.join(projectTemp, `scene_audio_${i + 1}.wav`);
        let audioSrc = '';
        if (scene.audioAssetId) {
          const tryWav = path.join(ASSETS_DIR, `${scene.audioAssetId}.wav`);
          const tryMp3 = path.join(ASSETS_DIR, `${scene.audioAssetId}.mp3`);
          if (fs.existsSync(tryWav)) audioSrc = tryWav;
          else if (fs.existsSync(tryMp3)) audioSrc = tryMp3;
        }
        if (!audioSrc && scene.audioUrl) {
          const basename = path.basename(scene.audioUrl);
          const direct = path.join(ASSETS_DIR, basename);
          if (fs.existsSync(direct)) {
            audioSrc = direct;
          } else {
            const files = fs.readdirSync(ASSETS_DIR);
            const cleanId = scene.audioUrl.replace('/api/assets/', '').replace('/file', '');
            const match = files.find(f => f.startsWith(cleanId));
            if (match) audioSrc = path.join(ASSETS_DIR, match);
          }
        }

        if (audioSrc && fs.existsSync(audioSrc)) {
          // Normalize audio to standard 44.1kHz stereo and pad to exact scene duration
          await this.runFFmpeg([
            '-y',
            '-i', audioSrc,
            '-t', duration.toString(),
            '-af', `apad=whole_dur=${duration}`,
            '-ar', '44100',
            '-ac', '2',
            sceneAudioOut
          ]);
        } else {
          // Generate silence for the exact scene duration
          await this.runFFmpeg([
            '-y',
            '-f', 'lavfi',
            '-i', 'anullsrc=r=44100:cl=stereo',
            '-t', duration.toString(),
            sceneAudioOut
          ]);
        }
        sceneAudioPaths.push(sceneAudioOut);
      }

      // 2. Concatenate scene videos
      onProgress?.(45, 'Stitching video timeline and normalising transitions');
      const concatListFile = path.join(projectTemp, 'concat_list.txt');
      const concatListContent = sceneVideoPaths.map(p => `file '${p}'`).join('\n');
      fs.writeFileSync(concatListFile, concatListContent, 'utf-8');

      const stitchedVideoPath = path.join(projectTemp, 'stitched_scenes.mp4');
      await this.runFFmpeg([
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListFile,
        '-c', 'copy',
        stitchedVideoPath
      ]);

      // 3. Audio assembly (Narration speech + Ducked background music)
      onProgress?.(60, 'Mixing voice narration and background audio ducking');
      let combinedAudioPath = path.join(projectTemp, 'narration_full.wav');
      let hasNarration = false;

      const anySceneHasVoice = project.scenes.some(s => s.audioAssetId || s.audioUrl);
      if (anySceneHasVoice && sceneAudioPaths.length > 0) {
        // Concatenate audio clips
        const audioConcatList = path.join(projectTemp, 'audio_concat.txt');
        fs.writeFileSync(audioConcatList, sceneAudioPaths.map(p => `file '${p}'`).join('\n'), 'utf-8');
        await this.runFFmpeg([
          '-y',
          '-f', 'concat',
          '-safe', '0',
          '-i', audioConcatList,
          '-c', 'copy',
          combinedAudioPath
        ]);
        hasNarration = true;
      }

      // 4. Burn-in subtitles if enabled
      let videoWithCaptions = stitchedVideoPath;
      if (project.renderSettings?.burnCaptions !== false) {
        onProgress?.(75, 'Burning synchronized animated captions into 9:16 frame');
        const assPath = path.join(projectTemp, 'subtitles.ass');
        this.generateAssSubtitles(project, assPath);
        
        const captionedVideo = path.join(projectTemp, 'captioned_video.mp4');
        // Use subtitles filter (escape path for ffmpeg)
        const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
        await this.runFFmpeg([
          '-y',
          '-i', stitchedVideoPath,
          '-vf', `subtitles='${escapedAss}'`,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '20',
          '-c:a', 'copy',
          captionedVideo
        ]);
        videoWithCaptions = captionedVideo;
      }

      // 5. Final encode with mixed audio (narration @ -3dB + music ducked @ -18dB)
      onProgress?.(85, 'Encoding final production MP4 (H.264 / AAC 1080x1920)');
      const finalAssetId = `render_${Date.now()}`;
      const finalFilename = `${finalAssetId}.mp4`;
      const finalOutputPath = path.join(RENDERS_DIR, finalFilename);

      const totalProjectDuration = project.scenes.reduce((acc, s) => acc + (s.duration || 4), 0);

      // Prepare audio filter
      const musicPath = project.musicTrack?.url
        ? path.join(DATA_DIR, project.musicTrack.url.replace('/api/', ''))
        : null;
      const hasMusic = musicPath && fs.existsSync(musicPath);

      const finalArgs: string[] = ['-y', '-i', videoWithCaptions];

      if (hasNarration && hasMusic) {
        finalArgs.push('-i', combinedAudioPath);
        finalArgs.push('-stream_loop', '-1', '-i', musicPath);
        // Mix: Narration (input 1) + Music (input 2 ducked)
        // volume 1.0 (narration) and volume 0.12 (music ducked)
        finalArgs.push(
          '-filter_complex',
          `[1:a]volume=1.0[v];[2:a]volume=0.15[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
          '-map', '0:v',
          '-map', '[aout]'
        );
      } else if (hasNarration) {
        finalArgs.push('-i', combinedAudioPath);
        finalArgs.push('-map', '0:v', '-map', '1:a');
      } else if (hasMusic) {
        finalArgs.push('-stream_loop', '-1', '-i', musicPath);
        finalArgs.push(
          '-filter_complex',
          `[1:a]volume=0.3[aout]`,
          '-map', '0:v',
          '-map', '[aout]'
        );
      } else {
        // Generate subtle silent audio track to guarantee audio stream compliance for YouTube Shorts
        finalArgs.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
        finalArgs.push('-map', '0:v', '-map', '1:a', '-shortest');
      }

      finalArgs.push(
        '-t', totalProjectDuration.toString(),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'medium',
        '-crf', '21',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        finalOutputPath
      );

      await this.runFFmpeg(finalArgs);

      onProgress?.(100, 'Rendering completed successfully');

      // Save asset record
      const asset = {
        id: finalAssetId,
        type: 'final-video' as const,
        mimeType: 'video/mp4',
        url: `/api/renders/${finalFilename}`,
        filename: finalFilename,
        provider: 'ffmpeg-renderer',
        status: 'ready' as const,
        width: 1080,
        height: 1920,
        duration: totalProjectDuration,
        createdAt: new Date().toISOString(),
      };
      saveAsset(asset);

      return {
        videoUrl: asset.url,
        assetId: finalAssetId,
        filePath: finalOutputPath,
      };
    } finally {
      // Clean up temporary project directory
      try {
        if (fs.existsSync(projectTemp)) {
          fs.rmSync(projectTemp, { recursive: true, force: true });
        }
      } catch (e) {
        console.warn('Failed to clean temp render dir:', e);
      }
    }
  }

  /**
   * Generates a high-resolution 1080x1920 visual theme slide using FFmpeg lavfi filters
   * when external images/videos are unavailable. Guaranteed 100% real visual output.
   */
  async generateThematicSceneSlide(scene: Scene, project: Project, outputPath: string): Promise<void> {
    // Generate an atmospheric dark aesthetic gradient background with scene title and thematic vignette
    const colors = [
      '#0f172a', '#1e1b4b', '#172554', '#042f2e', '#2e1065', '#31102f'
    ];
    const baseColor = colors[(scene.number || 1) % colors.length];
    const cleanPrompt = (scene.visualPrompt || scene.narration || project.topic)
      .slice(0, 70)
      .replace(/'/g, '')
      .replace(/:/g, ' - ');

    const filter = [
      `color=c=${baseColor}:s=1080x1920:d=1`,
      `format=rgba`,
      `drawbox=x=80:y=760:w=920:h=400:color=white@0.05:t=fill`,
      `drawtext=text='SCENE ${scene.number}':x=(w-text_w)/2:y=820:fontsize=36:fontcolor=white@0.6:font=Arial`,
      `drawtext=text='${cleanPrompt}':x=(w-text_w)/2:y=920:fontsize=44:fontcolor=white:font=Arial:box=1:boxcolor=black@0.5:boxborderw=20`,
      `format=yuv420p`
    ].join(',');

    await this.runFFmpeg([
      '-y',
      '-f', 'lavfi',
      '-i', filter,
      '-frames:v', '1',
      outputPath
    ]);
  }

  private runFFmpeg(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.ffmpegBinary, args);
      let stderr = '';
      proc.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stderr);
        } else {
          console.error('FFmpeg execution failed:', stderr);
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-400)}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }
}

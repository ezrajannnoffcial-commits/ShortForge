import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { MusicTrack } from '../shared/types.ts';
import { DATA_DIR } from './storage.ts';

export const STOCK_AUDIO_DIR = path.join(DATA_DIR, 'audio');

export function initStockAudio(): MusicTrack[] {
  if (!fs.existsSync(STOCK_AUDIO_DIR)) {
    fs.mkdirSync(STOCK_AUDIO_DIR, { recursive: true });
  }

  const tracks: MusicTrack[] = [
    {
      id: 'track-ambient-cinematic',
      title: 'Cinematic Ambient (Atmospheric)',
      url: '/api/audio/track-ambient-cinematic.mp3',
      duration: 60,
      volume: 0.15,
      ducking: true,
      fadeIn: 1.0,
      fadeOut: 2.0,
      loop: true,
    },
    {
      id: 'track-curiosity-pulse',
      title: 'Curiosity & Discovery (Pulse)',
      url: '/api/audio/track-curiosity-pulse.mp3',
      duration: 60,
      volume: 0.12,
      ducking: true,
      fadeIn: 0.5,
      fadeOut: 1.5,
      loop: true,
    },
    {
      id: 'track-tension-drone',
      title: 'Documentary Tension (Sub Drone)',
      url: '/api/audio/track-tension-drone.mp3',
      duration: 60,
      volume: 0.14,
      ducking: true,
      fadeIn: 1.5,
      fadeOut: 2.5,
      loop: true,
    }
  ];

  // Synthesize mp3 files if they don't exist yet using ffmpeg audio synthesis
  tracks.forEach((track) => {
    const filename = `${track.id}.mp3`;
    const dest = path.join(STOCK_AUDIO_DIR, filename);
    if (!fs.existsSync(dest)) {
      generateSynthTrack(track.id, dest);
    }
  });

  return tracks;
}

function generateSynthTrack(trackId: string, outputPath: string) {
  let expr = '';
  if (trackId === 'track-ambient-cinematic') {
    // Warm chords (A minor ambient drone: 220Hz, 261Hz, 329Hz, 440Hz with subtle chorus/tremolo)
    expr = 'aevalsrc=sin(220*2*PI*t)*0.15+sin(261.63*2*PI*t)*0.12+sin(329.63*2*PI*t)*0.1+sin(440*2*PI*t)*0.08:d=60';
  } else if (trackId === 'track-curiosity-pulse') {
    // Subtle rhythmic pulse (synth bass with 2Hz tremolo)
    expr = 'aevalsrc=(sin(110*2*PI*t)+sin(164.81*2*PI*t)*0.5)*(0.5+0.5*sin(4*2*PI*t))*0.2:d=60';
  } else {
    // Deep cinematic drone (55Hz sub + 82Hz 5th harmonic)
    expr = 'aevalsrc=sin(55*2*PI*t)*0.25+sin(82.41*2*PI*t)*0.15+sin(110*2*PI*t)*0.08:d=60';
  }

  const proc = spawn('/usr/bin/ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', expr,
    '-af', 'lowpass=f=1200,afade=t=in:ss=0:d=1,afade=t=out:st=58:d=2',
    '-c:a', 'libmp3lame',
    '-b:a', '128k',
    outputPath
  ]);

  proc.on('error', (err) => {
    console.warn(`Failed to synthesize stock track ${trackId}:`, err);
  });
}

#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { access, readFile, stat } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import sharp from 'sharp';
import { scamGuides } from '../../src/data/scams.ts';

const exec = promisify(execFile);
const ROOT = process.cwd();
const LIMIT = 25 * 1024 * 1024;
const failures = [];

async function durationOf(file) {
  const { stdout } = await exec('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file,
  ]);
  return Number(stdout.trim());
}

for (const guide of scamGuides) {
  const video = guide.video?.ko;
  if (!video || video.provider !== 'local') {
    failures.push(`${guide.slug}: Korean local video is not configured`);
    continue;
  }

  const relative = video.id.replace(/^\//, '');
  const mp4 = path.join(ROOT, 'public', relative);
  const poster = mp4.replace(/\.mp4$/, '.png');
  const captions = mp4.replace(/\.mp4$/, '.ko.vtt');

  try {
    await Promise.all([access(mp4), access(poster), access(captions)]);
    const [info, duration, posterInfo, captionText] = await Promise.all([
      stat(mp4),
      durationOf(mp4),
      sharp(poster).metadata(),
      readFile(captions, 'utf8'),
    ]);

    if (info.size > LIMIT) failures.push(`${guide.slug}: MP4 exceeds 25 MiB`);
    if (Math.abs(duration - video.seconds) > 1.1) failures.push(`${guide.slug}: configured duration ${video.seconds}s differs from ${duration.toFixed(2)}s`);
    if (posterInfo.width !== 1280 || posterInfo.height !== 720) failures.push(`${guide.slug}: poster is not 1280x720`);
    if (!captionText.startsWith('WEBVTT\n') || !captionText.includes('-->')) failures.push(`${guide.slug}: captions are not valid-looking WebVTT`);

    process.stdout.write(`✓ ${guide.slug.padEnd(24)} ${duration.toFixed(1).padStart(6)}s  ${(info.size / 1_048_576).toFixed(2).padStart(5)} MiB\n`);
  } catch (error) {
    failures.push(`${guide.slug}: ${error.message}`);
  }
}

if (failures.length) {
  process.stderr.write(`\n${failures.map((failure) => `✗ ${failure}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`\nAll ${scamGuides.length} Korean videos passed integrity checks.\n`);
}

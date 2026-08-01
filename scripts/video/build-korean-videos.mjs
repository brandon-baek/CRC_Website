#!/usr/bin/env node

/**
 * Build original CRC Korean scam-awareness videos from the site's source data.
 * Usage: npm run videos:ko | npm run videos:ko:one -- phishing
 */

import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile, copyFile, stat } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { scamGuides } from '../../src/data/scams.ts';
import { agencyById } from '../../src/data/agencies.ts';

const exec = promisify(execFile);
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'videos', 'ko');
const WORK_ROOT = path.join(ROOT, '.video-build');
const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 24;
const VOICE = process.env.CRC_KO_VOICE || 'ko-KR-SunHiNeural';
const RATE = process.env.CRC_KO_RATE || '-6%';

const C = {
  ink: '#1A1E24', inkSoft: '#3E444D', paper: '#FFFEFB', warm: '#F8F7F2',
  lime: '#CDF07A', limeDeep: '#94C23C', red: '#E8493A', redSoft: '#FDECE9',
  yellow: '#F4B942', yellowSoft: '#FDF1D7', line: '#DDDCD4', white: '#FFFFFF',
};

const ICONS = {
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
  landmark: '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="m12 2 8 5H4Z"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  chart: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  'id-card': '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M6 10h4"/><path d="M6 14h2"/><circle cx="16" cy="12" r="2"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C9 3 12 5 12 8c0-3 3-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  report: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
};

const xml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

function shorten(text, max = 72) {
  if (text.length <= max) return text;
  const clipped = text.slice(0, max - 1);
  const breakAt = Math.max(clipped.lastIndexOf(' '), clipped.lastIndexOf(','), clipped.lastIndexOf('.'));
  return `${clipped.slice(0, breakAt > max * 0.6 ? breakAt : max - 1)}…`;
}

function wrap(text, maxChars) {
  const lines = [];
  let current = '';
  for (const word of String(text).split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) { lines.push(current); current = word; }
    else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

function textBlock(text, { x, y, widthChars = 26, size = 44, weight = 800, color = C.ink, lineHeight = 1.25, anchor = 'start', maxLines = 4 } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${color}">${wrap(text, widthChars).slice(0, maxLines).map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : size * lineHeight}">${xml(line)}</tspan>`).join('')}</text>`;
}

function icon(name, x, y, size = 120, color = C.ink, strokeWidth = 1.8) {
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.alert}</g>`;
}

function brandMark() {
  return `<g transform="translate(64 48)">
    <rect width="34" height="34" fill="${C.red}"/><rect x="40" width="34" height="34" fill="${C.white}" stroke="${C.line}"/>
    <rect y="40" width="34" height="34" fill="${C.yellow}"/><rect x="40" y="40" width="34" height="34" fill="${C.red}"/>
    <text x="94" y="31" font-size="25" font-weight="900" fill="${C.ink}">한인 시민센터</text>
    <text x="94" y="61" font-size="17" font-weight="700" fill="${C.inkSoft}">Consumer Resource Center</text>
  </g>`;
}

function footer(scene, total) {
  return `<rect x="64" y="681" width="1152" height="6" rx="3" fill="${C.line}"/>
    <rect x="64" y="681" width="${Math.round(scene / total * 1152)}" height="6" rx="3" fill="${C.red}"/>
    <text x="1216" y="660" text-anchor="end" font-size="18" font-weight="700" fill="${C.inkSoft}">AI 음성 · 한국어 안내</text>`;
}

function baseSvg(content, scene, total, accent = C.lime) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect width="1280" height="720" fill="${C.warm}"/><circle cx="1190" cy="-20" r="210" fill="${accent}" opacity=".72"/>
    <rect x="-70" y="570" width="230" height="230" rx="44" fill="${C.yellowSoft}" transform="rotate(12 -70 570)"/>
    <style>text{font-family:'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif}</style>
    ${brandMark()}${content}${footer(scene, total)}
  </svg>`;
}

function bulletCards(items, type) {
  const colors = type === 'warning' ? [C.redSoft, '#FFF4E5', '#FDEFE9'] : type === 'protect' ? ['#ECF8D1', '#EAF4DF', '#F3F8E7'] : ['#EEF3FF', '#F2EFFF', '#EAF7F6'];
  const iconName = type === 'warning' ? 'alert' : type === 'protect' ? 'shield' : 'check';
  return items.slice(0, 3).map((item, i) => {
    const x = 64 + i * 390;
    return `<rect x="${x}" y="295" width="360" height="278" rx="24" fill="${colors[i]}" stroke="${C.line}"/>
      <circle cx="${x + 58}" cy="353" r="34" fill="${type === 'warning' ? C.red : C.lime}"/>${icon(iconName, x + 41, 336, 34, C.ink, 2.1)}
      <text x="${x + 104}" y="362" font-size="24" font-weight="900" fill="${C.ink}">${type === 'steps' ? `${i + 1}단계` : `${i + 1}`}</text>
      ${textBlock(shorten(item, 92), { x: x + 30, y: 425, widthChars: 19, size: 25, weight: 700, lineHeight: 1.28, maxLines: 5 })}`;
  }).join('');
}

function makeScenes(guide) {
  const agencies = guide.reportTo.map((id) => agencyById.get(id)).filter(Boolean).slice(0, 3);
  const agencyNames = agencies.map((agency) => agency.name.ko);
  const total = 6;
  return [
    { kind: 'hero', title: guide.title.ko, narration: `${guide.title.ko}. ${guide.tagline.ko} 지금부터 사기 수법과 대응 방법을 차근차근 알아보겠습니다.`, svg: baseSvg(`
      <rect x="64" y="174" width="765" height="12" rx="6" fill="${C.red}"/>${textBlock(guide.title.ko, { x: 64, y: 265, widthChars: 18, size: 64, weight: 900, lineHeight: 1.18, maxLines: 2 })}
      ${textBlock(guide.tagline.ko, { x: 64, y: 445, widthChars: 33, size: 31, weight: 600, color: C.inkSoft, lineHeight: 1.4, maxLines: 3 })}
      <circle cx="1020" cy="395" r="150" fill="${C.lime}"/>${icon(guide.icon, 930, 305, 180, C.ink, 1.55)}`, 1, total, C.lime) },
    { kind: 'how', title: '어떻게 진행되는 사기일까요?', narration: `먼저 이 사기가 어떻게 진행되는지 알아보겠습니다. ${guide.what.ko}`, svg: baseSvg(`
      <rect x="64" y="176" width="92" height="10" rx="5" fill="${C.yellow}"/>${textBlock('어떻게 진행되는 사기일까요?', { x: 64, y: 255, widthChars: 25, size: 50, weight: 900, maxLines: 2 })}
      <rect x="64" y="330" width="1152" height="270" rx="28" fill="${C.white}" stroke="${C.line}"/><circle cx="190" cy="465" r="82" fill="${C.yellowSoft}"/>${icon(guide.icon, 139, 414, 102, C.ink, 1.65)}
      ${textBlock(shorten(guide.what.ko, 205), { x: 320, y: 390, widthChars: 42, size: 31, weight: 650, lineHeight: 1.42, maxLines: 5 })}`, 2, total, C.yellow) },
    { kind: 'warning', title: '이런 신호를 조심하세요', narration: `다음과 같은 경고 신호를 조심하세요. ${guide.warningSigns.ko.slice(0, 3).join(' ')}`, svg: baseSvg(`
      <rect x="64" y="176" width="92" height="10" rx="5" fill="${C.red}"/>${textBlock('이런 신호를 조심하세요', { x: 64, y: 255, widthChars: 28, size: 50, weight: 900 })}${bulletCards(guide.warningSigns.ko, 'warning')}`, 3, total, C.red) },
    { kind: 'protect', title: '피해를 예방하는 방법', narration: `피해를 예방하려면 다음 세 가지를 기억하세요. ${guide.protect.ko.slice(0, 3).join(' ')}`, svg: baseSvg(`
      <rect x="64" y="176" width="92" height="10" rx="5" fill="${C.limeDeep}"/>${textBlock('피해를 예방하는 방법', { x: 64, y: 255, widthChars: 28, size: 50, weight: 900 })}${bulletCards(guide.protect.ko, 'protect')}`, 4, total, C.lime) },
    { kind: 'steps', title: '이미 피해가 발생했다면', narration: `이미 피해가 발생했다면 당황하지 말고 바로 행동하세요. ${guide.ifHappened.ko.slice(0, 3).join(' ')}`, svg: baseSvg(`
      <rect x="64" y="176" width="92" height="10" rx="5" fill="#4F6DB8"/>${textBlock('이미 피해가 발생했다면', { x: 64, y: 255, widthChars: 28, size: 50, weight: 900 })}${bulletCards(guide.ifHappened.ko, 'steps')}`, 5, total, '#AFC4F2') },
    { kind: 'report', title: '신고하고 도움을 받으세요', narration: `신고는 사기범을 막고 다른 피해자를 보호하는 데 도움이 됩니다. 이 사기는 ${agencyNames.join(', ')}에 신고할 수 있습니다. 돈을 보냈다면 은행이나 결제 회사에도 즉시 연락하세요. 더 자세한 신고 안내는 한인 시민센터 웹사이트에서 확인하실 수 있습니다.`, svg: baseSvg(`
      <rect x="64" y="176" width="92" height="10" rx="5" fill="${C.red}"/>${textBlock('신고하고 도움을 받으세요', { x: 64, y: 255, widthChars: 28, size: 50, weight: 900 })}
      <rect x="64" y="310" width="760" height="280" rx="28" fill="${C.white}" stroke="${C.line}"/>${agencyNames.map((name, i) => `<circle cx="112" cy="${368 + i * 77}" r="26" fill="${i === 0 ? C.red : C.lime}"/>${icon(i === 0 ? 'report' : 'check', 99, 355 + i * 77, 26, C.ink, 2.2)}${textBlock(shorten(name, 38), { x: 158, y: 378 + i * 77, widthChars: 34, size: 29, weight: 800, maxLines: 1 })}`).join('')}
      <rect x="865" y="310" width="351" height="280" rx="28" fill="${C.lime}"/>${icon('shield', 970, 346, 140, C.ink, 1.55)}
      <text x="1040" y="525" text-anchor="middle" font-size="30" font-weight="900" fill="${C.ink}">혼자 고민하지 마세요</text><text x="1040" y="560" text-anchor="middle" font-size="21" font-weight="700" fill="${C.inkSoft}">신속한 연락이 피해를 줄입니다</text>`, 6, total, C.lime) },
  ];
}

async function run(bin, args) {
  try { return await exec(bin, args, { maxBuffer: 10 * 1024 * 1024 }); }
  catch (error) { throw new Error(`${bin} failed: ${error.stderr || error.stdout || error.message}`); }
}

async function durationOf(file) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file]);
  return Number(stdout.trim());
}

function srtTime(seconds) {
  const value = Math.max(0, Math.round(seconds * 1000));
  return `${String(Math.floor(value / 3_600_000)).padStart(2, '0')}:${String(Math.floor(value % 3_600_000 / 60_000)).padStart(2, '0')}:${String(Math.floor(value % 60_000 / 1000)).padStart(2, '0')},${String(value % 1000).padStart(3, '0')}`;
}

async function renderGuide(guide) {
  const workDir = path.join(WORK_ROOT, guide.slug);
  await rm(workDir, { recursive: true, force: true });
  await mkdir(workDir, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });
  const scenes = makeScenes(guide);
  const concatLines = [];
  const captions = [];
  let cursor = 0;

  for (const [index, scene] of scenes.entries()) {
    const id = String(index + 1).padStart(2, '0');
    const png = path.join(workDir, `${id}-${scene.kind}.png`);
    const audio = path.join(workDir, `${id}-${scene.kind}.mp3`);
    const clip = path.join(workDir, `${id}-${scene.kind}.mp4`);
    await sharp(Buffer.from(scene.svg)).png().toFile(png);
    await run('edge-tts', ['--voice', VOICE, '--rate', RATE, '--text', scene.narration, '--write-media', audio]);
    const speechDuration = await durationOf(audio);
    const sceneDuration = Math.max(5.5, speechDuration + 1.2);
    const frames = Math.ceil(sceneDuration * FPS);
    const fadeOut = Math.max(0, sceneDuration - 0.45);
    await run('ffmpeg', ['-y', '-loop', '1', '-framerate', String(FPS), '-i', png, '-i', audio,
      '-filter_complex', `[0:v]scale=${WIDTH}:${HEIGHT},zoompan=z='min(zoom+0.00012,1.018)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${WIDTH}x${HEIGHT}:fps=${FPS},fade=t=in:st=0:d=0.35,fade=t=out:st=${fadeOut.toFixed(3)}:d=0.4,format=yuv420p[v];[1:a]adelay=450|450,apad=pad_dur=1.2,afade=t=out:st=${Math.max(0, speechDuration + 0.55).toFixed(3)}:d=0.35[a]`,
      '-map', '[v]', '-map', '[a]', '-t', sceneDuration.toFixed(3), '-c:v', 'libx264', '-preset', 'medium', '-crf', '28', '-r', String(FPS), '-c:a', 'aac', '-b:a', '112k', '-movflags', '+faststart', clip]);
    concatLines.push(`file '${clip.replaceAll("'", "'\\''")}'`);
    captions.push(`${captions.length + 1}\n${srtTime(cursor + .45)} --> ${srtTime(cursor + .45 + speechDuration)}\n${scene.narration}\n`);
    cursor += sceneDuration;
    if (index === 0) await copyFile(png, path.join(OUT_DIR, `${guide.slug}.png`));
  }

  const concatFile = path.join(workDir, 'concat.txt');
  const output = path.join(OUT_DIR, `${guide.slug}.mp4`);
  await writeFile(concatFile, `${concatLines.join('\n')}\n`);
  await writeFile(path.join(OUT_DIR, `${guide.slug}.ko.srt`), captions.join('\n'));
  await writeFile(path.join(OUT_DIR, `${guide.slug}.ko.vtt`), `WEBVTT\n\n${captions.join('\n').replaceAll(',', '.')}`);
  await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatFile, '-c', 'copy', '-movflags', '+faststart', output]);

  const finalDuration = await durationOf(output);
  const sizeBytes = (await stat(output)).size;
  await writeFile(path.join(OUT_DIR, `${guide.slug}.json`), `${JSON.stringify({ slug: guide.slug, title: guide.title.ko, voice: VOICE, durationSeconds: Math.round(finalDuration * 100) / 100, sizeBytes, scenes: scenes.map(({ kind, title, narration }) => ({ kind, title, narration })) }, null, 2)}\n`);
  process.stdout.write(`Rendered ${guide.slug}: ${finalDuration.toFixed(1)}s, ${(sizeBytes / 1_048_576).toFixed(2)} MiB\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const requested = args.find((arg) => !arg.startsWith('-'));
  const selected = args.includes('--all') ? scamGuides : scamGuides.filter((guide) => guide.slug === (requested || 'phishing'));
  if (!selected.length) throw new Error(`Unknown guide slug: ${requested}`);
  await mkdir(WORK_ROOT, { recursive: true });
  for (const guide of selected) await renderGuide(guide);
}

main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });

// Writes a TEST guide track, no real audio: silence for the length of the programme with a short
// 1 kHz beep at the programme time of every cue. It stands in for a voice guide so the timing sync
// can be checked mechanically (scripts/verify-sync.mjs). Plain Node, no dependencies.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname} from 'node:path';

const sheetPath = process.argv[2];
const outPath = process.argv[3] ?? 'public/guide-test.wav';
if (!sheetPath) {
  console.error('usage: node scripts/make-guide-wav.mjs <cue-sheet.json> [out.wav]');
  process.exit(2);
}
const sheet = JSON.parse(readFileSync(sheetPath, 'utf8'));
const fps = sheet.fps ?? 24;

const tcToSeconds = (tc) => {
  const m = /^(\d{1,3}):([0-5]\d):([0-5]\d):(\d{2})$/.exec(tc);
  if (!m) throw new Error(`bad timecode ${tc}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / fps;
};

const RATE = 8000;
const BEEP_SECONDS = 0.25;
const totalSeconds = tcToSeconds(sheet.programDuration);
const samples = new Int16Array(Math.round(totalSeconds * RATE));
for (const cue of sheet.cues) {
  const start = Math.round(tcToSeconds(cue.at) * RATE);
  const len = Math.round(BEEP_SECONDS * RATE);
  for (let i = 0; i < len && start + i < samples.length; i += 1) {
    samples[start + i] = Math.round(0.5 * 32767 * Math.sin((2 * Math.PI * 1000 * i) / RATE));
  }
}

const data = Buffer.from(samples.buffer);
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(RATE, 24);
header.writeUInt32LE(RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

mkdirSync(dirname(outPath), {recursive: true});
writeFileSync(outPath, Buffer.concat([header, data]));
console.log(`wrote ${outPath}: ${totalSeconds.toFixed(1)} s, ${sheet.cues.length} beeps`);

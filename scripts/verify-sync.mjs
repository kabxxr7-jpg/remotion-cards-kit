// Checks a rendered episode window against the guide track: the first card frame must appear when the
// beep in the guide track starts (both are measured from the decoded file, not from the cue sheet).
// usage: node scripts/verify-sync.mjs <video.mp4> <windowStartFrame> <expectedCardStartFrame> [expectedHoldFrames] [fps]
import {spawnSync} from 'node:child_process';

const [video, winStart, cardStart, holdArg, fpsArg] = process.argv.slice(2);
if (!video || winStart === undefined || cardStart === undefined) {
  console.error('usage: node scripts/verify-sync.mjs <video.mp4> <windowStartFrame> <expectedCardStartFrame> [expectedHoldFrames] [fps]');
  process.exit(2);
}
const fps = Number(fpsArg ?? 24);
const W = 64;
const H = 36;

const ff = (args) => {
  const r = spawnSync('ffmpeg', ['-v', 'error', ...args], {maxBuffer: 1 << 28});
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr}`);
  return r.stdout;
};

// first frame brighter than the black baseline
const gray = ff(['-i', video, '-vf', `scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-']);
const frameSize = W * H;
const nFrames = Math.floor(gray.length / frameSize);
const mean = (i) => {
  let s = 0;
  for (let k = 0; k < frameSize; k += 1) s += gray[i * frameSize + k];
  return s / frameSize;
};
const base = mean(0);
let firstCard = -1;
for (let i = 0; i < nFrames; i += 1) {
  if (mean(i) > base + 3) {
    firstCard = i;
    break;
  }
}

// how many consecutive frames the card stays up
let holdCount = 0;
if (firstCard >= 0) {
  for (let i = firstCard; i < nFrames && mean(i) > base + 3; i += 1) holdCount += 1;
}

// first loud audio sample
const pcm = ff(['-i', video, '-vn', '-f', 's16le', '-ac', '1', '-ar', '8000', '-']);
let beep = -1;
for (let i = 0; i + 1 < pcm.length; i += 2) {
  if (Math.abs(pcm.readInt16LE(i)) > 8000) {
    beep = i / 2;
    break;
  }
}
const beepSeconds = beep / 8000;
const cardSeconds = firstCard / fps;
const expectedSeconds = (Number(cardStart) - Number(winStart)) / fps;
const oneFrame = 1 / fps;

console.log(`frames decoded: ${nFrames}; baseline luma ${base.toFixed(1)}`);
console.log(`first card frame: #${firstCard} = ${cardSeconds.toFixed(3)} s   expected ${expectedSeconds.toFixed(3)} s (timeline frame ${cardStart})`);
console.log(`card held for ${holdCount} frames = ${(holdCount / fps).toFixed(3)} s`);
console.log(`first beep sample: ${beepSeconds.toFixed(3)} s`);
console.log(`beep minus card: ${((beepSeconds - cardSeconds) * 1000).toFixed(1)} ms (one frame = ${(oneFrame * 1000).toFixed(1)} ms)`);

const ok = firstCard >= 0 && beep >= 0 && Math.abs(cardSeconds - expectedSeconds) < 1e-9 && Math.abs(beepSeconds - cardSeconds) <= oneFrame && (holdArg === undefined || holdCount === Number(holdArg));
console.log(ok ? 'SYNC OK' : 'SYNC FAILED');
process.exit(ok ? 0 : 1);

// Renders real stills of the disclosure card at several frames and requires them to be bit-identical.
// This is the render-level counterpart of the markup test: no fade, no movement, whatever the frame.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const props = process.argv[2] ?? 'data/disclosure.sample.json';
const frames = [0, 1, 95, 191];
const hashes = frames.map((f) => {
  const out = `out/static-check-${f}.png`;
  const r = spawnSync('npx', ['remotion', 'still', 'src/index.ts', 'DisclosureCard', out, `--props=${props}`, `--frame=${f}`], {encoding: 'utf8'});
  if (r.status !== 0) throw new Error(`still failed at frame ${f}: ${r.stdout}${r.stderr}`);
  return createHash('sha256').update(readFileSync(out)).digest('hex');
});
frames.forEach((f, i) => console.log(`frame ${String(f).padStart(3)}  sha256 ${hashes[i].slice(0, 16)}`));
const same = hashes.every((h) => h === hashes[0]);
console.log(same ? 'STATIC OK: all frames identical' : 'STATIC FAILED: frames differ');
process.exit(same ? 0 : 1);

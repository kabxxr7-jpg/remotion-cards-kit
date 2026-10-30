// Breaks a temporary copy of the project in deliberate ways and checks that the test suite fails each time.
// Nothing in the real source tree is touched. Exit code 1 if any breakage survives.
import {cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);
const FADE_IMPORT = "import {useCurrentFrame as __frame} from 'remotion';\n";

const mutations = [
  {name: 'wording altered (whitespace normalised and trimmed)', file: 'src/components/DisclosureCard.tsx', find: '          {text}', replace: "          {text.trim().replace(/ +/g, ' ')}"},
  {name: 'a fade is added over the legal text', file: 'src/components/DisclosureCard.tsx', find: "fontVariantLigatures: 'none',", replace: "fontVariantLigatures: 'none', opacity: Math.min(1, __frame() / 12),", prepend: FADE_IMPORT},
  {name: 'a slide (transform) is added over the legal text', file: 'src/components/DisclosureCard.tsx', find: "fontVariantLigatures: 'none',", replace: "fontVariantLigatures: 'none', transform: `translateY(${Math.max(0, 20 - __frame())}px)`,", prepend: FADE_IMPORT},
  {name: 'pre-wrap spacing switched off', file: 'src/components/DisclosureCard.tsx', find: "whiteSpace: 'pre-wrap',", replace: "whiteSpace: 'normal',"},
  {name: 'feature-cut flag inverted for the recap', file: 'src/lib/timeline.ts', find: 'sheet.recap.enabled && !sheet.featureCut', replace: 'sheet.recap.enabled && sheet.featureCut'},
  {name: 'feature cut ignored for the end card', file: 'src/lib/timeline.ts', find: 'sheet.endCard.enabled && !sheet.featureCut', replace: 'sheet.endCard.enabled'},
  {name: 'cues no longer shift when the recap is present', file: 'src/lib/timeline.ts', find: 'startFrame: recapFrames + programFrame,', replace: 'startFrame: programFrame,'},
  {name: 'overlap guard removed', file: 'src/lib/timeline.ts', find: 'if (cur.startFrame < prev.startFrame + prev.durationFrames) {', replace: 'if (false) {'},
  {name: 'hold is one frame short', file: 'src/lib/duration.ts', find: 'secondsToFrames(holdSeconds, fps))', replace: 'secondsToFrames(holdSeconds, fps) - 1)'},
  {name: 'timecode off by one frame', file: 'src/lib/timecode.ts', find: ') * fps + frames;', replace: ') * fps + frames + 1;'},
  {name: 'text colour no longer meets 7:1', file: 'src/lib/theme.ts', find: "export const FG = '#FFFFFF';", replace: "export const FG = '#777777';"},
  {name: 'legibility floor lowered to 10px', file: 'src/lib/theme.ts', find: 'MIN_FONT_PX_1080 = 36', replace: 'MIN_FONT_PX_1080 = 10'},
  {name: 'non-positive hold accepted', file: 'src/lib/schemas.ts', find: "z.number().positive('holdSeconds must be greater than 0')", replace: 'z.number()'},
  {name: 'whitespace-only text accepted', file: 'src/lib/schemas.ts', find: ".refine((t) => t.trim().length > 0, 'text must not be only whitespace')", replace: ''},
];

const results = [];
for (const m of mutations) {
  const dir = mkdtempSync(join(tmpdir(), 'rck-mut-'));
  try {
    cpSync(root, dir, {recursive: true, filter: (src) => !/\/(node_modules|out|\.git|public)(\/|$)/.test(src)});
    symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'));
    const path = join(dir, m.file);
    const before = readFileSync(path, 'utf8');
    const count = before.split(m.find).length - 1;
    if (count !== 1) throw new Error(`mutation target found ${count} times (expected 1): ${m.find}`);
    writeFileSync(path, (m.prepend ?? '') + before.replace(m.find, () => m.replace));
    const run = spawnSync('npx', ['vitest', 'run'], {cwd: dir, encoding: 'utf8', env: {...process.env, VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true'}});
    const out = `${run.stdout}${run.stderr}`;
    const failed = /Tests\s+(\d+) failed/.exec(out);
    results.push({name: m.name, caught: run.status !== 0, failing: failed ? Number(failed[1]) : 0});
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
}

for (const r of results) {
  console.log(`${r.caught ? 'caught  ' : 'SURVIVED'}  ${r.name}${r.caught ? ` (${r.failing} failing)` : ''}`);
}
const caught = results.filter((r) => r.caught).length;
console.log(`\n${caught}/${results.length} deliberate breakages caught by the suite`);
if (caught !== results.length) process.exit(1);

import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import type {EpisodeProps} from '../src/lib/schemas';
import {buildTimeline} from '../src/lib/timeline';
import {parseTimecode} from '../src/lib/timecode';
import {readJson} from './helpers';

const sheet = (over: Partial<EpisodeProps> = {}): EpisodeProps => ({...readJson<EpisodeProps>('data/episode.sample.json'), ...over});
const find = (t: ReturnType<typeof buildTimeline>, id: string) => t.items.find((i) => i.id === id);

describe('recap on (full cut)', () => {
  const t = buildTimeline(sheet());
  it('the recap is 20 s = 480 frames and sits first', () => {
    const recap = find(t, 'recap')!;
    expect(recap.durationFrames).toBe(480);
    expect(recap.startFrame).toBe(0);
    expect(t.programOffset).toBe(480);
  });
  it('the disclosure lands at 00:09:00:00 of the programme, shifted by the recap', () => {
    const d = find(t, 'disclosure-ep1')!;
    expect(d.programFrame).toBe(12960);
    expect(d.startFrame).toBe(480 + 12960);
    expect(d.durationFrames).toBe(192);
  });
  it('the end card follows the programme and the total adds up', () => {
    const e = find(t, 'endCard')!;
    expect(e.startFrame).toBe(480 + 14400);
    expect(t.totalFrames).toBe(480 + 14400 + 144);
    expect(t.removed).toEqual([]);
  });
});

describe('feature cut', () => {
  const full = buildTimeline(sheet());
  const cut = buildTimeline(sheet({featureCut: true}));
  it('contains no recap and no end card, and says what it removed', () => {
    expect(find(cut, 'recap')).toBeUndefined();
    expect(find(cut, 'endCard')).toBeUndefined();
    expect(cut.items.map((i) => i.kind)).not.toContain('recap');
    expect(cut.items.map((i) => i.kind)).not.toContain('endCard');
    expect(cut.removed).toEqual(['recap', 'endCard']);
  });
  it('contributes zero frames and leaves no gap: the programme starts at frame 0 and ends the timeline', () => {
    expect(cut.programOffset).toBe(0);
    expect(cut.totalFrames).toBe(cut.programFrames);
    expect(cut.totalFrames).toBe(14400);
  });
  it('later cues shift earlier by exactly the recap length and stay on the same programme moment', () => {
    const a = find(full, 'disclosure-ep1')!;
    const b = find(cut, 'disclosure-ep1')!;
    expect(b.programFrame).toBe(a.programFrame);
    expect(a.startFrame - b.startFrame).toBe(480);
    expect(b.startFrame).toBe(12960);
  });
  it('the disclosure itself is unchanged by the toggle: same wording, same hold', () => {
    const a = find(full, 'disclosure-ep1')!;
    const b = find(cut, 'disclosure-ep1')!;
    expect(b.cue).toEqual(a.cue);
    expect(b.durationFrames).toBe(a.durationFrames);
    expect(b.kind).toBe(a.kind);
  });
  it('the featureCut flag wins over the module flags', () => {
    const s = sheet({featureCut: true});
    expect(s.recap.enabled).toBe(true);
    expect(find(buildTimeline(s), 'recap')).toBeUndefined();
  });
});

describe('modules switched off on their own', () => {
  it('recap.enabled false adds zero frames even without the feature cut', () => {
    const s = sheet();
    const t = buildTimeline({...s, recap: {...s.recap, enabled: false}});
    expect(find(t, 'recap')).toBeUndefined();
    expect(t.programOffset).toBe(0);
    expect(find(t, 'endCard')).toBeDefined();
    expect(t.removed).toEqual(['recap']);
    expect(find(t, 'disclosure-ep1')!.startFrame).toBe(12960);
  });
});

describe('guards', () => {
  it('rejects overlapping cues', () => {
    const s = sheet();
    const cues = [
      ...s.cues,
      {id: 'late', type: 'lowerThird' as const, at: '00:09:03:00', source: 's', date: 'd', holdSeconds: 5},
    ];
    expect(() => buildTimeline({...s, cues})).toThrow(/overlap/);
  });
  it('rejects a cue that runs past the end of the programme', () => {
    const s = sheet({programDuration: '00:09:04:00'});
    expect(() => buildTimeline(s)).toThrow(/past the end/);
  });
  it('the render scripts cover the disclosure: the --frames windows in package.json contain it', () => {
    const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts as Record<string, string>;
    const windowOf = (name: string): [number, number] => {
      const m = /--frames=(\d+)-(\d+)/.exec(scripts[name] ?? '');
      if (!m) throw new Error(`no --frames in ${name}`);
      return [Number(m[1]), Number(m[2])];
    };
    const check = (script: string, file: string) => {
      const t = buildTimeline(readJson<EpisodeProps>(file));
      const d = t.items.find((i) => i.kind === 'disclosure')!;
      const [lo, hi] = windowOf(script);
      expect(d.startFrame).toBeGreaterThanOrEqual(lo);
      expect(d.startFrame + d.durationFrames).toBeLessThanOrEqual(hi + 1);
    };
    check('render:episode', 'data/episode.sample.json');
    check('render:episode:feature-cut', 'data/episode.feature-cut.json');
  });
  it('the two sample episode files differ only in featureCut', () => {
    const a = readJson<EpisodeProps>('data/episode.sample.json');
    const b = readJson<EpisodeProps>('data/episode.feature-cut.json');
    expect({...b, featureCut: false}).toEqual(a);
    expect(b.featureCut).toBe(true);
  });
  it('programme timecode parses', () => {
    expect(parseTimecode(sheet().programDuration, 24)).toBe(14400);
  });
});

import {describe, expect, it} from 'vitest';
import {DisclosureSchema, EpisodeSchema, RecapSchema} from '../src/lib/schemas';
import {readJson} from './helpers';

describe('DisclosureSchema', () => {
  it('applies the defaults: hold 8 s, 24 fps', () => {
    const p = DisclosureSchema.parse({text: 'x'});
    expect(p.holdSeconds).toBe(8);
    expect(p.fps).toBe(24);
  });
  it('rejects missing text', () => {
    expect(DisclosureSchema.safeParse({}).success).toBe(false);
  });
  it('rejects empty and whitespace-only text', () => {
    expect(DisclosureSchema.safeParse({text: ''}).success).toBe(false);
    expect(DisclosureSchema.safeParse({text: '   \n  '}).success).toBe(false);
  });
  it('rejects a non-positive hold', () => {
    expect(DisclosureSchema.safeParse({text: 'x', holdSeconds: 0}).success).toBe(false);
    expect(DisclosureSchema.safeParse({text: 'x', holdSeconds: -3}).success).toBe(false);
  });
  it('never alters the text it accepts', () => {
    const text = '  keep   this\n\nexactly  ';
    expect(DisclosureSchema.parse({text}).text).toBe(text);
  });
  it('rejects an absurd safe margin', () => {
    expect(DisclosureSchema.safeParse({text: 'x', safeMargin: 0.6}).success).toBe(false);
  });
});

describe('RecapSchema', () => {
  it('needs at least one line', () => {
    expect(RecapSchema.safeParse({title: 't', lines: []}).success).toBe(false);
  });
  it('defaults to enabled and 20 seconds', () => {
    const p = RecapSchema.parse({title: 't', lines: ['a']});
    expect(p.enabled).toBe(true);
    expect(p.seconds).toBe(20);
  });
});

describe('sample data validates', () => {
  it('episode sheets', () => {
    expect(EpisodeSchema.safeParse(readJson('data/episode.sample.json')).success).toBe(true);
    expect(EpisodeSchema.safeParse(readJson('data/episode.feature-cut.json')).success).toBe(true);
  });
  it('rejects a bad timecode inside a cue', () => {
    const sheet = readJson<any>('data/episode.sample.json');
    sheet.cues[0].at = '9:00';
    expect(EpisodeSchema.safeParse(sheet).success).toBe(false);
  });
});

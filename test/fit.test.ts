import {describe, expect, it} from 'vitest';
import {contrastRatio} from '../src/lib/contrast';
import {TextDoesNotFitError, fitFontSize} from '../src/lib/fit';
import {BG, FG, MIN_FONT_PX_1080, MUTED} from '../src/lib/theme';
import {readJson, type VerbatimSample} from './helpers';

const samples = readJson<VerbatimSample[]>('data/verbatim-samples.json');
const longest = samples.reduce((a, b) => (b.text.length > a.text.length ? b : a));

describe('contrast', () => {
  it('white on black is far above the 7:1 AAA bar', () => {
    expect(contrastRatio(FG, BG)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(FG, BG)).toBeCloseTo(21, 5);
  });
  it('secondary text on the recap and end cards also clears 7:1', () => {
    expect(contrastRatio(MUTED, BG)).toBeGreaterThanOrEqual(7);
  });
  it('the ratio is symmetric and sane for mid greys', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#000000')).toBeLessThan(7);
  });
});

describe('font fitting', () => {
  it('the longest sample fits at 1920x1080 without going under the legibility floor', () => {
    const r = fitFontSize({text: longest.text, width: 1920, height: 1080, safeMargin: 0.1});
    expect(r.fontPx).toBeGreaterThanOrEqual(MIN_FONT_PX_1080);
    expect(r.lines * r.fontPx * 1.35).toBeLessThanOrEqual(r.boxHeight);
  });
  it('every sample fits at the floor or above, at 1080p and at the 4K size', () => {
    for (const s of samples) {
      expect(fitFontSize({text: s.text, width: 1920, height: 1080, safeMargin: 0.1}).fontPx).toBeGreaterThanOrEqual(MIN_FONT_PX_1080);
      expect(fitFontSize({text: s.text, width: 3840, height: 2160, safeMargin: 0.1}).fontPx).toBeGreaterThanOrEqual(MIN_FONT_PX_1080 * 2);
    }
  });
  it('is deterministic', () => {
    const a = fitFontSize({text: longest.text, width: 1920, height: 1080, safeMargin: 0.1});
    const b = fitFontSize({text: longest.text, width: 1920, height: 1080, safeMargin: 0.1});
    expect(a).toEqual(b);
  });
  it('shrinks the size, never the text: a longer text gets a smaller or equal size', () => {
    const short = fitFontSize({text: 'Short.', width: 1920, height: 1080, safeMargin: 0.1}).fontPx;
    const long = fitFontSize({text: longest.text, width: 1920, height: 1080, safeMargin: 0.1}).fontPx;
    expect(long).toBeLessThan(short);
  });
  it('refuses text that cannot fit at the floor instead of shrinking it further', () => {
    const huge = 'This sentence is repeated to be far too long for one card. '.repeat(40);
    expect(() => fitFontSize({text: huge, width: 1920, height: 1080, safeMargin: 0.1})).toThrow(TextDoesNotFitError);
  });
});

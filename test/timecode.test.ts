import {describe, expect, it} from 'vitest';
import {formatTimecode, parseTimecode} from '../src/lib/timecode';

describe('timecode', () => {
  it('00:09:00:00 at 24 fps is frame 12960', () => {
    expect(parseTimecode('00:09:00:00', 24)).toBe(12960);
  });
  it('converts seconds and frames', () => {
    expect(parseTimecode('00:00:00:00', 24)).toBe(0);
    expect(parseTimecode('00:00:01:00', 24)).toBe(24);
    expect(parseTimecode('00:00:01:23', 24)).toBe(47);
    expect(parseTimecode('01:00:00:00', 24)).toBe(86400);
    expect(parseTimecode('00:03:10:00', 24)).toBe(4560);
  });
  it('works at other frame rates', () => {
    expect(parseTimecode('00:00:01:00', 25)).toBe(25);
    expect(parseTimecode('00:01:00:29', 30)).toBe(1829);
  });
  it('rejects a frame field that is not below fps', () => {
    expect(() => parseTimecode('00:00:00:24', 24)).toThrow(/not below fps/);
  });
  it('rejects malformed timecodes and bad fps', () => {
    expect(() => parseTimecode('9:00', 24)).toThrow(/Bad timecode/);
    expect(() => parseTimecode('00:60:00:00', 24)).toThrow(/Bad timecode/);
    expect(() => parseTimecode('00:00:00:00', 0)).toThrow(/fps/);
  });
  it('round-trips format and parse', () => {
    for (const f of [0, 1, 23, 24, 480, 12960, 13440, 86399]) {
      expect(parseTimecode(formatTimecode(f, 24), 24)).toBe(f);
    }
    expect(formatTimecode(12960, 24)).toBe('00:09:00:00');
  });
});

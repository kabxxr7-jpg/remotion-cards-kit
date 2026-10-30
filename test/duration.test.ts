import {describe, expect, it} from 'vitest';
import {holdFrames} from '../src/lib/duration';
import {DisclosureSchema} from '../src/lib/schemas';

describe('hold duration', () => {
  it('the default 8 second hold at 24 fps is 192 frames', () => {
    const p = DisclosureSchema.parse({text: 'x'});
    expect(holdFrames(p.holdSeconds, p.fps)).toBe(192);
  });
  it('follows the props', () => {
    expect(holdFrames(10, 24)).toBe(240);
    expect(holdFrames(8, 25)).toBe(200);
    expect(holdFrames(0.01, 24)).toBe(1);
  });
});

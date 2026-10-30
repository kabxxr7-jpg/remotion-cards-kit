// @vitest-environment jsdom
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {DisclosureCard} from '../src/components/DisclosureCard';
import {RecapCard} from '../src/components/RecapCard';
import {EndCard} from '../src/components/EndCard';
import {LowerThird} from '../src/components/LowerThird';
import {DisclosureSchema, type EpisodeProps} from '../src/lib/schemas';
import {readJson, type VerbatimSample} from './helpers';

const {state} = vi.hoisted(() => ({state: {frame: 0}}));

// Only the hooks that need a Remotion runtime are replaced. The frame is controllable, so a card that
// reacts to the frame (a fade, a slide) produces different markup at different frames and the tests catch it.
vi.mock('remotion', async () => {
  const actual = await vi.importActual<typeof import('remotion')>('remotion');
  return {
    ...actual,
    useCurrentFrame: () => state.frame,
    useVideoConfig: () => ({width: 1920, height: 1080, fps: 24, durationInFrames: 192, id: 'test', defaultProps: {}, props: {}}),
  };
});

const samples = readJson<VerbatimSample[]>('data/verbatim-samples.json');
const disclosureSample = readJson<{text: string}>('data/disclosure.sample.json');

const html = (text: string, frame = 0): string => {
  state.frame = frame;
  const p = DisclosureSchema.parse({text});
  return renderToStaticMarkup(<DisclosureCard {...p} />);
};
const textOf = (markup: string, selector = '[data-verbatim]'): string => {
  const host = document.createElement('div');
  host.innerHTML = markup;
  const el = host.querySelector(selector);
  if (!el) throw new Error(`no element ${selector}`);
  return el.textContent ?? '';
};

beforeEach(() => {
  state.frame = 0;
});

describe('disclosure card: exact wording', () => {
  for (const s of samples) {
    it(`renders "${s.name}" byte for byte`, () => {
      const out = textOf(html(s.text));
      expect(out).toBe(s.text);
      expect(Buffer.from(out, 'utf8').equals(Buffer.from(s.text, 'utf8'))).toBe(true);
    });
  }
  it('keeps the spacing rules in CSS, not in the text', () => {
    expect(html('a  b')).toContain('white-space:pre-wrap');
  });
  it('the sample file really contains the awkward characters it claims to', () => {
    for (const ch of ['“', '”', '—', ' ', '\n', 'ë', '&', '<', '  ']) {
      expect(disclosureSample.text).toContain(ch);
    }
  });
});

describe('disclosure card: no motion', () => {
  it('produces identical markup at frames 0, 1, 95 and 191', () => {
    const base = html(disclosureSample.text, 0);
    for (const f of [1, 95, 191]) {
      expect(html(disclosureSample.text, f)).toBe(base);
    }
  });
  it('carries no opacity, transform, transition, animation or filter', () => {
    expect(html(disclosureSample.text)).not.toMatch(/opacity|transform|transition|animation|filter|keyframes/i);
  });
  it('is white on black', () => {
    const m = html('x');
    expect(m).toMatch(/background-color:#000000/i);
    expect(m).toMatch(/color:#FFFFFF/i);
  });
});

describe('disclosure card: layout', () => {
  it('uses one fitted size and sets only a size, nothing that changes the characters', () => {
    const m = html(disclosureSample.text);
    const size = /font-size:(\d+)px/.exec(m);
    expect(size).not.toBeNull();
    expect(Number(size![1])).toBeGreaterThanOrEqual(36);
    expect(m).not.toMatch(/text-transform|font-variant-caps|letter-spacing/i);
  });
});

describe('other cards keep their text verbatim and static too', () => {
  const recap = readJson<{title: string; lines: string[]}>('data/recap.sample.json');
  const episode = readJson<EpisodeProps>('data/episode.sample.json');
  it('recap lines are rendered exactly, at any frame', () => {
    state.frame = 0;
    const a = renderToStaticMarkup(<RecapCard enabled title={recap.title} lines={recap.lines} seconds={20} fps={24} safeMargin={0.1} />);
    state.frame = 400;
    const b = renderToStaticMarkup(<RecapCard enabled title={recap.title} lines={recap.lines} seconds={20} fps={24} safeMargin={0.1} />);
    expect(a).toBe(b);
    const host = document.createElement('div');
    host.innerHTML = a;
    expect([...host.querySelectorAll('[data-line]')].map((e) => e.textContent)).toEqual(recap.lines);
    expect(host.querySelector('[data-title]')?.textContent).toBe(recap.title);
  });
  it('end card and lower-third are static and exact', () => {
    const e0 = renderToStaticMarkup(<EndCard {...episode.endCard} fps={24} />);
    const l0 = renderToStaticMarkup(<LowerThird source={'Source: A &amp; B'} date="1 May" holdSeconds={5} fps={24} />);
    state.frame = 77;
    expect(renderToStaticMarkup(<EndCard {...episode.endCard} fps={24} />)).toBe(e0);
    expect(renderToStaticMarkup(<LowerThird source={'Source: A &amp; B'} date="1 May" holdSeconds={5} fps={24} />)).toBe(l0);
    expect(textOf(l0, '[data-source]')).toBe('Source: A &amp; B'); // text goes in as text; markup characters are not interpreted
  });
});

import {LINE_HEIGHT, MAX_FONT_PX_1080, MIN_FONT_PX_1080} from './theme';

// Deterministic font fitting. Only the SIZE is ever chosen here; the text is never touched.
// Without a browser we cannot measure glyphs, so line breaks are estimated from a conservative
// per-character width model (average advance in em for a typical sans-serif, with a safety margin).
// The renderer additionally checks the real layout and refuses to render if the text overflows.

const NARROW = new Set([...'iljtfI.,:;\'!|’‘ ']);
const WIDE = new Set([...'mwMW@—']);
const SAFETY = 1.08;

export const charWidthEm = (ch: string): number => {
  if (ch === ' ') return 0.28;
  if (NARROW.has(ch)) return 0.3;
  if (WIDE.has(ch)) return 0.9;
  if (ch >= 'A' && ch <= 'Z') return 0.68;
  return 0.56;
};

const wordWidthEm = (word: string): number => [...word].reduce((sum, ch) => sum + charWidthEm(ch), 0) * SAFETY;

/** Estimated number of lines at a given font size, honouring explicit line breaks. */
export const estimateLines = (text: string, boxWidthPx: number, fontPx: number): number => {
  const maxEm = boxWidthPx / fontPx;
  let lines = 0;
  for (const paragraph of text.split('\n')) {
    // Split on ordinary spaces only: a non-breaking space must never be treated as a break point.
    const words = paragraph.split(' ');
    let current = 0;
    let used = 1;
    const space = charWidthEm(' ') * SAFETY;
    for (const w of words) {
      const ww = wordWidthEm(w);
      if (current === 0) {
        current = ww;
        // a single word longer than the line wraps by characters
        while (current > maxEm) {
          used += 1;
          current -= maxEm;
        }
      } else if (current + space + ww <= maxEm) {
        current += space + ww;
      } else {
        used += 1;
        current = ww;
        while (current > maxEm) {
          used += 1;
          current -= maxEm;
        }
      }
    }
    lines += used;
  }
  return lines;
};

export interface FitInput {
  text: string;
  width: number;
  height: number;
  /** fraction of each dimension kept empty on every side, 0 to 0.4 */
  safeMargin: number;
}

export interface FitResult {
  fontPx: number;
  boxWidth: number;
  boxHeight: number;
  lines: number;
  minPx: number;
}

export class TextDoesNotFitError extends Error {}

export const safeBox = (width: number, height: number, safeMargin: number) => ({
  boxWidth: Math.round(width * (1 - 2 * safeMargin)),
  boxHeight: Math.round(height * (1 - 2 * safeMargin)),
});

/** Largest whole-pixel font size (not above the cap) at which the text fits the safe box. */
export const fitFontSize = ({text, width, height, safeMargin}: FitInput): FitResult => {
  const scale = height / 1080;
  const minPx = Math.round(MIN_FONT_PX_1080 * scale);
  const maxPx = Math.round(MAX_FONT_PX_1080 * scale);
  const {boxWidth, boxHeight} = safeBox(width, height, safeMargin);
  for (let px = maxPx; px >= minPx; px -= 1) {
    const lines = estimateLines(text, boxWidth, px);
    if (lines * px * LINE_HEIGHT <= boxHeight) {
      return {fontPx: px, boxWidth, boxHeight, lines, minPx};
    }
  }
  throw new TextDoesNotFitError(
    `Text does not fit the safe area at the legibility floor of ${minPx}px (${width}x${height}, margin ${safeMargin}). ` +
      `Shorten the text, split it over two cards, or reduce safeMargin. The text is never shrunk below the floor.`,
  );
};

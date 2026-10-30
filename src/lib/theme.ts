// One place for the look. The disclosure card is white on black by brief.
export const FG = '#FFFFFF';
export const BG = '#000000';
export const MUTED = '#D9D9D9'; // secondary lines on the recap and end cards (still above 7:1 on black)

// No network fonts at render time: a system stack, so a render never depends on a download.
export const FONT_STACK =
  '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", "DejaVu Sans", sans-serif';

export const LINE_HEIGHT = 1.35;

// Legibility floor, in pixels at 1080p. Scaled by height/1080 for other sizes.
export const MIN_FONT_PX_1080 = 36;
export const MAX_FONT_PX_1080 = 84;

import {z} from 'zod';

export const FpsSchema = z.number().int().min(1).max(120).default(24);
export const SafeMarginSchema = z.number().min(0).max(0.4).default(0.1);
export const TimecodeSchema = z
  .string()
  .regex(/^\d{1,3}:[0-5]\d:[0-5]\d:\d{2}$/, 'timecode must look like HH:MM:SS:FF, for example 00:09:00:00');

// The card text is validated, never transformed: no trim, no normalisation, no replace.
const VerbatimText = z
  .string({required_error: 'text is required'})
  .min(1, 'text must not be empty')
  .refine((t) => t.trim().length > 0, 'text must not be only whitespace');

export const DisclosureSchema = z.object({
  text: VerbatimText,
  holdSeconds: z.number().positive('holdSeconds must be greater than 0').max(120).default(8),
  fps: FpsSchema,
  safeMargin: SafeMarginSchema,
  align: z.enum(['left', 'center']).default('center'),
});
export type DisclosureProps = z.infer<typeof DisclosureSchema>;

const Line = z.string().min(1, 'a line must not be empty');

export const RecapSchema = z.object({
  enabled: z.boolean().default(true),
  title: Line,
  lines: z.array(Line).min(1, 'a recap needs at least one line').max(8),
  seconds: z.number().positive().max(120).default(20),
  fps: FpsSchema,
  safeMargin: SafeMarginSchema,
});
export type RecapProps = z.infer<typeof RecapSchema>;

export const EndCardSchema = z.object({
  enabled: z.boolean().default(true),
  title: Line,
  lines: z.array(Line).max(4).default([]),
  seconds: z.number().positive().max(120).default(6),
  fps: FpsSchema,
  safeMargin: SafeMarginSchema,
});
export type EndCardProps = z.infer<typeof EndCardSchema>;

export const LowerThirdSchema = z.object({
  source: Line,
  date: Line,
  holdSeconds: z.number().positive().max(60).default(5),
  fps: FpsSchema,
});
export type LowerThirdProps = z.infer<typeof LowerThirdSchema>;

const CueBase = {id: z.string().min(1), at: TimecodeSchema};

export const CueSchema = z.discriminatedUnion('type', [
  z.object({
    ...CueBase,
    type: z.literal('disclosure'),
    text: VerbatimText,
    holdSeconds: z.number().positive().max(120).default(8),
    safeMargin: SafeMarginSchema,
    align: z.enum(['left', 'center']).default('center'),
  }),
  z.object({
    ...CueBase,
    type: z.literal('lowerThird'),
    source: Line,
    date: Line,
    holdSeconds: z.number().positive().max(60).default(5),
  }),
]);
export type Cue = z.infer<typeof CueSchema>;

export const EpisodeSchema = z.object({
  fps: FpsSchema,
  /** One switch for the feature cut: removes the recap and the end card, whatever their own flags say. */
  featureCut: z.boolean().default(false),
  /** Length of the programme itself, without the removable cards. */
  programDuration: TimecodeSchema,
  recap: RecapSchema.omit({fps: true}),
  endCard: EndCardSchema.omit({fps: true}),
  cues: z.array(CueSchema).min(1),
  guideTrack: z.string().optional(),
});
export type EpisodeProps = z.infer<typeof EpisodeSchema>;

import {holdFrames} from './duration';
import {EpisodeSchema, type Cue, type EpisodeProps} from './schemas';
import {parseTimecode} from './timecode';

export type ItemKind = 'recap' | 'disclosure' | 'lowerThird' | 'endCard';

export interface TimelineItem {
  id: string;
  kind: ItemKind;
  /** Where the item starts in the rendered timeline. */
  startFrame: number;
  durationFrames: number;
  /** Where it sits in the programme itself (null for the inserted recap and end card). */
  programFrame: number | null;
  cue?: Cue;
}

export interface Timeline {
  fps: number;
  /** Frames inserted before the programme (the recap). 0 in a feature cut. */
  programOffset: number;
  programFrames: number;
  totalFrames: number;
  items: TimelineItem[];
  /** Ids of modules that were switched off, so a log can say exactly what the feature cut removed. */
  removed: string[];
}

/**
 * Placement model (documented in the README):
 * every cue is anchored to PROGRAMME time, the time of the film itself. The recap is an insert before
 * the programme and the end card an insert after it. Switching the recap off removes its frames and
 * everything after it moves earlier by exactly that many frames, so each cue stays on the same
 * moment of the picture and the guide voice track. Absolute placement would drift by the recap length.
 */
export const buildTimeline = (input: EpisodeProps): Timeline => {
  const sheet = EpisodeSchema.parse(input);
  const {fps} = sheet;
  const removed: string[] = [];

  const recapOn = sheet.recap.enabled && !sheet.featureCut;
  const endOn = sheet.endCard.enabled && !sheet.featureCut;
  if (!recapOn) removed.push('recap');
  if (!endOn) removed.push('endCard');

  const recapFrames = recapOn ? holdFrames(sheet.recap.seconds, fps) : 0;
  const endFrames = endOn ? holdFrames(sheet.endCard.seconds, fps) : 0;
  const programFrames = parseTimecode(sheet.programDuration, fps);

  const items: TimelineItem[] = [];
  if (recapOn) {
    items.push({id: 'recap', kind: 'recap', startFrame: 0, durationFrames: recapFrames, programFrame: null});
  }

  const cueItems = sheet.cues.map((cue): TimelineItem => {
    const programFrame = parseTimecode(cue.at, fps);
    const durationFrames = holdFrames(cue.holdSeconds, fps);
    if (programFrame + durationFrames > programFrames) {
      throw new Error(`Cue "${cue.id}" (${cue.at}) runs past the end of the programme (${sheet.programDuration}).`);
    }
    return {
      id: cue.id,
      kind: cue.type,
      startFrame: recapFrames + programFrame,
      durationFrames,
      programFrame,
      cue,
    };
  });
  cueItems.sort((a, b) => a.startFrame - b.startFrame);
  for (let i = 1; i < cueItems.length; i += 1) {
    const prev = cueItems[i - 1]!;
    const cur = cueItems[i]!;
    // two lower-thirds or a lower-third over a card would hide legal text; refuse overlaps outright
    if (cur.startFrame < prev.startFrame + prev.durationFrames) {
      throw new Error(`Cues "${prev.id}" and "${cur.id}" overlap.`);
    }
  }
  items.push(...cueItems);

  if (endOn) {
    items.push({
      id: 'endCard',
      kind: 'endCard',
      startFrame: recapFrames + programFrames,
      durationFrames: endFrames,
      programFrame: null,
    });
  }

  return {
    fps,
    programOffset: recapFrames,
    programFrames,
    totalFrames: recapFrames + programFrames + endFrames,
    items,
    removed,
  };
};

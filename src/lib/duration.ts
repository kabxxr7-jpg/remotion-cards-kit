import {secondsToFrames} from './timecode';

/** Frames a card is held for. Never less than one frame. */
export const holdFrames = (holdSeconds: number, fps: number): number =>
  Math.max(1, secondsToFrames(holdSeconds, fps));

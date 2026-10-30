// Timecode helpers. Non-drop-frame only: at 24 fps (the format used here) drop-frame does not exist.

const TC = /^(\d{1,3}):([0-5]\d):([0-5]\d):(\d{2})$/;

export const parseTimecode = (tc: string, fps: number): number => {
  if (!Number.isInteger(fps) || fps <= 0) {
    throw new Error(`fps must be a positive integer, got ${fps}`);
  }
  const m = TC.exec(tc);
  if (!m) {
    throw new Error(`Bad timecode "${tc}". Use HH:MM:SS:FF, for example 00:09:00:00.`);
  }
  const [, h, min, s, f] = m;
  const frames = Number(f);
  if (frames >= fps) {
    throw new Error(`Timecode "${tc}" has frame field ${frames}, which is not below fps ${fps}.`);
  }
  return ((Number(h) * 60 + Number(min)) * 60 + Number(s)) * fps + frames;
};

const pad = (n: number, w = 2): string => String(n).padStart(w, '0');

export const formatTimecode = (frames: number, fps: number): string => {
  if (!Number.isInteger(frames) || frames < 0) {
    throw new Error(`frames must be a non-negative integer, got ${frames}`);
  }
  const f = frames % fps;
  const totalSeconds = (frames - f) / fps;
  const s = totalSeconds % 60;
  const totalMinutes = (totalSeconds - s) / 60;
  const m = totalMinutes % 60;
  const h = (totalMinutes - m) / 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
};

export const secondsToFrames = (seconds: number, fps: number): number => Math.round(seconds * fps);

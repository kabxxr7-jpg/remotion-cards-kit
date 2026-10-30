import {existsSync} from 'node:fs';
import {Config} from '@remotion/cli/config';

// Use the Chrome that is already installed instead of downloading a browser.
// If it is not there, Remotion falls back to its own browser (`npx remotion browser ensure`).
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (existsSync(CHROME)) {
  Config.setBrowserExecutable(CHROME);
}

Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);

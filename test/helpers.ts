import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const readJson = <T = unknown>(rel: string): T => JSON.parse(readFileSync(join(root, rel), 'utf8')) as T;

export interface VerbatimSample {
  name: string;
  text: string;
}

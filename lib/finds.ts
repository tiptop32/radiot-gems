import finds from '@/data/finds.json';
import { playbackStartSeconds } from '@/lib/timestamp';

export type Find = (typeof finds)[number];

export { finds };

// Where the in-page player and the MP3 link start a find.
export const findStartSeconds = (find: Find) =>
  playbackStartSeconds(find.timestampSeconds);

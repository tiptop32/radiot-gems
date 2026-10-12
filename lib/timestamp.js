export const PLAYBACK_LEAD_SECONDS = 180;

export function playbackStartSeconds(officialSeconds) {
  return Math.max(0, officialSeconds - PLAYBACK_LEAD_SECONDS);
}

export function formatTimestamp(knownTotalSeconds) {
  const totalSeconds = Math.floor(knownTotalSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

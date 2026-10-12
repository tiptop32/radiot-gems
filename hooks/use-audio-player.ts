import { useRef, useState } from 'react';

const finiteOrZero = (value: number) => (Number.isFinite(value) ? value : 0);

// Drives a single <audio> element: the caller spreads `audioProps` onto it.
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  // A seek waiting for metadata; replaced when another track is requested.
  const pendingStartRef = useRef<(() => void) | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState({ current: 0, duration: 0 });

  const syncPosition = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setPosition({
      current: audio.currentTime,
      duration: finiteOrZero(audio.duration),
    });
  };

  const cancelPendingStart = () => {
    const audio = audioRef.current;
    if (audio && pendingStartRef.current)
      audio.removeEventListener('loadedmetadata', pendingStartRef.current);
    pendingStartRef.current = null;
  };

  const play = (audio: HTMLAudioElement) => {
    void audio.play().catch(() => setIsPlaying(false));
  };

  // Plays `src` from `startSeconds`, reusing the loaded file when only the
  // position changes (several finds can come from the same episode).
  const playFrom = (src: string, startSeconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    cancelPendingStart();
    const start = () => {
      pendingStartRef.current = null;
      audio.currentTime = startSeconds;
      syncPosition();
      play(audio);
    };
    if (audio.getAttribute('src') !== src) {
      audio.src = src;
      setPosition({ current: startSeconds, duration: 0 });
    } else if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      start();
      return;
    }
    pendingStartRef.current = start;
    audio.addEventListener('loadedmetadata', start, { once: true });
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio?.getAttribute('src')) return;
    if (audio.paused) play(audio);
    else audio.pause();
  };

  const seekTo = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    // Without a known duration, only backward seeks are safe.
    const max = finiteOrZero(audio.duration) || audio.currentTime;
    audio.currentTime = Math.min(Math.max(seconds, 0), max);
    syncPosition();
  };

  const seekBy = (deltaSeconds: number) => {
    const audio = audioRef.current;
    if (audio) seekTo(audio.currentTime + deltaSeconds);
  };

  const stop = () => {
    cancelPendingStart();
    audioRef.current?.pause();
  };

  const audioProps = {
    ref: audioRef,
    preload: 'metadata',
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onEnded: () => setIsPlaying(false),
    onTimeUpdate: syncPosition,
    onLoadedMetadata: syncPosition,
    onDurationChange: syncPosition,
  } as const;

  return {
    audioProps,
    isPlaying,
    position,
    playFrom,
    toggle,
    seekTo,
    seekBy,
    stop,
  };
}

import { useEffect, useRef, useState } from 'react';

export const PLAYBACK_RATES = [1, 1.25, 1.5, 2] as const;

const finiteOrZero = (value: number) => (Number.isFinite(value) ? value : 0);

// Drives a single <audio> element: the caller spreads `audioProps` onto it.
export function useAudioPlayer({ rate = 1 } = {}) {
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

  // Loads `src` at `startSeconds`, reusing the loaded file when only the
  // position changes (several finds can come from the same episode).
  const load = (src: string, startSeconds: number, autoplay = true) => {
    const audio = audioRef.current;
    if (!audio) return;
    cancelPendingStart();
    const start = () => {
      pendingStartRef.current = null;
      audio.currentTime = startSeconds;
      syncPosition();
      if (autoplay) play(audio);
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

  useEffect(() => {
    const audio = audioRef.current;
    // defaultPlaybackRate survives loading another episode.
    if (audio) audio.defaultPlaybackRate = audio.playbackRate = rate;
  }, [rate]);

  const hasSource = (src: string) =>
    audioRef.current?.getAttribute('src') === src;

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
    rate,
    hasSource,
    load,
    toggle,
    seekTo,
    seekBy,
    stop,
  };
}

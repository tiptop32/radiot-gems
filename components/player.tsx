import type { ComponentProps } from 'react';
import { FastForward, Pause, Play, Rewind, SkipForward, X } from 'lucide-react';
import { PLAYBACK_RATES, type useAudioPlayer } from '@/hooks/use-audio-player';
import { type Find, findStartSeconds } from '@/lib/finds';
import { formatTimestamp } from '@/lib/timestamp';

const SEEK_STEP_SECONDS = 30;

type PlayerProps = {
  find: Find | null;
  nextFind: Find | null;
  player: ReturnType<typeof useAudioPlayer>;
  onRateChange: (rate: number) => void;
  onNext: () => void;
  onClose: () => void;
};

export function Player({
  find,
  nextFind,
  player,
  onRateChange,
  onNext,
  onClose,
}: PlayerProps) {
  const { audioProps, isPlaying, position, rate, toggle, seekTo, seekBy } =
    player;
  const { current, duration } = position;
  const nextRate =
    PLAYBACK_RATES[
      (PLAYBACK_RATES.indexOf(rate as never) + 1) % PLAYBACK_RATES.length
    ];

  return (
    <aside
      className={find ? 'player player-visible' : 'player'}
      aria-label="Плеер выбранной находки"
    >
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- Radio-T does not publish caption tracks for these podcast MP3s. */}
      <audio {...audioProps} />
      {find && (
        <>
          <button
            className="player-toggle"
            type="button"
            onClick={toggle}
            aria-label={
              isPlaying ? 'Поставить на паузу' : 'Продолжить воспроизведение'
            }
          >
            {isPlaying ? (
              <Pause aria-hidden="true" />
            ) : (
              <Play aria-hidden="true" />
            )}
          </button>
          <div className="player-body">
            <div className="player-copy">
              <span>СЕЙЧАС В ЭФИРЕ · #{find.episode}</span>
              <strong>
                <a href={`#${find.id}`}>{find.title}</a>
              </strong>
              <small>Старт с {formatTimestamp(findStartSeconds(find))}</small>
            </div>
            <div className="player-progress-row">
              <span className="player-time">{formatTimestamp(current)}</span>
              <input
                className="player-progress"
                type="range"
                min={0}
                max={duration || 1}
                step={1}
                value={duration ? Math.min(current, duration) : 0}
                onChange={(event) => seekTo(Number(event.target.value))}
                aria-label="Позиция воспроизведения"
                disabled={!duration}
              />
              <span className="player-time">
                {duration ? formatTimestamp(duration) : '--:--:--'}
              </span>
            </div>
          </div>
          <div className="player-seeks">
            <PlayerButton
              onClick={() => seekBy(-SEEK_STEP_SECONDS)}
              aria-label={`Назад на ${SEEK_STEP_SECONDS} секунд`}
            >
              <Rewind aria-hidden="true" />
            </PlayerButton>
            <PlayerButton
              onClick={() => seekBy(SEEK_STEP_SECONDS)}
              aria-label={`Вперёд на ${SEEK_STEP_SECONDS} секунд`}
            >
              <FastForward aria-hidden="true" />
            </PlayerButton>
            <PlayerButton
              className="player-seek player-rate"
              onClick={() => onRateChange(nextRate)}
              aria-label={`Скорость ×${rate}, переключить на ×${nextRate}`}
            >
              ×{rate}
            </PlayerButton>
            <PlayerButton
              onClick={onNext}
              disabled={!nextFind}
              aria-label={
                nextFind
                  ? `Следующая находка: ${nextFind.title}`
                  : 'Следующей находки нет'
              }
            >
              <SkipForward aria-hidden="true" />
            </PlayerButton>
          </div>
          <button
            className="player-close"
            type="button"
            onClick={onClose}
            aria-label="Закрыть плеер"
          >
            <X aria-hidden="true" />
          </button>
        </>
      )}
    </aside>
  );
}

function PlayerButton(props: ComponentProps<'button'>) {
  return <button className="player-seek" type="button" {...props} />;
}

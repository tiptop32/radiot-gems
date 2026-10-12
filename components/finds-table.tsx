import { Check, ExternalLink, Link2, Play } from 'lucide-react';
import { useState } from 'react';
import { audienceLabel, findYear, sectionLabel } from '@/lib/catalog';
import { type Find, findStartSeconds } from '@/lib/finds';
import { formatTimestamp } from '@/lib/timestamp';

type FindsTableProps = {
  finds: readonly Find[];
  activeId: string | null;
  highlightId: string | null;
  listened: ReadonlySet<string>;
  onPlay: (find: Find) => void;
  onTag: (tag: string) => void;
  onToggleListened: (id: string) => void;
};

export function FindsTable({ finds, ...rowProps }: FindsTableProps) {
  return (
    <div className="table-shell">
      <table>
        <caption className="sr-only">
          Находки из архива подкаста Радио-Т
        </caption>
        <thead>
          <tr>
            <th scope="col">Находка</th>
            <th scope="col">Раздел</th>
            <th scope="col">Для кого</th>
            <th scope="col">Выпуск</th>
            <th scope="col">Слушать</th>
          </tr>
        </thead>
        <tbody>
          {finds.map((item) => (
            <FindRow key={item.id} item={item} {...rowProps} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type FindRowProps = Omit<FindsTableProps, 'finds'> & { item: Find };

function FindRow({
  item,
  activeId,
  highlightId,
  listened,
  onPlay,
  onTag,
  onToggleListened,
}: FindRowProps) {
  const [copied, setCopied] = useState(false);
  const startSeconds = findStartSeconds(item);
  const startLabel = formatTimestamp(startSeconds);
  const isListened = listened.has(item.id);
  const classes = [
    item.id === highlightId && 'is-highlighted',
    item.id === activeId && 'is-active',
    isListened && 'is-listened',
  ].filter(Boolean);

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#${item.id}`;
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <tr id={item.id} className={classes.join(' ') || undefined}>
      <td data-label="Находка">
        <strong>
          {isListened && (
            <span className="listened-mark" title="Прослушано">
              <Check aria-hidden="true" />
              <span className="sr-only">Прослушано: </span>
            </span>
          )}
          {item.title}
        </strong>
        <span>{item.summary}</span>
        <div className="find-meta">
          {item.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-link"
              onClick={() => onTag(tag)}
              aria-label={`Показать находки с тегом ${tag}`}
            >
              #{tag}
            </button>
          ))}
          {item.sourceUrl && (
            <a
              className="source-link"
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              материал <ExternalLink aria-hidden="true" />
            </a>
          )}
        </div>
      </td>
      <td data-label="Раздел">
        <span className="tag">{sectionLabel(item.section)}</span>
      </td>
      <td data-label="Для кого">
        <span className={`audience audience-${item.audience}`}>
          {audienceLabel(item.audience)}
        </span>
      </td>
      <td data-label="Выпуск">
        <a
          href={item.episodeUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Открыть страницу выпуска ${item.episode}`}
        >
          #{item.episode} <ExternalLink aria-hidden="true" />
        </a>
        <small className="episode-year">{findYear(item)}</small>
      </td>
      <td data-label="Слушать">
        <div className="listen">
          <button
            type="button"
            className="play-button"
            onClick={() => onPlay(item)}
            aria-label={`Слушать ${item.title} с ${startLabel}`}
          >
            <Play aria-hidden="true" /> с {startLabel}
          </button>
          <a
            className="direct-link"
            href={`${item.audioUrl}#t=${startSeconds}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Открыть MP3 выпуска ${item.episode} с ${startLabel}`}
          >
            MP3 с этого места
          </a>
          <div className="row-actions">
            <button
              type="button"
              onClick={() => onToggleListened(item.id)}
              aria-pressed={isListened}
            >
              <Check aria-hidden="true" />
              {isListened ? 'Прослушано' : 'Отметить'}
            </button>
            <button type="button" onClick={copyLink}>
              <Link2 aria-hidden="true" />
              {copied ? 'Скопировано' : 'Ссылка'}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

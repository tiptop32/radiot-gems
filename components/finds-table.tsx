import { ExternalLink, Play } from 'lucide-react';
import { LEVEL_SLUGS } from '@/lib/catalog';
import { type Find, findStartSeconds } from '@/lib/finds';
import { formatTimestamp } from '@/lib/timestamp';

type FindsTableProps = {
  finds: readonly Find[];
  onPlay: (find: Find) => void;
};

export function FindsTable({ finds, onPlay }: FindsTableProps) {
  return (
    <div className="table-shell">
      <table>
        <caption className="sr-only">
          Рекомендуемые темы подкаста Радио-Т
        </caption>
        <thead>
          <tr>
            <th scope="col">Находка</th>
            <th scope="col">Категория</th>
            <th scope="col">Уровень</th>
            <th scope="col">Выпуск</th>
            <th scope="col">Слушать</th>
          </tr>
        </thead>
        <tbody>
          {finds.map((item) => (
            <FindRow key={item.id} item={item} onPlay={onPlay} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FindRow({
  item,
  onPlay,
}: {
  item: Find;
  onPlay: (find: Find) => void;
}) {
  const startSeconds = findStartSeconds(item);
  const startLabel = formatTimestamp(startSeconds);
  const levelSlug = LEVEL_SLUGS[item.level as keyof typeof LEVEL_SLUGS];

  return (
    <tr>
      <td data-label="Находка">
        <strong>{item.title}</strong>
        <span>{item.summary}</span>
      </td>
      <td data-label="Категория">
        <span className="tag">{item.category}</span>
      </td>
      <td data-label="Уровень">
        <span className={`level level-${levelSlug}`}>{item.level}</span>
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
        </div>
      </td>
    </tr>
  );
}

// Parser for Radio-T show notes as published in github.com/radio-t/radio-t-site
// (hugo/content/posts/podcast-N.md): TOML front matter plus a list of topics
// formatted as "- [Title](url) - *HH:MM:SS*."

export const SHOWNOTES_RAW_URL =
  'https://raw.githubusercontent.com/radio-t/radio-t-site/master/hugo/content/posts';

// Service segments that are not topics of their own.
const SERVICE_TOPICS =
  /^(вступление|темы (наших )?слушателей|темы с вопросами|вопросы и ответы|благодарности)/i;

const TOPIC_LINE =
  /^\s*[-*]\s+(?:\[(?<linked>[^\]]+)\]\((?<url>[^)\s]+)\)|(?<plain>.+?))\s+-\s+\*(?<time>\d{1,2}:\d{2}:\d{2})\*\.?\s*$/;

/** @param {string} timestamp "H:MM:SS" or "HH:MM:SS" */
export function timestampToSeconds(timestamp) {
  return timestamp
    .split(':')
    .reduce((total, part) => total * 60 + Number(part), 0);
}

/**
 * @param {string} markdown
 * @returns {{ episode: number, date: string, episodeUrl: string, audioUrl: string,
 *   topics: { title: string, sourceUrl: string | null, timestamp: string, timestampSeconds: number }[] }}
 */
export function parseShownotes(markdown) {
  const frontMatter = markdown.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+/)?.[1];
  if (!frontMatter) throw new Error('show notes have no front matter');
  const field = (name) =>
    frontMatter.match(new RegExp(`^${name}\\s*=\\s*"([^"]*)"`, 'm'))?.[1];

  const episode = Number(field('title')?.match(/(\d+)\s*$/)?.[1]);
  const date = field('date')?.slice(0, 10);
  if (!Number.isInteger(episode) || !date)
    throw new Error('show notes miss the episode title or date');
  const [year, month, day] = date.split('-');

  const topics = [];
  for (const line of markdown.split('\n')) {
    const match = line.match(TOPIC_LINE);
    if (!match?.groups) continue;
    const { linked, url, plain, time } = match.groups;
    const title = (linked ?? plain).trim();
    if (SERVICE_TOPICS.test(title)) continue;
    topics.push({
      title,
      sourceUrl: url ?? null,
      timestamp: time.replace(/^0(\d):/, '$1:'),
      timestampSeconds: timestampToSeconds(time),
    });
  }

  return {
    episode,
    date,
    episodeUrl: `https://radio-t.com/p/${year}/${month}/${day}/podcast-${episode}/`,
    audioUrl: `https://cdn.radio-t.com/rt_podcast${episode}.mp3`,
    topics,
  };
}

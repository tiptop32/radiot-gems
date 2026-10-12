import { readFile } from 'node:fs/promises';

// UI source is the page plus the components and hooks it is built from.
const sources = [
  'app/page.tsx',
  'components/catalog-filters.tsx',
  'components/finds-table.tsx',
  'components/player.tsx',
  'components/year-dial.tsx',
  'hooks/use-audio-player.ts',
  'hooks/use-listening.ts',
  'hooks/use-url-state.ts',
  'lib/finds.ts',
];
const page = (
  await Promise.all(
    sources.map((file) =>
      readFile(new URL(`../${file}`, import.meta.url), 'utf8'),
    ),
  )
).join('\n');
// CSS is compared without whitespace so formatting never breaks a check.
const css = (
  await readFile(new URL('../app/globals.css', import.meta.url), 'utf8')
).replace(/\s+/g, '');
const catalog = JSON.parse(
  await readFile(new URL('../data/finds.json', import.meta.url), 'utf8'),
);

const sections = new Set(catalog.map((item) => item.section));

const checks = [
  ['catalog is useful immediately', catalog.length >= 40],
  ['catalog covers more than development', sections.size >= 6],
  [
    'search is keyboard accessible',
    page.includes('metaKey') && page.includes('searchRef.current?.focus()'),
  ],
  [
    'section chips, tags, audience, year and sort filters exist',
    page.includes('aria-pressed={pressed}') &&
      page.includes('label="Для кого"') &&
      page.includes('label="Год"') &&
      page.includes('label="Порядок"') &&
      page.includes('className="tag-link"'),
  ],
  [
    'filters and the linked find live in the URL',
    page.includes('filtersToSearch(next)') &&
      page.includes('window.location.hash') &&
      page.includes('id={item.id}'),
  ],
  [
    'semantic table is present',
    page.includes('<table>') &&
      page.includes('scope="col"') &&
      page.includes('<caption'),
  ],
  [
    'episode, source and timestamp actions are separate',
    page.includes('episodeUrl') &&
      page.includes('sourceUrl') &&
      page.includes('MP3 с этого места'),
  ],
  [
    'player has a progress bar',
    page.includes('player-progress') &&
      page.includes('type="range"') &&
      css.includes('.player-progress') &&
      page.includes('aria-label="Позиция воспроизведения"'),
  ],
  [
    'player has 30-second seek buttons',
    page.includes('SEEK_STEP_SECONDS = 30') &&
      page.includes('seekBy(-SEEK_STEP_SECONDS)') &&
      page.includes('seekBy(SEEK_STEP_SECONDS)') &&
      page.includes('`Назад на ${SEEK_STEP_SECONDS} секунд`') &&
      page.includes('`Вперёд на ${SEEK_STEP_SECONDS} секунд`'),
  ],
  [
    'player has speed, next and random controls',
    page.includes('PLAYBACK_RATES') &&
      page.includes('Следующая находка') &&
      page.includes('Случайная'),
  ],
  [
    'listening progress is remembered',
    page.includes("storedValue<string[]>('listened'") &&
      page.includes("storedValue<Resume | null>('resume'") &&
      page.includes('markListened'),
  ],
  [
    'in-page player applies the three-minute lead',
    page.includes('audio.currentTime = startSeconds') &&
      page.includes('playbackStartSeconds(find.timestampSeconds)') &&
      page.includes('const start = findStartSeconds(item)'),
  ],
  [
    'mobile layout avoids table overflow',
    css.includes('@media(max-width:760px)') &&
      css.includes('table,tbody{display:block;}'),
  ],
  [
    'reduced motion is respected',
    css.includes('prefers-reduced-motion:reduce'),
  ],
];

const failures = checks.filter(([, passed]) => !passed);
console.log(
  `${checks.length - failures.length}/${checks.length} catalog quality checks passed`,
);
for (const [name, passed] of checks)
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (failures.length) process.exitCode = 1;

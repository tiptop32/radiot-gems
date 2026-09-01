import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const catalog = JSON.parse(await readFile(new URL('../data/finds.json', import.meta.url), 'utf8'));

const checks = [
  ['catalog is useful immediately', catalog.length >= 15],
  ['search is keyboard accessible', page.includes('metaKey') && page.includes('searchRef.current?.focus()')],
  ['category and level filters exist', page.includes('Категория') && page.includes('Уровень')],
  ['semantic table is present', page.includes('<table>') && page.includes('scope="col"') && page.includes('<caption')],
  ['episode and timestamp actions are separate', page.includes('episodeUrl') && page.includes('MP3 за 3 минуты до темы')],
  ['in-page player applies the three-minute lead', page.includes('audio.currentTime = startSeconds') && page.includes('playbackStartSeconds(item.timestampSeconds)')],
  ['mobile layout avoids table overflow', css.includes('@media (max-width:760px)') && css.includes('table,tbody { display:block; }')],
  ['reduced motion is respected', css.includes('prefers-reduced-motion:reduce')],
];

const failures = checks.filter(([, passed]) => !passed);
console.log(`${checks.length - failures.length}/${checks.length} catalog quality checks passed`);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (failures.length) process.exitCode = 1;

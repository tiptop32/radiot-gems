import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  ALL_CATEGORIES,
  ANY_LEVEL,
  LEVELS,
  LEVEL_SLUGS,
  categoriesOf,
  filterFinds,
  findsLabel,
} from '../lib/catalog.js';
import {
  formatTimestamp,
  playbackStartSeconds,
  PLAYBACK_LEAD_SECONDS,
} from '../lib/timestamp.js';

const catalog = JSON.parse(
  await readFile(new URL('../data/finds.json', import.meta.url), 'utf8'),
);

const timestampToSeconds = (timestamp) =>
  timestamp.split(':').reduce((total, part) => total * 60 + Number(part), 0);

test('catalog contains the verified starter selection', () => {
  assert.equal(catalog.length, 15);
  assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
});

test('every timestamp matches its deterministic seconds value', () => {
  for (const item of catalog)
    assert.equal(
      timestampToSeconds(item.timestamp),
      item.timestampSeconds,
      item.id,
    );
});

test('playback starts exactly three minutes before the official timestamp', () => {
  assert.equal(PLAYBACK_LEAD_SECONDS, 180);
  for (const item of catalog) {
    const startSeconds = playbackStartSeconds(item.timestampSeconds);
    assert.equal(
      startSeconds,
      Math.max(0, item.timestampSeconds - 180),
      item.id,
    );
    assert.equal(
      timestampToSeconds(formatTimestamp(startSeconds)),
      startSeconds,
      item.id,
    );
  }
});

test('three-minute lead never produces a negative timestamp', () => {
  assert.equal(playbackStartSeconds(90), 0);
  assert.equal(formatTimestamp(playbackStartSeconds(90)), '00:00:00');
});

test('fractional seconds from the audio player are floored, not leaked into the label', () => {
  assert.equal(formatTimestamp(4461.0942400000003545), '01:14:21');
  assert.equal(formatTimestamp(8041.999999), '02:14:01');
  assert.equal(formatTimestamp(0.5), '00:00:00');
});

test('every item links to matching official Radio-T episode and MP3', () => {
  for (const item of catalog) {
    assert.match(
      item.episodeUrl,
      new RegExp(
        `^https://radio-t\\.com/p/\\d{4}/\\d{2}/\\d{2}/podcast-${item.episode}/$`,
      ),
      item.id,
    );
    assert.equal(
      item.audioUrl,
      `https://cdn.radio-t.com/rt_podcast${item.episode}.mp3`,
      item.id,
    );
  }
});

test('catalog metadata is complete and uses supported levels', () => {
  for (const item of catalog) {
    assert.ok(item.title && item.summary && item.category, item.id);
    assert.ok(LEVELS.includes(item.level), item.id);
  }
});

test('every level has an ASCII CSS slug', () => {
  assert.deepEqual(LEVELS, ['Начать', 'Средняя', 'Глубоко']);
  for (const slug of Object.values(LEVEL_SLUGS)) assert.match(slug, /^[a-z]+$/);
});

const noFilters = { query: '', category: ALL_CATEGORIES, level: ANY_LEVEL };

test('filters are no-ops by default', () => {
  assert.deepEqual(filterFinds(catalog, noFilters), catalog);
});

test('search is case-insensitive, trimmed and covers the episode number', () => {
  const ids = (query) =>
    filterFinds(catalog, { ...noFilters, query }).map((item) => item.id);
  assert.deepEqual(ids('  POSTGRES '), [
    '917-postgres-not-mongo',
    '912-postgres-everything',
  ]);
  assert.deepEqual(ids('1028'), ['1028-juniors']);
  assert.deepEqual(ids('нет такой темы'), []);
});

test('category and level filters combine', () => {
  const result = filterFinds(catalog, {
    ...noFilters,
    category: 'Архитектура',
    level: 'Средняя',
  });
  assert.deepEqual(
    result.map((item) => item.id),
    ['605-code-debt', '721-debt-fiction'],
  );
});

test('categories are unique and keep catalog order', () => {
  const categories = categoriesOf(catalog);
  assert.equal(categories[0], catalog[0].category);
  assert.equal(new Set(categories).size, categories.length);
  assert.ok(!categories.includes(ALL_CATEGORIES));
});

test('find counter uses Russian plural forms', () => {
  const cases = {
    0: 'находок',
    1: 'находка',
    2: 'находки',
    4: 'находки',
    5: 'находок',
    11: 'находок',
    15: 'находок',
    21: 'находка',
    22: 'находки',
  };
  for (const [count, label] of Object.entries(cases))
    assert.equal(findsLabel(Number(count)), label, count);
});

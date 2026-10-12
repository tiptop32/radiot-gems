import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  AUDIENCES,
  DEFAULT_FILTERS,
  SECTIONS,
  filterFinds,
  filtersFromSearch,
  filtersToSearch,
  findYear,
  findsLabel,
  hasActiveFilters,
  tagsOf,
  yearsOf,
} from '../lib/catalog.js';
import { timestampToSeconds } from '../lib/shownotes.js';
import {
  formatTimestamp,
  playbackStartSeconds,
  PLAYBACK_LEAD_SECONDS,
} from '../lib/timestamp.js';

const catalog = JSON.parse(
  await readFile(new URL('../data/finds.json', import.meta.url), 'utf8'),
);

const ids = (filters) =>
  filterFinds(catalog, { ...DEFAULT_FILTERS, ...filters }).map(
    (item) => item.id,
  );

test('catalog ids are unique and start with the episode number', () => {
  assert.ok(catalog.length >= 40);
  assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
  for (const item of catalog)
    assert.match(item.id, new RegExp(`^${item.episode}-[a-z0-9-]+$`));
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

test('every item links to matching official Radio-T episode, MP3 and source', () => {
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
    // A few show-note topics have no linked article.
    if (item.sourceUrl !== null)
      assert.match(item.sourceUrl, /^https?:\/\/\S+$/, item.id);
  }
});

test('catalog metadata is complete and uses known sections and audiences', () => {
  const sections = new Set(SECTIONS.map((section) => section.id));
  const audiences = new Set(AUDIENCES.map((audience) => audience.id));
  for (const item of catalog) {
    assert.ok(item.title && item.summary, item.id);
    assert.ok(sections.has(item.section), item.id);
    assert.ok(audiences.has(item.audience), item.id);
    assert.ok(item.tags.length > 0, item.id);
    for (const tag of item.tags)
      assert.equal(tag, tag.trim().toLocaleLowerCase('ru'), item.id);
  }
});

test('every section has finds', () => {
  for (const section of SECTIONS)
    assert.ok(ids({ section: section.id }).length >= 4, section.id);
});

test('filters are no-ops by default', () => {
  assert.deepEqual(
    ids({}),
    catalog.map((item) => item.id),
  );
});

test('search is case-insensitive, trimmed and covers tags and episodes', () => {
  assert.deepEqual(ids({ query: '  POSTGRES ' }), [
    '917-postgres-not-mongo',
    '912-postgres-everything',
  ]);
  assert.deepEqual(ids({ query: '1028' }), [
    '1028-juniors',
    '1028-ai-middle-class',
  ]);
  assert.ok(ids({ query: 'passkeys' }).includes('857-passkeys'));
  assert.deepEqual(ids({ query: 'нет такой темы' }), []);
});

test('section, tag, audience and year filters combine', () => {
  assert.deepEqual(ids({ section: 'dev', tag: 'техдолг' }), [
    '605-code-debt',
    '721-debt-fiction',
  ]);
  assert.deepEqual(ids({ audience: 'ops', section: 'security' }), [
    '880-okta-breach',
  ]);
  for (const id of ids({ year: '2024' }))
    assert.equal(findYear(catalog.find((item) => item.id === id)), 2024);
});

test('sorting by episode keeps every find', () => {
  const episodes = (sort) =>
    ids({ sort }).map((id) => Number(id.split('-')[0]));
  assert.equal(episodes('new').length, catalog.length);
  assert.deepEqual(
    episodes('new'),
    episodes('new').toSorted((a, b) => b - a),
  );
  assert.deepEqual(
    episodes('old'),
    episodes('old').toSorted((a, b) => a - b),
  );
});

test('tags are counted per section, most used first', () => {
  const devTags = tagsOf(catalog, 'dev');
  assert.equal(devTags[0], 'архитектура');
  assert.ok(!devTags.includes('пароли'));
  assert.ok(tagsOf(catalog, '').includes('пароли'));
});

test('years come from the episode URL and are counted', () => {
  const years = yearsOf(catalog);
  const total = years.reduce((sum, [, count]) => sum + count, 0);
  assert.equal(total, catalog.length);
  const order = years.map(([year]) => year);
  assert.deepEqual(
    order,
    order.toSorted((a, b) => a - b),
  );
});

test('filters round-trip through the URL and drop unknown values', () => {
  const filters = {
    ...DEFAULT_FILTERS,
    query: 'open source',
    section: 'industry',
    tag: 'лицензии',
    audience: 'all',
    year: '2024',
    sort: 'new',
  };
  assert.deepEqual(filtersFromSearch(filtersToSearch(filters)), filters);
  assert.equal(filtersToSearch(DEFAULT_FILTERS), '');
  assert.equal(filtersToSearch({ ...DEFAULT_FILTERS, query: '   ' }), '');
  assert.ok(!hasActiveFilters(DEFAULT_FILTERS));
  assert.deepEqual(
    filtersFromSearch('?section=space&for=everyone&year=20x4&sort=random'),
    DEFAULT_FILTERS,
  );
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

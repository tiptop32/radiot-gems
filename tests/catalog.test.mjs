import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { formatTimestamp, playbackStartSeconds, PLAYBACK_LEAD_SECONDS } from '../lib/timestamp.js';

const catalog = JSON.parse(await readFile(new URL('../data/finds.json', import.meta.url), 'utf8'));

const timestampToSeconds = (timestamp) => timestamp.split(':').reduce((total, part) => total * 60 + Number(part), 0);

test('catalog contains the verified starter selection', () => {
  assert.equal(catalog.length, 15);
  assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
});

test('every timestamp matches its deterministic seconds value', () => {
  for (const item of catalog) assert.equal(timestampToSeconds(item.timestamp), item.timestampSeconds, item.id);
});

test('playback starts exactly three minutes before the official timestamp', () => {
  assert.equal(PLAYBACK_LEAD_SECONDS, 180);
  for (const item of catalog) {
    const startSeconds = playbackStartSeconds(item.timestampSeconds);
    assert.equal(startSeconds, Math.max(0, item.timestampSeconds - 180), item.id);
    assert.equal(timestampToSeconds(formatTimestamp(startSeconds)), startSeconds, item.id);
  }
});

test('three-minute lead never produces a negative timestamp', () => {
  assert.equal(playbackStartSeconds(90), 0);
  assert.equal(formatTimestamp(playbackStartSeconds(90)), '00:00:00');
});

test('every item links to matching official Radio-T episode and MP3', () => {
  for (const item of catalog) {
    assert.match(item.episodeUrl, new RegExp(`^https://radio-t\\.com/p/\\d{4}/\\d{2}/\\d{2}/podcast-${item.episode}/$`), item.id);
    assert.equal(item.audioUrl, `https://cdn.radio-t.com/rt_podcast${item.episode}.mp3`, item.id);
  }
});

test('catalog metadata is complete and uses supported levels', () => {
  const supportedLevels = new Set(['Начать', 'Средняя', 'Глубоко']);
  for (const item of catalog) {
    assert.ok(item.title && item.summary && item.category, item.id);
    assert.ok(supportedLevels.has(item.level), item.id);
  }
});

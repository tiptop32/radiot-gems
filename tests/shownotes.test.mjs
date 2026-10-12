import assert from 'node:assert/strict';
import test from 'node:test';
import { parseShownotes, timestampToSeconds } from '../lib/shownotes.js';

// Shape of hugo/content/posts/podcast-N.md in radio-t/radio-t-site.
const SAMPLE = `+++
title = "Радио-Т 731"
date = "2020-12-05T17:39:01"
categories = ["podcast"]
filename = "rt_podcast731"
+++

![](https://radio-t.com/images/radio-t/rt731.jpg)

- Вступление - *00:00:00*.
- [Миф Code Coverage](https://preslav.me/2020/12/03/the-myth-of-code-coverage/) - *00:23:02*.
- Тема без ссылки - *01:05:00*.
- [Темы слушателей](https://radio-t.com/p/2020/12/01/prep-731/) - *02:15:24*.

[аудио](https://cdn.radio-t.com/rt_podcast731.mp3)
`;

test('show notes give episode links and topics with timestamps', () => {
  const notes = parseShownotes(SAMPLE);
  assert.equal(notes.episode, 731);
  assert.equal(notes.date, '2020-12-05');
  assert.equal(
    notes.episodeUrl,
    'https://radio-t.com/p/2020/12/05/podcast-731/',
  );
  assert.equal(notes.audioUrl, 'https://cdn.radio-t.com/rt_podcast731.mp3');
  assert.deepEqual(notes.topics, [
    {
      title: 'Миф Code Coverage',
      sourceUrl: 'https://preslav.me/2020/12/03/the-myth-of-code-coverage/',
      timestamp: '0:23:02',
      timestampSeconds: 1382,
    },
    {
      title: 'Тема без ссылки',
      sourceUrl: null,
      timestamp: '1:05:00',
      timestampSeconds: 3900,
    },
  ]);
});

test('show notes without front matter are rejected', () => {
  assert.throws(() => parseShownotes('- [x](y) - *00:01:00*.'));
});

test('timestamps convert to seconds', () => {
  assert.equal(timestampToSeconds('1:17:21'), 4641);
  assert.equal(timestampToSeconds('00:00:59'), 59);
});

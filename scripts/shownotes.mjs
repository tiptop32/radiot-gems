#!/usr/bin/env node
// Helpers for curating data/finds.json against the official Radio-T show notes.
//
//   node scripts/shownotes.mjs candidates 1020-1028   # draft entries to curate
//   node scripts/shownotes.mjs verify                  # check every find
//
// Show notes are read from GitHub (radio-t/radio-t-site) or, with
// SHOWNOTES_DIR=path/to/hugo/content/posts, from a local checkout.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { SHOWNOTES_RAW_URL, parseShownotes } from '../lib/shownotes.js';

const [command, range] = process.argv.slice(2);

async function loadShownotes(episode) {
  const file = `podcast-${episode}.md`;
  const markdown = process.env.SHOWNOTES_DIR
    ? await readFile(path.join(process.env.SHOWNOTES_DIR, file), 'utf8')
    : await fetch(`${SHOWNOTES_RAW_URL}/${file}`).then((response) => {
        if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
        return response.text();
      });
  return parseShownotes(markdown);
}

async function candidates() {
  const [from, to = from] = (range ?? '').split('-').map(Number);
  if (!Number.isInteger(from) || !Number.isInteger(to) || to < from) {
    console.error('usage: shownotes.mjs candidates FROM[-TO]');
    process.exit(2);
  }
  const drafts = [];
  for (let episode = from; episode <= to; episode += 1) {
    const notes = await loadShownotes(episode).catch((error) => {
      console.error(`skip ${episode}: ${error.message}`);
      return null;
    });
    for (const topic of notes?.topics ?? []) {
      drafts.push({
        id: `${episode}-`,
        episode,
        title: topic.title,
        summary: '',
        section: '',
        tags: [],
        audience: '',
        timestamp: topic.timestamp,
        timestampSeconds: topic.timestampSeconds,
        episodeUrl: notes.episodeUrl,
        audioUrl: notes.audioUrl,
        sourceUrl: topic.sourceUrl,
      });
    }
  }
  console.log(JSON.stringify(drafts, null, 2));
}

async function verify() {
  const finds = JSON.parse(
    await readFile(new URL('../data/finds.json', import.meta.url), 'utf8'),
  );
  const problems = [];
  const cache = new Map();
  for (const find of finds) {
    if (!cache.has(find.episode))
      cache.set(find.episode, await loadShownotes(find.episode));
    const notes = cache.get(find.episode);
    const topic = notes.topics.find(
      (item) => item.timestampSeconds === find.timestampSeconds,
    );
    if (find.episodeUrl !== notes.episodeUrl)
      problems.push(`${find.id}: episodeUrl should be ${notes.episodeUrl}`);
    if (!topic)
      problems.push(`${find.id}: no topic at ${find.timestamp} in the notes`);
    else if (topic.sourceUrl !== find.sourceUrl)
      problems.push(`${find.id}: sourceUrl should be ${topic.sourceUrl}`);
  }
  for (const problem of problems) console.error(problem);
  console.log(
    `${finds.length - problems.length}/${finds.length} finds match the show notes`,
  );
  if (problems.length) process.exitCode = 1;
}

if (command === 'candidates') await candidates();
else if (command === 'verify') await verify();
else {
  console.error('usage: shownotes.mjs candidates FROM[-TO] | verify');
  process.exit(2);
}

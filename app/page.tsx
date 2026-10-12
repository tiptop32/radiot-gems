'use client';

import { ExternalLink, Radio, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CatalogFilters } from '@/components/catalog-filters';
import { FindsTable } from '@/components/finds-table';
import { Player } from '@/components/player';
import { YearDial } from '@/components/year-dial';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { useListening } from '@/hooks/use-listening';
import { useLocationHash, useUrlFilters } from '@/hooks/use-url-state';
import {
  DEFAULT_FILTERS,
  type Filters,
  filterFinds,
  findsLabel,
  tagsOf,
  yearsOf,
} from '@/lib/catalog';
import { type Find, findStartSeconds, finds } from '@/lib/finds';

const YEARS = yearsOf(finds);
const MAX_TAGS = 16;
const HIGHLIGHT_MS = 2400;
// A find counts as heard once playback is this far past its official start,
// and still within the topic.
const LISTENED_AFTER_SECONDS = 5 * 60;
const TOPIC_WINDOW_SECONDS = 30 * 60;
// How far playback moves before the resume point is saved again.
const RESUME_STEP_SECONDS = 5;

const findById = (id: string | undefined) =>
  finds.find((item) => item.id === id) ?? null;

export default function Home() {
  const [filters, setFilters] = useUrlFilters();
  const hashId = useLocationHash();
  const [seenHashId, setSeenHashId] = useState('');
  const [dismissedHashId, setDismissedHashId] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const listening = useListening();
  const player = useAudioPlayer({ rate: listening.rate });
  const { resume, setResume } = listening;
  // The find being played is the one the resume point belongs to.
  const activeFind = findById(resume?.findId);
  const highlightId = findById(hashId) && hashId !== seenHashId ? hashId : null;

  const filteredFinds = useMemo(() => filterFinds(finds, filters), [filters]);
  // A shared #find link can point at a find the current filters hide.
  const linkedFind = findById(hashId);
  const hiddenLinkedFind =
    linkedFind &&
    hashId !== dismissedHashId &&
    !filteredFinds.some((item) => item.id === linkedFind.id)
      ? linkedFind
      : null;
  const tags = useMemo(() => {
    const all = tagsOf(finds, filters.section).slice(0, MAX_TAGS);
    return filters.tag && !all.includes(filters.tag)
      ? [filters.tag, ...all]
      : all;
  }, [filters.section, filters.tag]);
  const activeIndex = activeFind
    ? filteredFinds.findIndex((item) => item.id === activeFind.id)
    : -1;
  const nextFind =
    activeIndex >= 0 ? (filteredFinds[activeIndex + 1] ?? null) : null;

  // After a reload the player comes back paused where it stopped.
  useEffect(() => {
    if (activeFind && resume && !player.hasSource(activeFind.audioUrl))
      player.load(activeFind.audioUrl, resume.seconds, false);
    // Only a new find needs loading; seconds change while it plays.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFind?.id]);

  // A #find link scrolls to its row and highlights it for a moment.
  useEffect(() => {
    if (!highlightId) return;
    // A find hidden by filters has no row: show the notice above them.
    const row = document.getElementById(highlightId);
    if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    else document.getElementById('catalog')?.scrollIntoView();
    const timer = window.setTimeout(
      () => setSeenHashId(highlightId),
      HIGHLIGHT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [highlightId]);

  // Save the resume point while the loaded episode plays or after a seek,
  // and mark the find as heard once the topic has been listened to.
  const currentSeconds = Math.floor(player.position.current);
  const metadataLoaded = player.position.duration > 0;
  useEffect(() => {
    if (!activeFind || !resume || !metadataLoaded) return;
    if (Math.abs(currentSeconds - resume.seconds) >= RESUME_STEP_SECONDS)
      setResume({ findId: activeFind.id, seconds: currentSeconds });
    const intoTopic = currentSeconds - activeFind.timestampSeconds;
    if (
      player.isPlaying &&
      intoTopic >= LISTENED_AFTER_SECONDS &&
      intoTopic <= TOPIC_WINDOW_SECONDS
    )
      listening.markListened(activeFind.id);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSeconds, metadataLoaded, player.isPlaying]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const updateFilters = (patch: Partial<Filters>) =>
    setFilters({ ...filters, ...patch });

  const showCatalog = () =>
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });

  const playFind = (item: Find) => {
    const start = findStartSeconds(item);
    setResume({ findId: item.id, seconds: start });
    player.load(item.audioUrl, start);
  };

  const playRandom = () => {
    const pool = filteredFinds.filter((item) => item.id !== activeFind?.id);
    const item = pool[Math.floor(Math.random() * pool.length)];
    if (!item) return;
    playFind(item);
    window.location.hash = item.id;
  };

  const closePlayer = () => {
    player.stop();
    setResume(null);
  };

  return (
    <main className={activeFind ? 'has-player min-h-screen' : 'min-h-screen'}>
      <header className="site-header">
        <a
          className="brand"
          href="#catalog"
          aria-label="Радио-Т: Находки, перейти к каталогу"
        >
          <span className="brand-mark">
            <Radio aria-hidden="true" />
          </span>
          <span>
            <strong>РАДИО-Т</strong>
            <small>НАХОДКИ</small>
          </span>
        </a>
        <nav aria-label="Внешние ссылки">
          <a
            className="header-link"
            href="https://radio-t.com"
            target="_blank"
            rel="noreferrer"
          >
            О подкасте <ExternalLink aria-hidden="true" />
          </a>
        </nav>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">
          <span /> КАРТОТЕКА ЭФИРА
        </p>
        <h1 id="page-title">
          Темы «Радио-Т»,
          <br />
          <em>которые стоит услышать.</em>
        </h1>
        <p className="lede">
          Отобранные разговоры о разработке, AI, инфраструктуре, безопасности,
          железе и индустрии: без новостного шума, с точным моментом в выпуске.
        </p>
        <label className="search-box">
          <Search aria-hidden="true" />
          <span className="sr-only">Поиск по темам, тегам и выпускам</span>
          <input
            ref={searchRef}
            type="search"
            value={filters.query}
            onChange={(event) => updateFilters({ query: event.target.value })}
            placeholder="PostgreSQL, пароли, open source…"
          />
          <kbd>⌘ K</kbd>
        </label>
        <YearDial
          years={YEARS}
          selected={filters.year}
          onSelect={(year) => {
            updateFilters({ year });
            showCatalog();
          }}
        />
      </section>

      <section className="catalog" id="catalog" aria-labelledby="catalog-title">
        <div className="catalog-heading">
          <div>
            <p className="section-label">АРХИВ С 2006 ГОДА</p>
            <h2 id="catalog-title">Что послушать</h2>
          </div>
          <p aria-live="polite">
            <strong>{filteredFinds.length}</strong>{' '}
            {findsLabel(filteredFinds.length)}
            {listening.listened.size > 0 && (
              <small className="listened-count">
                {' '}
                · прослушано {listening.listened.size}
              </small>
            )}
          </p>
        </div>

        {hiddenLinkedFind && (
          <div className="link-notice">
            <span>Находка «{hiddenLinkedFind.title}» скрыта фильтрами.</span>
            <button
              type="button"
              onClick={() => {
                setFilters(DEFAULT_FILTERS);
                setSeenHashId('');
              }}
            >
              Показать
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setDismissedHashId(hashId)}
            >
              Скрыть
            </button>
          </div>
        )}

        <CatalogFilters
          filters={filters}
          tags={tags}
          years={YEARS}
          onChange={updateFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          onRandom={playRandom}
          canRandom={filteredFinds.length > 1 || !activeFind}
        />

        {filteredFinds.length ? (
          <FindsTable
            finds={filteredFinds}
            activeId={activeFind?.id ?? null}
            highlightId={highlightId}
            listened={listening.listened}
            onPlay={playFind}
            onTag={(tag) => {
              updateFilters({ section: '', tag });
              showCatalog();
            }}
            onToggleListened={listening.toggleListened}
          />
        ) : (
          <div className="empty-state">
            <Radio aria-hidden="true" />
            <h3>В эфире тишина</h3>
            <p>По этим фильтрам ничего не найдено.</p>
            <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Сбросить фильтры
            </button>
          </div>
        )}
        <p className="source-note">
          Темы, страницы выпусков и таймкоды сверены с официальными шоунотами
          «Радио-Т». Отметки о прослушивании хранятся только в этом браузере.{' '}
          <a
            href="https://github.com/tiptop32/radiot-gems/issues/new?template=find.yml"
            target="_blank"
            rel="noreferrer"
          >
            Предложить находку
          </a>
        </p>
      </section>

      <Player
        find={activeFind}
        nextFind={nextFind}
        player={player}
        onRateChange={listening.setRate}
        onNext={() => nextFind && playFind(nextFind)}
        onClose={closePlayer}
      />
    </main>
  );
}

'use client';

import { ExternalLink, Radio, RotateCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FindsTable } from '@/components/finds-table';
import { Player } from '@/components/player';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import {
  ALL_CATEGORIES,
  ANY_LEVEL,
  LEVELS,
  categoriesOf,
  filterFinds,
  findsLabel,
} from '@/lib/catalog';
import { type Find, findStartSeconds, finds } from '@/lib/finds';

const CATEGORY_OPTIONS = [ALL_CATEGORIES, ...categoriesOf(finds)];
const LEVEL_OPTIONS = [ANY_LEVEL, ...LEVELS];

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [level, setLevel] = useState(ANY_LEVEL);
  const [activeFind, setActiveFind] = useState<Find | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const player = useAudioPlayer();

  const filteredFinds = useMemo(
    () => filterFinds(finds, { query, category, level }),
    [category, level, query],
  );
  const hasFilters = Boolean(
    query || category !== ALL_CATEGORIES || level !== ANY_LEVEL,
  );

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

  const playFind = (item: Find) => {
    setActiveFind(item);
    player.playFrom(item.audioUrl, findStartSeconds(item));
  };

  const closePlayer = () => {
    player.stop();
    setActiveFind(null);
  };

  const clearFilters = () => {
    setQuery('');
    setCategory(ALL_CATEGORIES);
    setLevel(ANY_LEVEL);
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
          Отобранные разговоры о разработке: без новостного шума, с уровнем
          сложности и точным моментом в выпуске.
        </p>
        <label className="search-box">
          <Search aria-hidden="true" />
          <span className="sr-only">Поиск по темам и выпускам</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="API, PostgreSQL, код-ревью…"
          />
          <kbd>⌘ K</kbd>
        </label>
        <div className="dial" aria-hidden="true">
          <span>2006</span>
          <i />
          <b />
          <i />
          <i />
          <i />
          <i />
          <strong>2026</strong>
        </div>
      </section>

      <section className="catalog" id="catalog" aria-labelledby="catalog-title">
        <div className="catalog-heading">
          <div>
            <p className="section-label">ПЕРВАЯ ВЫБОРКА</p>
            <h2 id="catalog-title">Что послушать начинающему</h2>
          </div>
          <p aria-live="polite">
            <strong>{filteredFinds.length}</strong>{' '}
            {findsLabel(filteredFinds.length)}
          </p>
        </div>

        <div className="filters" aria-label="Фильтры каталога">
          <FilterSelect
            label="Категория"
            value={category}
            options={CATEGORY_OPTIONS}
            onChange={setCategory}
          />
          <FilterSelect
            label="Уровень"
            value={level}
            options={LEVEL_OPTIONS}
            onChange={setLevel}
          />
          {hasFilters && (
            <button
              className="reset-button"
              type="button"
              onClick={clearFilters}
            >
              <RotateCcw aria-hidden="true" /> Сбросить
            </button>
          )}
        </div>

        {filteredFinds.length ? (
          <FindsTable finds={filteredFinds} onPlay={playFind} />
        ) : (
          <div className="empty-state">
            <Radio aria-hidden="true" />
            <h3>В эфире тишина</h3>
            <p>По этим фильтрам ничего не найдено.</p>
            <button type="button" onClick={clearFilters}>
              Сбросить фильтры
            </button>
          </div>
        )}
        <p className="source-note">
          Темы, страницы выпусков и таймкоды сверены с официальными шоунотами и
          API «Радио-Т».
        </p>
      </section>

      <Player find={activeFind} player={player} onClose={closePlayer} />
    </main>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
};

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

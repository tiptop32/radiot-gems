'use client';

import { ExternalLink, Pause, Play, Radio, RotateCcw, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import finds from '@/data/finds.json';
import { formatTimestamp, playbackStartSeconds } from '@/lib/timestamp';

type Find = (typeof finds)[number];

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Все');
  const [level, setLevel] = useState('Любой');
  const [activeFind, setActiveFind] = useState<Find | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const categories = useMemo(() => ['Все', ...Array.from(new Set(finds.map((item) => item.category)))], []);
  const filteredFinds = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ru');
    return finds.filter((item) => {
      const matchesText = !normalized || `${item.title} ${item.summary} ${item.category} ${item.episode}`.toLocaleLowerCase('ru').includes(normalized);
      return matchesText && (category === 'Все' || item.category === category) && (level === 'Любой' || item.level === level);
    });
  }, [category, level, query]);

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

  const playFromTimestamp = (item: Find) => {
    const audio = audioRef.current;
    const startSeconds = playbackStartSeconds(item.timestampSeconds);
    setActiveFind(item);
    if (!audio) return;
    const sourceChanged = audio.dataset.findId !== item.id;
    if (sourceChanged) {
      audio.dataset.findId = item.id;
      audio.src = item.audioUrl;
      audio.addEventListener('loadedmetadata', () => {
        audio.currentTime = startSeconds;
        void audio.play().catch(() => setIsPlaying(false));
      }, { once: true });
      audio.load();
    } else {
      audio.currentTime = startSeconds;
      void audio.play().catch(() => setIsPlaying(false));
    }
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio || !activeFind) return;
    if (audio.paused) void audio.play(); else audio.pause();
  };

  const clearFilters = () => { setQuery(''); setCategory('Все'); setLevel('Любой'); };
  const hasFilters = Boolean(query || category !== 'Все' || level !== 'Любой');

  return (
    <main className={activeFind ? 'has-player min-h-screen' : 'min-h-screen'}>
      <header className="site-header">
        <a className="brand" href="#catalog" aria-label="Радио-Т: Находки, перейти к каталогу">
          <span className="brand-mark"><Radio aria-hidden="true" /></span>
          <span><strong>РАДИО-Т</strong><small>НАХОДКИ</small></span>
        </a>
        <nav aria-label="Внешние ссылки">
          <a className="header-link" href="https://radio-t.com" target="_blank" rel="noreferrer">О подкасте <ExternalLink aria-hidden="true" /></a>
        </nav>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow"><span /> КАРТОТЕКА ЭФИРА</p>
        <h1 id="page-title">Темы «Радио-Т»,<br /><em>которые стоит услышать.</em></h1>
        <p className="lede">Отобранные разговоры о разработке: без новостного шума, с уровнем сложности и точным моментом в выпуске.</p>
        <label className="search-box">
          <Search aria-hidden="true" /><span className="sr-only">Поиск по темам и выпускам</span>
          <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="API, PostgreSQL, код-ревью…" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="dial" aria-hidden="true"><span>2006</span><i /><b /><i /><i /><i /><i /><strong>2026</strong></div>
      </section>

      <section className="catalog" id="catalog" aria-labelledby="catalog-title">
        <div className="catalog-heading">
          <div><p className="section-label">ПЕРВАЯ ВЫБОРКА</p><h2 id="catalog-title">Что послушать начинающему</h2></div>
          <p aria-live="polite"><strong>{filteredFinds.length}</strong> {filteredFinds.length === 1 ? 'находка' : 'находок'}</p>
        </div>

        <div className="filters" aria-label="Фильтры каталога">
          <label><span>Категория</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Уровень</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option>Любой</option><option>Начать</option><option>Средняя</option><option>Глубоко</option></select></label>
          {hasFilters && <button className="reset-button" type="button" onClick={clearFilters}><RotateCcw aria-hidden="true" /> Сбросить</button>}
        </div>

        {filteredFinds.length ? (
          <div className="table-shell">
            <table>
              <caption className="sr-only">Рекомендуемые темы подкаста Радио-Т</caption>
              <thead><tr><th scope="col">Находка</th><th scope="col">Категория</th><th scope="col">Уровень</th><th scope="col">Выпуск</th><th scope="col">Слушать</th></tr></thead>
              <tbody>{filteredFinds.map((item) => (
                <tr key={item.id}>
                  <td data-label="Находка"><strong>{item.title}</strong><span>{item.summary}</span></td>
                  <td data-label="Категория"><span className="tag">{item.category}</span></td>
                  <td data-label="Уровень"><span className={`level level-${item.level.toLocaleLowerCase('ru')}`}>{item.level}</span></td>
                  <td data-label="Выпуск"><a href={item.episodeUrl} target="_blank" rel="noreferrer" aria-label={`Открыть страницу выпуска ${item.episode}`}>#{item.episode} <ExternalLink aria-hidden="true" /></a></td>
                  <td data-label="Слушать">
                    <button type="button" className="play-button" onClick={() => playFromTimestamp(item)} aria-label={`Слушать ${item.title} за три минуты до официального таймкода ${item.timestamp}`}><Play aria-hidden="true" /> с {formatTimestamp(playbackStartSeconds(item.timestampSeconds))}</button>
                    <span className="official-time">Тема с {item.timestamp}</span>
                    <a className="direct-link" href={`${item.audioUrl}#t=${playbackStartSeconds(item.timestampSeconds)}`} target="_blank" rel="noreferrer" aria-label={`Открыть MP3 выпуска ${item.episode} за три минуты до темы с таймкодом ${item.timestamp}`}>MP3 за 3 минуты до темы</a>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><Radio aria-hidden="true" /><h3>В эфире тишина</h3><p>По этим фильтрам ничего не найдено.</p><button type="button" onClick={clearFilters}>Сбросить фильтры</button></div>
        )}
        <p className="source-note">Темы, страницы выпусков и таймкоды сверены с официальными шоунотами и API «Радио-Т».</p>
      </section>

      <aside className={activeFind ? 'player player-visible' : 'player'} aria-label="Плеер выбранной находки" aria-live="polite">
        {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- Radio-T does not publish caption tracks for these podcast MP3s. */}
        <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} preload="metadata" />
        {activeFind && <>
          <button className="player-toggle" type="button" onClick={togglePlayback} aria-label={isPlaying ? 'Поставить на паузу' : 'Продолжить воспроизведение'}>{isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</button>
          <div className="player-copy"><span>СЕЙЧАС В ЭФИРЕ · #{activeFind.episode}</span><strong>{activeFind.title}</strong><small>Старт с {formatTimestamp(playbackStartSeconds(activeFind.timestampSeconds))} · тема с {activeFind.timestamp}</small></div>
          <button className="player-close" type="button" onClick={() => { audioRef.current?.pause(); setActiveFind(null); }} aria-label="Закрыть плеер"><X aria-hidden="true" /></button>
        </>}
      </aside>
    </main>
  );
}

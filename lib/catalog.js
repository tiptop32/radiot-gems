/**
 * @typedef {{ id: string, label: string }} Option
 * @typedef {{ title: string, summary: string, section: string, tags: string[],
 *   audience: string, episode: number, episodeUrl: string }} CatalogFind
 * @typedef {{ query: string, section: string, tag: string, audience: string,
 *   year: string, sort: string }} Filters
 */

/** @type {Option[]} */
export const SECTIONS = [
  { id: 'dev', label: 'Разработка' },
  { id: 'ai', label: 'AI' },
  { id: 'infra', label: 'Инфраструктура' },
  { id: 'security', label: 'Безопасность' },
  { id: 'hardware', label: 'Железо' },
  { id: 'industry', label: 'Индустрия' },
  { id: 'career', label: 'Карьера и команда' },
];

/** @type {Option[]} */
export const AUDIENCES = [
  { id: 'all', label: 'Для всех' },
  { id: 'dev', label: 'Для разработчиков' },
  { id: 'ops', label: 'Для инфраструктуры' },
];

/** @type {Option[]} */
export const SORTS = [
  { id: 'curated', label: 'Как в подборке' },
  { id: 'new', label: 'Сначала новые' },
  { id: 'old', label: 'Сначала старые' },
];

/** @type {Filters} */
export const DEFAULT_FILTERS = {
  query: '',
  section: '',
  tag: '',
  audience: '',
  year: '',
  sort: 'curated',
};

/** @param {Option[]} options @param {string} id */
const labelOf = (options, id) =>
  options.find((option) => option.id === id)?.label ?? id;

/** @param {string} id */
export const sectionLabel = (id) => labelOf(SECTIONS, id);
/** @param {string} id */
export const audienceLabel = (id) => labelOf(AUDIENCES, id);

/** @param {{ episodeUrl: string }} find */
export function findYear(find) {
  return Number(find.episodeUrl.match(/\/p\/(\d{4})\//)?.[1]);
}

/**
 * @template {CatalogFind} T
 * @param {readonly T[]} finds
 * @param {Filters} filters
 * @returns {T[]}
 */
export function filterFinds(finds, filters) {
  const { query, section, tag, audience, year, sort } = filters;
  const needle = query.trim().toLocaleLowerCase('ru');
  const result = finds.filter((item) => {
    if (section && item.section !== section) return false;
    if (tag && !item.tags.includes(tag)) return false;
    if (audience && item.audience !== audience) return false;
    if (year && findYear(item) !== Number(year)) return false;
    if (!needle) return true;
    const haystack = [
      item.title,
      item.summary,
      sectionLabel(item.section),
      ...item.tags,
      item.episode,
    ].join(' ');
    return haystack.toLocaleLowerCase('ru').includes(needle);
  });
  if (sort === 'new') result.sort((a, b) => b.episode - a.episode);
  if (sort === 'old') result.sort((a, b) => a.episode - b.episode);
  return result;
}

/**
 * Tags of a section (or of the whole catalog), most used first.
 * @param {readonly CatalogFind[]} finds
 * @param {string} section
 */
export function tagsOf(finds, section) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const item of finds) {
    if (section && item.section !== section) continue;
    for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts]
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b, 'ru'))
    .map(([tag]) => tag);
}

/**
 * Number of finds per year, ascending by year.
 * @param {readonly { episodeUrl: string }[]} finds
 * @returns {[number, number][]}
 */
export function yearsOf(finds) {
  /** @type {Map<number, number>} */
  const counts = new Map();
  for (const item of finds) {
    const year = findYear(item);
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }
  return [...counts].sort(([a], [b]) => a - b);
}

const URL_KEYS = /** @type {const} */ ({
  query: 'q',
  section: 'section',
  tag: 'tag',
  audience: 'for',
  year: 'year',
  sort: 'sort',
});

/**
 * Reads filters from a query string, dropping unknown values.
 * @param {string} search
 * @returns {Filters}
 */
export function filtersFromSearch(search) {
  const params = new URLSearchParams(search);
  /** @param {keyof Filters} key */
  const read = (key) => params.get(URL_KEYS[key]) ?? '';
  /** @param {Option[]} options @param {string} value */
  const known = (options, value) =>
    options.some((option) => option.id === value) ? value : '';
  const year = read('year');
  return {
    query: read('query'),
    section: known(SECTIONS, read('section')),
    tag: read('tag'),
    audience: known(AUDIENCES, read('audience')),
    year: /^\d{4}$/.test(year) ? year : '',
    sort: known(SORTS, read('sort')) || DEFAULT_FILTERS.sort,
  };
}

/**
 * Query string for filters; default values are left out.
 * @param {Filters} filters
 */
export function filtersToSearch(filters) {
  const params = new URLSearchParams();
  for (const key of /** @type {(keyof Filters)[]} */ (Object.keys(URL_KEYS))) {
    const value = filters[key];
    // The query keeps its spaces while typing; blank means no query.
    if (!value.trim() || value === DEFAULT_FILTERS[key]) continue;
    params.set(URL_KEYS[key], value);
  }
  const search = params.toString();
  return search ? `?${search}` : '';
}

/** @param {Filters} filters */
export function hasActiveFilters(filters) {
  return filtersToSearch(filters) !== '';
}

const pluralRules = new Intl.PluralRules('ru');
const FIND_FORMS = {
  one: 'находка',
  few: 'находки',
  many: 'находок',
  other: 'находки',
};

/** @param {number} count */
export function findsLabel(count) {
  return FIND_FORMS[
    /** @type {keyof typeof FIND_FORMS} */ (pluralRules.select(count))
  ];
}

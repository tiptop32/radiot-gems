export const ALL_CATEGORIES = 'Все';
export const ANY_LEVEL = 'Любой';

// Level label → stable ASCII slug for CSS classes.
export const LEVEL_SLUGS = {
  Начать: 'start',
  Средняя: 'medium',
  Глубоко: 'deep',
};
export const LEVELS = Object.keys(LEVEL_SLUGS);

/**
 * @template {{ category: string }} T
 * @param {readonly T[]} finds
 * @returns {string[]} unique categories in catalog order
 */
export function categoriesOf(finds) {
  return [...new Set(finds.map((item) => item.category))];
}

/**
 * @template {{ title: string, summary: string, category: string, level: string, episode: number }} T
 * @param {readonly T[]} finds
 * @param {{ query: string, category: string, level: string }} filters
 * @returns {T[]}
 */
export function filterFinds(finds, { query, category, level }) {
  const needle = query.trim().toLocaleLowerCase('ru');
  return finds.filter((item) => {
    if (category !== ALL_CATEGORIES && item.category !== category) return false;
    if (level !== ANY_LEVEL && item.level !== level) return false;
    if (!needle) return true;
    const haystack = `${item.title} ${item.summary} ${item.category} ${item.episode}`;
    return haystack.toLocaleLowerCase('ru').includes(needle);
  });
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

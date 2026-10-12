import { RotateCcw, Shuffle } from 'lucide-react';
import {
  AUDIENCES,
  SECTIONS,
  SORTS,
  type Filters,
  hasActiveFilters,
} from '@/lib/catalog';

type Option = { id: string; label: string };

type CatalogFiltersProps = {
  filters: Filters;
  tags: readonly string[];
  years: readonly (readonly [number, number])[];
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  onRandom: () => void;
  canRandom: boolean;
};

export function CatalogFilters({
  filters,
  tags,
  years,
  onChange,
  onReset,
  onRandom,
  canRandom,
}: CatalogFiltersProps) {
  const yearOptions = years.map(([year, count]) => ({
    id: String(year),
    label: `${year} (${count})`,
  }));

  return (
    <div className="filters-panel">
      <fieldset className="chips">
        <legend className="sr-only">Раздел</legend>
        <Chip
          pressed={!filters.section}
          onClick={() => onChange({ section: '', tag: '' })}
        >
          Все разделы
        </Chip>
        {SECTIONS.map((section) => (
          <Chip
            key={section.id}
            pressed={filters.section === section.id}
            onClick={() => onChange({ section: section.id, tag: '' })}
          >
            {section.label}
          </Chip>
        ))}
      </fieldset>

      {tags.length > 0 && (
        <fieldset className="chips chips-tags">
          <legend className="sr-only">Тег</legend>
          {tags.map((tag) => (
            <Chip
              key={tag}
              small
              pressed={filters.tag === tag}
              onClick={() => onChange({ tag: filters.tag === tag ? '' : tag })}
            >
              #{tag}
            </Chip>
          ))}
        </fieldset>
      )}

      <div className="filters">
        <FilterSelect
          label="Для кого"
          value={filters.audience}
          emptyLabel="Все"
          options={AUDIENCES}
          onChange={(audience) => onChange({ audience })}
        />
        <FilterSelect
          label="Год"
          value={filters.year}
          emptyLabel="Любой"
          options={yearOptions}
          onChange={(year) => onChange({ year })}
        />
        <FilterSelect
          label="Порядок"
          value={filters.sort}
          options={SORTS}
          onChange={(sort) => onChange({ sort })}
        />
        <div className="filter-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={onRandom}
            disabled={!canRandom}
          >
            <Shuffle aria-hidden="true" /> Случайная
          </button>
          {hasActiveFilters(filters) && (
            <button className="ghost-button" type="button" onClick={onReset}>
              <RotateCcw aria-hidden="true" /> Сбросить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type ChipProps = {
  pressed: boolean;
  small?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function Chip({ pressed, small, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      className={small ? 'chip chip-small' : 'chip'}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  options: readonly Option[];
  emptyLabel?: string;
  onChange: (value: string) => void;
};

function FilterSelect({
  label,
  value,
  options,
  emptyLabel,
  onChange,
}: FilterSelectProps) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {emptyLabel && <option value="">{emptyLabel}</option>}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

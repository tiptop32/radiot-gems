import { findsLabel } from '@/lib/catalog';

const FIRST_YEAR = 2006;

type YearDialProps = {
  years: readonly (readonly [number, number])[];
  selected: string;
  onSelect: (year: string) => void;
};

// The archive as a radio dial: one tick per year since the first episode;
// years with finds are buttons that filter the catalog.
export function YearDial({ years, selected, onSelect }: YearDialProps) {
  const counts = new Map(years);
  const lastYear = Math.max(FIRST_YEAR, ...counts.keys());
  const ticks = Array.from(
    { length: lastYear - FIRST_YEAR + 1 },
    (_, index) => FIRST_YEAR + index,
  );

  return (
    <fieldset className="dial">
      <legend className="sr-only">Находки по годам</legend>
      <span aria-hidden="true">{FIRST_YEAR}</span>
      <div className="dial-scale">
        {ticks.map((year) => {
          const count = counts.get(year);
          if (!count) return <i key={year} aria-hidden="true" />;
          const isSelected = selected === String(year);
          return (
            <button
              key={year}
              type="button"
              className="dial-tick"
              aria-pressed={isSelected}
              title={`${year}: ${count} ${findsLabel(count)}`}
              aria-label={`${year} год, ${count} ${findsLabel(count)}`}
              onClick={() => onSelect(isSelected ? '' : String(year))}
            />
          );
        })}
      </div>
      <strong aria-hidden="true">{lastYear}</strong>
    </fieldset>
  );
}

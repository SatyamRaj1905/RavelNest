type ViewFiltersProps<T extends string> = {
  label: string;
  options: readonly { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
};

export function ViewFilters<T extends string>({
  label,
  options,
  value,
  onChange,
}: ViewFiltersProps<T>) {
  return (
    <div className="view-filters" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          className={
            value === option.value ? 'view-filter is-active' : 'view-filter'
          }
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && <span>{option.count}</span>}
        </button>
      ))}
    </div>
  );
}

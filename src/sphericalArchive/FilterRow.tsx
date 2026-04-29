import type { SphericalArchiveFilter } from "./types.js";

type FilterRowProps<TItem> = {
  filter: SphericalArchiveFilter<TItem>;
  value: string;
  onChange: (value: string) => void;
};

export const FilterRow = <TItem,>({
  filter,
  value,
  onChange,
}: FilterRowProps<TItem>) => {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-400">
        {filter.label}
      </p>
      <div className="flex max-w-[calc(100vw-4rem)] flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange("all")}
          className={`pointer-events-auto rounded-md border px-3 py-1.5 text-sm transition-colors ${
            value === "all"
              ? "border-gray-950 bg-gray-950 text-white"
              : "border-gray-200 bg-white/86 text-gray-500 hover:border-gray-400 hover:text-gray-950"
          }`}
        >
          {filter.allLabel ?? "All"}
        </button>
        {filter.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`pointer-events-auto rounded-md border px-3 py-1.5 text-sm transition-colors ${
              value === option
                ? "border-gray-950 bg-gray-950 text-white"
                : "border-gray-200 bg-white/86 text-gray-500 hover:border-gray-400 hover:text-gray-950"
            }`}
          >
            {filter.getOptionLabel?.(option) ?? option}
          </button>
        ))}
      </div>
    </div>
  );
};

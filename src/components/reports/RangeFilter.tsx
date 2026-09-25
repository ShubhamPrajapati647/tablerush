import { RANGE_OPTIONS, type RangeKey } from "@/lib/reports";

export function RangeFilter({
  value,
  onChange,
  from,
  to,
  onFrom,
  onTo,
}: {
  value: RangeKey;
  onChange: (key: RangeKey) => void;
  from: string;
  to: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              value === option.key
                ? "border-primary bg-primary/20 text-ink"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {value === "custom" ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">From</span>
            <input
              type="date"
              value={from}
              onChange={(event) => onFrom(event.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">To</span>
            <input
              type="date"
              value={to}
              onChange={(event) => onTo(event.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}

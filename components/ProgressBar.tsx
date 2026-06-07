interface Props {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{label ?? "進捗"}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg,#0ea5e9 0%,#8b5cf6 50%,#f59e0b 100%)",
          }}
        />
      </div>
    </div>
  );
}

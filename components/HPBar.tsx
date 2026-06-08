interface Props {
  hp: number;
  max?: number;
}

function hpColor(hp: number) {
  if (hp >= 70) return "#22c55e";
  if (hp >= 40) return "#eab308";
  return "#ef4444";
}

export function HPBar({ hp, max = 100 }: Props) {
  const safe = Math.max(0, Math.min(max, hp));
  const pct = (safe / max) * 100;
  const color = hpColor(safe);
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-surface-2 ring-1 ring-border">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="min-w-[2.5rem] text-right text-xs font-bold tabular-nums"
        style={{ color }}
      >
        {Math.round(safe)}
      </span>
    </div>
  );
}

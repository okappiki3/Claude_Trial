import type { Expert } from "@/lib/types";

interface Props {
  expert: Expert;
  active: boolean;
}

export function ExpertCard({ expert, active }: Props) {
  return (
    <div
      className={`flex-1 min-w-0 rounded-2xl border bg-surface p-4 transition-all ${
        active
          ? "shadow-lg scale-[1.02] border-transparent"
          : "border-border shadow-sm"
      }`}
      style={active ? { borderColor: expert.color, boxShadow: `0 8px 24px -8px ${expert.color}66` } : undefined}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
          style={{ background: `${expert.color}1a` }}
        >
          {expert.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-bold">{expert.name}</p>
            {active && (
              <span
                className="pulse-dot inline-block h-2 w-2 rounded-full"
                style={{ color: expert.color, background: expert.color }}
                aria-label="発言中"
              />
            )}
          </div>
          <p className="truncate text-xs text-text-muted">{expert.role}</p>
        </div>
      </div>
    </div>
  );
}

import type { Expert, ExpertTitle } from "@/lib/types";
import { HPBar } from "./HPBar";

interface Props {
  expert: Expert;
  active: boolean;
  hp: number;
  title?: ExpertTitle | null;
  defeated?: boolean;
}

function titleBadge(title: ExpertTitle) {
  if (title === "MVP") return { label: "🏆 MVP", bg: "#f59e0b", fg: "#fff" };
  if (title === "Survivor")
    return { label: "Survivor", bg: "#22c55e", fg: "#fff" };
  return { label: "💀 Defeated", bg: "#6b7280", fg: "#fff" };
}

export function ExpertCard({ expert, active, hp, title, defeated }: Props) {
  const badge = title ? titleBadge(title) : null;
  return (
    <div
      className={`relative rounded-2xl border bg-surface p-4 transition-all ${
        active ? "scale-[1.02] shadow-lg" : "shadow-sm"
      } ${defeated ? "opacity-60" : ""}`}
      style={
        active
          ? {
              borderColor: expert.color,
              boxShadow: `0 8px 24px -8px ${expert.color}66`,
            }
          : { borderColor: "var(--border)" }
      }
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ background: `${expert.color}1a` }}
        >
          {expert.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`truncate font-bold ${defeated ? "line-through" : ""}`}
            >
              {expert.name}
            </p>
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
        {badge && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
            style={{ background: badge.bg, color: badge.fg }}
          >
            {badge.label}
          </span>
        )}
      </div>
      <div className="mt-3">
        <HPBar hp={hp} />
      </div>
    </div>
  );
}

export function DevilCard({ active }: { active: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-red-950 to-red-700 p-4 text-white shadow-md transition-all ${
        active ? "scale-[1.02] ring-2 ring-red-400" : ""
      }`}
      style={{ borderColor: "#7f1d1d" }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/40 text-2xl">
          💀
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-bold">黒崎 論破郎</p>
            {active && (
              <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-red-300 text-red-300" />
            )}
          </div>
          <p className="truncate text-xs text-red-200/80">悪魔の代弁者</p>
        </div>
        <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold tracking-wider text-red-100">
          BOSS
        </span>
      </div>
      <p className="mt-3 text-[11px] text-red-100/80">∞ Immortal</p>
    </div>
  );
}

import { expertById } from "@/lib/experts";
import type { JudgeScore } from "@/lib/types";

interface Props {
  scores: JudgeScore;
}

function StatBar({
  label,
  value,
  max = 10,
  color,
}: {
  label: string;
  value: number;
  max?: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[11px] text-text-muted">
        <span>{label}</span>
        <span className="font-bold tabular-nums" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function ScoreBoard({ scores }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">🏆</span>
        <h3 className="font-bold">Judge スコア (Phase 1+2)</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {scores.scores.map((s) => {
          const expert = expertById(s.expertId);
          return (
            <div
              key={s.expertId}
              className="rounded-xl border border-border bg-surface-2 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{expert.emoji}</span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: expert.color }}
                  >
                    {expert.name}
                  </span>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ background: expert.color }}
                >
                  {s.total}pt
                </span>
              </div>
              <div className="space-y-1.5">
                <StatBar
                  label="具体性"
                  value={s.specificity}
                  color={expert.color}
                />
                <StatBar label="根拠" value={s.evidence} color={expert.color} />
                <StatBar
                  label="独自性"
                  value={s.originality}
                  color={expert.color}
                />
                <StatBar
                  label="反論力"
                  value={s.rebuttal_power}
                  color={expert.color}
                />
              </div>
              {s.agreement_penalty < 0 && (
                <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">
                  同調ペナルティ {s.agreement_penalty}
                </p>
              )}
              <p className="mt-2 text-[11px] leading-snug text-text-muted">
                {s.comment}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

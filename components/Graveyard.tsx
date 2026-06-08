import type { GraveyardEntry } from "@/lib/types";

interface Props {
  entries: GraveyardEntry[];
}

export function Graveyard({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-center text-sm text-text-muted">
        墓場には誰もいない。全員が悪魔の攻撃を生き残った。
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-purple-900/40 bg-gradient-to-br from-[#1e1b2e] to-[#2a1830] p-6 text-purple-50 shadow-xl">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xl">🪦</span>
        <h3 className="text-lg font-bold">議論の墓場</h3>
        <span className="ml-auto text-xs text-purple-300/70">
          {entries.length} 件の主張が眠る
        </span>
      </div>
      <ul className="space-y-3">
        {entries.map((e, i) => (
          <li
            key={i}
            className="rounded-xl bg-black/30 p-4 ring-1 ring-purple-900/50"
          >
            <p className="mb-2 text-sm font-bold text-purple-100">
              💀 「{e.argument}」
            </p>
            <div className="grid gap-1 text-xs text-purple-200/80">
              <p>
                <span className="font-bold text-purple-300">論破した者:</span>{" "}
                {e.killed_by}
              </p>
              <p>
                <span className="font-bold text-purple-300">死因:</span>{" "}
                {e.cause_of_death}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import { expertById } from "@/lib/experts";
import type { FinalScores } from "@/lib/types";
import { HPBar } from "./HPBar";

interface Props {
  data: FinalScores;
}

function titleStyle(title: string) {
  if (title === "MVP") return { bg: "#f59e0b", fg: "#fff", label: "🏆 MVP" };
  if (title === "Survivor")
    return { bg: "#22c55e", fg: "#fff", label: "Survivor" };
  return { bg: "#6b7280", fg: "#fff", label: "💀 Defeated" };
}

function rankSuffix(r: number) {
  return r === 1 ? "st" : r === 2 ? "nd" : r === 3 ? "rd" : "th";
}

export function FinalScoreBoard({ data }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = [...data.final_scores].sort((a, b) => a.rank - b.rank);
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xl">🏆</span>
        <h3 className="text-lg font-bold">Final Standings</h3>
      </div>
      <ul className="space-y-3">
        {sorted.map((e) => {
          const expert = expertById(e.expertId);
          const style = titleStyle(e.title);
          const isExp = expanded === e.expertId;
          return (
            <li
              key={e.expertId}
              className={`rounded-xl border p-4 transition-colors ${
                e.title === "Defeated"
                  ? "border-gray-300 bg-gray-50 opacity-75"
                  : "border-border bg-surface-2"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-text/5 text-sm font-bold tabular-nums">
                  {e.rank}
                  <span className="text-[10px] text-text-muted">
                    {rankSuffix(e.rank)}
                  </span>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                  style={{ background: `${expert.color}1a` }}
                >
                  {expert.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-bold ${e.title === "Defeated" ? "line-through" : ""}`}
                    style={{ color: expert.color }}
                  >
                    {expert.name}
                  </p>
                  <p className="text-xs text-text-muted">{expert.role}</p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: style.bg, color: style.fg }}
                >
                  {style.label}
                </span>
              </div>
              <div className="mt-3">
                <HPBar hp={e.hp} />
              </div>
              <button
                onClick={() => setExpanded(isExp ? null : e.expertId)}
                className="mt-2 text-xs text-text-muted underline-offset-2 hover:underline"
              >
                {isExp ? "− 内訳を隠す" : "+ 内訳を表示"}
              </button>
              {isExp && (
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-surface p-3 text-xs ring-1 ring-border">
                  <Row label="基礎HP" value={e.breakdown.base} />
                  <Row label="Phase 1 ボーナス" value={e.breakdown.phase1_bonus} />
                  <Row label="Phase 2 ボーナス" value={e.breakdown.phase2_bonus} />
                  <Row
                    label="同調ペナルティ"
                    value={e.breakdown.agreement_penalty}
                  />
                  <Row label="Boss Battle" value={e.breakdown.boss_battle} />
                  <Row label="ピボット" value={e.breakdown.pivot_bonus} />
                </dl>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
        <p className="text-xs font-bold text-amber-800">
          🏆 MVP: {expertById((data.mvp as "tech" | "biz" | "mkt") ?? "tech").name}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
          {data.mvp_reason}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  const sign = value > 0 ? "+" : "";
  const color =
    value > 0 ? "#22c55e" : value < 0 ? "#ef4444" : "var(--text-muted)";
  return (
    <>
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right font-bold tabular-nums" style={{ color }}>
        {sign}
        {value}
      </dd>
    </>
  );
}

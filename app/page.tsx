"use client";

import { useMemo, useRef, useState } from "react";
import { AttackBubble } from "@/components/AttackBubble";
import { ChatBubble } from "@/components/ChatBubble";
import { DecisionMap as DecisionMapView } from "@/components/DecisionMap";
import { DevilCard, ExpertCard } from "@/components/ExpertCard";
import { DevilBubble } from "@/components/DevilBubble";
import { FinalScoreBoard } from "@/components/FinalScoreBoard";
import { PhaseDivider } from "@/components/PhaseDivider";
import { ProgressBar } from "@/components/ProgressBar";
import { ScoreBoard } from "@/components/ScoreBoard";
import { EXPERTS, PHASES, expertById } from "@/lib/experts";
import type {
  BattleMessage,
  DecisionMap,
  DevilVerdict,
  ExpertId,
  ExpertTitle,
  FinalScores,
  JudgeScore,
  StreamEvent,
} from "@/lib/types";

type Phase =
  | "idle"
  | "phase1"
  | "phase2"
  | "phase3"
  | "phase4"
  | "phase5"
  | "done"
  | "error";

const SAMPLE_THEMES = [
  "中小製造業のDX推進戦略",
  "生成AIの業務活用",
  "地方企業の人材確保",
  "脱炭素と製造コストの両立",
];

const PHASE_RANGES: Record<number, { start: number; end: number }> = {
  1: { start: 0, end: 20 },
  2: { start: 20, end: 40 },
  3: { start: 40, end: 70 },
  4: { start: 70, end: 80 },
  5: { start: 80, end: 99 },
};

const PHASE_KEY: Record<number, Phase> = {
  1: "phase1",
  2: "phase2",
  3: "phase3",
  4: "phase4",
  5: "phase5",
};

interface MessageGroup {
  phase: number;
  messages: BattleMessage[];
}

export default function Page() {
  const [theme, setTheme] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentPhaseNumber, setCurrentPhaseNumber] = useState(0);
  const [activeExpert, setActiveExpert] = useState<
    ExpertId | "devil" | null
  >(null);
  const [messages, setMessages] = useState<BattleMessage[]>([]);
  const [judgeScores, setJudgeScores] = useState<JudgeScore | null>(null);
  const [devilVerdict, setDevilVerdict] = useState<DevilVerdict | null>(null);
  const [finalScores, setFinalScores] = useState<FinalScores | null>(null);
  const [proposal, setProposal] = useState<DecisionMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hpMap = useMemo(() => {
    const map: Record<ExpertId, number> = { tech: 100, biz: 100, mkt: 100 };
    if (finalScores) {
      for (const s of finalScores.final_scores) {
        map[s.expertId] = s.hp;
      }
    }
    return map;
  }, [finalScores]);

  const titleMap = useMemo(() => {
    const map: Partial<Record<ExpertId, ExpertTitle>> = {};
    if (finalScores) {
      for (const s of finalScores.final_scores) {
        map[s.expertId] = s.title;
      }
    }
    return map;
  }, [finalScores]);

  const defeatedSet = useMemo(() => {
    const set = new Set<ExpertId>();
    if (devilVerdict) {
      for (const v of devilVerdict.verdicts) {
        if (!v.survived) set.add(v.expertId);
      }
    }
    return set;
  }, [devilVerdict]);

  const groupedMessages: MessageGroup[] = useMemo(() => {
    const groups = new Map<number, BattleMessage[]>();
    for (const m of messages) {
      const arr = groups.get(m.phase) ?? [];
      arr.push(m);
      groups.set(m.phase, arr);
    }
    return Array.from(groups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([p, msgs]) => ({ phase: p, messages: msgs }));
  }, [messages]);

  const progress = useMemo(() => {
    if (phase === "done") return 100;
    if (phase === "idle" || phase === "error") return 0;
    const range = PHASE_RANGES[currentPhaseNumber];
    if (!range) return 0;
    const phaseMsgs = messages.filter(
      (m) => m.phase === currentPhaseNumber,
    ).length;
    const phaseDenominators: Record<number, number> = {
      1: 3,
      2: 3,
      3: 5,
      4: 1,
      5: 1,
    };
    const denom = phaseDenominators[currentPhaseNumber] ?? 1;
    const ratio = Math.min(1, phaseMsgs / denom);
    return range.start + (range.end - range.start) * ratio;
  }, [phase, currentPhaseNumber, messages]);

  async function start(themeText: string) {
    const t = themeText.trim();
    if (!t || phaseIsBusy(phase)) return;

    setTheme(t);
    setPhase("phase1");
    setCurrentPhaseNumber(1);
    setActiveExpert(null);
    setMessages([]);
    setJudgeScores(null);
    setDevilVerdict(null);
    setFinalScores(null);
    setProposal(null);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: t }),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) {
        const txt = await resp.text().catch(() => "");
        throw new Error(`APIエラー (${resp.status}): ${txt || resp.statusText}`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const dataLine = part
            .split("\n")
            .find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          const raw = dataLine.slice(5).trim();
          if (!raw) continue;
          try {
            const ev = JSON.parse(raw) as StreamEvent;
            handleEvent(ev);
          } catch {
            // ignore malformed
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setPhase("error");
      setError((err as Error).message);
    }
  }

  function handleEvent(ev: StreamEvent) {
    switch (ev.type) {
      case "phase_start":
        setCurrentPhaseNumber(ev.phase);
        setPhase(PHASE_KEY[ev.phase] ?? "phase1");
        setActiveExpert(null);
        break;
      case "expert_start":
        setActiveExpert(ev.expertId);
        break;
      case "expert_response": {
        const expert = expertById(ev.expertId);
        setMessages((prev) => [
          ...prev,
          {
            type: "statement",
            expertId: ev.expertId,
            expertName: expert.name,
            expertColor: expert.color,
            expertEmoji: expert.emoji,
            text: ev.text,
            phase: ev.phase,
          },
        ]);
        setActiveExpert(null);
        break;
      }
      case "attack_start":
        setActiveExpert(ev.attackerId);
        break;
      case "attack_response": {
        const attacker = expertById(ev.attackerId);
        const target = expertById(ev.targetId);
        setMessages((prev) => [
          ...prev,
          {
            type: "attack",
            expertId: ev.attackerId,
            expertName: attacker.name,
            expertColor: attacker.color,
            expertEmoji: attacker.emoji,
            targetId: ev.targetId,
            targetName: target.name,
            text: ev.text,
            phase: ev.phase,
          },
        ]);
        setActiveExpert(null);
        break;
      }
      case "judge_scores":
        setJudgeScores(ev.scores);
        break;
      case "devil_attack":
        setActiveExpert("devil");
        setMessages((prev) => [
          ...prev,
          {
            type: "devil",
            expertId: "devil",
            expertName: "黒崎 論破郎",
            text: ev.text,
            phase: 3,
          },
        ]);
        setActiveExpert(null);
        break;
      case "rebuttal_start":
        setActiveExpert(ev.expertId);
        break;
      case "rebuttal_response": {
        const expert = expertById(ev.expertId);
        setMessages((prev) => [
          ...prev,
          {
            type: "rebuttal",
            expertId: ev.expertId,
            expertName: expert.name,
            expertColor: expert.color,
            expertEmoji: expert.emoji,
            text: ev.text,
            phase: 3,
            choice: ev.choice,
          },
        ]);
        setActiveExpert(null);
        break;
      }
      case "devil_verdict":
        setDevilVerdict(ev.verdicts);
        break;
      case "final_scores":
        setFinalScores(ev.data);
        break;
      case "proposal":
        setProposal(ev.data);
        break;
      case "done":
        setPhase("done");
        setActiveExpert(null);
        break;
      case "error":
        setPhase("error");
        setError(ev.message);
        setActiveExpert(null);
        break;
    }
  }

  function reset() {
    abortRef.current?.abort();
    setTheme("");
    setPhase("idle");
    setCurrentPhaseNumber(0);
    setActiveExpert(null);
    setMessages([]);
    setJudgeScores(null);
    setDevilVerdict(null);
    setFinalScores(null);
    setProposal(null);
    setError(null);
  }

  const busy = phaseIsBusy(phase);
  const currentPhaseMeta = PHASES.find((p) => p.num === currentPhaseNumber);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <header className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
          ⚔️ 三賢者の議論 — Battle Arena
        </h1>
        <p className="mt-2 text-sm italic text-text-muted md:text-base">
          &quot;Only the strongest arguments survive.&quot;
        </p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {EXPERTS.map((e) => (
          <ExpertCard
            key={e.id}
            expert={e}
            active={activeExpert === e.id}
            hp={hpMap[e.id]}
            title={titleMap[e.id] ?? null}
            defeated={defeatedSet.has(e.id)}
          />
        ))}
        <DevilCard active={activeExpert === "devil"} />
      </section>

      {phase === "idle" || phase === "error" ? (
        <section className="mb-8 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <label
            htmlFor="theme"
            className="mb-2 block text-sm font-bold text-text"
          >
            バトルテーマを入力
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="theme"
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例: 中小製造業のDX推進戦略"
              className="flex-1 rounded-xl border border-border bg-surface-2 px-4 py-3 text-[15px] outline-none focus:border-tech focus:bg-surface"
              onKeyDown={(e) => {
                if (e.key === "Enter") start(theme);
              }}
            />
            <button
              onClick={() => start(theme)}
              disabled={!theme.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ⚔️ Battle Start
            </button>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs text-text-muted">クイック入力:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_THEMES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setTheme(s);
                    start(s);
                  }}
                  className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-text transition-colors hover:bg-surface"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              エラー: {error}
            </div>
          )}
        </section>
      ) : (
        <section className="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="mb-3 text-xs text-text-muted">
            テーマ: <span className="font-bold text-text">{theme}</span>
          </p>
          <ProgressBar
            value={progress}
            label={
              phase === "done"
                ? "Battle Complete"
                : currentPhaseMeta
                  ? `Phase ${currentPhaseNumber}/5 · ${currentPhaseMeta.icon} ${currentPhaseMeta.name}`
                  : "..."
            }
          />
          {busy && activeExpert && (
            <p className="mt-3 flex items-center gap-2 text-sm text-text-muted">
              <span className="spinner !border-text-muted/30 !border-t-text-muted" />
              {activeExpert === "devil"
                ? "黒崎 論破郎が攻撃を準備中..."
                : `${expertById(activeExpert).name}が考えています…`}
            </p>
          )}
          {busy && !activeExpert && (
            <p className="mt-3 flex items-center gap-2 text-sm text-text-muted">
              <span className="spinner !border-text-muted/30 !border-t-text-muted" />
              処理中...
            </p>
          )}
        </section>
      )}

      {groupedMessages.length > 0 && (
        <section className="space-y-4">
          {groupedMessages.map(({ phase: p, messages: msgs }) => {
            const meta = PHASES.find((x) => x.num === p);
            return (
              <div key={p}>
                <PhaseDivider
                  phaseNumber={p}
                  name={meta?.name ?? `Phase ${p}`}
                  icon={meta?.icon ?? "•"}
                />
                <div className="space-y-4">
                  {msgs.map((m, i) => renderMessage(m, `${p}-${i}`))}
                </div>
                {p === 2 && judgeScores && (
                  <div className="mt-6">
                    <ScoreBoard scores={judgeScores} />
                  </div>
                )}
                {p === 3 && devilVerdict && (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                    <h3 className="mb-3 flex items-center gap-2 font-bold text-red-800">
                      💀 悪魔の最終判定
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {devilVerdict.verdicts.map((v) => {
                        const e = expertById(v.expertId);
                        return (
                          <div
                            key={v.expertId}
                            className={`rounded-xl border p-3 ${
                              v.survived
                                ? "border-green-200 bg-white"
                                : "border-gray-300 bg-gray-100 opacity-75"
                            }`}
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span>{e.emoji}</span>
                              <span
                                className={`text-sm font-bold ${
                                  !v.survived ? "line-through" : ""
                                }`}
                                style={{ color: e.color }}
                              >
                                {e.name}
                              </span>
                              <span
                                className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                                  v.fatal_flaw_rating === "S"
                                    ? "bg-amber-500"
                                    : v.fatal_flaw_rating === "A"
                                      ? "bg-green-600"
                                      : v.fatal_flaw_rating === "B"
                                        ? "bg-yellow-600"
                                        : "bg-red-600"
                                }`}
                              >
                                {v.fatal_flaw_rating}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-text-muted">
                              {v.reason}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 border-t border-red-200 pt-3 text-sm italic text-red-900">
                      {devilVerdict.overall_assessment}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {finalScores && (
        <section className="mt-10">
          <PhaseDivider phaseNumber={4} name="Final Standings" icon="🏆" />
          <FinalScoreBoard data={finalScores} />
        </section>
      )}

      {proposal && (
        <section className="mt-10">
          <PhaseDivider
            phaseNumber={5}
            name="Battle-Tested Decision Map"
            icon="🗺️"
          />
          <DecisionMapView data={proposal} />
        </section>
      )}

      {(phase === "done" || phase === "error") && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-bold text-text shadow-sm transition-colors hover:bg-surface-2"
          >
            ⚔️ 次のバトルへ
          </button>
        </div>
      )}

      <footer className="mt-16 text-center text-xs text-text-muted">
        Powered by Claude · 3 experts × 5 phases × 1 devil
      </footer>
    </main>
  );
}

function phaseIsBusy(p: Phase): boolean {
  return (
    p === "phase1" ||
    p === "phase2" ||
    p === "phase3" ||
    p === "phase4" ||
    p === "phase5"
  );
}

function renderMessage(m: BattleMessage, key: string) {
  if (m.type === "devil") {
    return <DevilBubble key={key} text={m.text} label="Boss Attack" />;
  }
  if (m.type === "attack" && m.expertId && m.targetId) {
    return (
      <AttackBubble
        key={key}
        attacker={expertById(m.expertId as ExpertId)}
        target={expertById(m.targetId)}
        text={m.text}
        phaseLabel="Cross-Fire"
      />
    );
  }
  if (m.expertId && m.expertId !== "devil") {
    return (
      <ChatBubble
        key={key}
        expert={expertById(m.expertId as ExpertId)}
        text={m.text}
        phaseLabel={
          m.type === "statement"
            ? "Opening"
            : m.type === "rebuttal"
              ? "Rebuttal"
              : undefined
        }
        choice={m.choice}
      />
    );
  }
  return null;
}

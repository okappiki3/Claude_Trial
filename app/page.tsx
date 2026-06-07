"use client";

import { useMemo, useRef, useState } from "react";
import { ChatBubble } from "@/components/ChatBubble";
import { ExpertCard } from "@/components/ExpertCard";
import { ProgressBar } from "@/components/ProgressBar";
import { ProposalDocument } from "@/components/ProposalDocument";
import { RoundDivider } from "@/components/RoundDivider";
import { EXPERTS, ROUND_PROMPTS } from "@/lib/experts";
import type {
  ExpertId,
  Message,
  Proposal,
  StreamEvent,
} from "@/lib/types";

type Phase = "idle" | "discussing" | "synthesis" | "done" | "error";

const SAMPLE_THEMES = [
  "中小製造業のDX推進戦略",
  "生成AIの業務活用",
  "地方企業の人材確保",
];

function expertById(id: ExpertId) {
  return EXPERTS.find((e) => e.id === id)!;
}

export default function Page() {
  const [theme, setTheme] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeExpert, setActiveExpert] = useState<ExpertId | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentRoundLabel, setCurrentRoundLabel] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const progress = useMemo(() => {
    if (phase === "done") return 100;
    if (phase === "synthesis") return 92;
    if (phase === "idle" || phase === "error") return 0;
    const expertIdx = activeExpert
      ? EXPERTS.findIndex((e) => e.id === activeExpert)
      : 0;
    const done = messages.length;
    return Math.min(90, ((done + (activeExpert ? 0.5 : 0)) / 9) * 90);
    void expertIdx;
  }, [phase, activeExpert, messages.length]);

  const groupedByRound = useMemo(() => {
    const groups = new Map<number, Message[]>();
    for (const m of messages) {
      const arr = groups.get(m.round) ?? [];
      arr.push(m);
      groups.set(m.round, arr);
    }
    return groups;
  }, [messages]);

  async function start(themeText: string) {
    const t = themeText.trim();
    if (!t || phase === "discussing" || phase === "synthesis") return;

    setTheme(t);
    setPhase("discussing");
    setActiveExpert(null);
    setCurrentRound(0);
    setCurrentRoundLabel(ROUND_PROMPTS[0].label);
    setMessages([]);
    setProposal(null);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch("/api/discuss", {
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
      case "round_start":
        setCurrentRound(ev.round);
        setCurrentRoundLabel(ev.label);
        break;
      case "expert_start":
        setActiveExpert(ev.expertId);
        break;
      case "expert_response": {
        const expert = expertById(ev.expertId);
        setMessages((prev) => [
          ...prev,
          {
            expert,
            text: ev.text,
            round: ev.round,
            roundLabel: ev.roundLabel,
          },
        ]);
        setActiveExpert(null);
        break;
      }
      case "synthesis_start":
        setPhase("synthesis");
        setActiveExpert(null);
        break;
      case "proposal":
        setProposal(ev.data);
        break;
      case "done":
        setPhase("done");
        break;
      case "error":
        setPhase("error");
        setError(ev.message);
        break;
    }
  }

  function reset() {
    abortRef.current?.abort();
    setTheme("");
    setPhase("idle");
    setActiveExpert(null);
    setCurrentRound(0);
    setCurrentRoundLabel("");
    setMessages([]);
    setProposal(null);
    setError(null);
  }

  const busy = phase === "discussing" || phase === "synthesis";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <header className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
          三賢者の議論
        </h1>
        <p className="mt-2 text-sm text-text-muted md:text-base">
          AI Expert Discussion Panel ― 3人のAI専門家が、あなたのテーマを3ラウンド議論し、提案書を生成します。
        </p>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {EXPERTS.map((e) => (
          <ExpertCard
            key={e.id}
            expert={e}
            active={activeExpert === e.id}
          />
        ))}
      </section>

      {phase === "idle" || phase === "error" ? (
        <section className="mb-8 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <label
            htmlFor="theme"
            className="mb-2 block text-sm font-bold text-text"
          >
            議論するテーマを入力
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-text px-6 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              議論を開始 →
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
              phase === "synthesis"
                ? "提案書を生成中..."
                : phase === "done"
                  ? "完了"
                  : `ラウンド ${currentRound + 1}/3 ${currentRoundLabel}`
            }
          />
          {busy && activeExpert && (
            <p className="mt-3 flex items-center gap-2 text-sm text-text-muted">
              <span className="spinner !border-text-muted/30 !border-t-text-muted" />
              {expertById(activeExpert).name}が考えています…
            </p>
          )}
          {phase === "synthesis" && (
            <p className="mt-3 flex items-center gap-2 text-sm text-text-muted">
              <span className="spinner !border-text-muted/30 !border-t-text-muted" />
              全議論を統合して提案書を作成しています…
            </p>
          )}
        </section>
      )}

      {messages.length > 0 && (
        <section className="space-y-4">
          {Array.from(groupedByRound.entries()).map(([round, msgs]) => (
            <div key={round}>
              <RoundDivider label={ROUND_PROMPTS[round]?.label ?? `ラウンド${round + 1}`} />
              <div className="space-y-4">
                {msgs.map((m, i) => (
                  <ChatBubble key={`${round}-${i}`} message={m} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {proposal && (
        <section className="mt-12">
          <RoundDivider label="📄 提案書" />
          <ProposalDocument proposal={proposal} />
        </section>
      )}

      {(phase === "done" || phase === "error") && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-bold text-text shadow-sm transition-colors hover:bg-surface-2"
          >
            🔄 新しいテーマで議論する
          </button>
        </div>
      )}

      <footer className="mt-16 text-center text-xs text-text-muted">
        Powered by Claude · 3 experts × 3 rounds + 1 synthesis
      </footer>
    </main>
  );
}

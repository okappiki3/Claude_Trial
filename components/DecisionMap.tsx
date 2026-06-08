import type {
  DecisionMap as DecisionMapType,
  HypothesisCard,
  KilledClaim,
  NextQuest,
  SurvivedClaim,
  UnresolvedQuestion,
} from "@/lib/types";

interface Props {
  data: DecisionMapType;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
      <p className="text-[10px] font-bold tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  count,
  color,
}: {
  icon: string;
  title: string;
  count: number;
  color: string;
}) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
      <span aria-hidden>{icon}</span>
      <span style={{ color }}>{title}</span>
      <span className="text-xs font-medium text-text-muted">({count})</span>
    </h3>
  );
}

function SurvivedClaims({ items }: { items: SurvivedClaim[] }) {
  return (
    <section>
      <SectionHeading
        icon="✅"
        title="生き残った主張"
        count={items.length}
        color="#15803d"
      />
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-muted">
          バトルを生き残った主張はなかった。
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((s, i) => (
            <li
              key={i}
              className="rounded-2xl border-l-4 border-green-600 bg-green-50/60 p-4 ring-1 ring-green-200"
            >
              <p className="text-[15px] font-medium leading-relaxed text-text">
                「{s.claim}」
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-bold text-white ${
                    s.confidence === "high" ? "bg-green-600" : "bg-yellow-600"
                  }`}
                >
                  {s.confidence === "high" ? "high" : "medium"}
                </span>
                <span className="text-text-muted">
                  支持: <span className="font-bold text-text">{s.supported_by}</span>
                </span>
              </div>
              {s.caveat && s.caveat !== "なし" && (
                <p className="mt-2 border-t border-green-200/60 pt-2 text-xs text-text-muted">
                  <span className="font-bold">留保:</span> {s.caveat}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Graveyard({
  items,
  note,
}: {
  items: KilledClaim[];
  note: string;
}) {
  return (
    <section>
      <SectionHeading
        icon="💀"
        title="墓場行き"
        count={items.length}
        color="#991b1b"
      />
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-4 text-center text-sm text-text-muted">
          墓場には誰もいない。全員が悪魔の攻撃を生き残った。
        </div>
      ) : (
        <div className="rounded-2xl border border-purple-900/40 bg-gradient-to-br from-[#1e1b2e] to-[#2a1830] p-5 text-purple-50 shadow-lg">
          <ul className="space-y-3">
            {items.map((g, i) => (
              <li
                key={i}
                className="rounded-xl bg-black/30 p-4 ring-1 ring-purple-900/50"
              >
                <p className="mb-2 text-sm font-bold text-purple-100">
                  💀 「{g.claim}」
                </p>
                <div className="grid gap-1 text-xs text-purple-200/80">
                  <p>
                    <span className="font-bold text-purple-300">論破した者:</span>{" "}
                    {g.killed_by}
                  </p>
                  <p>
                    <span className="font-bold text-purple-300">死因:</span>{" "}
                    {g.cause_of_death}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {note && (
            <p className="mt-4 border-t border-purple-900/50 pt-3 text-[11px] italic text-purple-300/70">
              {note}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function UnresolvedQuestions({ items }: { items: UnresolvedQuestion[] }) {
  return (
    <section>
      <SectionHeading
        icon="⚖️"
        title="まだ決めてはいけないこと"
        count={items.length}
        color="#a16207"
      />
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-muted">
          未解決の論点はなし。
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((u, i) => (
            <li
              key={i}
              className="rounded-2xl border-l-4 border-yellow-500 bg-yellow-50/70 p-4 ring-1 ring-yellow-200"
            >
              <p className="text-[15px] font-bold text-text">{u.question}</p>
              <p className="mt-1 text-xs text-text-muted">
                <span className="font-bold">理由:</span> {u.why_unresolved}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                <span className="font-bold">依存する情報:</span> {u.depends_on}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function QuestBoard({ items }: { items: NextQuest[] }) {
  return (
    <section>
      <SectionHeading
        icon="🔍"
        title="次の7日間のクエスト"
        count={items.length}
        color="#0369a1"
      />
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-muted">
          クエストなし。
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((q, i) => (
            <li
              key={i}
              className="overflow-hidden rounded-2xl border border-sky-200 bg-white"
            >
              <div className="flex items-center gap-3 border-b border-sky-100 bg-sky-50 px-4 py-2">
                <span className="rounded-full bg-sky-700 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
                  QUEST {i + 1}
                </span>
                <span className="ml-auto text-[11px] text-sky-900">
                  👤 {q.owner}
                </span>
              </div>
              <div className="p-4">
                <p className="text-[15px] font-bold text-text">{q.quest}</p>
                <p className="mt-1 text-xs text-text-muted">
                  <span className="font-bold">目的:</span> {q.purpose}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function HypothesisCards({ items }: { items: HypothesisCard[] }) {
  return (
    <section>
      <SectionHeading
        icon="🃏"
        title="仮説カード"
        count={items.length}
        color="#7c3aed"
      />
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-muted">
          仮説カードなし。
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((h, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-purple-300 bg-gradient-to-br from-white to-purple-50 p-5 shadow-md"
            >
              <div className="mb-2 inline-block rounded-full bg-purple-700 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
                HYPOTHESIS #{i + 1}
              </div>
              <p className="text-[15px] font-bold leading-snug text-text">
                {h.hypothesis}
              </p>
              <dl className="mt-3 space-y-1.5 text-xs">
                <div>
                  <dt className="font-bold text-purple-800">必要な証拠</dt>
                  <dd className="text-text-muted">{h.required_evidence}</dd>
                </div>
                <div>
                  <dt className="font-bold text-purple-800">採用/棄却の条件</dt>
                  <dd className="text-text-muted">{h.verdict_criteria}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function DecisionMap({ data }: Props) {
  return (
    <article className="rounded-3xl border border-border bg-surface p-8 shadow-xl md:p-10">
      <header className="mb-8 border-b border-border pb-6 text-center">
        <p className="mb-2 text-xs font-bold tracking-[0.3em] text-text-muted">
          BATTLE-TESTED DECISION MAP
        </p>
        <h2 className="font-serif text-2xl font-bold leading-snug text-text md:text-3xl">
          {data.title}
        </h2>
        <p className="mt-3 text-sm italic text-text-muted">
          {data.battle_summary}
        </p>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        <Stat label="総攻撃数" value={data.battle_stats.total_attacks} />
        <Stat label="生き残り" value={data.battle_stats.arguments_survived} />
        <Stat label="墓場行き" value={data.battle_stats.arguments_killed} />
        <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
          <p className="text-[10px] font-bold tracking-wider text-amber-700">
            🏆 MVP
          </p>
          <p className="mt-0.5 text-sm font-bold text-amber-900">
            {data.mvp.name}
          </p>
        </div>
      </div>

      <div className="space-y-10">
        <SurvivedClaims items={data.survived} />
        <Graveyard items={data.killed} note={data.graveyard_note} />
        <UnresolvedQuestions items={data.unresolved} />
        <QuestBoard items={data.next_quests} />
        <HypothesisCards items={data.hypothesis_cards} />

        <section>
          <SectionHeading
            icon="🏆"
            title="MVP"
            count={1}
            color="#b45309"
          />
          <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
            <p className="text-base font-bold text-amber-900">
              {data.mvp.name}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
              {data.mvp.reason}
            </p>
          </div>
        </section>

        <section>
          <SectionHeading
            icon="🔥"
            title="最も激しかった瞬間"
            count={1}
            color="#b91c1c"
          />
          <p className="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-sm italic leading-relaxed text-red-900">
            {data.battle_stats.fiercest_moment}
          </p>
        </section>
      </div>
    </article>
  );
}

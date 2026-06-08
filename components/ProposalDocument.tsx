import type { BattleProposal } from "@/lib/types";

interface Props {
  proposal: BattleProposal;
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-lg font-bold text-text">
        <span aria-hidden>{icon}</span>
        <span>{title}</span>
      </h3>
      <div className="text-[15px] leading-relaxed text-text">{children}</div>
    </section>
  );
}

export function ProposalDocument({ proposal }: Props) {
  return (
    <article className="rounded-3xl border border-border bg-surface p-8 shadow-xl md:p-10">
      <header className="mb-8 border-b border-border pb-6 text-center">
        <p className="mb-2 text-xs font-bold tracking-[0.3em] text-text-muted">
          BATTLE-TESTED PROPOSAL
        </p>
        <h2 className="font-serif text-2xl font-bold leading-snug text-text md:text-3xl">
          {proposal.title}
        </h2>
        <p className="mt-3 text-xs italic text-text-muted">
          {proposal.battle_highlight}
        </p>
      </header>

      <div className="space-y-8">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="総攻撃数" value={proposal.battle_stats.total_attacks} />
          <Stat label="生き残り" value={proposal.battle_stats.arguments_survived} />
          <Stat
            label="墓場行き"
            value={proposal.battle_stats.arguments_killed}
          />
          <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
            <p className="text-[10px] font-bold tracking-wider text-amber-700">
              🏆 MVP
            </p>
            <p className="mt-0.5 text-sm font-bold text-amber-900">
              {proposal.mvp.name}
            </p>
          </div>
        </div>

        <Section icon="📋" title="エグゼクティブサマリー">
          <p>{proposal.summary}</p>
        </Section>

        <Section icon="🔍" title="背景と課題">
          <p>{proposal.background}</p>
        </Section>

        <Section icon="💡" title="提案内容 (生き残った主張)">
          <div className="grid gap-4 md:grid-cols-2">
            {proposal.proposals.map((p, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-surface-2 p-5"
              >
                <p className="mb-2 text-sm font-bold text-text">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-tech/15 text-xs text-tech">
                    {i + 1}
                  </span>
                  {p.title}
                </p>
                <p className="mb-3 text-sm text-text">{p.description}</p>
                <p className="mb-2 text-xs text-text-muted">
                  <span className="font-bold">期待効果:</span> {p.impact}
                </p>
                <div className="flex flex-wrap gap-2 border-t border-border pt-2 text-[11px]">
                  <span className="rounded-full bg-green-50 px-2 py-0.5 font-bold text-green-700">
                    生存: {p.survived_from}
                  </span>
                  <span className="text-text-muted">⚔️ {p.battle_tested}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section icon="🗺️" title="ロードマップ">
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-surface-2 text-left text-text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">フェーズ</th>
                  <th className="px-4 py-2 font-medium">期間</th>
                  <th className="px-4 py-2 font-medium">主なタスク</th>
                </tr>
              </thead>
              <tbody>
                {proposal.roadmap.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-3 font-bold">{r.phase}</td>
                    <td className="px-4 py-3 text-text-muted">{r.period}</td>
                    <td className="px-4 py-3">{r.tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section icon="⚠️" title="リスクと対策">
          <ul className="space-y-3">
            {proposal.risks.map((r, i) => (
              <li
                key={i}
                className="rounded-2xl border-l-4 border-mkt bg-surface-2 p-4"
              >
                <p className="mb-1 text-sm font-bold">{r.risk}</p>
                <p className="text-sm text-text-muted">
                  <span className="font-bold">対策:</span> {r.mitigation}
                </p>
                <p className="mt-1 text-[11px] text-text-muted">
                  指摘者: {r.identified_by}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon="🏆" title="MVP">
          <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
            <p className="text-base font-bold text-amber-900">
              {proposal.mvp.name}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
              {proposal.mvp.reason}
            </p>
          </div>
        </Section>

        <Section icon="🔥" title="最も激しかった瞬間">
          <p className="italic text-text-muted">
            {proposal.battle_stats.fiercest_moment}
          </p>
        </Section>

        <Section icon="🚀" title="結論と次のステップ">
          <p>{proposal.conclusion}</p>
        </Section>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
      <p className="text-[10px] font-bold tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

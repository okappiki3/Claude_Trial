import type { Proposal } from "@/lib/types";

interface Props {
  proposal: Proposal;
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
          PROPOSAL
        </p>
        <h2 className="font-serif text-2xl font-bold leading-snug text-text md:text-3xl">
          {proposal.title}
        </h2>
      </header>

      <div className="space-y-8">
        <Section icon="📋" title="エグゼクティブサマリー">
          <p>{proposal.summary}</p>
        </Section>

        <Section icon="🔍" title="背景と課題">
          <p>{proposal.background}</p>
        </Section>

        <Section icon="💡" title="提案内容">
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
                <p className="text-xs text-text-muted">
                  <span className="font-bold">期待効果:</span> {p.impact}
                </p>
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
              </li>
            ))}
          </ul>
        </Section>

        <Section icon="🚀" title="結論と次のステップ">
          <p>{proposal.conclusion}</p>
        </Section>
      </div>
    </article>
  );
}

import type { Expert } from "@/lib/types";

interface Props {
  attacker: Expert;
  target: Expert;
  text: string;
  phaseLabel?: string;
}

export function AttackBubble({ attacker, target, text, phaseLabel }: Props) {
  return (
    <div className="animate-fadeSlideIn">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-base"
          style={{ background: `${attacker.color}1a` }}
        >
          {attacker.emoji}
        </span>
        <span style={{ color: attacker.color }}>{attacker.name}</span>
        <span className="text-text-muted">が</span>
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-base"
          style={{ background: `${target.color}1a` }}
        >
          {target.emoji}
        </span>
        <span style={{ color: target.color }}>{target.name}</span>
        <span className="text-text-muted">を攻撃</span>
        {phaseLabel && (
          <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-muted">
            {phaseLabel}
          </span>
        )}
      </div>
      <div
        className="whitespace-pre-wrap rounded-2xl border-l-4 bg-surface px-4 py-3 text-[15px] leading-relaxed text-text shadow-sm ring-1 ring-border"
        style={{ borderLeftColor: attacker.color }}
      >
        {text}
      </div>
    </div>
  );
}

import type { Message } from "@/lib/types";

interface Props {
  message: Message;
}

export function ChatBubble({ message }: Props) {
  const { expert, text, roundLabel } = message;
  return (
    <div className="flex animate-fadeSlideIn gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
        style={{ background: `${expert.color}1a` }}
      >
        {expert.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: expert.color }}>
            {expert.name}
          </span>
          <span className="text-xs text-text-muted">{expert.role}</span>
          <span
            className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-muted"
          >
            {roundLabel}
          </span>
        </div>
        <div
          className="rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-[15px] leading-relaxed text-text shadow-sm ring-1 ring-border"
        >
          {text}
        </div>
      </div>
    </div>
  );
}

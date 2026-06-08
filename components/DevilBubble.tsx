interface Props {
  text: string;
  label?: string;
}

export function DevilBubble({ text, label }: Props) {
  return (
    <div className="animate-fadeSlideIn">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-900 text-base text-white">
          💀
        </span>
        <span className="font-bold text-red-600">黒崎 論破郎</span>
        <span className="text-text-muted">悪魔の代弁者</span>
        {label && (
          <span className="ml-auto rounded-full bg-red-900/10 px-2 py-0.5 text-[10px] font-bold text-red-700">
            {label}
          </span>
        )}
      </div>
      <div className="whitespace-pre-wrap rounded-2xl bg-gradient-to-br from-red-950 to-red-800 px-5 py-4 text-[15px] leading-relaxed text-red-50 shadow-lg ring-2 ring-red-700">
        {text}
      </div>
    </div>
  );
}

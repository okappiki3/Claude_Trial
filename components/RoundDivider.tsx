interface Props {
  label: string;
}

export function RoundDivider({ label }: Props) {
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-border" />
      <span className="rounded-full border border-border bg-surface px-4 py-1 text-xs font-medium text-text-muted">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

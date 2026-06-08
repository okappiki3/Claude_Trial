interface Props {
  phaseNumber: number;
  name: string;
  icon: string;
}

export function PhaseDivider({ phaseNumber, name, icon }: Props) {
  return (
    <div className="my-8 flex items-center gap-4">
      <div className="h-px flex-1 bg-border" />
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-bold shadow-sm">
        <span>{icon}</span>
        <span className="text-text-muted">Phase {phaseNumber}</span>
        <span className="text-text">·</span>
        <span>{name}</span>
      </div>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

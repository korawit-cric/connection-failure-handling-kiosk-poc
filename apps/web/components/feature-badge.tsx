interface FeatureBadgeProps {
  label: string;
  highlight?: boolean;
}

export function FeatureBadge({ label, highlight }: FeatureBadgeProps) {
  return (
    <span
      className={`rounded px-3 py-1 text-xs font-medium ${
        highlight
          ? 'bg-primary-500/20 text-primary-500'
          : 'bg-surface text-foreground/70'
      }`}
    >
      {label}
    </span>
  );
}

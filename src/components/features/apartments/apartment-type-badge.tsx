import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  studio: "text-[--text-muted] bg-[--bg-subtle] border-[--border-subtle]",
  t1: "text-[--text-secondary] bg-[--bg-card] border-[--border-default]",
  t2: "text-[--text-secondary] bg-[--bg-card] border-[--border-default]",
  t3: "text-[--accent] bg-[--accent-bg] border-[--accent-border]",
  t4_plus: "text-[--accent] bg-[--accent-bg] border-[--accent-border]",
};

const typeLabels: Record<string, string> = {
  studio: "Studio",
  t1: "T1",
  t2: "T2",
  t3: "T3",
  t4_plus: "T4+",
};

export function ApartmentTypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5",
        "text-[11px] font-medium font-[family-name:var(--font-syne)]",
        "uppercase tracking-wide",
        typeColors[type] ?? typeColors.t2
      )}
    >
      {typeLabels[type] ?? type.toUpperCase()}
    </span>
  );
}
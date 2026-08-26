import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/format";

export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  href?: string;
  tone?: "neutral" | "blood" | "warn" | "ok";
}) {
  const toneClass = {
    neutral: "text-ink",
    blood: "text-blood",
    warn: "text-warn",
    ok: "text-ok",
  }[tone];

  const body = (
    <div className="flex items-start justify-between gap-3 rounded-card border border-line bg-surface px-5 py-4 transition-colors">
      <div className="min-w-0">
        <p className="text-sm text-ink-mute">{label}</p>
        <p className={cx("mt-1 text-2xl font-semibold tabular-nums", toneClass)}>{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
      </div>
      {icon && <span className="shrink-0 text-ink-mute">{icon}</span>}
    </div>
  );

  if (!href) return body;
  return (
    <Link href={href} className="block hover:[&>div]:border-ink-mute">
      {body}
    </Link>
  );
}

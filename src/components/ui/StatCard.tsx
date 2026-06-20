import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

interface StatCardProps {
  label: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  tone?: "moss" | "amber" | "brick" | "sky";
  delta?: number;
  deltaLabel?: string;
  invertDelta?: boolean;
  prefix?: string;
}

const toneStyle = {
  moss: { ring: "hover:border-moss-300/40", icon: "text-moss-300 bg-moss-300/10", glow: "group-hover:shadow-[0_0_30px_-8px_rgba(124,163,95,0.45)]" },
  amber: { ring: "hover:border-amber-300/40", icon: "text-amber-300 bg-amber-300/10", glow: "group-hover:shadow-[0_0_30px_-8px_rgba(232,163,61,0.45)]" },
  brick: { ring: "hover:border-brick-400/40", icon: "text-brick-300 bg-brick-400/10", glow: "group-hover:shadow-[0_0_30px_-8px_rgba(194,77,77,0.45)]" },
  sky: { ring: "hover:border-sky-400/40", icon: "text-sky-300 bg-sky-400/10", glow: "group-hover:shadow-[0_0_30px_-8px_rgba(123,163,212,0.45)]" },
};

export default function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "moss",
  delta,
  deltaLabel,
  invertDelta,
  prefix,
}: StatCardProps) {
  const s = toneStyle[tone];
  const isNumeric = typeof value === "number";
  const display = isNumeric ? formatMoney(value) : value;
  const showDelta = typeof delta === "number";
  const positive = invertDelta ? delta! < 0 : delta! > 0;

  return (
    <div
      className={cn(
        "group card card-hover relative overflow-hidden p-5 transition-all",
        s.ring,
        s.glow
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-300">{label}</p>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="font-display text-xl text-ink-300">{prefix}</span>}
            <span className="stat-num text-3xl text-ink-100">{display}</span>
            {unit && <span className="text-xs text-ink-400">{unit}</span>}
          </div>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", s.icon)}>
          <Icon size={18} />
        </div>
      </div>
      {showDelta && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              positive ? "text-moss-300" : "text-brick-300"
            )}
          >
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(delta!)}%
          </span>
          {deltaLabel && <span className="text-ink-400">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}

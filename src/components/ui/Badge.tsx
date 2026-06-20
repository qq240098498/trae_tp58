import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "moss" | "amber" | "brick" | "slate" | "sky" | "fuchsia" | "neutral";

const toneMap: Record<Tone, string> = {
  moss: "border-moss-300/30 bg-moss-300/10 text-moss-200",
  amber: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  brick: "border-brick-400/30 bg-brick-400/10 text-brick-300",
  slate: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  sky: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  fuchsia: "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200",
  neutral: "border-ink-500/40 bg-ink-700/40 text-ink-200",
};

export default function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return <span className={cn("chip", toneMap[tone], className)}>{children}</span>;
}

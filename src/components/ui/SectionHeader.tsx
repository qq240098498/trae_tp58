import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h2 className="font-display text-2xl tracking-wide text-ink-100">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-300">{description}</p>}
      </div>
      {action}
    </div>
  );
}

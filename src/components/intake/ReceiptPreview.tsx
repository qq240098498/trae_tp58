import type { Transaction } from "@/lib/types";
import Receipt from "@/components/Receipt";
import { cn } from "@/lib/utils";

interface ReceiptPreviewProps {
  tx: Transaction | null;
  className?: string;
}

export default function ReceiptPreview({ tx, className }: ReceiptPreviewProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg tracking-wide text-ink-100">小票预览</h3>
          <p className="text-xs text-ink-400">80mm 热敏打印 · 实时同步</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-moss-300" />
          <span className="text-[11px] text-ink-400">同步中</span>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-ink-700/60 bg-ink-950 p-4 shadow-panel">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-ink-950 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-ink-950 to-transparent" />
        <div className="scrollbar-thin max-h-[520px] overflow-y-auto">
          {tx ? (
            <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-sm shadow-[0_0_40px_-12px_rgba(232,163,61,0.3)] ring-1 ring-amber-300/20">
              <Receipt tx={tx} />
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
              <div className="font-mono text-xs text-ink-500">
                ┌──────────────────┐
              </div>
              <p className="text-sm text-ink-400">添加品类后将实时生成小票</p>
              <div className="font-mono text-xs text-ink-500">
                └──────────────────┘
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

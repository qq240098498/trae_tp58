import { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Category } from "@/lib/types";
import { CATEGORY_META, formatMoney, unitLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

interface PricingCardProps {
  category: Category;
  onAdjust: (cat: Category) => void;
}

export default function PricingCard({ category, onAdjust }: PricingCardProps) {
  const meta = CATEGORY_META[category.type];
  const [expanded, setExpanded] = useState(false);
  const history = category.priceHistory;
  const prev = history.length >= 2 ? history[history.length - 2].price : category.unitPrice;
  const diff = category.unitPrice - prev;
  const trend = diff > 0.001 ? "up" : diff < -0.001 ? "down" : "flat";

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-ink-700/60 bg-ink-800/70 transition-all duration-200 hover:border-ink-500/60 hover:shadow-panel",
        !category.active && "opacity-60"
      )}
    >
      <div className="h-1 w-full" style={{ backgroundColor: meta.color }} />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-ink-100">{category.name}</p>
            <p className="mt-0.5 text-xs text-ink-400">按{unitLabel(category.unit)}计价</p>
          </div>
          <Badge tone={category.active ? "moss" : "neutral"}>
            {category.active ? "启用" : "停用"}
          </Badge>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl tracking-wide text-ink-100">
                {formatMoney(category.unitPrice)}
              </span>
              <span className="text-xs text-ink-400">元/{unitLabel(category.unit)}</span>
            </div>
            <div
              className={cn(
                "mt-1 flex items-center gap-1 text-xs font-medium",
                trend === "up" ? "text-moss-300" : trend === "down" ? "text-brick-300" : "text-ink-400"
              )}
            >
              <TrendIcon size={12} />
              {trend === "flat" ? "持平" : `${diff > 0 ? "+" : ""}${diff.toFixed(2)} 元`}
              <span className="text-ink-500">较上次</span>
            </div>
          </div>
          {/* mini sparkline */}
          <div className="flex h-8 items-end gap-0.5">
            {history.slice(-6).map((h, i) => {
              const prices = history.slice(-6).map((x) => x.price);
              const max = Math.max(...prices, category.unitPrice);
              const min = Math.min(...prices, category.unitPrice);
              const range = max - min || 1;
              const height = 8 + ((h.price - min) / range) * 20;
              const isLast = i === history.slice(-6).length - 1;
              return (
                <div
                  key={i}
                  className="w-1 rounded-sm"
                  style={{
                    height: `${height}px`,
                    backgroundColor: isLast ? meta.color : "rgba(146,158,130,0.3)",
                  }}
                />
              );
            })}
          </div>
        </div>

        {expanded && history.length > 0 && (
          <div className="mt-3 space-y-1 border-t border-ink-700/50 pt-3">
            <p className="text-[10px] uppercase tracking-wider text-ink-400">调价历史</p>
            {history.slice().reverse().slice(0, 4).map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-ink-400">
                  {new Date(h.at).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                </span>
                <span className="font-mono text-ink-200">¥{formatMoney(h.price)}</span>
                {h.note && <span className="text-[10px] text-ink-500">· {h.note}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onAdjust(category)}
            className="btn-ghost h-8 flex-1 text-xs"
          >
            调整价格
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="btn-ghost h-8 px-3 text-xs"
          >
            {expanded ? "收起" : "历史"}
          </button>
        </div>
      </div>
    </div>
  );
}

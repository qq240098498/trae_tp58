import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, Info } from "lucide-react";
import { useStore } from "@/store";
import { formatMoney, unitLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PriceUnit } from "@/lib/types";
import MarketTrendChart from "./MarketTrendChart";
import Modal from "@/components/ui/Modal";

interface MarketPriceHintProps {
  categoryId: string;
  categoryName?: string;
  unit?: PriceUnit;
  type?: "buy" | "sell";
  variant?: "inline" | "badge";
}

export default function MarketPriceHint({
  categoryId,
  categoryName,
  unit,
  type = "buy",
  variant = "inline",
}: MarketPriceHintProps) {
  const marketPrice = useStore((s) => s.marketPrices.find((m) => m.categoryId === categoryId));
  const [showDetail, setShowDetail] = useState(false);

  if (!marketPrice) return null;

  const trend = marketPrice.weekTrend;
  const today = trend[trend.length - 1];
  const yesterday = trend.length >= 2 ? trend[trend.length - 2] : null;

  const price = type === "buy" ? marketPrice.currentBuy : marketPrice.currentSell;
  const displayName = categoryName ?? marketPrice.categoryName;
  const displayUnit = unit ?? marketPrice.unit;

  const diff = yesterday
    ? type === "buy"
      ? today.buyPrice - yesterday.buyPrice
      : today.sellPrice - yesterday.sellPrice
    : 0;
  const trendDir = diff > 0.001 ? "up" : diff < -0.001 ? "down" : "flat";
  const TrendIcon = trendDir === "up" ? TrendingUp : trendDir === "down" ? TrendingDown : Minus;

  if (variant === "badge") {
    return (
      <>
        <button
          onClick={() => setShowDetail(true)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] transition-colors",
            type === "buy"
              ? "border-moss-300/30 bg-moss-300/10 text-moss-200 hover:bg-moss-300/20"
              : "border-amber-300/30 bg-amber-300/10 text-amber-200 hover:bg-amber-300/20"
          )}
          title="点击查看一周行情走势"
        >
          <Info size={10} />
          <span className="font-mono font-semibold">¥{formatMoney(price)}</span>
          <span className="text-ink-500">/{unitLabel(displayUnit)}</span>
          {yesterday && diff !== 0 && (
            <span className={cn(
              "flex items-center gap-0.5",
              trendDir === "up" ? "text-moss-300" : "text-brick-300"
            )}>
              <TrendIcon size={9} />
              {diff > 0 ? "+" : ""}{diff.toFixed(2)}
            </span>
          )}
        </button>
        {showDetail && marketPrice && (
          <Modal
            open={showDetail}
            onClose={() => setShowDetail(false)}
            title={`${displayName} · 一周行情走势`}
            subtitle={`今日${type === "buy" ? "参考收购价" : "参考出货价"} ¥${formatMoney(price)} / ${unitLabel(displayUnit)}`}
            size="md"
          >
            <div className="space-y-3">
              <MarketTrendChart marketPrice={marketPrice} height={200} />
              <div className="grid grid-cols-7 gap-1">
                {trend.map((p, i) => {
                  const isToday = i === trend.length - 1;
                  const val = type === "buy" ? p.buyPrice : p.sellPrice;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-md border p-1.5 text-center",
                        isToday
                          ? type === "buy"
                            ? "border-moss-300/40 bg-moss-300/10"
                            : "border-amber-300/40 bg-amber-300/10"
                          : "border-ink-700/50 bg-ink-800/40"
                      )}
                    >
                      <p className={cn("text-[9px]", isToday ? (type === "buy" ? "text-moss-300" : "text-amber-300") : "text-ink-400")}>
                        {isToday ? "今日" : p.date.slice(5)}
                      </p>
                      <p className={cn(
                        "mt-0.5 font-mono text-[10px] font-semibold",
                        type === "buy" ? "text-moss-300" : "text-amber-300"
                      )}>
                        {val.toFixed(val >= 10 ? 0 : 2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Modal>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowDetail(true)}
        className={cn(
          "group flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] transition-colors",
          "hover:bg-ink-700/50"
        )}
        title="点击查看一周行情走势"
      >
        <BarChart3 size={10} className="text-ink-500 group-hover:text-moss-300" />
        <span className="text-ink-500">{type === "buy" ? "参考收" : "参考售"}</span>
        <span className={cn(
          "font-mono font-semibold",
          type === "buy" ? "text-moss-300" : "text-amber-300"
        )}>
          ¥{formatMoney(price)}
        </span>
        {yesterday && (
          <span className={cn(
            "flex items-center gap-0.5",
            trendDir === "up" ? "text-moss-300" : trendDir === "down" ? "text-brick-300" : "text-ink-500"
          )}>
            <TrendIcon size={9} />
            {trendDir === "flat" ? "→" : `${diff > 0 ? "↑" : "↓"}${Math.abs(diff).toFixed(2)}`}
          </span>
        )}
      </button>
      {showDetail && marketPrice && (
        <Modal
          open={showDetail}
          onClose={() => setShowDetail(false)}
          title={`${displayName} · 一周行情走势`}
          subtitle={`今日${type === "buy" ? "参考收购价" : "参考出货价"} ¥${formatMoney(price)} / ${unitLabel(displayUnit)}`}
          size="md"
        >
          <div className="space-y-3">
            <MarketTrendChart marketPrice={marketPrice} height={200} />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-ink-700/60 text-ink-400">
                    <th className="py-1.5 text-left font-medium">日期</th>
                    <th className="py-1.5 text-right font-medium">收购参考</th>
                    <th className="py-1.5 text-right font-medium">出货参考</th>
                  </tr>
                </thead>
                <tbody>
                  {[...trend].reverse().map((p, i) => (
                    <tr key={p.date} className={cn("border-b border-ink-700/40", i === 0 && "bg-ink-800/30")}>
                      <td className={cn("py-1.5 text-ink-300", i === 0 && "font-medium text-moss-300")}>
                        {i === 0 ? `${p.date}（今日）` : p.date}
                      </td>
                      <td className="py-1.5 text-right font-mono text-moss-200">¥{formatMoney(p.buyPrice)}</td>
                      <td className="py-1.5 text-right font-mono text-amber-200">¥{formatMoney(p.sellPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

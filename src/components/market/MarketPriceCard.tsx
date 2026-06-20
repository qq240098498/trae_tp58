import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import type { MarketPrice } from "@/lib/types";
import { CATEGORY_META, formatMoney, unitLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import MarketTrendChart from "./MarketTrendChart";
import Modal from "@/components/ui/Modal";

interface MarketPriceCardProps {
  marketPrice: MarketPrice;
  compact?: boolean;
  mode?: "buy" | "sell" | "both";
}

export default function MarketPriceCard({ marketPrice, compact = false, mode = "both" }: MarketPriceCardProps) {
  const meta = CATEGORY_META[marketPrice.type];
  const [showDetail, setShowDetail] = useState(false);

  const trend = marketPrice.weekTrend;
  const today = trend[trend.length - 1];
  const yesterday = trend.length >= 2 ? trend[trend.length - 2] : null;

  const buyDiff = yesterday ? today.buyPrice - yesterday.buyPrice : 0;
  const sellDiff = yesterday ? today.sellPrice - yesterday.sellPrice : 0;
  const buyTrend = buyDiff > 0.001 ? "up" : buyDiff < -0.001 ? "down" : "flat";
  const sellTrend = sellDiff > 0.001 ? "up" : sellDiff < -0.001 ? "down" : "flat";

  const BuyTrendIcon = buyTrend === "up" ? TrendingUp : buyTrend === "down" ? TrendingDown : Minus;
  const SellTrendIcon = sellTrend === "up" ? TrendingUp : sellTrend === "down" ? TrendingDown : Minus;

  const sparkPrices = trend.map((p) => (mode === "buy" ? p.buyPrice : p.sellPrice));
  const max = Math.max(...sparkPrices);
  const min = Math.min(...sparkPrices);
  const range = max - min || 1;

  if (compact) {
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg border border-ink-700/60 bg-ink-800/50 p-3 transition-all hover:border-ink-500/60"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className="truncate text-xs font-medium text-ink-100">{marketPrice.categoryName}</span>
          <button
            onClick={() => setShowDetail(true)}
            className="ml-auto shrink-0 text-ink-500 transition-colors hover:text-moss-300"
            title="查看详情"
          >
            <BarChart3 size={12} />
          </button>
        </div>

        {(mode === "buy" || mode === "both") && (
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-ink-500">收</span>
              <span className="font-mono text-sm font-semibold text-moss-300">¥{formatMoney(marketPrice.currentBuy)}</span>
              <span className="text-[10px] text-ink-500">/{unitLabel(marketPrice.unit)}</span>
              {yesterday && (
                <span className={cn(
                  "ml-auto flex items-center gap-0.5 text-[10px]",
                  buyTrend === "up" ? "text-moss-300" : buyTrend === "down" ? "text-brick-300" : "text-ink-500"
                )}>
                  <BuyTrendIcon size={10} />
                  {buyTrend === "flat" ? "持平" : `${buyDiff > 0 ? "+" : ""}${buyDiff.toFixed(2)}`}
                </span>
              )}
            </div>
          </div>
        )}

        {(mode === "sell" || mode === "both") && (
          <div className="mt-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-ink-500">售</span>
              <span className="font-mono text-sm font-semibold text-amber-300">¥{formatMoney(marketPrice.currentSell)}</span>
              <span className="text-[10px] text-ink-500">/{unitLabel(marketPrice.unit)}</span>
              {yesterday && (
                <span className={cn(
                  "ml-auto flex items-center gap-0.5 text-[10px]",
                  sellTrend === "up" ? "text-moss-300" : sellTrend === "down" ? "text-brick-300" : "text-ink-500"
                )}>
                  <SellTrendIcon size={10} />
                  {sellTrend === "flat" ? "持平" : `${sellDiff > 0 ? "+" : ""}${sellDiff.toFixed(2)}`}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-2.5 flex h-6 items-end gap-0.5">
          {trend.map((p, i) => {
            const val = mode === "buy" ? p.buyPrice : mode === "sell" ? p.sellPrice : (p.buyPrice + p.sellPrice) / 2;
            const height = 4 + ((val - min) / range) * 18;
            const isLast = i === trend.length - 1;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${height}px`,
                  backgroundColor: isLast ? meta.color : "rgba(146,158,130,0.25)",
                }}
              />
            );
          })}
        </div>

        <Modal
          open={showDetail}
          onClose={() => setShowDetail(false)}
          title={`${marketPrice.categoryName} · 一周行情走势`}
          subtitle={`参考收购价 ¥${formatMoney(marketPrice.currentBuy)} · 参考出货价 ¥${formatMoney(marketPrice.currentSell)} / ${unitLabel(marketPrice.unit)}`}
          size="lg"
        >
          <div className="space-y-4">
            <MarketTrendChart marketPrice={marketPrice} height={260} />
            <div className="grid grid-cols-7 gap-1">
              {trend.map((p, i) => {
                const isToday = i === trend.length - 1;
                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-lg border p-2 text-center",
                      isToday
                        ? "border-moss-300/40 bg-moss-300/10"
                        : "border-ink-700/50 bg-ink-800/40"
                    )}
                  >
                    <p className={cn("text-[10px]", isToday ? "text-moss-300" : "text-ink-400")}>
                      {isToday ? "今日" : p.date.slice(5).replace("-", "/")}
                    </p>
                    <p className="mt-1 font-mono text-xs font-semibold text-moss-300">
                      ¥{formatMoney(p.buyPrice)}
                    </p>
                    <p className="font-mono text-xs font-semibold text-amber-300">
                      ¥{formatMoney(p.sellPrice)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-ink-700/60 bg-ink-800/70 transition-all hover:border-ink-500/60 hover:shadow-panel"
      )}
    >
      <div className="h-1 w-full" style={{ backgroundColor: meta.color }} />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-ink-100">{marketPrice.categoryName}</p>
            <p className="mt-0.5 text-xs text-ink-400">按{unitLabel(marketPrice.unit)}计价</p>
          </div>
          <button
            onClick={() => setShowDetail(true)}
            className="btn-ghost h-7 px-2 text-xs"
            title="查看详细走势"
          >
            <BarChart3 size={13} /> 走势
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink-400">今日参考收购</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-2xl tracking-wide text-moss-300">
                ¥{formatMoney(marketPrice.currentBuy)}
              </span>
              <span className="text-xs text-ink-400">/{unitLabel(marketPrice.unit)}</span>
            </div>
            {yesterday && (
              <div className={cn(
                "mt-1 flex items-center gap-1 text-xs font-medium",
                buyTrend === "up" ? "text-moss-300" : buyTrend === "down" ? "text-brick-300" : "text-ink-400"
              )}>
                <BuyTrendIcon size={11} />
                {buyTrend === "flat" ? "较昨日持平" : `较昨日 ${buyDiff > 0 ? "+" : ""}${buyDiff.toFixed(2)} 元`}
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink-400">今日参考出货</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-2xl tracking-wide text-amber-300">
                ¥{formatMoney(marketPrice.currentSell)}
              </span>
              <span className="text-xs text-ink-400">/{unitLabel(marketPrice.unit)}</span>
            </div>
            {yesterday && (
              <div className={cn(
                "mt-1 flex items-center gap-1 text-xs font-medium",
                sellTrend === "up" ? "text-moss-300" : sellTrend === "down" ? "text-brick-300" : "text-ink-400"
              )}>
                <SellTrendIcon size={11} />
                {sellTrend === "flat" ? "较昨日持平" : `较昨日 ${sellDiff > 0 ? "+" : ""}${sellDiff.toFixed(2)} 元`}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-ink-400">一周迷你走势</p>
          <div className="flex h-10 items-end gap-0.5">
            {trend.map((p, i) => {
              const val = (p.buyPrice + p.sellPrice) / 2;
              const height = 8 + ((val - min) / range) * 30;
              const isLast = i === trend.length - 1;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all hover:opacity-80"
                  style={{
                    height: `${height}px`,
                    backgroundColor: isLast ? meta.color : "rgba(146,158,130,0.3)",
                  }}
                  title={`${p.date}: 收¥${formatMoney(p.buyPrice)} / 售¥${formatMoney(p.sellPrice)}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        open={showDetail}
        onClose={() => setShowDetail(false)}
        title={`${marketPrice.categoryName} · 一周行情走势`}
        subtitle={`参考收购价 ¥${formatMoney(marketPrice.currentBuy)} · 参考出货价 ¥${formatMoney(marketPrice.currentSell)} / ${unitLabel(marketPrice.unit)}`}
        size="lg"
      >
        <div className="space-y-4">
          <MarketTrendChart marketPrice={marketPrice} height={280} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700/60 text-xs text-ink-400">
                  <th className="py-2 text-left font-medium">日期</th>
                  <th className="py-2 text-right font-medium">参考收购价</th>
                  <th className="py-2 text-right font-medium">参考出货价</th>
                  <th className="py-2 text-right font-medium">利差</th>
                </tr>
              </thead>
              <tbody>
                {[...trend].reverse().map((p, i) => {
                  const spread = p.sellPrice - p.buyPrice;
                  const isToday = i === 0;
                  return (
                    <tr key={p.date} className={cn("border-b border-ink-700/40", isToday && "bg-moss-300/5")}>
                      <td className={cn("py-2 text-ink-300", isToday && "text-moss-300 font-medium")}>
                        {isToday ? `${p.date}（今日）` : p.date}
                      </td>
                      <td className="py-2 text-right font-mono text-moss-200">¥{formatMoney(p.buyPrice)}</td>
                      <td className="py-2 text-right font-mono text-amber-200">¥{formatMoney(p.sellPrice)}</td>
                      <td className="py-2 text-right font-mono text-ink-200">¥{formatMoney(spread)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}

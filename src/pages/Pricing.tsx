import { useState, useMemo } from "react";
import {
  ChevronRight,
  Tag,
  CircleDot,
  TrendingUp,
  Layers,
  Search,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useStore } from "@/store";
import type { Category, CategoryType } from "@/lib/types";
import { CATEGORY_META, CATEGORY_ORDER, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import PricingCard from "@/components/pricing/PricingCard";
import PriceAdjustModal from "@/components/pricing/PriceAdjustModal";
import MarketPriceCard from "@/components/market/MarketPriceCard";
import MarketPriceEntryModal from "@/components/market/MarketPriceEntryModal";

export default function Pricing() {
  const categories = useStore((s) => s.categories);
  const marketPrices = useStore((s) => s.marketPrices);
  const [selected, setSelected] = useState<CategoryType | "all">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(CATEGORY_ORDER));
  const [search, setSearch] = useState("");
  const [adjusting, setAdjusting] = useState<Category | null>(null);
  const [showMarketEntry, setShowMarketEntry] = useState(false);
  const [selectedMarketCategory, setSelectedMarketCategory] = useState<string | undefined>();
  const [showMarketPanel, setShowMarketPanel] = useState(true);

  const groups = useMemo(() => {
    return CATEGORY_ORDER.map((type) => ({
      type,
      meta: CATEGORY_META[type],
      leaves: categories.filter((c) => c.parentId === `cat_${type}`),
    }));
  }, [categories]);

  const filtered = useMemo(() => {
    let list = categories.filter((c) => c.parentId !== null);
    if (selected !== "all") list = list.filter((c) => c.type === selected);
    if (search.trim()) {
      list = list.filter((c) => c.name.includes(search.trim()));
    }
    return list;
  }, [categories, selected, search]);

  const activeCount = categories.filter((c) => c.parentId && c.active).length;
  const leafCount = categories.filter((c) => c.parentId).length;
  const avgPrice = useMemo(() => {
    const leafs = categories.filter((c) => c.parentId && c.unit === "kg");
    if (!leafs.length) return 0;
    return Math.round((leafs.reduce((s, c) => s + c.unitPrice, 0) / leafs.length) * 100) / 100;
  }, [categories]);

  const avgMarketBuy = useMemo(() => {
    const kgMp = marketPrices.filter((m) => m.unit === "kg");
    if (!kgMp.length) return 0;
    return Math.round((kgMp.reduce((s, m) => s + m.currentBuy, 0) / kgMp.length) * 100) / 100;
  }, [marketPrices]);

  const avgMarketSell = useMemo(() => {
    const kgMp = marketPrices.filter((m) => m.unit === "kg");
    if (!kgMp.length) return 0;
    return Math.round((kgMp.reduce((s, m) => s + m.currentSell, 0) / kgMp.length) * 100) / 100;
  }, [marketPrices]);

  const risingCount = useMemo(() => {
    return marketPrices.filter((m) => {
      const t = m.weekTrend;
      if (t.length < 2) return false;
      return t[t.length - 1].buyPrice > t[t.length - 2].buyPrice;
    }).length;
  }, [marketPrices]);

  const fallingCount = useMemo(() => {
    return marketPrices.filter((m) => {
      const t = m.weekTrend;
      if (t.length < 2) return false;
      return t[t.length - 1].buyPrice < t[t.length - 2].buyPrice;
    }).length;
  }, [marketPrices]);

  const toggleExpand = (type: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryStat icon={Layers} label="在售品类" value={`${activeCount}/${leafCount}`} tone="moss" />
        <SummaryStat icon={Tag} label="公斤品类均价" value={`¥${formatMoney(avgPrice)}`} tone="amber" />
        <SummaryStat icon={TrendingUp} label="五大类" value={CATEGORY_ORDER.length} tone="sky" unit="大类" />
        <SummaryStat icon={CircleDot} label="调价记录" value={categories.reduce((s, c) => s + Math.max(0, c.priceHistory.length - 1), 0)} tone="fuchsia" unit="次" />
      </div>

      {/* Market Price Overview */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-700/60 px-5 py-4">
          <SectionHeader
            title="今日行情参考"
            description={`共 ${marketPrices.length} 个品类，上涨 ${risingCount} · 下跌 ${fallingCount} · 持平 ${marketPrices.length - risingCount - fallingCount}`}
            className="!mb-0"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectedMarketCategory(undefined); setShowMarketEntry(true); }}
              className="btn-amber h-8 text-xs"
            >
              <Plus size={13} /> 录入今日行情
            </button>
            <button
              onClick={() => setShowMarketPanel((v) => !v)}
              className="btn-ghost h-8 px-2 text-xs"
              title={showMarketPanel ? "收起行情面板" : "展开行情面板"}
            >
              <RefreshCw size={13} className={cn(showMarketPanel && "rotate-180", "transition-transform")} />
            </button>
          </div>
        </div>

        {showMarketPanel && (
          <div className="p-5">
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-moss-300/20 bg-moss-300/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-moss-300/80">公斤品类参考收购均价</p>
                <p className="mt-1 font-display text-xl tracking-wide text-moss-300">¥{formatMoney(avgMarketBuy)}</p>
              </div>
              <div className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-amber-300/80">公斤品类参考出货均价</p>
                <p className="mt-1 font-display text-xl tracking-wide text-amber-300">¥{formatMoney(avgMarketSell)}</p>
              </div>
              <div className="rounded-lg border border-moss-300/20 bg-ink-800/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-ink-400">今日上涨品类</p>
                <p className="mt-1 font-display text-xl tracking-wide text-moss-300">{risingCount}</p>
              </div>
              <div className="rounded-lg border border-brick-300/20 bg-ink-800/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-ink-400">今日下跌品类</p>
                <p className="mt-1 font-display text-xl tracking-wide text-brick-300">{fallingCount}</p>
              </div>
            </div>

            {CATEGORY_ORDER.map((type) => {
              const m = CATEGORY_META[type];
              const typeMarketPrices = marketPrices.filter((mp) => mp.type === type);
              if (typeMarketPrices.length === 0) return null;
              return (
                <div key={type} className="mb-5 last:mb-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                    <h4 className="text-sm font-medium text-ink-100">{m.label}类行情</h4>
                    <span className="text-xs text-ink-500">{typeMarketPrices.length} 个品类</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {typeMarketPrices.map((mp) => (
                      <div key={mp.categoryId} className="group">
                        <MarketPriceCard marketPrice={mp} compact />
                        <button
                          onClick={() => { setSelectedMarketCategory(mp.categoryId); setShowMarketEntry(true); }}
                          className="mt-1 w-full text-[10px] text-ink-500 transition-colors hover:text-moss-300"
                        >
                          更新行情 →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Category tree */}
        <div className="card h-fit overflow-hidden">
          <div className="border-b border-ink-700/60 px-4 py-3">
            <div className="flex items-center gap-2 rounded-md border border-ink-600 bg-ink-900/60 px-2.5 py-1.5">
              <Search size={14} className="text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索品类"
                className="bg-transparent text-sm text-ink-100 placeholder:text-ink-400 outline-none"
              />
            </div>
          </div>
          <div className="p-2">
            <button
              onClick={() => setSelected("all")}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                selected === "all" ? "bg-moss-300/10 text-ink-100" : "text-ink-300 hover:bg-ink-750/60"
              )}
            >
              <Layers size={15} className="text-ink-400" />
              全部品类
              <span className="ml-auto text-xs text-ink-400">{leafCount}</span>
            </button>
            <div className="mt-1 space-y-0.5">
              {groups.map((g) => {
                const isOpen = expanded.has(g.type) || search.trim() !== "";
                const isSel = selected === g.type;
                return (
                  <div key={g.type}>
                    <button
                      onClick={() => {
                        toggleExpand(g.type);
                        setSelected(g.type);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                        isSel ? "bg-moss-300/10 text-ink-100" : "text-ink-200 hover:bg-ink-750/60"
                      )}
                    >
                      <ChevronRight
                        size={14}
                        className={cn("text-ink-400 transition-transform", isOpen && "rotate-90")}
                      />
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.meta.color }} />
                      <span className="flex-1 text-left font-medium">{g.meta.label}</span>
                      <span className="text-xs text-ink-400">{g.leaves.length}</span>
                    </button>
                    {isOpen && (
                      <div className="ml-4 border-l border-ink-700/40 pl-2">
                        {g.leaves.map((leaf) => (
                          <button
                            key={leaf.id}
                            onClick={() => setAdjusting(leaf)}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-ink-300 transition-colors hover:bg-ink-750/60 hover:text-ink-100"
                          >
                            <span className="flex-1 text-left">{leaf.name}</span>
                            <span className="font-mono text-ink-400">¥{formatMoney(leaf.unitPrice)}</span>
                            {!leaf.active && <Badge tone="neutral">停</Badge>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="card p-5">
          <SectionHeader
            title={selected === "all" ? "全部品类定价" : `${CATEGORY_META[selected].label}类定价`}
            description={
              search.trim()
                ? `匹配到 ${filtered.length} 个品类`
                : `共 ${filtered.length} 个品类，点击卡片或调价按钮修改单价`
            }
            action={
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-moss-300" /> 启用
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-ink-500" /> 停用
                </span>
              </div>
            }
          />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((cat) => (
              <PricingCard key={cat.id} category={cat} onAdjust={setAdjusting} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full flex h-40 items-center justify-center text-sm text-ink-400">
                未找到匹配的品类
              </div>
            )}
          </div>
        </div>
      </div>

      <PriceAdjustModal
        open={!!adjusting}
        category={adjusting}
        onClose={() => setAdjusting(null)}
      />

      <MarketPriceEntryModal
        open={showMarketEntry}
        onClose={() => setShowMarketEntry(false)}
        preselectedCategoryId={selectedMarketCategory}
      />
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: typeof Tag;
  label: string;
  value: string | number;
  unit?: string;
  tone: "moss" | "amber" | "sky" | "fuchsia";
}) {
  const toneMap = {
    moss: "text-moss-300 bg-moss-300/10",
    amber: "text-amber-300 bg-amber-300/10",
    sky: "text-sky-300 bg-sky-400/10",
    fuchsia: "text-fuchsia-300 bg-fuchsia-400/10",
  };
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", toneMap[tone])}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-ink-400">{label}</p>
        <p className="font-mono text-lg font-semibold text-ink-100">
          {value}
          {unit && <span className="ml-1 text-xs font-normal text-ink-400">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

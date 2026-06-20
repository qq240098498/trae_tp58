import { useState, useMemo } from "react";
import {
  ChevronRight,
  Tag,
  CircleDot,
  TrendingUp,
  Layers,
  Search,
} from "lucide-react";
import { useStore } from "@/store";
import type { Category, CategoryType } from "@/lib/types";
import { CATEGORY_META, CATEGORY_ORDER, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import PricingCard from "@/components/pricing/PricingCard";
import PriceAdjustModal from "@/components/pricing/PriceAdjustModal";

export default function Pricing() {
  const categories = useStore((s) => s.categories);
  const [selected, setSelected] = useState<CategoryType | "all">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(CATEGORY_ORDER));
  const [search, setSearch] = useState("");
  const [adjusting, setAdjusting] = useState<Category | null>(null);

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

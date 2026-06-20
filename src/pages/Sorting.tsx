import { useMemo } from "react";
import { Boxes, Layers, Warehouse, AlertTriangle, ArrowRightLeft, MapPin } from "lucide-react";
import { useStore } from "@/store";
import { CATEGORY_META, CATEGORY_ORDER, formatMoney, formatWeight, formatNumber } from "@/lib/format";
import { inventoryUtilization, totalInventoryWeight, totalInventoryValue } from "@/lib/selectors";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export default function Sorting() {
  const inventory = useStore((s) => s.inventory);
  const categories = useStore((s) => s.categories);
  const sortRecords = useStore((s) => s.sortRecords);

  const enriched = useMemo(() => {
    return inventory
      .map((b) => {
        const cat = categories.find((c) => c.id === b.categoryId);
        return { ...b, category: cat };
      })
      .filter((b) => b.category)
      .sort((a, b) => a.location.localeCompare(b.location));
  }, [inventory, categories]);

  const totalWeight = totalInventoryWeight(inventory);
  const totalValue = totalInventoryValue(inventory, categories);
  const fullCount = inventory.filter((b) => inventoryUtilization(b) >= 0.85).length;
  const bucketCount = inventory.length;

  const byType = useMemo(() => {
    return CATEGORY_ORDER.map((type) => {
      const buckets = enriched.filter((b) => b.category?.type === type);
      const weight = buckets.reduce((s, b) => s + b.weightKg, 0);
      const value = buckets.reduce((s, b) => {
        const cat = b.category!;
        return s + b.weightKg * cat.unitPrice + b.pieceCount * cat.unitPrice;
      }, 0);
      return { type, weight, value, count: buckets.length };
    });
  }, [enriched]);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard icon={Warehouse} label="库存总重量" value={`${formatWeight(totalWeight)}`} unit="kg" tone="moss" />
        <SummaryCard icon={Layers} label="库存估值" value={`¥${formatMoney(totalValue)}`} tone="amber" />
        <SummaryCard icon={Boxes} label="在用库位" value={`${bucketCount}`} unit="个" tone="sky" />
        <SummaryCard icon={AlertTriangle} label="高容量库位" value={`${fullCount}`} unit="个" tone="brick" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        {/* Inventory table */}
        <div className="card overflow-hidden">
          <div className="border-b border-ink-700/60 px-5 py-4">
            <SectionHeader
              title="库存分桶"
              description="按库位查看各品类库存与库容占用"
              className="!mb-0"
            />
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700/60 text-xs text-ink-400">
                  <th className="px-5 py-2.5 text-left font-medium">库位</th>
                  <th className="px-3 py-2.5 text-left font-medium">品类</th>
                  <th className="px-3 py-2.5 text-left font-medium">大类</th>
                  <th className="px-3 py-2.5 text-right font-medium">重量/件数</th>
                  <th className="px-3 py-2.5 text-right font-medium">估值</th>
                  <th className="px-5 py-2.5 text-left font-medium">库容占用</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((b) => {
                  const meta = b.category ? CATEGORY_META[b.category.type] : null;
                  const util = inventoryUtilization(b);
                  const value = b.category ? b.weightKg * b.category.unitPrice + b.pieceCount * b.category.unitPrice : 0;
                  return (
                    <tr key={b.categoryId} className="border-b border-ink-700/40 table-row-hover">
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-ink-700/50 px-2 py-1 font-mono text-xs text-ink-200">
                          <MapPin size={11} className="text-ink-400" />
                          {b.location}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-ink-100">{b.category?.name}</td>
                      <td className="px-3 py-3">
                        {meta && (
                          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: meta.color }}>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                            {meta.label}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-ink-200">
                        {b.weightKg > 0 && <span>{formatWeight(b.weightKg)} kg</span>}
                        {b.weightKg > 0 && b.pieceCount > 0 && <span className="text-ink-500"> / </span>}
                        {b.pieceCount > 0 && <span>{formatNumber(b.pieceCount)} 件</span>}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-amber-200">¥{formatMoney(value)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-700">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                util >= 85 ? "bg-brick-400" : util >= 60 ? "bg-amber-300" : "bg-moss-300"
                              )}
                              style={{ width: `${util}%` }}
                            />
                          </div>
                          <span className={cn("font-mono text-xs", util >= 85 ? "text-brick-300" : "text-ink-400")}>
                            {util}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side: by type + sort records */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display text-lg tracking-wide text-ink-100">按大类库存</h3>
            <div className="mt-3 space-y-2.5">
              {byType.map((t) => {
                const meta = CATEGORY_META[t.type];
                return (
                  <div key={t.type} className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className="flex-1 text-sm text-ink-200">{meta.label}</span>
                    <span className="font-mono text-xs text-ink-300">{formatWeight(t.weight)}kg</span>
                    <span className="font-mono w-20 text-right text-xs text-amber-200">¥{formatMoney(t.value)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-ink-700/60 px-5 py-3">
              <ArrowRightLeft size={16} className="text-moss-300" />
              <h3 className="font-display text-lg tracking-wide text-ink-100">分拣记录</h3>
            </div>
            <div className="max-h-[420px] space-y-3 overflow-y-auto scrollbar-thin p-4">
              {sortRecords.slice(0, 12).map((r) => {
                const cat = categories.find((c) => c.id === r.categoryId);
                const meta = cat ? CATEGORY_META[cat.type] : null;
                return (
                  <div key={r.id} className="relative pl-4">
                    <span
                      className="absolute left-0 top-1.5 h-2 w-2 rounded-full"
                      style={{ backgroundColor: meta?.color }}
                    />
                    <span className="absolute left-[3px] top-4 h-full w-px bg-ink-700/40" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-100">{r.categoryName}</span>
                      <Badge tone="neutral">{r.targetLocation}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {r.quantity} {r.unit === "kg" ? "kg" : "件"} · {r.operator}
                    </p>
                    <p className="font-mono text-[10px] text-ink-500">
                      {new Date(r.createdAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
  unit?: string;
  tone: "moss" | "amber" | "sky" | "brick";
}) {
  const toneMap = {
    moss: "text-moss-300 bg-moss-300/10",
    amber: "text-amber-300 bg-amber-300/10",
    sky: "text-sky-300 bg-sky-400/10",
    brick: "text-brick-300 bg-brick-400/10",
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

import { useState, useMemo } from "react";
import {
  Plus,
  ChevronDown,
  Truck,
  CheckCircle2,
  FileText,
  Banknote,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useStore } from "@/store";
import type { SalesOrder, SalesStatus } from "@/lib/types";
import { CATEGORY_META, formatMoney, formatWeight } from "@/lib/format";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import CreateSalesOrderModal from "@/components/sales/CreateSalesOrderModal";
import { cn } from "@/lib/utils";

const STATUS_META: Record<SalesStatus, { label: string; tone: "neutral" | "sky" | "moss" }> = {
  draft: { label: "草稿", tone: "neutral" },
  shipped: { label: "已出库", tone: "sky" },
  settled: { label: "已结算", tone: "moss" },
};

export default function Sales() {
  const salesOrders = useStore((s) => s.salesOrders);
  const updateSalesStatus = useStore((s) => s.updateSalesStatus);
  const [createOpen, setCreateOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sorted = useMemo(
    () => [...salesOrders].sort((a, b) => b.createdAt - a.createdAt),
    [salesOrders]
  );

  const stats = useMemo(() => {
    const settled = salesOrders.filter((s) => s.status === "settled");
    const pending = salesOrders.filter((s) => s.status === "shipped");
    const receivable = pending.reduce((s, o) => s + o.totalAmount, 0);
    const settledAmount = settled.reduce((s, o) => s + o.totalAmount, 0);
    return { receivable, settledAmount, settledCount: settled.length, pendingCount: pending.length };
  }, [salesOrders]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Clock} label="待结算应收" value={`¥${formatMoney(stats.receivable)}`} tone="amber" />
        <StatTile icon={CheckCircle2} label="已结算收入" value={`¥${formatMoney(stats.settledAmount)}`} tone="moss" />
        <StatTile icon={Truck} label="已出库待结" value={`${stats.pendingCount}`} unit="单" tone="sky" />
        <StatTile icon={TrendingUp} label="累计结算" value={`${stats.settledCount}`} unit="单" tone="fuchsia" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-700/60 px-5 py-4">
          <SectionHeader title="出货单列表" description="按状态流转：草稿 → 已出库 → 已结算" className="!mb-0" />
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus size={16} /> 创建出货单
          </button>
        </div>
        <div className="divide-y divide-ink-700/40">
          {sorted.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              expanded={expanded.has(order.id)}
              onToggle={() => toggle(order.id)}
              onStatus={(s) => updateSalesStatus(order.id, s)}
            />
          ))}
          {sorted.length === 0 && (
            <div className="flex h-40 items-center justify-center text-sm text-ink-400">
              <FileText size={28} className="mr-2 opacity-40" /> 暂无出货单
            </div>
          )}
        </div>
      </div>

      <CreateSalesOrderModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function OrderRow({
  order,
  expanded,
  onToggle,
  onStatus,
}: {
  order: SalesOrder;
  expanded: boolean;
  onToggle: () => void;
  onStatus: (s: SalesStatus) => void;
}) {
  const meta = STATUS_META[order.status];
  return (
    <div className="transition-colors hover:bg-ink-750/30">
      <button onClick={onToggle} className="flex w-full items-center gap-4 px-5 py-3.5 text-left">
        <ChevronDown size={16} className={cn("shrink-0 text-ink-400 transition-transform", expanded && "rotate-180")} />
        <div className="w-32 shrink-0">
          <p className="font-mono text-sm text-ink-100">{order.id}</p>
          <p className="text-[11px] text-ink-400">{new Date(order.createdAt).toLocaleDateString("zh-CN")}</p>
        </div>
        <div className="w-40 shrink-0">
          <p className="text-sm font-medium text-ink-100">{order.buyerName}</p>
          {order.buyerContact && <p className="font-mono text-[11px] text-ink-400">{order.buyerContact}</p>}
        </div>
        <div className="hidden flex-1 lg:block">
          <div className="flex flex-wrap gap-1">
            {order.lines.slice(0, 3).map((l, i) => {
              const parts = l.categoryId.split("_");
              const type = parts[1] as keyof typeof CATEGORY_META;
              const cm = CATEGORY_META[type];
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]"
                  style={{ borderColor: `${cm.color}40`, color: cm.color, backgroundColor: `${cm.color}10` }}
                >
                  {l.categoryName} ×{l.quantity}
                </span>
              );
            })}
            {order.lines.length > 3 && <span className="text-[10px] text-ink-400">+{order.lines.length - 3}</span>}
          </div>
        </div>
        <div className="w-28 shrink-0 text-right">
          <p className="font-mono text-base font-semibold text-amber-200">¥{formatMoney(order.totalAmount)}</p>
          {order.totalWeightKg > 0 && <p className="text-[11px] text-ink-400">{formatWeight(order.totalWeightKg)} kg</p>}
        </div>
        <div className="w-20 shrink-0 text-right">
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </div>
      </button>

      {expanded && (
        <div className="animate-[fade-up_0.2s_ease-out] border-t border-ink-700/40 bg-ink-900/30 px-5 py-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-ink-400">出货明细</p>
              <div className="overflow-hidden rounded-lg border border-ink-700/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ink-800/60 text-xs text-ink-400">
                      <th className="px-3 py-2 text-left font-medium">品类</th>
                      <th className="px-3 py-2 text-center font-medium">单位</th>
                      <th className="px-3 py-2 text-right font-medium">数量</th>
                      <th className="px-3 py-2 text-right font-medium">单价</th>
                      <th className="px-3 py-2 text-right font-medium">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.lines.map((l, i) => {
                      const parts = l.categoryId.split("_");
                      const type = parts[1] as keyof typeof CATEGORY_META;
                      const cm = CATEGORY_META[type];
                      return (
                        <tr key={i} className="border-t border-ink-700/40">
                          <td className="px-3 py-2 text-ink-100">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cm.color }} />
                              {l.categoryName}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-xs text-ink-400">{l.unit === "kg" ? "公斤" : "个"}</td>
                          <td className="px-3 py-2 text-right font-mono text-ink-200">{l.quantity}</td>
                          <td className="px-3 py-2 text-right font-mono text-ink-200">¥{formatMoney(l.unitPrice)}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-amber-200">¥{formatMoney(l.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-ink-700/60 bg-ink-800/40">
                      <td colSpan={4} className="px-3 py-2 text-right text-xs text-ink-400">合计</td>
                      <td className="px-3 py-2 text-right font-mono text-base font-bold text-amber-200">¥{formatMoney(order.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {order.note && (
                <p className="mt-2 text-xs text-ink-400">备注：{order.note}</p>
              )}
              {order.settledAt && (
                <p className="mt-1 text-xs text-moss-300">结算时间：{new Date(order.settledAt).toLocaleString("zh-CN")}</p>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-ink-400">状态流转</p>
              <div className="flex items-center gap-1">
                {(["draft", "shipped", "settled"] as const).map((s, i) => {
                  const m = STATUS_META[s];
                  const reached =
                    (order.status === "draft" && i === 0) ||
                    (order.status === "shipped" && i <= 1) ||
                    (order.status === "settled" && i <= 2);
                  return (
                    <div key={s} className="flex flex-1 items-center">
                      <div className={cn("flex-1 rounded-md border px-2 py-1.5 text-center text-[11px]", reached ? "border-moss-300/40 bg-moss-300/10 text-moss-200" : "border-ink-600 bg-ink-800/40 text-ink-500")}>
                        {m.label}
                      </div>
                      {i < 2 && <div className={cn("h-px w-3", reached ? "bg-moss-300/40" : "bg-ink-600")} />}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                {order.status === "draft" && (
                  <button onClick={() => onStatus("shipped")} className="btn-amber w-full">
                    <Truck size={15} /> 确认出库
                  </button>
                )}
                {order.status === "shipped" && (
                  <button onClick={() => onStatus("settled")} className="btn-primary w-full">
                    <CheckCircle2 size={15} /> 标记已结算
                  </button>
                )}
                {order.status !== "draft" && (
                  <button onClick={() => onStatus("draft")} className="btn-ghost w-full text-xs">
                    退回草稿
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
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

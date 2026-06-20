import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import {
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Lock,
  CalendarDays,
  Scale,
  PackageCheck,
  CheckCircle2,
  History,
} from "lucide-react";
import { useStore } from "@/store";
import { CATEGORY_META, formatMoney, formatWeight } from "@/lib/format";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

function dateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayStr(): string {
  return dateStr(Date.now());
}

export default function Settlement() {
  const transactions = useStore((s) => s.transactions);
  const salesOrders = useStore((s) => s.salesOrders);
  const settlements = useStore((s) => s.settlements);
  const lockSettlement = useStore((s) => s.lockSettlement);

  const [selectedDate, setSelectedDate] = useState(todayStr());

  const dayData = useMemo(() => {
    const intakeTx = transactions.filter(
      (t) => t.status === "active" && dateStr(t.createdAt) === selectedDate
    );
    const payable = intakeTx.reduce((s, t) => s + t.totalAmount, 0);
    const intakeWeight = intakeTx.reduce((s, t) => s + t.totalWeightKg, 0);
    const sales = salesOrders.filter((o) => {
      if (o.status === "draft") return false;
      return dateStr(o.settledAt ?? o.createdAt) === selectedDate;
    });
    const receivable = sales.reduce((s, o) => s + o.totalAmount, 0);
    const salesWeight = sales.reduce((s, o) => s + o.totalWeightKg, 0);

    const catMap = new Map<string, { name: string; intake: number; sales: number; color: string }>();
    for (const t of intakeTx) {
      for (const line of t.lines) {
        const type = line.categoryId.split("_")[1] as keyof typeof CATEGORY_META;
        const cm = CATEGORY_META[type];
        const entry = catMap.get(type) ?? { name: cm.label, intake: 0, sales: 0, color: cm.color };
        entry.intake += line.amount;
        catMap.set(type, entry);
      }
    }
    for (const o of sales) {
      for (const line of o.lines) {
        const type = line.categoryId.split("_")[1] as keyof typeof CATEGORY_META;
        const cm = CATEGORY_META[type];
        const entry = catMap.get(type) ?? { name: cm.label, intake: 0, sales: 0, color: cm.color };
        entry.sales += line.amount;
        catMap.set(type, entry);
      }
    }
    const byCat = Array.from(catMap.entries()).map(([type, v]) => ({
      type,
      name: v.name,
      intake: Math.round(v.intake * 100) / 100,
      sales: Math.round(v.sales * 100) / 100,
      color: v.color,
    }));
    const grossProfit = Math.round((receivable - payable) * 100) / 100;
    return {
      payable,
      receivable,
      grossProfit,
      intakeWeight,
      salesWeight,
      intakeCount: intakeTx.length,
      salesCount: sales.length,
      byCat,
      sales,
      intakeTx,
    };
  }, [transactions, salesOrders, selectedDate]);

  const locked = settlements.find((s) => s.date === selectedDate && s.locked);

  const handleLock = () => {
    lockSettlement(selectedDate, {
      payable: dayData.payable,
      receivable: dayData.receivable,
      grossProfit: dayData.grossProfit,
      intakeCount: dayData.intakeCount,
      salesCount: dayData.salesCount,
      totalWeightKg: dayData.intakeWeight + dayData.salesWeight,
    });
  };

  return (
    <div className="space-y-5">
      {/* Date selector */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-300/10 text-amber-300">
            <CalendarDays size={18} />
          </div>
          <div>
            <p className="text-xs text-ink-400">对账日期</p>
            <input
              type="date"
              value={selectedDate}
              max={todayStr()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-display text-2xl tracking-wide text-ink-100 outline-none [color-scheme:dark]"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {locked ? (
            <Badge tone="moss">
              <Lock size={11} /> 已锁定对账
            </Badge>
          ) : (
            <Badge tone="amber">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-amber-300" /> 待对账
            </Badge>
          )}
          <button onClick={handleLock} disabled={!!locked} className="btn-primary">
            <Lock size={15} /> {locked ? "已锁定" : "锁定对账"}
          </button>
        </div>
      </div>

      {/* Big summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SummaryBig
          icon={ArrowDownLeft}
          label="入库应付"
          value={dayData.payable}
          sub={`${dayData.intakeCount} 笔 · ${formatWeight(dayData.intakeWeight)} kg`}
          tone="brick"
        />
        <SummaryBig
          icon={ArrowUpRight}
          label="出货应收"
          value={dayData.receivable}
          sub={`${dayData.salesCount} 笔 · ${formatWeight(dayData.salesWeight)} kg`}
          tone="moss"
        />
        <SummaryBig
          icon={TrendingUp}
          label="毛利"
          value={dayData.grossProfit}
          sub={`毛利率 ${dayData.receivable > 0 ? Math.round((dayData.grossProfit / dayData.receivable) * 100) : 0}%`}
          tone={dayData.grossProfit >= 0 ? "amber" : "brick"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        {/* By category chart */}
        <div className="card p-5">
          <SectionHeader title="品类毛利构成" description="当日各品类入库成本与销售毛利对照" />
          <div className="mt-4 h-72">
            {dayData.byCat.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-ink-400">当日无品类数据</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayData.byCat} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(146,158,130,0.12)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#939E82", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(146,158,130,0.15)" }} />
                  <YAxis tick={{ fill: "#6E7860", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `¥${v}`} />
                  <Tooltip
                    cursor={{ fill: "rgba(146,158,130,0.08)" }}
                    contentStyle={{
                      background: "#1F231B",
                      border: "1px solid #31361C",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#D6DBC8" }}
                    formatter={(v: number, name: string) => [`¥${formatMoney(v)}`, name === "intake" ? "入库成本" : "销售收入"]}
                  />
                  <Bar dataKey="intake" name="intake" fill="#C24D4D" radius={[3, 3, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="sales" name="sales" radius={[3, 3, 0, 0]} maxBarSize={48}>
                    {dayData.byCat.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-ink-300">
              <span className="h-2 w-3 rounded-sm bg-brick-400" /> 入库成本
            </span>
            <span className="flex items-center gap-1.5 text-ink-300">
              <span className="h-2 w-3 rounded-sm bg-moss-300" /> 销售收入
            </span>
          </div>
        </div>

        {/* Settlement history */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink-700/60 px-5 py-3">
            <History size={16} className="text-ink-400" />
            <h3 className="font-display text-lg tracking-wide text-ink-100">历史对账</h3>
          </div>
          <div className="max-h-[480px] space-y-2 overflow-y-auto scrollbar-thin p-3">
            {[...settlements].sort((a, b) => b.date.localeCompare(a.date)).map((st) => {
              const isSel = st.date === selectedDate;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedDate(st.date)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    isSel ? "border-moss-300/40 bg-moss-300/10" : "border-ink-700/50 bg-ink-800/40 hover:border-ink-500/60"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-ink-100">{st.date}</span>
                    {st.locked && <Lock size={12} className="text-moss-300" />}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-ink-400">应付</p>
                      <p className="font-mono text-xs text-brick-300">¥{formatMoney(st.payable)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-400">应收</p>
                      <p className="font-mono text-xs text-moss-300">¥{formatMoney(st.receivable)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-400">毛利</p>
                      <p className={cn("font-mono text-xs", st.grossProfit >= 0 ? "text-amber-200" : "text-brick-300")}>
                        ¥{formatMoney(st.grossProfit)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-ink-500">
                    {st.intakeCount} 笔入库 · {st.salesCount} 笔出货 · {formatWeight(st.totalWeightKg)}kg
                  </p>
                </button>
              );
            })}
            {settlements.length === 0 && (
              <div className="flex h-32 items-center justify-center text-xs text-ink-400">暂无历史对账</div>
            )}
          </div>
        </div>
      </div>

      {/* Detail breakdown */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink-700/60 px-5 py-3">
            <Scale size={15} className="text-brick-300" />
            <h3 className="font-display text-lg tracking-wide text-ink-100">入库应付明细</h3>
            <span className="ml-auto text-xs text-ink-400">{dayData.intakeTx.length} 笔</span>
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <tbody>
                {dayData.intakeTx.map((tx) => (
                  <tr key={tx.id} className="border-b border-ink-700/30 table-row-hover">
                    <td className="px-5 py-2.5 font-mono text-xs text-ink-300">
                      {new Date(tx.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2.5 text-ink-100">{tx.customerName}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-ink-300">{formatWeight(tx.totalWeightKg)}kg</td>
                    <td className="px-5 py-2.5 text-right font-mono font-semibold text-brick-300">-¥{formatMoney(tx.totalAmount)}</td>
                  </tr>
                ))}
                {dayData.intakeTx.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-ink-400">当日无入库</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink-700/60 px-5 py-3">
            <PackageCheck size={15} className="text-moss-300" />
            <h3 className="font-display text-lg tracking-wide text-ink-100">出货应收明细</h3>
            <span className="ml-auto text-xs text-ink-400">{dayData.sales.length} 笔</span>
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <tbody>
                {dayData.sales.map((o) => (
                  <tr key={o.id} className="border-b border-ink-700/30 table-row-hover">
                    <td className="px-5 py-2.5 font-mono text-xs text-ink-300">
                      {new Date(o.settledAt ?? o.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2.5 text-ink-100">{o.buyerName}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-ink-300">{formatWeight(o.totalWeightKg)}kg</td>
                    <td className="px-5 py-2.5 text-right font-mono font-semibold text-moss-300">+¥{formatMoney(o.totalAmount)}</td>
                  </tr>
                ))}
                {dayData.sales.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-ink-400">当日无出货</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBig({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Banknote;
  label: string;
  value: number;
  sub: string;
  tone: "brick" | "moss" | "amber";
}) {
  const toneMap = {
    brick: { ring: "border-brick-400/30", icon: "bg-brick-400/10 text-brick-300", glow: "shadow-[0_0_40px_-12px_rgba(194,77,77,0.4)]" },
    moss: { ring: "border-moss-300/30", icon: "bg-moss-300/10 text-moss-300", glow: "shadow-[0_0_40px_-12px_rgba(124,163,95,0.4)]" },
    amber: { ring: "border-amber-300/30", icon: "bg-amber-300/10 text-amber-300", glow: "shadow-[0_0_40px_-12px_rgba(232,163,61,0.4)]" },
  };
  const t = toneMap[tone];
  return (
    <div className={cn("card relative overflow-hidden p-5", t.ring, t.glow)}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-ink-400">{label}</p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", t.icon)}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-3 font-display text-4xl tracking-wide text-ink-100">
        ¥{formatMoney(value)}
      </p>
      <p className="mt-1 text-xs text-ink-400">{sub}</p>
      {value > 0 && <CheckCircle2 size={14} className="absolute right-4 top-4 opacity-0" />}
    </div>
  );
}

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  Package,
  Users,
  BarChart3,
  Filter,
} from "lucide-react";
import { useStore } from "@/store";
import { CATEGORY_META, formatMoney } from "@/lib/format";
import {
  aggregateProfitByCategory,
  aggregateProfitByBuyer,
  aggregateProfitByDay,
} from "@/lib/selectors";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

type ViewMode = "category" | "buyer" | "trend";
type DateRange = "7d" | "30d" | "90d" | "all";

const DATE_RANGE_DAYS: Record<DateRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "all": 365,
};

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  "7d": "近7天",
  "30d": "近30天",
  "90d": "近90天",
  "all": "全部",
};

export default function ProfitReport() {
  const salesOrders = useStore((s) => s.salesOrders);
  const categories = useStore((s) => s.categories);
  const customers = useStore((s) => s.customers);

  const [viewMode, setViewMode] = useState<ViewMode>("category");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [selectedBuyer, setSelectedBuyer] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const endDate = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const startDate = useMemo(() => {
    if (dateRange === "all") return "";
    const d = new Date();
    d.setDate(d.getDate() - DATE_RANGE_DAYS[dateRange] + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [dateRange]);

  const filteredOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      if (order.status === "draft") return false;

      const orderDate = new Date(order.settledAt ?? order.createdAt);
      const dateStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}-${String(orderDate.getDate()).padStart(2, "0")}`;

      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      if (selectedBuyer && order.buyerId !== selectedBuyer) return false;
      if (selectedCategory) {
        const hasCategory = order.lines.some((l) => l.categoryId === selectedCategory);
        if (!hasCategory) return false;
      }

      return true;
    });
  }, [salesOrders, startDate, endDate, selectedBuyer, selectedCategory]);

  const summary = useMemo(() => {
    const totalSales = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalCost = filteredOrders.reduce((s, o) => s + o.totalCost, 0);
    const totalProfit = filteredOrders.reduce((s, o) => s + o.totalGrossProfit, 0);
    const avgMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

    return {
      totalSales: Math.round(totalSales * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      avgMargin: Math.round(avgMargin * 100) / 100,
      orderCount: filteredOrders.length,
    };
  }, [filteredOrders]);

  const profitByCategory = useMemo(
    () => aggregateProfitByCategory(filteredOrders, { categoryId: selectedCategory || undefined }),
    [filteredOrders, selectedCategory]
  );

  const profitByBuyer = useMemo(
    () => aggregateProfitByBuyer(filteredOrders, { categoryId: selectedCategory || undefined }),
    [filteredOrders, selectedCategory]
  );

  const profitByDay = useMemo(
    () => aggregateProfitByDay(filteredOrders, DATE_RANGE_DAYS[dateRange]),
    [filteredOrders, dateRange]
  );

  const leafCategories = categories.filter((c) => c.parentId !== null);
  const buyers = customers.filter((c) => c.type === "buyer");

  const chartData = useMemo(() => {
    if (viewMode === "category") {
      return profitByCategory.map((item) => {
        const cm = CATEGORY_META[item.type];
        return {
          name: item.categoryName,
          sales: item.salesAmount,
          cost: item.costAmount,
          profit: item.grossProfit,
          color: cm?.color || "#888",
        };
      });
    }
    if (viewMode === "buyer") {
      return profitByBuyer.map((item, idx) => {
        const colors = ["#C9A86A", "#7BA3D4", "#A9B0BD", "#E8A33D", "#C77FB0"];
        return {
          name: item.buyerName,
          sales: item.salesAmount,
          cost: item.costAmount,
          profit: item.grossProfit,
          color: colors[idx % colors.length],
        };
      });
    }
    return profitByDay.map((item) => ({
      name: item.label,
      sales: item.salesAmount,
      cost: item.costAmount,
      profit: item.grossProfit,
      color: "#7CA36D",
    }));
  }, [viewMode, profitByCategory, profitByBuyer, profitByDay]);

  return (
    <div className="space-y-5">
      {/* Header with filters */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-300/10 text-amber-300">
            <TrendingUp size={18} />
          </div>
          <div>
            <h2 className="font-display text-xl tracking-wide text-ink-100">利润核算报表</h2>
            <p className="text-xs text-ink-400">按品类、客户、时间维度分析进销差价与毛利</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date range selector */}
          <div className="flex items-center gap-1 rounded-lg border border-ink-700/50 bg-ink-800/40 p-1">
            {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  dateRange === range
                    ? "bg-moss-300/15 text-moss-200"
                    : "text-ink-400 hover:text-ink-200"
                )}
              >
                {DATE_RANGE_LABELS[range]}
              </button>
            ))}
          </div>

          {/* Filter icon + dropdowns */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-ink-400" />
            <select
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
              className="input !py-1.5 !text-xs"
            >
              <option value="">全部客户</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input !py-1.5 !text-xs"
            >
              <option value="">全部品类</option>
              {leafCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          icon={ShoppingCart}
          label="销售总额"
          value={`¥${formatMoney(summary.totalSales)}`}
          tone="moss"
          sub={`${summary.orderCount} 笔订单`}
        />
        <StatCard
          icon={DollarSign}
          label="成本总额"
          value={`¥${formatMoney(summary.totalCost)}`}
          tone="brick"
          sub="进货成本"
        />
        <StatCard
          icon={TrendingUp}
          label="毛利总额"
          value={`¥${formatMoney(summary.totalProfit)}`}
          tone="amber"
          sub={summary.totalProfit >= 0 ? "盈利" : "亏损"}
        />
        <StatCard
          icon={Percent}
          label="平均毛利率"
          value={`${summary.avgMargin}%`}
          tone="sky"
          sub="毛利 / 销售额"
        />
        <StatCard
          icon={Package}
          label="订单数量"
          value={`${summary.orderCount}`}
          tone="fuchsia"
          unit="笔"
        />
      </div>

      {/* View mode tabs */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setViewMode("category")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            viewMode === "category"
              ? "bg-moss-300/15 text-moss-200"
              : "text-ink-400 hover:bg-ink-800/40 hover:text-ink-200"
          )}
        >
          <Package size={16} /> 按品类
        </button>
        <button
          onClick={() => setViewMode("buyer")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            viewMode === "buyer"
              ? "bg-moss-300/15 text-moss-200"
              : "text-ink-400 hover:bg-ink-800/40 hover:text-ink-200"
          )}
        >
          <Users size={16} /> 按客户
        </button>
        <button
          onClick={() => setViewMode("trend")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            viewMode === "trend"
              ? "bg-moss-300/15 text-moss-200"
              : "text-ink-400 hover:bg-ink-800/40 hover:text-ink-200"
          )}
        >
          <BarChart3 size={16} /> 趋势图
        </button>
      </div>

      {/* Chart section */}
      <div className="card p-5">
        <SectionHeader
          title={
            viewMode === "category"
              ? "品类利润分析"
              : viewMode === "buyer"
              ? "客户利润分析"
              : "利润趋势分析"
          }
          description={
            viewMode === "category"
              ? "各品类销售金额、成本与毛利对比"
              : viewMode === "buyer"
              ? "各买家销售贡献与利润贡献"
              : "每日销售、成本与毛利变化趋势"
          }
        />
        <div className="mt-4 h-80">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-ink-400">
              暂无数据
            </div>
          ) : viewMode === "trend" ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(146,158,130,0.12)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#939E82", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(146,158,130,0.15)" }} />
                <YAxis tick={{ fill: "#6E7860", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `¥${v}`} />
                <Tooltip
                  contentStyle={{
                    background: "#1F231B",
                    border: "1px solid #31361C",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#D6DBC8" }}
                  formatter={(v: number, name: string) => [`¥${formatMoney(v)}`, name === "sales" ? "销售额" : name === "cost" ? "成本" : "毛利"]}
                />
                <Legend />
                <Line type="monotone" dataKey="sales" name="销售额" stroke="#7CA36D" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cost" name="成本" stroke="#C24D4D" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="profit" name="毛利" stroke="#E8A33D" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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
                  formatter={(v: number, name: string) => [`¥${formatMoney(v)}`, name === "sales" ? "销售额" : name === "cost" ? "成本" : "毛利"]}
                />
                <Legend />
                <Bar dataKey="sales" name="销售额" radius={[3, 3, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
                <Bar dataKey="cost" name="成本" fill="#C24D4D" radius={[3, 3, 0, 0]} maxBarSize={48} />
                <Bar dataKey="profit" name="毛利" fill="#E8A33D" radius={[3, 3, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Detail table */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-ink-700/60 px-5 py-3">
          <SectionHeader
            title={
              viewMode === "category"
                ? "品类利润明细"
                : viewMode === "buyer"
                ? "客户利润明细"
                : "每日利润明细"
            }
            description="详细的利润构成数据"
            className="!mb-0"
          />
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-ink-800/80 backdrop-blur">
              <tr className="text-xs text-ink-400">
                {viewMode === "category" && (
                  <>
                    <th className="px-5 py-2.5 text-left font-medium">品类</th>
                    <th className="px-3 py-2.5 text-right font-medium">销售数量</th>
                    <th className="px-3 py-2.5 text-right font-medium">销售额</th>
                    <th className="px-3 py-2.5 text-right font-medium">成本</th>
                    <th className="px-3 py-2.5 text-right font-medium">毛利</th>
                    <th className="px-5 py-2.5 text-right font-medium">毛利率</th>
                  </>
                )}
                {viewMode === "buyer" && (
                  <>
                    <th className="px-5 py-2.5 text-left font-medium">客户名称</th>
                    <th className="px-3 py-2.5 text-right font-medium">订单数</th>
                    <th className="px-3 py-2.5 text-right font-medium">销售额</th>
                    <th className="px-3 py-2.5 text-right font-medium">成本</th>
                    <th className="px-3 py-2.5 text-right font-medium">毛利</th>
                    <th className="px-5 py-2.5 text-right font-medium">毛利率</th>
                  </>
                )}
                {viewMode === "trend" && (
                  <>
                    <th className="px-5 py-2.5 text-left font-medium">日期</th>
                    <th className="px-3 py-2.5 text-right font-medium">订单数</th>
                    <th className="px-3 py-2.5 text-right font-medium">销售额</th>
                    <th className="px-3 py-2.5 text-right font-medium">成本</th>
                    <th className="px-3 py-2.5 text-right font-medium">毛利</th>
                    <th className="px-5 py-2.5 text-right font-medium">毛利率</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {viewMode === "category" &&
                profitByCategory.map((item) => {
                  const cm = CATEGORY_META[item.type];
                  return (
                    <tr key={item.categoryId} className="border-b border-ink-700/30 table-row-hover">
                      <td className="px-5 py-2.5">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cm?.color }} />
                          <span className="text-ink-100">{item.categoryName}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-ink-300">
                        {item.quantity}
                        {item.unit === "kg" ? " kg" : " 件"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-moss-300">¥{formatMoney(item.salesAmount)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-brick-300">¥{formatMoney(item.costAmount)}</td>
                      <td className={cn("px-3 py-2.5 text-right font-mono font-semibold", item.grossProfit >= 0 ? "text-amber-200" : "text-brick-300")}>
                        ¥{formatMoney(item.grossProfit)}
                      </td>
                      <td className={cn("px-5 py-2.5 text-right font-mono", item.grossMargin >= 0 ? "text-amber-200" : "text-brick-300")}>
                        {item.grossMargin}%
                      </td>
                    </tr>
                  );
                })}
              {viewMode === "buyer" &&
                profitByBuyer.map((item) => (
                  <tr key={item.buyerId} className="border-b border-ink-700/30 table-row-hover">
                    <td className="px-5 py-2.5 text-ink-100">{item.buyerName}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-ink-300">{item.orderCount} 笔</td>
                    <td className="px-3 py-2.5 text-right font-mono text-moss-300">¥{formatMoney(item.salesAmount)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-brick-300">¥{formatMoney(item.costAmount)}</td>
                    <td className={cn("px-3 py-2.5 text-right font-mono font-semibold", item.grossProfit >= 0 ? "text-amber-200" : "text-brick-300")}>
                      ¥{formatMoney(item.grossProfit)}
                    </td>
                    <td className={cn("px-5 py-2.5 text-right font-mono", item.grossMargin >= 0 ? "text-amber-200" : "text-brick-300")}>
                      {item.grossMargin}%
                    </td>
                  </tr>
                ))}
              {viewMode === "trend" &&
                [...profitByDay].reverse().map((item) => (
                  <tr key={item.date} className="border-b border-ink-700/30 table-row-hover">
                    <td className="px-5 py-2.5 font-mono text-ink-100">{item.date}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-ink-300">{item.orderCount} 笔</td>
                    <td className="px-3 py-2.5 text-right font-mono text-moss-300">¥{formatMoney(item.salesAmount)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-brick-300">¥{formatMoney(item.costAmount)}</td>
                    <td className={cn("px-3 py-2.5 text-right font-mono font-semibold", item.grossProfit >= 0 ? "text-amber-200" : "text-brick-300")}>
                      ¥{formatMoney(item.grossProfit)}
                    </td>
                    <td className={cn("px-5 py-2.5 text-right font-mono", item.grossMargin >= 0 ? "text-amber-200" : "text-brick-300")}>
                      {item.grossMargin}%
                    </td>
                  </tr>
                ))}
              {((viewMode === "category" && profitByCategory.length === 0) ||
                (viewMode === "buyer" && profitByBuyer.length === 0) ||
                (viewMode === "trend" && profitByDay.every((d) => d.orderCount === 0))) && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-ink-400">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  unit,
  tone,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  sub?: string;
  unit?: string;
  tone: "moss" | "amber" | "sky" | "fuchsia" | "brick";
}) {
  const toneMap = {
    moss: "text-moss-300 bg-moss-300/10",
    amber: "text-amber-300 bg-amber-300/10",
    sky: "text-sky-300 bg-sky-400/10",
    fuchsia: "text-fuchsia-300 bg-fuchsia-400/10",
    brick: "text-brick-300 bg-brick-400/10",
  };
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", toneMap[tone])}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-ink-400">{label}</p>
        <p className="truncate font-mono text-lg font-semibold text-ink-100">
          {value}
          {unit && <span className="ml-1 text-xs font-normal text-ink-400">{unit}</span>}
        </p>
        {sub && <p className="truncate text-[11px] text-ink-400">{sub}</p>}
      </div>
    </div>
  );
}

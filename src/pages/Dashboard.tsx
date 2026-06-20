import { useNavigate } from "react-router-dom";
import {
  Scale,
  Receipt,
  Banknote,
  Boxes,
  Truck,
  Tags,
  PackageCheck,
  ArrowRight,
  MapPin,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { useStore } from "@/store";
import { printReceipt } from "@/store/print";
import StatCard from "@/components/ui/StatCard";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import TrendChart from "@/components/dashboard/TrendChart";
import CategoryDonut from "@/components/dashboard/CategoryDonut";
import {
  aggregateByDay,
  aggregateByCategoryType,
  todayIntake,
  totalInventoryWeight,
  totalInventoryValue,
  isToday,
} from "@/lib/selectors";
import { formatMoney, formatWeight, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const QUICK = [
  { label: "到站交售", desc: "称重入库", icon: Scale, to: "/intake", iconCls: "bg-moss-400/10 text-moss-300" },
  { label: "上门预约", desc: "新建调度", icon: Truck, to: "/appointments", iconCls: "bg-amber-300/10 text-amber-300" },
  { label: "调价", desc: "浮动定价", icon: Tags, to: "/pricing", iconCls: "bg-sky-400/10 text-sky-300" },
  { label: "出货", desc: "创建出货单", icon: PackageCheck, to: "/sales", iconCls: "bg-fuchsia-400/10 text-fuchsia-300" },
] as const;

const STATUS_TONE = {
  pending: "amber",
  dispatched: "sky",
  completed: "moss",
  cancelled: "brick",
} as const;

const STATUS_LABEL = {
  pending: "待派单",
  dispatched: "进行中",
  completed: "已完成",
  cancelled: "已取消",
} as const;

export default function Dashboard() {
  const navigate = useNavigate();
  const transactions = useStore((s) => s.transactions);
  const inventory = useStore((s) => s.inventory);
  const categories = useStore((s) => s.categories);
  const appointments = useStore((s) => s.appointments);
  const salesOrders = useStore((s) => s.salesOrders);

  const trend = aggregateByDay(transactions, 14);
  const catAgg = aggregateByCategoryType(transactions);
  const today = todayIntake(transactions);
  const todayAmount = today.reduce((s, t) => s + t.totalAmount, 0);
  const todayWeight = today.reduce((s, t) => s + t.totalWeightKg, 0);
  const invWeight = totalInventoryWeight(inventory);
  const invValue = totalInventoryValue(inventory, categories);
  const pendingAppts = appointments.filter((a) => a.status === "pending" || a.status === "dispatched");
  const todaySales = salesOrders.filter((s) => s.status !== "draft" && isToday(s.settledAt ?? s.createdAt));
  const todaySalesAmount = todaySales.reduce((s, o) => s + o.totalAmount, 0);
  const lowStock = inventory.filter((b) => b.weightKg / b.capacityKg >= 0.85).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Hero strip */}
      <div className="relative overflow-hidden rounded-2xl border border-ink-700/60 bg-gradient-to-br from-ink-850 via-ink-800 to-ink-850 p-6 shadow-panel">
        <div className="absolute inset-0 bg-noise opacity-60" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-moss-300/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-moss-300/30 bg-moss-300/10 px-3 py-1 text-xs text-moss-200">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-moss-300" />
              实时运营中 · 当日数据
            </div>
            <h2 className="font-display text-4xl tracking-wide text-ink-100">
              今日入库 <span className="text-moss-300">{formatWeight(todayWeight)}</span> kg
            </h2>
            <p className="mt-1 text-sm text-ink-300">
              {formatNumber(today.length)} 笔交易 · 应付 ¥{formatMoney(todayAmount)} · 出货应收 ¥{formatMoney(todaySalesAmount)}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/intake")} className="btn-primary">
              <Scale size={16} /> 开始称重
            </button>
            <button onClick={() => navigate("/appointments")} className="btn-ghost">
              <Truck size={16} /> 预约看板
            </button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="今日应付金额"
          value={todayAmount}
          prefix="¥"
          icon={Banknote}
          tone="amber"
          delta={12}
          deltaLabel="较昨日"
        />
        <StatCard
          label="今日入库重量"
          value={todayWeight}
          unit="kg"
          icon={Scale}
          tone="moss"
          delta={8}
          deltaLabel="较昨日"
        />
        <StatCard
          label="库存总量"
          value={invWeight}
          unit="kg"
          icon={Boxes}
          tone="sky"
          deltaLabel={`估值 ¥${formatMoney(invValue)}`}
        />
        <StatCard
          label="待办预约"
          value={pendingAppts.length}
          unit="单"
          icon={Truck}
          tone="brick"
          delta={pendingAppts.length}
          deltaLabel="需处理"
          invertDelta
        />
      </div>

      {/* Trend + Donut */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <SectionHeader
            title="近 14 日入库趋势"
            description="入库重量（绿）与应付金额（琥珀）双轴对照"
            action={
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-ink-300">
                  <span className="h-2 w-4 rounded-sm bg-moss-300" /> 重量
                </span>
                <span className="flex items-center gap-1.5 text-ink-300">
                  <span className="h-2 w-4 rounded-sm bg-amber-300" /> 金额
                </span>
              </div>
            }
          />
          <div className="mt-4">
            <TrendChart data={trend} />
          </div>
        </div>
        <div className="card p-5">
          <SectionHeader title="品类构成" description="近 14 日按品类入库" />
          <div className="mt-5">
            <CategoryDonut data={catAgg} />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK.map((q) => {
          const Icon = q.icon;
          return (
            <button
              key={q.to}
              onClick={() => navigate(q.to)}
              className="group card card-hover flex items-center gap-3 p-4 text-left"
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-lg",
                  q.iconCls
                )}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-100">{q.label}</p>
                <p className="text-xs text-ink-400">{q.desc}</p>
              </div>
              <ArrowRight size={16} className="text-ink-500 transition-transform group-hover:translate-x-1 group-hover:text-ink-200" />
            </button>
          );
        })}
      </div>

      {/* Appointments + Recent tx */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Pending appointments */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between border-b border-ink-700/60 px-5 py-4">
            <h3 className="font-display text-lg tracking-wide text-ink-100">待处理上门预约</h3>
            <button onClick={() => navigate("/appointments")} className="text-xs text-moss-300 hover:underline">
              全部 →
            </button>
          </div>
          <div className="flex-1 space-y-2 p-3">
            {pendingAppts.slice(0, 4).map((a) => (
              <div
                key={a.id}
                className="group rounded-lg border border-ink-700/50 bg-ink-800/40 p-3 transition-colors hover:border-ink-500/60 hover:bg-ink-750/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink-100">{a.customerName}</span>
                  <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                </div>
                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-ink-300">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-ink-400" />
                  <span className="line-clamp-1">{a.address}</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-ink-400">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {new Date(a.appointmentTime).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-amber-200">预估 {a.estimatedWeight}kg</span>
                </div>
              </div>
            ))}
            {pendingAppts.length === 0 && (
              <div className="flex h-32 items-center justify-center text-sm text-ink-400">暂无待办预约</div>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-ink-700/60 px-5 py-4">
            <h3 className="font-display text-lg tracking-wide text-ink-100">今日交易流水</h3>
            <button onClick={() => navigate("/intake")} className="text-xs text-moss-300 hover:underline">
              全部 →
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700/60 text-xs text-ink-400">
                  <th className="px-5 py-2.5 text-left font-medium">时间</th>
                  <th className="px-3 py-2.5 text-left font-medium">客户</th>
                  <th className="px-3 py-2.5 text-left font-medium">品类</th>
                  <th className="px-3 py-2.5 text-right font-medium">重量</th>
                  <th className="px-3 py-2.5 text-right font-medium">金额</th>
                  <th className="px-5 py-2.5 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {today.slice(0, 6).map((tx) => (
                  <tr key={tx.id} className="border-b border-ink-700/40 table-row-hover">
                    <td className="px-5 py-2.5 font-mono text-xs text-ink-300">
                      {new Date(tx.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2.5 text-ink-100">{tx.customerName}</td>
                    <td className="px-3 py-2.5">
                      <span className="line-clamp-1 text-xs text-ink-300">
                        {tx.lines.map((l) => l.categoryName).join("、")}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-ink-200">{formatWeight(tx.totalWeightKg)}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-amber-200">¥{formatMoney(tx.totalAmount)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <button
                        onClick={() => printReceipt(tx)}
                        className="inline-flex items-center gap-1 text-xs text-ink-300 transition-colors hover:text-moss-300"
                      >
                        <Receipt size={13} /> 小票
                      </button>
                    </td>
                  </tr>
                ))}
                {today.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-ink-400">
                      今日暂无交易，前往称重入库开始第一笔
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="card flex items-center gap-4 border-amber-400/30 bg-amber-300/5 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-300/15 text-amber-300">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink-100">库存预警：以下库位容量已达 85% 以上</p>
            <p className="mt-0.5 text-xs text-ink-300">
              {lowStock.map((b) => {
                const c = categories.find((x) => x.id === b.categoryId);
                return `${c?.name ?? b.categoryId} ${b.location}`;
              }).join(" · ")}
            </p>
          </div>
          <button onClick={() => navigate("/sorting")} className="btn-ghost h-9">
            <TrendingUp size={15} /> 去出货
          </button>
        </div>
      )}
    </div>
  );
}

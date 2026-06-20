import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Tags,
  Scale,
  Truck,
  Boxes,
  PackageCheck,
  Calculator,
  TrendingUp,
  Recycle,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";

const NAV = [
  { to: "/dashboard", label: "工作台", icon: LayoutDashboard, hint: "今日运营总览" },
  { to: "/pricing", label: "定价管理", icon: Tags, hint: "品类浮动定价" },
  { to: "/intake", label: "称重入库", icon: Scale, hint: "到站交售 · 小票" },
  { to: "/appointments", label: "上门预约", icon: Truck, hint: "上门调度看板" },
  { to: "/sorting", label: "分拣分类", icon: Boxes, hint: "库存分桶盘点" },
  { to: "/sales", label: "出货销售", icon: PackageCheck, hint: "出货单与结算" },
  { to: "/settlement", label: "日结对账", icon: Calculator, hint: "日结锁定对账" },
  { to: "/profit", label: "利润核算", icon: TrendingUp, hint: "进销差价 · 毛利分析" },
];

export default function Sidebar() {
  const station = useStore((s) => s.station);
  const appointments = useStore((s) => s.appointments);
  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-ink-700/60 bg-ink-900/70 backdrop-blur-xl">
      {/* Brand */}
      <div className="relative flex items-center gap-3 border-b border-ink-700/60 px-5 py-5">
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-moss-300 via-amber-300 to-transparent" />
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-moss-400 to-moss-600 shadow-glow">
          <Recycle size={22} className="text-ink-950" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-xl tracking-wide text-ink-100">绿源回收</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-400">Station Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-400">
          运营模块
        </p>
        {NAV.map((item) => {
          const Icon = item.icon;
          const badge = item.to === "/appointments" && pendingCount > 0 ? pendingCount : null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                  isActive
                    ? "bg-moss-300/10 text-ink-100"
                    : "text-ink-200 hover:bg-ink-750/60 hover:text-ink-100"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-full border-l-2 border-moss-300" />
                  )}
                  <Icon
                    size={18}
                    className={cn(
                      "shrink-0 transition-colors",
                      isActive ? "text-moss-300" : "text-ink-400 group-hover:text-ink-200"
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.label}</span>
                      {badge && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-300 px-1.5 text-[10px] font-bold text-ink-950">
                          {badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-ink-400">{item.hint}</span>
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Station info */}
      <div className="border-t border-ink-700/60 px-5 py-4">
        <div className="rounded-lg border border-ink-700/60 bg-ink-800/60 p-3">
          <div className="mb-2 flex items-center gap-2">
            <CircleDot size={13} className="text-moss-300 animate-pulse-soft" />
            <span className="text-xs font-medium text-ink-100">{station.name}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-ink-400">{station.address}</p>
          <div className="mt-2 flex items-center justify-between border-t border-ink-700/50 pt-2">
            <span className="font-mono text-[11px] text-ink-300">{station.phone}</span>
            <span className="font-mono text-[10px] text-ink-500">{station.license}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

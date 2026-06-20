import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, Bell, ScanLine } from "lucide-react";
import { useStore } from "@/store";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "工作台", subtitle: "站点今日运营总览" },
  "/pricing": { title: "定价管理", subtitle: "回收品类浮动定价策略" },
  "/intake": { title: "称重入库", subtitle: "到站交售称重 · 自动小票" },
  "/appointments": { title: "上门预约", subtitle: "上门回收调度看板" },
  "/sorting": { title: "分拣分类", subtitle: "库存分桶与分拣记录" },
  "/sales": { title: "出货销售", subtitle: "出货单创建与结算" },
  "/settlement": { title: "日结对账", subtitle: "每日收支对账锁定" },
};

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function Topbar() {
  const location = useLocation();
  const now = useClock();
  const station = useStore((s) => s.station);
  const meta = TITLES[location.pathname] ?? { title: "工作台", subtitle: "" };

  const dateStr = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 ${WEEKDAYS[now.getDay()]}`;
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-700/60 bg-ink-900/70 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-display text-2xl leading-none tracking-wide text-ink-100">
            {meta.title}
          </h1>
          <p className="mt-1 text-xs text-ink-300">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-ink-600 bg-ink-800/60 px-3 py-1.5 lg:flex">
          <Search size={15} className="text-ink-400" />
          <input
            placeholder="搜索单号 / 客户 / 品类"
            className="w-44 bg-transparent text-sm text-ink-100 placeholder:text-ink-400 outline-none"
          />
          <kbd className="rounded border border-ink-600 px-1.5 py-0.5 text-[10px] text-ink-400">⌘K</kbd>
        </div>

        <button className="btn-ghost h-9 px-3">
          <ScanLine size={16} />
          <span className="hidden text-xs xl:inline">扫码入库</span>
        </button>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-ink-600 bg-ink-800/60 text-ink-300 transition-colors hover:text-ink-100">
          <Bell size={16} />
          <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
          </span>
        </button>

        <div className="flex items-center gap-3 border-l border-ink-700/60 pl-3">
          <div className="text-right">
            <p className="font-mono text-sm tabular text-ink-100">{timeStr}</p>
            <p className="text-[11px] text-ink-400">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 font-display text-base text-ink-950">
              {station.operator.charAt(0)}
            </div>
            <div className="hidden xl:block">
              <p className="text-xs font-medium text-ink-100">{station.operator}</p>
              <p className="text-[11px] text-ink-400">值班操作员</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

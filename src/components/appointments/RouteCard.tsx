import { MapPin, Weight, User, Navigation, CheckCircle2, Truck, Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { PickupRoute, Appointment } from "@/lib/types";
import { ROUTE_STATUS_META, PICKUP_STATUS_META, CATEGORY_META, formatWeight } from "@/lib/format";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { useStore } from "@/store";
import { useState } from "react";

interface RouteCardProps {
  route: PickupRoute;
  onOpenDetail?: (route: PickupRoute) => void;
  onOpenAppointment?: (appt: Appointment) => void;
}

const DRIVERS = [
  { name: "刘师傅", plate: "京A·回收01" },
  { name: "王师傅", plate: "京A·回收02" },
  { name: "陈师傅", plate: "京A·回收03" },
];

export default function RouteCard({ route, onOpenDetail, onOpenAppointment }: RouteCardProps) {
  const appointments = useStore((s) => s.appointments.filter((a) => a.routeId === route.id));
  const categories = useStore((s) => s.categories);
  const updateRouteStatus = useStore((s) => s.updateRouteStatus);
  const [expanded, setExpanded] = useState(true);

  const meta = ROUTE_STATUS_META[route.status];
  const driverInfo = DRIVERS.find((d) => d.name === route.driver) ?? DRIVERS[0];

  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const inProgressCount = appointments.filter((a) => a.pickupStatus === "arrived" || a.pickupStatus === "weighed").length;

  const handleDispatch = () => {
    updateRouteStatus(route.id, "dispatched");
  };

  const handleStart = () => {
    updateRouteStatus(route.id, "in_progress");
  };

  const handleComplete = () => {
    updateRouteStatus(route.id, "completed");
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-700/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-300/20 to-sky-400/10">
              <Navigation size={20} className="text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg tracking-wide text-ink-100">
                  {route.name}
                </h3>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-ink-400">
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {route.region}
                </span>
                <span className="flex items-center gap-1">
                  <User size={11} />
                  {route.driver}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-700/60 hover:text-ink-200"
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-ink-700/50 bg-ink-800/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-ink-400">预约数</p>
            <p className="mt-0.5 font-mono text-base font-semibold text-ink-100">
              {appointments.length}
              <span className="ml-1 text-xs font-normal text-ink-400">单</span>
            </p>
          </div>
          <div className="rounded-lg border border-ink-700/50 bg-ink-800/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-ink-400">预估总量</p>
            <p className="mt-0.5 font-mono text-base font-semibold text-amber-200">
              {formatWeight(route.totalEstimatedWeight ?? 0)}
              <span className="ml-1 text-xs font-normal text-ink-400">kg</span>
            </p>
          </div>
          <div className="rounded-lg border border-ink-700/50 bg-ink-800/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-ink-400">预估里程</p>
            <p className="mt-0.5 font-mono text-base font-semibold text-sky-200">
              {route.estimatedDistanceKm ?? "—"}
              <span className="ml-1 text-xs font-normal text-ink-400">km</span>
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {route.status === "planning" && (
            <button onClick={handleDispatch} className="btn-amber h-8 px-3 text-xs">
              <Truck size={13} /> 派单出发
            </button>
          )}
          {route.status === "dispatched" && (
            <button onClick={handleStart} className="btn-primary h-8 px-3 text-xs">
              <Navigation size={13} /> 开始执行
            </button>
          )}
          {(route.status === "planning" || route.status === "in_progress") && (
            <button onClick={handleComplete} className="btn-ghost h-8 px-3 text-xs">
              <CheckCircle2 size={13} /> 完成路线
            </button>
          )}
          {onOpenDetail && (
            <button onClick={() => onOpenDetail(route)} className="btn-ghost h-8 px-3 text-xs">
              查看详情
            </button>
          )}
        </div>

        {route.note && (
          <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-300/5 p-2.5 text-xs text-amber-200">
          <span className="font-medium">备注：</span>{route.note}
        </div>
        )}
      </div>

      {expanded && appointments.length > 0 && (
        <div className="divide-y divide-ink-700/40">
          {appointments.map((appt, idx) => {
            const cats = appt.categoryIds
              .map((id) => categories.find((c) => c.id === id))
              .filter(Boolean);
            const pickupMeta = appt.pickupStatus ? PICKUP_STATUS_META[appt.pickupStatus] : null;
            return (
              <div
                key={appt.id}
                className={cn(
                "flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-ink-750/40",
                onOpenAppointment && "hover:bg-ink-700/40"
              )}
              onClick={() => onOpenAppointment?.(appt)}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-[11px] font-medium text-ink-300">
                {idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-ink-100">
                    {appt.customerName}
                  </span>
                  {pickupMeta && (
                    <Badge tone={pickupMeta.tone} size="sm">
                      {pickupMeta.label}
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-400">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(appt.appointmentTime).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Weight size={10} />
                    {appt.estimatedWeight}kg
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-ink-400">
                  <MapPin size={10} className="shrink-0" />
                  <span className="truncate">{appt.address}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {cats.slice(0, 3).map((c) =>
                    c ? (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]"
                        style={{
                          borderColor: `${CATEGORY_META[c.type].color}40`,
                          color: CATEGORY_META[c.type].color,
                          backgroundColor: `${CATEGORY_META[c.type].color}15`,
                        }}
                      >
                        <span
                          className="h-1 w-1 rounded-full"
                          style={{ backgroundColor: CATEGORY_META[c.type].color }}
                        />
                        {c.name}
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {expanded && appointments.length === 0 && (
        <div className="p-4 text-center text-xs text-ink-500">
          暂无预约单
        </div>
      )}
    </div>
  );
}

import { MapPin, Clock, Weight, User } from "lucide-react";
import type { Appointment } from "@/lib/types";
import { useStore } from "@/store";
import { CATEGORY_META } from "@/lib/format";
import Badge from "@/components/ui/Badge";

interface AppointmentCardProps {
  appt: Appointment;
  onClick: () => void;
}

const STATUS_BADGE = {
  pending: { tone: "amber" as const, label: "待派单" },
  dispatched: { tone: "sky" as const, label: "进行中" },
  completed: { tone: "moss" as const, label: "已完成" },
  cancelled: { tone: "brick" as const, label: "已取消" },
};

export default function AppointmentCard({ appt, onClick }: AppointmentCardProps) {
  const categories = useStore((s) => s.categories);
  const cats = appt.categoryIds
    .map((id) => categories.find((c) => c.id === id))
    .filter(Boolean);
  const badge = STATUS_BADGE[appt.status];
  const isPast = appt.appointmentTime < Date.now() && appt.status === "pending";

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-xl border border-ink-700/60 bg-ink-800/60 p-3.5 text-left transition-all duration-200 hover:border-ink-500/60 hover:bg-ink-750/60 hover:shadow-panel"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300/20 to-amber-400/10 font-display text-sm text-amber-200">
            {appt.customerName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-ink-100">{appt.customerName}</p>
            <p className="font-mono text-[11px] text-ink-400">{appt.id}</p>
          </div>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      <div className="mt-2.5 space-y-1.5">
        <div className="flex items-start gap-1.5 text-xs text-ink-300">
          <MapPin size={12} className="mt-0.5 shrink-0 text-ink-400" />
          <span className="line-clamp-2">{appt.address}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-400">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {new Date(appt.appointmentTime).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="flex items-center gap-1 text-amber-200">
            <Weight size={11} /> 预估 {appt.estimatedWeight}kg
          </span>
        </div>
        {appt.driver && (
          <div className="flex items-center gap-1.5 text-xs text-sky-200">
            <User size={11} /> {appt.driver}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1">
        {cats.map((c) =>
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
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CATEGORY_META[c.type].color }} />
              {c.name}
            </span>
          ) : null
        )}
      </div>

      {isPast && (
        <div className="mt-2 rounded-md bg-brick-600/15 px-2 py-1 text-[11px] text-brick-300">
          已超时，请尽快处理
        </div>
      )}
      {appt.note && appt.status === "pending" && (
        <p className="mt-2 line-clamp-1 border-t border-ink-700/40 pt-2 text-[11px] italic text-ink-400">
          “{appt.note}”
        </p>
      )}
    </button>
  );
}

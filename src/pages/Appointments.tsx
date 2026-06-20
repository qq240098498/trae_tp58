import { useState, useMemo } from "react";
import {
  Plus,
  Clock,
  MapPin,
  Phone,
  User,
  Weight,
  Navigation,
  CheckCircle2,
  XCircle,
  Truck,
  ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { CATEGORY_META, formatWeight } from "@/lib/format";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import CreateAppointmentModal from "@/components/appointments/CreateAppointmentModal";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const COLUMNS: { key: AppointmentStatus | "done"; title: string; tone: string; accent: string }[] = [
  { key: "pending", title: "待派单", tone: "amber", accent: "bg-amber-300" },
  { key: "dispatched", title: "进行中", tone: "sky", accent: "bg-sky-400" },
  { key: "done", title: "已结束", tone: "moss", accent: "bg-ink-500" },
];

export default function Appointments() {
  const navigate = useNavigate();
  const appointments = useStore((s) => s.appointments);
  const updateAppointmentStatus = useStore((s) => s.updateAppointmentStatus);
  const categories = useStore((s) => s.categories);

  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [driver, setDriver] = useState("刘师傅");

  const columns = useMemo(() => {
    return COLUMNS.map((col) => {
      let list: Appointment[];
      if (col.key === "done") {
        list = appointments.filter((a) => a.status === "completed" || a.status === "cancelled");
      } else {
        list = appointments.filter((a) => a.status === col.key);
      }
      return { ...col, list };
    });
  }, [appointments]);

  const totalWeight = appointments
    .filter((a) => a.status === "pending" || a.status === "dispatched")
    .reduce((s, a) => s + a.estimatedWeight, 0);

  const handleDispatch = () => {
    if (!detail) return;
    updateAppointmentStatus(detail.id, "dispatched", { driver });
    setDetail(null);
  };
  const handleComplete = () => {
    if (!detail) return;
    updateAppointmentStatus(detail.id, "completed");
    setDetail(null);
  };
  const handleCancel = () => {
    if (!detail) return;
    updateAppointmentStatus(detail.id, "cancelled");
    setDetail(null);
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="card flex items-center gap-3 px-4 py-2.5">
            <ClipboardList size={18} className="text-amber-300" />
            <div>
              <p className="text-xs text-ink-400">待办预约</p>
              <p className="font-mono text-lg font-semibold text-ink-100">
                {appointments.filter((a) => a.status === "pending").length}
                <span className="ml-1 text-xs font-normal text-ink-400">单</span>
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-3 px-4 py-2.5">
            <Truck size={18} className="text-sky-300" />
            <div>
              <p className="text-xs text-ink-400">进行中</p>
              <p className="font-mono text-lg font-semibold text-ink-100">
                {appointments.filter((a) => a.status === "dispatched").length}
                <span className="ml-1 text-xs font-normal text-ink-400">单</span>
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-3 px-4 py-2.5">
            <Weight size={18} className="text-moss-300" />
            <div>
              <p className="text-xs text-ink-400">预估总量</p>
              <p className="font-mono text-lg font-semibold text-ink-100">
                {formatWeight(totalWeight)}
                <span className="ml-1 text-xs font-normal text-ink-400">kg</span>
              </p>
            </div>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={16} /> 新建预约
        </button>
      </div>

      {/* Kanban */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        {columns.map((col) => (
          <div key={col.key} className="flex min-h-0 flex-col rounded-xl border border-ink-700/60 bg-ink-900/40">
            <div className="flex items-center justify-between border-b border-ink-700/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", col.accent)} />
                <h3 className="font-display text-lg tracking-wide text-ink-100">{col.title}</h3>
              </div>
              <span className="rounded-full bg-ink-700/60 px-2 py-0.5 font-mono text-xs text-ink-300">
                {col.list.length}
              </span>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto scrollbar-thin p-3">
              {col.list.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  onClick={() => {
                    setDetail(appt);
                    setDriver(appt.driver || "刘师傅");
                  }}
                />
              ))}
              {col.list.length === 0 && (
                <div className="flex h-32 items-center justify-center text-xs text-ink-500">暂无</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <CreateAppointmentModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Detail */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="预约详情"
        subtitle={detail?.id}
        size="md"
        footer={
          detail && (
            <div className="flex w-full items-center justify-between">
              <div className="text-xs text-ink-400">
                创建于 {detail && new Date(detail.createdAt).toLocaleString("zh-CN")}
              </div>
              <div className="flex gap-2">
                {(detail.status === "pending" || detail.status === "dispatched") && (
                  <button onClick={handleCancel} className="btn-danger">
                    <XCircle size={15} /> 取消预约
                  </button>
                )}
                {detail.status === "pending" && (
                  <button onClick={handleDispatch} className="btn-amber">
                    <Truck size={15} /> 派单上门
                  </button>
                )}
                {detail.status === "dispatched" && (
                  <>
                    <button onClick={() => navigate("/intake")} className="btn-ghost">
                      <Navigation size={15} /> 前往称重
                    </button>
                    <button onClick={handleComplete} className="btn-primary">
                      <CheckCircle2 size={15} /> 标记完成
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-800/50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300/20 to-amber-400/10 font-display text-xl text-amber-200">
                  {detail.customerName.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-medium text-ink-100">{detail.customerName}</p>
                  <p className="flex items-center gap-1 font-mono text-xs text-ink-400">
                    <Phone size={11} /> {detail.phone || "未留电话"}
                  </p>
                </div>
              </div>
              <Badge
                tone={
                  detail.status === "pending" ? "amber" : detail.status === "dispatched" ? "sky" : detail.status === "completed" ? "moss" : "brick"
                }
              >
                {detail.status === "pending" ? "待派单" : detail.status === "dispatched" ? "进行中" : detail.status === "completed" ? "已完成" : "已取消"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoTile icon={MapPin} label="上门地址" value={detail.address} full />
              <InfoTile icon={Clock} label="预约时间" value={new Date(detail.appointmentTime).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} />
              <InfoTile icon={Weight} label="预估重量" value={`${detail.estimatedWeight} kg`} valueClass="text-amber-200" />
              {detail.driver && <InfoTile icon={User} label="派单司机" value={detail.driver} valueClass="text-sky-200" />}
            </div>

            <div>
              <p className="label">回收品类</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.categoryIds.map((id) => {
                  const c = categories.find((x) => x.id === id);
                  if (!c) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs"
                      style={{ borderColor: `${CATEGORY_META[c.type].color}40`, color: CATEGORY_META[c.type].color, backgroundColor: `${CATEGORY_META[c.type].color}12` }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CATEGORY_META[c.type].color }} />
                      {c.name}
                    </span>
                  );
                })}
              </div>
            </div>

            {detail.note && (
              <div className="rounded-lg border border-amber-400/20 bg-amber-300/5 p-3 text-sm text-ink-200">
                <p className="mb-1 text-xs text-amber-300">客户备注</p>
                {detail.note}
              </div>
            )}

            {detail.status === "pending" && (
              <div>
                <label className="label">指派司机</label>
                <select value={driver} onChange={(e) => setDriver(e.target.value)} className="input">
                  <option value="刘师傅">刘师傅 · 京A·回收01</option>
                  <option value="王师傅">王师傅 · 京A·回收02</option>
                  <option value="陈师傅">陈师傅 · 京A·回收03</option>
                </select>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  valueClass,
  full,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  valueClass?: string;
  full?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border border-ink-700/60 bg-ink-800/40 p-3", full && "col-span-2")}>
      <div className="flex items-center gap-1.5 text-xs text-ink-400">
        <Icon size={12} /> {label}
      </div>
      <p className={cn("mt-1 text-sm text-ink-100", valueClass)}>{value}</p>
    </div>
  );
}

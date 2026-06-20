import { useState, useEffect, useRef, useMemo } from "react";
import {
  Camera,
  Trash2,
  Plus,
  Scale,
  Image as ImageIcon,
  Package,
  CheckCircle2,
  MapPin,
  User,
  Phone,
  Clock,
  AlertCircle,
  X,
  Upload,
} from "lucide-react";
import type { Appointment, PickupPhoto, PickupWeighing } from "@/lib/types";
import { CATEGORY_META, formatMoney, formatWeight, unitLabel, PICKUP_STATUS_META } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

interface PickupOperationModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

const PHOTO_TYPES: { key: PickupPhoto["type"]; label: string; hint: string }[] = [
  { key: "before", label: "上门前", hint: "客户门口/回收物堆放" },
  { key: "during", label: "回收中", hint: "分类整理过程" },
  { key: "weighing", label: "称重照", hint: "秤面读数照片" },
  { key: "after", label: "完成后", hint: "清理完毕现场" },
];

function generatePlaceholderImage(label: string): string {
  const colors = [
    ["#2a3320", "#4a5a35"],
    ["#332a20", "#5a4a35"],
    ["#202a33", "#354a5a"],
    ["#33202a", "#5a354a"],
  ];
  const idx = label.charCodeAt(0) % colors.length;
  const [c1, c2] = colors[idx];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="320" height="240" fill="url(#g)"/>
    <text x="160" y="120" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="sans-serif" font-size="14">${label}</text>
    <circle cx="160" cy="90" r="20" fill="rgba(255,255,255,0.15)"/>
    <rect x="110" y="140" width="100" height="12" rx="6" fill="rgba(255,255,255,0.1)"/>
    <rect x="125" y="160" width="70" height="10" rx="5" fill="rgba(255,255,255,0.08)"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export default function PickupOperationModal({ open, onClose, appointment }: PickupOperationModalProps) {
  const categories = useStore((s) => s.categories);
  const station = useStore((s) => s.station);
  const addPickupPhoto = useStore((s) => s.addPickupPhoto);
  const removePickupPhoto = useStore((s) => s.removePickupPhoto);
  const addPickupWeighing = useStore((s) => s.addPickupWeighing);
  const removePickupWeighing = useStore((s) => s.removePickupWeighing);
  const getAppointmentPhotos = useStore((s) => s.getAppointmentPhotos);
  const getAppointmentWeighings = useStore((s) => s.getAppointmentWeighings);
  const updateAppointmentPickupStatus = useStore((s) => s.updateAppointmentPickupStatus);
  const createTransaction = useStore((s) => s.createTransaction);
  const updateAppointmentStatus = useStore((s) => s.updateAppointmentStatus);

  const [activeTab, setActiveTab] = useState<"photo" | "weighing">("photo");
  const [photos, setPhotos] = useState<PickupPhoto[]>([]);
  const [weighings, setWeighings] = useState<PickupWeighing[]>([]);
  const [selectedPhotoType, setSelectedPhotoType] = useState<PickupPhoto["type"]>("before");

  const [weighingCategory, setWeighingCategory] = useState("");
  const [weighingQuantity, setWeighingQuantity] = useState("");
  const [weighingUnitPrice, setWeighingUnitPrice] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && appointment) {
      setPhotos(getAppointmentPhotos(appointment.id));
      setWeighings(getAppointmentWeighings(appointment.id));
      setActiveTab("photo");
    }
  }, [open, appointment, getAppointmentPhotos, getAppointmentWeighings]);

  const leafCategories = useMemo(
    () => categories.filter((c) => c.parentId !== null && c.active),
    [categories]
  );

  const selectedWeighingCat = useMemo(
    () => leafCategories.find((c) => c.id === weighingCategory),
    [leafCategories, weighingCategory]
  );

  const totalAmount = useMemo(
    () => Math.round(weighings.reduce((s, w) => s + w.amount, 0) * 100) / 100,
    [weighings]
  );

  const totalWeight = useMemo(
    () => Math.round(weighings.reduce((s, w) => s + (w.unit === "kg" ? w.quantity : 0), 0) * 10) / 10,
    [weighings]
  );

  const handleSimulatePhoto = () => {
    if (!appointment) return;
    const typeLabels: Record<PickupPhoto["type"], string> = {
      before: "上门前",
      during: "回收中",
      weighing: "称重照",
      after: "完成后",
    };
    const photo = addPickupPhoto({
      appointmentId: appointment.id,
      type: selectedPhotoType,
      dataUrl: generatePlaceholderImage(`${typeLabels[selectedPhotoType]} - ${new Date().toLocaleTimeString("zh-CN")}`),
      caption: `${typeLabels[selectedPhotoType]}照片`,
    });
    setPhotos([photo, ...photos]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!appointment || !e.target.files?.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const photo = addPickupPhoto({
        appointmentId: appointment.id,
        type: selectedPhotoType,
        dataUrl: reader.result as string,
        caption: `上传照片`,
      });
      setPhotos([photo, ...photos]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePhoto = (id: string) => {
    removePickupPhoto(id);
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const handleAddWeighing = () => {
    if (!appointment || !selectedWeighingCat || !weighingQuantity) return;
    const qty = parseFloat(weighingQuantity);
    const price = weighingUnitPrice ? parseFloat(weighingUnitPrice) : selectedWeighingCat.unitPrice;
    if (!Number.isFinite(qty) || qty <= 0) return;
    const amount = Math.round(qty * price * 100) / 100;
    const w = addPickupWeighing({
      appointmentId: appointment.id,
      categoryId: selectedWeighingCat.id,
      categoryName: selectedWeighingCat.name,
      unit: selectedWeighingCat.unit,
      quantity: Math.round(qty * 100) / 100,
      unitPrice: Math.round(price * 100) / 100,
      amount,
      operator: station.operator,
    });
    setWeighings([w, ...weighings]);
    setWeighingCategory("");
    setWeighingQuantity("");
    setWeighingUnitPrice("");
  };

  const handleRemoveWeighing = (id: string) => {
    removePickupWeighing(id);
    setWeighings(weighings.filter((w) => w.id !== id));
  };

  const handleMarkArrived = () => {
    if (!appointment) return;
    updateAppointmentPickupStatus(appointment.id, "arrived");
  };

  const handleMarkWeighed = () => {
    if (!appointment) return;
    updateAppointmentPickupStatus(appointment.id, "weighed");
  };

  const handleFinish = () => {
    if (!appointment) return;
    if (weighings.length > 0) {
      const tx = createTransaction({
        source: "pickup",
        customerId: appointment.customerId,
        customerName: appointment.customerName,
        phone: appointment.phone,
        lines: weighings.map((w) => ({
          categoryId: w.categoryId,
          categoryName: w.categoryName,
          unit: w.unit,
          quantity: w.quantity,
          unitPrice: w.unitPrice,
          amount: w.amount,
        })),
      });
      updateAppointmentStatus(appointment.id, "completed", {
        actualTransactionId: tx.id,
      });
    }
    updateAppointmentPickupStatus(appointment.id, "completed");
    onClose();
  };

  if (!appointment) return null;

  const pickupMeta = appointment.pickupStatus
    ? PICKUP_STATUS_META[appointment.pickupStatus]
    : null;

  const photosByType = useMemo(() => {
    const map = new Map<PickupPhoto["type"], PickupPhoto[]>();
    for (const t of PHOTO_TYPES) map.set(t.key, []);
    for (const p of photos) {
      if (!map.has(p.type)) map.set(p.type, []);
      map.get(p.type)!.push(p);
    }
    return map;
  }, [photos]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="上门回收操作"
      subtitle={`${appointment.customerName} · ${appointment.id}`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <span>照片 {photos.length} 张</span>
            <span>·</span>
            <span>称重 {weighings.length} 项</span>
            {weighings.length > 0 && (
              <>
                <span>·</span>
                <span>合计 ¥{formatMoney(totalAmount)}</span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {(!appointment.pickupStatus || appointment.pickupStatus === "pending") && (
              <button onClick={handleMarkArrived} className="btn-sky btn">
                <MapPin size={15} /> 标记到达
              </button>
            )}
            {weighings.length > 0 && appointment.pickupStatus !== "completed" && (
              <button onClick={handleMarkWeighed} className="btn-amber btn">
                <Scale size={15} /> 标记已称重
              </button>
            )}
            <button onClick={handleFinish} className="btn-primary">
              <CheckCircle2 size={15} /> 完成上门
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between rounded-xl border border-ink-700/60 bg-ink-800/50 p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300/20 to-amber-400/10 font-display text-lg text-amber-200">
              {appointment.customerName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-medium text-ink-100">{appointment.customerName}</p>
                {pickupMeta && <Badge tone={pickupMeta.tone}>{pickupMeta.label}</Badge>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                <span className="flex items-center gap-1"><Phone size={11} /> {appointment.phone || "未留电话"}</span>
                <span className="flex items-center gap-1"><MapPin size={11} /> {appointment.address}</span>
                <span className="flex items-center gap-1"><Clock size={11} /> {new Date(appointment.appointmentTime).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-ink-400">预估重量</p>
            <p className="font-mono text-base font-semibold text-amber-200">{appointment.estimatedWeight} kg</p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-ink-600 bg-ink-900/60 p-0.5">
          <button
            onClick={() => setActiveTab("photo")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
              activeTab === "photo" ? "bg-moss-300/20 text-moss-200" : "text-ink-400 hover:text-ink-200"
            )}
          >
            <Camera size={14} /> 拍照记录
            {photos.length > 0 && (
              <span className="ml-0.5 rounded-full bg-moss-300/20 px-1.5 py-0.5 text-[10px]">{photos.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("weighing")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
              activeTab === "weighing" ? "bg-moss-300/20 text-moss-200" : "text-ink-400 hover:text-ink-200"
            )}
          >
            <Scale size={14} /> 称重录入
            {weighings.length > 0 && (
              <span className="ml-0.5 rounded-full bg-amber-300/20 px-1.5 py-0.5 text-[10px]">{weighings.length}</span>
            )}
          </button>
        </div>

        {activeTab === "photo" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {PHOTO_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSelectedPhotoType(t.key)}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                    selectedPhotoType === t.key
                      ? "bg-moss-300/15 text-moss-200 ring-1 ring-moss-300/30"
                      : "text-ink-300 hover:bg-ink-700/50"
                  )}
                >
                  {t.label}
                  {photosByType.get(t.key)?.length ? (
                    <span className="rounded-full bg-ink-700/80 px-1.5 py-0.5 text-[10px] text-ink-200">
                      {photosByType.get(t.key)!.length}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-ink-500">
              类型提示：{PHOTO_TYPES.find((t) => t.key === selectedPhotoType)?.hint}
            </p>

            <div className="flex gap-2">
              <button onClick={handleSimulatePhoto} className="btn-primary h-9 px-4 text-xs">
                <Camera size={14} /> 模拟拍照
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-ghost h-9 px-4 text-xs"
              >
                <Upload size={14} /> 上传图片
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {photos.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-600 py-10 text-center text-xs text-ink-500">
                  <ImageIcon size={28} className="mb-2 opacity-40" />
                  <p>暂无照片</p>
                  <p className="mt-0.5 text-[10px] text-ink-600">请点击上方按钮拍照或上传</p>
                </div>
              )}
              {photos.map((p) => {
                const typeInfo = PHOTO_TYPES.find((t) => t.key === p.type);
                return (
                  <div key={p.id} className="group relative overflow-hidden rounded-lg border border-ink-700/60 bg-ink-900/60">
                    <img src={p.dataUrl} alt={p.caption} className="aspect-[4/3] w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                      <p className="truncate text-[10px] text-white/80">{typeInfo?.label ?? p.type}</p>
                    </div>
                    <button
                      onClick={() => handleRemovePhoto(p.id)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/50 text-white/70 opacity-0 transition-opacity hover:bg-brick-600/60 hover:text-white group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "weighing" && (
          <div className="space-y-3">
            <div className="card p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-300">新增称重项</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_120px_auto]">
                <div>
                  <label className="label">品类</label>
                  <select
                    value={weighingCategory}
                    onChange={(e) => {
                      setWeighingCategory(e.target.value);
                      const c = leafCategories.find((x) => x.id === e.target.value);
                      if (c) setWeighingUnitPrice(String(c.unitPrice));
                    }}
                    className="input"
                  >
                    <option value="">选择品类…</option>
                    {leafCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · ¥{formatMoney(c.unitPrice)}/{unitLabel(c.unit)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">数量</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={weighingQuantity}
                      onChange={(e) => setWeighingQuantity(e.target.value)}
                      placeholder="0"
                      className="input pr-10 font-mono text-right"
                    />
                    {selectedWeighingCat && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-500">
                        {selectedWeighingCat.unit === "kg" ? "kg" : "件"}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label">单价</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={weighingUnitPrice}
                      onChange={(e) => setWeighingUnitPrice(e.target.value)}
                      placeholder="0.00"
                      className="input pr-8 font-mono text-right"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-500">元</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddWeighing}
                    disabled={!selectedWeighingCat || !parseFloat(weighingQuantity)}
                    className="btn-primary h-9 px-3 text-xs w-full sm:w-auto"
                  >
                    <Plus size={14} /> 添加
                  </button>
                </div>
              </div>
              {selectedWeighingCat && parseFloat(weighingQuantity) > 0 && (
                <div className="mt-2 flex items-center justify-between rounded-md border border-moss-300/20 bg-moss-300/5 px-3 py-1.5 text-xs">
                  <span className="text-ink-400">此项金额</span>
                  <span className="font-mono font-semibold text-moss-300">
                    ¥{formatMoney(parseFloat(weighingQuantity) * (parseFloat(weighingUnitPrice) || selectedWeighingCat.unitPrice))}
                  </span>
                </div>
              )}
            </div>

            <div className="card overflow-hidden">
              <div className="border-b border-ink-700/60 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={15} className="text-ink-400" />
                    <span className="text-sm font-medium text-ink-100">称重明细</span>
                  </div>
                  {weighings.length > 0 && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-ink-400">总重 <span className="font-mono text-ink-100">{formatWeight(totalWeight)}kg</span></span>
                      <span className="text-ink-400">合计 <span className="font-mono font-semibold text-amber-200">¥{formatMoney(totalAmount)}</span></span>
                    </div>
                  )}
                </div>
              </div>
              {weighings.length === 0 ? (
                <div className="py-10 text-center text-xs text-ink-500">
                  <Scale size={28} className="mx-auto mb-2 opacity-40" />
                  <p>暂无称重记录</p>
                </div>
              ) : (
                <div className="divide-y divide-ink-700/40">
                  {weighings.map((w) => {
                    const cat = categories.find((c) => c.id === w.categoryId);
                    const meta = cat ? CATEGORY_META[cat.type] : null;
                    return (
                      <div key={w.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: meta ? `${meta.color}15` : undefined }}>
                          {meta && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-ink-100">{w.categoryName}</p>
                          <p className="text-[10px] text-ink-500">
                            单价 ¥{formatMoney(w.unitPrice)}/{unitLabel(w.unit)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm text-ink-100">
                            {w.quantity} <span className="text-xs text-ink-400">{w.unit === "kg" ? "kg" : "件"}</span>
                          </p>
                          <p className="font-mono text-xs font-semibold text-amber-200">¥{formatMoney(w.amount)}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveWeighing(w.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-brick-600/20 hover:text-brick-300"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

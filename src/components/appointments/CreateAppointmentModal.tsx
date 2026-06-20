import { useState, useEffect } from "react";
import { MapPin, Weight, CalendarPlus } from "lucide-react";
import { useStore } from "@/store";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/format";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface CreateAppointmentModalProps {
  open: boolean;
  onClose: () => void;
}

function defaultTime(): string {
  const d = new Date(Date.now() + 2 * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreateAppointmentModal({ open, onClose }: CreateAppointmentModalProps) {
  const customers = useStore((s) => s.customers);
  const categories = useStore((s) => s.categories);
  const createAppointment = useStore((s) => s.createAppointment);

  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [time, setTime] = useState(defaultTime());
  const [weight, setWeight] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setCustomerId("");
      setName("");
      setPhone("");
      setAddress("");
      setTime(defaultTime());
      setWeight("");
      setSelectedCats([]);
      setNote("");
    }
  }, [open]);

  const individualCusts = customers.filter((c) => c.type === "individual");
  const leafCats = categories.filter((c) => c.parentId !== null && c.active);

  const toggleCat = (id: string) =>
    setSelectedCats((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const valid = name.trim() && address.trim() && time && selectedCats.length > 0;

  const handleSubmit = () => {
    if (!valid) return;
    createAppointment({
      customerId: customerId || "walkin",
      customerName: name,
      phone,
      address,
      appointmentTime: new Date(time).getTime(),
      estimatedWeight: parseFloat(weight) || 0,
      categoryIds: selectedCats,
      note: note || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="新建上门回收预约"
      subtitle="填写客户地址、品类与预估重量，派单上门"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">取消</button>
          <button onClick={handleSubmit} disabled={!valid} className="btn-primary">
            <CalendarPlus size={16} /> 创建预约
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="label">选择客户</label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                const c = individualCusts.find((x) => x.id === e.target.value);
                if (c) {
                  setName(c.name);
                  setPhone(c.phone);
                }
              }}
              className="input"
            >
              <option value="">— 散客 / 手动 —</option>
              {individualCusts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">客户姓名</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="必填" />
          </div>
          <div>
            <label className="label">联系电话</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="可选" />
          </div>
        </div>

        <div>
          <label className="label">上门地址</label>
          <div className="relative">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="input pl-9" placeholder="详细到门牌号" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">预约时间</label>
            <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">预估重量</label>
            <div className="relative">
              <Weight size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="number"
                step="1"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input pl-9 font-mono"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-500">kg</span>
            </div>
          </div>
        </div>

        <div>
          <label className="label">回收品类（多选）</label>
          <div className="space-y-2">
            {CATEGORY_ORDER.map((type) => {
              const meta = CATEGORY_META[type];
              const cats = leafCats.filter((c) => c.type === type);
              if (cats.length === 0) return null;
              return (
                <div key={type} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-0.5 text-xs"
                    style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    {meta.label}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cats.map((c) => {
                      const sel = selectedCats.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCat(c.id)}
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-xs transition-colors",
                            sel
                              ? "border-moss-300/60 bg-moss-300/15 text-moss-200"
                              : "border-ink-600 bg-ink-800/60 text-ink-300 hover:border-ink-400"
                          )}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label">备注</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="如：需要大车 / 老人独居提前电话" />
        </div>
      </div>
    </Modal>
  );
}

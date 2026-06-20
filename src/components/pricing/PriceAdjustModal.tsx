import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import type { Category } from "@/lib/types";
import { CATEGORY_META, formatMoney, unitLabel } from "@/lib/format";
import { useStore } from "@/store";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface PriceAdjustModalProps {
  open: boolean;
  onClose: () => void;
  category: Category | null;
}

const PRESETS = [0.05, 0.1, 0.2, -0.05, -0.1, -0.2];

export default function PriceAdjustModal({ open, onClose, category }: PriceAdjustModalProps) {
  const updatePrice = useStore((s) => s.updatePrice);
  const [newPrice, setNewPrice] = useState("");
  const [note, setNote] = useState("");
  const [adjustValue, setAdjustValue] = useState<number>(0);

  useEffect(() => {
    if (category) {
      setNewPrice(String(category.unitPrice));
      setNote("");
      setAdjustValue(0);
    }
  }, [category]);

  if (!category) return null;
  const meta = CATEGORY_META[category.type];
  const current = category.unitPrice;
  const parsed = parseFloat(newPrice) || 0;
  const finalPrice = adjustValue !== 0 ? Math.round((current + adjustValue) * 100) / 100 : parsed;
  const diff = finalPrice - current;
  const pct = current > 0 ? (diff / current) * 100 : 0;
  const up = diff > 0;

  const handlePreset = (v: number) => {
    setAdjustValue((prev) => (prev === v ? 0 : v));
    setNewPrice(String(Math.round((current + v) * 100) / 100));
  };

  const handleSubmit = () => {
    if (finalPrice <= 0) return;
    updatePrice(category.id, finalPrice, note || undefined);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="调整品类定价"
      subtitle={`${category.name} · 当前 ¥${formatMoney(current)}/${unitLabel(category.unit)}`}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">取消</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={finalPrice <= 0}>
            确认调价
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-lg border border-ink-700/60 bg-ink-800/50 p-3">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className="text-sm font-medium text-ink-100">{category.name}</span>
          <span className="ml-auto font-mono text-xs text-ink-400">
            ¥{formatMoney(current)}/{unitLabel(category.unit)}
          </span>
        </div>

        <div>
          <label className="label">新单价（元 / {unitLabel(category.unit)}）</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-ink-400">¥</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newPrice}
              onChange={(e) => {
                setNewPrice(e.target.value);
                setAdjustValue(0);
              }}
              className="input pl-7 font-mono text-lg"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="label">快速浮动</label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((v) => (
              <button
                key={v}
                onClick={() => handlePreset(v)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  adjustValue === v
                    ? "border-moss-300/60 bg-moss-300/15 text-moss-200"
                    : "border-ink-600 bg-ink-800/60 text-ink-300 hover:border-ink-400"
                )}
              >
                {v > 0 ? "+" : ""}{v.toFixed(2)}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-ink-400">点击预设可按当前价浮动调整，再次点击取消</p>
        </div>

        <div>
          <label className="label">调价说明（可选）</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input"
            placeholder="如：市场行情上涨 / 批量促销"
          />
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-ink-700/60 bg-ink-900/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400">调价后单价</span>
            <span className="font-mono text-2xl font-bold text-ink-100">
              ¥{formatMoney(finalPrice)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-ink-700/50 pt-2">
            <span className="text-xs text-ink-400">变动</span>
            <span
              className={cn(
                "flex items-center gap-1 font-mono text-sm font-semibold",
                up ? "text-moss-300" : diff < 0 ? "text-brick-300" : "text-ink-300"
              )}
            >
              {up ? <TrendingUp size={14} /> : diff < 0 ? <TrendingDown size={14} /> : <AlertCircle size={14} />}
              {diff > 0 ? "+" : ""}{diff.toFixed(2)} 元
              <span className="text-ink-500">({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)</span>
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

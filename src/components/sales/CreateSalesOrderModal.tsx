import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, PackageCheck } from "lucide-react";
import { useStore } from "@/store";
import { CATEGORY_META, formatMoney, unitLabel } from "@/lib/format";
import Modal from "@/components/ui/Modal";

interface CreateSalesOrderModalProps {
  open: boolean;
  onClose: () => void;
}

interface DraftLine {
  key: string;
  categoryId: string;
  quantity: string;
  unitPrice: string;
}

export default function CreateSalesOrderModal({ open, onClose }: CreateSalesOrderModalProps) {
  const customers = useStore((s) => s.customers);
  const inventory = useStore((s) => s.inventory);
  const categories = useStore((s) => s.categories);
  const createSalesOrder = useStore((s) => s.createSalesOrder);

  const [buyerId, setBuyerId] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([{ key: "l1", categoryId: "", quantity: "", unitPrice: "" }]);

  useEffect(() => {
    if (open) {
      setBuyerId("");
      setBuyerContact("");
      setNote("");
      setLines([{ key: `l${Date.now()}`, categoryId: "", quantity: "", unitPrice: "" }]);
    }
  }, [open]);

  const buyers = customers.filter((c) => c.type === "buyer");
  const availableCats = useMemo(
    () =>
      categories
        .filter((c) => c.parentId !== null)
        .map((c) => {
          const inv = inventory.find((b) => b.categoryId === c.id);
          return { cat: c, stock: inv };
        })
        .filter((x) => x.stock && (x.stock.weightKg > 0 || x.stock.pieceCount > 0)),
    [categories, inventory]
  );

  const resolvedLines = lines
    .map((l) => {
      const cat = categories.find((c) => c.id === l.categoryId);
      const qty = parseFloat(l.quantity) || 0;
      const price = parseFloat(l.unitPrice) || 0;
      if (!cat || qty <= 0 || price <= 0) return null;
      const amount = Math.round(qty * price * 100) / 100;
      return { draft: l, cat, qty, price, amount };
    })
    .filter(Boolean) as { draft: DraftLine; cat: NonNullable<ReturnType<typeof categories.find>>; qty: number; price: number; amount: number }[];

  const totalAmount = Math.round(resolvedLines.reduce((s, r) => s + r.amount, 0) * 100) / 100;
  const totalWeight = Math.round(resolvedLines.reduce((s, r) => s + (r.cat.unit === "kg" ? r.qty : 0), 0) * 10) / 10;

  const selectedBuyer = customers.find((c) => c.id === buyerId);
  const valid = buyerId && resolvedLines.length > 0;

  const setLine = (key: string, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const onCatChange = (key: string, catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    const suggested = cat ? Math.round(cat.unitPrice * 1.4 * 100) / 100 : 0;
    setLine(key, { categoryId: catId, unitPrice: String(suggested) });
  };

  const handleSubmit = () => {
    if (!valid) return;
    createSalesOrder({
      buyerId,
      buyerName: selectedBuyer!.name,
      buyerContact: buyerContact || selectedBuyer!.phone,
      lines: resolvedLines.map((r) => ({
        categoryId: r.cat.id,
        categoryName: r.cat.name,
        unit: r.cat.unit,
        quantity: r.qty,
        unitPrice: r.price,
        amount: r.amount,
      })),
      note: note || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="创建出货销售单"
      subtitle="选择买家与品类，确认出货单价"
      size="xl"
      footer={
        <>
          <div className="mr-auto flex items-center gap-4 text-sm">
            <span className="text-ink-400">合计应收</span>
            <span className="font-display text-2xl text-amber-200">¥{formatMoney(totalAmount)}</span>
            {totalWeight > 0 && <span className="text-xs text-ink-400">{totalWeight} kg</span>}
          </div>
          <button onClick={onClose} className="btn-ghost">取消</button>
          <button onClick={handleSubmit} disabled={!valid} className="btn-primary">
            <PackageCheck size={16} /> 创建出货单
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="label">选择买家</label>
            <select
              value={buyerId}
              onChange={(e) => {
                setBuyerId(e.target.value);
                const b = buyers.find((x) => x.id === e.target.value);
                if (b) setBuyerContact(b.phone);
              }}
              className="input"
            >
              <option value="">— 选择买家 —</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">买家联系方式</label>
            <input value={buyerContact} onChange={(e) => setBuyerContact(e.target.value)} className="input" placeholder="电话 / 联系人" />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label !mb-0">出货明细（仅显示有库存的品类）</label>
            <button
              onClick={() => setLines((prev) => [...prev, { key: `l${Date.now()}`, categoryId: "", quantity: "", unitPrice: "" }])}
              className="flex items-center gap-1 text-xs text-moss-300 hover:underline"
            >
              <Plus size={13} /> 添加行
            </button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_120px_130px_110px_36px] gap-2 px-1 text-[10px] uppercase tracking-wider text-ink-400">
              <span>品类</span>
              <span className="text-center">单位</span>
              <span className="text-center">出货数量</span>
              <span className="text-center">出货单价</span>
              <span />
            </div>
            {lines.map((l) => {
              const resolved = resolvedLines.find((r) => r.draft.key === l.key);
              const cat = categories.find((c) => c.id === l.categoryId);
              const meta = cat ? CATEGORY_META[cat.type] : null;
              const inv = inventory.find((b) => b.categoryId === l.categoryId);
              return (
                <div key={l.key} className="grid grid-cols-[1fr_120px_130px_110px_36px] items-center gap-2 rounded-lg border border-ink-700/50 bg-ink-800/40 p-1.5">
                  <div className="relative">
                    {meta && (
                      <span className="absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full" style={{ backgroundColor: meta.color }} />
                    )}
                    <select
                      value={l.categoryId}
                      onChange={(e) => onCatChange(l.key, e.target.value)}
                      className="w-full appearance-none rounded-md border border-ink-600 bg-ink-900/70 py-2 pl-6 pr-2 text-sm text-ink-100 outline-none focus:border-moss-300/60"
                    >
                      <option value="">选择品类…</option>
                      {availableCats.map(({ cat: c, stock }) => (
                        <option key={c.id} value={c.id}>
                          {c.name}（库存 {stock!.weightKg || stock!.pieceCount}{c.unit === "kg" ? "kg" : "件"}）
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-center text-xs text-ink-300">
                    {cat ? unitLabel(cat.unit) : "—"}
                    {inv && (
                      <div className="text-[10px] text-ink-500">库 {inv.weightKg || inv.pieceCount}</div>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={l.quantity}
                    onChange={(e) => setLine(l.key, { quantity: e.target.value })}
                    placeholder="0"
                    className="rounded-md border border-ink-600 bg-ink-900/70 px-2 py-2 text-right font-mono text-sm text-ink-100 outline-none focus:border-moss-300/60"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={l.unitPrice}
                    onChange={(e) => setLine(l.key, { unitPrice: e.target.value })}
                    placeholder="0.00"
                    className="rounded-md border border-ink-600 bg-ink-900/70 px-2 py-2 text-right font-mono text-sm text-ink-100 outline-none focus:border-moss-300/60"
                  />
                  <div className="text-right">
                    {resolved ? (
                      <span className="font-mono text-sm font-semibold text-amber-200">¥{formatMoney(resolved.amount)}</span>
                    ) : (
                      <button
                        onClick={() => setLines((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x.key !== l.key)))}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-ink-400 hover:bg-brick-600/20 hover:text-brick-300"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-ink-400">出货单价默认按收购价 1.4 倍建议，可手动调整</p>
        </div>

        <div>
          <label className="label">备注</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="如：含税 / 款到发货 / T+1 结算" />
        </div>
      </div>
    </Modal>
  );
}

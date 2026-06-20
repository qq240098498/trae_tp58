import { User, Plus, Trash2, Scale, Printer, RefreshCw } from "lucide-react";
import type { WeighingDraft } from "@/hooks/useWeighingDraft";
import { CATEGORY_META, formatMoney, unitLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import MarketPriceHint from "@/components/market/MarketPriceHint";

interface WeighingPanelProps {
  draft: WeighingDraft;
  onConfirm: () => void;
}

export default function WeighingPanel({ draft, onConfirm }: WeighingPanelProps) {
  const {
    customers,
    customerId,
    setCustomerId,
    walkInName,
    setWalkInName,
    phone,
    setPhone,
    source,
    setSource,
    note,
    setNote,
    autoPrint,
    setAutoPrint,
    lines,
    setLine,
    addLine,
    removeLine,
    leafCategories,
    resolvedLines,
    totalAmount,
    totalWeightKg,
    canConfirm,
    reset,
  } = draft;

  const individualCusts = customers.filter((c) => c.type === "individual");

  return (
    <div className="card overflow-hidden">
      {/* Customer */}
      <div className="border-b border-ink-700/60 bg-ink-850/40 p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
          <User size={14} /> 客户信息
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="label">选择老客户</label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                const c = individualCusts.find((x) => x.id === e.target.value);
                if (c) setPhone(c.phone);
              }}
              className="input"
            >
              <option value="">— 散客 / 手动输入 —</option>
              {individualCusts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.phone}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">客户姓名</label>
            <input
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              placeholder="输入客户姓名"
              className="input"
              disabled={!!customerId}
            />
          </div>
          <div>
            <label className="label">联系电话</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="可选"
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Lines */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
            <Scale size={14} /> 称重明细
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-ink-600 bg-ink-900/60 p-0.5">
            {(["onsite", "pickup"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  source === s ? "bg-moss-300/20 text-moss-200" : "text-ink-400 hover:text-ink-200"
                )}
              >
                {s === "onsite" ? "到站交售" : "上门回收"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-[1fr_120px_120px_110px_40px] gap-2 px-1 text-[10px] uppercase tracking-wider text-ink-400">
            <span>品类 <span className="text-moss-300/60 normal-case tracking-normal">（含今日参考价）</span></span>
            <span className="text-center">单位</span>
            <span className="text-center">数量</span>
            <span className="text-right">金额</span>
            <span />
          </div>
          {lines.map((l) => {
            const resolved = resolvedLines.find((r) => r.draft.key === l.key);
            const cat = resolved?.cat;
            const meta = cat ? CATEGORY_META[cat.type] : null;
            return (
              <div
                key={l.key}
                className="group grid grid-cols-[1fr_120px_120px_110px_40px] items-center gap-2 rounded-lg border border-ink-700/50 bg-ink-800/40 p-1.5 transition-colors hover:border-ink-500/50"
              >
                <div className="space-y-1">
                  <div className="relative">
                    {meta && (
                      <span className="absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full" style={{ backgroundColor: meta.color }} />
                    )}
                    <select
                      value={l.categoryId}
                      onChange={(e) => setLine(l.key, { categoryId: e.target.value, quantity: e.target.value ? l.quantity : "" })}
                      className="w-full appearance-none rounded-md border border-ink-600 bg-ink-900/70 py-2 pl-6 pr-2 text-sm text-ink-100 outline-none focus:border-moss-300/60"
                    >
                      <option value="">选择品类…</option>
                      {leafCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · ¥{formatMoney(c.unitPrice)}/{unitLabel(c.unit)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {cat && (
                    <div className="flex items-center gap-2 px-1">
                      <MarketPriceHint categoryId={cat.id} type="buy" variant="badge" />
                    </div>
                  )}
                </div>
                <div className="text-center text-xs text-ink-300">
                  {cat ? unitLabel(cat.unit) : "—"}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={l.quantity}
                    onChange={(e) => setLine(l.key, { quantity: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-md border border-ink-600 bg-ink-900/70 px-2 py-2 text-right font-mono text-sm text-ink-100 outline-none focus:border-moss-300/60"
                  />
                  {cat && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-ink-500">
                      {cat.unit === "kg" ? "kg" : "件"}
                    </span>
                  )}
                </div>
                <div className="text-right font-mono text-sm font-semibold text-amber-200">
                  {resolved ? `¥${formatMoney(resolved.line.amount)}` : "—"}
                </div>
                <button
                  onClick={() => removeLine(l.key)}
                  disabled={lines.length <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-brick-600/20 hover:text-brick-300 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="删除行"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <button onClick={addLine} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-600 py-2 text-xs text-ink-400 transition-colors hover:border-moss-300/40 hover:text-moss-300">
          <Plus size={14} /> 添加一行品类
        </button>

        <div className="mt-3">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注（可选）"
            className="input"
          />
        </div>
      </div>

      {/* Footer / total */}
      <div className="flex items-center justify-between gap-4 border-t border-ink-700/60 bg-gradient-to-r from-ink-850 to-ink-800 p-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-ink-400">合计应付</p>
            <p className="font-display text-4xl tracking-wide text-amber-200">¥{formatMoney(totalAmount)}</p>
          </div>
          <div className="h-10 w-px bg-ink-700" />
          <div>
            <p className="text-xs text-ink-400">总重量</p>
            <p className="font-mono text-lg font-semibold text-ink-100">{totalWeightKg} kg</p>
          </div>
          <div className="h-10 w-px bg-ink-700" />
          <div>
            <p className="text-xs text-ink-400">品类数</p>
            <p className="font-mono text-lg font-semibold text-ink-100">{resolvedLines.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-300">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
              className="accent-moss-400"
            />
            <Printer size={13} /> 自动打印
          </label>
          <button onClick={reset} className="btn-ghost h-10">
            <RefreshCw size={15} /> 重置
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="btn-primary h-10 px-6"
          >
            <Scale size={16} /> 确认入库
          </button>
        </div>
      </div>
    </div>
  );
}

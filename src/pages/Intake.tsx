import { useState, useMemo } from "react";
import { CheckCircle2, Receipt as ReceiptIcon, Printer, Ban, Scale } from "lucide-react";
import { useStore } from "@/store";
import { printReceipt } from "@/store/print";
import { useWeighingDraft } from "@/hooks/useWeighingDraft";
import { isToday } from "@/lib/selectors";
import { formatMoney, formatWeight } from "@/lib/format";
import WeighingPanel from "@/components/intake/WeighingPanel";
import ReceiptPreview from "@/components/intake/ReceiptPreview";
import Badge from "@/components/ui/Badge";
import SectionHeader from "@/components/ui/SectionHeader";
import type { Transaction } from "@/lib/types";

export default function Intake() {
  const transactions = useStore((s) => s.transactions);
  const voidTransaction = useStore((s) => s.voidTransaction);
  const draft = useWeighingDraft();
  const [flash, setFlash] = useState<Transaction | null>(null);
  const [voidTarget, setVoidTarget] = useState<Transaction | null>(null);

  const todayTx = useMemo(
    () => transactions.filter((t) => isToday(t.createdAt)),
    [transactions]
  );
  const todayAmount = todayTx.filter((t) => t.status === "active").reduce((s, t) => s + t.totalAmount, 0);

  const handleConfirm = () => {
    const tx = draft.confirm();
    if (tx && draft.autoPrint) {
      printReceipt(tx);
    }
    if (tx) {
      setFlash(tx);
      setTimeout(() => setFlash(null), 3000);
    }
  };

  const confirmVoid = () => {
    if (voidTarget) {
      voidTransaction(voidTarget.id);
      setVoidTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      {flash && (
        <div className="fixed right-6 top-20 z-40 flex items-center gap-3 rounded-xl border border-moss-300/40 bg-ink-850/95 px-4 py-3 shadow-glow backdrop-blur animate-scale-in">
          <CheckCircle2 size={18} className="text-moss-300" />
          <div>
            <p className="text-sm font-medium text-ink-100">入库成功</p>
            <p className="text-xs text-ink-300">单号 {flash.receiptNo} · ¥{formatMoney(flash.totalAmount)}</p>
          </div>
          {!draft.autoPrint && (
            <button onClick={() => printReceipt(flash)} className="ml-2 btn-ghost h-8 px-2 text-xs">
              <Printer size={13} /> 补打
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <WeighingPanel draft={draft} onConfirm={handleConfirm} />
        <ReceiptPreview tx={draft.previewTx} />
      </div>

      {/* Today's transactions */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-700/60 px-5 py-4">
          <SectionHeader
            title="当日交售记录"
            description={`${todayTx.length} 笔 · 应付 ¥${formatMoney(todayAmount)}`}
            className="!mb-0"
          />
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <Scale size={14} /> 实时刷新
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700/60 text-xs text-ink-400">
                <th className="px-5 py-2.5 text-left font-medium">时间</th>
                <th className="px-3 py-2.5 text-left font-medium">单号</th>
                <th className="px-3 py-2.5 text-left font-medium">客户</th>
                <th className="px-3 py-2.5 text-left font-medium">来源</th>
                <th className="px-3 py-2.5 text-left font-medium">明细</th>
                <th className="px-3 py-2.5 text-right font-medium">重量</th>
                <th className="px-3 py-2.5 text-right font-medium">金额</th>
                <th className="px-5 py-2.5 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {todayTx.map((tx) => (
                <tr key={tx.id} className="border-b border-ink-700/40 table-row-hover">
                  <td className="px-5 py-3 font-mono text-xs text-ink-300">
                    {new Date(tx.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-ink-200">{tx.receiptNo}</td>
                  <td className="px-3 py-3 text-ink-100">{tx.customerName}</td>
                  <td className="px-3 py-3">
                    <Badge tone={tx.source === "onsite" ? "moss" : "sky"}>
                      {tx.source === "onsite" ? "到站" : "上门"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <span className="line-clamp-1 max-w-[220px] text-xs text-ink-300">
                      {tx.lines.map((l) => `${l.categoryName}×${l.quantity}`).join("、")}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-ink-200">{formatWeight(tx.totalWeightKg)}</td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-amber-200">
                    {tx.status === "void" ? <span className="text-brick-300 line-through">¥{formatMoney(tx.totalAmount)}</span> : `¥${formatMoney(tx.totalAmount)}`}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {tx.status === "active" ? (
                        <>
                          <button
                            onClick={() => printReceipt(tx)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-300 transition-colors hover:bg-ink-700/60 hover:text-moss-300"
                            title="重打小票"
                          >
                            <Printer size={13} /> 小票
                          </button>
                          <button
                            onClick={() => setVoidTarget(tx)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-300 transition-colors hover:bg-brick-600/20 hover:text-brick-300"
                            title="作废"
                          >
                            <Ban size={13} /> 作废
                          </button>
                        </>
                      ) : (
                        <Badge tone="brick">已作废</Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {todayTx.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-ink-400">
                    <ReceiptIcon size={28} className="mx-auto mb-2 opacity-40" />
                    今日暂无交易，开始第一笔称重入库吧
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Void confirm */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={() => setVoidTarget(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-brick-400/40 bg-ink-850 p-6 shadow-panel animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brick-600/20 text-brick-300">
                <Ban size={20} />
              </div>
              <div>
                <h3 className="font-display text-xl tracking-wide text-ink-100">作废交易</h3>
                <p className="text-xs text-ink-300">作废后将回滚库存，且不可恢复</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-ink-700/60 bg-ink-800/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-400">单号</span>
                <span className="font-mono text-ink-100">{voidTarget.receiptNo}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-ink-400">客户</span>
                <span className="text-ink-100">{voidTarget.customerName}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-ink-400">金额</span>
                <span className="font-mono font-semibold text-amber-200">¥{formatMoney(voidTarget.totalAmount)}</span>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setVoidTarget(null)} className="btn-ghost">取消</button>
              <button onClick={confirmVoid} className="btn-danger">确认作废</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

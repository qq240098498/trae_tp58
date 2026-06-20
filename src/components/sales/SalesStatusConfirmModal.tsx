import { useState } from "react";
import {
  Truck,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  PackageOpen,
  Banknote,
  ArrowRight,
  Info,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { SalesOrder, SalesStatus } from "@/lib/types";
import { formatMoney, formatWeight, CATEGORY_META } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  order: SalesOrder | null;
  targetStatus: SalesStatus;
  onConfirm: (note: string) => void;
}

const STATUS_LABEL: Record<SalesStatus, string> = {
  draft: "草稿",
  shipped: "已出库",
  settled: "已结算",
};

const STATUS_TONE: Record<SalesStatus, string> = {
  draft: "text-ink-300 bg-ink-700/60 border-ink-600",
  shipped: "text-sky-300 bg-sky-300/10 border-sky-300/30",
  settled: "text-moss-300 bg-moss-300/10 border-moss-300/30",
};

export default function SalesStatusConfirmModal({ open, onClose, order, targetStatus, onConfirm }: Props) {
  const [note, setNote] = useState("");

  if (!order) return null;

  const isShip = targetStatus === "shipped" && order.status === "draft";
  const isSettle = targetStatus === "settled" && order.status === "shipped";
  const isRollback = targetStatus === "draft" && order.status !== "draft";

  const getStepInfo = () => {
    if (isShip) {
      return {
        title: "确认出库",
        subtitle: "确认后将扣减对应库存并标记为已出库",
        tone: "sky",
        icon: Truck,
        btnText: "确认出库",
        btnClass: "btn-amber",
      };
    }
    if (isSettle) {
      return {
        title: "确认结算",
        subtitle: "确认后该订单将标记为已完成，款项视为已收妥",
        tone: "moss",
        icon: CheckCircle2,
        btnText: "确认结算",
        btnClass: "btn-primary",
      };
    }
    return {
      title: "退回草稿",
      subtitle: "撤销出库/结算操作，库存将恢复，订单回到草稿状态",
      tone: "amber",
      icon: RotateCcw,
      btnText: "确认退回",
      btnClass: "btn-ghost border border-ink-600",
    };
  };

  const step = getStepInfo();
  const StepIcon = step.icon;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step.title}
      subtitle={step.subtitle}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            取消
          </button>
          <button
            onClick={() => {
              onConfirm(note.trim());
              setNote("");
            }}
            className={step.btnClass}
          >
            <StepIcon size={15} />
            {step.btnText}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Status flow */}
        <div className="flex items-center gap-3 rounded-xl border border-ink-700/50 bg-ink-900/40 p-4">
          <div className={cn("flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm", STATUS_TONE[order.status])}>
            {order.status === "draft" && <PackageOpen size={14} />}
            {order.status === "shipped" && <Truck size={14} />}
            {order.status === "settled" && <Banknote size={14} />}
            {STATUS_LABEL[order.status]}
          </div>
          <ArrowRight size={18} className="text-ink-500" />
          <div className={cn("flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-semibold", STATUS_TONE[targetStatus])}>
            {targetStatus === "draft" && <PackageOpen size={14} />}
            {targetStatus === "shipped" && <Truck size={14} />}
            {targetStatus === "settled" && <Banknote size={14} />}
            {STATUS_LABEL[targetStatus]}
          </div>
        </div>

        {/* Impact info */}
        <div className={cn(
          "rounded-xl border p-4",
          isRollback
            ? "border-amber-300/30 bg-amber-300/5"
            : "border-ink-700/50 bg-ink-900/30"
        )}>
          <div className="flex items-start gap-2">
            {isRollback ? (
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" />
            ) : (
              <Info size={18} className="mt-0.5 shrink-0 text-sky-300" />
            )}
            <div className="space-y-1.5 text-sm">
              <p className="text-ink-200">
                <span className="font-medium">订单号：</span>
                <span className="font-mono text-ink-100">{order.id}</span>
              </p>
              <p className="text-ink-200">
                <span className="font-medium">买家：</span>
                <span className="text-ink-100">{order.buyerName}</span>
                {order.buyerContact && <span className="ml-2 font-mono text-ink-400">{order.buyerContact}</span>}
              </p>
              <p className="text-ink-200">
                <span className="font-medium">应收金额：</span>
                <span className="font-mono text-lg font-bold text-amber-200">¥{formatMoney(order.totalAmount)}</span>
                <span className="ml-2 text-ink-400">· {order.lines.length} 项</span>
                {order.totalWeightKg > 0 && <span className="ml-1 text-ink-400">· {formatWeight(order.totalWeightKg)} kg</span>}
              </p>

              {isShip && (
                <p className="mt-2 rounded-md bg-sky-300/10 px-2.5 py-1.5 text-xs text-sky-200">
                  ⚠ 确认出库后，以下品类库存将同步扣减：
                </p>
              )}
              {isSettle && (
                <p className="mt-2 rounded-md bg-moss-300/10 px-2.5 py-1.5 text-xs text-moss-200">
                  ✓ 确认结算后，订单款项 ¥{formatMoney(order.totalAmount)} 将标记为已收妥
                </p>
              )}
              {isRollback && (
                <p className="mt-2 rounded-md bg-amber-300/10 px-2.5 py-1.5 text-xs text-amber-200">
                  ⚠ 此操作将{order.status === "settled" ? "撤销结算并回滚库存" : "回滚已扣减的库存"}，请谨慎操作
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Line items for ship */}
        {isShip && (
          <div className="overflow-hidden rounded-lg border border-ink-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-800/60 text-xs text-ink-400">
                  <th className="px-3 py-2 text-left font-medium">品类</th>
                  <th className="px-3 py-2 text-center font-medium">单位</th>
                  <th className="px-3 py-2 text-right font-medium">出库数量</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((l, i) => {
                  const parts = l.categoryId.split("_");
                  const type = parts[1] as keyof typeof CATEGORY_META;
                  const cm = CATEGORY_META[type];
                  return (
                    <tr key={i} className="border-t border-ink-700/40">
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1.5 text-ink-100">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cm.color }} />
                          {l.categoryName}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-ink-400">{l.unit === "kg" ? "公斤" : "个"}</td>
                      <td className="px-3 py-2 text-right font-mono text-ink-200">-{l.quantity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Note input */}
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">操作备注（可选）</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              isShip
                ? "例如：司机刘师傅、车牌号浙A·12345"
                : isSettle
                ? "例如：银行转账已到账、现金收讫"
                : "例如：库存盘点异常、买家取消订单"
            }
            className="input"
          />
        </div>
      </div>
    </Modal>
  );
}

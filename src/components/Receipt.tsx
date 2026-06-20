import type { Transaction } from "@/lib/types";
import { formatMoney, unitLabel } from "@/lib/format";
import { useStore } from "@/store";

interface ReceiptProps {
  tx: Transaction;
}

export default function Receipt({ tx }: ReceiptProps) {
  const station = useStore((s) => s.station);
  const date = new Date(tx.createdAt);
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="receipt-body mx-auto w-full bg-white px-4 py-3 font-mono text-[11px] leading-relaxed text-black">
      {/* Header */}
      <div className="text-center">
        <div className="text-[15px] font-bold tracking-wider">{station.name}</div>
        <div className="mt-0.5 text-[9px]">{station.address}</div>
        <div className="text-[9px]">电话：{station.phone}</div>
        <div className="text-[9px]">许可证：{station.license}</div>
      </div>

      <Dashed />

      <div className="text-[10px]">
        <Row label="单号" value={tx.receiptNo} />
        <Row label="日期" value={`${dateStr} ${timeStr}`} />
        <Row label="客户" value={tx.customerName} />
        {tx.phone && <Row label="电话" value={tx.phone} />}
        <Row label="来源" value={tx.source === "onsite" ? "到站交售" : "上门回收"} />
        <Row label="操作员" value={tx.operator} />
      </div>

      <Dashed />

      {/* Items */}
      <div className="text-[10px]">
        <div className="flex font-bold">
          <span className="flex-1">品类</span>
          <span className="w-12 text-center">单位</span>
          <span className="w-14 text-right">数量</span>
          <span className="w-14 text-right">单价</span>
          <span className="w-16 text-right">金额</span>
        </div>
        <Dashed light />
        {tx.lines.map((line, i) => (
          <div key={i} className="flex py-0.5">
            <span className="flex-1 truncate pr-1">{line.categoryName}</span>
            <span className="w-12 text-center">{unitLabel(line.unit)}</span>
            <span className="w-14 text-right tabular">{line.quantity}</span>
            <span className="w-14 text-right tabular">{formatMoney(line.unitPrice)}</span>
            <span className="w-16 text-right tabular">{formatMoney(line.amount)}</span>
          </div>
        ))}
      </div>

      <Dashed />

      {/* Total */}
      <div className="flex items-baseline justify-between py-1 text-[12px] font-bold">
        <span>合计应付</span>
        <span>¥ {formatMoney(tx.totalAmount)}</span>
      </div>
      {tx.totalWeightKg > 0 && (
        <div className="flex justify-between text-[9px] text-gray-600">
          <span>总重量</span>
          <span>{tx.totalWeightKg} kg</span>
        </div>
      )}

      <Dashed />

      {tx.note && (
        <div className="text-[9px] text-gray-700">
          备注：{tx.note}
        </div>
      )}

      {/* Footer */}
      <div className="mt-1 text-center text-[9px] text-gray-700">
        <div>感谢您支持资源循环利用</div>
        <div className="mt-0.5">— 再生一小步，地球一大步 —</div>
      </div>

      <Dashed light />

      {/* QR placeholder */}
      <div className="flex items-center justify-center gap-2 py-1">
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: 49 }).map((_, i) => (
            <div
              key={i}
              className="h-[3px] w-[3px]"
              style={{ background: (i * 7 + (i % 3)) % 2 === 0 ? "#000" : "#fff" }}
            />
          ))}
        </div>
        <div className="text-[8px] leading-tight text-gray-600">
          <div>扫码查验</div>
          <div>交易明细</div>
        </div>
      </div>

      <div className="text-center text-[8px] text-gray-500">
        打印时间 {dateStr} {timeStr} · {tx.id}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Dashed({ light }: { light?: boolean }) {
  return (
    <div
      className="my-1.5 border-t border-dashed"
      style={{ borderColor: light ? "#bbb" : "#000", borderWidth: "1px" }}
    />
  );
}

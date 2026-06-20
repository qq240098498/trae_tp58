import {
  ResponsiveContainer,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
} from "recharts";
import type { DailyAgg } from "@/lib/selectors";
import { formatMoney, formatWeight } from "@/lib/format";

interface TrendChartProps {
  data: DailyAgg[];
}

interface TooltipPayload {
  dataKey: string;
  value: number;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const weight = payload.find((p) => p.dataKey === "weight")?.value ?? 0;
  const amount = payload.find((p) => p.dataKey === "amount")?.value ?? 0;
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-850/95 px-3 py-2 text-xs shadow-panel backdrop-blur">
      <p className="mb-1 font-medium text-ink-200">{label}</p>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-moss-300" />
        <span className="text-ink-300">入库重量</span>
        <span className="font-mono font-semibold text-ink-100">{formatWeight(weight)} kg</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-300" />
        <span className="text-ink-300">应付金额</span>
        <span className="font-mono font-semibold text-ink-100">¥ {formatMoney(amount)}</span>
      </div>
    </div>
  );
}

export default function TrendChart({ data }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7BA35F" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#7BA35F" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="amountGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8A33D" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#E8A33D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(146,158,130,0.12)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#6E7860", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "rgba(146,158,130,0.15)" }}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: "#6E7860", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "#6E7860", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `¥${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(232,163,61,0.3)", strokeWidth: 1 }} />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="weight"
          stroke="#7BA35F"
          strokeWidth={2}
          fill="url(#weightGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#7BA35F", stroke: "#1A1D16", strokeWidth: 2 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="amount"
          stroke="#E8A33D"
          strokeWidth={2}
          fill="url(#amountGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#E8A33D", stroke: "#1A1D16", strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

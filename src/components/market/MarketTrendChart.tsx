import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
} from "recharts";
import type { MarketPrice } from "@/lib/types";
import { formatMoney } from "@/lib/format";

interface MarketTrendChartProps {
  marketPrice: MarketPrice;
  height?: number;
}

interface ChartPoint {
  label: string;
  buyPrice: number;
  sellPrice: number;
  date: string;
}

export default function MarketTrendChart({ marketPrice, height = 200 }: MarketTrendChartProps) {
  const data: ChartPoint[] = marketPrice.weekTrend.map((p) => ({
    label: p.date.slice(5).replace("-", "/"),
    buyPrice: p.buyPrice,
    sellPrice: p.sellPrice,
    date: p.date,
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(146,158,130,0.12)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#6E7860", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(146,158,130,0.15)" }}
          />
          <YAxis
            tick={{ fill: "#6E7860", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `¥${v >= 100 ? `${(v / 100).toFixed(0)}` : v}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const buy = payload.find((p) => p.dataKey === "buyPrice")?.value ?? 0;
              const sell = payload.find((p) => p.dataKey === "sellPrice")?.value ?? 0;
              return (
                <div className="rounded-lg border border-ink-600 bg-ink-850/95 px-3 py-2 text-xs shadow-panel backdrop-blur">
                  <p className="mb-1 font-medium text-ink-200">{label}</p>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-moss-300" />
                    <span className="text-ink-300">参考收购价</span>
                    <span className="font-mono font-semibold text-ink-100">¥{formatMoney(buy as number)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-300" />
                    <span className="text-ink-300">参考出货价</span>
                    <span className="font-mono font-semibold text-ink-100">¥{formatMoney(sell as number)}</span>
                  </div>
                </div>
              );
            }}
            cursor={{ stroke: "rgba(232,163,61,0.3)", strokeWidth: 1 }}
          />
          <Legend
            iconSize={8}
            wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
            formatter={(value: string) => (
              <span className="text-ink-400">
                {value === "buyPrice" ? "收购参考价" : "出货参考价"}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="buyPrice"
            stroke="#7BA35F"
            strokeWidth={2}
            dot={{ r: 3, fill: "#7BA35F", stroke: "#1A1D16", strokeWidth: 1 }}
            activeDot={{ r: 5, fill: "#7BA35F", stroke: "#1A1D16", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="sellPrice"
            stroke="#E8A33D"
            strokeWidth={2}
            dot={{ r: 3, fill: "#E8A33D", stroke: "#1A1D16", strokeWidth: 1 }}
            activeDot={{ r: 5, fill: "#E8A33D", stroke: "#1A1D16", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

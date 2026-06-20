import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { CategoryAgg } from "@/lib/selectors";
import { CATEGORY_META, formatMoney, formatWeight } from "@/lib/format";

interface CategoryDonutProps {
  data: CategoryAgg[];
}

export default function CategoryDonut({ data }: CategoryDonutProps) {
  const total = data.reduce((s, d) => s + d.weight, 0);
  const chartData = data
    .filter((d) => d.weight > 0)
    .map((d) => ({ name: CATEGORY_META[d.type].label, value: d.weight, type: d.type, amount: d.amount }));

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={68}
              paddingAngle={3}
              stroke="none"
            >
              {chartData.map((entry) => (
                <Cell key={entry.type} fill={CATEGORY_META[entry.type].color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-bold text-ink-100">{formatWeight(total)}</span>
          <span className="text-[10px] text-ink-400">kg 总入库</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {chartData.map((d) => (
          <div key={d.type} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: CATEGORY_META[d.type].color }}
            />
            <span className="flex-1 text-ink-200">{d.name}</span>
            <span className="font-mono text-ink-300">{formatWeight(d.value)}kg</span>
            <span className="font-mono w-16 text-right text-amber-200">¥{formatMoney(d.amount)}</span>
          </div>
        ))}
        {chartData.length === 0 && (
          <p className="text-xs text-ink-400">暂无入库数据</p>
        )}
      </div>
    </div>
  );
}

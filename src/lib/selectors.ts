import type { Transaction, SalesOrder, InventoryBucket, Category } from "@/lib/types";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/format";

export function isToday(ts: number): boolean {
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function sameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export interface DailyAgg {
  date: string;
  label: string;
  weight: number;
  amount: number;
  count: number;
}

export function aggregateByDay(transactions: Transaction[], days: number): DailyAgg[] {
  const out: DailyAgg[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({ date: dateStr, label, weight: 0, amount: 0, count: 0 });
  }
  for (const tx of transactions) {
    if (tx.status === "void") continue;
    const td = new Date(tx.createdAt);
    const txStr = `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, "0")}-${String(td.getDate()).padStart(2, "0")}`;
    const bucket = out.find((o) => o.date === txStr);
    if (bucket) {
      bucket.weight += tx.totalWeightKg;
      bucket.amount += tx.totalAmount;
      bucket.count += 1;
    }
  }
  return out.map((o) => ({
    ...o,
    weight: Math.round(o.weight * 10) / 10,
    amount: Math.round(o.amount * 100) / 100,
  }));
}

export interface CategoryAgg {
  type: Category["type"];
  weight: number;
  amount: number;
}

export function aggregateByCategoryType(transactions: Transaction[]): CategoryAgg[] {
  const map = new Map<Category["type"], CategoryAgg>();
  for (const c of CATEGORY_ORDER) {
    map.set(c, { type: c, weight: 0, amount: 0 });
  }
  for (const tx of transactions) {
    if (tx.status === "void") continue;
    for (const line of tx.lines) {
      const cat = line.categoryId.split("_")[1] as Category["type"];
      const entry = map.get(cat);
      if (!entry) continue;
      if (line.unit === "kg") entry.weight += line.quantity;
      entry.amount += line.amount;
    }
  }
  return Array.from(map.values()).map((v) => ({
    ...v,
    weight: Math.round(v.weight * 10) / 10,
    amount: Math.round(v.amount * 100) / 100,
  }));
}

export function inventoryUtilization(bucket: InventoryBucket): number {
  if (bucket.capacityKg <= 0) return 0;
  const used = bucket.weightKg;
  return Math.min(100, Math.round((used / bucket.capacityKg) * 100));
}

export function totalInventoryWeight(inventory: InventoryBucket[]): number {
  return Math.round(inventory.reduce((s, b) => s + b.weightKg, 0) * 10) / 10;
}

export function totalInventoryValue(
  inventory: InventoryBucket[],
  categories: Category[]
): number {
  let sum = 0;
  for (const b of inventory) {
    const cat = categories.find((c) => c.id === b.categoryId);
    if (!cat) continue;
    if (b.weightKg) sum += b.weightKg * cat.unitPrice;
    if (b.pieceCount) sum += b.pieceCount * cat.unitPrice;
  }
  return Math.round(sum * 100) / 100;
}

export function todayIntake(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => t.status === "active" && isToday(t.createdAt));
}

export function todaySales(sales: SalesOrder[]): SalesOrder[] {
  return sales.filter((s) => s.status !== "draft" && isToday(s.settledAt ?? s.createdAt));
}

export function categoryColor(type: Category["type"]): string {
  return CATEGORY_META[type].color;
}

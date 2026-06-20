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

export interface ProfitByCategory {
  categoryId: string;
  categoryName: string;
  type: Category["type"];
  quantity: number;
  unit: "kg" | "piece";
  salesAmount: number;
  costAmount: number;
  grossProfit: number;
  grossMargin: number;
}

export function aggregateProfitByCategory(
  salesOrders: SalesOrder[],
  options?: { startDate?: string; endDate?: string; buyerId?: string }
): ProfitByCategory[] {
  const map = new Map<string, ProfitByCategory>();

  for (const order of salesOrders) {
    if (order.status === "draft") continue;

    const orderDate = new Date(order.settledAt ?? order.createdAt);
    const dateStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}-${String(orderDate.getDate()).padStart(2, "0")}`;

    if (options?.startDate && dateStr < options.startDate) continue;
    if (options?.endDate && dateStr > options.endDate) continue;
    if (options?.buyerId && order.buyerId !== options.buyerId) continue;

    for (const line of order.lines) {
      const existing = map.get(line.categoryId);
      if (existing) {
        existing.quantity += line.quantity;
        existing.salesAmount += line.amount;
        existing.costAmount += line.costAmount;
        existing.grossProfit += line.grossProfit;
      } else {
        const type = line.categoryId.split("_")[1] as Category["type"];
        map.set(line.categoryId, {
          categoryId: line.categoryId,
          categoryName: line.categoryName,
          type,
          quantity: line.quantity,
          unit: line.unit,
          salesAmount: line.amount,
          costAmount: line.costAmount,
          grossProfit: line.grossProfit,
          grossMargin: 0,
        });
      }
    }
  }

  return Array.from(map.values()).map((item) => ({
    ...item,
    quantity: Math.round(item.quantity * 100) / 100,
    salesAmount: Math.round(item.salesAmount * 100) / 100,
    costAmount: Math.round(item.costAmount * 100) / 100,
    grossProfit: Math.round(item.grossProfit * 100) / 100,
    grossMargin: item.salesAmount > 0 ? Math.round((item.grossProfit / item.salesAmount) * 10000) / 100 : 0,
  })).sort((a, b) => b.grossProfit - a.grossProfit);
}

export interface ProfitByBuyer {
  buyerId: string;
  buyerName: string;
  orderCount: number;
  salesAmount: number;
  costAmount: number;
  grossProfit: number;
  grossMargin: number;
}

export function aggregateProfitByBuyer(
  salesOrders: SalesOrder[],
  options?: { startDate?: string; endDate?: string; categoryId?: string }
): ProfitByBuyer[] {
  const map = new Map<string, ProfitByBuyer>();

  for (const order of salesOrders) {
    if (order.status === "draft") continue;

    const orderDate = new Date(order.settledAt ?? order.createdAt);
    const dateStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}-${String(orderDate.getDate()).padStart(2, "0")}`;

    if (options?.startDate && dateStr < options.startDate) continue;
    if (options?.endDate && dateStr > options.endDate) continue;

    let orderSales = 0;
    let orderCost = 0;
    let orderProfit = 0;

    if (options?.categoryId) {
      for (const line of order.lines) {
        if (line.categoryId === options.categoryId) {
          orderSales += line.amount;
          orderCost += line.costAmount;
          orderProfit += line.grossProfit;
        }
      }
      if (orderSales === 0) continue;
    } else {
      orderSales = order.totalAmount;
      orderCost = order.totalCost;
      orderProfit = order.totalGrossProfit;
    }

    const existing = map.get(order.buyerId);
    if (existing) {
      existing.orderCount += 1;
      existing.salesAmount += orderSales;
      existing.costAmount += orderCost;
      existing.grossProfit += orderProfit;
    } else {
      map.set(order.buyerId, {
        buyerId: order.buyerId,
        buyerName: order.buyerName,
        orderCount: 1,
        salesAmount: orderSales,
        costAmount: orderCost,
        grossProfit: orderProfit,
        grossMargin: 0,
      });
    }
  }

  return Array.from(map.values()).map((item) => ({
    ...item,
    salesAmount: Math.round(item.salesAmount * 100) / 100,
    costAmount: Math.round(item.costAmount * 100) / 100,
    grossProfit: Math.round(item.grossProfit * 100) / 100,
    grossMargin: item.salesAmount > 0 ? Math.round((item.grossProfit / item.salesAmount) * 10000) / 100 : 0,
  })).sort((a, b) => b.grossProfit - a.grossProfit);
}

export interface ProfitByDay {
  date: string;
  label: string;
  orderCount: number;
  salesAmount: number;
  costAmount: number;
  grossProfit: number;
  grossMargin: number;
}

export function aggregateProfitByDay(
  salesOrders: SalesOrder[],
  days: number,
  options?: { buyerId?: string; categoryId?: string }
): ProfitByDay[] {
  const out: ProfitByDay[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({ date: dateStr, label, orderCount: 0, salesAmount: 0, costAmount: 0, grossProfit: 0, grossMargin: 0 });
  }

  for (const order of salesOrders) {
    if (order.status === "draft") continue;

    const orderDate = new Date(order.settledAt ?? order.createdAt);
    const dateStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}-${String(orderDate.getDate()).padStart(2, "0")}`;

    const bucket = out.find((o) => o.date === dateStr);
    if (!bucket) continue;

    if (options?.buyerId && order.buyerId !== options.buyerId) continue;

    let orderSales = 0;
    let orderCost = 0;
    let orderProfit = 0;

    if (options?.categoryId) {
      for (const line of order.lines) {
        if (line.categoryId === options.categoryId) {
          orderSales += line.amount;
          orderCost += line.costAmount;
          orderProfit += line.grossProfit;
        }
      }
      if (orderSales === 0) continue;
    } else {
      orderSales = order.totalAmount;
      orderCost = order.totalCost;
      orderProfit = order.totalGrossProfit;
    }

    bucket.orderCount += 1;
    bucket.salesAmount += orderSales;
    bucket.costAmount += orderCost;
    bucket.grossProfit += orderProfit;
  }

  return out.map((o) => ({
    ...o,
    salesAmount: Math.round(o.salesAmount * 100) / 100,
    costAmount: Math.round(o.costAmount * 100) / 100,
    grossProfit: Math.round(o.grossProfit * 100) / 100,
    grossMargin: o.salesAmount > 0 ? Math.round((o.grossProfit / o.salesAmount) * 10000) / 100 : 0,
  }));
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppState,
  Transaction,
  TransactionLine,
  Appointment,
  AppointmentStatus,
  SalesOrder,
  SalesLine,
  SalesStatus,
  InventoryBucket,
  Settlement,
  MarketPrice,
  PickupRoute,
  RouteStatus,
  PickupPhoto,
  PickupWeighing,
  PickupStatus,
} from "@/lib/types";
import { buildSeed, LEAF_CATEGORIES } from "@/lib/seed";

export const MIN_PRICE = 0;
export const MAX_PRICE = 99999.99;
export const MAX_SELL_BUY_RATIO = 10;

export function clampPrice(value: number, min = MIN_PRICE, max = MAX_PRICE): number {
  if (!Number.isFinite(value) || Number.isNaN(value)) return min;
  const rounded = Math.round(value * 100) / 100;
  return Math.min(max, Math.max(min, rounded));
}

export function isPriceValid(value: number, min = MIN_PRICE, max = MAX_PRICE): boolean {
  return Number.isFinite(value) && !Number.isNaN(value) && value >= min && value <= max;
}

export interface PriceValidation {
  valid: boolean;
  error?: string;
}

export function validatePricePair(buyPrice: number, sellPrice: number): PriceValidation {
  if (!isPriceValid(buyPrice)) {
    return { valid: false, error: `收购价需在 ${MIN_PRICE} ~ ${MAX_PRICE} 元之间` };
  }
  if (!isPriceValid(sellPrice)) {
    return { valid: false, error: `出货价需在 ${MIN_PRICE} ~ ${MAX_PRICE} 元之间` };
  }
  if (buyPrice > 0 && sellPrice > 0 && sellPrice < buyPrice) {
    return { valid: false, error: "出货价不应低于收购价，否则将亏损" };
  }
  if (buyPrice > 0 && sellPrice / buyPrice > MAX_SELL_BUY_RATIO) {
    return { valid: false, error: `出货价不应超过收购价的 ${MAX_SELL_BUY_RATIO} 倍，请确认是否录入有误` };
  }
  return { valid: true };
}

interface StoreState extends AppState {
  updatePrice: (categoryId: string, newPrice: number, note?: string) => void;
  toggleCategoryActive: (categoryId: string) => void;
  createTransaction: (input: {
    source: Transaction["source"];
    customerId: string;
    customerName: string;
    phone?: string;
    lines: TransactionLine[];
    note?: string;
  }) => Transaction;
  voidTransaction: (id: string) => void;
  createAppointment: (input: Omit<Appointment, "id" | "createdAt" | "status">) => Appointment;
  updateAppointmentStatus: (id: string, status: AppointmentStatus, extra?: Partial<Appointment>) => void;
  updateAppointmentPickupStatus: (id: string, pickupStatus: PickupStatus, extra?: Partial<Appointment>) => void;
  createSalesOrder: (input: {
    buyerId: string;
    buyerName: string;
    buyerContact?: string;
    lines: SalesLine[];
    note?: string;
  }) => SalesOrder;
  updateSalesStatus: (id: string, status: SalesStatus, operator?: string, note?: string) => void;
  lockSettlement: (date: string, data: Omit<Settlement, "id" | "date" | "locked" | "createdAt" | "byCategory">) => Settlement;
  resetData: () => void;
  recordMarketPrice: (input: {
    categoryId: string;
    buyPrice: number;
    sellPrice: number;
    note?: string;
  }) => void;
  getMarketPrice: (categoryId: string) => MarketPrice | undefined;
  generateRoutes: (options?: { date?: number }) => PickupRoute[];
  createPickupRoute: (input: Omit<PickupRoute, "id" | "createdAt" | "status"> & { appointmentIds: string[] }) => PickupRoute;
  updateRouteStatus: (id: string, status: RouteStatus, extra?: Partial<PickupRoute>) => void;
  assignAppointmentToRoute: (appointmentId: string, routeId: string) => void;
  unassignAppointmentFromRoute: (appointmentId: string) => void;
  addPickupPhoto: (input: Omit<PickupPhoto, "id" | "uploadedAt">) => PickupPhoto;
  removePickupPhoto: (id: string) => void;
  addPickupWeighing: (input: Omit<PickupWeighing, "id" | "recordedAt">) => PickupWeighing;
  removePickupWeighing: (id: string) => void;
  getAppointmentPhotos: (appointmentId: string) => PickupPhoto[];
  getAppointmentWeighings: (appointmentId: string) => PickupWeighing[];
  getRouteAppointments: (routeId: string) => Appointment[];
}

function bumpInventory(inventory: InventoryBucket[], lines: (TransactionLine | SalesLine)[], dir: 1 | -1): InventoryBucket[] {
  const map = new Map(inventory.map((b) => [b.categoryId, { ...b }]));
  const locations: Record<string, string> = {
    cat_paper_cardboard: "A-01", cat_paper_newspaper: "A-02", cat_paper_book: "A-03", cat_paper_mixed: "A-04",
    cat_plastic_pet: "B-01", cat_plastic_hard: "B-02", cat_plastic_film: "B-03",
    cat_metal_iron: "C-01", cat_metal_copper: "C-02", cat_metal_brass: "C-03", cat_metal_aluminum: "C-04", cat_metal_steel: "C-05",
    cat_app_ac: "D-01", cat_app_fridge: "D-02", cat_app_washer: "D-03", cat_app_tv: "D-04", cat_app_pc: "D-05",
    cat_clo_summer: "E-01", cat_clo_winter: "E-02", cat_clo_shoes: "E-03",
  };
  const capacities: Record<string, number> = {
    cat_paper_cardboard: 800, cat_paper_newspaper: 500, cat_paper_book: 300, cat_paper_mixed: 300,
    cat_plastic_pet: 400, cat_plastic_hard: 400, cat_plastic_film: 300,
    cat_metal_iron: 1200, cat_metal_copper: 80, cat_metal_brass: 80, cat_metal_aluminum: 150, cat_metal_steel: 200,
    cat_app_ac: 30, cat_app_fridge: 30, cat_app_washer: 30, cat_app_tv: 30, cat_app_pc: 30,
    cat_clo_summer: 400, cat_clo_winter: 400, cat_clo_shoes: 300,
  };
  for (const line of lines) {
    const existing = map.get(line.categoryId) ?? {
      categoryId: line.categoryId,
      weightKg: 0,
      pieceCount: 0,
      location: locations[line.categoryId] ?? "Z-99",
      capacityKg: capacities[line.categoryId] ?? 300,
    };
    if (line.unit === "kg") {
      existing.weightKg = Math.max(0, Math.round((existing.weightKg + dir * line.quantity) * 10) / 10);
    } else {
      existing.pieceCount = Math.max(0, existing.pieceCount + dir * Math.round(line.quantity));
    }
    map.set(line.categoryId, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.location.localeCompare(b.location));
}

function nextReceiptNo(transactions: Transaction[]): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const todayCount = transactions.filter((t) => t.receiptNo.startsWith(dateStr)).length + 1;
  return `${dateStr}-${String(todayCount).padStart(3, "0")}`;
}

function nextId(prefix: string, existing: { id: string }[]): string {
  const nums = existing.map((x) => parseInt(x.id.replace(/\D/g, ""), 10) || 0);
  const max = nums.length ? Math.max(...nums) : 0;
  const pad = Math.max(4, String(max).length);
  return `${prefix}${String(max + 1).padStart(pad, "0")}`;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...buildSeed(),

      updatePrice: (categoryId, newPrice, note) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  unitPrice: newPrice,
                  updatedAt: Date.now(),
                  priceHistory: [...c.priceHistory, { price: newPrice, at: Date.now(), note }],
                }
              : c
          ),
        })),

      toggleCategoryActive: (categoryId) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === categoryId ? { ...c, active: !c.active, updatedAt: Date.now() } : c
          ),
        })),

      createTransaction: ({ source, customerId, customerName, phone, lines, note }) => {
        const state = get();
        const totalAmount = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
        const totalWeightKg = Math.round(lines.reduce((s, l) => s + (l.unit === "kg" ? l.quantity : 0), 0) * 10) / 10;
        const receiptNo = nextReceiptNo(state.transactions);
        const now = Date.now();
        const tx: Transaction = {
          id: `T${receiptNo.replace(/-/g, "")}`,
          source,
          customerId,
          customerName,
          phone,
          createdAt: now,
          totalAmount,
          totalWeightKg,
          receiptNo,
          status: "active",
          lines,
          operator: state.station.operator,
          note,
        };
        set((s) => ({
          transactions: [tx, ...s.transactions],
          inventory: bumpInventory(s.inventory, lines, 1),
          sortRecords: [
            ...lines.map((line, i) => ({
              id: `SR${String(s.sortRecords.length + i + 1).padStart(4, "0")}`,
              createdAt: now + i * 1000,
              operator: "系统自动",
              fromTransactionId: tx.id,
              categoryId: line.categoryId,
              categoryName: line.categoryName,
              quantity: line.quantity,
              unit: line.unit,
              targetLocation: line.categoryId.startsWith("cat_paper") ? "A 区" : line.categoryId.startsWith("cat_metal") ? "C 区" : "B 区",
            })),
            ...s.sortRecords,
          ],
        }));
        return tx;
      },

      voidTransaction: (id) =>
        set((state) => {
          const tx = state.transactions.find((t) => t.id === id);
          if (!tx || tx.status === "void") return {};
          return {
            transactions: state.transactions.map((t) =>
              t.id === id ? { ...t, status: "void" as const } : t
            ),
            inventory: bumpInventory(state.inventory, tx.lines, -1),
          };
        }),

      createAppointment: (input) => {
        const state = get();
        const appt: Appointment = {
          ...input,
          id: nextId("AP", state.appointments),
          createdAt: Date.now(),
          status: "pending",
        };
        set((s) => ({ appointments: [appt, ...s.appointments] }));
        return appt;
      },

      updateAppointmentStatus: (id, status, extra) =>
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, status, ...extra } : a
          ),
        })),

      createSalesOrder: ({ buyerId, buyerName, buyerContact, lines, note }) => {
        const state = get();
        const totalAmount = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
        const totalWeightKg = Math.round(lines.reduce((s, l) => s + (l.unit === "kg" ? l.quantity : 0), 0) * 10) / 10;
        const now = Date.now();
        const order: SalesOrder = {
          id: nextId("SO", state.salesOrders),
          buyerId,
          buyerName,
          buyerContact,
          createdAt: now,
          totalAmount,
          totalWeightKg,
          status: "draft",
          lines,
          note,
          statusLog: [{ status: "draft", at: now, operator: state.station.operator, note: "创建出货单" }],
        };
        set((s) => ({ salesOrders: [order, ...s.salesOrders] }));
        return order;
      },

      updateSalesStatus: (id, status, operator, note) =>
        set((state) => {
          const order = state.salesOrders.find((o) => o.id === id);
          if (!order) return {};
          const wasShipped = order.status === "shipped" || order.status === "settled";
          const willShip = status === "shipped" || status === "settled";
          let inventory = state.inventory;
          if (!wasShipped && willShip) {
            inventory = bumpInventory(state.inventory, order.lines, -1);
          } else if (wasShipped && status === "draft") {
            inventory = bumpInventory(state.inventory, order.lines, 1);
          }
          const now = Date.now();
          return {
            salesOrders: state.salesOrders.map((o) =>
              o.id === id
                ? {
                    ...o,
                    status,
                    settledAt: status === "settled" ? now : o.settledAt,
                    statusLog: [
                      ...o.statusLog,
                      { status, at: now, operator: operator ?? state.station.operator, note },
                    ],
                  }
                : o
            ),
            inventory,
          };
        }),

      lockSettlement: (date, data) => {
        const state = get();
        const byCategoryMap = new Map<string, { categoryName: string; intake: number; sales: number; profit: number }>();
        for (const tx of state.transactions) {
          if (tx.status === "void") continue;
          const txDate = new Date(tx.createdAt);
          const txDateStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}-${String(txDate.getDate()).padStart(2, "0")}`;
          if (txDateStr !== date) continue;
          for (const line of tx.lines) {
            const entry = byCategoryMap.get(line.categoryId) ?? { categoryName: line.categoryName, intake: 0, sales: 0, profit: 0 };
            entry.intake += line.amount;
            byCategoryMap.set(line.categoryId, entry);
          }
        }
        for (const order of state.salesOrders) {
          if (order.status !== "settled" && order.status !== "shipped") continue;
          const od = new Date(order.settledAt ?? order.createdAt);
          const odStr = `${od.getFullYear()}-${String(od.getMonth() + 1).padStart(2, "0")}-${String(od.getDate()).padStart(2, "0")}`;
          if (odStr !== date) continue;
          for (const line of order.lines) {
            const cat = state.categories.find((c) => c.id === line.categoryId);
            const cost = cat ? cat.unitPrice * line.quantity : 0;
            const entry = byCategoryMap.get(line.categoryId) ?? { categoryName: line.categoryName, intake: 0, sales: 0, profit: 0 };
            entry.sales += line.amount;
            entry.profit += line.amount - cost;
            byCategoryMap.set(line.categoryId, entry);
          }
        }
        const byCategory = Array.from(byCategoryMap.entries()).map(([categoryId, v]) => ({
          categoryId,
          categoryName: v.categoryName,
          intake: Math.round(v.intake * 100) / 100,
          sales: Math.round(v.sales * 100) / 100,
          profit: Math.round(v.profit * 100) / 100,
        }));
        const settlement: Settlement = {
          id: `ST${date.replace(/-/g, "")}`,
          date,
          ...data,
          locked: true,
          createdAt: Date.now(),
          byCategory,
        };
        set((s) => ({
          settlements: [settlement, ...s.settlements.filter((x) => x.date !== date)],
        }));
        return settlement;
      },

      resetData: () => set({ ...buildSeed() }),

      recordMarketPrice: ({ categoryId, buyPrice, sellPrice, note }) =>
        set((state) => {
          const now = Date.now();
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          const cat = state.categories.find((c) => c.id === categoryId);
          if (!cat) return {};

          const safeBuy = clampPrice(buyPrice, 0, MAX_PRICE);
          const safeSell = clampPrice(sellPrice, 0, MAX_PRICE);

          return {
            marketPrices: state.marketPrices.map((mp) => {
              if (mp.categoryId !== categoryId) return mp;
              const existingTodayIdx = mp.weekTrend.findIndex((p) => p.date === todayStr);
              let newTrend = [...mp.weekTrend];
              const newPoint = {
                date: todayStr,
                buyPrice: safeBuy,
                sellPrice: safeSell,
                source: "manual" as const,
                note,
                recordedAt: now,
              };
              if (existingTodayIdx >= 0) {
                newTrend[existingTodayIdx] = newPoint;
              } else {
                newTrend = [...newTrend.slice(-6), newPoint];
              }
              return {
                ...mp,
                currentBuy: safeBuy,
                currentSell: safeSell,
                weekTrend: newTrend,
                updatedAt: now,
              };
            }),
          };
        }),

      getMarketPrice: (categoryId) => {
        const state = get();
        return state.marketPrices.find((mp) => mp.categoryId === categoryId);
      },

      updateAppointmentPickupStatus: (id, pickupStatus, extra) =>
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, pickupStatus, ...extra } : a
          ),
        })),

      generateRoutes: (options) => {
        const state = get();
        const targetDate = options?.date ?? Date.now();
        const d = new Date(targetDate);
        const isSameDay = (ts: number) => {
          const td = new Date(ts);
          return (
            td.getFullYear() === d.getFullYear() &&
            td.getMonth() === d.getMonth() &&
            td.getDate() === d.getDate()
          );
        };

        const pendingAppts = state.appointments.filter(
          (a) =>
            (a.status === "pending" || a.status === "dispatched") &&
            isSameDay(a.appointmentTime)
        );

        const regionGroups = new Map<string, Appointment[]>();
        for (const appt of pendingAppts) {
          if (appt.routeId && state.pickupRoutes.some((r) => r.id === appt.routeId)) continue;
          let region = appt.region;
          if (!region) {
            const match = appt.address.match(/^(?:\w+市)?([\u4e00-\u9fa5]+区)/);
            region = match ? match[1] : "其他区域";
          }
          if (!regionGroups.has(region)) regionGroups.set(region, []);
          regionGroups.get(region)!.push(appt);
        }

        const drivers = ["刘师傅", "王师傅", "陈师傅"];
        const newRoutes: PickupRoute[] = [];
        let routeIdx = state.pickupRoutes.filter((r) => isSameDay(r.createdAt)).length;

        for (const [region, appts] of regionGroups) {
          if (appts.length === 0) continue;
          routeIdx++;
          const totalWeight = appts.reduce((s, a) => s + a.estimatedWeight, 0);
          const route: PickupRoute = {
            id: nextId("RT", state.pickupRoutes.concat(newRoutes)),
            name: `${region}路线${routeIdx}`,
            region,
            driver: drivers[routeIdx % drivers.length],
            status: "planning",
            appointmentIds: appts.map((a) => a.id),
            createdAt: Date.now(),
            estimatedDistanceKm: 5 + Math.round(appts.length * 1.5 * 10) / 10,
            totalEstimatedWeight: totalWeight,
          };
          newRoutes.push(route);
        }

        const updatedAppts = state.appointments.map((a) => {
          const route = newRoutes.find((r) => r.appointmentIds.includes(a.id));
          if (route) return { ...a, routeId: route.id };
          return a;
        });

        set((s) => ({
          pickupRoutes: [...s.pickupRoutes, ...newRoutes],
          appointments: updatedAppts,
        }));

        return newRoutes;
      },

      createPickupRoute: (input) => {
        const state = get();
        const route: PickupRoute = {
          ...input,
          id: nextId("RT", state.pickupRoutes),
          createdAt: Date.now(),
          status: "planning",
        };
        set((s) => ({
          pickupRoutes: [route, ...s.pickupRoutes],
          appointments: s.appointments.map((a) =>
            input.appointmentIds.includes(a.id) ? { ...a, routeId: route.id } : a
          ),
        }));
        return route;
      },

      updateRouteStatus: (id, status, extra) =>
        set((state) => {
          const now = Date.now();
          return {
            pickupRoutes: state.pickupRoutes.map((r) =>
              r.id === id
                ? {
                    ...r,
                    status,
                    ...extra,
                    dispatchedAt: status === "dispatched" || status === "in_progress" ? now : r.dispatchedAt,
                    completedAt: status === "completed" ? now : r.completedAt,
                  }
                : r
            ),
            appointments: state.appointments.map((a) =>
              a.routeId === id && (status === "dispatched" || status === "in_progress")
                ? { ...a, status: "dispatched" as AppointmentStatus }
                : a
            ),
          };
        }),

      assignAppointmentToRoute: (appointmentId, routeId) =>
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === appointmentId ? { ...a, routeId } : a
          ),
          pickupRoutes: state.pickupRoutes.map((r) =>
            r.id === routeId && !r.appointmentIds.includes(appointmentId)
              ? {
                  ...r,
                  appointmentIds: [...r.appointmentIds, appointmentId],
                  totalEstimatedWeight:
                    (r.totalEstimatedWeight ?? 0) +
                    (state.appointments.find((a) => a.id === appointmentId)?.estimatedWeight ?? 0),
                }
              : r
          ),
        })),

      unassignAppointmentFromRoute: (appointmentId) =>
        set((state) => {
          const appt = state.appointments.find((a) => a.id === appointmentId);
          if (!appt?.routeId) return {};
          const routeId = appt.routeId;
          return {
            appointments: state.appointments.map((a) =>
              a.id === appointmentId ? { ...a, routeId: undefined } : a
            ),
            pickupRoutes: state.pickupRoutes.map((r) =>
              r.id === routeId
                ? {
                    ...r,
                    appointmentIds: r.appointmentIds.filter((id) => id !== appointmentId),
                    totalEstimatedWeight: Math.max(
                      0,
                      (r.totalEstimatedWeight ?? 0) - (appt.estimatedWeight ?? 0)
                    ),
                  }
                : r
            ),
          };
        }),

      addPickupPhoto: (input) => {
        const state = get();
        const photo: PickupPhoto = {
          ...input,
          id: nextId("PH", state.pickupPhotos),
          uploadedAt: Date.now(),
        };
        set((s) => ({ pickupPhotos: [photo, ...s.pickupPhotos] }));
        return photo;
      },

      removePickupPhoto: (id) =>
        set((state) => ({
          pickupPhotos: state.pickupPhotos.filter((p) => p.id !== id),
        })),

      addPickupWeighing: (input) => {
        const state = get();
        const weighing: PickupWeighing = {
          ...input,
          id: nextId("PW", state.pickupWeighings),
          recordedAt: Date.now(),
        };
        set((s) => ({ pickupWeighings: [weighing, ...s.pickupWeighings] }));
        return weighing;
      },

      removePickupWeighing: (id) =>
        set((state) => ({
          pickupWeighings: state.pickupWeighings.filter((w) => w.id !== id),
        })),

      getAppointmentPhotos: (appointmentId) => {
        const state = get();
        return state.pickupPhotos.filter((p) => p.appointmentId === appointmentId);
      },

      getAppointmentWeighings: (appointmentId) => {
        const state = get();
        return state.pickupWeighings.filter((w) => w.appointmentId === appointmentId);
      },

      getRouteAppointments: (routeId) => {
        const state = get();
        return state.appointments.filter((a) => a.routeId === routeId);
      },
    }),
    {
      name: "recycle-station-db",
      version: 2,
    }
  )
);

export { LEAF_CATEGORIES };

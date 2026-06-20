export type CategoryType = "paper" | "plastic" | "metal" | "appliance" | "clothing";
export type PriceUnit = "kg" | "piece";
export type TxSource = "onsite" | "pickup";
export type TxStatus = "active" | "void";
export type AppointmentStatus = "pending" | "dispatched" | "completed" | "cancelled";
export type SalesStatus = "draft" | "shipped" | "settled";

export interface PriceHistory {
  price: number;
  at: number;
  note?: string;
}

export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  type: CategoryType;
  unit: PriceUnit;
  unitPrice: number;
  active: boolean;
  updatedAt: number;
  priceHistory: PriceHistory[];
}

export interface TransactionLine {
  categoryId: string;
  categoryName: string;
  unit: PriceUnit;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Transaction {
  id: string;
  source: TxSource;
  customerId: string;
  customerName: string;
  phone?: string;
  createdAt: number;
  totalAmount: number;
  totalWeightKg: number;
  receiptNo: string;
  status: TxStatus;
  lines: TransactionLine[];
  operator: string;
  note?: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  address: string;
  estimatedWeight: number;
  categoryIds: string[];
  status: AppointmentStatus;
  appointmentTime: number;
  createdAt: number;
  actualTransactionId?: string;
  note?: string;
  driver?: string;
}

export interface SalesLine {
  categoryId: string;
  categoryName: string;
  unit: PriceUnit;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface SalesStatusLog {
  status: SalesStatus;
  at: number;
  operator?: string;
  note?: string;
}

export interface SalesOrder {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerContact?: string;
  createdAt: number;
  settledAt?: number;
  totalAmount: number;
  totalWeightKg: number;
  status: SalesStatus;
  lines: SalesLine[];
  note?: string;
  statusLog: SalesStatusLog[];
}

export interface InventoryBucket {
  categoryId: string;
  weightKg: number;
  pieceCount: number;
  location: string;
  capacityKg: number;
}

export interface SortRecord {
  id: string;
  createdAt: number;
  operator: string;
  fromTransactionId?: string;
  categoryId: string;
  categoryName: string;
  quantity: number;
  unit: PriceUnit;
  targetLocation: string;
}

export interface Settlement {
  id: string;
  date: string;
  payable: number;
  receivable: number;
  grossProfit: number;
  intakeCount: number;
  salesCount: number;
  totalWeightKg: number;
  locked: boolean;
  createdAt: number;
  byCategory: { categoryId: string; categoryName: string; intake: number; sales: number; profit: number }[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: "individual" | "buyer" | "supplier";
  createdAt: number;
}

export interface StationInfo {
  name: string;
  address: string;
  phone: string;
  license: string;
  operator: string;
}

export interface MarketPricePoint {
  date: string;
  buyPrice: number;
  sellPrice: number;
  source: "manual" | "local" | "seed";
  note?: string;
  recordedAt: number;
}

export interface MarketPrice {
  categoryId: string;
  categoryName: string;
  type: CategoryType;
  unit: PriceUnit;
  currentBuy: number;
  currentSell: number;
  weekTrend: MarketPricePoint[];
  updatedAt: number;
}

export interface AppState {
  station: StationInfo;
  categories: Category[];
  inventory: InventoryBucket[];
  transactions: Transaction[];
  appointments: Appointment[];
  salesOrders: SalesOrder[];
  sortRecords: SortRecord[];
  settlements: Settlement[];
  customers: Customer[];
  marketPrices: MarketPrice[];
}

import type {
  AppState,
  Category,
  Customer,
  InventoryBucket,
  Transaction,
  TransactionLine,
  Appointment,
  SalesOrder,
  Settlement,
  SortRecord,
  MarketPrice,
  MarketPricePoint,
} from "./types";

const NOW = new Date("2026-06-20T16:30:00").getTime();
const DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number, hour = 10, min = 0): number {
  const d = new Date(NOW - n * DAY);
  d.setHours(hour, min, 0, 0);
  return d.getTime();
}

function todayAt(hour: number, min = 0): number {
  const d = new Date(NOW);
  d.setHours(hour, min, 0, 0);
  return d.getTime();
}

export const CATEGORIES: Category[] = [
  // 纸类
  { id: "cat_paper", parentId: null, name: "纸类", type: "paper", unit: "kg", unitPrice: 0, active: true, updatedAt: NOW, priceHistory: [] },
  { id: "cat_paper_cardboard", parentId: "cat_paper", name: "黄板纸", type: "paper", unit: "kg", unitPrice: 1.10, active: true, updatedAt: daysAgo(3, 9), priceHistory: [{ price: 0.90, at: daysAgo(30, 9) }, { price: 1.00, at: daysAgo(14, 9) }, { price: 1.10, at: daysAgo(3, 9) }] },
  { id: "cat_paper_newspaper", parentId: "cat_paper", name: "报纸", type: "paper", unit: "kg", unitPrice: 0.80, active: true, updatedAt: daysAgo(7, 9), priceHistory: [{ price: 0.70, at: daysAgo(20, 9) }, { price: 0.80, at: daysAgo(7, 9) }] },
  { id: "cat_paper_book", parentId: "cat_paper", name: "旧书本", type: "paper", unit: "kg", unitPrice: 0.60, active: true, updatedAt: daysAgo(20, 9), priceHistory: [{ price: 0.60, at: daysAgo(20, 9) }] },
  { id: "cat_paper_mixed", parentId: "cat_paper", name: "杂纸", type: "paper", unit: "kg", unitPrice: 0.45, active: true, updatedAt: daysAgo(20, 9), priceHistory: [{ price: 0.45, at: daysAgo(20, 9) }] },
  // 塑料
  { id: "cat_plastic", parentId: null, name: "塑料", type: "plastic", unit: "kg", unitPrice: 0, active: true, updatedAt: NOW, priceHistory: [] },
  { id: "cat_plastic_pet", parentId: "cat_plastic", name: "矿泉水瓶", type: "plastic", unit: "kg", unitPrice: 2.20, active: true, updatedAt: daysAgo(2, 9), priceHistory: [{ price: 1.80, at: daysAgo(18, 9) }, { price: 2.00, at: daysAgo(8, 9) }, { price: 2.20, at: daysAgo(2, 9) }] },
  { id: "cat_plastic_hard", parentId: "cat_plastic", name: "塑料硬料", type: "plastic", unit: "kg", unitPrice: 1.80, active: true, updatedAt: daysAgo(10, 9), priceHistory: [{ price: 1.80, at: daysAgo(10, 9) }] },
  { id: "cat_plastic_film", parentId: "cat_plastic", name: "塑料薄膜", type: "plastic", unit: "kg", unitPrice: 0.90, active: true, updatedAt: daysAgo(15, 9), priceHistory: [{ price: 0.90, at: daysAgo(15, 9) }] },
  // 金属
  { id: "cat_metal", parentId: null, name: "金属", type: "metal", unit: "kg", unitPrice: 0, active: true, updatedAt: NOW, priceHistory: [] },
  { id: "cat_metal_iron", parentId: "cat_metal", name: "废铁", type: "metal", unit: "kg", unitPrice: 2.50, active: true, updatedAt: daysAgo(5, 9), priceHistory: [{ price: 2.20, at: daysAgo(25, 9) }, { price: 2.50, at: daysAgo(5, 9) }] },
  { id: "cat_metal_copper", parentId: "cat_metal", name: "紫铜", type: "metal", unit: "kg", unitPrice: 45.00, active: true, updatedAt: daysAgo(1, 9), priceHistory: [{ price: 42.00, at: daysAgo(12, 9) }, { price: 45.00, at: daysAgo(1, 9) }] },
  { id: "cat_metal_brass", parentId: "cat_metal", name: "黄铜", type: "metal", unit: "kg", unitPrice: 28.00, active: true, updatedAt: daysAgo(12, 9), priceHistory: [{ price: 28.00, at: daysAgo(12, 9) }] },
  { id: "cat_metal_aluminum", parentId: "cat_metal", name: "铝合金", type: "metal", unit: "kg", unitPrice: 12.00, active: true, updatedAt: daysAgo(12, 9), priceHistory: [{ price: 12.00, at: daysAgo(12, 9) }] },
  { id: "cat_metal_steel", parentId: "cat_metal", name: "不锈钢", type: "metal", unit: "kg", unitPrice: 8.00, active: true, updatedAt: daysAgo(16, 9), priceHistory: [{ price: 8.00, at: daysAgo(16, 9) }] },
  // 电器
  { id: "cat_appliance", parentId: null, name: "电器", type: "appliance", unit: "piece", unitPrice: 0, active: true, updatedAt: NOW, priceHistory: [] },
  { id: "cat_app_ac", parentId: "cat_appliance", name: "旧空调", type: "appliance", unit: "piece", unitPrice: 150.00, active: true, updatedAt: daysAgo(6, 9), priceHistory: [{ price: 130.00, at: daysAgo(22, 9) }, { price: 150.00, at: daysAgo(6, 9) }] },
  { id: "cat_app_fridge", parentId: "cat_appliance", name: "旧冰箱", type: "appliance", unit: "piece", unitPrice: 120.00, active: true, updatedAt: daysAgo(9, 9), priceHistory: [{ price: 120.00, at: daysAgo(9, 9) }] },
  { id: "cat_app_washer", parentId: "cat_appliance", name: "旧洗衣机", type: "appliance", unit: "piece", unitPrice: 80.00, active: true, updatedAt: daysAgo(9, 9), priceHistory: [{ price: 80.00, at: daysAgo(9, 9) }] },
  { id: "cat_app_tv", parentId: "cat_appliance", name: "旧电视", type: "appliance", unit: "piece", unitPrice: 60.00, active: true, updatedAt: daysAgo(9, 9), priceHistory: [{ price: 60.00, at: daysAgo(9, 9) }] },
  { id: "cat_app_pc", parentId: "cat_appliance", name: "旧电脑", type: "appliance", unit: "piece", unitPrice: 50.00, active: true, updatedAt: daysAgo(9, 9), priceHistory: [{ price: 50.00, at: daysAgo(9, 9) }] },
  // 旧衣物
  { id: "cat_clothing", parentId: null, name: "旧衣物", type: "clothing", unit: "kg", unitPrice: 0, active: true, updatedAt: NOW, priceHistory: [] },
  { id: "cat_clo_summer", parentId: "cat_clothing", name: "夏装", type: "clothing", unit: "kg", unitPrice: 1.50, active: true, updatedAt: daysAgo(11, 9), priceHistory: [{ price: 1.50, at: daysAgo(11, 9) }] },
  { id: "cat_clo_winter", parentId: "cat_clothing", name: "冬装", type: "clothing", unit: "kg", unitPrice: 2.50, active: true, updatedAt: daysAgo(11, 9), priceHistory: [{ price: 2.50, at: daysAgo(11, 9) }] },
  { id: "cat_clo_shoes", parentId: "cat_clothing", name: "鞋帽包", type: "clothing", unit: "kg", unitPrice: 1.20, active: true, updatedAt: daysAgo(11, 9), priceHistory: [{ price: 1.20, at: daysAgo(11, 9) }] },
];

const LEAF_CATEGORIES = CATEGORIES.filter((c) => c.parentId !== null);

export const CUSTOMERS: Customer[] = [
  { id: "cust_001", name: "张师傅", phone: "138****2046", type: "individual", createdAt: daysAgo(40, 9) },
  { id: "cust_002", name: "李阿姨", phone: "139****8810", type: "individual", createdAt: daysAgo(35, 9) },
  { id: "cust_003", name: "老赵五金店", phone: "137****5521", type: "individual", createdAt: daysAgo(30, 9) },
  { id: "cust_004", name: "城西小区物业", phone: "0571-8800-2233", type: "individual", createdAt: daysAgo(25, 9) },
  { id: "cust_005", name: "顺达再生资源", phone: "136****0011", type: "buyer", createdAt: daysAgo(20, 9) },
  { id: "cust_006", name: "金鼎金属冶炼厂", phone: "135****6688", type: "buyer", createdAt: daysAgo(18, 9) },
  { id: "cust_007", name: "蓝海塑料颗粒厂", phone: "133****9922", type: "buyer", createdAt: daysAgo(15, 9) },
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function makeLine(catId: string, qty: number): TransactionLine {
  const c = CATEGORIES.find((x) => x.id === catId)!;
  return {
    categoryId: c.id,
    categoryName: c.name,
    unit: c.unit,
    quantity: qty,
    unitPrice: c.unitPrice,
    amount: Math.round(qty * c.unitPrice * 100) / 100,
  };
}

const SAMPLE_BASKETS = [
  ["cat_paper_cardboard", 25, 60],
  ["cat_paper_newspaper", 15, 40],
  ["cat_plastic_pet", 8, 20],
  ["cat_metal_iron", 30, 80],
  ["cat_metal_copper", 1.2, 5],
  ["cat_metal_aluminum", 5, 15],
  ["cat_clo_summer", 10, 30],
  ["cat_plastic_hard", 12, 28],
];

function generateTransactions(): Transaction[] {
  const list: Transaction[] = [];
  let seq = 1;
  const individualCusts = CUSTOMERS.filter((c) => c.type === "individual");
  for (let d = 13; d >= 0; d--) {
    const txCount = d === 0 ? 3 : 2 + (d % 3);
    for (let t = 0; t < txCount; t++) {
      const cust = pick(individualCusts, d * 3 + t);
      const lineCount = 1 + ((d + t) % 3);
      const lines: TransactionLine[] = [];
      for (let l = 0; l < lineCount; l++) {
        const basket = SAMPLE_BASKETS[(d + t + l) % SAMPLE_BASKETS.length];
        const base = basket[1] as number;
        const variance = base * (0.4 + ((d + t + l) % 5) * 0.15);
        const qty = Math.round(variance * 10) / 10;
        lines.push(makeLine(basket[0] as string, qty));
      }
      const totalAmount = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
      const totalWeight = Math.round(lines.reduce((s, l) => s + (l.unit === "kg" ? l.quantity : 0), 0) * 10) / 10;
      const date = new Date(NOW - d * DAY);
      date.setHours(9 + t * 2, (t * 17) % 60, 0, 0);
      const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
      const receiptNo = `${dateStr}-${String(seq).padStart(3, "0")}`;
      list.push({
        id: `T${dateStr}${String(seq).padStart(3, "0")}`,
        source: d % 4 === 0 ? "pickup" : "onsite",
        customerId: cust.id,
        customerName: cust.name,
        phone: cust.phone,
        createdAt: date.getTime(),
        totalAmount,
        totalWeightKg: totalWeight,
        receiptNo,
        status: "active",
        lines,
        operator: "周师傅",
      });
      seq++;
    }
  }
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

function buildInventory(transactions: Transaction[]): InventoryBucket[] {
  const map = new Map<string, InventoryBucket>();
  const capacities: Record<string, number> = {
    cat_paper_cardboard: 800,
    cat_paper_newspaper: 500,
    cat_paper_book: 300,
    cat_paper_mixed: 300,
    cat_plastic_pet: 400,
    cat_plastic_hard: 400,
    cat_plastic_film: 300,
    cat_metal_iron: 1200,
    cat_metal_copper: 80,
    cat_metal_brass: 80,
    cat_metal_aluminum: 150,
    cat_metal_steel: 200,
    cat_app_ac: 30,
    cat_app_fridge: 30,
    cat_app_washer: 30,
    cat_app_tv: 30,
    cat_app_pc: 30,
    cat_clo_summer: 400,
    cat_clo_winter: 400,
    cat_clo_shoes: 300,
  };
  const locations: Record<string, string> = {
    cat_paper_cardboard: "A-01",
    cat_paper_newspaper: "A-02",
    cat_paper_book: "A-03",
    cat_paper_mixed: "A-04",
    cat_plastic_pet: "B-01",
    cat_plastic_hard: "B-02",
    cat_plastic_film: "B-03",
    cat_metal_iron: "C-01",
    cat_metal_copper: "C-02",
    cat_metal_brass: "C-03",
    cat_metal_aluminum: "C-04",
    cat_metal_steel: "C-05",
    cat_app_ac: "D-01",
    cat_app_fridge: "D-02",
    cat_app_washer: "D-03",
    cat_app_tv: "D-04",
    cat_app_pc: "D-05",
    cat_clo_summer: "E-01",
    cat_clo_winter: "E-02",
    cat_clo_shoes: "E-03",
  };
  for (const tx of transactions) {
    if (tx.status === "void") continue;
    for (const line of tx.lines) {
      const existing = map.get(line.categoryId) ?? {
        categoryId: line.categoryId,
        weightKg: 0,
        pieceCount: 0,
        location: locations[line.categoryId] ?? "Z-99",
        capacityKg: capacities[line.categoryId] ?? 300,
      };
      if (line.unit === "kg") existing.weightKg = Math.round((existing.weightKg + line.quantity) * 10) / 10;
      else existing.pieceCount += line.quantity;
      map.set(line.categoryId, existing);
    }
  }
  // 模拟已部分出货，扣减一定比例
  for (const bucket of map.values()) {
    bucket.weightKg = Math.round(bucket.weightKg * 0.55 * 10) / 10;
    bucket.pieceCount = Math.round(bucket.pieceCount * 0.6);
  }
  return Array.from(map.values()).sort((a, b) => a.location.localeCompare(b.location));
}

function buildAppointments(): Appointment[] {
  return [
    {
      id: "AP2026062001",
      customerId: "cust_004",
      customerName: "城西小区物业",
      phone: "0571-8800-2233",
      address: "江干区凯旋路 268 号城西花园 3 栋楼下",
      estimatedWeight: 120,
      categoryIds: ["cat_paper_cardboard", "cat_plastic_pet", "cat_metal_iron"],
      status: "pending",
      appointmentTime: todayAt(15, 0),
      createdAt: daysAgo(1, 14),
      note: "物业统一清理，需大车",
    },
    {
      id: "AP2026062002",
      customerId: "cust_002",
      customerName: "李阿姨",
      phone: "139****8810",
      address: "上城区婺江路 88 号望江家园 5-2-1802",
      estimatedWeight: 35,
      categoryIds: ["cat_paper_newspaper", "cat_clo_summer"],
      status: "dispatched",
      appointmentTime: todayAt(16, 30),
      createdAt: daysAgo(0, 9),
      driver: "刘师傅",
      note: "老人在家，请提前电话",
    },
    {
      id: "AP2026061903",
      customerId: "cust_003",
      customerName: "老赵五金店",
      phone: "137****5521",
      address: "拱墅区莫干山路 1188 号五金城 B 区 21 号",
      estimatedWeight: 200,
      categoryIds: ["cat_metal_iron", "cat_metal_aluminum", "cat_metal_steel"],
      status: "completed",
      appointmentTime: daysAgo(1, 10),
      createdAt: daysAgo(2, 16),
      driver: "刘师傅",
      actualTransactionId: "T20260619002",
    },
    {
      id: "AP2026062104",
      customerId: "cust_001",
      customerName: "张师傅",
      phone: "138****2046",
      address: "西湖区文三路 478 号华星时代广场 B 座",
      estimatedWeight: 60,
      categoryIds: ["cat_paper_cardboard", "cat_plastic_hard"],
      status: "pending",
      appointmentTime: daysAgo(-1, 9),
      createdAt: daysAgo(0, 13),
      note: "明日早上优先",
    },
  ];
}

function buildSalesOrders(): SalesOrder[] {
  return [
    {
      id: "SO20260615001",
      buyerId: "cust_006",
      buyerName: "金鼎金属冶炼厂",
      buyerContact: "135****6688",
      createdAt: daysAgo(5, 14),
      settledAt: daysAgo(4, 10),
      totalAmount: 8260,
      totalWeightKg: 520,
      status: "settled",
      lines: [
        makeSalesLine("cat_metal_iron", 400, 2.80),
        makeSalesLine("cat_metal_aluminum", 80, 13.50),
        makeSalesLine("cat_metal_copper", 10, 47.00),
      ],
      note: "含税，款已到账",
      statusLog: [
        { status: "draft", at: daysAgo(5, 14), operator: "陈主管", note: "创建出货单" },
        { status: "shipped", at: daysAgo(5, 16), operator: "刘师傅", note: "装车发运" },
        { status: "settled", at: daysAgo(4, 10), operator: "陈主管", note: "银行转账 ¥8,260 到账" },
      ],
    },
    {
      id: "SO20260618002",
      buyerId: "cust_005",
      buyerName: "顺达再生资源",
      buyerContact: "136****0011",
      createdAt: daysAgo(2, 15),
      settledAt: daysAgo(1, 11),
      totalAmount: 3180,
      totalWeightKg: 1800,
      status: "settled",
      lines: [
        makeSalesLine("cat_paper_cardboard", 1200, 1.80),
        makeSalesLine("cat_paper_newspaper", 600, 1.30),
      ],
      statusLog: [
        { status: "draft", at: daysAgo(2, 15), operator: "陈主管", note: "创建出货单" },
        { status: "shipped", at: daysAgo(2, 17), operator: "王师傅", note: "装车发运" },
        { status: "settled", at: daysAgo(1, 11), operator: "陈主管", note: "现金 ¥3,180 已收" },
      ],
    },
    {
      id: "SO20260620003",
      buyerId: "cust_007",
      buyerName: "蓝海塑料颗粒厂",
      buyerContact: "133****9922",
      createdAt: todayAt(11, 0),
      totalAmount: 5400,
      totalWeightKg: 300,
      status: "shipped",
      lines: [
        makeSalesLine("cat_plastic_pet", 200, 12.00),
        makeSalesLine("cat_plastic_hard", 100, 18.00),
      ],
      note: "款预计 T+1 到账",
      statusLog: [
        { status: "draft", at: todayAt(11, 0), operator: "陈主管", note: "创建出货单" },
        { status: "shipped", at: todayAt(13, 30), operator: "陈师傅", note: "装车发运，预计次日结算" },
      ],
    },
  ];
}

function makeSalesLine(catId: string, qty: number, unitPrice: number): import("./types").SalesLine {
  const c = CATEGORIES.find((x) => x.id === catId)!;
  return {
    categoryId: c.id,
    categoryName: c.name,
    unit: c.unit,
    quantity: qty,
    unitPrice,
    amount: Math.round(qty * unitPrice * 100) / 100,
  };
}

function buildSettlements(): Settlement[] {
  const out: Settlement[] = [];
  for (let d = 6; d >= 1; d--) {
    const date = new Date(NOW - d * DAY);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const payable = Math.round((1800 + d * 230 + (d % 3) * 180) * 100) / 100;
    const receivable = Math.round((2600 + d * 410 + (d % 2) * 350) * 100) / 100;
    out.push({
      id: `ST${dateStr.replace(/-/g, "")}`,
      date: dateStr,
      payable,
      receivable,
      grossProfit: Math.round((receivable - payable) * 100) / 100,
      intakeCount: 4 + (d % 3),
      salesCount: d % 2,
      totalWeightKg: 420 + d * 35,
      locked: true,
      createdAt: date.getTime() + 19 * 3600 * 1000,
      byCategory: [],
    });
  }
  return out;
}

function buildSortRecords(transactions: Transaction[]): SortRecord[] {
  const out: SortRecord[] = [];
  let i = 0;
  for (const tx of transactions.slice(0, 8)) {
    for (const line of tx.lines.slice(0, 2)) {
      i++;
      out.push({
        id: `SR${String(i).padStart(4, "0")}`,
        createdAt: tx.createdAt + 30 * 60 * 1000,
        operator: "分拣-小陈",
        fromTransactionId: tx.id,
        categoryId: line.categoryId,
        categoryName: line.categoryName,
        quantity: line.quantity,
        unit: line.unit,
        targetLocation: line.categoryId.startsWith("cat_paper") ? "A 区" : line.categoryId.startsWith("cat_metal") ? "C 区" : "B 区",
      });
    }
  }
  return out;
}

function dateStr(offset: number): string {
  const d = new Date(NOW - offset * DAY);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildMarketPrices(categories: Category[]): MarketPrice[] {
  const leafCats = categories.filter((c) => c.parentId !== null);
  const sellPriceMultipliers: Record<string, number> = {
    cat_paper_cardboard: 1.65, cat_paper_newspaper: 1.6, cat_paper_book: 1.5, cat_paper_mixed: 1.55,
    cat_plastic_pet: 1.55, cat_plastic_hard: 1.5, cat_plastic_film: 1.6,
    cat_metal_iron: 1.25, cat_metal_copper: 1.12, cat_metal_brass: 1.15, cat_metal_aluminum: 1.18, cat_metal_steel: 1.2,
    cat_app_ac: 1.4, cat_app_fridge: 1.35, cat_app_washer: 1.35, cat_app_tv: 1.4, cat_app_pc: 1.5,
    cat_clo_summer: 1.8, cat_clo_winter: 1.7, cat_clo_shoes: 1.75,
  };

  return leafCats.map((cat) => {
    const baseBuy = cat.unitPrice;
    const baseSell = baseBuy * (sellPriceMultipliers[cat.id] ?? 1.4);
    const weekTrend: MarketPricePoint[] = [];

    for (let i = 6; i >= 0; i--) {
      const variance = 1 + (Math.sin(i * 0.8 + cat.id.charCodeAt(cat.id.length - 1) * 0.1) * 0.06) - i * 0.008;
      const buyP = Math.round(baseBuy * variance * 100) / 100;
      const sellP = Math.round(baseSell * variance * 100) / 100;
      weekTrend.push({
        date: dateStr(i),
        buyPrice: buyP,
        sellPrice: sellP,
        source: i === 0 ? "local" : "seed",
        recordedAt: NOW - i * DAY,
      });
    }

    const today = weekTrend[weekTrend.length - 1];
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      type: cat.type,
      unit: cat.unit,
      currentBuy: today.buyPrice,
      currentSell: today.sellPrice,
      weekTrend,
      updatedAt: NOW,
    };
  });
}

export function buildSeed(): AppState {
  const transactions = generateTransactions();
  const inventory = buildInventory(transactions);
  const appointments = buildAppointments();
  const salesOrders = buildSalesOrders();
  const settlements = buildSettlements();
  const sortRecords = buildSortRecords(transactions);
  const marketPrices = buildMarketPrices(CATEGORIES);
  return {
    station: {
      name: "绿源回收 · 城东站",
      address: "杭州市上城区凯旋路 268 号",
      phone: "0571-8800-1234",
      license: "HZ-REC-2024-0156",
      operator: "周师傅",
    },
    categories: CATEGORIES,
    customers: CUSTOMERS,
    transactions,
    inventory,
    appointments,
    salesOrders,
    settlements,
    sortRecords,
    marketPrices,
  };
}

export { LEAF_CATEGORIES };

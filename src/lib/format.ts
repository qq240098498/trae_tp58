import type { CategoryType, PriceUnit } from "./types";

export function formatMoney(n: number): string {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatWeight(n: number): string {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

export function formatNumber(n: number): string {
  return n.toLocaleString("zh-CN");
}

export function unitLabel(unit: PriceUnit): string {
  return unit === "kg" ? "公斤" : "个";
}

export function unitShort(unit: PriceUnit): string {
  return unit === "kg" ? "kg" : "件";
}

export interface CategoryMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
  text: string;
  glow: string;
  dot: string;
}

export const CATEGORY_META: Record<CategoryType, CategoryMeta> = {
  paper: {
    label: "纸类",
    color: "#C9A86A",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    text: "text-amber-200",
    glow: "shadow-[0_0_24px_-6px_rgba(201,168,106,0.5)]",
    dot: "bg-amber-300",
  },
  plastic: {
    label: "塑料",
    color: "#7BA3D4",
    bg: "bg-sky-400/10",
    border: "border-sky-400/30",
    text: "text-sky-200",
    glow: "shadow-[0_0_24px_-6px_rgba(123,163,212,0.5)]",
    dot: "bg-sky-300",
  },
  metal: {
    label: "金属",
    color: "#A9B0BD",
    bg: "bg-slate-400/10",
    border: "border-slate-400/30",
    text: "text-slate-200",
    glow: "shadow-[0_0_24px_-6px_rgba(169,176,189,0.5)]",
    dot: "bg-slate-300",
  },
  appliance: {
    label: "电器",
    color: "#E8A33D",
    bg: "bg-orange-400/10",
    border: "border-orange-400/30",
    text: "text-orange-200",
    glow: "shadow-[0_0_24px_-6px_rgba(232,163,61,0.5)]",
    dot: "bg-orange-300",
  },
  clothing: {
    label: "旧衣物",
    color: "#C77FB0",
    bg: "bg-fuchsia-400/10",
    border: "border-fuchsia-400/30",
    text: "text-fuchsia-200",
    glow: "shadow-[0_0_24px_-6px_rgba(199,127,176,0.5)]",
    dot: "bg-fuchsia-300",
  },
};

export const CATEGORY_ORDER: CategoryType[] = [
  "paper",
  "plastic",
  "metal",
  "appliance",
  "clothing",
];

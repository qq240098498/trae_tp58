import { useMemo, useState, useCallback } from "react";
import type { Transaction, TransactionLine, TxSource } from "@/lib/types";
import { useStore } from "@/store";

export interface DraftLine {
  key: string;
  categoryId: string;
  quantity: string;
}

export function useWeighingDraft() {
  const categories = useStore((s) => s.categories);
  const customers = useStore((s) => s.customers);
  const station = useStore((s) => s.station);
  const createTransaction = useStore((s) => s.createTransaction);

  const [customerId, setCustomerId] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState<TxSource>("onsite");
  const [note, setNote] = useState("");
  const [autoPrint, setAutoPrint] = useState(true);
  const [lines, setLines] = useState<DraftLine[]>([
    { key: "l1", categoryId: "", quantity: "" },
  ]);

  const leafCategories = useMemo(
    () => categories.filter((c) => c.parentId !== null && c.active),
    [categories]
  );

  const customer = customers.find((c) => c.id === customerId);
  const customerName = customer?.name || walkInName;

  const resolvedLines = useMemo(() => {
    return lines
      .filter((l) => l.categoryId && parseFloat(l.quantity) > 0)
      .map((l) => {
        const cat = categories.find((c) => c.id === l.categoryId)!;
        const qty = parseFloat(l.quantity) || 0;
        const amount = Math.round(qty * cat.unitPrice * 100) / 100;
        const line: TransactionLine = {
          categoryId: cat.id,
          categoryName: cat.name,
          unit: cat.unit,
          quantity: qty,
          unitPrice: cat.unitPrice,
          amount,
        };
        return { draft: l, line, cat };
      });
  }, [lines, categories]);

  const totalAmount = Math.round(resolvedLines.reduce((s, r) => s + r.line.amount, 0) * 100) / 100;
  const totalWeightKg = Math.round(resolvedLines.reduce((s, r) => s + (r.line.unit === "kg" ? r.line.quantity : 0), 0) * 10) / 10;

  const previewTx: Transaction | null = useMemo(() => {
    if (resolvedLines.length === 0 || !customerName.trim()) return null;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    return {
      id: `PREVIEW`,
      source,
      customerId: customer?.id || "walkin",
      customerName,
      phone: phone || undefined,
      createdAt: Date.now(),
      totalAmount,
      totalWeightKg,
      receiptNo: `${dateStr}-???`,
      status: "active",
      lines: resolvedLines.map((r) => r.line),
      operator: station.operator,
      note: note || undefined,
    };
  }, [resolvedLines, customerName, phone, source, totalAmount, totalWeightKg, note, station.operator, customer?.id]);

  const canConfirm = resolvedLines.length > 0 && customerName.trim().length > 0;

  const setLine = useCallback((key: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }, []);

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, { key: `l${Date.now()}`, categoryId: "", quantity: "" }]);
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  }, []);

  const reset = useCallback(() => {
    setCustomerId("");
    setWalkInName("");
    setPhone("");
    setNote("");
    setSource("onsite");
    setLines([{ key: `l${Date.now()}`, categoryId: "", quantity: "" }]);
  }, []);

  const confirm = useCallback((): Transaction | null => {
    if (!canConfirm) return null;
    const tx = createTransaction({
      source,
      customerId: customer?.id || "walkin",
      customerName,
      phone: phone || undefined,
      lines: resolvedLines.map((r) => r.line),
      note: note || undefined,
    });
    reset();
    return tx;
  }, [canConfirm, createTransaction, source, customer?.id, customerName, phone, resolvedLines, note, reset]);

  return {
    categories,
    leafCategories,
    customers,
    customerId,
    setCustomerId,
    walkInName,
    setWalkInName,
    phone,
    setPhone,
    source,
    setSource,
    note,
    setNote,
    autoPrint,
    setAutoPrint,
    lines,
    setLine,
    addLine,
    removeLine,
    resolvedLines,
    totalAmount,
    totalWeightKg,
    previewTx,
    canConfirm,
    confirm,
    reset,
  };
}

export type WeighingDraft = ReturnType<typeof useWeighingDraft>;

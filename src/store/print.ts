import { create } from "zustand";
import type { Transaction } from "@/lib/types";

interface PrintState {
  pending: Transaction | null;
  queue: (tx: Transaction) => void;
  clear: () => void;
}

export const usePrintStore = create<PrintState>((set) => ({
  pending: null,
  queue: (tx) => set({ pending: tx }),
  clear: () => set({ pending: null }),
}));

export function printReceipt(tx: Transaction) {
  usePrintStore.getState().queue(tx);
}

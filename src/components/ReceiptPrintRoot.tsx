import { useEffect } from "react";
import { usePrintStore } from "@/store/print";
import Receipt from "@/components/Receipt";

export default function ReceiptPrintRoot() {
  const pending = usePrintStore((s) => s.pending);
  const clear = usePrintStore((s) => s.clear);

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => {
      window.print();
      setTimeout(() => clear(), 600);
    }, 120);
    return () => clearTimeout(timer);
  }, [pending, clear]);

  if (!pending) return null;

  return (
    <div className="receipt-print-root" aria-hidden>
      <Receipt tx={pending} />
    </div>
  );
}

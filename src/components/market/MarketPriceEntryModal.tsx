import { useState, useEffect } from "react";
import { Save, Search } from "lucide-react";
import { useStore } from "@/store";
import type { CategoryType, MarketPrice } from "@/lib/types";
import { CATEGORY_META, CATEGORY_ORDER, formatMoney, unitLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";

interface MarketPriceEntryModalProps {
  open: boolean;
  onClose: () => void;
  preselectedCategoryId?: string;
}

export default function MarketPriceEntryModal({ open, onClose, preselectedCategoryId }: MarketPriceEntryModalProps) {
  const categories = useStore((s) => s.categories);
  const marketPrices = useStore((s) => s.marketPrices);
  const recordMarketPrice = useStore((s) => s.recordMarketPrice);

  const [selectedType, setSelectedType] = useState<CategoryType | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      if (preselectedCategoryId) {
        setSelectedCategoryId(preselectedCategoryId);
        const mp = marketPrices.find((m) => m.categoryId === preselectedCategoryId);
        if (mp) {
          setBuyPrice(String(mp.currentBuy));
          setSellPrice(String(mp.currentSell));
        }
      } else {
        setSelectedCategoryId("");
        setBuyPrice("");
        setSellPrice("");
      }
      setNote("");
      setSearch("");
    }
  }, [open, preselectedCategoryId, marketPrices]);

  const leafCats = categories.filter((c) => c.parentId !== null);
  const filtered = leafCats.filter((c) => {
    if (selectedType !== "all" && c.type !== selectedType) return false;
    if (search.trim() && !c.name.includes(search.trim())) return false;
    return true;
  });

  const selectedCat = leafCats.find((c) => c.id === selectedCategoryId);
  const selectedMp: MarketPrice | undefined = marketPrices.find((m) => m.categoryId === selectedCategoryId);

  const valid = selectedCategoryId && parseFloat(buyPrice) >= 0 && parseFloat(sellPrice) >= 0;

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    const mp = marketPrices.find((m) => m.categoryId === catId);
    if (mp) {
      setBuyPrice(String(mp.currentBuy));
      setSellPrice(String(mp.currentSell));
    } else {
      const cat = leafCats.find((c) => c.id === catId);
      if (cat) {
        setBuyPrice(String(cat.unitPrice));
        setSellPrice(String(Math.round(cat.unitPrice * 1.4 * 100) / 100));
      }
    }
  };

  const handleSubmit = () => {
    if (!valid) return;
    recordMarketPrice({
      categoryId: selectedCategoryId,
      buyPrice: Math.round(parseFloat(buyPrice) * 100) / 100,
      sellPrice: Math.round(parseFloat(sellPrice) * 100) / 100,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="录入今日行情报价"
      subtitle="手动录入今日参考收购价和出货价，将同步更新一周走势"
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">取消</button>
          <button onClick={handleSubmit} disabled={!valid} className="btn-primary">
            <Save size={15} /> 保存今日行情
          </button>
        </>
      }
    >
      <div className="flex h-[60vh] min-h-[420px] flex-col gap-4 sm:h-[55vh] lg:flex-row">
        <div className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-xl border border-ink-700/60 bg-ink-800/70 sm:w-64 lg:w-72">
          <div className="shrink-0 border-b border-ink-700/60 px-4 py-3">
            <div className="flex items-center gap-2 rounded-md border border-ink-600 bg-ink-900/60 px-2.5 py-1.5">
              <Search size={14} className="text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索品类"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-400 outline-none"
              />
            </div>
          </div>
          <div className="shrink-0 border-b border-ink-700/40 p-2">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedType("all")}
                className={cn(
                  "rounded-md px-2 py-1 text-xs transition-colors",
                  selectedType === "all"
                    ? "bg-moss-300/15 text-moss-200"
                    : "text-ink-400 hover:bg-ink-700/50 hover:text-ink-200"
                )}
              >
                全部
              </button>
              {CATEGORY_ORDER.map((t) => {
                const m = CATEGORY_META[t];
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                      selectedType === t
                        ? "bg-moss-300/15 text-moss-200"
                        : "text-ink-400 hover:bg-ink-700/50 hover:text-ink-200"
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-2">
            {filtered.map((cat) => {
              const mp = marketPrices.find((m) => m.categoryId === cat.id);
              const m = CATEGORY_META[cat.type];
              const isSel = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={cn(
                    "mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    isSel
                      ? "bg-moss-300/10 text-ink-100 ring-1 ring-moss-300/30"
                      : "text-ink-200 hover:bg-ink-750/60"
                  )}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="flex-1 truncate">{cat.name}</span>
                  {mp && (
                    <span className="shrink-0 font-mono text-[11px] text-ink-400">
                      ¥{formatMoney(mp.currentBuy)}
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-xs text-ink-400">未找到匹配的品类</div>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          <div className="space-y-4">
            {selectedCat ? (
              <>
                <div className="card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: CATEGORY_META[selectedCat.type].color }}
                        />
                        <h3 className="font-display text-lg tracking-wide text-ink-100">{selectedCat.name}</h3>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {CATEGORY_META[selectedCat.type].label}类 · 按{unitLabel(selectedCat.unit)}计价
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-ink-400">当前收购价</p>
                      <p className="font-mono text-lg font-semibold text-moss-300">
                        ¥{formatMoney(selectedCat.unitPrice)}
                      </p>
                    </div>
                  </div>

                  {selectedMp && (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-ink-700/50 bg-ink-800/40 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-ink-400">今日参考收购</p>
                        <p className="mt-1 font-display text-2xl tracking-wide text-moss-300">
                          ¥{formatMoney(selectedMp.currentBuy)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-500">
                          更新于 {new Date(selectedMp.updatedAt).toLocaleString("zh-CN")}
                        </p>
                      </div>
                      <div className="rounded-lg border border-ink-700/50 bg-ink-800/40 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-ink-400">今日参考出货</p>
                        <p className="mt-1 font-display text-2xl tracking-wide text-amber-300">
                          ¥{formatMoney(selectedMp.currentSell)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-500">
                          利差 ¥{formatMoney(selectedMp.currentSell - selectedMp.currentBuy)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card p-4">
                  <h4 className="mb-3 text-sm font-medium text-ink-100">录入今日价格</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">参考收购价（元/{unitLabel(selectedCat.unit)}）</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(e.target.value)}
                        placeholder="例如 1.20"
                        className="input"
                      />
                      <p className="mt-1 text-[11px] text-ink-500">
                        建议：{selectedMp
                          ? `当前 ¥${formatMoney(selectedMp.currentBuy)}`
                          : `参考系统价 ¥${formatMoney(selectedCat.unitPrice)}`}
                      </p>
                    </div>
                    <div>
                      <label className="label">参考出货价（元/{unitLabel(selectedCat.unit)}）</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value)}
                        placeholder="例如 1.80"
                        className="input"
                      />
                      <p className="mt-1 text-[11px] text-ink-500">
                        {parseFloat(buyPrice) > 0 && (
                          <>建议：约收购价的 {(parseFloat(sellPrice) / parseFloat(buyPrice) * 100).toFixed(0)}%</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="label">备注（可选）</label>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="例如：紫铜行情大涨 / 纸类下游需求疲软"
                      className="input"
                    />
                  </div>

                  {parseFloat(buyPrice) >= 0 && parseFloat(sellPrice) >= 0 && parseFloat(buyPrice) > 0 && (
                    <div className="mt-4 rounded-lg border border-moss-300/20 bg-moss-300/5 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-400">预估毛利率</span>
                        <span className="font-mono font-semibold text-moss-300">
                          {((parseFloat(sellPrice) - parseFloat(buyPrice)) / parseFloat(sellPrice) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-ink-400">每{unitLabel(selectedCat.unit)}利润</span>
                        <span className="font-mono font-semibold text-amber-300">
                          ¥{formatMoney(parseFloat(sellPrice) - parseFloat(buyPrice))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="card flex h-full min-h-[280px] items-center justify-center p-8">
                <div className="text-center">
                  <Search size={28} className="mx-auto mb-2 opacity-40 text-ink-400" />
                  <p className="text-sm text-ink-400">请从左侧选择要录入行情的品类</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

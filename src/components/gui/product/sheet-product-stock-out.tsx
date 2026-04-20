import { InputStockOutWithLotSchema } from "@/app/api/inventory/stock-out/route";
import {
  requestInventoryStockDetailCount,
  useCreateInventoryStockOutWithLot,
  useQueryInventorySlotByVariant,
} from "@/app/hooks/use-query-product";
import { ProductV2 } from "@/classes/product-v2";
import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slot } from "@/dataloader/slot-loader";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductSlotCombobox } from "./product-slot-combobox";
import { produce } from "immer";
import { cn } from "@/lib/utils";
import { MaterialInput } from "@/components/ui/material-input";
import { StockByLot, StockDetailForCounting } from "@/classes/stock-counting";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { useCommonDialog } from "@/components/common-dialog";
import { ResponseType } from "@/lib/types";
import { toast } from "sonner";
import { ProductSubInfo } from "./product-sub-info";
import { useAuthentication } from "contexts/authentication-context";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import {
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  Package,
  ScanLine,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";

interface StockProp extends StockByLot {
  actualStock: number;
}

interface Props {
  variant?: ProductVariantType | null;
  stockLot: StockProp[];
}

function hasChanged(origin: StockProp[], array: StockProp[]) {
  const indexs = [];
  if (origin && array) {
    for (const [k, v] of array.entries()) {
      if (origin[k].actualStock !== v.actualStock) {
        indexs.push(k);
      }
    }
  }
  return indexs;
}

export const sheetProductStockOut = createSheet<
  { product: ProductV2 | null; variantId?: string },
  unknown
>(
  ({ product, variantId, close }) => {
    const { setting } = useAuthentication();
    const { showDialog } = useCommonDialog();
    const [slotSelected, setSlotSelected] = useState("");
    const [currenctStock, setCurrentStock] = useState<Props | undefined>();
    const [stock, setStock] = useState<Props | undefined>();
    const { data, isLoading, isValidating } = useQueryInventorySlotByVariant(
      variantId || "",
    );
    const [loading, setLoading] = useState(true);
    const { trigger, isMutating } = useCreateInventoryStockOutWithLot();

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const [status, setStatus] = useState("");
    const [progress, setProgress] = useState(0);
    const [verifiedLots, setVerifiedLots] = useState<Set<number>>(new Set());
    const [scanInputs, setScanInputs] = useState<Record<number, string>>({});
    const [cameraOpenIdx, setCameraOpenIdx] = useState<number | null>(null);
    const scanInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const inventorySetting: {
      restrict_product_lot: boolean;
      print_name: string;
    } = useMemo(() => {
      const value =
        setting?.data?.result?.find((f) => f.option === "INVENTORY")?.value ||
        `{"restrict_product_lot":false,"print_name":""}`;
      const parse = JSON.parse(value) || {};
      return parse;
    }, [setting]);

    const changed = useMemo(() => {
      return hasChanged(
        currenctStock?.stockLot as unknown as StockProp[],
        stock?.stockLot as unknown as StockProp[],
      );
    }, [currenctStock, stock]);

    const lotsPendingVerification = useMemo(() => {
      if (!inventorySetting.restrict_product_lot) return [];
      return (stock?.stockLot || [])
        .map((item, idx) => ({ item: item as StockProp, idx }))
        .filter(({ item }) => item.actualStock > 0)
        .map(({ idx }) => idx);
    }, [inventorySetting.restrict_product_lot, stock?.stockLot]);

    const verifyScannedValue = useCallback(
      (idx: number, rawValue: string, lotNumber: string | undefined) => {
        const scanned = rawValue.trim();
        if (scanned === lotNumber) {
          setVerifiedLots((prev) => new Set([...prev, idx]));
          setScanInputs((prev) => ({ ...prev, [idx]: "" }));
          setCameraOpenIdx(null);
        } else {
          toast.error(`Lot number does not match (expected: ${lotNumber})`);
        }
      },
      [],
    );

    const allVerified = useMemo(() => {
      if (!inventorySetting.restrict_product_lot) return true;
      if (lotsPendingVerification.length === 0) return true;
      return lotsPendingVerification.every((idx) => verifiedLots.has(idx));
    }, [
      inventorySetting.restrict_product_lot,
      lotsPendingVerification,
      verifiedLots,
    ]);

    const getStockDetail = useCallback(
      async (slotId: string) => {
        const req = (await requestInventoryStockDetailCount(
          variantId || "",
          slotId,
        )) as unknown as ResponseType<StockDetailForCounting>;
        if (req.success) {
          const x = {
            ...req.result,
            stockLot:
              (req.result?.stockLot.length || 0) > 0
                ? (req.result?.stockLot as unknown as StockProp[])
                    .map((x) => ({ ...x, actualStock: 0 }))
                    .sort((a, b) => {
                      return (
                        new Date(b.lot?.createdAt || 0).getTime() -
                        new Date(a.lot?.createdAt || 0).getTime()
                      );
                    })
                : [],
          };
          setStock(x);
          setCurrentStock(x);
          setVerifiedLots(new Set());
          setScanInputs({});
        }
      },
      [variantId],
    );

    useEffect(() => {
      if (loading && !isLoading && !isValidating) {
        if (data?.result?.length === 1) {
          const id = (data.result as unknown as Slot[])[0]?.id;
          setSlotSelected(id);
          getStockDetail(id);
        }
        setLoading(false);
      }
    }, [data, loading, getStockDetail, isLoading, isValidating]);

    useEffect(() => {
      if (status === "✅ All items processed") {
        getStockDetail(slotSelected).finally(() => {
          close(true);
        });
      }
    }, [status, slotSelected, getStockDetail, close]);

    const onSave = useCallback(async () => {
      const lot = (stock?.stockLot || []).filter((f) => f.actualStock > 0);

      for (const [i, item] of lot.entries()) {
        const input: InputStockOutWithLotSchema = {
          variantId: variantId || "",
          slotId: slotSelected,
          lotId: item.lot?.id,
          qty: item.actualStock,
        };

        setStatus(`Sending ${i + 1} of ${lot.length}`);
        setProgress(i + 1);

        const res = await trigger(input);
        if (res.success) {
          toast.success(`Add stock out was success (${item.lot?.lotNumber})`);
          console.log(`✅ Response ${i + 1}:`, res.result);
          await delay(100);
        } else {
          toast.error(res.error);
          setStatus(`Error sending item ${i + 1}`);
          break;
        }
      }

      setStatus("✅ All items processed");
    }, [slotSelected, stock?.stockLot, trigger, variantId]);

    if (isLoading || loading || isValidating) {
      return <></>;
    }

    const slot = data?.result || [];
    const totalStockOut = (stock?.stockLot || []).reduce(
      (acc, x) => acc + ((x as StockProp).actualStock || 0),
      0,
    );
    const lotCount = (stock?.stockLot || []).filter(
      (f) => (f as StockProp).actualStock > 0,
    ).length;
    const isSaving = isMutating || !!status;

    return (
      <>
        {/* Fullscreen camera overlay */}
        {cameraOpenIdx !== null &&
          (() => {
            const scanningLot = stock?.stockLot[cameraOpenIdx];
            return (
              <div className="fixed inset-0 z-[200] flex flex-col bg-black">
                <div className="flex items-center justify-between px-4 py-3 bg-black/80">
                  <div className="text-white">
                    <p className="text-sm font-semibold">Scan Lot Barcode</p>
                    <p className="text-xs text-gray-300">
                      Expected: {scanningLot?.lot?.lotNumber}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 h-9 w-9 p-0"
                    onClick={() => setCameraOpenIdx(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex-1 relative overflow-hidden">
                  <Scanner
                    onScan={(codes: IDetectedBarcode[]) => {
                      const raw = codes[0]?.rawValue;
                      if (raw) {
                        verifyScannedValue(
                          cameraOpenIdx,
                          raw,
                          scanningLot?.lot?.id,
                        );
                      }
                    }}
                    onError={(err) => {
                      console.error(err);
                      toast.error("Camera error. Use manual input.");
                      setCameraOpenIdx(null);
                    }}
                    constraints={{ facingMode: "environment" }}
                    styles={{
                      container: { width: "100%", height: "100%" },
                      video: {
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      },
                    }}
                  />
                </div>
              </div>
            );
          })()}
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <Package className="h-4 w-4 text-destructive" />
            </div>
            <SheetTitle className="text-base">Stock Out</SheetTitle>
          </div>
          <div className="mt-2">
            <ProductSubInfo product={product!} variantId={variantId} />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Slot selector */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Storage Location
            </p>
            <ProductSlotCombobox
              data={slot as unknown as Slot[]}
              slotSelected={slotSelected}
              onSlotSelected={(v) => {
                if (changed.length > 0) {
                  showDialog({
                    title: "Unsaved Changes",
                    content:
                      "You have unsaved changes. Discard and switch slot?",
                    actions: [
                      {
                        text: "Discard",
                        onClick: async () => {
                          setSlotSelected(v);
                          getStockDetail(v);
                        },
                      },
                    ],
                  });
                } else {
                  setSlotSelected(v);
                  getStockDetail(v);
                }
              }}
            />
          </div>

          {/* Lot restriction banner */}
          {inventorySetting.restrict_product_lot &&
            lotsPendingVerification.length > 0 && (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs",
                  allVerified
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-amber-200 bg-amber-50 text-amber-700",
                )}
              >
                {allVerified ? (
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                )}
                <span>
                  {allVerified
                    ? "All lots verified. Ready to save."
                    : `Lot verification required — ${verifiedLots.size} of ${lotsPendingVerification.length} verified.`}
                </span>
              </div>
            )}

          {/* Saving progress */}
          {isSaving && status && (
            <div className="space-y-1.5 rounded-lg border bg-muted/40 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{status}</span>
              </div>
              {lotCount > 0 && (
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(progress / lotCount) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Summary bar */}
          {totalStockOut > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2">
              <span className="text-xs font-medium text-destructive">
                Total Stock Out
              </span>
              <Badge variant="destructive" className="text-xs">
                {totalStockOut} unit{totalStockOut !== 1 ? "s" : ""} from{" "}
                {lotCount} lot{lotCount !== 1 ? "s" : ""}
              </Badge>
            </div>
          )}

          {/* Lot cards */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Lot Batches{" "}
              {stock?.stockLot?.length ? `(${stock.stockLot.length})` : ""}
            </p>

            {(!stock?.stockLot || stock.stockLot.length === 0) && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center text-muted-foreground">
                <Package className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">No lots available</p>
                <p className="text-xs mt-0.5">
                  Select a slot to view stock lots
                </p>
              </div>
            )}

            {stock?.stockLot.map((x, idx) => {
              const sp = x as StockProp;
              const isChanged = changed.includes(idx);
              const isVerified = verifiedLots.has(idx);
              const needsVerify =
                inventorySetting.restrict_product_lot &&
                sp.actualStock > 0 &&
                !isVerified;

              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded-lg border bg-card transition-colors",
                    isChanged && !isVerified
                      ? "border-amber-300 bg-amber-50/50"
                      : isChanged && isVerified
                        ? "border-green-300 bg-green-50/50"
                        : "border-border",
                  )}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-3 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono px-1.5 py-0"
                      >
                        Batch-{String(idx + 1).padStart(3, "0")}
                      </Badge>
                      {isVerified && (
                        <Badge className="text-[10px] bg-green-600 hover:bg-green-600 px-1.5 py-0 gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Verified
                        </Badge>
                      )}
                      {needsVerify && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-amber-400 text-amber-600 px-1.5 py-0 gap-1"
                        >
                          <AlertCircle className="h-2.5 w-2.5" />
                          Verify required
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      In stock:{" "}
                      <span className="font-bold text-foreground">
                        {x.stock}
                      </span>
                    </span>
                  </div>

                  {/* Lot meta */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 px-3 pb-3 text-xs">
                    <div className="text-muted-foreground">
                      Lot:{" "}
                      <span className="font-medium text-foreground font-mono">
                        {x.lot?.lotNumber || "—"}
                      </span>
                    </div>
                    <div className="text-right text-muted-foreground">
                      Exp:{" "}
                      <span
                        className={cn(
                          "font-medium",
                          x.lot?.expiredDate &&
                            new Date(x.lot.expiredDate) < new Date()
                            ? "text-destructive"
                            : "text-foreground",
                        )}
                      >
                        {x.lot?.expiredDate || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Stock out quantity input */}
                  <div className="border-t px-3 py-2.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-muted-foreground shrink-0">
                      Qty to remove
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        disabled={sp.actualStock <= 0}
                        onClick={() => {
                          const newVal = Math.max(0, sp.actualStock - 1);
                          setStock(
                            produce((draft) => {
                              if (draft && draft.stockLot) {
                                draft.stockLot[idx].actualStock = newVal;
                              }
                            }),
                          );
                          if (newVal === 0 && verifiedLots.has(idx)) {
                            setVerifiedLots((prev) => {
                              const next = new Set(prev);
                              next.delete(idx);
                              return next;
                            });
                          }
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <MaterialInput
                        value={sp.actualStock}
                        className="text-xs w-16 text-center"
                        type="number"
                        onChange={(e) => {
                          const newVal = Number(e.target.value || 0);
                          if (newVal <= x.stock) {
                            setStock(
                              produce((draft) => {
                                if (draft && draft.stockLot) {
                                  draft.stockLot[idx].actualStock = newVal;
                                }
                              }),
                            );
                            if (newVal === 0 && verifiedLots.has(idx)) {
                              setVerifiedLots((prev) => {
                                const next = new Set(prev);
                                next.delete(idx);
                                return next;
                              });
                            }
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        disabled={sp.actualStock >= x.stock}
                        onClick={() => {
                          const newVal = Math.min(x.stock, sp.actualStock + 1);
                          setStock(
                            produce((draft) => {
                              if (draft && draft.stockLot) {
                                draft.stockLot[idx].actualStock = newVal;
                              }
                            }),
                          );
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Scan verify section */}
                  {inventorySetting.restrict_product_lot &&
                    sp.actualStock > 0 && (
                      <div className="border-t px-3 py-2.5">
                        {isVerified ? (
                          <div className="flex items-center gap-2 text-xs text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="font-medium">Lot verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ScanLine className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <MaterialInput
                              ref={(el) => {
                                scanInputRefs.current[idx] = el;
                              }}
                              value={scanInputs[idx] || ""}
                              placeholder="Scan or type lot number to verify"
                              className="text-xs flex-1"
                              autoComplete="off"
                              onChange={(e) => {
                                const val = e.target.value;
                                setScanInputs((prev) => ({
                                  ...prev,
                                  [idx]: val,
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  verifyScannedValue(
                                    idx,
                                    scanInputs[idx] || "",
                                    x.lot?.id,
                                  );
                                }
                              }}
                              onFocus={(e) => e.target.select()}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 p-0 shrink-0"
                              onClick={() =>
                                setCameraOpenIdx(
                                  cameraOpenIdx === idx ? null : idx,
                                )
                              }
                            >
                              {cameraOpenIdx === idx ? (
                                <X className="h-3.5 w-3.5" />
                              ) : (
                                <Camera className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>

        <SheetFooter className="border-t pt-4">
          <Button
            className="w-full"
            onClick={onSave}
            disabled={isSaving || !allVerified || totalStockOut === 0}
            variant="destructive"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {status}
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                {totalStockOut > 0
                  ? `Remove ${totalStockOut} unit${totalStockOut !== 1 ? "s" : ""}`
                  : "Enter quantity to remove"}
              </>
            )}
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null },
);

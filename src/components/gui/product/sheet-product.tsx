import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductV2 } from "@/classes/product-v2";
import {
  requestInventoryStockDetailCount,
  useCreateInventoryCountStock,
  useQueryInventorySlotByVariant,
} from "@/app/hooks/use-query-product";
import { ProductSlotCombobox } from "./product-slot-combobox";
import { Slot } from "@/dataloader/slot-loader";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  StockByLot,
  StockCountingProps,
  StockDetailForCounting,
} from "@/classes/stock-counting";
import { ResponseType } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MaterialInput } from "@/components/ui/material-input";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { produce } from "immer";
import { cn } from "@/lib/utils";
import { useCommonDialog } from "@/components/common-dialog";
import { toast } from "sonner";
import { ProductSubInfo } from "./product-sub-info";

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

export const sheetProduct = createSheet<
  { product: ProductV2 | null; variantId?: string },
  unknown
>(
  ({ close, variantId, product }) => {
    const { showDialog } = useCommonDialog();
    const [slotSelected, setSlotSelected] = useState("");
    const [currenctStock, setCurrentStock] = useState<Props | undefined>();
    const [stock, setStock] = useState<Props | undefined>();
    const { data, isLoading, isValidating } = useQueryInventorySlotByVariant(
      variantId || ""
    );
    const [loading, setLoading] = useState(true);
    const { trigger, isMutating } = useCreateInventoryCountStock();

    const changed = useMemo(() => {
      return hasChanged(
        currenctStock?.stockLot as unknown as StockProp[],
        stock?.stockLot as unknown as StockProp[]
      );
    }, [currenctStock, stock]);

    const getStockDetail = useCallback(
      async (slotId: string) => {
        const req = (await requestInventoryStockDetailCount(
          variantId || "",
          slotId
        )) as unknown as ResponseType<StockDetailForCounting>;
        if (req.success) {
          const x = {
            ...req.result,
            stockLot:
              (req.result?.stockLot.length || 0) > 0
                ? (req.result?.stockLot as unknown as StockProp[])
                    .map((x) => ({ ...x, actualStock: x.stock }))
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
        }
      },
      [variantId]
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

    const onSave = useCallback(() => {
      const input: StockCountingProps = {
        slotId: slotSelected,
        variantId: variantId || "",
        stockLot: (stock?.stockLot as unknown as StockProp[])
          .filter((_, idx) => changed.includes(idx))
          .map((x) => {
            return {
              lot: {
                id: x.lot?.id || "",
                variantId: variantId || "",
              },
              stock: x.actualStock,
            };
          }),
      };

      trigger(input)
        .then((res) => {
          if (res.result) {
            toast.success("Stock counting has been saved.");
            close(input);
          } else {
            toast.error("Failed to save stock counting.");
          }
        })
        .catch(() => {
          toast.error("Failed to save stock counting.");
        });
    }, [changed, slotSelected, stock, variantId, close, trigger]);

    if (isLoading || loading || isValidating) {
      return <></>;
    }

    const slot = data?.result || [];

    return (
      <>
        <SheetHeader>
          <SheetTitle>Stock Counting</SheetTitle>
        </SheetHeader>
        <div className="my-4">
          <ProductSubInfo product={product!} variantId={variantId} />
          <br />
          <ProductSlotCombobox
            data={slot as unknown as Slot[]}
            slotSelected={slotSelected}
            onSlotSelected={(v) => {
              if (changed.length > 0) {
                showDialog({
                  title: "Unsaved Changes",
                  content: "You have unsaved changes.",
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
          <Table className="my-2">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">#</TableHead>
                <TableHead className="text-xs">Lot Number</TableHead>
                <TableHead className="text-xs">Expired Date</TableHead>
                <TableHead className="text-xs">Created Date</TableHead>
                <TableHead className="text-xs">Stock</TableHead>
                <TableHead className="text-xs">Actual Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock?.stockLot.map((x, idx) => {
                return (
                  <TableRow
                    key={idx}
                    className={changed.includes(idx) ? "bg-amber-200" : ""}
                  >
                    <TableCell
                      className={cn(
                        "text-xs",
                        changed.includes(idx)
                          ? "border-l-2 border-amber-500"
                          : ""
                      )}
                    >
                      Batch-{String(idx + 1).padStart(3, "0")}
                    </TableCell>
                    <TableCell className="text-xs font-bold">
                      {x.lot?.lotNumber}
                    </TableCell>
                    <TableCell className="text-xs font-bold">
                      {x.lot?.expiredDate}
                    </TableCell>
                    <TableCell className="text-xs">
                      {x.lot?.createdAt}
                    </TableCell>
                    <TableCell className="text-xs font-bold">
                      {x.stock}
                    </TableCell>
                    <TableCell className="text-xs">
                      <MaterialInput
                        value={x.actualStock}
                        className="text-xs"
                        type="number"
                        onChange={(e) => {
                          setStock(
                            produce((draft) => {
                              if (draft && draft.stockLot) {
                                draft.stockLot[idx].actualStock = Number(
                                  e.target.value
                                );
                              }
                            })
                          );
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <SheetFooter>
          <Button
            onClick={onSave}
            disabled={changed.length === 0 || isMutating}
          >
            Save
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null }
);

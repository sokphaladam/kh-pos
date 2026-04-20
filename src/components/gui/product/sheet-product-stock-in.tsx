import { InputStockInSchema } from "@/app/api/inventory/stock-in/route";
import {
  requestInventoryStockDetailCount,
  useCreateInventoryStockIn,
  useQueryInventorySlotByVariant,
} from "@/app/hooks/use-query-product";
import { ProductV2 } from "@/classes/product-v2";
import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Formatter } from "@/lib/formatter";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ProductSlotCombobox } from "./product-slot-combobox";
import { Slot } from "@/dataloader/slot-loader";
import { StockByLot, StockDetailForCounting } from "@/classes/stock-counting";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { useCommonDialog } from "@/components/common-dialog";
import { ResponseType } from "@/lib/types";
import { produce } from "immer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MaterialInput } from "@/components/ui/material-input";
import { ProductSubInfo } from "./product-sub-info";
import { Plus } from "lucide-react";
import {
  PrintProductLot,
  PrintProductLotProps,
} from "./print/print-product-lot";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useAuthentication } from "contexts/authentication-context";
import { printProductLotDialog } from "./print/print-product-dialog";

interface StockProp extends StockByLot {
  actualStock: number;
  new?: boolean;
}

interface Props {
  variant?: ProductVariantType | null;
  stockLot: StockProp[];
}

function MenuItem({
  value,
  product,
  variantId,
}: {
  value: StockProp;
  product: ProductV2 | null;
  variantId?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <BasicMenuAction
        value={value}
        items={[
          {
            label: "Print QR",
            onClick: () => {
              ref.current?.click();
            },
          },
        ]}
      />
      <PrintProductLot
        data={[
          {
            expirationDate: value.lot?.expiredDate || "",
            lotId: value.lot?.id || "",
            lotNumber: value.lot?.lotNumber || "",
            manufacturingDate: value.lot?.manufacturingDate || "",
            price: value.lot?.costPerUnit || "",
            sku:
              product?.productVariants.find((f) => f.id === variantId)?.sku +
              "",
          },
        ]}
        type="MENU"
        ref={ref}
      />
    </>
  );
}

function hasChanged(origin: StockProp[], array: StockProp[]) {
  const indexs = [];
  if (origin && array) {
    for (const [k, v] of array.entries()) {
      if (origin[k].actualStock !== v.actualStock) {
        indexs.push(k);
      }
      if (Number(origin[k].lot?.costPerUnit) !== Number(v.lot?.costPerUnit)) {
        indexs.push(k);
      }
    }
  }
  return indexs;
}

export const sheetProductStockIn = createSheet<
  { product: ProductV2 | null; variantId?: string },
  unknown
>(
  ({ product, variantId, close }) => {
    const { setting } = useAuthentication();
    const { showDialog } = useCommonDialog();
    const [slotSelected, setSlotSelected] = useState<{
      slotId: string;
      slotName: string;
    }>({ slotId: "", slotName: "" });
    const [currenctStock, setCurrentStock] = useState<Props | undefined>();
    const [stock, setStock] = useState<Props | undefined>();
    const { data, isLoading, isValidating } = useQueryInventorySlotByVariant(
      variantId || "",
    );
    const [loading, setLoading] = useState(true);
    const { trigger, isMutating } = useCreateInventoryStockIn();

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const [status, setStatus] = useState("");
    const [progress, setProgress] = useState(0);

    const [printProps, setPrintProps] = useState<PrintProductLotProps[]>([]);

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
        stock?.stockLot.filter((f) => !f.new) as unknown as StockProp[],
      );
    }, [currenctStock, stock]);

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
        }
      },
      [variantId],
    );

    useEffect(() => {
      if (loading && !isLoading && !isValidating) {
        if (data?.result?.length === 1) {
          const id = (data.result as unknown as Slot[])[0]?.id;
          const name = (data.result as unknown as Slot[])[0]?.name;
          setSlotSelected({ slotId: id, slotName: name });
          getStockDetail(id);
        }
        setLoading(false);
      }
    }, [data, loading, getStockDetail, isLoading, isValidating]);

    useEffect(() => {
      if (status === "✅ All items processed") {
        if (!!inventorySetting.restrict_product_lot && printProps.length > 0) {
          printProductLotDialog.show({ data: printProps }).then(() => {
            setPrintProps([]);
          });
        }
        getStockDetail(slotSelected.slotId).finally(() => {
          close(true);
        });
      }
    }, [
      status,
      slotSelected,
      getStockDetail,
      close,
      inventorySetting.restrict_product_lot,
      printProps,
    ]);

    const onSave = useCallback(async () => {
      const lot =
        stock?.stockLot.filter((f, i) => !!f.new || changed.includes(i)) || [];

      for (const [i, x] of lot.entries()) {
        const input = {
          slotId: slotSelected.slotId,
          qty: x.actualStock,
          variantId: variantId || "", // Ensure variantId is a string
          costPerUnit: x.lot?.costPerUnit ? parseFloat(x.lot.costPerUnit) : 0, // Convert costPerUnit to number
          expiredAt: x.lot?.expiredDate
            ? Formatter.date(x.lot?.expiredDate)
            : undefined,
          lotNumber: x.lot?.lotNumber,
          manufacturedAt: x.lot?.manufacturingDate
            ? Formatter.date(x.lot.manufacturingDate)
            : undefined,
        };

        setStatus(`Sending ${i + 1} of ${lot.length}`);
        setProgress(i + 1);

        const res = await trigger(input as unknown as InputStockInSchema);
        if (res.success) {
          toast.success(
            `${product?.title} (${
              product?.productVariants.find((f) => f.id === variantId)?.name
            })) was add stock in.`,
          );
          console.log(`✅ Response ${i + 1}:`, res.result);
          setPrintProps(
            produce((draft) => {
              draft.push({
                lotId: res.result?.lotId || "",
                expirationDate: input.expiredAt || "",
                lotNumber: input.lotNumber || "",
                manufacturingDate: input.manufacturedAt || "",
                price: String(input.costPerUnit || ""),
                sku:
                  product?.productVariants.find((f) => f.id === variantId)
                    ?.sku + "",
              });
            }),
          );
          await delay(100);
        } else {
          toast.error(res.error);
          setStatus(`Error sending item ${i + 1}`);
          break;
        }
      }

      setStatus("✅ All items processed");
    }, [
      stock?.stockLot,
      changed,
      slotSelected,
      variantId,
      trigger,
      product?.title,
      product?.productVariants,
    ]);

    const slot = useMemo(() => data?.result || [], [data]);

    const handleNewStockIn = useCallback(() => {
      console.log("Add new stock in");
      setStock(
        produce((draft) => {
          const variant = product?.productVariants.find(
            (f) => f.id === variantId,
          );
          const idx = draft?.stockLot.length || 0;
          draft?.stockLot.push({
            stock: 0,
            actualStock: 0,
            new: true,
            lot: {
              id: "",
              variantId: variant?.id || "",
              costPerUnit: String(variant?.purchasePrice || ""),
              createdAt: Formatter.getNowDateTime(),
              expiredDate: Formatter.getNowDate(),
              lotNumber: `${slotSelected.slotName}-${String(idx + 1).padStart(3, "0")}`,
              manufacturingDate: "",
            },
          });
        }),
      );
    }, [product?.productVariants, variantId, slotSelected]);

    if (isLoading || loading || isValidating) {
      return <></>;
    }

    const allow = stock?.stockLot.find((f) => Number(f.lot?.costPerUnit) <= 0)
      ? false
      : true;

    console.log(`Progress: ${progress} /
                  ${
                    (stock?.stockLot || []).filter((f) => f.actualStock > 0)
                      .length
                  }`);

    return (
      <>
        <SheetHeader>
          <SheetTitle>Stock In</SheetTitle>
        </SheetHeader>

        <div className="my-4 relative">
          <ProductSubInfo product={product!} variantId={variantId} />
          <br />
          <div className="flex flex-row justify-between">
            <ProductSlotCombobox
              data={slot as unknown as Slot[]}
              slotSelected={slotSelected.slotId}
              all
              onSlotSelected={(v, slotName) => {
                if (changed.length > 0) {
                  showDialog({
                    title: "Unsaved Changes",
                    content: "You have unsaved changes.",
                    actions: [
                      {
                        text: "Discard",
                        onClick: async () => {
                          setSlotSelected({
                            slotId: v,
                            slotName: slotName || "",
                          });
                          getStockDetail(v);
                        },
                      },
                    ],
                  });
                } else {
                  setSlotSelected({
                    slotId: v,
                    slotName: slotName || "",
                  });
                  getStockDetail(v);
                }
              }}
            />
            <Button
              size={"sm"}
              variant={"outline"}
              className="text-xs"
              onClick={handleNewStockIn}
              disabled={!slotSelected.slotId || isLoading || isValidating}
            >
              <Plus />
              New stock in
            </Button>
          </div>

          <Table className="my-2">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">#</TableHead>
                <TableHead className="text-xs">Lot Number</TableHead>
                <TableHead className="text-xs">Expired</TableHead>
                <TableHead className="text-xs">Manufacturing</TableHead>
                <TableHead className="text-xs">Current Stock</TableHead>
                <TableHead className="text-xs">Stock Qty</TableHead>
                <TableHead className="text-xs">Cost Per Unit($)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock?.stockLot.map((x, idx) => {
                return (
                  <TableRow
                    key={idx}
                    className={cn(
                      changed.includes(idx) ? "bg-amber-200" : "",
                      x.new ? "bg-emerald-200" : "",
                      x.stock === 0 && !x.new ? "hidden" : "",
                    )}
                  >
                    <TableCell
                      className={cn(
                        "text-xs",
                        changed.includes(idx)
                          ? "border-l-2 border-amber-500"
                          : "",
                        x.new ? "border-l-2 border-emerald-500" : "",
                      )}
                    >
                      Batch-{String(idx + 1).padStart(3, "0")}
                    </TableCell>
                    <TableCell className="text-xs font-bold">
                      {!x.new ? (
                        x.lot?.lotNumber
                      ) : (
                        <MaterialInput
                          value={x.lot?.lotNumber}
                          onChange={(e) => {
                            setStock(
                              produce((draft) => {
                                if (draft?.stockLot[idx].lot) {
                                  draft.stockLot[idx].lot.lotNumber =
                                    e.target.value;
                                }
                              }),
                            );
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-bold">
                      {!x.new ? (
                        x.lot?.expiredDate
                      ) : (
                        <MaterialInput
                          value={x.lot?.expiredDate}
                          type="date"
                          onChange={(e) => {
                            setStock(
                              produce((draft) => {
                                if (draft?.stockLot[idx].lot) {
                                  draft.stockLot[idx].lot.expiredDate =
                                    e.target.value;
                                }
                              }),
                            );
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-bold">
                      {!x.new ? (
                        x.lot?.manufacturingDate
                      ) : (
                        <MaterialInput
                          value={x.lot?.manufacturingDate}
                          type="date"
                          onChange={(e) => {
                            setStock(
                              produce((draft) => {
                                if (draft?.stockLot[idx].lot) {
                                  draft.stockLot[idx].lot.manufacturingDate =
                                    e.target.value;
                                }
                              }),
                            );
                          }}
                        />
                      )}
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
                                  e.target.value,
                                );
                              }
                            }),
                          );
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                    </TableCell>
                    <TableCell className="text-xs">
                      <MaterialInput
                        value={x.lot?.costPerUnit}
                        className="text-xs"
                        type="number"
                        step={0.1}
                        onChange={(e) => {
                          setStock(
                            produce((draft) => {
                              if (draft && draft.stockLot) {
                                if (draft.stockLot[idx].lot) {
                                  draft.stockLot[idx].lot.costPerUnit =
                                    e.target.value;
                                }
                              }
                            }),
                          );
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                    </TableCell>
                    <TableCell>
                      <MenuItem
                        value={x}
                        product={product}
                        variantId={variantId}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <SheetFooter>
          <Button onClick={onSave} disabled={isMutating || !allow || !!status}>
            {status ? status : "Save"}
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null },
);

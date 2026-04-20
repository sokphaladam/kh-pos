"use client";
import {
  AdditionalCost,
  PurchaseOrderItem,
  SupplierPurchaseOrder,
  SupplierPurchaseOrderInput,
} from "@/classes/purchase-order-service";
import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { produce } from "immer";
import { LoaderIcon, PlusCircle, Trash2Icon } from "lucide-react";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MaterialInput } from "@/components/ui/material-input";
import SupplierPicker from "@/components/supplier-picker";
import SearchProductPicker from "@/components/search-product-picker";
import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { Supplier } from "@/lib/server-functions/supplier";
import {
  useCreatePurchaseOrder,
  useLazyQueryPurchaseOrderDetails,
  useUpdatePurchaseOrder,
} from "@/app/hooks/use-query-purchase-order";
import { Formatter } from "@/lib/formatter";
import { toast } from "sonner";
import LoadingBar from "@/components/loading-bar-animation";
import { cn } from "@/lib/utils";
import { generateId } from "@/lib/generate-id";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface OrderItemProps {
  item: PurchaseOrderItem;
  onChange: (item: PurchaseOrderItem) => void;
  onRemove: () => void;
}
export function OrderItem(props: OrderItemProps) {
  const { formatForDisplay } = useCurrencyFormat();
  const [item, setItem] = useState<PurchaseOrderItem>(props.item);

  const onBlur = useCallback(() => {
    const totalAmount =
      (item?.qty ?? 0) *
      (item?.purchaseCost ? parseFloat(item?.purchaseCost) : 0);

    setItem(
      produce((draft) => {
        draft.amount = totalAmount;
      }),
    );
    props.onChange({ ...item, amount: totalAmount });
  }, [item, props]);

  const getTotalAmount = (qty: number, cost: number) => {
    return (qty ?? 0) * (cost ?? 0);
  };

  return (
    <TableRow>
      <TableCell className="table-cell text-nowrap text-xs">
        <div className="line-clamp-1">{item.name}</div>
        <div>{item.sku}</div>
      </TableCell>
      <TableCell className="text-nowrap text-xs">{item.stock}</TableCell>
      <TableCell className="table-cell text-nowrap text-xs">
        <MaterialInput
          value={item.qty?.toString() ?? ""}
          onBlur={onBlur}
          type="number"
          onChange={(event) => {
            const value = event.target.value;
            const amount = getTotalAmount(
              Number(value),
              Number(item.purchaseCost),
            );
            setItem(
              produce((draft) => {
                if (value) {
                  draft.qty = parseInt(value);
                  draft.amount = amount;
                } else {
                  draft.qty = 0;
                  draft.amount = 0;
                }
              }),
            );
            props.onChange(
              produce(props.item, (draft) => {
                draft.qty = parseInt(value);
                draft.amount = amount;
              }),
            );
          }}
        />
      </TableCell>
      <TableCell className="table-cell text-nowrap text-xs">
        <div className="flex flex-row gap-1 items-center">
          <MaterialInput
            value={item.purchaseCost?.toString() ?? ""}
            onBlur={onBlur}
            type="number"
            onChange={(event) => {
              const value = event.target.value;
              const amount = getTotalAmount(Number(item.qty), Number(value));
              setItem(
                produce((draft) => {
                  draft.purchaseCost = value;
                  draft.amount = amount;
                }),
              );
              props.onChange(
                produce(props.item, (draft) => {
                  draft.qty = parseInt(value);
                  draft.amount = amount;
                }),
              );
            }}
          />
        </div>
      </TableCell>
      <TableCell className="table-cell text-nowrap text-xs">
        {formatForDisplay(item.amount ?? 0)}
      </TableCell>
      <TableCell>
        <Button onClick={props.onRemove} size="icon" variant="ghost">
          <Trash2Icon />
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface AdditionalCostItemProps {
  item: AdditionalCost;
  onChange: (item: AdditionalCost) => void;
  onRemove: () => void;
}
function AdditionalCostItem({
  item: data,
  onRemove,
  onChange,
}: AdditionalCostItemProps) {
  const [item, setItem] = useState<AdditionalCost>(data);

  const onBlur = useCallback(() => {
    onChange(item);
  }, [item, onChange]);

  return (
    <TableRow>
      <TableCell className="table-cell text-nowrap text-xs">
        <MaterialInput
          value={item.name ?? ""}
          className="w-[250px]"
          onChange={(e) => {
            setItem(
              produce((draft) => {
                draft.name = e.target.value;
              }),
            );
          }}
          onBlur={onBlur}
        />
      </TableCell>
      <TableCell className="table-cell text-nowrap text-xs">
        <div className="flex flex-row gap-1 items-center">
          <MaterialInput
            className="w-[90px]"
            type="number"
            value={item.cost ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setItem(
                produce((draft) => {
                  draft.cost = value;
                }),
              );
            }}
            onBlur={onBlur}
          />
        </div>
      </TableCell>
      <TableCell>
        <Button onClick={onRemove} size="icon" variant="ghost">
          <Trash2Icon />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function PurchaseOrderItemTable({ children }: PropsWithChildren) {
  return (
    <div className="flex-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px] text-nowrap text-xs">
              Item
            </TableHead>
            <TableHead className="w-[120px] text-nowrap text-xs">
              In Stock
            </TableHead>
            <TableHead className="w-[120px] text-nowrap text-xs">
              Quantity
            </TableHead>
            <TableHead className="w-[120px] text-nowrap text-xs">
              Purchase cost
            </TableHead>
            <TableHead className="w-[120px] text-nowrap text-xs">
              Amount
            </TableHead>
            <TableHead className="w-[50px] text-nowrap text-xs">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}
const defaultOrderItems: PurchaseOrderItem = {
  id: "",
  name: "",
  stock: 12,
  qty: null,
  amount: null,
  purchaseCost: null,
  receivedQty: 0,
  productVariantId: null,
};

const defaultAdditionalCosts: AdditionalCost = {
  id: "",
  name: "",
  cost: "",
  status: "pending",
};

const defaultPurchaseOrder: SupplierPurchaseOrderInput = {
  supplierId: null,
  items: [],
  additionalCosts: [],
  purchasedAt: Formatter.date(new Date()),
  expectedAt: null,
  note: null,
};

export const createPurchaseOrderSheet = createSheet<
  { purchaseOrderId?: string },
  SupplierPurchaseOrder | undefined
>(
  ({ close, purchaseOrderId }) => {
    const { currentWarehouse } = useAuthentication();
    const [loading, setLoading] = useState(!!purchaseOrderId);
    const [getPurchaseOrder, { data }] =
      useLazyQueryPurchaseOrderDetails(purchaseOrderId);
    const [purchaseOrder, setPurchaseOrder] =
      useState<SupplierPurchaseOrderInput>(() => {
        return { ...defaultPurchaseOrder, warehouseId: currentWarehouse?.id };
      });

    const { trigger: updatePurchaseOrder, isMutating: updating } =
      useUpdatePurchaseOrder();

    const { trigger: createPurchaseOrder, isMutating: creating } =
      useCreatePurchaseOrder();

    const mounted = useRef<boolean>(false);

    useEffect(() => {
      if (purchaseOrderId) {
        getPurchaseOrder().then(() => {
          setLoading(false);
        });
      }
    }, [purchaseOrderId, getPurchaseOrder]);

    useEffect(() => {
      if (data?.result && !mounted.current && !loading) {
        setPurchaseOrder(data.result);
        mounted.current = true;
      }
    }, [data, loading]);

    const orderItems = useMemo(
      () => purchaseOrder.items ?? [],
      [purchaseOrder.items],
    );

    const additionalCosts = useMemo(
      () => purchaseOrder.additionalCosts ?? [],
      [purchaseOrder.additionalCosts],
    );

    const orderItemDisplay = useMemo(
      () => orderItems.filter((item) => item.status !== "to_delete"),
      [orderItems],
    );

    const additionalCostDisplay = useMemo(
      () => additionalCosts.filter((item) => item.status !== "to_delete"),
      [additionalCosts],
    );

    const onRemoveItem = useCallback(
      (itemId: string) => {
        setPurchaseOrder(
          produce((draft) => {
            if (purchaseOrderId) {
              const updateDraftItem = draft.items ?? [];
              const updateItemIndex = updateDraftItem.findIndex(
                (i) => i.id === itemId,
              );

              if (updateItemIndex > -1) {
                updateDraftItem[updateItemIndex] = {
                  ...updateDraftItem[updateItemIndex],
                  status: "to_delete",
                };
              }
              draft.items = updateDraftItem;
            } else {
              draft.items = draft.items?.filter((item) => item.id !== itemId);
            }
          }),
        );
      },
      [purchaseOrderId],
    );

    const onAddAdditionalCost = useCallback(() => {
      const newItem: AdditionalCost = {
        ...defaultAdditionalCosts,
        id: generateId(),
        status: purchaseOrderId ? "to_create" : undefined,
      };
      const newAdditionalCostItem = [...additionalCosts, newItem];
      setPurchaseOrder(
        produce((draft) => {
          draft.additionalCosts = newAdditionalCostItem;
        }),
      );
    }, [additionalCosts, purchaseOrderId]);

    const onRemoveAdditionalCost = useCallback(
      (itemId: string) => {
        setPurchaseOrder(
          produce((draft) => {
            if (purchaseOrderId) {
              const updateDraftItem = draft.additionalCosts ?? [];
              const updateItemIndex = updateDraftItem.findIndex(
                (i) => i.id === itemId,
              );
              if (updateItemIndex > -1) {
                updateDraftItem[updateItemIndex] = {
                  ...updateDraftItem[updateItemIndex],
                  status: "to_delete",
                };
              }
              draft.additionalCosts = updateDraftItem;
            } else {
              draft.additionalCosts = draft.additionalCosts?.filter(
                (item) => item.id !== itemId,
              );
            }
          }),
        );
      },
      [purchaseOrderId],
    );

    const validateFormInput = useCallback(() => {
      if (!purchaseOrder.supplierId) {
        toast.error("Please select a supplier");
        return false;
      }
      if (orderItemDisplay.length === 0) {
        toast.error("Please add items to the purchase order");
        return false;
      }

      const validateOrderItem = orderItemDisplay.find((item) => !item.qty);
      if (!!validateOrderItem) {
        toast.error(
          "Please input quantity for item: " + validateOrderItem.name,
        );
        return false;
      }

      const validateAdditionalCost = additionalCostDisplay.find(
        (item) => !item.cost,
      );

      if (!!validateAdditionalCost) {
        toast.error(
          "Please input amount for additional cost: " +
            validateAdditionalCost.name,
        );
        return false;
      }

      return true;
    }, [purchaseOrder, orderItemDisplay, additionalCostDisplay]);

    const onCreateOrUpdate = useCallback(() => {
      if (validateFormInput()) {
        const orderInput: SupplierPurchaseOrderInput = {
          id: purchaseOrder.id,
          supplierId: purchaseOrder.supplierId,
          status: purchaseOrder.status,
          createdAt: purchaseOrder.createdAt
            ? Formatter.date(purchaseOrder.createdAt)
            : null,
          updatedAt: purchaseOrder.updatedAt
            ? Formatter.date(purchaseOrder.updatedAt)
            : null,
          purchasedAt: purchaseOrder.purchasedAt
            ? Formatter.date(purchaseOrder.purchasedAt)
            : null,
          expectedAt: purchaseOrder.expectedAt
            ? Formatter.date(purchaseOrder.expectedAt)
            : null,
          note: purchaseOrder.note,
          items: purchaseOrder.items,
          warehouseId: purchaseOrder.warehouseId,
          additionalCosts: purchaseOrder.additionalCosts,
        };

        if (purchaseOrderId) {
          orderInput.id = purchaseOrderId;

          updatePurchaseOrder(orderInput)
            .then((r) => {
              if (r.success) {
                mounted.current = false;
                toast.success("Purchase order updated successfully");
                close({ ...orderInput });
              } else {
                toast.error("Failed to update purchase order");
              }
            })
            .catch(() => {
              toast.error("Failed to update purchase order");
            });
        } else {
          orderInput.status = "draft";
          createPurchaseOrder(orderInput)
            .then((r) => {
              if (r.success) {
                close(r.result);
                mounted.current = false;
                toast.success("Purchase order created successfully");
              } else {
                toast.error("Failed to create purchase order");
              }
            })
            .catch(() => {
              toast.error("Failed to create purchase order");
            });
        }
      }
    }, [
      close,
      purchaseOrder,
      updatePurchaseOrder,
      validateFormInput,
      createPurchaseOrder,
      purchaseOrderId,
    ]);

    const onSelectProduct = useCallback(
      (item?: ProductSearchResult) => {
        if (
          purchaseOrder.items?.find((f) => String(f.sku) === String(item?.sku))
        ) {
          toast.warning("SKU already exists");
          return;
        }
        const variant = (
          item?.variants as { sku: string; stock: number }[] | undefined
        )?.find((f) => f.sku === String(item?.sku));
        const orderItem: PurchaseOrderItem = {
          ...defaultOrderItems,
          name: item?.productTitle,
          stock: variant?.stock ?? 0,
          productVariantId: item?.variantId,
          id: generateId(),
          status: purchaseOrderId ? "to_create" : undefined,
          purchaseCost: String(item?.purchasedCost || 0),
          sku: item?.sku,
        };
        const newOrderItem = [...(purchaseOrder.items ?? []), orderItem];
        setPurchaseOrder(
          produce((draft) => {
            draft.items = newOrderItem;
          }),
        );
      },
      [purchaseOrderId, purchaseOrder],
    );

    const onSelectSupplier = useCallback((supplier: Supplier | null) => {
      setPurchaseOrder(
        produce((draft) => {
          draft.supplierId = supplier?.id || null;
        }),
      );
    }, []);

    const onChangeItem = useCallback((item: PurchaseOrderItem) => {
      setPurchaseOrder(
        produce((draft) => {
          draft.items = draft?.items?.map((i) =>
            i.id === item.id ? { ...i, ...item } : i,
          );
        }),
      );
    }, []);

    const onChangeAdditionalCostItem = useCallback((item: AdditionalCost) => {
      setPurchaseOrder(
        produce((draft) => {
          draft.additionalCosts = draft?.additionalCosts?.map((i) =>
            i.id === item.id ? { ...i, ...item } : i,
          );
        }),
      );
    }, []);

    return (
      <>
        {loading && <LoadingBar className="top-0" />}

        <SheetHeader>
          <SheetTitle>
            {purchaseOrderId ? "Edit" : "Create"} Purchase Order
          </SheetTitle>
        </SheetHeader>
        <div
          className={cn(
            "flex flex-col gap-4 mb-4 mt-4",
            loading && "pointer-events-none",
          )}
        >
          <Card className="rounded-none">
            <CardContent>
              <div className="flex flex-col gap-4 mt-6">
                <SupplierPicker
                  value={purchaseOrder?.supplierId ?? undefined}
                  onChange={onSelectSupplier}
                />

                <div className="flex lg:flex-row flex-col gap-4">
                  <DatePicker
                    label="Purchase Order Date"
                    initialValue={
                      purchaseOrder?.purchasedAt
                        ? new Date(purchaseOrder?.purchasedAt)
                        : new Date()
                    }
                    onChange={(d) => {
                      setPurchaseOrder(
                        produce((draft) => {
                          draft.purchasedAt = Formatter.date(d);
                        }),
                      );
                    }}
                  />
                  <DatePicker
                    label="Expected date"
                    initialValue={
                      purchaseOrder?.expectedAt
                        ? new Date(purchaseOrder?.expectedAt)
                        : undefined
                    }
                    onChange={(d) => {
                      setPurchaseOrder(
                        produce((draft) => {
                          draft.expectedAt = Formatter.date(d);
                        }),
                      );
                    }}
                  />
                </div>
                <div className="mt-2">
                  <MaterialInput
                    value={purchaseOrder.note ?? ""}
                    label="Note"
                    onChange={(e) => {
                      setPurchaseOrder(
                        produce((draft) => {
                          draft.note = e.target.value;
                        }),
                      );
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <PurchaseOrderItemTable>
                {orderItemDisplay.length > 0 &&
                  orderItemDisplay.map((item) => (
                    <OrderItem
                      key={item.id}
                      item={item}
                      onChange={onChangeItem}
                      onRemove={() => onRemoveItem(item.id!)}
                    />
                  ))}
              </PurchaseOrderItemTable>
              <SearchProductPicker
                clearInput
                onChange={onSelectProduct}
                includeProductNotForSale
              />

              {additionalCostDisplay.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-full text-nowrap text-xs">
                        Additional Cost
                      </TableHead>
                      <TableHead className="min-w-[100px] text-nowrap text-xs">
                        Amount
                      </TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {additionalCostDisplay.map((item) => (
                      <AdditionalCostItem
                        key={item.id}
                        item={item}
                        onRemove={() => onRemoveAdditionalCost(item.id!)}
                        onChange={onChangeAdditionalCostItem}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
              <Button
                size="sm"
                onClick={onAddAdditionalCost}
                variant="outline"
                className="mt-4"
              >
                <PlusCircle className="w-4 h-4" />
                Add Additional Cost
              </Button>
            </CardContent>
          </Card>
          <SheetFooter>
            <div className="flex flex-row gap-2 justify-end">
              <Button variant="destructive" onClick={() => close(undefined)}>
                Cancel
              </Button>

              <Button
                disabled={creating || updating}
                onClick={onCreateOrUpdate}
              >
                {purchaseOrderId ? "Update" : "Create"}
                {(creating || updating) && (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                )}
              </Button>
            </div>
          </SheetFooter>
        </div>
      </>
    );
  },
  { defaultValue: undefined },
);

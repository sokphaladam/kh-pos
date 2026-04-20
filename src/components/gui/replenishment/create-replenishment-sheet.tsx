import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  requestUpdateReplenishmentPickingList,
  useCreateReplenishment,
  useLazyQueryReplenishmentDetail,
  useMutationUpdateReplenishmentPickingList,
  useQueryReplenishmentPickingList,
  useUpdateReplenishment,
} from "@/app/hooks/use-query-replenishment";
import { toast } from "sonner";
import {
  ChevronDown,
  LoaderIcon,
  PrinterIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { WarehouseCombobox } from "@/components/gui/warehouse/warehouse-combobox";
import { useFieldArray } from "react-hook-form";
import {
  Replenishment,
  ReplenishmentCreateType,
  ReplenishmentDetail,
} from "@/classes/replenishment";
import SearchProductPicker from "@/components/search-product-picker";
import { MaterialInput } from "@/components/ui/material-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingSpinner from "@/components/loading-spinner";
import { produce } from "immer";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { GeneralInformationReplenishment } from "./general-information";
import { FindProductInSlotResult } from "@/classes/find-product-in-slot";
import { cn } from "@/lib/utils";
import { ReplenishmentDireactPrint } from "./print/direct-print";
import { ReplenishmentButtonApprove } from "./button-approve";

type ReplenishmentItem = {
  name: string;
  stock: number;
  variantId: string;
  sentQty: number;
  costPerUnit: number;
  amount: number;
};

interface PickingListInput {
  slotId: string;
  variantId: string;
  qty: number;
  lotId: string;
}

interface OrderItemProps {
  deleteable?: boolean;
  item: ReplenishmentItem;
  onChange: (item: ReplenishmentItem) => void;
  onRemove: () => void;
  pickingList?: FindProductInSlotResult[] | undefined;
}

type FormValues = Omit<ReplenishmentCreateType, "replenishmentDetails"> & {
  fromWarehouseId: string;
  toWarehouseId: string;
  status: ReplenishmentCreateType["status"];
  replenishmentDetails: ReplenishmentItem[];
};

interface Variant {
  name: string;
  id: string;
  stock: number;
}

export function OrderItem(props: OrderItemProps) {
  const [item, setItem] = useState<ReplenishmentItem>(props.item);
  const [show, setShow] = useState(true);

  const onBlur = useCallback(() => {
    const totalAmount =
      (item?.sentQty ?? 0) * (item?.costPerUnit ? item?.costPerUnit : 0);

    setItem(
      produce((draft) => {
        draft.amount = totalAmount;
      }),
    );
    props.onChange({ ...item, amount: totalAmount });
  }, [item, props]);

  return (
    <>
      <TableRow>
        <TableCell className="table-cell text-xs text-nowrap">
          <div className="flex flex-row gap-2 items-center">
            <Button
              size={"sm"}
              variant={"ghost"}
              className={(props.pickingList?.length || 0) > 0 ? "" : "hidden"}
              type="button"
              onClick={() => setShow(!show)}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  show && "rotate-180",
                )}
              />
            </Button>
            <div>{item.name}</div>
          </div>
        </TableCell>
        <TableCell className="text-nowrap text-xs">{item.stock ?? 0}</TableCell>
        <TableCell className="table-cell text-nowrap text-xs">
          <MaterialInput
            value={item.sentQty?.toString() ?? ""}
            onBlur={onBlur}
            type="number"
            onChange={(event) => {
              const value = event.target.value;
              setItem(
                produce((draft) => {
                  if (value) {
                    draft.sentQty = parseInt(value);
                  } else {
                    draft.sentQty = 0;
                  }
                }),
              );
            }}
          />
        </TableCell>
        <TableCell className="table-cell text-nowrap text-xs">
          <div className="flex flex-row gap-1 items-center">
            <span>$</span>
            <MaterialInput
              value={item.costPerUnit?.toString() ?? ""}
              onBlur={onBlur}
              type="number"
              onChange={(event) => {
                const value = event.target.value;
                setItem(
                  produce((draft) => {
                    draft.costPerUnit = parseInt(value);
                  }),
                );
              }}
            />
          </div>
        </TableCell>
        <TableCell className="table-cell text-nowrap text-xs font-medium">
          ${item.amount?.toFixed(2) ?? "0.00"}
        </TableCell>
        <TableCell className="text-nowrap text-xs">
          {props.deleteable ? (
            <Button
              type="button"
              onClick={props.onRemove}
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          ) : (
            <span className="sr-only" />
          )}
        </TableCell>
      </TableRow>
      {(props.pickingList?.length || 0) > 0 &&
        !!show &&
        props.pickingList?.map((x, idx) => {
          return (
            <TableRow key={idx} className="bg-muted/30 hover:bg-muted/40">
              <TableCell className="text-xs text-nowrap">
                <div className="pl-12 flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-secondary text-secondary-foreground">
                    SLOT
                  </span>
                  <span className="text-muted-foreground">
                    {x.slot?.name} {x.slot?.posSlot ? "(POS)" : ""}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-nowrap text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-secondary text-secondary-foreground">
                    LOT
                  </span>
                  <span className="text-muted-foreground">
                    {x.lot?.lotNumber ?? "—"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-nowrap text-xs text-muted-foreground">
                {x.slot ? x.qty : "—"}
              </TableCell>
              <TableCell className="text-nowrap text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-secondary text-secondary-foreground">
                    EXP
                  </span>
                  <span className="text-muted-foreground">
                    {x.lot?.expiredDate ?? "—"}
                  </span>
                </div>
              </TableCell>
              <TableCell colSpan={2}>
                {!!x.message && (
                  <div className="text-xs text-destructive font-medium">
                    {x.message}
                  </div>
                )}
              </TableCell>
            </TableRow>
          );
        })}
    </>
  );
}

export function ItemTable({ children }: PropsWithChildren) {
  return (
    <div className="flex-1">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[280px] text-nowrap text-xs font-semibold text-foreground">
              Item
            </TableHead>
            <TableHead className="w-[120px] text-nowrap text-xs font-semibold text-foreground">
              Stock
            </TableHead>
            <TableHead className="w-[120px] text-nowrap text-xs font-semibold text-foreground">
              Quantity
            </TableHead>
            <TableHead className="w-[120px] text-nowrap text-xs font-semibold text-foreground">
              Cost / Unit
            </TableHead>
            <TableHead className="w-[120px] text-nowrap text-xs font-semibold text-foreground">
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

export const createReplenishmentSheet = createSheet<
  {
    variant?: Variant;
    replenishmentId?: string;
  },
  unknown
>(({ close, replenishmentId, variant }) => {
  const { setting } = useAuthentication();
  const form = useForm<FormValues>({
    defaultValues: {
      fromWarehouseId: "",
      toWarehouseId: "",
      status: "draft",
      replenishmentDetails: [],
    },
  });
  const [id, setId] = useState<string | null>(null);

  const { user } = useAuthentication();
  const [loading, setLoading] = useState(!!replenishmentId);
  const [info, setInfo] = useState<Replenishment | null>(null);
  const [isGenerate, setIsGenerate] = useState(false);
  const [details, setDetails] = useState<ReplenishmentDetail[]>([]);

  const [getReplenishment, { data }] =
    useLazyQueryReplenishmentDetail(replenishmentId);

  const [getPickingList, { data: pickingList, isLoading: pickingLoading }] =
    useQueryReplenishmentPickingList(
      replenishmentId || "new",
      form.getValues("replenishmentDetails").map((item) => {
        return {
          toFindQty: item.sentQty,
          variantId: item.variantId,
        };
      }),
    );

  const { trigger: create, isMutating } = useCreateReplenishment();
  const { trigger: update, isMutating: isUpdating } = useUpdateReplenishment();
  const { trigger: updatePickingList, isMutating: isUpdatePickingList } =
    useMutationUpdateReplenishmentPickingList(replenishmentId || "");

  const mounted = useRef<boolean>(false);
  const [stateChange, setStateChange] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "replenishmentDetails",
  });

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

  const mainWarehouse = useMemo(() => {
    if (!user?.warehouse?.isMain) return undefined;
    return user.warehouse;
  }, [user]);

  const onGeneratePickingList = useCallback(() => {
    // if (replenishmentId) {
    getPickingList()
      .then(() => {
        // toast.success("Picking list generated successfully");
        setIsGenerate(true);
        setStateChange(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Error generating picking list");
      });
    // }
  }, [getPickingList]);

  useEffect(() => {
    if (mainWarehouse) {
      form.setValue("fromWarehouseId", mainWarehouse.id);
    }
  }, [form, mainWarehouse]);

  useEffect(() => {
    if (replenishmentId) {
      getReplenishment().then(() => setLoading(false));
    }
  }, [replenishmentId, getReplenishment]);

  useEffect(() => {
    if (data?.result && !mounted.current && !loading) {
      const r = data.result?.replenishmentInfo;

      const details = data.result?.replenishmentDetails.map((r) => ({
        name: `${r.productVariant?.basicProduct?.title} (${r.productVariant?.name})`,
        variantId: r.productVariant?.id,
        sentQty: r.sentQty,
        costPerUnit: r.cost,
        amount: r.sentQty * r.cost,
      })) as ReplenishmentItem[];

      form.reset({
        fromWarehouseId: r?.fromWarehouseId?.id || "",
        toWarehouseId: r?.toWarehouseId?.id || "",
        status: (r.status as ReplenishmentCreateType["status"]) ?? "draft",
        replenishmentDetails: details || [],
      });

      setInfo(data.result.replenishmentInfo);
      setDetails(data.result.replenishmentDetails);

      mounted.current = true;

      if ((data?.result?.replenishmentPickingList?.length || 0) === 0) {
        onGeneratePickingList();
      }
    }
  }, [data, mounted, form, loading, onGeneratePickingList]);

  useEffect(() => {
    if (!!stateChange) {
      onGeneratePickingList();
    }
  }, [stateChange, form, replenishmentId, onGeneratePickingList, details]);

  const onSuccess = useCallback((msg: string) => {
    toast.success(msg);
  }, []);

  const onUpdatePickingList = useCallback(() => {
    const input = pickingList?.result?.map((item) => {
      return {
        variantId: item.variant?.id,
        slotId: item.slot?.id,
        qty: item.qty,
        lotId: item.lot?.id,
      };
    }) as PickingListInput[];
    return updatePickingList(input);
  }, [pickingList?.result, updatePickingList]);

  const onSubmit = useCallback(
    (values: FormValues) => {
      if (pickingLoading) return;
      const replenishmentDetails = values.replenishmentDetails.map((r) => ({
        variantId: r.variantId,
        sentQty: Number(r.sentQty),
        costPerUnit: Number(r.costPerUnit),
      }));

      const input = {
        ...values,
        replenishmentDetails,
      };

      if (replenishmentId) {
        if ((pickingList?.result?.length || 0) > 0) {
          onUpdatePickingList().then(() => {
            update({ ...input, id: replenishmentId }).then((result) => {
              if (result.success) {
                onSuccess("Replenishment updated successfully");
                close(result.result);
              }
              if (result.error) {
                toast.error(result.error);
              }
            });
          });
        } else {
          update({ ...input, id: replenishmentId }).then((result) => {
            if (result.success) {
              onSuccess("Replenishment updated successfully");
              close(result.result);
            }
            if (result.error) {
              toast.error(result.error);
            }
          });
        }
      } else {
        create(input).then((result) => {
          const inputPickingList = pickingList?.result?.map((item) => {
            return {
              variantId: item.variant?.id,
              slotId: item.slot?.id,
              qty: item.qty,
              lotId: item.lot?.id,
            };
          }) as PickingListInput[];
          if (result.success) {
            onSuccess("Replenishment created successfully");
            // close(result.result);
            requestUpdateReplenishmentPickingList(
              result.result || "",
              inputPickingList,
            ).then((r) => {
              if (r.success) {
                close(result.result);
              }
            });
          }
          if (result.error) {
            toast.error(result.error);
          }
        });
      }
    },
    [
      close,
      replenishmentId,
      onSuccess,
      create,
      update,
      onUpdatePickingList,
      pickingList,
      pickingLoading,
    ],
  );

  const pickingItem: FindProductInSlotResult[] =
    (data?.result?.replenishmentPickingList?.length || 0) > 0 && !isGenerate
      ? data?.result?.replenishmentPickingList || []
      : pickingList?.result || [];

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <SheetTitle>
            {replenishmentId ? "Edit Replenishment" : "Create Replenishment"}
          </SheetTitle>
          {replenishmentId && info?.status && (
            <Badge
              variant="outline"
              className={cn(
                "uppercase text-xs",
                info.status === "approved" || info.status === "completed"
                  ? "border-green-500 text-green-600"
                  : info.status === "receiving" || info.status === "received"
                    ? "border-blue-500 text-blue-600"
                    : "",
              )}
            >
              {info.status}
            </Badge>
          )}
        </div>
        {replenishmentId && (
          <SheetDescription>
            Review and update replenishment details below.
          </SheetDescription>
        )}
      </SheetHeader>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4 w-full">
          <div className={cn("mt-4", replenishmentId ? "visible" : "hidden")}>
            <GeneralInformationReplenishment info={info} details={details} />
          </div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromWarehouseId"
                    rules={{ required: "From warehouse is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Warehouse</FormLabel>
                        <FormControl>
                          <WarehouseCombobox
                            disabled
                            value={field.value}
                            onChange={(value) => {
                              if (value === form.getValues("toWarehouseId")) {
                                toast.warning(
                                  "Source and destination warehouses must be different.",
                                );
                              } else {
                                field.onChange(value);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toWarehouseId"
                    rules={{ required: "To warehouse is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination Warehouse</FormLabel>
                        <FormControl>
                          <WarehouseCombobox
                            value={field.value}
                            onChange={(value) => {
                              if (value === form.getValues("fromWarehouseId")) {
                                toast.warning(
                                  "Source and destination warehouses must be different.",
                                );
                              } else {
                                field.onChange(value);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-row justify-between items-center">
                    <Label className="text-sm font-semibold text-foreground">
                      Replenishment Items
                    </Label>
                    {fields.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {fields.length} item{fields.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <Card>
                    <CardContent className="p-4">
                      <ItemTable>
                        {fields.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="h-24 text-center text-sm text-muted-foreground"
                            >
                              No items added yet. Search for products below.
                            </TableCell>
                          </TableRow>
                        )}
                        {fields.map((field, index) => {
                          const picking =
                            pickingItem.length === 0
                              ? []
                              : pickingItem.filter(
                                  (f) => f.variant?.id === field.variantId,
                                );

                          return (
                            <OrderItem
                              deleteable={!variant}
                              onChange={(item) => {
                                form.setValue(
                                  `replenishmentDetails.${index}`,
                                  item,
                                );
                                setStateChange(true);
                              }}
                              onRemove={() => {
                                remove(index);
                              }}
                              key={field.id}
                              item={field}
                              pickingList={picking}
                            />
                          );
                        })}
                      </ItemTable>

                      {!variant && (
                        <SearchProductPicker
                          warehouse={user?.currentWarehouseId}
                          forReplenishment={true}
                          clearInput
                          onChange={(item) => {
                            append(
                              {
                                variantId: item.variantId,
                                sentQty: 0,
                                costPerUnit: Number(item.price || 0),
                                name: item.productTitle,
                                stock: item.stock ?? 0,
                                amount: 0,
                              },
                              {
                                shouldFocus: false,
                              },
                            );
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  onClick={() => {
                    setId(replenishmentId || "");
                  }}
                  type="button"
                  variant={"outline"}
                >
                  <PrinterIcon className="mr-2 h-4 w-4" />
                  Print
                </Button>

                <Button
                  onClick={() => {
                    onGeneratePickingList();
                  }}
                  type="button"
                  variant={"outline"}
                  disabled={pickingLoading}
                >
                  {pickingLoading ? (
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                  )}
                  Check Stock
                </Button>

                {!["approved", "receiving", "received"].includes(
                  data?.result?.replenishmentInfo.status || "draft",
                ) && (
                  <Button
                    type="submit"
                    disabled={isMutating || isUpdating || isUpdatePickingList}
                  >
                    {(isMutating || isUpdating || isUpdatePickingList) && (
                      <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save
                  </Button>
                )}
                {data?.result?.replenishmentInfo.status === "draft" &&
                  (data?.result?.replenishmentPickingList?.length || 0) > 0 && (
                    <ReplenishmentButtonApprove
                      id={replenishmentId || ""}
                      restrictLot={inventorySetting.restrict_product_lot}
                      pickingList={pickingItem}
                      onCompleted={() => {
                        setLoading(true);
                        getReplenishment().then(() => {
                          setLoading(false);
                          close(true);
                          toast.success("Replenishment has been approved!");
                        });
                      }}
                    />
                  )}
              </div>
            </form>
          </Form>
          {id && (
            <ReplenishmentDireactPrint
              id={id}
              onPrintComplete={() => setId(null)}
              pickingList={pickingItem}
            />
          )}
        </div>
      )}
    </>
  );
});

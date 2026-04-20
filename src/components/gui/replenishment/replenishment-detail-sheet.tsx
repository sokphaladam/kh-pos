import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createSheet } from "@/components/create-sheet";
import {
  useMutationApproveReplenishment,
  useMutationRecieveReplenishment,
  useQueryReplenishmentDetail,
} from "@/app/hooks/use-query-replenishment";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Formatter } from "@/lib/formatter";
import { Fragment, useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import SearchSlotPicker from "@/components/search-slot-picker";
import { MaterialInput } from "@/components/ui/material-input";
import { produce } from "immer";
import { DatePicker } from "@/components/ui/date-picker";
import { SlotDetail } from "@/classes/slot";
import { ReceivedReplenishedItem } from "@/classes/receive-replenishment";
import { toast } from "sonner";
import LoadingSpinner from "@/components/loading-spinner";
import PickingList from "./picking-list";
import { GeneralInformationReplenishment } from "./general-information";
import { ReplenishmentDireactPrint } from "./print/direct-print";
import { useAuthentication } from "contexts/authentication-context";
import { cn } from "@/lib/utils";

type ReceiveItemInput = Partial<ReceivedReplenishedItem>;
interface CollapsibleProps {
  warehouseId?: string;
  isOpen: boolean;
  costPerUnit: number | undefined;
  onClose?: (open: boolean) => void;
  onChange: (item: ReceiveItemInput) => void;
  initialvalue?: ReceiveItemInput;
}

const RecieveReplenishment = function (props: CollapsibleProps) {
  const [slot, setSlot] = useState<SlotDetail>();
  const [input, setInput] = useState<ReceiveItemInput>({
    replenishmentDetailId: props.initialvalue?.replenishmentDetailId || "",
    slotId: props.initialvalue?.slotId || "",
    expiredAt: "",
    qty: props.initialvalue?.qty || 0,
    costPerUnit: props.costPerUnit,
  });

  const { isOpen, onChange, onClose } = props;

  const onBlur = useCallback(() => {
    if (input) {
      onChange({ ...input, slotId: slot?.id });
    }
  }, [onChange, input, slot]);

  if (!isOpen) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={onClose}>
      <CollapsibleContent className="space-y-4 mt-6 mb-4 w-full">
        <div className="flex flex-row gap-4 font-medium">
          <SearchSlotPicker
            warehouseId={props.warehouseId}
            value={slot?.name}
            onChange={(s) => {
              setSlot(s);
              onChange({ ...input, slotId: s?.id });
            }}
          />
          <MaterialInput
            value={input?.qty?.toString()}
            onChange={(e) => {
              setInput(
                produce((draft) => {
                  draft.qty = parseInt(e.target.value || "0");
                })
              );
            }}
            type="number"
            label="Quantity"
            onBlur={onBlur}
          />
          <div className="flex flex-row items-center gap-1">
            <span>$</span>
            <MaterialInput
              value={input?.costPerUnit?.toString() ?? ""}
              onChange={(e) => {
                setInput(
                  produce((draft) => {
                    draft.costPerUnit = parseInt(e.target.value || "0");
                  })
                );
              }}
              type="number"
              label="Cost Per Unit"
              onBlur={onBlur}
            />
          </div>
        </div>

        <DatePicker
          label="Expire Date"
          onDayBlur={onBlur}
          initialValue={input.expiredAt ? new Date(input.expiredAt) : undefined}
          onChange={(d) => {
            if (d) {
              setInput(
                produce((draft) => {
                  draft.expiredAt = Formatter.date(d) ?? "";
                })
              );
              onChange({
                ...input,
                slotId: slot?.id,
                expiredAt: Formatter.date(d) || "",
              });
            }
          }}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

export const replenishmentDetailSheet = createSheet<
  { id: string; isMain: boolean },
  void
>(({ close, id, isMain }) => {
  const { currentWarehouse } = useAuthentication();
  const [idPrint, setIdPrint] = useState<string | null>(null);
  const [receiveItems, setReceiveItems] = useState<ReceiveItemInput[]>([]);
  const { data, isLoading } = useQueryReplenishmentDetail(id);
  const { trigger: approve, isMutating: isApproving } =
    useMutationApproveReplenishment(id);
  const { trigger, isMutating: isRecieving } =
    useMutationRecieveReplenishment();

  const validated = useCallback(() => {
    const found = receiveItems
      .filter((f) => f && typeof f === "object")
      .find((i) => {
        return !Number(i.qty) || !i.slotId;
      });

    if (found) {
      if (!found?.slotId) {
        toast.error("Please select slot");
        return false;
      }

      if (!found?.qty) {
        toast.error("Please enter quantity");
        return false;
      }
    }

    return true;
  }, [receiveItems]);

  const onApprove = useCallback(() => {
    approve({})
      .then((result) => {
        if (result.success) {
          close();
          toast.success("Replenishment has been approved!");
        }
        if (result.error) {
          toast.error(result.error);
        }
      })
      .finally(() => {
        close(undefined);
      });
  }, [approve, close]);

  const onReceiveItems = useCallback(() => {
    if (validated()) {
      const input = {
        replenishmentId: id,
        receivedItems: receiveItems
          .filter((f) => f && typeof f === "object")
          .map((x) => {
            return {
              qty: x.qty,
              slotId: x.slotId,
              replenishmentDetailId: x.replenishmentDetailId,
              costPerUnit: x.costPerUnit,
              lotNumber: x.lotNumber,
              manufacturedAt: x.manufacturedAt,
              expiredAt: x.expiredAt ? Formatter.date(x.expiredAt) : undefined,
            };
          }) as ReceivedReplenishedItem[],
      };
      trigger(input)
        .then((r) => {
          if (r.success) {
            close();
            toast.success("Successfully recieve!");
          }
          if (r.error) {
            toast.error(r.error);
          }
        })
        .catch((error) => {
          toast.error(error.message ?? "Failed to recieve replenishment");
        });
    }
  }, [receiveItems, id, close, trigger, validated]);

  const onChangeReceiveItem = useCallback((item: Partial<ReceiveItemInput>) => {
    setReceiveItems(
      produce((draft) => {
        const findIndex = draft.findIndex(
          (f) => f.replenishmentDetailId === item.replenishmentDetailId
        );
        if (findIndex > -1) {
          draft[findIndex] = item;
        }
      })
    );
  }, []);

  const info = useMemo(() => {
    if (!data?.replenishmentInfo) return null;
    return data.replenishmentInfo;
  }, [data]);

  const details = useMemo(() => {
    if (!data?.replenishmentDetails) return [];
    return data.replenishmentDetails;
  }, [data]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>Replenishment Details</SheetTitle>
      </SheetHeader>
      <div className="py-4">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            {/* Header Information */}
            <GeneralInformationReplenishment info={info} details={details} />
            {/* Details Table */}
            {(data?.replenishmentPickingList ?? []).length > 0 ? (
              <>
                <Card className="rounded-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Replenishment Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="text-[13px]">
                          <TableHead className="min-w-[120px] text-nowrap text-xs">
                            Item
                          </TableHead>
                          <TableHead className="text-nowrap text-xs">
                            Sent Qty
                          </TableHead>
                          <TableHead className="text-nowrap text-xs">
                            Cost Per Unit
                          </TableHead>
                          <TableHead className="text-nowrap text-xs">
                            Received Qty
                          </TableHead>
                          <TableHead className="text-nowrap text-xs">
                            Remaining Qty
                          </TableHead>
                          {!isMain && (
                            <TableHead className="sr-only" colSpan={2}>
                              Action
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.map((item, index) => {
                          const open = receiveItems
                            .map((r) => r.replenishmentDetailId)
                            .includes(item.id ?? "");
                          const product = item.productVariant;
                          const title = `${product?.basicProduct?.title} (${item.productVariant?.name})`;

                          return (
                            <Fragment key={index}>
                              <TableRow key={item.id} className="border-b-0">
                                <TableCell className="table-cell text-nowrap text-xs">
                                  {title}
                                </TableCell>
                                <TableCell className="table-cell text-nowrap text-xs">
                                  {item.sentQty}
                                </TableCell>
                                <TableCell className="table-cell text-nowrap text-xs">
                                  ${item.cost}
                                </TableCell>
                                <TableCell className="table-cell text-nowrap text-xs">
                                  {item.receivedQty}
                                </TableCell>
                                <TableCell className="table-cell text-nowrap text-xs">
                                  {item.sentQty - item.receivedQty}
                                </TableCell>
                                {!isMain &&
                                  item.sentQty !== item.receivedQty && (
                                    <TableCell
                                      className="text-right text-nowrap text-xs"
                                      colSpan={2}
                                    >
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          if (!item) return;
                                          const idx = receiveItems.find(
                                            (r) =>
                                              r.replenishmentDetailId ===
                                              item.id
                                          );

                                          if (idx) {
                                            // close
                                            setReceiveItems((prev) =>
                                              prev.filter(
                                                (i) =>
                                                  i.replenishmentDetailId !==
                                                  idx.replenishmentDetailId
                                              )
                                            );
                                          } else {
                                            // open
                                            setReceiveItems(
                                              produce((draft) => {
                                                draft.push({
                                                  slotId: undefined,
                                                  expiredAt: undefined,
                                                  qty:
                                                    item.sentQty -
                                                    item.receivedQty,
                                                  costPerUnit: item.cost,
                                                  replenishmentDetailId:
                                                    item.id,
                                                });
                                              })
                                            );
                                          }
                                        }}
                                        variant="outline"
                                      >
                                        {/* Receive */}
                                        {open ? <ChevronUp /> : <ChevronDown />}
                                      </Button>
                                    </TableCell>
                                  )}
                              </TableRow>
                              {item.sentQty !== item.receivedQty && (
                                <TableRow className="hover:bg-transparent">
                                  <TableCell
                                    colSpan={7}
                                    className="p-0 text-nowrap text-xs"
                                  >
                                    {open && (
                                      <RecieveReplenishment
                                        initialvalue={receiveItems.find(
                                          (ritem) =>
                                            ritem.replenishmentDetailId ===
                                            item.id
                                        )}
                                        key={item.id}
                                        warehouseId={currentWarehouse?.id}
                                        isOpen={true}
                                        costPerUnit={item.cost}
                                        onClose={() =>
                                          setReceiveItems((prev) =>
                                            prev.filter(
                                              (i) =>
                                                i.replenishmentDetailId !==
                                                item.id
                                            )
                                          )
                                        }
                                        onChange={(value) => {
                                          onChangeReceiveItem({
                                            ...value,
                                            replenishmentDetailId: item.id,
                                          });
                                        }}
                                      />
                                    )}
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                {data?.replenishmentInfo.fromWarehouseId?.id ===
                  currentWarehouse?.id && (
                  <PickingList
                    onClose={close}
                    replenishmentId={id}
                    data={data?.replenishmentPickingList ?? []}
                  />
                )}
              </>
            ) : (
              <div className="flex flex-col gap-4"></div>
            )}

            {(data?.replenishmentPickingList ?? [])?.length > 0 && (
              <SheetFooter>
                {isMain && (
                  <Button
                    onClick={() => {
                      setIdPrint(id || "");
                    }}
                    type="button"
                    variant={"outline"}
                  >
                    Print
                  </Button>
                )}
                {isMain ? (
                  <Button
                    onClick={onApprove}
                    className={cn(data?.replenishmentInfo.status === "draft")}
                  >
                    Approve
                    {isApproving && <LoadingSpinner />}
                  </Button>
                ) : (
                  <Button
                    disabled={receiveItems.length === 0}
                    onClick={onReceiveItems}
                  >
                    Receive
                    {isRecieving && <LoadingSpinner />}
                  </Button>
                )}
              </SheetFooter>
            )}
          </div>
        )}
      </div>
      {idPrint && (
        <ReplenishmentDireactPrint
          id={idPrint}
          onPrintComplete={() => setIdPrint(null)}
        />
      )}
    </>
  );
});

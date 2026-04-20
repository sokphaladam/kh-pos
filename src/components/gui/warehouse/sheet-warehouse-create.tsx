import {
  useCreateWarehouse,
  useDeleteWarehouseSlot,
  useUpdateWarehouse,
} from "@/app/hooks/use-query-warehouse";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MaterialInput } from "@/components/ui/material-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponseType,
  WarehouseInput,
  WarehouseResponseType,
  WarehouseSlotInput,
} from "@/lib/types";
import { produce } from "immer";
import { PlusCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const EMPTY_VALUE: WarehouseInput = {
  name: "",
  isMain: false,
  slot: [{ slotName: "", slotCapacity: 100, slotStatus: "ACTIVE" }],
};

export const createWarehouseSheet = createSheet<
  { data: WarehouseResponseType[]; edit: WarehouseInput | undefined },
  WarehouseInput | null
>(
  ({ close, edit }) => {
    const [input, setInput] = useState<WarehouseInput>(
      edit ? edit : EMPTY_VALUE
    );
    const [removeSlot, setRemoveSlot] = useState<WarehouseSlotInput[]>([]);
    const { trigger: create, isMutating: loadingCreate } = useCreateWarehouse();
    const { trigger: update, isMutating: loadingUpdate } = useUpdateWarehouse();
    const { trigger: deleteSlot, isMutating: loadingDeleteSlot } =
      useDeleteWarehouseSlot();

    const onCreate = useCallback(async () => {
      let res: ResponseType<{ message: string }> = {
        success: false,
        result: { message: "" },
      };
      if (edit) {
        if (removeSlot.length > 0) {
          await deleteSlot({ id: removeSlot.map((x) => x.id || "") });
        }
        res = (await update(input)) as ResponseType<{ message: string }>;
      } else {
        res = (await create(input)) as ResponseType<{ message: string }>;
      }

      if (res.success === true) {
        toast.success(res.result?.message);
        close(input);
      } else {
        toast.error(res.error);
      }
    }, [close, input, create, edit, removeSlot, deleteSlot, update]);

    const onNewSlot = useCallback(() => {
      setInput(
        produce((draft) => {
          draft.slot = [
            ...draft.slot,
            {
              slotName: "",
              slotCapacity: 100,
              slotStatus: "INACTIVE",
            },
          ];
        })
      );
    }, []);

    const onRemoveSlot = useCallback(
      (id: number, slot: WarehouseSlotInput) => {
        setRemoveSlot([...removeSlot, slot]);
        setInput(
          produce((draft) => {
            draft.slot = draft.slot.filter((_, i) => i !== id);
          })
        );
      },
      [removeSlot]
    );

    return (
      <>
        <SheetHeader>
          <SheetTitle>{edit ? "Edit" : "Create"} warehouse</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 py-4">
          <MaterialInput
            label="Warehouse Name"
            placeholder="Enter warehouse name"
            type="text"
            value={input.name}
            onChange={(e) =>
              setInput(
                produce((draft) => {
                  draft.name = e.target.value;
                })
              )
            }
            autoFocus
          />
          <div className="flex flex-row gap-2 items-center justify-end">
            <Checkbox
              checked={input.isMain}
              id="isMain"
              onCheckedChange={(e) => {
                setInput(
                  produce((draft) => {
                    draft.isMain = Boolean(e);
                  })
                );
              }}
            />
            <Label htmlFor="isMain">Is Main</Label>
          </div>
          <div className="-mx-6">
            <hr />
          </div>
          <div>
            <Table className="rounded-md">
              <TableHeader>
                <TableRow>
                  <TableHead className="border text-xs">Name</TableHead>
                  <TableHead className="border text-xs">
                    Capacity (CBM)
                  </TableHead>
                  <TableHead className="border text-xs">Status</TableHead>
                  <TableHead className="border text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {input.slot.map((slot, idx) => {
                  return (
                    <TableRow key={idx}>
                      <TableCell className="border">
                        <MaterialInput
                          type="text"
                          value={slot.slotName}
                          label=""
                          onChange={(e) => {
                            setInput(
                              produce((draft) => {
                                draft.slot[idx].slotName = e.target.value;
                              })
                            );
                          }}
                          className="h-[30px]"
                        />
                      </TableCell>
                      <TableCell className="border">
                        <MaterialInput
                          type="number"
                          value={slot.slotCapacity}
                          label=""
                          onChange={(e) => {
                            setInput(
                              produce((draft) => {
                                draft.slot[idx].slotCapacity = Number(
                                  e.target.value
                                );
                              })
                            );
                          }}
                          className="h-[30px]"
                        />
                      </TableCell>
                      <TableCell className="border">
                        <div className="mt-2">
                          <Select
                            value={slot.slotStatus as string}
                            onValueChange={(e) => {
                              setInput(
                                produce((draft) => {
                                  draft.slot[idx].slotStatus = e as
                                    | "ACTIVE"
                                    | "INACTIVE";
                                })
                              );
                            }}
                          >
                            <SelectTrigger className="h-[30px]">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Status</SelectLabel>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">
                                  Inactive
                                </SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="border text-center">
                        <BasicMenuAction
                          value={slot}
                          onAdd={
                            idx === input.slot.length - 1
                              ? onNewSlot
                              : undefined
                          }
                          onDelete={
                            input.slot.length > 1
                              ? () => onRemoveSlot(idx, slot)
                              : undefined
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell className="border text-xs" colSpan={4}>
                    <Button variant={"outline"} onClick={onNewSlot} size="sm">
                      <PlusCircle className="w-4 h-4" /> New Slot
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        <SheetFooter>
          <Button
            onClick={onCreate}
            size={"sm"}
            disabled={loadingCreate || loadingUpdate || loadingDeleteSlot}
          >
            Save
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null }
);

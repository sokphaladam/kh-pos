import { createDialog } from "@/components/create-dialog";
import LabelInput from "@/components/label-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WarehouseInput } from "@/lib/types";
import { produce } from "immer";
import { Minus, Plus } from "lucide-react";
import { useCallback, useState } from "react";

const EMPTY_VALUE: WarehouseInput = {
  name: "",
  isMain: false,
  slot: [{ slotName: "", slotCapacity: 100, slotStatus: "ACTIVE" }],
};

export const createWarehouseDialog = createDialog<object, unknown>(
  ({ close }) => {
    const [input, setInput] = useState<WarehouseInput>(EMPTY_VALUE);

    const onCreate = useCallback(() => {
      close(input);
    }, [close, input]);

    return (
      <>
        <DialogHeader>
          <DialogTitle>Create new warehouse</DialogTitle>
        </DialogHeader>
        <hr />
        <div className="flex flex-col gap-3">
          <LabelInput
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
          />
          <div className="flex flex-row gap-2 items-center">
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
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Capacity (CBM)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {input.slot.map((slot, idx) => {
                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <LabelInput
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
                        />
                      </TableCell>
                      <TableCell>
                        <LabelInput
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
                        />
                      </TableCell>
                      <TableCell>
                        <div className="mt-2">
                          <Select>
                            <SelectTrigger
                              defaultValue={slot.slotStatus as string}
                              onChange={(e) => {
                                setInput(
                                  produce((draft) => {
                                    draft.slot[idx].slotStatus = e.currentTarget
                                      .value as "ACTIVE" | "INACTIVE";
                                  })
                                );
                              }}
                            >
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
                      <TableCell>
                        <div className="flex flex-row gap-2">
                          {idx === input.slot.length - 1 && (
                            <Button
                              size={"sm"}
                              variant={"ghost"}
                              onClick={() => {
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
                              }}
                            >
                              <Plus />
                            </Button>
                          )}
                          {idx > 0 && (
                            <Button
                              size={"sm"}
                              variant={"ghost"}
                              onClick={() => {
                                setInput(
                                  produce((draft) => {
                                    draft.slot = draft.slot.filter(
                                      (_, i) => i !== idx
                                    );
                                  })
                                );
                              }}
                            >
                              <Minus />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onCreate} size={"sm"}>
            Create
          </Button>
        </DialogFooter>
      </>
    );
  },
  { defaultValue: undefined }
);

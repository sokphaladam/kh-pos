import { CreateSlotInput } from "@/app/api/warehouse/slot/create-slot";
import { UpdateSlotInput } from "@/app/api/warehouse/slot/update-slot";
import { useCreateSlot, useUpdateSlot } from "@/app/hooks/use-query-slot";
import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { MaterialInput } from "@/components/ui/material-input";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { produce } from "immer";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { Checkbox } from "@/components/ui/checkbox";

export const createSlotSheet = createSheet<
  { edit: CreateSlotInput | UpdateSlotInput | undefined },
  unknown
>(({ close, edit }) => {
  const { currentWarehouse } = useAuthentication();
  const [input, setInput] = useState<
    CreateSlotInput | UpdateSlotInput | undefined
  >(
    edit ||
      ({ slotName: "", warehouseId: currentWarehouse?.id } as CreateSlotInput)
  );

  const { trigger: create, isMutating: loadingCreate } = useCreateSlot();
  const { trigger: update, isMutating: loadingUpdate } = useUpdateSlot();

  const handleInputChange = useCallback((value: string) => {
    setInput(
      produce((draft) => {
        (draft as CreateSlotInput | UpdateSlotInput).slotName = value;
      })
    );
  }, []);

  const handleCheckChange = useCallback((checked: boolean) => {
    setInput(
      produce((draft) => {
        (draft as CreateSlotInput | UpdateSlotInput).forReplenishment = checked;
      })
    );
  }, []);

  const onSave = useCallback(async () => {
    if (!input) return;

    const res = !edit ? await create(input) : await update(input);

    if (res.success) {
      toast.success(!edit ? "Slot created" : "Slot updated");
      close(input);
    }
  }, [close, create, edit, input, update]);

  return (
    <>
      {input && (
        <>
          <SheetHeader>
            <SheetTitle>Slot Info</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 py-4 mt-4">
            <MaterialInput
              label="Slot Name"
              placeholder="Enter slot name"
              type="text"
              value={input?.slotName || ""}
              onChange={(e) => handleInputChange(e.target.value)}
              autoFocus
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="forReplenishment"
                checked={input.forReplenishment}
                onCheckedChange={handleCheckChange}
              />
              <label
                htmlFor="forReplenishment"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                For Replenishment
              </label>
            </div>
          </div>

          <SheetFooter>
            <Button
              onClick={onSave}
              size={"sm"}
              disabled={loadingCreate || loadingUpdate}
            >
              Save
            </Button>
          </SheetFooter>
        </>
      )}
    </>
  );
});

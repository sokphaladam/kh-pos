"use client";

import { useMutationTransferInventory } from "@/app/hooks/use-invetory";
import { useQueryPOSInfo } from "@/app/hooks/use-query-order";
import { FindProductInSlotResult } from "@/classes/find-product-in-slot";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MaterialInput } from "@/components/ui/material-input";
import { useAuthentication } from "contexts/authentication-context";
import { ArrowRight } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface Props {
  currentSlot: FindProductInSlotResult;
}

export const dialogTransferItem = createDialog<Props, unknown>(
  ({ currentSlot, close }) => {
    const [qty, setQty] = useState(currentSlot.qty);
    const { currentWarehouse } = useAuthentication();
    const { data } = useQueryPOSInfo(currentWarehouse?.id || "");
    const { trigger } = useMutationTransferInventory();

    const onClickTransfer = useCallback(() => {
      const input = {
        currentSlotId: currentSlot.slot?.id || "",
        destinationSlotId: data?.result?.posSlotId || "",
        qty: Number(qty),
        variantId: currentSlot.variant?.id || "",
      };

      trigger(input)
        .then((res) => {
          if (res.success) {
            toast.success(
              `The product has been successfully moved from Slot ${currentSlot.slot?.name} to Slot POS.`
            );
            close(true);
          }
        })
        .catch(() => {
          toast.error("Fail to transfer.");
        });
    }, [currentSlot, data, qty, trigger, close]);

    return (
      <>
        <DialogHeader>
          <DialogTitle>Process Transfer</DialogTitle>
        </DialogHeader>
        <div className="flex flex-row gap-3 text-gray-400 text-xs mb-3">
          <div className="flex flex-row gap-3">
            From: {currentSlot.slot?.name}
          </div>
          <div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex flex-row gap-3">POS Slot</div>
        </div>
        <MaterialInput
          value={qty}
          alt=""
          label="Qty"
          type="number"
          onChange={(e) => {
            setQty(Number(e.target.value || 0));
          }}
        />
        <DialogFooter>
          <div>
            <Button size={"sm"} onClick={onClickTransfer}>
              Transfer
            </Button>
          </div>
        </DialogFooter>
      </>
    );
  }
);

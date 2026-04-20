"use client";
import { useDeleteOrder } from "@/app/hooks/use-query-order";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResponseType } from "@/lib/types";
import React, { useCallback } from "react";
import { toast } from "sonner";

export const SheetTabContext = createDialog<{ id: string }, string>(
  ({ close, id }) => {
    const { trigger, isMutating } = useDeleteOrder(id);

    const handleRemove = useCallback(() => {
      trigger({})
        .then((res) => {
          if ((res as unknown as ResponseType<unknown>).success) {
            toast.success("Save order was removed");
            close("remove");
          } else {
            toast.error("Fail to remove save order");
          }
        })
        .catch(() => {
          toast.error("Fail to remove save order");
        });
    }, [trigger, close]);

    const handleClose = useCallback(() => {
      close("close");
    }, [close]);

    return (
      <>
        <DialogHeader>
          <DialogTitle>Close Order</DialogTitle>
          <DialogDescription>
            Do you want to close or close & remove this order?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isMutating}
          >
            Close & Remove
          </Button>
          <Button onClick={handleClose} disabled={isMutating}>
            Just Close
          </Button>
        </DialogFooter>
      </>
    );
  },
  { defaultValue: "cancel" }
);

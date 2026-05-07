/* eslint-disable @typescript-eslint/no-explicit-any */
import { BasicMenuAction } from "@/components/basic-menu-action";
import { table_restaurant_tables } from "@/generated/tables";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { cn } from "@/lib/utils";
import { RestaurantOrderItem } from "../contexts/restaurant-context";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";
import { useMutationPrintToKitchen } from "@/app/hooks/use-query-order-update-status-item";
import { toast } from "sonner";
import { useCommonDialog } from "@/components/common-dialog";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RestaurantItemMenuProps extends WithLayoutPermissionProps {
  item: RestaurantOrderItem;
  table?: table_restaurant_tables;
  orderId: string;
}

export function RestaurantItemMenu({
  item,
  table,
  ...rest
}: RestaurantItemMenuProps) {
  const { showDialog } = useCommonDialog();
  const { removeProduct } = useRestaurantActions();
  const { trigger, isMutating } = useMutationPrintToKitchen();

  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [resendQty, setResendQty] = useState(1);

  const qtyAreNotPending = item.status?.reduce((a, b) => {
    if (b.status !== "pending") {
      return a + Number(b.qty);
    }
    return a;
  }, 0);

  const qtyArePending = item.status?.reduce((a, b) => {
    if (b.status === "pending") {
      return a + Number(b.qty);
    }
    return a;
  }, 0);

  let allowDelete = false;

  if (rest.allowDelete) {
    allowDelete = true;
  }

  if (!rest.allowDelete && (qtyArePending || 0) > 0 && qtyAreNotPending === 0) {
    allowDelete = true;
  }

  const notInPendingStatus = item.status
    ?.filter((s) => s.status !== "pending" && s.qty > 0)
    .reduce((a, b) => a + b.qty, 0);

  const totalStatusQty = item.status?.reduce((a, b) => a + b.qty, 0) || 0;

  function handleResendConfirm() {
    trigger({
      orderDetailId: item.orderDetailId,
      qty: resendQty,
      reprint: true,
    })
      .then((res) => {
        if (res.success) {
          toast.success("Item sent to kitchen");
        } else {
          toast.error("Failed to send item to kitchen");
        }
      })
      .catch(() => {
        toast.error("Failed to send item to kitchen");
      })
      .finally(() => {
        setResendDialogOpen(false);
      });
  }

  return (
    <div className={cn("flex-shrink-0")} onClick={(e) => e.stopPropagation()}>
      <Dialog open={resendDialogOpen} onOpenChange={setResendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend to Kitchen</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="resend-qty">Quantity to resend</Label>
            <Input
              id="resend-qty"
              type="number"
              min={1}
              max={totalStatusQty}
              value={resendQty}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1) setResendQty(val);
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResendDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button disabled={isMutating} onClick={handleResendConfirm}>
              Resend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <BasicMenuAction
        disabled={isMutating}
        value={item}
        onDelete={
          allowDelete
            ? () => {
                if (table) {
                  if ((qtyAreNotPending || 0) > 0) {
                    showDialog({
                      title: "Confirm Delete Item",
                      content: `This item has ${qtyAreNotPending} quantity that is not in pending status. Are you sure you want to delete it?`,
                      destructive: true,
                      actions: [
                        {
                          text: "Delete",
                          onClick: async () => {
                            removeProduct(
                              item.orderDetailId,
                              table.id ? table : (table as any).tables,
                              "",
                            );
                          },
                        },
                      ],
                    });
                  } else {
                    removeProduct(
                      item.orderDetailId,
                      table.id ? table : (table as any).tables,
                      "",
                    );
                  }
                }
              }
            : undefined
        }
        items={
          (notInPendingStatus || 0) === totalStatusQty
            ? [
                {
                  label: "Resend to Kitchen",
                  onClick: () => {
                    setResendQty(totalStatusQty || 1);
                    setResendDialogOpen(true);
                  },
                },
              ]
            : []
        }
      />
    </div>
  );
}

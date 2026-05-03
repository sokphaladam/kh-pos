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

  return (
    <div className={cn("flex-shrink-0")} onClick={(e) => e.stopPropagation()}>
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
                    trigger({
                      orderDetailId: item.orderDetailId,
                      qty: item.qty,
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
                      });
                  },
                },
              ]
            : []
        }
      />
    </div>
  );
}

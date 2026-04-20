/* eslint-disable @typescript-eslint/no-explicit-any */
import { BasicMenuAction } from "@/components/basic-menu-action";
import { table_restaurant_tables } from "@/generated/tables";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { cn } from "@/lib/utils";
import { RestaurantOrderItem } from "../contexts/restaurant-context";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";
import { useMutationPrintToKitchen } from "@/app/hooks/use-query-order-update-status-item";
import { toast } from "sonner";

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
  const { removeProduct } = useRestaurantActions();
  const { trigger, isMutating } = useMutationPrintToKitchen();

  const qtyAreNotPending = item.status?.reduce((a, b) => {
    if (b.status !== "pending") {
      return a + Number(b.qty);
    }
    return a;
  }, 0);

  let allowDelete = rest.allowDelete && qtyAreNotPending === 0;

  if (!allowDelete && qtyAreNotPending === 0) {
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
                  removeProduct(
                    item.orderDetailId,
                    table.id ? table : (table as any).tables,
                    "",
                  );
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

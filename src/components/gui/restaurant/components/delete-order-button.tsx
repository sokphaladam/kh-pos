'use client';

import { useCommonDialog } from "@/components/common-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useRestaurant } from "../contexts/restaurant-context";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";

interface DeleteOrderButtonProps {
  tableKey: string,
  permissionKey?: boolean,
}

export function DeleteOrderButton(props: DeleteOrderButtonProps){
  const {state, loading, isRequest} = useRestaurant();
  const {onRemoveOrder} = useRestaurantActions();
  const { showDialog } = useCommonDialog();
  const currentTable = state.activeTables.find(
    (t) => t.tables?.id === props.tableKey || ""
  );

  const disabledDelete = useMemo(() => {
    const hasInvoice = !!currentTable?.orders?.invoiceNo;
    const hasItems = (currentTable?.orders?.items?.length ?? 0) > 0;
    return (
      (!hasInvoice && hasItems) ||
      loading ||
      isRequest ||
      (!props.permissionKey && hasInvoice && hasItems)
    );
  }, [currentTable, isRequest, loading, props.permissionKey])

  const handleDeleteOrder = useCallback(async () => {
    if (currentTable?.tables && currentTable.orders?.orderId) {
      await showDialog({
        title: "Remove Order",
        content:
          "Are you sure you want to remove this entire order? This action cannot be undone.",
        destructive: true,
        actions: [
          {
            text: "Remove Order",
            onClick: async () => {
              if (currentTable?.tables) {
                onRemoveOrder(currentTable.tables);
              }
            },
          },
        ],
      });
    }
  }, [currentTable, onRemoveOrder, showDialog])

  return (
    <Button
       size={"sm"}
      variant={"destructive"}
      className="w-full text-sm font-semibold"
      onClick={handleDeleteOrder}
      disabled={disabledDelete}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
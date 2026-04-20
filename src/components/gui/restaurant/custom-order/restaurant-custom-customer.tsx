import { useMutationCustomerOrder } from "@/app/hooks/use-query-order";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MaterialInput } from "@/components/ui/material-input";
import { table_restaurant_tables } from "@/generated/tables";
import { useCallback, useState } from "react";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";

export const restartCustomCustomer = createDialog<
  {
    customer: number;
    table?: table_restaurant_tables;
    id?: string;
  },
  unknown
>(
  ({ customer, table, id, close }) => {
    const [customerCount, setCustomerCount] = useState(customer || 0);
    const action = useRestaurantActions();
    const { trigger, isMutating } = useMutationCustomerOrder(id || "");

    const handleSave = useCallback(async () => {
      if (table) {
        trigger({
          customer: customerCount,
        }).then((res) => {
          if (res.success) {
            action.setCustomerCount(table, customerCount);
            close(true);
          }
        });
      }
    }, [table, trigger, customerCount, action, close]);

    return (
      <>
        <DialogHeader>
          <DialogTitle>Customer</DialogTitle>
        </DialogHeader>
        <div>
          <MaterialInput
            label="Customer Count"
            type="number"
            step={1}
            min={0}
            value={customerCount}
            onChange={(e) => {
              setCustomerCount(Number(e.target.value));
            }}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isMutating}>
            {isMutating ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </>
    );
  },
  { defaultValue: undefined }
);

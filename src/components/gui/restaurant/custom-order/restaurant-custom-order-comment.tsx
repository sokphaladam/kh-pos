import {
  useMutationAddOrderModifier,
  useMutationCustomOrderModifier,
} from "@/app/hooks/use-query-order-modifier";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialInput } from "@/components/ui/material-input";
import { Textarea } from "@/components/ui/textarea";
import { OrderModifierType } from "@/dataloader/order-modifier-loader";
import { produce } from "immer";
import { useCallback } from "react";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";
import { table_restaurant_tables } from "@/generated/tables";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

export function RestaurantCustomOrderComment({
  notes,
  setNotes,
  orderId,
  orderDetailId,
  table,
}: {
  notes: OrderModifierType;
  setNotes: (value: OrderModifierType) => void;
  orderId: string;
  orderDetailId: string;
  table?: table_restaurant_tables;
}) {
  const { getSymbol } = useCurrencyFormat();
  const { updateNotes } = useRestaurantActions();
  const { trigger: triggerCustomOrderModifier, isMutating: isCustoming } =
    useMutationCustomOrderModifier(orderId);
  const { trigger: triggerAddOrderModifier, isMutating: isAdding } =
    useMutationAddOrderModifier(orderId);

  const handleApplyNotes = useCallback(() => {
    if (notes.modifierItemId === "") {
      triggerAddOrderModifier({
        modifierItemId: "notes",
        orderDetailId,
        notes: notes.notes,
        price: notes.price || 0,
      }).then((res) => {
        if (res.success && table) {
          updateNotes(table, orderDetailId, {
            ...notes,
            modifierItemId: "notes",
          });
        }
      });
    }

    if (notes.modifierItemId === "notes") {
      triggerCustomOrderModifier({
        modifierItemId: "notes",
        orderDetailId,
        notes: notes.notes,
        price: notes.price || 0,
      }).then((res) => {
        if (res.success && table) {
          updateNotes(table, orderDetailId, notes);
        }
      });
    }
  }, [
    notes,
    orderDetailId,
    triggerCustomOrderModifier,
    updateNotes,
    table,
    triggerAddOrderModifier,
  ]);

  return (
    <Card className="border-border">
      <CardHeader className="pb-2 pt-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium">
              Special Instructions
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Dietary restrictions or special requests
            </p>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <div className="relative">
              <span className="text-base absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                {getSymbol()}
              </span>
              <MaterialInput
                label="Extra Charge"
                placeholder="0.00"
                type="number"
                value={notes.price}
                onChange={(e) => {
                  setNotes(
                    produce(notes, (draft) => {
                      draft.price = Number(e.target.value);
                    })
                  );
                }}
                className="pl-8 text-xs h-8"
                step={0.01}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <Textarea
          placeholder="e.g., No onions, extra spicy, gluten-free..."
          className="resize-none text-xs min-h-[60px] border-input focus:border-primary"
          value={notes.notes}
          onChange={(e) =>
            setNotes(
              produce(notes, (draft) => {
                draft.notes = e.target.value;
              })
            )
          }
          disabled={isCustoming || isAdding}
        />
        <Button
          onClick={handleApplyNotes}
          disabled={isCustoming || isAdding}
          className="w-full h-7 text-xs"
          size="sm"
        >
          {isCustoming || isAdding ? "Applying..." : "Apply Notes"}
        </Button>
      </CardContent>
    </Card>
  );
}

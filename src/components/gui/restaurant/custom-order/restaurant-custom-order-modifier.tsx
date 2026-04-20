import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectProductItem } from "./restaurant-custom-order";
import { CheckCircle } from "lucide-react";
import {
  useMutationAddOrderModifier,
  useMutationDeleteOrderModifier,
} from "@/app/hooks/use-query-order-modifier";
import { useCallback } from "react";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";
import { table_restaurant_tables } from "@/generated/tables";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

export function RestaurantCustomOrderModifier({
  product,
  selectedModifiers,
  setSelectedModifiers,
  orderDetailId,
  orderId,
  table,
}: {
  product: SelectProductItem;
  selectedModifiers: string[];
  setSelectedModifiers: (itemId: string[]) => void;
  orderDetailId: string;
  orderId: string;
  table?: table_restaurant_tables;
}) {
  const { formatForDisplay } = useCurrencyFormat();
  const { addModifier, removeModifier } = useRestaurantActions();
  const { trigger: triggerAdd, isMutating: isAdding } =
    useMutationAddOrderModifier(orderId);
  const { trigger: triggerDelete, isMutating: isDeleting } =
    useMutationDeleteOrderModifier(orderId);

  const handleModifierToggle = useCallback(
    async (itemId: string, price: number) => {
      const isCurrentlySelected = selectedModifiers.includes(itemId);

      try {
        if (isCurrentlySelected) {
          const res = await triggerDelete({
            orderDetailId: orderDetailId,
            modifierItemId: itemId,
          });

          if (res.result && table) {
            setSelectedModifiers(
              selectedModifiers.filter((id) => id !== itemId)
            );
            removeModifier(table, orderDetailId, itemId);
          }
        } else {
          const res = await triggerAdd({
            modifierItemId: itemId,
            orderDetailId: orderDetailId,
            price: price,
          });

          if (res.result) {
            const modifierItem = product.modifiers
              ?.flatMap((m) => m.items)
              .find((f) => f?.id === itemId);
            setSelectedModifiers([...selectedModifiers, itemId]);
            if (modifierItem && table) {
              addModifier(table, orderDetailId, modifierItem);
            }
          }
        }
      } catch (error) {
        console.error("Error toggling modifier:", error);
      }
    },
    [
      selectedModifiers,
      setSelectedModifiers,
      orderDetailId,
      triggerAdd,
      triggerDelete,
      addModifier,
      removeModifier,
      product,
      table,
    ]
  );

  const loading = isAdding || isDeleting;

  return (
    <>
      {((product.modifiers && product.modifiers?.length) || 0) > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-medium">
              Customize Your Order
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Select additional options
            </p>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {product.modifiers?.map((modifier) => (
              <div key={modifier.modifierId} className="space-y-2">
                <div className="border-l-2 border-primary/30 pl-2">
                  <h4 className="font-medium text-xs text-foreground">
                    {modifier.title}
                  </h4>
                  {modifier.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {modifier.description}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                  {modifier.items &&
                    modifier.items.map((item) => {
                      const isSelected =
                        selectedModifiers.includes(item.id) || false;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-2 rounded border-2 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30 hover:bg-muted/50"
                          }`}
                          onClick={() => {
                            if (!loading) {
                              handleModifierToggle(item.id, Number(item.price));
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-border"
                              } ${loading ? "blur-md" : ""}`}
                            >
                              {isSelected && (
                                <CheckCircle className="w-2.5 h-2.5 text-white" />
                              )}
                            </div>
                            <span className="text-xs font-medium text-foreground truncate">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-primary flex-shrink-0">
                            {Number(item?.price) > 0
                              ? `+${formatForDisplay(item.price || 0)}`
                              : "Free"}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}

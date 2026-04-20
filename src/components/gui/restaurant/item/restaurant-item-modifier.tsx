import { OrderModifierType } from "@/dataloader/order-modifier-loader";
import { ProductModifierType } from "@/dataloader/product-variant-loader";
import { RestaurantItemNote } from "./restaurant-item-note";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

export function RestaurantItemModifier({
  modifiers,
  orderModifier,
  notes,
  orderedQty,
}: {
  orderModifier?: OrderModifierType[];
  modifiers?: ProductModifierType[];
  notes?: OrderModifierType;
  orderedQty?: number;
}) {
  const { formatForDisplay } = useCurrencyFormat();
  return (
    <div className="mt-2 bg-slate-50/50 rounded-md border border-slate-200/60">
      <div className="px-2.5 py-1.5 border-b border-slate-200/60 bg-slate-100/70 rounded-t-md">
        <h4 className="text-xs font-medium text-slate-600 uppercase tracking-wide">
          Add-ons
        </h4>
      </div>
      <div className="p-2">
        <div className="space-y-1">
          {orderModifier?.map((x, i) => {
            const modifier = modifiers
              ?.flatMap((m) => m.items)
              .find((f) => f?.id === x.modifierItemId);

            if (!modifier) return null;

            return (
              <div
                key={i}
                className="flex items-center justify-between py-1 px-2 bg-white/80 rounded border border-slate-100 hover:bg-white hover:border-slate-200 transition-all duration-150"
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-slate-700 font-medium truncate">
                    {modifier.name}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 ml-2 flex-shrink-0">
                  {modifier.price && Number(modifier.price) > 0
                    ? `+${formatForDisplay(
                        Number(modifier.price) * (orderedQty || 1)
                      )} `
                    : "Free"}
                </div>
              </div>
            );
          })}
          <RestaurantItemNote
            note={
              {
                ...notes,
                price: Number(notes?.price || 0) * (orderedQty || 1),
              } as OrderModifierType
            }
          />
        </div>
      </div>
    </div>
  );
}

import { OrderModifierType } from "@/dataloader/order-modifier-loader";
import { ProductModifierType } from "@/dataloader/product-variant-loader";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface OrderDetailModifiersProps {
  orderModifiers: OrderModifierType[];
  quantity: number;
  productModifiers?: ProductModifierType[];
}

export function OrderDetailModifiers({
  orderModifiers,
  quantity,
  productModifiers,
}: OrderDetailModifiersProps) {
  const { formatForDisplay } = useCurrencyFormat();

  if (!orderModifiers || orderModifiers.length === 0) {
    return null;
  }

  return (
    <div className="bg-muted/50 rounded-md border border-border/60">
      <div className="px-2.5 py-1.5 border-b border-border/60 bg-muted/70 rounded-t-md">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Add-ons
        </h4>
      </div>
      <div className="p-2">
        <div className="space-y-1">
          {orderModifiers.map((modifier, index) => (
            <OrderModifierItem
              key={index}
              modifier={modifier}
              quantity={quantity}
              formatForDisplay={formatForDisplay}
              productModifiers={productModifiers}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface OrderModifierItemProps {
  modifier: OrderModifierType;
  quantity: number;
  formatForDisplay: (amount: number) => string;
  productModifiers?: ProductModifierType[];
}

function OrderModifierItem({
  modifier,
  quantity,
  formatForDisplay,
  productModifiers,
}: OrderModifierItemProps) {
  // Handle notes/custom modifiers
  if (modifier.modifierItemId === "notes") {
    return modifier.notes ? (
      <div className="flex items-center justify-between py-1 px-2 bg-card/80 rounded border border-border hover:bg-card hover:border-border transition-all duration-150">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-1.5 h-1.5 bg-info rounded-full flex-shrink-0"></div>
          <span className="text-xs text-foreground/80 font-medium truncate">
            Note: {modifier.notes}
          </span>
        </div>
        <div className="text-xs font-semibold text-foreground ml-2 flex-shrink-0">
          {modifier.price && Number(modifier.price) > 0
            ? `+${formatForDisplay(Number(modifier.price) * quantity)}`
            : ""}
        </div>
      </div>
    ) : null;
  }

  // Find the modifier item name from product modifiers
  const modifierItem = productModifiers
    ?.flatMap((mod) => mod.items || [])
    .find((item) => item.id === modifier.modifierItemId);

  // Use the modifier item name or a fallback
  let displayName: string;
  if (modifierItem?.name) {
    displayName = modifierItem.name;
  } else {
    // If modifier not found in product modifiers, show a generic name
    displayName = `Add-on Item`;
  }

  const displayPrice = modifier.price ? Number(modifier.price) * quantity : 0;

  return (
    <div className="flex items-center justify-between py-1 px-2 bg-card/80 rounded border border-border hover:bg-card hover:border-border transition-all duration-150">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <div className="w-1.5 h-1.5 bg-success rounded-full flex-shrink-0"></div>
        <span className="text-xs text-foreground/80 font-medium truncate">
          {displayName}
        </span>
        {!modifierItem && (
          <span className="text-xs text-muted-foreground/70 ml-1">(unavailable)</span>
        )}
      </div>
      <div className="text-xs font-semibold text-foreground ml-2 flex-shrink-0">
        {displayPrice > 0 ? `+${formatForDisplay(displayPrice)}` : "Free"}
      </div>
    </div>
  );
}

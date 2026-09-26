import { OrderModifierType } from "@/dataloader/order-modifier-loader";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

export function RestaurantItemNote({ note }: { note?: OrderModifierType }) {
  const { formatForDisplay } = useCurrencyFormat();
  if (!note) return null;
  if (!note.notes) return null;

  return (
    <div className="flex items-center justify-between py-1 px-2 bg-card/80 rounded border border-border hover:bg-card hover:border-border transition-all duration-150">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <div className="w-1.5 h-1.5 bg-warning rounded-full flex-shrink-0"></div>
        <span className="text-xs text-foreground/80 font-medium truncate">
          {note.notes}
        </span>
      </div>
      <div className="text-xs font-semibold text-foreground ml-2 flex-shrink-0">
        {note.price && Number(note.price) > 0
          ? `+${formatForDisplay(note.price)}`
          : "Free"}
      </div>
    </div>
  );
}

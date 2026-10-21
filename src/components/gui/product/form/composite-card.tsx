import SearchProductPicker from "@/components/search-product-picker";
import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Minus, PackageOpen, Plus, X } from "lucide-react";

interface CompositeComponent {
  id?: string;
  variantId: string;
  quantity: number;
  image?: string;
  title?: string;
}

interface CompositeCardProps {
  variant: CompositeComponent[];
  onAddComponent: (item: ProductSearchResult, qty: number) => void;
  onRemoveComponent: (compIdx: number) => void;
}

export function CompositeCard({
  variant,
  onAddComponent,
  onRemoveComponent,
}: CompositeCardProps) {
  // Ensure compositeVariants is always an array
  const compositeVariants: CompositeComponent[] = Array.isArray(variant)
    ? variant
    : [];

  const setQty = (comp: CompositeComponent, qty: number) =>
    onAddComponent(
      {
        variantId: comp.variantId,
        image: comp.image,
        title: comp.title,
      } as unknown as ProductSearchResult,
      Math.max(1, qty),
    );

  return (
    <div className="rounded-lg border border-info/30 bg-info/5">
      <div className="p-3 border-b border-info/20">
        <SearchProductPicker
          clearInput
          onChange={(item: ProductSearchResult) => {
            if (item) {
              onAddComponent(item, 1); // Default qty to 1 when adding
            }
          }}
          includeProductNotForSale
        />
      </div>

      {compositeVariants.length === 0 ? (
        <div className="flex flex-col items-center gap-1 px-3 py-6 text-center text-xs text-muted-foreground">
          <PackageOpen className="h-5 w-5" />
          No items yet. Search above to add the stock items this variant uses.
        </div>
      ) : (
        <ul className="divide-y divide-info/15">
          <li className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Item</span>
            <span className="w-[132px] text-center">Qty per 1 sold</span>
            <span className="w-7" />
          </li>
          {compositeVariants.map((comp, i) => (
            <li
              key={comp.id || comp.variantId || i}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-card">
                  <ImageWithFallback
                    src={comp.image}
                    alt={comp.title || comp.variantId}
                    title={comp.title || comp.variantId}
                    className="max-w-full max-h-full object-contain w-auto h-auto p-0.5"
                  />
                </div>
                <span className="truncate text-sm">
                  {comp.title || comp.variantId}
                </span>
              </div>
              <div className="flex w-[132px] items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Decrease quantity"
                  onClick={() => setQty(comp, comp.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <input
                  type="number"
                  min={1}
                  value={comp.quantity}
                  onChange={(e) => setQty(comp, Number(e.target.value))}
                  className="h-8 w-14 rounded-md border border-input bg-background px-1 text-center text-sm"
                  aria-label="Quantity per 1 sold"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Increase quantity"
                  onClick={() => setQty(comp, comp.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onRemoveComponent(i)}
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

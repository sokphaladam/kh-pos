import { createSheet } from "@/components/create-sheet";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCallback, useMemo, useState } from "react";
import { ProductV2 } from "@/classes/product-v2";
import {
  useMutationAddBindProduct,
  useMutationRemoveBindProduct,
  useQueryModifierBindProduct,
} from "@/app/hooks/use-query-modifier";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/state";
import { BasicProductType } from "@/dataloader/basic-product-loader";
import { ProductImage } from "@/repository/product-image-repository";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ImageIcon, Loader2, PackageOpen, Search, X } from "lucide-react";
import { ProductSearchPicker } from "../product/product-search-picker";

interface BoundProduct {
  product: BasicProductType;
  images: ProductImage[];
  variants: ProductVariantType[];
}

export const bindProductModifier = createSheet<{ id: string }>(({ id }) => {
  const { data, isLoading, mutate } = useQueryModifierBindProduct(id);
  const { trigger: triggerAdd } = useMutationAddBindProduct(id);
  const { trigger: triggerRemove } = useMutationRemoveBindProduct(id);
  const [adding, setAdding] = useState<string[]>([]);
  const [removing, setRemoving] = useState<string[]>([]);
  const [filter, setFilter] = useState("");

  const products: ProductV2[] = useMemo(
    () =>
      ((data?.result as BoundProduct[] | undefined) ?? []).map((x) => ({
        id: x.product.id,
        title: x.product.title,
        description: x.product.description,
        productImages: x.images,
        productVariants: x.variants,
        productCategories: [],
      })),
    [data],
  );

  const boundIds = useMemo(
    () => [...products.map((p) => p.id), ...adding],
    [products, adding],
  );

  const visible = useMemo(() => {
    const words = filter.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return products;
    return products.filter((p) => {
      const haystack = [
        p.title,
        ...p.productVariants.flatMap((v) => [v.name, v.sku, v.barcode]),
      ]
        .map((s) => String(s ?? "").toLowerCase())
        .join(" ");
      return words.every((w) => haystack.includes(w));
    });
  }, [products, filter]);

  const onSelectProduct = useCallback(
    async (item: ProductV2) => {
      if (boundIds.includes(item.id)) {
        toast.info(`${item.title} already has this modifier.`);
        return;
      }
      setAdding((prev) => [...prev, item.id]);
      try {
        const res = await triggerAdd({ productId: item.id });
        if (!res?.success) throw new Error();
        await mutate();
        toast.success(`Applied to ${item.title}`);
      } catch {
        toast.error(`Couldn't apply the modifier to ${item.title}.`);
      } finally {
        setAdding((prev) => prev.filter((x) => x !== item.id));
      }
    },
    [boundIds, triggerAdd, mutate],
  );

  const onRemove = useCallback(
    async (item: ProductV2) => {
      setRemoving((prev) => [...prev, item.id]);
      try {
        const res = await triggerRemove({ productId: item.id });
        if (!res?.success) throw new Error();
        await mutate();
        toast.success(`Removed from ${item.title}`);
      } catch {
        toast.error(`Couldn't remove ${item.title}.`);
      } finally {
        setRemoving((prev) => prev.filter((x) => x !== item.id));
      }
    },
    [triggerRemove, mutate],
  );

  return (
    <>
      <SheetHeader>
        <SheetTitle>Apply Modifier to Products</SheetTitle>
        <SheetDescription>
          The modifier is offered on every variant of the products below.
        </SheetDescription>
      </SheetHeader>
      <div className="my-4 space-y-4">
        <ProductSearchPicker
          selectedIds={boundIds}
          onChange={onSelectProduct}
          disabled={isLoading}
        />

        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium">
            Applied products
            <span className="ml-1.5 text-muted-foreground">
              ({products.length})
            </span>
          </h3>
          {adding.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding…
            </span>
          )}
        </div>

        {products.length > 5 && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter applied products…"
              className="h-9 pl-8"
            />
          </div>
        )}

        {isLoading ? (
          <LoadingState label="Loading products" />
        ) : products.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="Not applied to any product yet"
            description="Search above to pick the products that should offer this modifier."
          />
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No applied product matches &ldquo;{filter}&rdquo;.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {visible.map((item) => (
              <BoundProductRow
                key={item.id}
                item={item}
                removing={removing.includes(item.id)}
                onRemove={onRemove}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
});

function BoundProductRow({
  item,
  removing,
  onRemove,
}: {
  item: ProductV2;
  removing: boolean;
  onRemove: (item: ProductV2) => void;
}) {
  const image = item.productImages?.[0];
  const variants = item.productVariants ?? [];
  const shown = variants.slice(0, 4);

  return (
    <li
      className={cn(
        "flex items-center gap-3 px-3 py-2.5",
        removing && "opacity-50",
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
        {image ? (
          <ImageWithFallback
            src={image.url}
            alt={item.title || ""}
            title={item.title || ""}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-4 w-4 text-muted-foreground/60" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {item.title || "Untitled"}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {shown.map((v) => (
            <Badge
              key={v.id}
              variant="outline"
              className="rounded-full px-2 py-0 text-[11px] font-normal"
            >
              {v.name}
              {v.price !== null && (
                <span className="ml-1 text-muted-foreground">
                  ${Number(v.price).toFixed(2)}
                </span>
              )}
            </Badge>
          ))}
          {variants.length > shown.length && (
            <span className="text-[11px] text-muted-foreground">
              +{variants.length - shown.length} more
            </span>
          )}
        </div>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={`Remove ${item.title}`}
        disabled={removing}
        onClick={() => onRemove(item)}
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
      >
        {removing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
      </Button>
    </li>
  );
}

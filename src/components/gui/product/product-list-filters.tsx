"use client";

import type {
  ProductSaleStatusFilter,
  ProductStockStatusFilter,
  ProductTypeFilter,
} from "@/lib/product-list-filters";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ProductSupplierFilter } from "./product-supplier-filter";

const ALL = "all";

type FilterKey = "saleStatus" | "productType" | "stockStatus";

const FILTERS: {
  key: FilterKey;
  label: string;
  options: { value: string; label: string }[];
}[] = [
  {
    key: "saleStatus",
    label: "Sale status",
    options: [
      { value: "for_sale", label: "For sale" },
      { value: "not_for_sale", label: "Not for sale" },
    ] satisfies { value: ProductSaleStatusFilter; label: string }[],
  },
  {
    key: "productType",
    label: "Type",
    options: [
      { value: "standard", label: "Standard" },
      { value: "composite", label: "Composite (all)" },
      { value: "made_to_order", label: "Composite · made to order" },
      { value: "pre_produced", label: "Composite · pre-produced" },
    ] satisfies { value: ProductTypeFilter; label: string }[],
  },
  {
    key: "stockStatus",
    label: "Stock",
    options: [
      { value: "low", label: "Low stock" },
      { value: "out", label: "Out of stock" },
      { value: "not_tracked", label: "Stock not tracked" },
    ] satisfies { value: ProductStockStatusFilter; label: string }[],
  },
];

/** Every query param the product list filters on (search excluded). */
export const PRODUCT_LIST_FILTER_PARAMS = [
  "categoryId",
  "supplierId",
  ...FILTERS.map((f) => f.key),
] as const;

export function ProductListFilters() {
  const { push } = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(search.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("offset");
      push(`${pathname}?${params.toString()}`);
    },
    [search, push, pathname],
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(search.toString());
    PRODUCT_LIST_FILTER_PARAMS.forEach((key) => params.delete(key));
    params.delete("offset");
    push(`${pathname}?${params.toString()}`);
  }, [search, push, pathname]);

  const activeChips = FILTERS.flatMap((filter) => {
    const value = search.get(filter.key);
    const option = filter.options.find((o) => o.value === value);
    return option ? [{ key: filter.key, label: option.label }] : [];
  });
  const activeCount =
    activeChips.length +
    (search.get("categoryId") ? 1 : 0) +
    (search.get("supplierId") ? 1 : 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => {
          const value = search.get(filter.key) || ALL;
          return (
            <Select
              key={filter.key}
              value={value}
              onValueChange={(v) => setParam(filter.key, v === ALL ? null : v)}
            >
              <SelectTrigger
                aria-label={filter.label}
                className={cn(
                  "h-8 w-auto min-w-[150px] gap-2 text-xs",
                  value !== ALL && "border-primary/60 bg-primary/5",
                )}
              >
                <span className="text-muted-foreground">{filter.label}:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className="text-xs">
                  All
                </SelectItem>
                {filter.options.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
        <ProductSupplierFilter showClear={false} />
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={clearAll}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear filters ({activeCount})
          </Button>
        )}
      </div>
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setParam(chip.key, null)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

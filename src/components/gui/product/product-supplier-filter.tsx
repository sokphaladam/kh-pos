"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SupplierPicker from "@/components/supplier-picker";
import { Supplier } from "@/lib/server-functions/supplier";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ProductCategoryPicker } from "./form/product-cateory";
import { Category } from "@/lib/server-functions/category/create-category";

interface Props {
  variant?: "default" | "standard";
  className?: string;
}

export function ProductSupplierFilter({ variant, className }: Props) {
  const { push } = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const supplierId = search.get("supplierId");
  const categoryId = search.get("categoryId");

  const onSupplierChange = useCallback(
    (supplier: Supplier | null) => {
      const params = new URLSearchParams(search.toString());
      if (!supplier) {
        params.delete("supplierId");
      } else {
        params.set("supplierId", supplier.id);
      }
      params.delete("offset"); // Reset pagination when filtering
      push(`${pathname}?${params.toString()}`);
    },
    [search, push, pathname],
  );

  const onCategoryChange = useCallback(
    (category: Category | null) => {
      const params = new URLSearchParams(search.toString());
      if (!category) {
        params.delete("categoryId");
      } else {
        params.set("categoryId", category.id);
      }
      params.delete("offset"); // Reset pagination when filtering
      push(`${pathname}?${params.toString()}`);
    },
    [search, push, pathname],
  );

  const onClearFilter = useCallback(() => {
    const params = new URLSearchParams(search.toString());
    params.delete("supplierId");
    params.delete("categoryId");
    params.delete("offset"); // Reset pagination when clearing filter
    push(`${pathname}?${params.toString()}`);
  }, [search, push, pathname]);

  return (
    <div className="flex flex-row items-center gap-2">
      <div>
        <ProductCategoryPicker
          allowCreateNew={false}
          value={categoryId || undefined}
          onChange={onCategoryChange}
        />
      </div>
      <div>
        <SupplierPicker
          value={supplierId || undefined}
          onChange={onSupplierChange}
          variant={variant}
          className={className}
        />
      </div>
      {(supplierId || categoryId) && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilter}
          className="h-8 w-8 p-0"
          title="Clear supplier filter"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

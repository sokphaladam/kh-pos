"use client";
import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { useQuerySupplierProductPrice } from "@/app/hooks/use-query-supplier-product-price";
import SearchProductPicker from "@/components/search-product-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MaterialInput } from "@/components/ui/material-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus, RefreshCcw, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useState } from "react";
import { ProductSupplierFilter } from "../product/product-supplier-filter";
import { createSupplierProductPriceSheet } from "./sheet-supplier-product-price-create";
import { SupplierProductPriceList } from "./supplier-product-price-list";

export function LayoutProductPrice() {
  const search = useSearchParams();
  const { push } = useRouter();
  const pathname = usePathname();
  const limit = 30;
  const offset = Number(search.get("offset") || 0);
  const supplierId = search.get("supplierId") || undefined;
  const productVariantId = search.get("productVariantId") || undefined;
  const productTitle = search.get("productTitle") || undefined;
  const searchParam = search.get("search") || undefined;
  const orderByPrice = (search.get("orderByPrice") as "asc" | "desc") || "asc";

  const [searchInput, setSearchInput] = useState(searchParam || "");

  const { data, isLoading, mutate, isValidating } =
    useQuerySupplierProductPrice(
      limit,
      offset,
      {
        orderByPrice,
        supplierId: supplierId || undefined,
        productVariantId: productVariantId || undefined,
      },
      searchParam || undefined,
    );

  const onAddNew = useCallback(async () => {
    const res = await createSupplierProductPriceSheet.show({
      data: [],
      edit: undefined,
    });

    if (res) {
      mutate();
    }
  }, [mutate]);

  const onOrderByPriceChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(search.toString());
      params.set("orderByPrice", value);
      params.delete("offset"); // Reset pagination when changing order
      push(`${pathname}?${params.toString()}`);
    },
    [search, push, pathname],
  );

  const onChangeSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
      if (!e.target.value) {
        const params = new URLSearchParams(search.toString());
        params.delete("search");
        push(`${pathname}?${params.toString()}`);
      }
    },
    [pathname, push, search],
  );

  const onBlurSearchInput = useCallback(
    (e: React.FocusEvent<HTMLInputElement, Element>) => {
      e.preventDefault();
      const params = new URLSearchParams(search.toString());
      if (searchInput) {
        params.set("search", searchInput);
      }
      push(`${pathname}?${params.toString()}`);
    },
    [pathname, push, search, searchInput],
  );

  const onKeyDownSearchInput = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const params = new URLSearchParams(search.toString());
        if (searchInput) {
          params.delete("offset");
          params.set("search", searchInput);
        }
        push(`${pathname}?${params.toString()}`);
      }
    },
    [pathname, push, search, searchInput],
  );

  const onClearSearch = useCallback(() => {
    const params = new URLSearchParams(search.toString());
    params.delete("offset");
    params.delete("search");
    setSearchInput("");
    push(`${pathname}?${params.toString()}`);
  }, [pathname, push, search]);

  const onSelectProduct = useCallback(
    (value: ProductSearchResult) => {
      if (value) {
        const params = new URLSearchParams(search.toString());
        params.set("productVariantId", value.variantId);
        params.set("productTitle", value.productTitle);
        push(`${pathname}?${params.toString()}`);
      }
    },
    [pathname, push, search],
  );

  const onReset = useCallback(() => {
    const params = new URLSearchParams(search.toString());
    params.delete("productVariantId");
    params.delete("productTitle");
    params.delete("supplierId");
    params.delete("search");
    params.delete("offset");
    push(`${pathname}?${params.toString()}`);
    setSearchInput("");
    mutate();
  }, [pathname, push, search, mutate]);

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Supplier Product Price
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your supplier product price and view their performance.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant={"outline"} onClick={onReset}>
            <RefreshCcw
              className={cn(
                "h-4 w-4 shrink-1",
                isLoading || isValidating ? "animate-spin" : "",
              )}
            />
            Reset
          </Button>
          <Button size="sm" onClick={onAddNew} className="btn-outline">
            <Plus className="h-4 w-4 shrink-1" />
            Add Product Price
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center flex-wrap">
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div className="w-[400px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <MaterialInput
                  value={searchInput || ""}
                  label="Search by supplier or product..."
                  onChange={onChangeSearchInput}
                  onBlur={onBlurSearchInput}
                  onKeyDown={onKeyDownSearchInput}
                  variant="standard"
                  className="pl-10 pr-10 w-full"
                />
                {searchInput && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div>
                <ProductSupplierFilter
                  variant="standard"
                  className="min-w-[320px]"
                />
              </div>
              <div className="min-w-[350px]">
                <SearchProductPicker
                  onChange={onSelectProduct}
                  variant="standard"
                  label="Product"
                  value={productTitle}
                  includeProductNotForSale
                />
              </div>
            </div>
            <div className="flex flex-row items-center gap-2">
              <Select value={orderByPrice} onValueChange={onOrderByPriceChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Order by price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Price: Low to High</SelectItem>
                  <SelectItem value="desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {!isLoading && !isValidating && (
        <div>
          <SupplierProductPriceList
            limit={limit}
            offset={offset}
            data={data?.result?.data || []}
            total={data?.result?.total || 0}
            onDelete={(v) => v && mutate()}
            onEdit={(v) => v && mutate()}
          />
        </div>
      )}
    </div>
  );
}

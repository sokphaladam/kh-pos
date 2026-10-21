"use client";

import { products } from "@/app/storybook/product";
import { ProductsTable } from "@/components/product/product-table";
import { useCallback, useMemo } from "react";
import { SearchModeToolbar } from "@/components/search-mode-toolbar";
import { useProductList } from "@/app/hooks/use-query-product";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { ProductListSkeleton } from "@/components/product-list-skeleton";
import { ProductListFilters } from "./product-list-filters";
import { Button } from "@/components/ui/button";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import type { ProductFilterProps } from "@/classes/product-v2";
import {
  PRODUCT_SALE_STATUS_FILTERS,
  PRODUCT_STOCK_STATUS_FILTERS,
  PRODUCT_TYPE_FILTERS,
} from "@/lib/product-list-filters";
import { ProductUploadExcel } from "./product-upload-excel";

export function LayoutProduct(props: WithLayoutPermissionProps) {
  const { currentWarehouse } = useAuthentication();
  const { push } = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const offset = Number(search.get("offset") || 0);
  const searchProduct = search.get("s");
  const supplierId = search.get("supplierId");
  const barcode = search.get("barcode");
  const categoryId = search.get("categoryId");
  const saleStatus = pickOption(
    search.get("saleStatus"),
    PRODUCT_SALE_STATUS_FILTERS,
  );
  const productType = pickOption(search.get("productType"), PRODUCT_TYPE_FILTERS);
  const stockStatus = pickOption(
    search.get("stockStatus"),
    PRODUCT_STOCK_STATUS_FILTERS,
  );

  const filter = useMemo(() => {
    const param: ProductFilterProps = {
      limit: 30,
      offset,
      id: "",
    };

    if (searchProduct && searchProduct.length > 3) {
      param.searchTitle = searchProduct;
      param.offset = 0;
    }

    if (supplierId) {
      param.supplierId = supplierId;
    }
    if (barcode) {
      param.barcode = barcode;
    }
    if (categoryId) {
      param.categoryId = categoryId;
    }
    param.saleStatus = saleStatus;
    param.productType = productType;
    param.stockStatus = stockStatus;

    return param;
  }, [
    barcode,
    offset,
    searchProduct,
    supplierId,
    categoryId,
    saleStatus,
    productType,
    stockStatus,
  ]);

  const { data, isLoading, mutate, isValidating } = useProductList(filter);

  const onClickAdd = useCallback(() => {
    if (!currentWarehouse?.isMain) {
      return;
    }
    push(`${pathname}/create`);
  }, [pathname, currentWarehouse, push]);

  const headerRight = useMemo(() => {
    return (
      <div className="flex flex-row items-center gap-2">
        {currentWarehouse?.isMain && (
          <Button
            size="sm"
            onClick={onClickAdd}
            className="btn-outline"
            disabled={!props.allowCreate}
          >
            Add Product
          </Button>
        )}
        {currentWarehouse?.isMain && <ProductUploadExcel />}
      </div>
    );
  }, [onClickAdd, props.allowCreate, currentWarehouse?.isMain]);

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <SearchModeToolbar
        text="Product"
        data={products}
        searchEnabled
        headerRight={headerRight}
      />
      <ProductListFilters />
      <div>
        {isLoading || isValidating ? (
          <ProductListSkeleton />
        ) : (
          <ProductsTable
            products={data?.result?.data || []}
            offset={offset}
            totalProducts={data?.result?.total || 0}
            onDelete={() => mutate()}
            onCompleted={() => mutate()}
          />
        )}
      </div>
    </div>
  );
}

function pickOption<T extends string>(
  value: string | null,
  options: readonly T[],
): T | undefined {
  return options.find((o) => o === value);
}

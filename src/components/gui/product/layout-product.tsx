"use client";

import { products } from "@/app/storybook/product";
import { ProductsTable } from "@/components/product/product-table";
import { useCallback, useMemo } from "react";
import { SearchModeToolbar } from "@/components/search-mode-toolbar";
import { useProductList } from "@/app/hooks/use-query-product";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { ProductListSkeleton } from "@/components/product-list-skeleton";
import { ProductSupplierFilter } from "./product-supplier-filter";
import { Button } from "@/components/ui/button";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { ProductFilterProps } from "@/classes/product-v2";
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

    return param;
  }, [barcode, offset, searchProduct, supplierId, categoryId]);

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
        <ProductSupplierFilter />
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
